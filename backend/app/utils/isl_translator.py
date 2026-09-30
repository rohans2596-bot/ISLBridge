import json
import logging
import httpx
from typing import List, Dict, Tuple
from app.config import GROQ_API_KEY, GROQ_MODEL
from app.ml.sentence_predictor import SentencePredictionEngine, SINGLE_SIGN_SENTENCES

logger = logging.getLogger("ISLTranslator")

# Get singleton instance of ML Sentence Predictor (RandomForest / XGBoost Intent Classifier)
sentence_predictor = SentencePredictionEngine.get_instance()


def translate_sign(sign_name: str, language: str = "en") -> str:
    """Translates a single sign concept into a rich, full sentence or word."""
    clean_sign = sign_name.upper().strip()
    if clean_sign in SINGLE_SIGN_SENTENCES:
        return SINGLE_SIGN_SENTENCES[clean_sign].get(language, SINGLE_SIGN_SENTENCES[clean_sign]["en"])
    return sign_name.title()


def construct_natural_sentence(signs: List[str]) -> Tuple[str, str]:
    """
    Synthesizes rich, natural English & Tamil sentences from ISL signs.
    Uses RandomForest / XGBoost ML Intent Prediction + Single Sign Expansion.
    Seamlessly utilizes Groq LLM if configured for complex long chains.
    """
    if not signs:
        return "", ""

    # Strict stream deduplication (e.g. ['PLEASE', 'PLEASE', 'FOOD', 'FOOD'] -> ['PLEASE', 'FOOD'])
    clean_signs = sentence_predictor.deduplicate_sign_sequence(signs)
    if not clean_signs:
        return "", ""

    # 1. Single sign or direct ML prediction via RandomForest / XGBoost
    if len(clean_signs) <= 3:
        eng_ml, tam_ml, conf = sentence_predictor.predict_sentence(clean_signs)
        if conf >= 0.20 and eng_ml and tam_ml:
            return eng_ml, tam_ml

    # 2. Try Groq API LLM Refinement for complex long chains
    if GROQ_API_KEY and GROQ_API_KEY.startswith("gsk_"):
        try:
            prompt = (
                f"You are the linguistic engine for ISLBridge (Indian Sign Language AI).\n"
                f"The user signed this clean sequence: {json.dumps(clean_signs)}.\n"
                f"Convert this into:\n"
                f"1. A natural, grammatically fluent English sentence.\n"
                f"2. A natural, accurate Tamil (தமிழ்) translation.\n\n"
                f"Respond with JSON ONLY in this format without markdown code blocks:\n"
                f'{{"english_text": "...", "tamil_text": "..."}}'
            )

            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            body = {
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a concise sign-language translation JSON API."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
                "max_tokens": 150,
                "response_format": {"type": "json_object"}
            }

            with httpx.Client(timeout=3.5) as client:
                resp = client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=body
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    eng_out = parsed.get("english_text", "").strip()
                    tam_out = parsed.get("tamil_text", "").strip()
                    if eng_out and tam_out:
                        logger.info(f"Groq LLM synthesized: '{eng_out}' / '{tam_out}'")
                        return eng_out, tam_out
        except Exception as e:
            logger.warning(f"Groq API call fallback to ML engine: {e}")

    # 3. Fallback to RandomForest ML Sentence Engine
    eng_pred, tam_pred, _ = sentence_predictor.predict_sentence(clean_signs)
    return eng_pred, tam_pred
