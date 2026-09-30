from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.database.session import get_db
from app.database.models import TranslationSession, RecognizedSignLog, Sign, ModelRecord

router = APIRouter(tags=["Analytics"])

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    """
    Computes real analytics from database tables:
    - total translations
    - total signs recognized
    - average confidence
    - top recognized signs distribution
    - confidence distribution breakdown
    - daily translation trend
    """
    total_translations = db.query(TranslationSession).count()
    total_signs = db.query(RecognizedSignLog).count()
    
    avg_conf_query = db.query(func.avg(TranslationSession.average_confidence)).scalar()
    avg_confidence = round(float(avg_conf_query) * 100, 1) if avg_conf_query else 0.0

    active_models_count = db.query(ModelRecord).filter(ModelRecord.is_active == True).count()
    supported_signs_count = db.query(Sign).filter(Sign.is_active == True).count()

    # Top signs recognized
    sign_counts = (
        db.query(RecognizedSignLog.sign_name, func.count(RecognizedSignLog.id).label("count"))
        .group_by(RecognizedSignLog.sign_name)
        .order_by(func.count(RecognizedSignLog.id).desc())
        .limit(8)
        .all()
    )
    top_signs = [{"sign": s[0], "count": s[1]} for s in sign_counts]

    # Confidence distribution
    high_conf = db.query(RecognizedSignLog).filter(RecognizedSignLog.confidence >= 0.85).count()
    med_conf = db.query(RecognizedSignLog).filter(RecognizedSignLog.confidence >= 0.60, RecognizedSignLog.confidence < 0.85).count()
    low_conf = db.query(RecognizedSignLog).filter(RecognizedSignLog.confidence < 0.60).count()

    conf_distribution = [
        {"name": "High (>= 85%)", "count": high_conf, "color": "#22C55E"},
        {"name": "Medium (60-84%)", "count": med_conf, "color": "#EAB308"},
        {"name": "Low (< 60%)", "count": low_conf, "color": "#EF4444"}
    ]

    # Recent translations timeline (past 7 days or sessions list)
    recent_sessions = (
        db.query(TranslationSession)
        .order_by(TranslationSession.started_at.desc())
        .limit(10)
        .all()
    )
    sessions_data = [
        {
            "id": s.id,
            "session_id": s.session_id,
            "date": s.started_at.strftime("%Y-%m-%d %H:%M") if s.started_at else "",
            "sentence": s.final_text,
            "tamil": s.tamil_translation,
            "signs_count": s.signs_count,
            "confidence": round((s.average_confidence or 0.0) * 100, 1)
        }
        for s in recent_sessions
    ]

    return {
        "summary": {
            "total_translations": total_translations,
            "total_signs_recognized": total_signs,
            "average_confidence": avg_confidence,
            "supported_signs_count": supported_signs_count,
            "active_models_count": active_models_count
        },
        "top_signs": top_signs,
        "confidence_distribution": conf_distribution,
        "recent_sessions": sessions_data
    }
