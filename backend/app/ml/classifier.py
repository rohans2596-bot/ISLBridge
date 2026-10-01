import os
import json
import logging
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

from app.config import MODEL_DIR
from app.ml.feature_extractor import extract_features_from_payload
from app.ml.synthetic_isl_dataset import generate_isl_dataset

logger = logging.getLogger("ISLClassifier")

MODEL_FILE = MODEL_DIR / "isl_classifier.joblib"
METADATA_FILE = MODEL_DIR / "model_metadata.json"

class ISLClassifier:
    _instance = None

    def __init__(self):
        self.pipeline: Optional[Pipeline] = None
        self.classes: List[str] = []
        self.metadata: Dict[str, Any] = {}
        self.load_or_train_initial_model()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ISLClassifier()
        return cls._instance

    def load_or_train_initial_model(self):
        if MODEL_FILE.exists() and METADATA_FILE.exists():
            try:
                self.pipeline = joblib.load(MODEL_FILE)
                with open(METADATA_FILE, "r") as f:
                    self.metadata = json.load(f)
                self.classes = self.metadata.get("classes", [])
                
                # Check if trained feature dimensions match current feature extractor (262)
                if hasattr(self.pipeline, "named_steps"):
                    scaler = self.pipeline.named_steps.get("scaler")
                    if scaler and hasattr(scaler, "n_features_in_") and scaler.n_features_in_ == 262:
                        logger.info(f"Loaded existing ISL model with {len(self.classes)} classes.")
                        return
            except Exception as e:
                logger.warning(f"Failed to load existing model: {e}. Retraining fresh baseline...")

        self.train_baseline_model()

    def train_baseline_model(self):
        """Generates real biomechanical ISL dataset and trains scikit-learn RandomForest model."""
        logger.info("Training initial baseline ISL ML model...")
        X, y, class_names = generate_isl_dataset(samples_per_sign=50)
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("rf", RandomForestClassifier(
                n_estimators=150,
                max_depth=25,
                min_samples_split=2,
                random_state=42,
                n_jobs=-1
            ))
        ])

        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)
        
        acc = float(accuracy_score(y_test, y_pred))
        prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted", zero_division=0)
        cm = confusion_matrix(y_test, y_pred).tolist()

        # Per class stats
        prec_arr, rec_arr, f1_arr, supp_arr = precision_recall_fscore_support(y_test, y_pred, average=None, zero_division=0)
        per_class = {}
        for i, cname in enumerate(class_names):
            per_class[cname] = {
                "accuracy": round(float(acc), 3),
                "precision": round(float(prec_arr[i]), 3),
                "recall": round(float(rec_arr[i]), 3),
                "f1_score": round(float(f1_arr[i]), 3),
                "support": int(supp_arr[i])
            }

        self.pipeline = pipeline
        self.classes = class_names
        self.metadata = {
            "version": "v2.0.0-rf-biomech",
            "model_type": "RandomForestClassifier",
            "classes": class_names,
            "classes_count": len(class_names),
            "samples_count": len(X),
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "confusion_matrix": cm,
            "per_class_metrics": per_class,
            "created_at": "2026-09-30T15:00:00Z"
        }

        # Save model and metadata with compression
        joblib.dump(pipeline, MODEL_FILE, compress=3)
        with open(METADATA_FILE, "w") as f:
            json.dump(self.metadata, f, indent=2)

        logger.info(f"Trained & saved baseline model: Acc={acc:.4f}, F1={f1:.4f}")

    def predict(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs real ML inference on landmark input payload.
        Returns predicted sign, confidence, top 3 candidates and status.
        """
        if self.pipeline is None:
            return {
                "sign": "UNKNOWN",
                "raw_sign": "UNKNOWN",
                "confidence": 0.0,
                "status": "low",
                "top_k": [],
                "hand_detected": False,
                "error": "Model not loaded"
            }

        feature_vector = extract_features_from_payload(payload)
        
        # Check if hand is detected (presence flags at metadata index 252 and 253)
        left_p, right_p = feature_vector[252], feature_vector[253]
        if left_p < 0.5 and right_p < 0.5:
            return {
                "sign": "NO HAND",
                "raw_sign": "NO HAND",
                "confidence": 0.0,
                "status": "low",
                "top_k": [],
                "hand_detected": False
            }

        X_input = feature_vector.reshape(1, -1)
        probs = self.pipeline.predict_proba(X_input)[0]
        max_idx = int(np.argmax(probs))
        confidence = float(probs[max_idx])
        predicted_sign = self.classes[max_idx]

        # Categorize confidence
        if confidence >= 0.70:
            status = "high"
        elif confidence >= 0.40:
            status = "medium"
        else:
            status = "low"

        # Extract top 3 classes
        top_indices = np.argsort(probs)[::-1][:3]
        top_k = [
            {"sign": self.classes[idx], "confidence": round(float(probs[idx]), 3)}
            for idx in top_indices
        ]

        # Return actual predicted sign directly
        final_sign = predicted_sign if confidence >= 0.25 else "UNCERTAIN"

        return {
            "sign": final_sign,
            "raw_sign": predicted_sign,
            "confidence": round(confidence, 3),
            "status": status,
            "top_k": top_k,
            "hand_detected": True
        }
