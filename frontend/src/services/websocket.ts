import { PredictionResult } from '../types/isl';

export type WebSocketCallback = (prediction: PredictionResult) => void;

export class RealtimeWebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private onPredictionCallback: WebSocketCallback | null = null;
  private isConnecting: boolean = false;
  private reconnectTimeout: any = null;

  constructor(url?: string) {
    const defaultWsUrl = window.location.protocol === 'https:' ? 'wss://' : 'ws://' + (window.location.hostname || 'localhost') + ':8000/ws/translate';
    this.url = url || import.meta.env.VITE_WS_URL || defaultWsUrl;
  }

  public connect(onPrediction: WebSocketCallback) {
    this.onPredictionCallback = onPrediction;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected to real-time recognition server');
        this.isConnecting = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.onPredictionCallback) {
            this.onPredictionCallback(data);
          }
        } catch (e) {
          console.error('[WebSocket] Error parsing message:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[WebSocket] Connection error:', err);
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Connection closed');
        this.isConnecting = false;
        // Attempt reconnect after 3s
        this.reconnectTimeout = setTimeout(() => {
          if (this.onPredictionCallback) {
            this.connect(this.onPredictionCallback);
          }
        }, 3000);
      };
    } catch (e) {
      console.warn('[WebSocket] Could not open WebSocket:', e);
      this.isConnecting = false;
    }
  }

  public sendLandmarks(payload: {
    landmarks?: any[];
    handedness?: string;
    hands?: any[];
    motion?: any;
    timestamp?: string;
  }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  public resetSmoother() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ command: 'reset' }));
    }
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.onPredictionCallback = null;
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
