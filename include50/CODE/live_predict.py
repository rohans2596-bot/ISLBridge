"""
CODE/live_predict.py
Real-time webcam inference with sliding window, temporal stabilization,
word buffer accumulation, and natural sentence formation.
"""
import time
import sys
import json
import collections
import cv2
import numpy as np
import mediapipe as mp
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).resolve().parent.parent
ONNX_MODEL_PATH = BASE_DIR / "MODELS" / "include50_lstm.onnx"
PT_MODEL_PATH = BASE_DIR / "MODELS" / "include50_lstm.pt"
LABEL_JSON = BASE_DIR / "KEYPOINTS" / "labels.json"

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
            print(f"[!] ONNX Runtime init fallback: {e}")

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

def main():
    print("=" * 65)
    print("Starting INCLUDE-50 Live Webcam ISL Recognition")
    print("=" * 65)

    with open(LABEL_JSON, "r", encoding="utf-8") as f:
        meta = json.load(f)
    classes = meta["classes"]

    runner = ModelRunner(ONNX_MODEL_PATH, PT_MODEL_PATH)
    mp_holistic = mp.solutions.holistic
    mp_draw = mp.solutions.drawing_utils

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    frame_buffer = collections.deque(maxlen=30)
    word_buffer = []
    
    last_detected_sign = "None"
    last_confidence = 0.0
    last_confirmed_time = 0
    COOLDOWN_SECONDS = 1.5
    CONFIDENCE_THRESHOLD = 0.70

    recent_predictions = collections.deque(maxlen=7)

    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.flip(frame, 1)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb.flags.writeable = False
            results = holistic.process(rgb)
            rgb.flags.writeable = True

            # 134 Features
            if results.pose_landmarks:
                pose = np.array([[lm.x, lm.y] for lm in results.pose_landmarks.landmark[:25]], dtype=np.float32).flatten()
            else:
                pose = np.zeros(50, dtype=np.float32)

            if results.left_hand_landmarks:
                lh = np.array([[lm.x, lm.y] for lm in results.left_hand_landmarks.landmark], dtype=np.float32).flatten()
            else:
                lh = np.zeros(42, dtype=np.float32)

            if results.right_hand_landmarks:
                rh = np.array([[lm.x, lm.y] for lm in results.right_hand_landmarks.landmark], dtype=np.float32).flatten()
            else:
                rh = np.zeros(42, dtype=np.float32)

            feat_134 = np.concatenate([pose, lh, rh])
            frame_buffer.append(feat_134)

            # Predict when buffer has 30 frames
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

            # Draw visual landmarks
            if results.left_hand_landmarks:
                mp_draw.draw_landmarks(frame, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
            if results.right_hand_landmarks:
                mp_draw.draw_landmarks(frame, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS)

            # Top UI Card
            cv2.rectangle(frame, (20, 20), (620, 165), (250, 247, 242), -1)
            cv2.rectangle(frame, (20, 20), (620, 165), (210, 210, 210), 2)

            cv2.putText(frame, f"Sign: {last_detected_sign}", (40, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.95, (15, 23, 42), 2)
            cv2.putText(frame, f"Confidence: {last_confidence * 100:.1f}%", (40, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (2, 132, 199), 2)
            
            buf_str = " -> ".join(word_buffer[-4:]) if word_buffer else "[Empty]"
            cv2.putText(frame, f"Buffer: {buf_str}", (40, 135), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (100, 116, 139), 1)

            # Bottom Sentence Output Card
            sentence_text = synthesize_sentence(word_buffer)
            cv2.rectangle(frame, (20, 630), (1260, 700), (15, 23, 42), -1)
            cv2.putText(frame, f"Synthesized Text: {sentence_text}", (40, 675), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

            cv2.imshow("INCLUDE-50 Real-time ISL Recognition", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('c'):
                word_buffer.clear()

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
