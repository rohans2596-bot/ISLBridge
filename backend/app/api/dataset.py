from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database.session import get_db
from app.database.models import Sign, DatasetSample
from app.schemas.dataset import CreateSignRequest, SignResponse, AddSampleRequest, SampleResponse
from app.ml.feature_extractor import extract_features_from_payload

router = APIRouter(tags=["Dataset Management"])

@router.get("/signs", response_model=List[SignResponse])
def get_all_signs(db: Session = Depends(get_db)):
    """Returns list of all configured ISL signs."""
    return db.query(Sign).order_by(Sign.name).all()


@router.post("/dataset/create", response_model=SignResponse)
def create_sign(request: CreateSignRequest, db: Session = Depends(get_db)):
    """Creates a new ISL vocabulary class in the database."""
    name_clean = request.name.upper().strip()
    existing = db.query(Sign).filter(Sign.name == name_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Sign '{name_clean}' already exists.")

    new_sign = Sign(
        name=name_clean,
        display_name=request.display_name,
        gesture_type=request.gesture_type,
        description=request.description,
        language=request.language,
        is_active=True,
        samples_count=0
    )
    db.add(new_sign)
    db.commit()
    db.refresh(new_sign)
    return new_sign


@router.post("/dataset/sample", response_model=SampleResponse)
def add_sample(request: AddSampleRequest, db: Session = Depends(get_db)):
    """
    Saves a captured landmark frame sample to the dataset for model training.
    """
    name_clean = request.sign_name.upper().strip()
    sign = db.query(Sign).filter(Sign.name == name_clean).first()
    if not sign:
        sign = Sign(
            name=name_clean,
            display_name=name_clean.title(),
            gesture_type="static",
            description="User-collected sign",
            is_active=True,
            samples_count=0
        )
        db.add(sign)
        db.commit()
        db.refresh(sign)

    payload = {"landmarks": request.landmarks, "hands": request.hands, "handedness": request.hand_type}
    features = extract_features_from_payload(payload).tolist()

    sample = DatasetSample(
        sign_id=sign.id,
        sign_name=name_clean,
        hand_type=request.hand_type,
        features=features
    )
    db.add(sample)
    
    # Update sample count
    sign.samples_count = (sign.samples_count or 0) + 1
    db.commit()
    db.refresh(sample)
    return sample


@router.get("/dataset/stats")
def get_dataset_stats(db: Session = Depends(get_db)):
    """Returns dataset summary stats: total signs, custom samples, distribution."""
    total_signs = db.query(Sign).count()
    custom_samples = db.query(DatasetSample).count()
    
    signs = db.query(Sign).all()
    distribution = [
        {
            "name": s.name,
            "display_name": s.display_name,
            "samples": s.samples_count or 0,
            "type": s.gesture_type,
            "is_active": s.is_active
        }
        for s in signs
    ]
    
    return {
        "total_signs": total_signs,
        "custom_samples": custom_samples,
        "distribution": distribution
    }
