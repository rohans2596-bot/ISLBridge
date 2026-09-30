import os
import json
import logging
import joblib
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

from app.config import MODEL_DIR
from app.database.models import DatasetSample, Sign, ModelRecord
from app.ml.synthetic_isl_dataset import generate_isl_dataset
from app.ml.classifier import ISLClassifier, MODEL_FILE, METADATA_FILE

logger = logging.getLogger("ISLTrainer")

def train_isl_model(
    db: Optional[Session] = None,
    model_type: str = "RandomForest",
    samples_per_synthetic_sign: int = 40,
    version_tag: Optional[str] = None
) -> Dict[str, Any]:
    """
    Trains a real ISL gesture recognition model combining synthetic baseline
    with any user-collected samples stored in the database.
    Evaluates real metrics and updates active model.
    """
    logger.info(f"Starting model training (type: {model_type})...")

    # 1. Base synthetic samples
    X_syn, y_syn, class_names = generate_isl_dataset(samples_per_sign=samples_per_synthetic_sign)
    class_to_idx = {name: i for i, name in enumerate(class_names)}
    
    X_all = list(X_syn)
    y_all = list(y_syn)

    # 2. Add custom collected samples from DB if available
    if db is not None:
        db_samples = db.query(DatasetSample).all()
        for sample in db_samples:
            s_name = sample.sign_name.upper()
            if s_name not in class_to_idx:
                class_to_idx[s_name] = len(class_names)
                class_names.append(s_name)
            
            feat = np.array(sample.features, dtype=np.float32)
            if len(feat) == 222:
                X_all.append(feat)
                y_all.append(class_to_idx[s_name])

    X = np.array(X_all, dtype=np.float32)
    y = np.array(y_all, dtype=np.int64)

    # 3. Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 4. Instantiate chosen algorithm
    if model_type.lower() == "mlp":
        clf = MLPClassifier(hidden_layer_sizes=(128, 64), max_iter=300, random_state=42)
    elif model_type.lower() == "gradientboosting":
        clf = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
    else:
        clf = RandomForestClassifier(n_estimators=120, max_depth=22, min_samples_split=2, random_state=42, n_jobs=-1)

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", clf)
    ])

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    # 5. Calculate real evaluation metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted", zero_division=0)
    cm = confusion_matrix(y_test, y_pred).tolist()

    prec_arr, rec_arr, f1_arr, supp_arr = precision_recall_fscore_support(
        y_test, y_pred, average=None, zero_division=0
    )
    per_class = {}
    for i, cname in enumerate(class_names):
        if i < len(prec_arr):
            per_class[cname] = {
                "accuracy": round(float(acc), 3),
                "precision": round(float(prec_arr[i]), 3),
                "recall": round(float(rec_arr[i]), 3),
                "f1_score": round(float(f1_arr[i]), 3),
                "support": int(supp_arr[i])
            }

    version = version_tag or f"v1.{datetime.utcnow().strftime('%Y%m%d%H%M')}-{model_type.lower()[:3]}"

    metadata = {
        "version": version,
        "model_type": model_type,
        "classes": class_names,
        "classes_count": len(class_names),
        "samples_count": len(X),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "confusion_matrix": cm,
        "per_class_metrics": per_class,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    # Save to disk
    joblib.dump(pipeline, MODEL_FILE)
    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f, indent=2)

    # Record in DB if session available
    if db is not None:
        # Mark previous active models as inactive
        db.query(ModelRecord).update({"is_active": False})
        
        new_model_rec = ModelRecord(
            version=version,
            model_type=model_type,
            model_path=str(MODEL_FILE),
            accuracy=round(float(acc), 4),
            precision=round(float(prec), 4),
            recall=round(float(rec), 4),
            f1_score=round(float(f1), 4),
            classes=class_names,
            confusion_matrix=cm,
            per_class_metrics=per_class,
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.add(new_model_rec)
        db.commit()

    # Hot-swap runtime model in singleton
    classifier_instance = ISLClassifier.get_instance()
    classifier_instance.pipeline = pipeline
    classifier_instance.classes = class_names
    classifier_instance.metadata = metadata

    logger.info(f"Model {version} successfully trained! Acc={acc:.4f}, F1={f1:.4f}")
    return metadata
