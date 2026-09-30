import numpy as np
from typing import List, Dict, Tuple
from app.ml.feature_extractor import extract_features_from_payload

# 21 MediaPipe Landmarks Reference Indices:
# 0: Wrist
# 1: Thumb CMC, 2: Thumb MCP, 3: Thumb IP, 4: Thumb TIP
# 5: Index MCP, 6: Index PIP, 7: Index DIP, 8: Index TIP
# 9: Middle MCP, 10: Middle PIP, 11: Middle DIP, 12: Middle TIP
# 13: Ring MCP, 14: Ring PIP, 15: Ring DIP, 16: Ring TIP
# 17: Pinky MCP, 18: Pinky PIP, 19: Pinky DIP, 20: Pinky TIP

def create_hand_pose(
    thumb_state: str = "open",   # 'open', 'closed', 'up', 'down', 'pinch', 'side'
    index_state: str = "open",   # 'open', 'closed', 'hook', 'point', 'pinch', 'up'
    middle_state: str = "open",  # 'open', 'closed', 'cross', 'pinch', 'up', 'hook'
    ring_state: str = "open",    # 'open', 'closed', 'pinch', 'up', 'hook'
    pinky_state: str = "open",   # 'open', 'closed', 'up', 'pinch', 'hook'
    hand_angle: float = 0.0,
    wrist_y_offset: float = 0.0
) -> List[Dict[str, float]]:
    """
    Constructs a 21-landmark 3D coordinate hand model based on finger anatomical states.
    """
    landmarks = [None] * 21
    # Wrist
    landmarks[0] = {"x": 0.5, "y": float(0.8 + wrist_y_offset), "z": 0.0}

    # Helper to calculate finger joints
    def generate_finger(mcp_idx: int, base_x: float, base_y: float, state: str, angle_offset: float = 0.0):
        mcp_x, mcp_y = base_x, base_y + wrist_y_offset
        landmarks[mcp_idx] = {"x": mcp_x, "y": mcp_y, "z": 0.0}
        
        if state in ["open", "up"]:
            # Extended straight up
            pip_y = mcp_y - 0.11
            dip_y = pip_y - 0.08
            tip_y = dip_y - 0.08
            pip_x = mcp_x + np.sin(angle_offset + hand_angle) * 0.05
            dip_x = pip_x + np.sin(angle_offset + hand_angle) * 0.04
            tip_x = dip_x + np.sin(angle_offset + hand_angle) * 0.04
            z_val = 0.0
        elif state == "point":
            # Pointing straight forward/up
            pip_y = mcp_y - 0.13
            dip_y = pip_y - 0.09
            tip_y = dip_y - 0.09
            pip_x, dip_x, tip_x = mcp_x, mcp_x, mcp_x
            z_val = -0.04
        elif state in ["closed", "fist"]:
            # Curled into palm
            pip_y = mcp_y - 0.04
            dip_y = mcp_y - 0.01
            tip_y = mcp_y + 0.03
            pip_x = mcp_x
            dip_x = mcp_x - 0.01
            tip_x = mcp_x - 0.02
            z_val = 0.08
        elif state == "hook":
            # Curved hook
            pip_y = mcp_y - 0.08
            dip_y = pip_y - 0.02
            tip_y = pip_y + 0.04
            pip_x = mcp_x
            dip_x = mcp_x + 0.03
            tip_x = mcp_x + 0.02
            z_val = 0.04
        elif state == "pinch":
            # Touching thumb
            pip_y = mcp_y - 0.06
            dip_y = mcp_y - 0.03
            tip_y = mcp_y - 0.01
            pip_x = mcp_x - 0.06
            dip_x = mcp_x - 0.09
            tip_x = mcp_x - 0.12
            z_val = 0.02
        else: # default open
            pip_y = mcp_y - 0.09
            dip_y = pip_y - 0.07
            tip_y = dip_y - 0.07
            pip_x, dip_x, tip_x = mcp_x, mcp_x, mcp_x
            z_val = 0.0

        landmarks[mcp_idx + 1] = {"x": float(pip_x), "y": float(pip_y), "z": float(z_val * 0.5)}
        landmarks[mcp_idx + 2] = {"x": float(dip_x), "y": float(dip_y), "z": float(z_val * 0.8)}
        landmarks[mcp_idx + 3] = {"x": float(tip_x), "y": float(tip_y), "z": float(z_val)}

    # 1. Thumb (1, 2, 3, 4)
    landmarks[1] = {"x": 0.44, "y": float(0.73 + wrist_y_offset), "z": -0.01}
    landmarks[2] = {"x": 0.40, "y": float(0.67 + wrist_y_offset), "z": -0.02}
    if thumb_state == "up":
        landmarks[3] = {"x": 0.38, "y": float(0.55 + wrist_y_offset), "z": -0.03}
        landmarks[4] = {"x": 0.36, "y": float(0.44 + wrist_y_offset), "z": -0.04}
    elif thumb_state == "down":
        landmarks[3] = {"x": 0.38, "y": float(0.78 + wrist_y_offset), "z": -0.01}
        landmarks[4] = {"x": 0.36, "y": float(0.89 + wrist_y_offset), "z": -0.02}
    elif thumb_state in ["closed", "fist"]:
        landmarks[3] = {"x": 0.46, "y": float(0.63 + wrist_y_offset), "z": 0.03}
        landmarks[4] = {"x": 0.51, "y": float(0.63 + wrist_y_offset), "z": 0.05}
    elif thumb_state == "side":
        landmarks[3] = {"x": 0.35, "y": float(0.66 + wrist_y_offset), "z": 0.01}
        landmarks[4] = {"x": 0.30, "y": float(0.66 + wrist_y_offset), "z": 0.01}
    elif thumb_state == "pinch":
        landmarks[3] = {"x": 0.45, "y": float(0.57 + wrist_y_offset), "z": 0.01}
        landmarks[4] = {"x": 0.47, "y": float(0.53 + wrist_y_offset), "z": 0.02}
    else:  # open
        landmarks[3] = {"x": 0.35, "y": float(0.60 + wrist_y_offset), "z": -0.02}
        landmarks[4] = {"x": 0.30, "y": float(0.53 + wrist_y_offset), "z": -0.03}

    # 2. Index (5, 6, 7, 8)
    generate_finger(5, 0.45, 0.55, index_state, -0.08)

    # 3. Middle (9, 10, 11, 12)
    generate_finger(9, 0.50, 0.53, middle_state, 0.0)

    # 4. Ring (13, 14, 15, 16)
    generate_finger(13, 0.55, 0.56, ring_state, 0.08)

    # 5. Pinky (17, 18, 19, 20)
    generate_finger(17, 0.60, 0.60, pinky_state, 0.15)

    return landmarks


# ISL Sign Pose Specifications (Accurate Indian Sign Language Biomechanical Configurations)
ISL_SIGN_SPECS = {
    # 1. BAD: Thumb pointing downwards with closed fist
    "BAD": {
        "right": {"thumb": "down", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "closed"},
        "both_hands": False
    },
    # 2. COLLEGE: Flat right hand sliding over left palm and lifting
    "COLLEGE": {
        "right": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": -0.08},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": 0.05},
        "both_hands": True
    },
    # 3. COME: Open hand beckoning inward towards chest
    "COME": {
        "right": {"thumb": "open", "index": "hook", "middle": "hook", "ring": "hook", "pinky": "hook"},
        "both_hands": False
    },
    # 4. DOCTOR: Right fingers feeling pulse on left wrist
    "DOCTOR": {
        "right": {"thumb": "closed", "index": "hook", "middle": "hook", "ring": "closed", "pinky": "closed", "wrist_y_offset": -0.05},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": 0.05},
        "both_hands": True
    },
    # 5. EMERGENCY: E handshape shaking side to side
    "EMERGENCY": {
        "right": {"thumb": "pinch", "index": "hook", "middle": "hook", "ring": "hook", "pinky": "hook"},
        "both_hands": False
    },
    # 6. FAMILY: F handshapes (thumb & index pinch) touching
    "FAMILY": {
        "right": {"thumb": "pinch", "index": "pinch", "middle": "up", "ring": "up", "pinky": "up"},
        "left": {"thumb": "pinch", "index": "pinch", "middle": "up", "ring": "up", "pinky": "up"},
        "both_hands": True
    },
    # 7. FOOD: All fingertips bunched together touching mouth
    "FOOD": {
        "right": {"thumb": "pinch", "index": "pinch", "middle": "pinch", "ring": "pinch", "pinky": "pinch"},
        "both_hands": False
    },
    # 8. FRIEND: Index fingers interlocked in a hook
    "FRIEND": {
        "right": {"thumb": "closed", "index": "hook", "middle": "closed", "ring": "closed", "pinky": "closed"},
        "left": {"thumb": "closed", "index": "hook", "middle": "closed", "ring": "closed", "pinky": "closed"},
        "both_hands": True
    },
    # 9. GO: Index fingers pointing away forward
    "GO": {
        "right": {"thumb": "closed", "index": "point", "middle": "closed", "ring": "closed", "pinky": "closed"},
        "both_hands": False
    },
    # 10. GOOD: Thumb pointing upwards with closed fist
    "GOOD": {
        "right": {"thumb": "up", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "closed"},
        "both_hands": False
    },
    # 11. GOOD MORNING: Good (thumb up) + sun rising gesture
    "GOOD MORNING": {
        "right": {"thumb": "up", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "closed", "wrist_y_offset": -0.06},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": 0.04},
        "both_hands": True
    },
    # 12. GOOD NIGHT: Good (thumb up) + hand draping over wrist
    "GOOD NIGHT": {
        "right": {"thumb": "closed", "index": "hook", "middle": "hook", "ring": "hook", "pinky": "hook", "wrist_y_offset": -0.03},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": 0.05},
        "both_hands": True
    },
    # 13. HELLO: Open palm wave / flat hand salute
    "HELLO": {
        "right": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "hand_angle": 0.1},
        "both_hands": False
    },
    # 14. HELP: Closed fist (thumbs up) resting on flat palm
    "HELP": {
        "right": {"thumb": "up", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "closed", "wrist_y_offset": -0.06},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": 0.06},
        "both_hands": True
    },
    # 15. HOME: Both hands forming triangle roof with fingertips
    "HOME": {
        "right": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "hand_angle": -0.3},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "hand_angle": 0.3},
        "both_hands": True
    },
    # 16. HOSPITAL: H gesture drawing a cross on upper arm (index + middle straight up)
    "HOSPITAL": {
        "right": {"thumb": "closed", "index": "up", "middle": "up", "ring": "closed", "pinky": "closed"},
        "both_hands": False
    },
    # 17. HOW: Curved hands palms down turning over to palms up
    "HOW": {
        "right": {"thumb": "open", "index": "hook", "middle": "hook", "ring": "hook", "pinky": "hook"},
        "left": {"thumb": "open", "index": "hook", "middle": "hook", "ring": "hook", "pinky": "hook"},
        "both_hands": True
    },
    # 18. NAME: Index and middle fingers of both hands tapping perpendicularly
    "NAME": {
        "right": {"thumb": "closed", "index": "up", "middle": "up", "ring": "closed", "pinky": "closed"},
        "left": {"thumb": "closed", "index": "up", "middle": "up", "ring": "closed", "pinky": "closed"},
        "both_hands": True
    },
    # 19. NO: Index and middle fingers snapping to thumb
    "NO": {
        "right": {"thumb": "pinch", "index": "pinch", "middle": "pinch", "ring": "closed", "pinky": "closed"},
        "both_hands": False
    },
    # 20. PLEASE: Flat open palm gently touching chest
    "PLEASE": {
        "right": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "hand_angle": -0.15},
        "both_hands": False
    },
    # 21. SCHOOL: Flat palms clapping gently horizontally
    "SCHOOL": {
        "right": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "hand_angle": 0.25},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "hand_angle": -0.25},
        "both_hands": True
    },
    # 22. SORRY: Closed fist circular rub over center of chest (A fist with thumb on side)
    "SORRY": {
        "right": {"thumb": "side", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "closed"},
        "both_hands": False
    },
    # 23. STOP: Open palm pushed vertically forward
    "STOP": {
        "right": {"thumb": "open", "index": "up", "middle": "up", "ring": "up", "pinky": "up"},
        "both_hands": False
    },
    # 24. THANK YOU: Flat hand fingertips at chin moving forward
    "THANK YOU": {
        "right": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": -0.1},
        "both_hands": False
    },
    # 25. WAIT: Both hands open palms up fingers wiggling gently
    "WAIT": {
        "right": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": 0.05},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": 0.05},
        "both_hands": True
    },
    # 26. WATER: W sign (three fingers up: index, middle, ring up, thumb holding pinky)
    "WATER": {
        "right": {"thumb": "closed", "index": "up", "middle": "up", "ring": "up", "pinky": "closed"},
        "both_hands": False
    },
    # 27. WELCOME: Both hands open palms up sweeping inward
    "WELCOME": {
        "right": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "hand_angle": 0.15},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "hand_angle": -0.15},
        "both_hands": True
    },
    # 28. WHAT: Both hands open palms facing up shaking gently side-to-side
    "WHAT": {
        "right": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "hand_angle": 0.2},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "hand_angle": -0.2},
        "both_hands": True
    },
    # 29. WHEN: Right index finger circling left index finger tip
    "WHEN": {
        "right": {"thumb": "closed", "index": "point", "middle": "closed", "ring": "closed", "pinky": "closed", "wrist_y_offset": -0.04},
        "left": {"thumb": "closed", "index": "point", "middle": "closed", "ring": "closed", "pinky": "closed", "wrist_y_offset": 0.04},
        "both_hands": True
    },
    # 30. WHERE: Index finger pointing up and waving left and right
    "WHERE": {
        "right": {"thumb": "closed", "index": "up", "middle": "closed", "ring": "closed", "pinky": "closed"},
        "both_hands": False
    },
    # 31. WHY: Y shape (Thumb extended, Pinky extended, middle 3 curled)
    "WHY": {
        "right": {"thumb": "up", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "up"},
        "both_hands": False
    },
    # 32. YES: Closed fist (S fist with thumb wrapped across fingers)
    "YES": {
        "right": {"thumb": "closed", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "closed"},
        "both_hands": False
    }
}


def augment_landmarks(landmarks: List[Dict[str, float]], noise_std: float = 0.012, scale_factor: float = 1.0, angle: float = 0.0) -> List[Dict[str, float]]:
    """Applies realistic 3D jitter, rotation, and scaling to hand landmarks."""
    cos_a = np.cos(angle)
    sin_a = np.sin(angle)
    wrist = landmarks[0]
    
    augmented = []
    for lm in landmarks:
        # Centered translation
        dx = (lm["x"] - wrist["x"]) * scale_factor
        dy = (lm["y"] - wrist["y"]) * scale_factor
        dz = (lm["z"] - wrist["z"]) * scale_factor
        
        # 2D in-plane rotation
        rx = dx * cos_a - dy * sin_a
        ry = dx * sin_a + dy * cos_a
        
        # Add random natural noise
        nx = rx + np.random.normal(0, noise_std)
        ny = ry + np.random.normal(0, noise_std)
        nz = dz + np.random.normal(0, noise_std * 0.8)
        
        augmented.append({
            "x": float(wrist["x"] + nx),
            "y": float(wrist["y"] + ny),
            "z": float(wrist["z"] + nz)
        })
    return augmented


def generate_isl_dataset(samples_per_sign: int = 50) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """
    Generates a full multi-sample biomechanical ISL dataset.
    Returns (X, y, class_names).
    """
    X_list = []
    y_list = []
    class_names = sorted(list(ISL_SIGN_SPECS.keys()))

    for class_idx, sign_name in enumerate(class_names):
        spec = ISL_SIGN_SPECS[sign_name]
        
        # Base right hand
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
        
        # Base left hand if dual hand
        base_left = None
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
            # Offset left hand wrist
            for lm in base_left:
                lm["x"] -= 0.35

        for _ in range(samples_per_sign):
            # Apply natural human variation
            angle = np.random.uniform(-0.18, 0.18)
            scale = np.random.uniform(0.85, 1.15)
            noise = np.random.uniform(0.005, 0.018)
            
            aug_right = augment_landmarks(base_right, noise_std=noise, scale_factor=scale, angle=angle)
            
            payload = {}
            if spec.get("both_hands", False) and base_left:
                aug_left = augment_landmarks(base_left, noise_std=noise, scale_factor=scale, angle=angle)
                payload["hands"] = [
                    {"landmarks": aug_left, "handedness": "Left"},
                    {"landmarks": aug_right, "handedness": "Right"}
                ]
            else:
                payload["hands"] = [
                    {"landmarks": aug_right, "handedness": "Right"}
                ]
            
            feat_vec = extract_features_from_payload(payload)
            X_list.append(feat_vec)
            y_list.append(class_idx)

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.int64)
    return X, y, class_names
