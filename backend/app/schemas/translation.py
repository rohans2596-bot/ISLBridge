from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime

class SaveSessionRequest(BaseModel):
    session_id: Optional[str] = None
    user_name: Optional[str] = "Guest User"
    language: str = "en"
    raw_signs: List[str]
    final_text: str
    tamil_translation: Optional[str] = None
    average_confidence: float = 0.0
    duration_seconds: float = 0.0

class TranslationSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: str
    user_name: str
    language: str
    started_at: datetime
    ended_at: datetime
    raw_signs: List[str]
    final_text: str
    tamil_translation: Optional[str] = None
    average_confidence: float
    duration_seconds: float
    signs_count: int

class TranslateSentenceRequest(BaseModel):
    signs: List[str]

class TranslateSentenceResponse(BaseModel):
    raw_signs: List[str]
    english_text: str
    tamil_text: str
