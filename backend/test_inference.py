import sys
import numpy as np
from app.ml.classifier import ISLClassifier
from app.ml.synthetic_isl_dataset import ISL_SIGN_SPECS, create_hand_pose, augment_landmarks

def create_sample_payload(sign_name: str) -> dict:
    if sign_name not in ISL_SIGN_SPECS:
        return {}
    spec = ISL_SIGN_SPECS[sign_name]
    r_conf = spec["right"]
    base_right = create_hand_pose(
        thumb_state=r_conf.get("thumb", "open"),
        index_state=r_conf.get("index", "open"),
        middle_state=r_conf.get("middle", "open"),
        ring_state=r_conf.get("ring", "open"),
        pinky_state=r_conf.get("pinky", "open"),
        hand_angle=r_conf.get("hand_angle", 0.0),
        wrist_y_offset=r_conf.get("wrist_y_offset", 0.0),
    )
    aug_right = augment_landmarks(base_right, noise_std=0.005)
    
    payload = {}
    if spec.get("both_hands", False) and spec.get("left"):
        l_conf = spec["left"]
        base_left = create_hand_pose(
            thumb_state=l_conf.get("thumb", "open"),
            index_state=l_conf.get("index", "open"),
            middle_state=l_conf.get("middle", "open"),
            ring_state=l_conf.get("ring", "open"),
            pinky_state=l_conf.get("pinky", "open"),
            hand_angle=l_conf.get("hand_angle", 0.0),
            wrist_y_offset=l_conf.get("wrist_y_offset", 0.0),
        )
        for lm in base_left:
            lm["x"] -= 0.35
        aug_left = augment_landmarks(base_left, noise_std=0.005)
        payload["hands"] = [
            {"landmarks": aug_left, "handedness": "Left"},
            {"landmarks": aug_right, "handedness": "Right"}
        ]
    else:
        payload["hands"] = [
            {"landmarks": aug_right, "handedness": "Right"}
        ]
    return payload

def main():
    print("================================================================================")
    print("                ISLBridge AI - Model Real-Time Inference Runner                 ")
    print("================================================================================")
    
    classifier = ISLClassifier.get_instance()
    print(f"Model Architecture : {classifier.metadata.get('model_type', 'RandomForestClassifier')}")
    print(f"Model Version      : {classifier.metadata.get('version', 'v2.0.0-rf-biomech')}")
    print(f"Feature Dimension  : 256 Features (Biomechanical + Spatial Relations)")
    print(f"Trained Classes    : {len(classifier.classes)} Indian Sign Language Gestures")
    print(f"Baseline Accuracy  : {classifier.metadata.get('accuracy', 0.0) * 100:.2f}%\n")

    test_signs = [
        "A", "B", "C", "D", "E", "F", "HELLO", "THANK YOU", "HELP", "YES", "NO", "WHY", "WATER", "STOP"
    ]
    available_tests = [s for s in test_signs if s in classifier.classes]

    print(f"{'Target Sign':<12} | {'Predicted':<12} | {'Confidence':<10} | {'Band':<8} | {'Top-3 Probabilities'}")
    print("-" * 80)

    correct = 0
    for sign in available_tests:
        payload = create_sample_payload(sign)
        res = classifier.predict(payload)
        
        pred = res["sign"]
        conf = res["confidence"]
        status = res["status"]
        top_k = ", ".join([f"{item['sign']} ({item['confidence']*100:.0f}%)" for item in res.get("top_k", [])])
        
        is_match = (pred == sign)
        if is_match:
            correct += 1
        indicator = "OK" if is_match else "ALT"
        
        print(f"{sign:<12} | {pred:<12} | {conf*100:>5.1f}%     | {status:<8} | {top_k} [{indicator}]")

    print("-" * 80)
    print(f"Inference Test Score: {correct}/{len(available_tests)} matches ({correct/len(available_tests)*100:.1f}%)")
    print("================================================================================")

if __name__ == "__main__":
    main()
