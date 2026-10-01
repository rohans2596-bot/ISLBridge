from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class LandmarkPoint(BaseModel):
    x: float
    y: float
    z: float = 0.0

class HandData(BaseModel):
    landmarks: List[LandmarkPoint]
    handedness: str = "Right"

class PredictRequest(BaseModel):
    landmarks: Optional[List[LandmarkPoint]] = None
    handedness: Optional[str] = "Right"
    hands: Optional[List[HandData]] = None
    left_hand: Optional[List[LandmarkPoint]] = None
    right_hand: Optional[List[LandmarkPoint]] = None
    motion: Optional[Dict[str, float]] = None
    timestamp: Optional[str] = None

class TopKPrediction(BaseModel):
    sign: str
    confidence: float

class PredictResponse(BaseModel):
    sign: str
    raw_sign: str
    confidence: float
    status: str  # 'high', 'medium', 'low'
    language: str = "en"
    tamil_translation: Optional[str] = None
    top_k: List[TopKPrediction] = []
    hand_detected: bool = True
    is_smoothed_trigger: bool = False
    error: Optional[str] = None
