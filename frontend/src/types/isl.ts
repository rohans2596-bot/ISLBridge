export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export interface HandData {
  landmarks: LandmarkPoint[];
  handedness: 'Left' | 'Right';
}

export interface MotionData {
  dx: number;
  dy: number;
  dz: number;
  speed: number;
  dir_x: number;
  dir_y: number;
}

export interface LandmarkPayload {
  hands: Array<{ landmarks: LandmarkPoint[]; handedness: 'Left' | 'Right' }>;
  motion?: MotionData;
  timestamp?: string;
}

export interface PredictionResult {
  sign: string;
  raw_sign: string;
  confidence: number;
  status: 'high' | 'medium' | 'low';
  language?: string;
  tamil_translation?: string;
  top_k: { sign: string; confidence: number }[];
  hand_detected: boolean;
  is_smoothed_trigger?: boolean;
  error?: string;
  timestamp?: string;
}

export interface ISLSign {
  id: number;
  name: string;
  display_name: string;
  gesture_type: 'static' | 'dynamic';
  description?: string;
  language: string;
  is_active: boolean;
  samples_count: number;
  created_at?: string;
}

export interface ModelMetrics {
  version: string;
  model_type: string;
  classes: string[];
  classes_count: number;
  samples_count: number;
  train_samples?: number;
  test_samples?: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix?: number[][];
  per_class_metrics?: Record<string, {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    support: number;
  }>;
  created_at: string;
  is_active: boolean;
}

export interface TranslationSession {
  id: number;
  session_id: string;
  user_name: string;
  language: string;
  started_at: string;
  ended_at: string;
  raw_signs: string[];
  final_text: string;
  tamil_translation?: string;
  average_confidence: number;
  duration_seconds: number;
  signs_count: number;
}

export interface AnalyticsData {
  summary: {
    total_translations: number;
    total_signs_recognized: number;
    average_confidence: number;
    supported_signs_count: number;
    active_models_count: number;
  };
  top_signs: { sign: string; count: number }[];
  confidence_distribution: { name: string; count: number; color: string }[];
  recent_sessions: {
    id: number;
    session_id: string;
    date: string;
    sentence: string;
    tamil?: string;
    signs_count: number;
    confidence: number;
  }[];
}

export interface AccessibilitySettings {
  textSize: 'sm' | 'md' | 'lg' | 'xl';
  highContrast: boolean;
  reducedMotion: boolean;
  confidenceThreshold: number;
  speechRate: number;
  speechPitch: number;
  cameraResolution: '480p' | '720p' | '1080p';
  preferredCameraId?: string;
  storeConsent: boolean;
}

export interface VideoAnalysisStep {
  step: string;
  status: 'pending' | 'running' | 'done' | 'error';
  detail: string;
}

export interface DetectedSignItem {
  sign: string;
  confidence: number;
  frame_index: number;
  timestamp_sec: number;
}

export interface VideoAnalysisResponse {
  video_id: string;
  source_type: 'upload' | 'youtube';
  status: 'completed' | 'error';
  steps: VideoAnalysisStep[];
  detected_signs: DetectedSignItem[];
  deduplicated_signs: string[];
  english_text: string;
  tamil_text: string;
  hindi_text: string;
  telugu_text: string;
  kannada_text: string;
  malayalam_text: string;
  total_frames: number;
  sampled_frames: number;
  hands_detected_frames: number;
  processing_time_sec: number;
  video_url?: string;
}
