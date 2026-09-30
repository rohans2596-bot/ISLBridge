from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from app.schemas.prediction import PredictRequest, PredictResponse
from app.schemas.translation import TranslateSentenceRequest, TranslateSentenceResponse
from app.ml.classifier import ISLClassifier
from app.utils.isl_translator import translate_sign, construct_natural_sentence

router = APIRouter(tags=["Prediction & Translation"])

@router.post("/predict", response_model=PredictResponse)
def predict_gesture(request: PredictRequest):
    """
    Runs ML inference on received hand landmarks and returns recognized sign,
    confidence score, confidence band, top-K candidates, and Tamil translation.
    """
    classifier = ISLClassifier.get_instance()
    payload = request.model_dump()
    
    result = classifier.predict(payload)
    sign = result["sign"]
    
    tamil_trans = None
    if sign and sign not in ["NO HAND", "UNCERTAIN", "UNKNOWN"]:
        tamil_trans = translate_sign(sign, "ta")

    return PredictResponse(
        sign=sign,
        raw_sign=result.get("raw_sign", sign),
        confidence=result["confidence"],
        status=result["status"],
        language="en",
        tamil_translation=tamil_trans,
        top_k=result.get("top_k", []),
        hand_detected=result.get("hand_detected", True),
        error=result.get("error")
    )


@router.post("/translate-sentence", response_model=TranslateSentenceResponse)
def translate_sentence(request: TranslateSentenceRequest):
    """
    Takes an array of recognized ISL sign labels and synthesizes natural English
    and Tamil sentences with grammatical smoothing.
    """
    eng, tam = construct_natural_sentence(request.signs)
    return TranslateSentenceResponse(
        raw_signs=request.signs,
        english_text=eng,
        tamil_text=tam
    )
