from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class TrainModelRequest(BaseModel):
    model_type: str = "RandomForest"  # 'RandomForest', 'MLP', 'GradientBoosting'
    samples_per_synthetic_sign: int = 40
    version_tag: Optional[str] = None

class ModelMetricsResponse(BaseModel):
    version: str
    model_type: str
    classes: List[str]
    classes_count: int
    samples_count: int
    train_samples: Optional[int] = None
    test_samples: Optional[int] = None
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: Optional[List[List[int]]] = None
    per_class_metrics: Optional[Dict[str, Any]] = None
    created_at: str
    is_active: bool = True
