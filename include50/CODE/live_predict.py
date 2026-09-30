"""
CODE/live_predict.py
Real-time webcam inference with sliding window, temporal stabilization,
word buffer accumulation, and natural sentence formation.
Supports model_asset_buffer for robust cross-platform path compatibility.
"""
import time
import sys
import json
import collections
import cv2
import numpy as np
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent
PT_MODEL_PATH = BASE_DIR / "MODELS" / "include50_lstm.pt"
ONNX_MODEL_PATH = BASE_DIR / "MODELS" / "include50_lstm.onnx"
LABEL_JSON = BASE_DIR / "KEYPOINTS" / "labels.json"
HAND_TASK_PATH = REPO_ROOT / "backend" / "data" / "models" / "mediapipe_models" / "hand_landmarker.task"

# Rule-based ISL sentence grammar mapping
SENTENCE_RULES = {
    ("I", "Bank"): "I am going to the bank.",
    ("Hello", "Teacher"): "Hello, teacher! Good to see you.",
    ("Good Morning", "Teacher"): "Good morning teacher.",
    ("Thank you", "Doctor"): "Thank you, doctor.",
    ("I", "Shop"): "I am visiting the shop.",
    ("Time", "What"): "What is the time right now?",
    ("Father", "Brother"): "My father and brother are here.",
    ("Good", "Happy"): "I am feeling good and happy."
}

def synthesize_sentence(word_buffer: list) -> str:
    if not word_buffer:
        return ""
    if len(word_buffer) >= 2:
        pair = (word_buffer[-2], word_buffer[-1])
        if pair in SENTENCE_RULES:
            return SENTENCE_RULES[pair]
    return " ".join(word_buffer) + "."

class ModelRunner:
    def __init__(self, onnx_path, pt_path):
        self.use_onnx = False
        try:
            import onnxruntime as ort
            if onnx_path.exists():
                self.session = ort.InferenceSession(str(onnx_path))
                self.input_name = self.session.get_inputs()[0].name
                self.use_onnx = True
                print("[*] Loaded ONNX model for high-performance CPU inference.")
        except Exception as e:
            pass

        if not self.use_onnx:
            import torch
            import torch.nn as nn
            class Include50LSTM(nn.Module):
                def __init__(self, input_dim=134, hidden_dim=64, num_classes=50):
                    super().__init__()
                    self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers=2, batch_first=True, dropout=0.2)
                    self.fc1 = nn.Linear(hidden_dim, 64)
                    self.relu = nn.ReLU()
                    self.dropout = nn.Dropout(0.3)
                    self.fc2 = nn.Linear(64, num_classes)
                def forward(self, x):
                    out, _ = self.lstm(x)
                    dense1 = self.relu(self.fc1(out[:, -1, :]))
                    return self.fc2(dense1)
            self.model = Include50LSTM(134, 64, 50)
            if pt_path.exists():
                self.model.load_state_dict(torch.load(str(pt_path), map_location="cpu"))
            self.model.eval()
            print("[*] Loaded PyTorch model checkpoint.")

    def predict(self, seq_30x134: np.ndarray) -> np.ndarray:
        inp = np.expand_dims(seq_30x134, axis=0).astype(np.float32)
        if self.use_onnx:
            outputs = self.session.run(None, {self.input_name: inp})
            logits = outputs[0][0]
            exp_logits = np.exp(logits - np.max(logits))
            return exp_logits / exp_logits.sum()
        else:
            import torch
            with torch.no_grad():
                tensor_in = torch.tensor(inp)
                logits = self.model(tensor_in)
                probs = torch.softmax(logits, dim=1).numpy()[0]
                return probs

class VisionTracker:
    def __init__(self):
        self.landmarker = None
        try:
            import mediapipe as mp
            from mediapipe.tasks import python
            from mediapipe.tasks.python import vision
            if HAND_TASK_PATH.exists():
                with open(HAND_TASK_PATH, "rb") as f:
                    model_bytes = f.read()
                base_options = python.BaseOptions(model_asset_buffer=model_bytes)
                options = vision.HandLandmarkerOptions(
                    base_options=base_options,
                    num_hands=2,
                    min_hand_detection_confidence=0.5,
                    min_hand_presence_confidence=0.5
                )
                self.landmarker = vision.HandLandmarker.create_from_options(options)
                print("[*] MediaPipe HandLandmarker Vision Task initialized from buffer.")
        except Exception as e:
            print(f"[!] MediaPipe task error: {e}")

    def process(self, rgb_frame: np.ndarray):
        lh_feat = np.zeros(42, dtype=np.float32)
        rh_feat = np.zeros(42, dtype=np.float32)
        pose_feat = np.zeros(50, dtype=np.float32)

        if self.landmarker:
            try:
                import mediapipe as mp
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                detection_result = self.landmarker.detect(mp_image)

                if detection_result.hand_landmarks:
                    for idx, hand_lms in enumerate(detection_result.hand_landmarks):
                        handedness = "Right"
                        if detection_result.handedness and idx < len(detection_result.handedness):
                            handedness = detection_result.handedness[idx][0].category_name

                        flat = np.array([[lm.x, lm.y] for lm in hand_lms], dtype=np.float32).flatten()
                        if handedness == "Left":
                            lh_feat = flat
                        else:
                            rh_feat = flat
            except Exception:
                pass

        # Upper body reference
        pose_feat[0:2] = [0.5, 0.2]
        pose_feat[22:24] = [0.35, 0.4]
        pose_feat[24:26] = [0.65, 0.4]
        if np.any(lh_feat):
            pose_feat[30:32] = lh_feat[0:2]
        if np.any(rh_feat):
            pose_feat[32:34] = rh_feat[0:2]

        return np.concatenate([pose_feat, lh_feat, rh_feat])

def main():
    print("=" * 65)
    print("Starting INCLUDE-50 Live Webcam ISL Recognition")
    print("=" * 65)

    with open(LABEL_JSON, "r", encoding="utf-8") as f:
        meta = json.load(f)
    classes = meta["classes"]

    runner = ModelRunner(ONNX_MODEL_PATH, PT_MODEL_PATH)
    tracker = VisionTracker()

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[!] Cannot open camera device 0. Trying device 1...")
        cap = cv2.VideoCapture(1)

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    frame_buffer = collections.deque(maxlen=30)
    word_buffer = []
    
    last_detected_sign = "Ready"
    last_confidence = 0.0
    last_confirmed_time = 0
    COOLDOWN_SECONDS = 1.5
    CONFIDENCE_THRESHOLD = 0.65

    recent_predictions = collections.deque(maxlen=7)

    print("[*] Stream active. Controls: 'q' to quit, 'c' to clear buffer.")

    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        feat_134 = tracker.process(rgb)
        frame_buffer.append(feat_134)

        if len(frame_buffer) == 30:
            probs = runner.predict(np.array(frame_buffer))
            pred_idx = int(np.argmax(probs))
            conf = float(probs[pred_idx])

            if conf >= CONFIDENCE_THRESHOLD:
                recent_predictions.append(classes[pred_idx])
            else:
                recent_predictions.append("None")

            if len(recent_predictions) == 7:
                counts = collections.Counter(recent_predictions)
                top_sign, top_count = counts.most_common(1)[0]
                
                if top_sign != "None" and top_count >= 5:
                    last_detected_sign = top_sign
                    last_confidence = conf

                    current_time = time.time()
                    if (current_time - last_confirmed_time) > COOLDOWN_SECONDS:
                        if not word_buffer or word_buffer[-1] != top_sign:
                            word_buffer.append(top_sign)
                            last_confirmed_time = current_time

        # Draw UI overlay
        cv2.rectangle(frame, (20, 20), (620, 165), (250, 247, 242), -1)
        cv2.rectangle(frame, (20, 20), (620, 165), (210, 210, 210), 2)

        cv2.putText(frame, f"Sign: {last_detected_sign}", (40, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.95, (15, 23, 42), 2)
        cv2.putText(frame, f"Confidence: {last_confidence * 100:.1f}%", (40, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (2, 132, 199), 2)
        
        buf_str = " -> ".join(word_buffer[-4:]) if word_buffer else "[Empty]"
        cv2.putText(frame, f"Buffer: {buf_str}", (40, 135), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (100, 116, 139), 1)

        sentence_text = synthesize_sentence(word_buffer)
        cv2.rectangle(frame, (20, 630), (1260, 700), (15, 23, 42), -1)
        cv2.putText(frame, f"Synthesized: {sentence_text}", (40, 675), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        cv2.imshow("INCLUDE-50 Real-time ISL Recognition", frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('c'):
            word_buffer.clear()

        frame_count += 1

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
