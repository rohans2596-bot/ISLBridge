import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import init_db
from app.ml.synthetic_isl_dataset import create_hand_pose

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    init_db()

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True

def test_get_signs():
    res = client.get("/api/signs")
    assert res.status_code == 200
    signs = res.json()
    assert len(signs) >= 30
    assert any(s["name"] == "HELLO" for s in signs)

def test_predict_api():
    pose = create_hand_pose("open", "open", "open", "open", "open")
    payload = {
        "landmarks": pose,
        "handedness": "Right"
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "sign" in data
    assert "confidence" in data
    assert data["hand_detected"] is True

def test_translate_sentence_api():
    res = client.post("/api/translate-sentence", json={"signs": ["HELLO", "WATER"]})
    assert res.status_code == 200
    data = res.json()
    assert "Hello" in data["english_text"]
    assert "வணக்கம்" in data["tamil_text"]

def test_model_status():
    res = client.get("/api/model/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert data["classes_count"] >= 30

def test_translation_history_and_analytics():
    # Save a test session
    save_payload = {
        "user_name": "Test User",
        "language": "en",
        "raw_signs": ["HELLO", "THANK YOU"],
        "final_text": "Hello, thank you.",
        "tamil_translation": "வணக்கம், நன்றி.",
        "average_confidence": 0.94,
        "duration_seconds": 12.5
    }
    save_res = client.post("/api/translation/save", json=save_payload)
    assert save_res.status_code == 200
    saved_data = save_res.json()
    assert saved_data["id"] is not None

    # Get history
    hist_res = client.get("/api/translation/history")
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) >= 1

    # Get analytics
    analytics_res = client.get("/api/analytics")
    assert analytics_res.status_code == 200
    analytics = analytics_res.json()
    assert analytics["summary"]["total_translations"] >= 1
