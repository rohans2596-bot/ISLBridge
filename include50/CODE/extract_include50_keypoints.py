"""
CODE/extract_include50_keypoints.py
Extracts 134-dimensional MediaPipe Pose + Hands features per frame
for all 958 INCLUDE-50 videos and caches them into individual .npy files.
"""
import os
import sys
import cv2
import numpy as np
import mediapipe as mp
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(os.environ.get("ISL_HACKATHON_DIR", Path(__file__).resolve().parent.parent))
INCLUDE_50_DIR = BASE_DIR / "INCLUDE_50"
KEYPOINTS_CACHE_DIR = BASE_DIR / "KEYPOINTS" / "raw_cache"
KEYPOINTS_CACHE_DIR.mkdir(parents=True, exist_ok=True)

mp_holistic = mp.solutions.holistic

def extract_frame_landmarks(results) -> np.ndarray:
    """Extracts 134 features: 25 pose (x,y) + 21 left hand (x,y) + 21 right hand (x,y)"""
    # 1. Pose (First 25 landmarks: head, shoulders, arms, wrists, hips)
    if results.pose_landmarks:
        pose = np.array([[lm.x, lm.y] for lm in results.pose_landmarks.landmark[:25]], dtype=np.float32).flatten()
    else:
        pose = np.zeros(25 * 2, dtype=np.float32)

    # 2. Left hand (21 landmarks)
    if results.left_hand_landmarks:
        lh = np.array([[lm.x, lm.y] for lm in results.left_hand_landmarks.landmark], dtype=np.float32).flatten()
    else:
        lh = np.zeros(21 * 2, dtype=np.float32)

    # 3. Right hand (21 landmarks)
    if results.right_hand_landmarks:
        rh = np.array([[lm.x, lm.y] for lm in results.right_hand_landmarks.landmark], dtype=np.float32).flatten()
    else:
        rh = np.zeros(21 * 2, dtype=np.float32)

    return np.concatenate([pose, lh, rh]) # Total 134

def process_video(video_path: Path, holistic) -> np.ndarray:
    cap = cv2.VideoCapture(str(video_path))
    frame_features = []
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        rgb.flags.writeable = False
        results = holistic.process(rgb)
        feat = extract_frame_landmarks(results)
        frame_features.append(feat)
    cap.release()

    if not frame_features:
        return np.zeros((1, 134), dtype=np.float32)
    return np.array(frame_features, dtype=np.float32)

def main():
    video_files = list(INCLUDE_50_DIR.glob("**/*.mp4")) + \
                  list(INCLUDE_50_DIR.glob("**/*.MOV")) + \
                  list(INCLUDE_50_DIR.glob("**/*.avi"))

    print(f"[*] Found {len(video_files)} videos in {INCLUDE_50_DIR}. Starting landmark extraction...")

    if not video_files:
        print("[!] No video files found in INCLUDE_50 folder yet.")
        print("Please run select_include50.py after placing raw datasets in INCLUDE_RAW.")
        return

    with mp_holistic.Holistic(
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
        model_complexity=1
    ) as holistic:
        for idx, vpath in enumerate(video_files, 1):
            rel_name = vpath.relative_to(INCLUDE_50_DIR).with_suffix(".npy")
            out_file = KEYPOINTS_CACHE_DIR / rel_name
            out_file.parent.mkdir(parents=True, exist_ok=True)

            if not out_file.exists():
                features = process_video(vpath, holistic)
                np.save(out_file, features)
            
            if idx % 25 == 0 or idx == len(video_files):
                print(f"  Processed {idx}/{len(video_files)} videos...")

    print(f"[SUCCESS] All video landmark sequences cached in {KEYPOINTS_CACHE_DIR}")

if __name__ == "__main__":
    main()
