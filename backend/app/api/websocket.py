import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any
from app.ml.classifier import ISLClassifier
from app.ml.temporal_smoother import TemporalSmoother
from app.utils.isl_translator import translate_sign

logger = logging.getLogger("ISLWebSocket")
router = APIRouter()

@router.websocket("/ws/translate")
async def websocket_translate(websocket: WebSocket):
    """
    Bidirectional WebSocket for low-latency real-time sign recognition.
    Frontend sends landmark frames, server predicts sign, applies temporal smoothing,
    and returns immediate prediction + smoothed trigger events.
    """
    await websocket.accept()
    smoother = TemporalSmoother(window_size=10, min_stable_frames=6, cooldown_seconds=1.2)
    classifier = ISLClassifier.get_instance()

    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                payload = json.loads(data_text)
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON format"})
                continue

            # Command messages (reset, ping)
            if payload.get("command") == "reset":
                smoother.reset()
                await websocket.send_json({"status": "reset_complete"})
                continue

            # Inference
            pred_result = classifier.predict(payload)
            raw_sign = pred_result["sign"]
            confidence = pred_result["confidence"]

            # Temporal smoothing
            smoothed_sign, smoothed_conf, is_new_trigger = smoother.add_prediction(raw_sign, confidence)

            tamil_trans = None
            if raw_sign and raw_sign not in ["NO HAND", "UNCERTAIN", "UNKNOWN"]:
                tamil_trans = translate_sign(raw_sign, "ta")

            response = {
                "sign": raw_sign,
                "confidence": confidence,
                "status": pred_result["status"],
                "hand_detected": pred_result["hand_detected"],
                "top_k": pred_result.get("top_k", []),
                "smoothed_sign": smoothed_sign,
                "smoothed_confidence": smoothed_conf,
                "is_new_trigger": is_new_trigger,
                "tamil_translation": tamil_trans,
                "timestamp": payload.get("timestamp")
            }

            await websocket.send_json(response)

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected.")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
