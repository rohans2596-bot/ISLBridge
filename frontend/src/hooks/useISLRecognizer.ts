import { useState, useRef, useEffect, useCallback } from 'react';
import { PredictionResult, HandData } from '../types/isl';
import { MediaPipeHandsService } from '../services/mediapipe';
import { RealtimeWebSocketService } from '../services/websocket';
import { ApiService } from '../services/api';
import { TAMIL_MAP, SIGN_SENTENCES_MAP } from '../utils/tamilTranslations';

export interface RecognizerState {
  currentPrediction: PredictionResult | null;
  accumulatedSigns: string[];
  englishSentence: string;
  tamilSentence: string;
  isTranslating: boolean;
  handDetected: boolean;
  handsCount: number;
  activePipelineStage: number;
  mode: 'realtime' | 'rest';
  sessionStartTime: number | null;
  totalPredictionsCount: number;
  averageConfidence: number;
  handDistanceCm: number | null;
  handDistanceStatus: 'optimal' | 'close' | 'far' | null;
  interHandDistanceCm: number | null;
}

// --- Client-side rolling vote buffer ---
// Only updates the displayed sign when a candidate has >= VOTE_MAJORITY votes
// AND its average confidence >= DISPLAY_CONF_FLOOR.
const VOTE_WINDOW = 8;
const VOTE_MAJORITY = 5;
const DISPLAY_CONF_FLOOR = 0.40;

export function useISLRecognizer(options?: {
  confidenceThreshold?: number;
  cooldownMs?: number;
  useWebSocket?: boolean;
}) {
  const confidenceThreshold = options?.confidenceThreshold ?? 0.40;
  const cooldownMs = options?.cooldownMs ?? 600;
  const useWebSocket = options?.useWebSocket ?? true;

  const [state, setState] = useState<RecognizerState>({
    currentPrediction: null,
    accumulatedSigns: [],
    englishSentence: '',
    tamilSentence: '',
    isTranslating: false,
    handDetected: false,
    handsCount: 0,
    activePipelineStage: 0,
    mode: useWebSocket ? 'realtime' : 'rest',
    sessionStartTime: null,
    totalPredictionsCount: 0,
    averageConfidence: 0,
    handDistanceCm: null,
    handDistanceStatus: null,
    interHandDistanceCm: null,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mpServiceRef = useRef<MediaPipeHandsService | null>(null);
  const wsServiceRef = useRef<RealtimeWebSocketService | null>(null);

  const lastInferenceTimeRef = useRef<number>(0);
  const lastAddedSignRef = useRef<string | null>(null);
  const lastSignAddedTimeRef = useRef<number>(0);

  const candidateSignRef = useRef<string | null>(null);
  const candidateCountRef = useRef<number>(0);

  // Vote buffer & sign latching for DISPLAY stabilization
  const voteBufferRef = useRef<Array<{ sign: string; confidence: number }>>([]);
  const lockedDisplaySignRef = useRef<string | null>(null);
  const lockedDisplayConfRef = useRef<number>(0);
  const lockedDisplayTimeRef = useRef<number>(0);
  const lastHandSeenTimeRef = useRef<number>(0);

  // State update throttling & distance smoothing refs to prevent React re-render storms
  const smoothedDistRef = useRef<number | null>(null);
  const smoothedInterDistRef = useRef<number | null>(null);
  const lastHandsStateUpdateRef = useRef<number>(0);
  const prevHandDetectedRef = useRef<boolean>(false);
  const prevHandsCountRef = useRef<number>(0);

  const confidenceHistoryRef = useRef<number[]>([]);
  const isLoopRunningRef = useRef<boolean>(false);
  const currentHandsRef = useRef<HandData[]>([]);
  const motionHistoryRef = useRef<Array<{ x: number; y: number; z: number; time: number }>>([]);

  // Request ID counter: drop out-of-order REST responses
  const requestIdCounterRef = useRef<number>(0);
  const latestRequestIdRef = useRef<number>(0);

  const updateSentences = useCallback(async (signs: string[]) => {
    const cleanSigns: string[] = [];
    for (const s of signs) {
      const upper = s.trim().toUpperCase();
      if (upper && (!cleanSigns.length || cleanSigns[cleanSigns.length - 1] !== upper)) {
        cleanSigns.push(upper);
      }
    }

    if (cleanSigns.length === 0) {
      setState(prev => ({ ...prev, accumulatedSigns: [], englishSentence: '', tamilSentence: '' }));
      return;
    }

    if (cleanSigns.length === 1) {
      const single = cleanSigns[0];
      const singleMapped = SIGN_SENTENCES_MAP[single];
      if (singleMapped) {
        setState(prev => ({ ...prev, accumulatedSigns: cleanSigns, englishSentence: singleMapped.en, tamilSentence: singleMapped.ta }));
      }
    }

    try {
      const translation = await ApiService.translateSentence(cleanSigns);
      setState(prev => ({ ...prev, accumulatedSigns: cleanSigns, englishSentence: translation.english_text, tamilSentence: translation.tamil_text }));
    } catch (e) {
      if (cleanSigns.length === 1 && SIGN_SENTENCES_MAP[cleanSigns[0]]) {
        const item = SIGN_SENTENCES_MAP[cleanSigns[0]];
        setState(prev => ({ ...prev, accumulatedSigns: cleanSigns, englishSentence: item.en, tamilSentence: item.ta }));
      } else {
        const eng = cleanSigns.map(s => SIGN_SENTENCES_MAP[s]?.en || (s.charAt(0) + s.slice(1).toLowerCase())).join(' ');
        const tam = cleanSigns.map(s => TAMIL_MAP[s] || s).join(' ');
        setState(prev => ({ ...prev, accumulatedSigns: cleanSigns, englishSentence: eng, tamilSentence: tam }));
      }
    }
  }, []);

  const updateSentencesRef = useRef(updateSentences);
  updateSentencesRef.current = updateSentences;

  const getVoteResult = useCallback(() => {
    const buf = voteBufferRef.current;
    if (buf.length === 0) return null;

    const counts: Record<string, { count: number; totalConf: number }> = {};
    for (const { sign, confidence } of buf) {
      if (!counts[sign]) counts[sign] = { count: 0, totalConf: 0 };
      counts[sign].count++;
      counts[sign].totalConf += confidence;
    }

    let bestSign = '';
    let bestCount = 0;
    let bestAvgConf = 0;
    for (const [sign, { count, totalConf }] of Object.entries(counts)) {
      const avgConf = totalConf / count;
      if (count > bestCount || (count === bestCount && avgConf > bestAvgConf)) {
        bestSign = sign;
        bestCount = count;
        bestAvgConf = avgConf;
      }
    }

    return { sign: bestSign, votes: bestCount, avgConfidence: bestAvgConf };
  }, []);

  const handlePredictionResult = useCallback((pred: PredictionResult) => {
    const hasHand = pred.hand_detected && pred.sign !== 'NO HAND';
    const now = Date.now();

    if (hasHand) {
      lastHandSeenTimeRef.current = now;
      if (pred.confidence > 0) {
        confidenceHistoryRef.current.push(pred.confidence);
        if (confidenceHistoryRef.current.length > 50) confidenceHistoryRef.current.shift();
      }
    }

    const avgConf = confidenceHistoryRef.current.length > 0
      ? confidenceHistoryRef.current.reduce((a, b) => a + b, 0) / confidenceHistoryRef.current.length
      : 0;

    const rawSign = pred.sign ? pred.sign.toUpperCase().trim() : '';
    const isValidSign = hasHand && rawSign && !['NO HAND', 'UNCERTAIN', 'UNKNOWN'].includes(rawSign);

    if (isValidSign && pred.confidence >= DISPLAY_CONF_FLOOR * 0.8) {
      voteBufferRef.current.push({ sign: rawSign, confidence: pred.confidence });
      if (voteBufferRef.current.length > VOTE_WINDOW) voteBufferRef.current.shift();
    } else if (!hasHand) {
      if (voteBufferRef.current.length > 0) voteBufferRef.current.shift();
    }

    const voteResult = getVoteResult();

    // 1. Release locked sign only if hand has been absent for > 500ms
    const handAbsent = !hasHand && (now - lastHandSeenTimeRef.current > 500);
    if (handAbsent) {
      lockedDisplaySignRef.current = null;
      lockedDisplayConfRef.current = 0;
      voteBufferRef.current = [];
    }

    // 2. If a sign candidate has majority consensus, latch or update it
    if (voteResult && voteResult.votes >= VOTE_MAJORITY && voteResult.avgConfidence >= DISPLAY_CONF_FLOOR) {
      lockedDisplaySignRef.current = voteResult.sign;
      lockedDisplayConfRef.current = voteResult.avgConfidence;
      lockedDisplayTimeRef.current = now;
    }

    let stableDisplayPred: PredictionResult;

    if (!hasHand || handAbsent) {
      stableDisplayPred = {
        sign: 'NO HAND',
        raw_sign: 'NO HAND',
        confidence: 0,
        status: 'low',
        top_k: [],
        hand_detected: false
      };
    } else if (lockedDisplaySignRef.current) {
      // Hold the locked sign firmly while hand is present to prevent flickering!
      const currentSignConf = (voteResult && voteResult.sign === lockedDisplaySignRef.current)
        ? voteResult.avgConfidence
        : (pred.sign?.toUpperCase() === lockedDisplaySignRef.current ? pred.confidence : lockedDisplayConfRef.current);

      // Smooth confidence
      lockedDisplayConfRef.current = Math.max(0.40, lockedDisplayConfRef.current * 0.8 + currentSignConf * 0.2);

      stableDisplayPred = {
        ...pred,
        sign: lockedDisplaySignRef.current,
        raw_sign: lockedDisplaySignRef.current,
        confidence: Math.round(lockedDisplayConfRef.current * 100) / 100,
        hand_detected: true,
        status: lockedDisplayConfRef.current >= 0.70 ? 'high' : lockedDisplayConfRef.current >= 0.40 ? 'medium' : 'low'
      };
    } else {
      // Hand is present but no sign has reached consensus yet
      stableDisplayPred = {
        ...pred,
        sign: 'UNCERTAIN',
        raw_sign: 'UNCERTAIN',
        confidence: pred.confidence,
        hand_detected: true,
        status: 'low'
      };
    }

    setState(prev => ({
      ...prev,
      currentPrediction: stableDisplayPred,
      handDetected: hasHand,
      activePipelineStage: hasHand ? (pred.confidence >= confidenceThreshold ? 6 : 4) : 1,
      totalPredictionsCount: prev.totalPredictionsCount + 1,
      averageConfidence: Math.round(avgConf * 1000) / 10
    }));

    const signToConsider = lockedDisplaySignRef.current || '';
    const nowMs = Date.now();

    if (!hasHand) {
      if (nowMs - lastSignAddedTimeRef.current > 1200) lastAddedSignRef.current = null;
      return;
    }

    if (
      signToConsider &&
      !['NO HAND', 'UNCERTAIN', 'UNKNOWN'].includes(signToConsider) &&
      voteResult &&
      voteResult.votes >= VOTE_MAJORITY &&
      voteResult.avgConfidence >= confidenceThreshold
    ) {
      if (signToConsider === candidateSignRef.current) {
        candidateCountRef.current += 1;
      } else {
        candidateSignRef.current = signToConsider;
        candidateCountRef.current = 1;
      }

      if (candidateCountRef.current >= 5) {
        const isDifferent = signToConsider !== lastAddedSignRef.current;
        const cooldownPassed = (nowMs - lastSignAddedTimeRef.current) >= Math.max(cooldownMs, 1500);

        if (isDifferent && cooldownPassed) {
          lastAddedSignRef.current = signToConsider;
          lastSignAddedTimeRef.current = nowMs;
          setState(prev => {
            if (prev.accumulatedSigns.length > 0 && prev.accumulatedSigns[prev.accumulatedSigns.length - 1] === signToConsider) return prev;
            const newSigns = [...prev.accumulatedSigns, signToConsider];
            updateSentencesRef.current(newSigns);
            return { ...prev, accumulatedSigns: newSigns };
          });
        }
      }
    } else {
      if (signToConsider !== candidateSignRef.current) {
        candidateSignRef.current = null;
        candidateCountRef.current = 0;
      }
    }
  }, [confidenceThreshold, cooldownMs, getVoteResult]);

  const handlePredictionResultRef = useRef(handlePredictionResult);
  handlePredictionResultRef.current = handlePredictionResult;

  const handleHandsResults = useCallback((hands: HandData[]) => {
    currentHandsRef.current = hands;
    const hasHands = hands.length > 0;
    const now = performance.now();

    let rawDistCm: number | null = null;
    let distStatus: 'optimal' | 'close' | 'far' | null = null;
    let rawInterDistCm: number | null = null;

    // Track motion & distance on every frame (MediaPipe runs at 30+ fps)
    if (hasHands) {
      // Pick primary/dominant hand (Right hand preferred, or first detected)
      const primaryHand = hands.find(h => h.handedness === 'Right') || hands[0];
      const wrist = primaryHand.landmarks[0];
      const middleMcp = primaryHand.landmarks[9];
      if (wrist) {
        motionHistoryRef.current.push({ x: wrist.x, y: wrist.y, z: wrist.z || 0, time: now });
        // Keep last 400ms window
        motionHistoryRef.current = motionHistoryRef.current.filter(p => now - p.time <= 400);

        // Distance from camera in cm based on palm span geometry
        const palmSpan = middleMcp ? Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y) : 0.2;
        rawDistCm = Math.max(15, Math.min(120, Math.round((0.20 / Math.max(0.04, palmSpan)) * 48)));

        // Exponential Moving Average filter on distance
        smoothedDistRef.current = smoothedDistRef.current == null
          ? rawDistCm
          : Math.round(smoothedDistRef.current * 0.75 + rawDistCm * 0.25);

        const currentDist = smoothedDistRef.current;
        if (currentDist < 28) distStatus = 'close';
        else if (currentDist > 65) distStatus = 'far';
        else distStatus = 'optimal';
      }

      // Inter-hand span distance when both hands are visible
      if (hands.length >= 2) {
        const h1 = hands[0].landmarks[0];
        const h2 = hands[1].landmarks[0];
        if (h1 && h2) {
          rawInterDistCm = Math.max(5, Math.round(Math.hypot(h1.x - h2.x, h1.y - h2.y) * 65));
          smoothedInterDistRef.current = smoothedInterDistRef.current == null
            ? rawInterDistCm
            : Math.round(smoothedInterDistRef.current * 0.75 + rawInterDistCm * 0.25);
        }
      } else {
        smoothedInterDistRef.current = null;
      }
    } else {
      motionHistoryRef.current = [];
      smoothedDistRef.current = null;
      smoothedInterDistRef.current = null;
    }

    // Always draw canvas smoothly
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const signToShow = lockedDisplaySignRef.current || null;
        MediaPipeHandsService.drawSkeleton(
          ctx,
          hands,
          canvasRef.current.width,
          canvasRef.current.height,
          signToShow
        );
      }
    }

    // Throttle React setState to avoid 30-60 FPS re-render storms
    const statusChanged =
      prevHandDetectedRef.current !== hasHands ||
      prevHandsCountRef.current !== hands.length;
    const timeSinceLastState = now - lastHandsStateUpdateRef.current;

    if (statusChanged || timeSinceLastState >= 180) {
      prevHandDetectedRef.current = hasHands;
      prevHandsCountRef.current = hands.length;
      lastHandsStateUpdateRef.current = now;

      const currentDist = smoothedDistRef.current;
      const currentInterDist = smoothedInterDistRef.current;

      setState(prev => {
        if (
          prev.handDetected === hasHands &&
          prev.handsCount === hands.length &&
          prev.handDistanceCm === currentDist &&
          prev.handDistanceStatus === distStatus &&
          prev.interHandDistanceCm === currentInterDist
        ) {
          return prev;
        }

        return {
          ...prev,
          handDetected: hasHands,
          handsCount: hands.length,
          activePipelineStage: hasHands ? 2 : 1,
          handDistanceCm: currentDist,
          handDistanceStatus: distStatus,
          interHandDistanceCm: currentInterDist,
        };
      });
    }

    // Adaptive throttle: 100ms (10fps inference) - light on network
    if (now - lastInferenceTimeRef.current >= 100) {
      lastInferenceTimeRef.current = now;

      if (hasHands) {
        // Compute motion features over rolling window
        let motionData = { dx: 0, dy: 0, dz: 0, speed: 0, dir_x: 0, dir_y: 0 };
        const history = motionHistoryRef.current;
        if (history.length >= 2) {
          const oldest = history[0];
          const newest = history[history.length - 1];
          const dt = Math.max(0.05, (newest.time - oldest.time) / 1000);

          // Video has scale-x-[-1] (mirrored).
          // Raw mediapipe: moving hand to user's right causes raw x to decrease.
          // To express displacement from user perspective: userDx = -(newest.x - oldest.x)
          const userDx = -(newest.x - oldest.x);
          const userDy = newest.y - oldest.y;
          const userDz = (newest.z || 0) - (oldest.z || 0);

          const dist = Math.hypot(userDx, userDy, userDz);

          // Filter out tiny micro-tremors (< 0.02)
          if (dist > 0.02) {
            const normSpeed = Math.min(1.0, (dist / dt) * 0.22);
            const dirX = dist > 0.005 ? userDx / dist : 0;
            const dirY = dist > 0.005 ? userDy / dist : 0;

            motionData = {
              dx: Math.round(userDx * 1000) / 1000,
              dy: Math.round(userDy * 1000) / 1000,
              dz: Math.round(userDz * 1000) / 1000,
              speed: Math.round(normSpeed * 1000) / 1000,
              dir_x: Math.round(dirX * 1000) / 1000,
              dir_y: Math.round(dirY * 1000) / 1000,
            };
          }
        }

        const payload = {
          hands: hands.map(h => ({ landmarks: h.landmarks, handedness: h.handedness })),
          motion: motionData,
          timestamp: new Date().toISOString()
        };

        if (useWebSocket && wsServiceRef.current?.isConnected()) {
          wsServiceRef.current.sendLandmarks(payload);
        } else {
          const myRequestId = ++requestIdCounterRef.current;
          latestRequestIdRef.current = myRequestId;

          ApiService.predict(payload)
            .then(res => {
              if (myRequestId < latestRequestIdRef.current - 2) return; // stale response, drop
              handlePredictionResultRef.current(res);
            })
            .catch((err) => { console.error('API Predict Error:', err); });
        }
      } else {
        handlePredictionResultRef.current({
          sign: 'NO HAND', raw_sign: 'NO HAND', confidence: 0, status: 'low', top_k: [], hand_detected: false
        });
      }
    }
  }, [useWebSocket]);

  const handleHandsResultsRef = useRef(handleHandsResults);
  handleHandsResultsRef.current = handleHandsResults;

  const startRecognition = useCallback(async (videoElement: HTMLVideoElement, onFrameCallback?: () => void) => {
    if (isLoopRunningRef.current) return;
    isLoopRunningRef.current = true;

    if (!mpServiceRef.current) {
      mpServiceRef.current = new MediaPipeHandsService();
      await mpServiceRef.current.initialize();
    }
    mpServiceRef.current.setOnResults((hands) => { handleHandsResultsRef.current(hands); });

    if (useWebSocket && !wsServiceRef.current) {
      wsServiceRef.current = new RealtimeWebSocketService();
      wsServiceRef.current.connect((pred) => { handlePredictionResultRef.current(pred); });
    }

    setState(prev => ({ ...prev, isTranslating: true, sessionStartTime: Date.now(), activePipelineStage: 0 }));

    const processFrame = async () => {
      if (!isLoopRunningRef.current) return;
      if (onFrameCallback) onFrameCallback();
      if (videoElement && videoElement.readyState >= 2 && mpServiceRef.current) {
        await mpServiceRef.current.sendFrame(videoElement);
      }
      if (isLoopRunningRef.current) requestAnimationFrame(processFrame);
    };

    requestAnimationFrame(processFrame);
  }, [useWebSocket]);

  const stopRecognition = useCallback(() => {
    isLoopRunningRef.current = false;
    if (wsServiceRef.current) { wsServiceRef.current.disconnect(); wsServiceRef.current = null; }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    voteBufferRef.current = [];
    lockedDisplaySignRef.current = null;
    lockedDisplayConfRef.current = 0;
    lockedDisplayTimeRef.current = 0;
    lastHandSeenTimeRef.current = 0;
    smoothedDistRef.current = null;
    smoothedInterDistRef.current = null;
    lastHandsStateUpdateRef.current = 0;
    prevHandDetectedRef.current = false;
    prevHandsCountRef.current = 0;
    motionHistoryRef.current = [];
    setState(prev => ({
      ...prev,
      isTranslating: false,
      handDetected: false,
      activePipelineStage: 0,
      handDistanceCm: null,
      handDistanceStatus: null,
      interHandDistanceCm: null,
    }));
  }, []);

  const addSpace = useCallback(() => {
    setState(prev => ({ ...prev, accumulatedSigns: [...prev.accumulatedSigns, ' '], englishSentence: prev.englishSentence + ' ', tamilSentence: prev.tamilSentence + ' ' }));
  }, []);

  const undoLastSign = useCallback(() => {
    setState(prev => {
      if (prev.accumulatedSigns.length === 0) return prev;
      const newSigns = prev.accumulatedSigns.slice(0, -1);
      updateSentencesRef.current(newSigns);
      return { ...prev, accumulatedSigns: newSigns };
    });
  }, []);

  const clearSentence = useCallback(() => {
    lastAddedSignRef.current = null;
    candidateSignRef.current = null;
    candidateCountRef.current = 0;
    voteBufferRef.current = [];
    lockedDisplaySignRef.current = null;
    lockedDisplayConfRef.current = 0;
    lockedDisplayTimeRef.current = 0;
    motionHistoryRef.current = [];
    if (wsServiceRef.current) wsServiceRef.current.resetSmoother();
    setState(prev => ({ ...prev, accumulatedSigns: [], englishSentence: '', tamilSentence: '', totalPredictionsCount: 0 }));
  }, []);

  const saveCurrentSession = useCallback(async (userName: string = 'Guest User') => {
    if (state.accumulatedSigns.length === 0) return null;
    const duration = state.sessionStartTime ? (Date.now() - state.sessionStartTime) / 1000 : 10;
    try {
      const saved = await ApiService.saveSession({
        user_name: userName, language: 'en', raw_signs: state.accumulatedSigns,
        final_text: state.englishSentence || state.accumulatedSigns.join(' '),
        tamil_translation: state.tamilSentence, average_confidence: state.averageConfidence / 100,
        duration_seconds: Math.round(duration * 10) / 10
      });
      return saved;
    } catch (e) { console.warn('Failed to save session:', e); return null; }
  }, [state]);

  useEffect(() => {
    return () => { stopRecognition(); if (mpServiceRef.current) mpServiceRef.current.close(); };
  }, [stopRecognition]);

  return { state, canvasRef, startRecognition, stopRecognition, addSpace, undoLastSign, clearSentence, saveCurrentSession, currentHandsRef };
}
