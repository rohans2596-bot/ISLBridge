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
}

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
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mpServiceRef = useRef<MediaPipeHandsService | null>(null);
  const wsServiceRef = useRef<RealtimeWebSocketService | null>(null);
  
  const lastInferenceTimeRef = useRef<number>(0);
  const lastAddedSignRef = useRef<string | null>(null);
  const lastSignAddedTimeRef = useRef<number>(0);
  const confidenceHistoryRef = useRef<number[]>([]);
  const isLoopRunningRef = useRef<boolean>(false);
  const currentHandsRef = useRef<HandData[]>([]);

  // Update sentence when accumulated signs change
  const updateSentences = useCallback(async (signs: string[]) => {
    // Filter and deduplicate consecutive tokens
    const cleanSigns: string[] = [];
    for (const s of signs) {
      const upper = s.trim().toUpperCase();
      if (upper && (!cleanSigns.length || cleanSigns[cleanSigns.length - 1] !== upper)) {
        cleanSigns.push(upper);
      }
    }

    if (cleanSigns.length === 0) {
      setState(prev => ({
        ...prev,
        accumulatedSigns: [],
        englishSentence: '',
        tamilSentence: ''
      }));
      return;
    }

    // Instant rich sentence prediction for single sign
    if (cleanSigns.length === 1) {
      const single = cleanSigns[0];
      const singleMapped = SIGN_SENTENCES_MAP[single];
      if (singleMapped) {
        setState(prev => ({
          ...prev,
          accumulatedSigns: cleanSigns,
          englishSentence: singleMapped.en,
          tamilSentence: singleMapped.ta
        }));
      }
    }

    try {
      const translation = await ApiService.translateSentence(cleanSigns);
      setState(prev => ({
        ...prev,
        accumulatedSigns: cleanSigns,
        englishSentence: translation.english_text,
        tamilSentence: translation.tamil_text
      }));
    } catch (e) {
      // Fallback local translation with single sign expansion
      if (cleanSigns.length === 1 && SIGN_SENTENCES_MAP[cleanSigns[0]]) {
        const item = SIGN_SENTENCES_MAP[cleanSigns[0]];
        setState(prev => ({
          ...prev,
          accumulatedSigns: cleanSigns,
          englishSentence: item.en,
          tamilSentence: item.ta
        }));
      } else {
        const eng = cleanSigns.map(s => SIGN_SENTENCES_MAP[s]?.en || (s.charAt(0) + s.slice(1).toLowerCase())).join(' ');
        const tam = cleanSigns.map(s => TAMIL_MAP[s] || s).join(' ');
        setState(prev => ({
          ...prev,
          accumulatedSigns: cleanSigns,
          englishSentence: eng,
          tamilSentence: tam
        }));
      }
    }
  }, []);

  const updateSentencesRef = useRef(updateSentences);
  updateSentencesRef.current = updateSentences;

  // Handle incoming prediction from WebSocket or REST
  const handlePredictionResult = useCallback((pred: PredictionResult) => {
    const hasHand = pred.hand_detected && pred.sign !== 'NO HAND';
    
    if (hasHand && pred.confidence > 0) {
      confidenceHistoryRef.current.push(pred.confidence);
      if (confidenceHistoryRef.current.length > 50) {
        confidenceHistoryRef.current.shift();
      }
    }

    const avgConf = confidenceHistoryRef.current.length > 0
      ? confidenceHistoryRef.current.reduce((a, b) => a + b, 0) / confidenceHistoryRef.current.length
      : 0;

    setState(prev => ({
      ...prev,
      currentPrediction: pred,
      handDetected: hasHand,
      activePipelineStage: hasHand ? (pred.confidence >= confidenceThreshold ? 6 : 4) : 1,
      totalPredictionsCount: prev.totalPredictionsCount + 1,
      averageConfidence: Math.round(avgConf * 1000) / 10
    }));

    // Auto-accumulate sign into live sentence if stable & strictly deduplicated
    const signToConsider = pred.sign ? pred.sign.toUpperCase().trim() : '';
    const now = Date.now();

    if (!hasHand) {
      // If hands are lowered for > 1000ms, reset last added sign ref to allow signing again
      if (now - lastSignAddedTimeRef.current > 1000) {
        lastAddedSignRef.current = null;
      }
      return;
    }

    if (
      signToConsider &&
      !['NO HAND', 'UNCERTAIN', 'UNKNOWN'].includes(signToConsider) &&
      pred.confidence >= confidenceThreshold
    ) {
      const isDifferent = signToConsider !== lastAddedSignRef.current;
      const cooldownPassed = (now - lastSignAddedTimeRef.current) >= Math.max(cooldownMs, 1200);

      // Only add if it's a new gesture transition, not continuous repeated frames of the same sign
      if (isDifferent) {
        lastAddedSignRef.current = signToConsider;
        lastSignAddedTimeRef.current = now;

        setState(prev => {
          if (prev.accumulatedSigns.length > 0 && prev.accumulatedSigns[prev.accumulatedSigns.length - 1] === signToConsider) {
            return prev;
          }
          const newSigns = [...prev.accumulatedSigns, signToConsider];
          updateSentencesRef.current(newSigns);
          return { ...prev, accumulatedSigns: newSigns };
        });
      }
    }
  }, [confidenceThreshold, cooldownMs]);

  const handlePredictionResultRef = useRef(handlePredictionResult);
  handlePredictionResultRef.current = handlePredictionResult;

  // MediaPipe Results Handler with High FPS Stream
  const handleHandsResults = useCallback((hands: HandData[]) => {
    currentHandsRef.current = hands;
    const hasHands = hands.length > 0;

    // Draw Skeleton on canvas overlay
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        MediaPipeHandsService.drawSkeleton(
          ctx,
          hands,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }
    }

    setState(prev => {
      if (prev.handDetected === hasHands && prev.handsCount === hands.length) return prev;
      return {
        ...prev,
        handDetected: hasHands,
        handsCount: hands.length,
        activePipelineStage: hasHands ? 2 : 1
      };
    });

    // High FPS live streaming inference (every 30ms ~ 33 FPS)
    const now = performance.now();
    if (now - lastInferenceTimeRef.current >= 30) {
      lastInferenceTimeRef.current = now;

      if (hasHands) {
        const payload = {
          hands: hands.map(h => ({
            landmarks: h.landmarks,
            handedness: h.handedness
          })),
          timestamp: new Date().toISOString()
        };

        if (useWebSocket && wsServiceRef.current?.isConnected()) {
          wsServiceRef.current.sendLandmarks(payload);
        } else {
          ApiService.predict(payload)
            .then(res => handlePredictionResultRef.current(res))
            .catch(() => {});
        }
      } else {
        handlePredictionResultRef.current({
          sign: 'NO HAND',
          raw_sign: 'NO HAND',
          confidence: 0,
          status: 'low',
          top_k: [],
          hand_detected: false
        });
      }
    }
  }, [useWebSocket]);

  const handleHandsResultsRef = useRef(handleHandsResults);
  handleHandsResultsRef.current = handleHandsResults;

  // Start / Stop Recognition Loop
  const startRecognition = useCallback(async (videoElement: HTMLVideoElement) => {
    if (isLoopRunningRef.current) return;
    isLoopRunningRef.current = true;

    if (!mpServiceRef.current) {
      mpServiceRef.current = new MediaPipeHandsService();
      await mpServiceRef.current.initialize();
    }
    mpServiceRef.current.setOnResults((hands) => {
      handleHandsResultsRef.current(hands);
    });

    if (useWebSocket && !wsServiceRef.current) {
      wsServiceRef.current = new RealtimeWebSocketService();
      wsServiceRef.current.connect((pred) => {
        handlePredictionResultRef.current(pred);
      });
    }

    setState(prev => ({
      ...prev,
      isTranslating: true,
      sessionStartTime: Date.now(),
      activePipelineStage: 0
    }));

    const processFrame = async () => {
      if (!isLoopRunningRef.current) return;

      if (videoElement && videoElement.readyState >= 2 && mpServiceRef.current) {
        await mpServiceRef.current.sendFrame(videoElement);
      }

      if (isLoopRunningRef.current) {
        requestAnimationFrame(processFrame);
      }
    };

    requestAnimationFrame(processFrame);
  }, [useWebSocket]);

  const stopRecognition = useCallback(() => {
    isLoopRunningRef.current = false;
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
      wsServiceRef.current = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setState(prev => ({
      ...prev,
      isTranslating: false,
      handDetected: false,
      activePipelineStage: 0
    }));
  }, []);

  const addSpace = useCallback(() => {
    setState(prev => ({
      ...prev,
      accumulatedSigns: [...prev.accumulatedSigns, ' '],
      englishSentence: prev.englishSentence + ' ',
      tamilSentence: prev.tamilSentence + ' '
    }));
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
    if (wsServiceRef.current) {
      wsServiceRef.current.resetSmoother();
    }
    setState(prev => ({
      ...prev,
      accumulatedSigns: [],
      englishSentence: '',
      tamilSentence: '',
      totalPredictionsCount: 0
    }));
  }, []);

  const saveCurrentSession = useCallback(async (userName: string = 'Guest User') => {
    if (state.accumulatedSigns.length === 0) return null;

    const duration = state.sessionStartTime
      ? (Date.now() - state.sessionStartTime) / 1000
      : 10;

    try {
      const saved = await ApiService.saveSession({
        user_name: userName,
        language: 'en',
        raw_signs: state.accumulatedSigns,
        final_text: state.englishSentence || state.accumulatedSigns.join(' '),
        tamil_translation: state.tamilSentence,
        average_confidence: state.averageConfidence / 100,
        duration_seconds: Math.round(duration * 10) / 10
      });
      return saved;
    } catch (e) {
      console.warn('Failed to save session:', e);
      return null;
    }
  }, [state]);

  useEffect(() => {
    return () => {
      stopRecognition();
      if (mpServiceRef.current) {
        mpServiceRef.current.close();
      }
    };
  }, [stopRecognition]);

  return {
    state,
    canvasRef,
    startRecognition,
    stopRecognition,
    addSpace,
    undoLastSign,
    clearSentence,
    saveCurrentSession,
    currentHandsRef,
  };
}
