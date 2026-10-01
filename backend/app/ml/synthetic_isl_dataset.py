import numpy as np
from typing import List, Dict, Tuple
from app.ml.feature_extractor import extract_features_from_payload

# Canonical motion specification per sign.
# dx: horizontal displacement (+ = rightward across body)
# dy: vertical displacement   (+ = downward, - = upward)
# dz: depth displacement      (- = toward camera / forward)
# speed: motion intensity 0=static → 1=fast
# dir_x, dir_y: unit direction vector of primary motion
# Signs NOT listed here default to static (all zeros).
ISL_MOTION_SPECS: Dict[str, Dict[str, float]] = {
    # --- Strongly motion-defined signs ---
    "COLLEGE":      {"dx":  0.13, "dy":  0.00, "dz": -0.04, "speed": 0.08, "dir_x":  1.0, "dir_y":  0.0},
    "COME":         {"dx": -0.12, "dy":  0.00, "dz":  0.00, "speed": 0.07, "dir_x": -1.0, "dir_y":  0.0},
    "GO":           {"dx":  0.12, "dy":  0.00, "dz": -0.08, "speed": 0.07, "dir_x":  1.0, "dir_y":  0.0},
    "THANK YOU":    {"dx":  0.00, "dy": -0.05, "dz": -0.10, "speed": 0.07, "dir_x":  0.0, "dir_y": -1.0},
    "GOOD MORNING": {"dx":  0.00, "dy": -0.10, "dz":  0.00, "speed": 0.06, "dir_x":  0.0, "dir_y": -1.0},
    "WELCOME":      {"dx": -0.10, "dy":  0.00, "dz":  0.00, "speed": 0.06, "dir_x": -1.0, "dir_y":  0.0},
    "SORRY":        {"dx":  0.00, "dy":  0.00, "dz":  0.00, "speed": 0.04, "dir_x":  0.0, "dir_y":  0.0},  # circular
    "BAD":          {"dx":  0.00, "dy":  0.08, "dz":  0.00, "speed": 0.05, "dir_x":  0.0, "dir_y":  1.0},
    "WHERE":        {"dx":  0.08, "dy":  0.00, "dz":  0.00, "speed": 0.04, "dir_x":  1.0, "dir_y":  0.0},
    "WHEN":         {"dx":  0.00, "dy":  0.00, "dz":  0.00, "speed": 0.03, "dir_x":  0.0, "dir_y":  0.0},
    "HOW":          {"dx":  0.00, "dy":  0.06, "dz":  0.00, "speed": 0.05, "dir_x":  0.0, "dir_y":  1.0},
    "WHAT":         {"dx":  0.06, "dy":  0.00, "dz":  0.00, "speed": 0.04, "dir_x":  1.0, "dir_y":  0.0},
    "WAIT":         {"dx":  0.00, "dy":  0.03, "dz":  0.00, "speed": 0.03, "dir_x":  0.0, "dir_y":  1.0},
    "HELLO":        {"dx":  0.05, "dy": -0.02, "dz":  0.00, "speed": 0.04, "dir_x":  1.0, "dir_y": -0.4},
    "PLEASE":       {"dx":  0.00, "dy":  0.05, "dz":  0.00, "speed": 0.03, "dir_x":  0.0, "dir_y":  1.0},
    "HELP":         {"dx":  0.00, "dy": -0.08, "dz":  0.00, "speed": 0.06, "dir_x":  0.0, "dir_y": -1.0},
    "SCHOOL":       {"dx":  0.00, "dy":  0.00, "dz":  0.03, "speed": 0.04, "dir_x":  0.0, "dir_y":  0.0},
    "NEW":          {"dx":  0.08, "dy":  0.00, "dz":  0.00, "speed": 0.04, "dir_x":  1.0, "dir_y":  0.0},
    "PAINT":        {"dx":  0.10, "dy":  0.05, "dz":  0.00, "speed": 0.05, "dir_x":  1.0, "dir_y":  0.5},
    "SHOP":         {"dx":  0.00, "dy":  0.08, "dz":  0.00, "speed": 0.04, "dir_x":  0.0, "dir_y":  1.0},
    "COMMUNICATION":{"dx": -0.05, "dy":  0.00, "dz":  0.00, "speed": 0.04, "dir_x": -1.0, "dir_y":  0.0},
    "PRACTICE":     {"dx":  0.06, "dy":  0.00, "dz":  0.00, "speed": 0.04, "dir_x":  1.0, "dir_y":  0.0},
    "RED":          {"dx":  0.00, "dy":  0.06, "dz":  0.00, "speed": 0.03, "dir_x":  0.0, "dir_y":  1.0},
    "HAPPY":        {"dx":  0.00, "dy": -0.08, "dz":  0.00, "speed": 0.05, "dir_x":  0.0, "dir_y": -1.0},
    "SUMMER":       {"dx":  0.10, "dy":  0.00, "dz":  0.00, "speed": 0.04, "dir_x":  1.0, "dir_y":  0.0},
    "DRY":          {"dx":  0.08, "dy":  0.00, "dz":  0.00, "speed": 0.03, "dir_x":  1.0, "dir_y":  0.0},
    "FAN":          {"dx":  0.00, "dy":  0.00, "dz":  0.00, "speed": 0.06, "dir_x":  0.0, "dir_y":  0.0},  # rotation
    "FALL":         {"dx":  0.00, "dy":  0.10, "dz":  0.00, "speed": 0.07, "dir_x":  0.0, "dir_y":  1.0},
    "HOT":          {"dx":  0.00, "dy":  0.00, "dz": -0.08, "speed": 0.05, "dir_x":  0.0, "dir_y":  0.0},
    "DELICIOUS":    {"dx":  0.00, "dy": -0.06, "dz":  0.00, "speed": 0.04, "dir_x":  0.0, "dir_y": -1.0},
    "SPEAK":        {"dx": -0.05, "dy":  0.00, "dz":  0.00, "speed": 0.03, "dir_x": -1.0, "dir_y":  0.0},
    "YEAR":         {"dx":  0.04, "dy":  0.04, "dz":  0.00, "speed": 0.04, "dir_x":  0.7, "dir_y":  0.7},
    "TRAIN TICKET": {"dx":  0.10, "dy":  0.00, "dz":  0.00, "speed": 0.05, "dir_x":  1.0, "dir_y":  0.0},
    "WINDOW":       {"dx":  0.00, "dy": -0.10, "dz":  0.00, "speed": 0.05, "dir_x":  0.0, "dir_y": -1.0},
    "GOOD NIGHT":   {"dx":  0.00, "dy":  0.05, "dz":  0.00, "speed": 0.03, "dir_x":  0.0, "dir_y":  1.0},
    "SIGN":         {"dx": -0.05, "dy":  0.00, "dz":  0.00, "speed": 0.08, "dir_x": -1.0, "dir_y":  0.0},
    "NAME":         {"dx":  0.00, "dy":  0.02, "dz":  0.00, "speed": 0.02, "dir_x":  0.0, "dir_y":  1.0},
}

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
,
    # BANK: B shape — four fingers up, thumb across palm
    "BANK": {
        "right": {"thumb": "side", "index": "up", "middle": "up", "ring": "up", "pinky": "up"},
        "both_hands": False
    },
    # BIRD: Beak pinch — index+thumb pinch, rest closed
    "BIRD": {
        "right": {"thumb": "pinch", "index": "pinch", "middle": "closed", "ring": "closed", "pinky": "closed"},
        "both_hands": False
    },
    # BLACK: Index pointing sideways across forehead
    "BLACK": {
        "right": {"thumb": "closed", "index": "point", "middle": "closed", "ring": "closed", "pinky": "closed", "hand_angle": 0.4},
        "both_hands": False
    },
    # BOY: B shape raised high near forehead
    "BOY": {
        "right": {"thumb": "side", "index": "up", "middle": "up", "ring": "up", "pinky": "up", "wrist_y_offset": -0.15},
        "both_hands": False
    },
    # BROTHER: Scissors — index+middle extended, rest closed
    "BROTHER": {
        "right": {"thumb": "closed", "index": "up", "middle": "up", "ring": "closed", "pinky": "closed"},
        "both_hands": False
    },
    # CAR: Both closed fists like gripping steering wheel
    "CAR": {
        "right": {"thumb": "side", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "closed", "hand_angle": -0.2},
        "left": {"thumb": "side", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "closed", "hand_angle": 0.2},
        "both_hands": True
    },
    # CELL PHONE: Y shape — thumb and pinky out (phone to ear)
    "CELL PHONE": {
        "right": {"thumb": "up", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "up", "wrist_y_offset": -0.1},
        "both_hands": False
    },
    # COURT: C shape both hands — curved hook fingers
    "COURT": {
        "right": {"thumb": "open", "index": "hook", "middle": "hook", "ring": "hook", "pinky": "hook", "hand_angle": -0.3},
        "left": {"thumb": "open", "index": "hook", "middle": "hook", "ring": "hook", "pinky": "hook", "hand_angle": 0.3},
        "both_hands": True
    },
    # COW: Both Y hands for horns — thumb+pinky out on both sides
    "COW": {
        "right": {"thumb": "up", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "up", "hand_angle": 0.4},
        "left": {"thumb": "up", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "up", "hand_angle": -0.4},
        "both_hands": True
    },
    # DEATH: Flat hands, one palm up one palm down, flipped
    "DEATH": {
        "right": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "hand_angle": -0.6},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "hand_angle": 0.6},
        "both_hands": True
    },
    # DOG: Snap gesture — side thumb + index pinch
    "DOG": {
        "right": {"thumb": "side", "index": "pinch", "middle": "closed", "ring": "closed", "pinky": "closed"},
        "both_hands": False
    },
    # DRY: Bent index tracing across chin sideways
    "DRY": {
        "right": {"thumb": "closed", "index": "hook", "middle": "closed", "ring": "closed", "pinky": "closed", "hand_angle": 0.3},
        "both_hands": False
    },
    # ELECTION: One fist (ballot) one flat open palm
    "ELECTION": {
        "right": {"thumb": "side", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "closed"},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open"},
        "both_hands": True
    },
    # FALL: V shape pointing downward
    "FALL": {
        "right": {"thumb": "closed", "index": "up", "middle": "up", "ring": "closed", "pinky": "closed", "wrist_y_offset": 0.1},
        "both_hands": False
    },
    # FAN: Open hand rotated at angle
    "FAN": {
        "right": {"thumb": "side", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "hand_angle": 0.6},
        "both_hands": False
    },
    # FATHER: Open 5-hand raised to forehead level
    "FATHER": {
        "right": {"thumb": "up", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": -0.14},
        "both_hands": False
    },
    # GIRL: A-fist with thumb tracing the jawline — thumb side
    "GIRL": {
        "right": {"thumb": "up", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "closed", "hand_angle": 0.5},
        "both_hands": False
    },
    # HAPPY: Both flat hands brushing chest upward
    "HAPPY": {
        "right": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": 0.12},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": 0.12},
        "both_hands": True
    },
    # HAT: Flat hand angled, patting top of head
    "HAT": {
        "right": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "hand_angle": -0.6, "wrist_y_offset": -0.18},
        "both_hands": False
    },
    # HOT: Claw hand near mouth then pulled away
    "HOT": {
        "right": {"thumb": "open", "index": "hook", "middle": "hook", "ring": "hook", "pinky": "hook", "wrist_y_offset": -0.08},
        "both_hands": False
    },
    # HOUSE: Both flat hands angled to form roof peak (different angles than HOME)
    "HOUSE": {
        "right": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "hand_angle": -0.45},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "hand_angle": 0.45},
        "both_hands": True
    },
    # I: Pinky-only up — I handshape
    "I": {
        "right": {"thumb": "closed", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "up"},
        "both_hands": False
    },
    # IT: Index pointing to side/down
    "IT": {
        "right": {"thumb": "closed", "index": "point", "middle": "closed", "ring": "closed", "pinky": "closed", "hand_angle": -0.2},
        "both_hands": False
    },
    # LARGE: L shapes on both hands moving apart — thumb+index out
    "LARGE": {
        "right": {"thumb": "up", "index": "point", "middle": "closed", "ring": "closed", "pinky": "closed", "wrist_y_offset": -0.05},
        "left": {"thumb": "up", "index": "point", "middle": "closed", "ring": "closed", "pinky": "closed", "wrist_y_offset": 0.05},
        "both_hands": True
    },
    # LONG: Index pointing along horizontal — sideways arm extension
    "LONG": {
        "right": {"thumb": "closed", "index": "point", "middle": "closed", "ring": "closed", "pinky": "closed", "hand_angle": 0.5},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "closed", "pinky": "closed"},
        "both_hands": True
    },
    # LOUD: Both fists near ears
    "LOUD": {
        "right": {"thumb": "side", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "closed", "wrist_y_offset": -0.16},
        "left": {"thumb": "side", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "closed", "wrist_y_offset": -0.16},
        "both_hands": True
    },
    # MONDAY: M shape — 3 bent fingers (index+middle+ring hook)
    "MONDAY": {
        "right": {"thumb": "closed", "index": "hook", "middle": "hook", "ring": "hook", "pinky": "closed"},
        "both_hands": False
    },
    # NEW: Curved fingers sliding on flat palm
    "NEW": {
        "right": {"thumb": "open", "index": "hook", "middle": "hook", "ring": "hook", "pinky": "hook", "wrist_y_offset": 0.04},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open"},
        "both_hands": True
    },
    # PAINT: Brush strokes — 3 fingers out, sweeping over flat palm
    "PAINT": {
        "right": {"thumb": "open", "index": "open", "middle": "open", "ring": "closed", "pinky": "closed", "hand_angle": 0.25},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open"},
        "both_hands": True
    },
    # PEN: Writing grip — pinch holding pen
    "PEN": {
        "right": {"thumb": "pinch", "index": "pinch", "middle": "hook", "ring": "closed", "pinky": "closed"},
        "both_hands": False
    },
    # PRIEST: 3 fingers pointing up near forehead — P shape
    "PRIEST": {
        "right": {"thumb": "closed", "index": "point", "middle": "point", "ring": "point", "pinky": "closed", "wrist_y_offset": -0.12},
        "both_hands": False
    },
    # QUIET: Index finger to lips — shh gesture
    "QUIET": {
        "right": {"thumb": "closed", "index": "point", "middle": "closed", "ring": "closed", "pinky": "closed", "wrist_y_offset": -0.14},
        "both_hands": False
    },
    # RED: Hook index brushing lips downward
    "RED": {
        "right": {"thumb": "side", "index": "hook", "middle": "closed", "ring": "closed", "pinky": "closed", "wrist_y_offset": -0.06},
        "both_hands": False
    },
    # SHOES: Both S-fists tapping together
    "SHOES": {
        "right": {"thumb": "side", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "closed", "hand_angle": 0.1},
        "left": {"thumb": "side", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "closed", "hand_angle": -0.1},
        "both_hands": True
    },
    # SHOP: Both flat hands, one higher one lower (shopping bag motion)
    "SHOP": {
        "right": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": 0.06},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": -0.06},
        "both_hands": True
    },
    # SHORT: Both hook hands held low at waist level
    "SHORT": {
        "right": {"thumb": "open", "index": "hook", "middle": "hook", "ring": "hook", "pinky": "hook", "wrist_y_offset": 0.1},
        "left": {"thumb": "open", "index": "hook", "middle": "hook", "ring": "hook", "pinky": "hook", "wrist_y_offset": 0.1},
        "both_hands": True
    },
    # SMALL: Both bent indices almost touching — tiny gap
    "SMALL": {
        "right": {"thumb": "open", "index": "hook", "middle": "closed", "ring": "closed", "pinky": "closed"},
        "left": {"thumb": "open", "index": "hook", "middle": "closed", "ring": "closed", "pinky": "closed"},
        "both_hands": True
    },
    # SUMMER: Bent index wiping across forehead
    "SUMMER": {
        "right": {"thumb": "side", "index": "hook", "middle": "closed", "ring": "closed", "pinky": "closed", "hand_angle": 0.35, "wrist_y_offset": -0.17},
        "both_hands": False
    },
    # T-SHIRT: Both hands tracing shirt collar/shoulders with hook fingers
    "T-SHIRT": {
        "right": {"thumb": "open", "index": "hook", "middle": "hook", "ring": "closed", "pinky": "closed", "wrist_y_offset": -0.04},
        "left": {"thumb": "open", "index": "hook", "middle": "hook", "ring": "closed", "pinky": "closed", "wrist_y_offset": -0.04},
        "both_hands": True
    },
    # TEACHER: F shapes (pinch) at both temples
    "TEACHER": {
        "right": {"thumb": "pinch", "index": "pinch", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": -0.16},
        "left": {"thumb": "pinch", "index": "pinch", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": -0.16},
        "both_hands": True
    },
    # TIME: Hook index tapping wrist
    "TIME": {
        "right": {"thumb": "open", "index": "hook", "middle": "closed", "ring": "closed", "pinky": "closed", "hand_angle": -0.35},
        "both_hands": False
    },
    # TRAIN TICKET: Scissors sliding under flat palm
    "TRAIN TICKET": {
        "right": {"thumb": "closed", "index": "up", "middle": "up", "ring": "closed", "pinky": "closed", "wrist_y_offset": 0.06},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "hand_angle": 0.55},
        "both_hands": True
    },
    # WHITE: Open 5-hand on chest pulling away
    "WHITE": {
        "right": {"thumb": "up", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": -0.03},
        "both_hands": False
    },
    # WINDOW: Both flat hands, one sliding up in front of other
    "WINDOW": {
        "right": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open"},
        "left": {"thumb": "open", "index": "open", "middle": "open", "ring": "open", "pinky": "open", "wrist_y_offset": 0.14},
        "both_hands": True
    },
    # YEAR: Both S-fists rotating around each other
    "YEAR": {
        "right": {"thumb": "side", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "closed", "wrist_y_offset": -0.06},
        "left": {"thumb": "side", "index": "closed", "middle": "closed", "ring": "closed", "pinky": "closed", "wrist_y_offset": 0.06},
        "both_hands": True
    },
    # YOU (PLURAL): Index pointing sideways and sweeping
    "YOU (PLURAL)": {
        "right": {"thumb": "closed", "index": "point", "middle": "closed", "ring": "closed", "pinky": "closed", "hand_angle": 0.35},
        "both_hands": False
    }
,
    "MAMATA": {
        "right": {
                "thumb": "open",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open",
                "hand_angle": 0.2
        },
        "both_hands": False
},
    "CRITICIZES": {
        "right": {
                "thumb": "closed",
                "index": "point",
                "middle": "closed",
                "ring": "closed",
                "pinky": "closed",
                "wrist_y_offset": -0.05
        },
        "both_hands": False
},
    "COMMISSIONER": {
        "right": {
                "thumb": "side",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open"
        },
        "both_hands": False
},
    "DEMANDS": {
        "right": {
                "thumb": "open",
                "index": "hook",
                "middle": "hook",
                "ring": "hook",
                "pinky": "hook"
        },
        "both_hands": False
},
    "RESIGNATION": {
        "right": {
                "thumb": "closed",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open",
                "wrist_y_offset": 0.1
        },
        "both_hands": False
},
    "VOTER": {
        "right": {
                "thumb": "pinch",
                "index": "pinch",
                "middle": "closed",
                "ring": "closed",
                "pinky": "closed"
        },
        "both_hands": False
},
    "LIST": {
        "right": {
                "thumb": "side",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open",
                "hand_angle": -0.15
        },
        "left": {
                "thumb": "open",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open"
        },
        "both_hands": True
},
    "PROTEST": {
        "right": {
                "thumb": "closed",
                "index": "closed",
                "middle": "closed",
                "ring": "closed",
                "pinky": "closed",
                "wrist_y_offset": -0.15
        },
        "both_hands": False
},
    "DELHI": {
        "right": {
                "thumb": "open",
                "index": "point",
                "middle": "point",
                "ring": "closed",
                "pinky": "closed"
        },
        "both_hands": False
},
    "BASIC": {
        "right": {
                "thumb": "open",
                "index": "open",
                "middle": "open",
                "ring": "closed",
                "pinky": "closed"
        },
        "both_hands": False
},
    "COMMUNICATION": {
        "right": {
                "thumb": "open",
                "index": "point",
                "middle": "closed",
                "ring": "closed",
                "pinky": "closed"
        },
        "left": {
                "thumb": "open",
                "index": "point",
                "middle": "closed",
                "ring": "closed",
                "pinky": "closed"
        },
        "both_hands": True
},
    "SKILLS": {
        "right": {
                "thumb": "side",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open"
        },
        "both_hands": False
},
    "INDIAN": {
        "right": {
                "thumb": "pinch",
                "index": "pinch",
                "middle": "open",
                "ring": "open",
                "pinky": "open"
        },
        "both_hands": False
},
    "SIGN": {
        "right": {
                "thumb": "open",
                "index": "point",
                "middle": "closed",
                "ring": "closed",
                "pinky": "closed"
        },
        "left": {
                "thumb": "open",
                "index": "point",
                "middle": "closed",
                "ring": "closed",
                "pinky": "closed"
        },
        "both_hands": True
},
    "LANGUAGE": {
        "right": {
                "thumb": "open",
                "index": "open",
                "middle": "closed",
                "ring": "closed",
                "pinky": "open"
        },
        "left": {
                "thumb": "open",
                "index": "open",
                "middle": "closed",
                "ring": "closed",
                "pinky": "open"
        },
        "both_hands": True
},
    "COURSE": {
        "right": {
                "thumb": "side",
                "index": "hook",
                "middle": "closed",
                "ring": "closed",
                "pinky": "closed"
        },
        "both_hands": False
},
    "DEAF": {
        "right": {
                "thumb": "closed",
                "index": "point",
                "middle": "closed",
                "ring": "closed",
                "pinky": "closed",
                "wrist_y_offset": -0.12
        },
        "both_hands": False
},
    "RESPECT": {
        "right": {
                "thumb": "open",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open",
                "wrist_y_offset": -0.1
        },
        "both_hands": False
},
    "CULTURE": {
        "right": {
                "thumb": "side",
                "index": "hook",
                "middle": "hook",
                "ring": "closed",
                "pinky": "closed"
        },
        "both_hands": False
},
    "PRACTICE": {
        "right": {
                "thumb": "closed",
                "index": "point",
                "middle": "point",
                "ring": "closed",
                "pinky": "closed"
        },
        "left": {
                "thumb": "closed",
                "index": "point",
                "middle": "closed",
                "ring": "closed",
                "pinky": "closed"
        },
        "both_hands": True
},
    "ISLRTC": {
        "right": {
                "thumb": "open",
                "index": "point",
                "middle": "open",
                "ring": "closed",
                "pinky": "open"
        },
        "both_hands": False
},
    "GRAMMAR": {
        "right": {
                "thumb": "pinch",
                "index": "pinch",
                "middle": "closed",
                "ring": "closed",
                "pinky": "closed"
        },
        "both_hands": False
},
    "VOCABULARY": {
        "right": {
                "thumb": "side",
                "index": "point",
                "middle": "point",
                "ring": "closed",
                "pinky": "closed"
        },
        "both_hands": False
},
    "VANAKKAM": {
        "right": {
                "thumb": "open",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open"
        },
        "left": {
                "thumb": "open",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open"
        },
        "both_hands": True
},
    "CHANNEL": {
        "right": {
                "thumb": "side",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open"
        },
        "both_hands": False
},
    "HARITHA": {
        "right": {
                "thumb": "open",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open",
                "wrist_y_offset": -0.06
        },
        "both_hands": False
},
    "SPEAK": {
        "right": {
                "thumb": "open",
                "index": "point",
                "middle": "closed",
                "ring": "closed",
                "pinky": "closed",
                "wrist_y_offset": -0.05
        },
        "both_hands": False
},
    "SPEECH THERAPY": {
        "right": {
                "thumb": "open",
                "index": "open",
                "middle": "open",
                "ring": "closed",
                "pinky": "closed"
        },
        "both_hands": False
},
    "AGE 23": {
        "right": {
                "thumb": "closed",
                "index": "point",
                "middle": "point",
                "ring": "open",
                "pinky": "closed"
        },
        "both_hands": False
},
    "CHENNAI": {
        "right": {
                "thumb": "side",
                "index": "hook",
                "middle": "hook",
                "ring": "hook",
                "pinky": "closed"
        },
        "both_hands": False
},
    "MASTER DEGREE": {
        "right": {
                "thumb": "open",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open",
                "wrist_y_offset": -0.15
        },
        "both_hands": False
},
    "BUSINESS ECONOMICS": {
        "right": {
                "thumb": "side",
                "index": "open",
                "middle": "open",
                "ring": "closed",
                "pinky": "closed"
        },
        "left": {
                "thumb": "side",
                "index": "open",
                "middle": "open",
                "ring": "closed",
                "pinky": "closed"
        },
        "both_hands": True
},
    "PAINTING": {
        "right": {
                "thumb": "open",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open"
        },
        "left": {
                "thumb": "open",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open"
        },
        "both_hands": True
},
    "COOKING": {
        "right": {
                "thumb": "open",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open",
                "hand_angle": 0.15
        },
        "left": {
                "thumb": "open",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open"
        },
        "both_hands": True
},
    "PASSION": {
        "right": {
                "thumb": "closed",
                "index": "closed",
                "middle": "closed",
                "ring": "closed",
                "pinky": "closed",
                "wrist_y_offset": 0.05
        },
        "both_hands": False
},
    "DELICIOUS": {
        "right": {
                "thumb": "pinch",
                "index": "pinch",
                "middle": "open",
                "ring": "open",
                "pinky": "open",
                "wrist_y_offset": -0.08
        },
        "both_hands": False
},
    "YOUTUBE CHANNEL": {
        "right": {
                "thumb": "open",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open"
        },
        "left": {
                "thumb": "open",
                "index": "open",
                "middle": "open",
                "ring": "open",
                "pinky": "open"
        },
        "both_hands": True
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

        # Canonical motion for this sign (zeros = static)
        canon_motion = ISL_MOTION_SPECS.get(sign_name, {})
        base_dx    = float(canon_motion.get("dx",    0.0))
        base_dy    = float(canon_motion.get("dy",    0.0))
        base_dz    = float(canon_motion.get("dz",    0.0))
        base_speed = float(canon_motion.get("speed", 0.0))
        base_dirx  = float(canon_motion.get("dir_x", 0.0))
        base_diry  = float(canon_motion.get("dir_y", 0.0))

        for sample_i in range(samples_per_sign):
            # Apply natural human variation
            angle = np.random.uniform(-0.18, 0.18)
            scale = np.random.uniform(0.85, 1.15)
            noise = np.random.uniform(0.005, 0.018)
            
            aug_right = augment_landmarks(base_right, noise_std=noise, scale_factor=scale, angle=angle)
            
            payload = {}
            # For signs marked both_hands, allow 20% single-hand dominant samples
            # (e.g. if non-dominant hand is hidden, partially occluded, or user signs 1-handed)
            use_both = spec.get("both_hands", False) and base_left and (sample_i % 5 != 0)
            if use_both:
                aug_left = augment_landmarks(base_left, noise_std=noise, scale_factor=scale, angle=angle)
                payload["hands"] = [
                    {"landmarks": aug_left, "handedness": "Left"},
                    {"landmarks": aug_right, "handedness": "Right"}
                ]
            else:
                payload["hands"] = [
                    {"landmarks": aug_right, "handedness": "Right"}
                ]

            # Special augmentation for NAME: allow index and middle fingers either straight up or pointing forward/tilted
            if sign_name == "NAME" and (sample_i % 2 == 1):
                alt_r = create_hand_pose(thumb_state="closed", index_state="point", middle_state="point", ring_state="closed", pinky_state="closed")
                aug_right = augment_landmarks(alt_r, noise_std=noise, scale_factor=scale, angle=angle)
                if use_both:
                    alt_l = create_hand_pose(thumb_state="closed", index_state="point", middle_state="point", ring_state="closed", pinky_state="closed")
                    for lm in alt_l: lm["x"] -= 0.35
                    aug_left = augment_landmarks(alt_l, noise_std=noise, scale_factor=scale, angle=angle)
                    payload["hands"] = [
                        {"landmarks": aug_left, "handedness": "Left"},
                        {"landmarks": aug_right, "handedness": "Right"}
                    ]
                else:
                    payload["hands"] = [
                        {"landmarks": aug_right, "handedness": "Right"}
                    ]

            # Add synthetic motion with realistic noise
            if base_speed > 0.01:
                motion_noise = np.random.normal(0, 0.015)
                speed_noise  = np.random.uniform(-0.012, 0.012)
                dx_val = base_dx + motion_noise
                dirx_val = base_dirx

                # For horizontal motion signs like COLLEGE, COME, GO:
                # 25% of samples reflect inverted horizontal direction (for left-handed signers or inverted mirror view)
                if abs(base_dx) > 0.05 and (sample_i % 4 == 0):
                    dx_val = -dx_val
                    dirx_val = -dirx_val

                speed_val = max(0.02, base_speed + speed_noise)
                payload["motion"] = {
                    "dx":    float(np.clip(dx_val,                     -1.0, 1.0)),
                    "dy":    float(np.clip(base_dy + motion_noise,     -1.0, 1.0)),
                    "dz":    float(np.clip(base_dz + motion_noise,     -1.0, 1.0)),
                    "speed": float(np.clip(speed_val,                   0.0, 1.0)),
                    "dir_x": float(np.clip(dirx_val,                   -1.0, 1.0)),
                    "dir_y": float(np.clip(base_diry + motion_noise,   -1.0, 1.0)),
                }
            else:
                # Static sign: negligible jitter / zero motion
                payload["motion"] = {
                    "dx":    float(np.random.normal(0, 0.003)),
                    "dy":    float(np.random.normal(0, 0.003)),
                    "dz":    float(np.random.normal(0, 0.003)),
                    "speed": float(max(0.0, np.random.normal(0, 0.005))),
                    "dir_x": 0.0,
                    "dir_y": 0.0,
                }
            
            feat_vec = extract_features_from_payload(payload)
            X_list.append(feat_vec)
            y_list.append(class_idx)

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.int64)
    return X, y, class_names
