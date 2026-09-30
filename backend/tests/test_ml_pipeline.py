import pytest
import numpy as np
from app.ml.feature_extractor import normalize_single_hand, extract_features_from_payload
from app.ml.synthetic_isl_dataset import create_hand_pose, generate_isl_dataset
from app.ml.classifier import ISLClassifier
from app.ml.temporal_smoother import TemporalSmoother
from app.utils.isl_translator import construct_natural_sentence, translate_sign

def test_feature_extractor_shape():
    # 21 mock landmarks
    mock_lms = [{"x": 0.5 + i*0.01, "y": 0.8 - i*0.02, "z": 0.0} for i in range(21)]
    single_features = normalize_single_hand(mock_lms)
    assert len(single_features) == 73, f"Expected 73 single hand features, got {len(single_features)}"
    
    payload = {"landmarks": mock_lms, "handedness": "Right"}
    features = extract_features_from_payload(payload)
    assert len(features) == 222, f"Expected 222 combined features, got {len(features)}"

def test_dataset_generation_and_classifier():
    X, y, classes = generate_isl_dataset(samples_per_sign=5)
    assert len(classes) >= 30
    assert len(X) == len(y) == len(classes) * 5
    assert X.shape[1] == 222

def test_classifier_prediction():
    classifier = ISLClassifier.get_instance()
    assert classifier.pipeline is not None
    assert len(classifier.classes) > 0

    mock_lms = create_hand_pose(thumb_state="open", index_state="open", middle_state="open", ring_state="open", pinky_state="open")
    payload = {"landmarks": mock_lms, "handedness": "Right"}
    result = classifier.predict(payload)
    
    assert "sign" in result
    assert "confidence" in result
    assert 0.0 <= result["confidence"] <= 1.0
    assert result["status"] in ["high", "medium", "low"]
    assert result["hand_detected"] is True

def test_temporal_smoother():
    smoother = TemporalSmoother(window_size=6, min_stable_frames=4, cooldown_seconds=0.5)
    
    # 3 frames of HELLO (not enough for 4 threshold)
    sign, conf, is_new = smoother.add_prediction("HELLO", 0.95)
    assert sign is None
    assert not is_new

    # 4th frame -> should trigger stable consensus
    for _ in range(3):
        sign, conf, is_new = smoother.add_prediction("HELLO", 0.95)
    
    assert sign == "HELLO"
    assert is_new is True

    # Immediate next frame of same sign should not trigger a new event (cooldown)
    sign, conf, is_new = smoother.add_prediction("HELLO", 0.95)
    assert is_new is False

def test_translation_engine():
    signs = ["HELLO", "MY", "NAME"]
    eng, tam = construct_natural_sentence(signs)
    assert "Hello, my name is" in eng
    assert "வணக்கம்" in tam
