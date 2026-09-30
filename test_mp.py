import os
from pathlib import Path

# Check if model files exist
model_path = Path("backend/data/models/mediapipe_models/hand_landmarker.task")
print("Hand landmarker task exists:", model_path.exists())

try:
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    import mediapipe as mp
    print("MediaPipe Tasks imported successfully!")
except Exception as e:
    print("Error importing tasks:", e)
