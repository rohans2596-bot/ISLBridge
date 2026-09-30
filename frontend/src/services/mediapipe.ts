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
        const detectedHands: HandData[] = [];
        if (results.multiHandLandmarks && results.multiHandedness) {
          for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const rawLms = results.multiHandLandmarks[i];
            const handednessInfo = results.multiHandedness[i];
            const handedness = (handednessInfo?.label === 'Left' ? 'Left' : 'Right') as 'Left' | 'Right';

            const landmarks: LandmarkPoint[] = rawLms.map((lm: any) => ({
              x: lm.x,
              y: lm.y,
              z: lm.z || 0
            }));

            detectedHands.push({ landmarks, handedness });
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
    height: number
  ) {
    ctx.clearRect(0, 0, width, height);

    hands.forEach((hand) => {
      const isRight = hand.handedness === 'Right';
      const lineColor = isRight ? '#E11D48' : '#BE123C';
      const pointColor = '#FFFFFF';
      const glowColor = isRight ? 'rgba(225, 29, 72, 0.8)' : 'rgba(190, 18, 60, 0.8)';

      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = lineColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12;

      // Connection bones
      HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const p1 = hand.landmarks[startIdx];
        const p2 = hand.landmarks[endIdx];
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x * width, p1.y * height);
          ctx.lineTo(p2.x * width, p2.y * height);
          ctx.stroke();
        }
      });

      // Joints
      hand.landmarks.forEach((p, idx) => {
        const isTip = [4, 8, 12, 16, 20].includes(idx);
        const radius = isTip ? 5.5 : 3.5;

        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, radius, 0, 2 * Math.PI);
        ctx.fillStyle = isTip ? '#FDA4AF' : pointColor;
        ctx.fill();
        ctx.strokeStyle = '#6D001A';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Hand badge tag
      const wrist = hand.landmarks[0];
      if (wrist) {
        const tagX = wrist.x * width;
        const tagY = Math.min(height - 12, wrist.y * height + 24);
        
        ctx.fillStyle = 'rgba(10, 5, 8, 0.85)';
        ctx.strokeStyle = '#6D001A';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tagX - 35, tagY - 14, 70, 20, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${hand.handedness} Hand`, tagX, tagY - 3);
      }

      ctx.restore();
    });
  }

  public close() {
    if (this.hands) {
      try {
        this.hands.close();
      } catch (e) {}
      this.hands = null;
    }
  }
}
