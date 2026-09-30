from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime

class CreateSignRequest(BaseModel):
    name: str
    display_name: str
    gesture_type: str = "static"  # 'static' or 'dynamic'
    description: Optional[str] = None
    language: str = "en"

class SignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    display_name: str
    gesture_type: str
    description: Optional[str] = None
    language: str
    is_active: bool
    samples_count: int
    created_at: Optional[datetime] = None

class AddSampleRequest(BaseModel):
    sign_name: str
    hand_type: str = "right"
    landmarks: Optional[List[Dict[str, float]]] = None
    hands: Optional[List[Dict[str, Any]]] = None

class SampleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sign_name: str
    hand_type: str
    created_at: datetime
