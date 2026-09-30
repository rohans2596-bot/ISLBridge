from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Sign(Base):
    __tablename__ = "signs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    language = Column(String(20), default="en")
    gesture_type = Column(String(20), default="static")  # 'static' or 'dynamic'
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    samples_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    samples = relationship("DatasetSample", back_populates="sign", cascade="all, delete-orphan")


class DatasetSample(Base):
    __tablename__ = "dataset_samples"

    id = Column(Integer, primary_key=True, index=True)
    sign_id = Column(Integer, ForeignKey("signs.id", ondelete="CASCADE"), nullable=True)
    sign_name = Column(String(50), index=True, nullable=False)
    hand_type = Column(String(20), default="right")  # 'left', 'right', 'both'
    features = Column(JSON, nullable=False)  # list of floats (normalized features)
    created_at = Column(DateTime, default=datetime.utcnow)

    sign = relationship("Sign", back_populates="samples")


class ModelRecord(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(50), unique=True, index=True, nullable=False)
    model_type = Column(String(50), default="RandomForest")
    model_path = Column(String(255), nullable=False)
    accuracy = Column(Float, default=0.0)
    precision = Column(Float, default=0.0)
    recall = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    classes = Column(JSON, nullable=False)  # list of sign names
    confusion_matrix = Column(JSON, nullable=True)  # 2D matrix
    per_class_metrics = Column(JSON, nullable=True)  # dict of per-class stats
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class TranslationSession(Base):
    __tablename__ = "translation_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, index=True)
    user_name = Column(String(100), default="Guest User")
    language = Column(String(20), default="en")
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, default=datetime.utcnow)
    raw_signs = Column(JSON, default=list)  # list of strings
    final_text = Column(Text, nullable=False)
    tamil_translation = Column(Text, nullable=True)
    average_confidence = Column(Float, default=0.0)
    duration_seconds = Column(Float, default=0.0)
    signs_count = Column(Integer, default=0)

    recognized_logs = relationship("RecognizedSignLog", back_populates="session", cascade="all, delete-orphan")


class RecognizedSignLog(Base):
    __tablename__ = "recognized_signs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("translation_sessions.id", ondelete="CASCADE"), nullable=True)
    sign_name = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    status = Column(String(20), default="high")  # 'high', 'medium', 'low'
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("TranslationSession", back_populates="recognized_logs")
