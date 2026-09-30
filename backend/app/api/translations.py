import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.database.models import TranslationSession, RecognizedSignLog
from app.schemas.translation import SaveSessionRequest, TranslationSessionResponse

router = APIRouter(tags=["Translations History"])

@router.post("/translation/save", response_model=TranslationSessionResponse)
def save_translation_session(request: SaveSessionRequest, db: Session = Depends(get_db)):
    """Saves a completed translation session and recognized signs into database."""
    session_uid = request.session_id or f"session_{uuid.uuid4().hex[:10]}"
    
    session = TranslationSession(
        session_id=session_uid,
        user_name=request.user_name or "Guest User",
        language=request.language,
        started_at=datetime.utcnow(),
        ended_at=datetime.utcnow(),
        raw_signs=request.raw_signs,
        final_text=request.final_text,
        tamil_translation=request.tamil_translation,
        average_confidence=request.average_confidence,
        duration_seconds=request.duration_seconds,
        signs_count=len(request.raw_signs)
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Save individual recognized sign logs
    for s_name in request.raw_signs:
        log = RecognizedSignLog(
            session_id=session.id,
            sign_name=s_name,
            confidence=request.average_confidence,
            status="high" if request.average_confidence >= 0.80 else "medium",
            timestamp=datetime.utcnow()
        )
        db.add(log)
    db.commit()

    return session


@router.get("/translation/history", response_model=List[TranslationSessionResponse])
def get_translation_history(limit: int = 50, db: Session = Depends(get_db)):
    """Returns past translation sessions sorted by newest first."""
    return db.query(TranslationSession).order_by(TranslationSession.started_at.desc()).limit(limit).all()


@router.delete("/translation/history/{id}")
def delete_translation_history(id: int, db: Session = Depends(get_db)):
    """Deletes a specific translation session from history."""
    session = db.query(TranslationSession).filter(TranslationSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    return {"status": "success", "message": f"Session {id} deleted."}
