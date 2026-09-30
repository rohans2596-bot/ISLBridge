import { ISLSign, ModelMetrics, TranslationSession, AnalyticsData, PredictionResult } from '../types/isl';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class ApiService {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {})
        },
        ...options
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || `API request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(`[ApiService] Request error on ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  static async checkHealth(): Promise<{ status: string; model_loaded: boolean; classes_count: number }> {
    return this.request('/health');
  }

  // Predict single frame landmarks
  static async predict(payload: {
    landmarks?: { x: number; y: number; z?: number }[];
    handedness?: string;
    hands?: { landmarks: { x: number; y: number; z?: number }[]; handedness: string }[];
  }): Promise<PredictionResult> {
    return this.request('/api/predict', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Translate accumulated signs into natural sentence
  static async translateSentence(signs: string[]): Promise<{ raw_signs: string[]; english_text: string; tamil_text: string }> {
    return this.request('/api/translate-sentence', {
      method: 'POST',
      body: JSON.stringify({ signs })
    });
  }

  // Signs list
  static async getSigns(): Promise<ISLSign[]> {
    return this.request('/api/signs');
  }

  // Create new sign
  static async createSign(sign: { name: string; display_name: string; gesture_type?: string; description?: string }): Promise<ISLSign> {
    return this.request('/api/dataset/create', {
      method: 'POST',
      body: JSON.stringify(sign)
    });
  }

  // Add training sample
  static async addSample(sample: { sign_name: string; hand_type: string; landmarks?: any[]; hands?: any[] }): Promise<any> {
    return this.request('/api/dataset/sample', {
      method: 'POST',
      body: JSON.stringify(sample)
    });
  }

  // Dataset stats
  static async getDatasetStats(): Promise<{ total_signs: number; custom_samples: number; distribution: any[] }> {
    return this.request('/api/dataset/stats');
  }

  // Model status & metrics
  static async getModelStatus(): Promise<{ status: string; model_loaded: boolean; classes_count: number; classes: string[]; metadata: any }> {
    return this.request('/api/model/status');
  }

  static async getModelMetrics(): Promise<ModelMetrics> {
    return this.request('/api/model/metrics');
  }

  static async trainModel(config: { model_type: string; samples_per_synthetic_sign?: number }): Promise<ModelMetrics> {
    return this.request('/api/model/train', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }

  static async getModelHistory(): Promise<any[]> {
    return this.request('/api/model/list');
  }

  // Translation Sessions
  static async saveSession(session: {
    user_name?: string;
    language: string;
    raw_signs: string[];
    final_text: string;
    tamil_translation?: string;
    average_confidence: number;
    duration_seconds: number;
  }): Promise<TranslationSession> {
    return this.request('/api/translation/save', {
      method: 'POST',
      body: JSON.stringify(session)
    });
  }

  static async getHistory(): Promise<TranslationSession[]> {
    return this.request('/api/translation/history');
  }

  static async deleteHistory(id: number): Promise<any> {
    return this.request(`/api/translation/history/${id}`, {
      method: 'DELETE'
    });
  }

  // Analytics
  static async getAnalytics(): Promise<AnalyticsData> {
    return this.request('/api/analytics');
  }
}
