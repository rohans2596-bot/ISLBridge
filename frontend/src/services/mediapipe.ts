import { LandmarkPoint, HandData } from '../types/isl';

// MediaPipe Hands Landmark Connections
export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm Base
  [5, 9], [9, 13], [13, 17]
];

export class MediaPipeHandsService {
  private hands: any = null;
  private isLoaded: boolean = false;
  private onResultsCallback: ((hands: HandData[]) => void) | null = null;
  private isProcessing: boolean = false;

  // Smoothing and zero-dropout persistence
  private prevHandsMap: Map<string, LandmarkPoint[]> = new Map();
  private lastHandsData: HandData[] = [];
  private lastDetectedTimestamp: number = 0;

  // Static state for smoothed skeleton overlays
  private static smoothedTagMap: Map<string, { x: number; y: number; isAbove: boolean; distanceCm: number }> = new Map();
  private static smoothedInterDistCm: number | null = null;

  public async initialize(): Promise<boolean> {
    try {
      const mpHands = (window as any).Hands;
      if (!mpHands) {
        console.warn('MediaPipe Hands script not found globally; attempting dynamic load...');
        return false;
      }

      this.hands = new mpHands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
      });

      // Ultra-low latency configuration for real-time live streaming
      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.hands.onResults((results: any) => {
        this.isProcessing = false;
        const now = Date.now();
        const detectedHands: HandData[] = [];

        if (results.multiHandLandmarks && results.multiHandedness && results.multiHandLandmarks.length > 0) {
          this.lastDetectedTimestamp = now;

          for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const rawLms = results.multiHandLandmarks[i];
            const handednessInfo = results.multiHandedness[i];
            const handedness = (handednessInfo?.label === 'Left' ? 'Left' : 'Right') as 'Left' | 'Right';
            const handKey = handedness;

            const prevLms = this.prevHandsMap.get(handKey);
            // Landmark EMA smoothing: alpha = 0.65 (65% current, 35% previous) eliminates sensor noise
            const alpha = prevLms ? 0.65 : 1.0;

            const landmarks: LandmarkPoint[] = rawLms.map((lm: any, idx: number) => {
              const prevPoint = prevLms ? prevLms[idx] : null;
              const x = prevPoint ? prevPoint.x * (1 - alpha) + lm.x * alpha : lm.x;
              const y = prevPoint ? prevPoint.y * (1 - alpha) + lm.y * alpha : lm.y;
              const z = prevPoint ? (prevPoint.z || 0) * (1 - alpha) + (lm.z || 0) * alpha : (lm.z || 0);
              return { x, y, z };
            });

            this.prevHandsMap.set(handKey, landmarks);
            detectedHands.push({ landmarks, handedness });
          }
          this.lastHandsData = detectedHands;
        } else {
          // Zero-dropout grace buffer: hold last hand for up to 160ms if dropped momentarily
          if (now - this.lastDetectedTimestamp < 160 && this.lastHandsData.length > 0) {
            detectedHands.push(...this.lastHandsData);
          } else {
            this.prevHandsMap.clear();
            this.lastHandsData = [];
          }
        }

        if (this.onResultsCallback) {
          this.onResultsCallback(detectedHands);
        }
      });

      this.isLoaded = true;
      return true;
    } catch (e) {
      console.warn('MediaPipe initialization error:', e);
      return false;
    }
  }

  public setOnResults(callback: (hands: HandData[]) => void) {
    this.onResultsCallback = callback;
  }

  public async sendFrame(videoElement: HTMLVideoElement) {
    if (this.hands && this.isLoaded && !this.isProcessing && videoElement.readyState >= 2) {
      try {
        this.isProcessing = true;
        await this.hands.send({ image: videoElement });
      } catch (e) {
        this.isProcessing = false;
      }
    }
  }

  public static drawSkeleton(
    ctx: CanvasRenderingContext2D,
    hands: HandData[],
    width: number,
    height: number,
    recognizedSign?: string | null,
    confidence?: number
  ) {
    ctx.clearRect(0, 0, width, height);

    if (hands.length === 0) {
      MediaPipeHandsService.smoothedTagMap.clear();
      MediaPipeHandsService.smoothedInterDistCm = null;
      return;
    }

    hands.forEach((hand) => {
      const isRight = hand.handedness === 'Right';
      const lineColor = isRight ? '#E11D48' : '#BE123C';
      const pointColor = '#FFFFFF';
      const glowColor = isRight ? 'rgba(225, 29, 72, 0.7)' : 'rgba(190, 18, 60, 0.7)';

      // 1. Connection bones - Batched stroke for 60fps rendering without GPU blur stalls
      ctx.save();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = lineColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const p1 = hand.landmarks[startIdx];
        const p2 = hand.landmarks[endIdx];
        if (p1 && p2) {
          ctx.moveTo(p1.x * width, p1.y * height);
          ctx.lineTo(p2.x * width, p2.y * height);
        }
      });
      ctx.stroke();
      ctx.restore();

      // 2. Joints
      hand.landmarks.forEach((p, idx) => {
        const isTip = [4, 8, 12, 16, 20].includes(idx);
        const radius = isTip ? 5 : 3;

        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, radius, 0, 2 * Math.PI);
        ctx.fillStyle = isTip ? '#FDA4AF' : pointColor;
        ctx.fill();
        ctx.strokeStyle = '#881337';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // 3. Hand badge tag with smoothed coordinates & hysteresis
      const wrist = hand.landmarks[0];
      const middleMcp = hand.landmarks[9];
      if (wrist) {
        // Calculate palm span to estimate physical distance in cm
        const palmSpan = middleMcp ? Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y) : 0.2;
        const rawDistCm = Math.max(15, Math.min(120, Math.round((0.20 / Math.max(0.04, palmSpan)) * 48)));

        // Retrieve or initialize tag smoothing state
        let tagState = MediaPipeHandsService.smoothedTagMap.get(hand.handedness);
        if (!tagState) {
          tagState = {
            x: wrist.x * width,
            y: wrist.y * height + 28,
            isAbove: false,
            distanceCm: rawDistCm
          };
          MediaPipeHandsService.smoothedTagMap.set(hand.handedness, tagState);
        }

        // Smooth distance (EMA)
        tagState.distanceCm = Math.round(tagState.distanceCm * 0.75 + rawDistCm * 0.25);

        // Hysteresis for flipping above/below wrist to prevent edge jitter
        const wristPxY = wrist.y * height;
        if (!tagState.isAbove && wristPxY > height - 42) {
          tagState.isAbove = true;
        } else if (tagState.isAbove && wristPxY < height - 75) {
          tagState.isAbove = false;
        }

        const targetY = tagState.isAbove
          ? Math.max(26, wristPxY - 30)
          : Math.min(height - 26, wristPxY + 28);
        const targetX = Math.max(75, Math.min(width - 75, wrist.x * width));

        // Smooth tag position so it glides smoothly with hand movements
        tagState.x = tagState.x * 0.55 + targetX * 0.45;
        tagState.y = tagState.y * 0.55 + targetY * 0.45;

        // Check if recognized sign name is active
        const hasValidSign = Boolean(recognizedSign && !['NO HAND', 'UNCERTAIN', 'UNKNOWN'].includes(recognizedSign.toUpperCase()));
        const signLabel = hasValidSign ? recognizedSign!.toUpperCase() : null;

        // Stable tag title (omits micro-fluctuating confidence to keep tag width stable)
        const displayTitle = signLabel
          ? `${signLabel} • ${tagState.distanceCm}cm`
          : `${hand.handedness} Hand • ${tagState.distanceCm}cm`;

        const tagW = Math.max(136, Math.min(210, displayTitle.length * 8.5 + 24));
        const tagH = 26;

        ctx.save();
        ctx.translate(tagState.x, tagState.y);
        // Canvas is mirrored via CSS scale-x-[-1]; scale(-1, 1) locally to keep text readable
        ctx.scale(-1, 1);

        ctx.fillStyle = signLabel ? 'rgba(12, 74, 110, 0.95)' : 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = signLabel ? '#38BDF8' : (isRight ? '#38BDF8' : '#F43F5E');
        ctx.lineWidth = signLabel ? 2 : 1.5;
        ctx.shadowColor = signLabel ? 'rgba(56, 189, 248, 0.6)' : 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = signLabel ? 8 : 4;
        ctx.beginPath();
        ctx.roundRect(-tagW / 2, -tagH / 2, tagW, tagH, 7);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = signLabel ? '#E0F2FE' : '#FFFFFF';
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayTitle, 0, 0);

        ctx.restore();
      }
    });

    // If both hands are detected, draw smoothed inter-hand distance span
    if (hands.length >= 2) {
      const h1 = hands[0].landmarks[0];
      const h2 = hands[1].landmarks[0];
      if (h1 && h2) {
        const p1x = h1.x * width;
        const p1y = h1.y * height;
        const p2x = h2.x * width;
        const p2y = h2.y * height;
        const midX = (p1x + p2x) / 2;
        const midY = (p1y + p2y) / 2;
        const rawInterDist = Math.max(5, Math.round(Math.hypot(h1.x - h2.x, h1.y - h2.y) * 65));

        const interDist = MediaPipeHandsService.smoothedInterDistCm == null
          ? rawInterDist
          : Math.round(MediaPipeHandsService.smoothedInterDistCm * 0.75 + rawInterDist * 0.25);
        MediaPipeHandsService.smoothedInterDistCm = interDist;

        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.stroke();

        ctx.translate(midX, midY);
        ctx.scale(-1, 1); // Unmirror

        const mText = `↔ ${interDist} cm`;
        ctx.fillStyle = 'rgba(12, 74, 110, 0.95)';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-42, -12, 84, 24, 7);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#BAE6FD';
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(mText, 0, 0);

        ctx.restore();
      }
    }
  }

  public close() {
    if (this.hands) {
      try {
        this.hands.close();
      } catch (e) {}
      this.hands = null;
    }
    this.prevHandsMap.clear();
    this.lastHandsData = [];
    MediaPipeHandsService.smoothedTagMap.clear();
    MediaPipeHandsService.smoothedInterDistCm = null;
  }
}
