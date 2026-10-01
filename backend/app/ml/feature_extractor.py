import numpy as np
from typing import List, Dict, Any, Optional

def normalize_single_hand(landmarks: Any) -> np.ndarray:
    """
    Given 21 landmarks [{'x': float, 'y': float, 'z': float}, ...],
    normalizes coordinates relative to wrist (index 0) and scales by palm span.
    Extracts geometric relations, finger curl states, thumb direction, and pairwise distances.
    Returns an 84-dimensional feature vector per hand.
    """
    if not landmarks or len(landmarks) < 21:
        return np.zeros(84, dtype=np.float32)

    raw_list = []
    for lm in landmarks:
        if isinstance(lm, dict):
            raw_list.append([lm.get('x', 0.0), lm.get('y', 0.0), lm.get('z', 0.0)])
        else:
            raw_list.append([getattr(lm, 'x', 0.0), getattr(lm, 'y', 0.0), getattr(lm, 'z', 0.0)])

    coords = np.array(raw_list, dtype=np.float32)
    wrist = coords[0]
    
    # Translate wrist to origin
    rel_coords = coords - wrist
    
    # Scale normalization by palm size (distance between wrist (0) and middle MCP (9))
    palm_size = float(np.linalg.norm(rel_coords[9]))
    if palm_size < 1e-4:
        palm_size = float(np.max(np.linalg.norm(rel_coords, axis=1)))
    if palm_size < 1e-4:
        palm_size = 1.0

    norm_coords = rel_coords / palm_size
    flattened_coords = norm_coords.flatten()  # 63 features (21 * 3)

    # Fingertip indices: 4 (thumb), 8 (index), 12 (middle), 16 (ring), 20 (pinky)
    # Knuckle/MCP indices: 2 (thumb), 5 (index), 9 (middle), 13 (ring), 17 (pinky)
    # PIP indices: 3 (thumb), 6 (index), 10 (middle), 14 (ring), 18 (pinky)
    tips = [4, 8, 12, 16, 20]
    mcps = [2, 5, 9, 13, 17]
    pips = [3, 6, 10, 14, 18]
    
    # 1. Curl metric: distance(tip, wrist) / distance(mcp, wrist)
    curl_metrics = []
    # 2. Extension flag: is tip further along finger axis than pip
    extension_flags = []
    for tip, mcp, pip in zip(tips, mcps, pips):
        d_tip = float(np.linalg.norm(norm_coords[tip]))
        d_mcp = float(np.linalg.norm(norm_coords[mcp]))
        curl_metrics.append(d_tip / (d_mcp + 1e-4))
        extension_flags.append(1.0 if norm_coords[tip][1] < norm_coords[pip][1] else 0.0)

    # 3. Thumb specific vectors: y-component of thumb tip (up vs down vs horizontal)
    thumb_y_dir = float(norm_coords[4][1])
    thumb_x_dir = float(norm_coords[4][0])

    # 4. Pairwise distances between adjacent fingertips: (4,8), (8,12), (12,16), (16,20), (4,20)
    pairwise_tip_dists = [
        float(np.linalg.norm(norm_coords[4] - norm_coords[8])),   # thumb-index pinch
        float(np.linalg.norm(norm_coords[4] - norm_coords[12])),  # thumb-middle pinch
        float(np.linalg.norm(norm_coords[8] - norm_coords[12])),  # index-middle dist
        float(np.linalg.norm(norm_coords[12] - norm_coords[16])), # middle-ring dist
        float(np.linalg.norm(norm_coords[16] - norm_coords[20])), # ring-pinky dist
        float(np.linalg.norm(norm_coords[4] - norm_coords[20])),  # thumb-pinky span (Y shape)
    ]

    # 5. Hand configuration heuristics (W, Y, Fist, Flat)
    is_fist = 1.0 if all(c < 1.3 for c in curl_metrics[1:]) else 0.0
    is_flat = 1.0 if all(c > 1.5 for c in curl_metrics) else 0.0
    is_w_shape = 1.0 if (curl_metrics[1] > 1.5 and curl_metrics[2] > 1.5 and curl_metrics[3] > 1.5 and curl_metrics[4] < 1.3) else 0.0
    
    heuristics = [thumb_y_dir, thumb_x_dir, is_fist, is_flat, is_w_shape]

    extra_features = np.array(curl_metrics + extension_flags + pairwise_tip_dists + heuristics, dtype=np.float32)  # 5 + 5 + 6 + 5 = 21 features
    return np.concatenate([flattened_coords, extra_features])  # 63 + 21 = 84 features


def extract_motion_features(motion_payload: Dict[str, Any]) -> np.ndarray:
    """
    Extracts 6 motion features from motion tracking payload.
    Returns: [dx, dy, dz, speed, dir_x, dir_y]
    - dx/dy/dz: normalized displacement over the tracking window
    - speed: magnitude of motion (0=static, 1=fast)
    - dir_x/dir_y: unit vector of primary motion direction
    """
    dx    = float(motion_payload.get("dx", 0.0))
    dy    = float(motion_payload.get("dy", 0.0))
    dz    = float(motion_payload.get("dz", 0.0))
    speed = float(motion_payload.get("speed", 0.0))
    dir_x = float(motion_payload.get("dir_x", 0.0))
    dir_y = float(motion_payload.get("dir_y", 0.0))
    # Clamp to reasonable range
    dx    = np.clip(dx, -1.0, 1.0)
    dy    = np.clip(dy, -1.0, 1.0)
    dz    = np.clip(dz, -1.0, 1.0)
    speed = np.clip(speed, 0.0, 1.0)
    dir_x = np.clip(dir_x, -1.0, 1.0)
    dir_y = np.clip(dir_y, -1.0, 1.0)
    return np.array([dx, dy, dz, speed, dir_x, dir_y], dtype=np.float32)


def extract_features_from_payload(payload: Dict[str, Any]) -> np.ndarray:
    """
    Extracts a consolidated feature vector from frontend landmark payload.
    Supports single hand, both hands, or structured handedness lists.
    Total length: 84 (left) + 84 (right) + 84 (combined_primary) + 4 (metadata) + 6 (motion) = 262 features.
    """
    left_features = np.zeros(84, dtype=np.float32)
    right_features = np.zeros(84, dtype=np.float32)
    left_present = 0.0
    right_present = 0.0

    hands_list = payload.get("hands")
    left_hand = payload.get("left_hand")
    right_hand = payload.get("right_hand")
    landmarks = payload.get("landmarks")

    if hands_list and isinstance(hands_list, list) and len(hands_list) > 0:
        for hand in hands_list:
            if isinstance(hand, dict):
                handedness = str(hand.get("handedness", "Right")).lower()
                lms = hand.get("landmarks", [])
            else:
                handedness = str(getattr(hand, "handedness", "Right")).lower()
                lms = getattr(hand, "landmarks", [])

            if "left" in handedness:
                left_features = normalize_single_hand(lms)
                left_present = 1.0
            else:
                right_features = normalize_single_hand(lms)
                right_present = 1.0

    elif left_hand or right_hand:
        if left_hand:
            left_features = normalize_single_hand(left_hand)
            left_present = 1.0
        if right_hand:
            right_features = normalize_single_hand(right_hand)
            right_present = 1.0

    elif landmarks and len(landmarks) >= 21:
        handedness = str(payload.get("handedness", "Right")).lower()
        if "left" in handedness:
            left_features = normalize_single_hand(landmarks)
            left_present = 1.0
        else:
            right_features = normalize_single_hand(landmarks)
            right_present = 1.0

    # Primary hand (invariant fallback)
    if left_present == 1.0 and right_present == 0.0:
        combined_primary = left_features
    elif right_present == 1.0 and left_present == 0.0:
        combined_primary = right_features
    elif right_present == 1.0 and left_present == 1.0:
        combined_primary = right_features
    else:
        combined_primary = np.zeros(84, dtype=np.float32)

    inter_wrist_dist = 0.0
    inter_tip_dist = 0.0
    if left_present > 0.5 and right_present > 0.5:
        # Distance between wrists and index fingertips
        inter_wrist_dist = float(np.linalg.norm(left_features[:3] - right_features[:3]))
        inter_tip_dist = float(np.linalg.norm(left_features[24:27] - right_features[24:27]))

    metadata = np.array([left_present, right_present, inter_wrist_dist, inter_tip_dist], dtype=np.float32)

    # Motion features (6) — populated by frontend tracker, zeros if not provided
    motion_data = payload.get("motion", None)
    if motion_data and isinstance(motion_data, dict):
        motion_features = extract_motion_features(motion_data)
    else:
        motion_features = np.zeros(6, dtype=np.float32)

    feature_vector = np.concatenate([
        left_features,       # 84
        right_features,      # 84
        combined_primary,    # 84
        metadata,            # 4
        motion_features      # 6  → total 262
    ])
    
    return feature_vector
