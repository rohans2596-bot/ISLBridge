import json
import logging
import httpx
from typing import List, Dict, Tuple
from app.config import GROQ_API_KEY, GROQ_MODEL

logger = logging.getLogger("ISLTranslator")

# Comprehensive ISL Concept dictionary with English and Tamil translations
ISL_TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "HELLO": {"en": "Hello", "ta": "வணக்கம்"},
    "THANK YOU": {"en": "Thank you", "ta": "நன்றி"},
    "PLEASE": {"en": "Please", "ta": "தயவுசெய்து"},
    "YES": {"en": "Yes", "ta": "ஆம்"},
    "NO": {"en": "No", "ta": "இல்லை"},
    "GOOD": {"en": "Good", "ta": "நல்லது"},
    "BAD": {"en": "Bad", "ta": "மோசமானது"},
    "HELP": {"en": "Help", "ta": "உதவி"},
    "SORRY": {"en": "Sorry", "ta": "மன்னிக்கவும்"},
    "WELCOME": {"en": "Welcome", "ta": "நல்வரவு"},
    "GOOD MORNING": {"en": "Good Morning", "ta": "காலை வணக்கம்"},
    "GOOD NIGHT": {"en": "Good Night", "ta": "இனிய இரவு வணக்கம்"},
    "WATER": {"en": "Water", "ta": "தண்ணீர்"},
    "FOOD": {"en": "Food", "ta": "உணவு"},
    "HOME": {"en": "Home", "ta": "வீடு"},
    "SCHOOL": {"en": "School", "ta": "பள்ளி"},
    "COLLEGE": {"en": "College", "ta": "கல்லூரி"},
    "HOSPITAL": {"en": "Hospital", "ta": "மருத்துவமனை"},
    "DOCTOR": {"en": "Doctor", "ta": "மருத்துவர்"},
    "FRIEND": {"en": "Friend", "ta": "நண்பர்"},
    "FAMILY": {"en": "Family", "ta": "குடும்பம்"},
    "NAME": {"en": "Name", "ta": "பெயர்"},
    "WHAT": {"en": "What", "ta": "என்ன"},
    "WHERE": {"en": "Where", "ta": "எங்கே"},
    "WHEN": {"en": "When", "ta": "எப்போது"},
    "WHY": {"en": "Why", "ta": "ஏன்"},
    "HOW": {"en": "How", "ta": "எப்படி"},
    "STOP": {"en": "Stop", "ta": "நில்"},
    "COME": {"en": "Come", "ta": "வாருங்கள்"},
    "GO": {"en": "Go", "ta": "போங்கள்"},
    "WAIT": {"en": "Wait", "ta": "காத்திருங்கள்"},
    "EMERGENCY": {"en": "Emergency", "ta": "அவசரம்"},
    "NEED": {"en": "Need", "ta": "வேண்டும்"},
    "YOU": {"en": "You", "ta": "நீங்கள்"},
    "ME": {"en": "Me", "ta": "நான்"},
    "MY": {"en": "My", "ta": "என்"},
    "HOW ARE YOU": {"en": "How are you?", "ta": "நீங்கள் எப்படி இருக்கிறீர்கள்?"}
}

PATTERN_RULES = [
    (
        ["HELLO", "HOW", "YOU"],
        "Hello, how are you?",
        "வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?"
    ),
    (
        ["HELLO", "MY", "NAME"],
        "Hello, my name is",
        "வணக்கம், என் பெயர்"
    ),
    (
        ["MY", "NAME"],
        "My name is",
        "என் பெயர்"
    ),
    (
        ["I", "NEED", "HELP"],
        "I need help.",
        "எனக்கு உதவி தேவை."
    ),
    (
        ["NEED", "HELP"],
        "I need help.",
        "எனக்கு உதவி தேவை."
    ),
    (
        ["NEED", "WATER"],
        "I need water.",
        "எனக்கு தண்ணீர் வேண்டும்."
    ),
    (
        ["NEED", "FOOD"],
        "I need food.",
        "எனக்கு உணவு வேண்டும்."
    ),
    (
        ["WHERE", "HOSPITAL"],
        "Where is the hospital?",
        "மருத்துவமனை எங்கே உள்ளது?"
    ),
    (
        ["WHERE", "DOCTOR"],
        "Where is the doctor?",
        "மருத்துவர் எங்கே இருக்கிறார்?"
    ),
    (
        ["WHERE", "HOME"],
        "Where is home?",
        "வீடு எங்கே இருக்கிறது?"
    ),
    (
        ["GOOD", "MORNING", "FRIEND"],
        "Good morning, my friend!",
        "காலை வணக்கம் நண்பரே!"
    ),
    (
        ["PLEASE", "HELP"],
        "Please help me.",
        "தயவுசெய்து எனக்கு உதவுங்கள்."
    ),
    (
        ["THANK YOU", "VERY MUCH"],
        "Thank you very much.",
        "மிக்க நன்றி."
    ),
    (
        ["EMERGENCY", "HELP"],
        "Emergency! Please help!",
        "அவசரம்! தயவுசெய்து உதவுங்கள்!"
    )
]


def translate_sign(sign_name: str, language: str = "en") -> str:
    """Translates a single sign concept to English or Tamil."""
    clean_sign = sign_name.upper().strip()
    entry = ISL_TRANSLATIONS.get(clean_sign)
    if entry:
        return entry.get(language, entry["en"])
    return sign_name.title()


def construct_natural_sentence_local(signs: List[str]) -> Tuple[str, str]:
    """Local rule-based fallback sentence synthesizer."""
    if not signs:
        return "", ""

    clean_signs = [s.upper().strip() for s in signs if s.strip()]
    if not clean_signs:
        return "", ""

    sign_str = " ".join(clean_signs)
    for pattern, eng_out, tam_out in PATTERN_RULES:
        if " ".join(pattern) == sign_str:
            return eng_out, tam_out

    eng_words = []
    tam_words = []
    for s in clean_signs:
        entry = ISL_TRANSLATIONS.get(s, {"en": s.capitalize(), "ta": s})
        eng_words.append(entry["en"])
        tam_words.append(entry["ta"])

    raw_eng = " ".join(eng_words)
    eng_sentence = raw_eng[0].upper() + raw_eng[1:] if raw_eng else ""
    if eng_sentence and not eng_sentence.endswith((".", "?", "!")):
        if any(w in clean_signs for w in ["WHAT", "WHERE", "WHEN", "WHY", "HOW"]):
            eng_sentence += "?"
        elif any(w in clean_signs for w in ["HELP", "EMERGENCY"]):
            eng_sentence += "!"
        else:
            eng_sentence += "."

    raw_tam = " ".join(tam_words)
    tam_sentence = raw_tam
    if tam_sentence and not tam_sentence.endswith((".", "?", "!")):
        if any(w in clean_signs for w in ["WHAT", "WHERE", "WHEN", "WHY", "HOW"]):
            tam_sentence += "?"
        elif any(w in clean_signs for w in ["HELP", "EMERGENCY"]):
            tam_sentence += "!"
        else:
            tam_sentence += "."

    return eng_sentence, tam_sentence


def construct_natural_sentence(signs: List[str]) -> Tuple[str, str]:
    """
    Synthesizes natural English & Tamil sentences using Groq AI LLM inference.
    Seamlessly falls back to local grammar rules if offline or unconfigured.
    """
    if not signs:
        return "", ""

    clean_signs = [s.upper().strip() for s in signs if s.strip()]
    if not clean_signs:
        return "", ""

    # If single sign, use fast dictionary translation
    if len(clean_signs) == 1:
        s = clean_signs[0]
        eng = translate_sign(s, "en")
        tam = translate_sign(s, "ta")
        return eng, tam

    # Try Groq API LLM Refinement
    if GROQ_API_KEY and GROQ_API_KEY.startswith("gsk_"):
        try:
            prompt = (
                f"You are the linguistic engine for ISLBridge (Indian Sign Language AI).\n"
                f"The user recognized this ordered sequence of ISL signs: {json.dumps(clean_signs)}.\n"
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

            with httpx.Client(timeout=4.0) as client:
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
            logger.warning(f"Groq API call fell back to local engine: {e}")

    # Fallback to local rule engine
    return construct_natural_sentence_local(clean_signs)
