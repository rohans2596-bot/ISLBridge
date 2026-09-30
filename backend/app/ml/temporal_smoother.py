import time
from collections import deque, Counter
from typing import Optional, Dict, Any, Tuple

class TemporalSmoother:
    def __init__(self, window_size: int = 4, min_stable_frames: int = 2, cooldown_seconds: float = 0.5):
        self.window_size = window_size
        self.min_stable_frames = min_stable_frames
        self.cooldown_seconds = cooldown_seconds
        
        self.buffer = deque(maxlen=window_size)
        self.confidence_buffer = deque(maxlen=window_size)
        self.last_confirmed_sign: Optional[str] = None
        self.last_confirmed_time: float = 0.0

    def add_prediction(self, sign: str, confidence: float) -> Tuple[Optional[str], float, bool]:
        """
        Adds a raw frame prediction to the smoothing window.
        Returns:
            (smoothed_sign, smoothed_confidence, is_new_event)
        """
        current_time = time.time()

        if sign in ["NO HAND", "UNCERTAIN", "UNKNOWN"]:
            self.buffer.append(None)
            self.confidence_buffer.append(0.0)
            return None, 0.0, False

        self.buffer.append(sign)
        self.confidence_buffer.append(confidence)

        # Count occurrences in buffer
        valid_signs = [s for s in self.buffer if s is not None]
        if len(valid_signs) < self.min_stable_frames:
            return sign, confidence, False

        counts = Counter(valid_signs)
        most_common_sign, count = counts.most_common(1)[0]

        if count >= self.min_stable_frames:
            # Calculate average confidence for the dominant sign
            matching_confs = [
                conf for s, conf in zip(self.buffer, self.confidence_buffer)
                if s == most_common_sign
            ]
            avg_conf = float(sum(matching_confs) / len(matching_confs)) if matching_confs else confidence

            # Check cooldown and whether it's a new trigger
            is_new = False
            time_since_last = current_time - self.last_confirmed_time
            if most_common_sign != self.last_confirmed_sign or time_since_last >= self.cooldown_seconds:
                self.last_confirmed_sign = most_common_sign
                self.last_confirmed_time = current_time
                is_new = True

            return most_common_sign, round(avg_conf, 3), is_new

        return sign, confidence, False

    def reset(self):
        self.buffer.clear()
        self.confidence_buffer.clear()
        self.last_confirmed_sign = None
        self.last_confirmed_time = 0.0
