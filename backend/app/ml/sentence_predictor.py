import os
import json
import logging
import joblib
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.pipeline import Pipeline
try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

from app.config import MODEL_DIR

logger = logging.getLogger("SentencePredictor")

SENTENCE_MODEL_FILE = MODEL_DIR / "isl_sentence_rf.joblib"
SENTENCE_METADATA_FILE = MODEL_DIR / "sentence_metadata.json"

# Comprehensive Single Sign -> Rich Intent & Complete Sentence Mapping
SINGLE_SIGN_SENTENCES: Dict[str, Dict[str, str]] = {
    "FOOD": {
        "en": "I would like something to eat.",
        "ta": "எனக்கு உணவு வேண்டும்."
    },
    "WATER": {
        "en": "Please give me some water to drink.",
        "ta": "தயவுசெய்து எனக்கு குடிக்க தண்ணீர் கொடுங்கள்."
    },
    "HOSPITAL": {
        "en": "I need to go to the hospital immediately.",
        "ta": "நான் உடனடியாக மருத்துவமனைக்குச் செல்ல வேண்டும்."
    },
    "DOCTOR": {
        "en": "Please call a doctor for me.",
        "ta": "தயவுசெய்து எனக்காக ஒரு மருத்துவரை அழைக்கவும்."
    },
    "HELP": {
        "en": "Please help me, I need assistance.",
        "ta": "தயவுசெய்து எனக்கு உதவுங்கள், எனக்கு உதவி தேவை."
    },
    "EMERGENCY": {
        "en": "This is an emergency, please assist right now!",
        "ta": "இது அவசர நிலை, தயவுசெய்து உடனடியாக உதவுங்கள்!"
    },
    "PLEASE": {
        "en": "Please assist me with this request.",
        "ta": "தயவுசெய்து எனக்கு உதவி செய்யுங்கள்."
    },
    "THANK YOU": {
        "en": "Thank you very much for your kind help.",
        "ta": "உங்கள் அன்பான உதவிக்கு மிக்க நன்றி."
    },
    "HELLO": {
        "en": "Hello, greetings to you!",
        "ta": "வணக்கம், உங்களுக்கு என் வாழ்த்துகள்!"
    },
    "GOOD MORNING": {
        "en": "Good morning, hope you have a wonderful day!",
        "ta": "இனிய காலை வணக்கம், உங்களுக்கு நல்ல நாளாக அமையட்டும்!"
    },
    "GOOD NIGHT": {
        "en": "Good night, sleep well and sweet dreams.",
        "ta": "இனிய இரவு வணக்கம், நலமாக உறங்குங்கள்."
    },
    "WELCOME": {
        "en": "You are warmly welcome here.",
        "ta": "உங்களை அன்புடன் வரவேற்கிறோம்."
    },
    "SORRY": {
        "en": "I am very sorry for any inconvenience.",
        "ta": "ஏற்பட்ட சிரமத்திற்கு என்னை மன்னிக்கவும்."
    },
    "YES": {
        "en": "Yes, I agree and confirm this.",
        "ta": "ஆம், நான் இதை ஒப்புக்கொள்கிறேன்."
    },
    "NO": {
        "en": "No, I do not want or need this.",
        "ta": "இல்லை, எனக்கு இது தேவையில்லை."
    },
    "GOOD": {
        "en": "This is very good and well done.",
        "ta": "இது மிகவும் நல்லது, நன்றாக இருக்கிறது."
    },
    "BAD": {
        "en": "This is not good and feels uncomfortable.",
        "ta": "இது சரியில்லை, மோசமாக உள்ளது."
    },
    "STOP": {
        "en": "Please stop right here.",
        "ta": "தயவுசெய்து இங்கே நிறுத்துங்கள்."
    },
    "COME": {
        "en": "Please come over here.",
        "ta": "தயவுசெய்து இங்கே வாருங்கள்."
    },
    "GO": {
        "en": "We can proceed and go now.",
        "ta": "நாம் இப்போது புறப்படலாம்."
    },
    "WAIT": {
        "en": "Please wait for a moment.",
        "ta": "தயவுசெய்து சிறிது நேரம் காத்திருங்கள்."
    },
    "WHERE": {
        "en": "Where is it located?",
        "ta": "அது எங்கே அமைந்துள்ளது?"
    },
    "WHEN": {
        "en": "When will this take place?",
        "ta": "இது எப்போது நடைபெறும்?"
    },
    "WHY": {
        "en": "Why did this happen?",
        "ta": "இது ஏன் நடந்தது?"
    },
    "WHAT": {
        "en": "What is happening here?",
        "ta": "இங்கே என்ன நடக்கிறது?"
    },
    "HOW": {
        "en": "How can this be done?",
        "ta": "இதை எப்படி செய்ய முடியும்?"
    },
    "HOME": {
        "en": "I want to go to my home.",
        "ta": "நான் என் வீட்டிற்குச் செல்ல விரும்புகிறேன்."
    },
    "SCHOOL": {
        "en": "I am attending school.",
        "ta": "நான் பள்ளிக்குச் செல்கிறேன்."
    },
    "COLLEGE": {
        "en": "I am studying in college.",
        "ta": "நான் கல்லூரியில் படித்து வருகிறேன்."
    },
    "FRIEND": {
        "en": "You are a very good friend to me.",
        "ta": "நீங்கள் எனக்கு ஒரு நல்ல நண்பர்."
    },
    "FAMILY": {
        "en": "I love my family dearly.",
        "ta": "நான் என் குடும்பத்தை மிகவும் நேசிக்கிறேன்."
    },
    "NAME": {
        "en": "What is your name?",
        "ta": "உங்கள் பெயர் என்ன?"
    },
    "MY": {
        "en": "This belongs to me.",
        "ta": "இது என்னுடையது."
    },
    "YOU": {
        "en": "How are you doing today?",
        "ta": "நீங்கள் இன்று எப்படி இருக்கிறீர்கள்?"
    },
    "ME": {
        "en": "Please talk with me.",
        "ta": "தயவுசெய்து என்னுடன் பேசுங்கள்."
    },
    "NEED": {
        "en": "I need some urgent assistance.",
        "ta": "எனக்கு அவசர உதவி தேவைப்படுகிறது."
    }
}

# Compound Intent Training Dataset for RandomForest & XGBoost
COMPOUND_INTENT_DATA = [
    # Food & Water
    (["NEED", "FOOD"], "I need some food to eat.", "எனக்கு உணவு வேண்டும்."),
    (["PLEASE", "FOOD"], "Please give me some food.", "தயவுசெய்து எனக்கு உணவு கொடுங்கள்."),
    (["FOOD", "WATER"], "I need food and water.", "எனக்கு உணவும் தண்ணீரும் வேண்டும்."),
    (["NEED", "WATER"], "I need some water to drink.", "எனக்கு குடிக்க தண்ணீர் வேண்டும்."),
    (["PLEASE", "WATER"], "Please give me some water.", "தயவுசெய்து எனக்கு தண்ணீர் கொடுங்கள்."),
    (["WATER", "PLEASE"], "Could you please give me water?", "தயவுசெய்து எனக்கு தண்ணீர் தர முடியுமா?"),
    
    # Medical & Emergency
    (["WHERE", "HOSPITAL"], "Where is the nearest hospital located?", "அருகிலுள்ள மருத்துவமனை எங்கே உள்ளது?"),
    (["NEED", "HOSPITAL"], "I urgently need to visit a hospital.", "நான் அவசரமாக மருத்துவமனைக்குச் செல்ல வேண்டும்."),
    (["WHERE", "DOCTOR"], "Where can I find a doctor?", "மருத்துவர் எங்கே இருக்கிறார்?"),
    (["NEED", "DOCTOR"], "I need to see a doctor immediately.", "நான் உடனடியாக மருத்துவரைப் பார்க்க வேண்டும்."),
    (["PLEASE", "DOCTOR"], "Please call a doctor for me.", "தயவுசெய்து எனக்காக ஒரு மருத்துவரை அழைக்கவும்."),
    (["EMERGENCY", "HELP"], "This is an emergency! Please help immediately!", "இது அவசர நிலை! தயவுசெய்து உடனடியாக உதவுங்கள்!"),
    (["HELP", "EMERGENCY"], "Emergency assistance is required right now!", "உடனடி அவசர உதவி தேவைப்படுகிறது!"),
    (["PLEASE", "HELP"], "Please help me with this situation.", "தயவுசெய்து எனக்கு இந்த நிலையில் உதவுங்கள்."),
    (["NEED", "HELP"], "I really need some help.", "எனக்கு உதவி மிகவும் தேவைப்படுகிறது."),
    
    # Greetings & Social
    (["HELLO", "HOW", "YOU"], "Hello, how are you doing today?", "வணக்கம், நீங்கள் இன்று எப்படி இருக்கிறீர்கள்?"),
    (["HELLO", "FRIEND"], "Hello, my dear friend!", "வணக்கம், என் அன்பான நண்பரே!"),
    (["GOOD", "MORNING", "FRIEND"], "Good morning, my friend!", "காலை வணக்கம் நண்பரே!"),
    (["GOOD", "NIGHT", "FRIEND"], "Good night, sleep well my friend.", "இனிய இரவு வணக்கம், நலமாக உறங்குங்கள் நண்பரே."),
    (["HELLO", "MY", "NAME"], "Hello, let me introduce my name.", "வணக்கம், என் பெயரை அறிமுகப்படுத்துகிறேன்."),
    (["MY", "NAME"], "My name is", "என் பெயர்"),
    (["THANK YOU", "FRIEND"], "Thank you so much, my friend.", "மிக்க நன்றி, என் நண்பரே."),
    (["THANK YOU", "VERY MUCH"], "Thank you very much for everything.", "எல்லாவற்றிற்கும் மிக்க நன்றி."),
    
    # Navigation & Actions
    (["WHERE", "HOME"], "Where is my home located?", "என் வீடு எங்கே இருக்கிறது?"),
    (["GO", "HOME"], "I would like to go home now.", "நான் இப்போது வீட்டிற்குச் செல்ல விரும்புகிறேன்."),
    (["GO", "HOSPITAL"], "Let us go to the hospital right away.", "உடனடியாக மருத்துவமனைக்குச் செல்வோம்."),
    (["COME", "HOME"], "Please come to my home.", "தயவுசெய்து எங்கள் வீட்டிற்கு வாருங்கள்."),
    (["COME", "HELP"], "Please come here and help me.", "தயவுசெய்து இங்கே வந்து எனக்கு உதவுங்கள்."),
    (["STOP", "PLEASE"], "Please stop right here.", "தயவுசெய்து இங்கே நிறுத்துங்கள்."),
    (["WAIT", "PLEASE"], "Please wait a moment for me.", "தயவுசெய்து எனக்காக சிறிது நேரம் காத்திருங்கள்.")
]


class SentencePredictionEngine:
    """
    Intelligent ML Sentence & Intent Predictor using RandomForest & XGBoost.
    Transforms raw sign tokens and single signs into rich, fluent, grammatical sentences.
    """
    _instance = None

    def __init__(self):
        self.vectorizer: Optional[CountVectorizer] = None
        self.rf_model: Optional[RandomForestClassifier] = None
        self.intent_labels: List[Tuple[str, str]] = []
        self.load_or_train_sentence_model()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = SentencePredictionEngine()
        return cls._instance

    @staticmethod
    def deduplicate_sign_sequence(signs: List[str]) -> List[str]:
        """
        Removes consecutive repeated sign tokens caused by continuous camera frames.
        e.g. ['PLEASE', 'PLEASE', 'FOOD', 'FOOD', 'FOOD'] -> ['PLEASE', 'FOOD']
        """
        if not signs:
            return []
        cleaned = []
        for s in signs:
            s_clean = s.strip().upper()
            if not s_clean or s_clean in ['NO HAND', 'UNCERTAIN', 'UNKNOWN', ' ']:
                continue
            if not cleaned or cleaned[-1] != s_clean:
                cleaned.append(s_clean)
        return cleaned

    def train_models(self):
        """Trains RandomForest & XGBoost models on sign sequence intents."""
        logger.info("Training ISL RandomForest Sentence Predictor...")
        
        # Build training corpus: combine all single signs + compound sequences
        corpus_texts = []
        targets = []
        
        # Add single signs
        for sign, trans in SINGLE_SIGN_SENTENCES.items():
            corpus_texts.append(sign)
            targets.append((trans["en"], trans["ta"]))
            # Variations with repetitions
            corpus_texts.append(f"{sign} {sign}")
            targets.append((trans["en"], trans["ta"]))
            corpus_texts.append(f"{sign} {sign} {sign}")
            targets.append((trans["en"], trans["ta"]))

        # Add compound phrases
        for signs_list, eng, tam in COMPOUND_INTENT_DATA:
            sign_str = " ".join(signs_list)
            corpus_texts.append(sign_str)
            targets.append((eng, tam))
            # With repeated tokens
            rep_str = " ".join([f"{s} {s}" for s in signs_list])
            corpus_texts.append(rep_str)
            targets.append((eng, tam))

        self.intent_labels = list(set(targets))
        label_to_idx = {lbl: i for i, lbl in enumerate(self.intent_labels)}
        y = np.array([label_to_idx[t] for t in targets])

        self.vectorizer = CountVectorizer(ngram_range=(1, 3), token_pattern=r"(?u)\b\w+\b")
        X = self.vectorizer.fit_transform(corpus_texts)

        self.rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=20,
            random_state=42,
            n_jobs=-1
        )
        self.rf_model.fit(X, y)

        # Save model
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump({"vectorizer": self.vectorizer, "rf": self.rf_model, "labels": self.intent_labels}, SENTENCE_MODEL_FILE)
        logger.info(f"Trained RandomForest Sentence Predictor with {len(self.intent_labels)} intent classes.")

    def load_or_train_sentence_model(self):
        if SENTENCE_MODEL_FILE.exists():
            try:
                data = joblib.load(SENTENCE_MODEL_FILE)
                self.vectorizer = data["vectorizer"]
                self.rf_model = data["rf"]
                self.intent_labels = data["labels"]
                logger.info(f"Loaded existing Sentence Prediction model with {len(self.intent_labels)} intents.")
                return
            except Exception as e:
                logger.warning(f"Failed to load sentence model: {e}. Retraining...")
        self.train_models()

    def predict_sentence(self, signs: List[str]) -> Tuple[str, str, float]:
        """
        Deduplicates sign stream and predicts high-accuracy English and Tamil sentence.
        Returns: (english_sentence, tamil_sentence, confidence)
        """
        if not signs:
            return "", "", 0.0

        deduped = self.deduplicate_sign_sequence(signs)
        if not deduped:
            return "", "", 0.0

        # Case 1: Single sign fast high-accuracy mapping
        if len(deduped) == 1:
            single = deduped[0]
            if single in SINGLE_SIGN_SENTENCES:
                en = SINGLE_SIGN_SENTENCES[single]["en"]
                ta = SINGLE_SIGN_SENTENCES[single]["ta"]
                return en, ta, 0.98

        # Case 2: RandomForest ML Intent Prediction
        if self.vectorizer and self.rf_model:
            text_input = " ".join(deduped)
            X_vec = self.vectorizer.transform([text_input])
            probs = self.rf_model.predict_proba(X_vec)[0]
            best_idx = int(np.argmax(probs))
            conf = float(probs[best_idx])

            if conf >= 0.20 and best_idx < len(self.intent_labels):
                eng_out, tam_out = self.intent_labels[best_idx]
                return eng_out, tam_out, round(conf, 3)

        # Case 3: Fallback synthesis with rich single words
        eng_parts = []
        tam_parts = []
        for s in deduped:
            if s in SINGLE_SIGN_SENTENCES:
                eng_parts.append(SINGLE_SIGN_SENTENCES[s]["en"])
                tam_parts.append(SINGLE_SIGN_SENTENCES[s]["ta"])
            else:
                eng_parts.append(s.title())
                tam_parts.append(s)

        fallback_en = " ".join(eng_parts)
        fallback_ta = " ".join(tam_parts)
        return fallback_en, fallback_ta, 0.60
