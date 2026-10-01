from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database.session import get_db
from app.database.models import ModelRecord
from app.schemas.model import TrainModelRequest, ModelMetricsResponse
from app.ml.classifier import ISLClassifier
from app.ml.trainer import train_isl_model

router = APIRouter(tags=["Model Management"])

@router.get("/model/status")
def get_model_status():
    """Returns the current loaded model status, classes, and metadata."""
    classifier = ISLClassifier.get_instance()
    is_ready = classifier.pipeline is not None
    return {
        "status": "ready" if is_ready else "not_initialized",
        "model_loaded": is_ready,
        "classes_count": len(classifier.classes),
        "classes": classifier.classes,
        "metadata": classifier.metadata
    }


@router.get("/model/metrics", response_model=ModelMetricsResponse)
def get_model_metrics(db: Session = Depends(get_db)):
    """Returns comprehensive evaluation metrics of active model."""
    classifier = ISLClassifier.get_instance()
    meta = classifier.metadata
    if not meta:
        raise HTTPException(status_code=404, detail="No active model metadata available.")
    
    return ModelMetricsResponse(
        version=meta.get("version", "v1.0.0"),
        model_type=meta.get("model_type", "RandomForest"),
        classes=meta.get("classes", []),
        classes_count=meta.get("classes_count", len(meta.get("classes", []))),
        samples_count=meta.get("samples_count", 0),
        train_samples=meta.get("train_samples", 0),
        test_samples=meta.get("test_samples", 0),
        accuracy=meta.get("accuracy", 0.0),
        precision=meta.get("precision", 0.0),
        recall=meta.get("recall", 0.0),
        f1_score=meta.get("f1_score", 0.0),
        confusion_matrix=meta.get("confusion_matrix", []),
        per_class_metrics=meta.get("per_class_metrics", {}),
        created_at=meta.get("created_at", "")
    )


@router.post("/model/train", response_model=ModelMetricsResponse)
def train_model(request: TrainModelRequest, db: Session = Depends(get_db)):
    """
    Triggers actual ML training pipeline using collected dataset + synthetic samples.
    Evaluates real test split, updates active model, and returns performance metrics.
    """
    try:
        metrics = train_isl_model(
            db=db,
            model_type=request.model_type,
            samples_per_synthetic_sign=request.samples_per_synthetic_sign,
            version_tag=request.version_tag
        )
        return ModelMetricsResponse(
            version=metrics["version"],
            model_type=metrics["model_type"],
            classes=metrics["classes"],
            classes_count=metrics["classes_count"],
            samples_count=metrics["samples_count"],
            train_samples=metrics["train_samples"],
            test_samples=metrics["test_samples"],
            accuracy=metrics["accuracy"],
            precision=metrics["precision"],
            recall=metrics["recall"],
            f1_score=metrics["f1_score"],
            confusion_matrix=metrics.get("confusion_matrix", []),
            per_class_metrics=metrics.get("per_class_metrics", {}),
            created_at=metrics["created_at"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.get("/model/list")
def get_model_history(db: Session = Depends(get_db)):
    """Lists all previously trained model versions recorded in the database."""
    models = db.query(ModelRecord).order_by(ModelRecord.created_at.desc()).all()
    return [
        {
            "id": m.id,
            "version": m.version,
            "model_type": m.model_type,
            "accuracy": m.accuracy,
            "f1_score": m.f1_score,
            "classes_count": len(m.classes) if m.classes else 0,
            "is_active": m.is_active,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in models
    ]


from pydantic import BaseModel
import json
from pathlib import Path

class CustomSentenceRequest(BaseModel):
    sequence: list[str]
    en: str
    ta: str

@router.post("/model/train-sentence")
def train_custom_sentence(req: CustomSentenceRequest):
    custom_file = Path(__file__).resolve().parent.parent / "ml" / "custom_sentences.json"
    data = []
    if custom_file.exists():
        with open(custom_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            
    data.append({
        "sequence": req.sequence,
        "en": req.en,
        "ta": req.ta
    })
    
    with open(custom_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    # Trigger retraining
    from app.ml.sentence_predictor import SentencePredictionEngine
    engine = SentencePredictionEngine.get_instance()
    engine.train_models()
    
    return {"status": "success", "message": "Sentence added and model retrained!"}
