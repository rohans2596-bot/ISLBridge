# ISLBridge 🌉
### Real-Time AI Indian Sign Language (ISL) Translator & Accessibility Engine

> **"Breaking Communication Barriers with Indian Sign Language AI"**  
> *See the Sign. Understand the Message.*

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands_21_Landmarks-FF6F00?style=for-the-badge&logo=google&logoColor=white)](https://mediapipe.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## 🌟 Overview & Problem Statement

Over **18 million** Deaf and hard-of-hearing individuals across India rely on **Indian Sign Language (ISL)** for daily communication. Unlike American Sign Language (ASL)—which is largely single-handed for fingerspelling—ISL features distinct two-handed configurations, knuckle touches, chest/chin proximity, and unique grammatical structures.

Most existing AI accessibility applications cater exclusively to ASL or rely on simulated prototypes. **ISLBridge** is a **real, full-stack AI translation engine** that recognizes live ISL gestures from a standard webcam and converts them into natural English and Tamil text with spoken speech synthesis.

---

## 📐 Complete AI & Computer Vision Architecture

```
Camera Stream (Webcam)
       ↓
Client-Side MediaPipe Hands (21 3D Joints per Hand)
       ↓
Coordinate Translation & Scale Normalization ($x', y', z'$)
       ↓
Feature Extraction (222-Dimensional Bilateral Representation)
       ↓
Bidirectional WebSocket / REST Inference Engine
       ↓
Machine Learning Classifier (Random Forest / MLP / Gradient Boosting)
       ↓
Confidence Band Filtering (High >= 85% | Medium 60-84% | Low < 60%)
       ↓
Temporal Window Smoothing & Debounce Cooldown
       ↓
Semantic Sentence Reconstruction (Raw Signs → Natural Syntax)
       ↓
Multilingual Translation Layer (English & தமிழ்)
       ↓
Browser Web Speech API Text-to-Speech (TTS)
```

---

## 🚀 Key Features

1. **Real-Time Landmark Computer Vision**: Tracks 21 3D joint landmarks per hand directly in the browser with neon canvas skeleton overlays.
2. **True ML Inference Engine**: Powered by scikit-learn models (Random Forest, MLP, Gradient Boosting) trained on 222-dimensional normalized kinematic features.
3. **Ambidextrous & Two-Handed Support**: Handles single-hand gestures, left/right hand flipping, and two-handed bilateral ISL signs.
4. **Temporal Stability Filter**: Rolling majority voting window and debounce timer eliminate prediction flickering and duplicate sign spam.
5. **Multilingual Translation Layer**: Translates ISL concepts into grammatically natural English and Tamil (`தமிழ்`).
6. **Voice Synthesis (TTS)**: Spoken voice playback in English and Tamil with rate and pitch controls.
7. **In-App Training Studio**: Allows recording live webcam gesture samples, extracting landmarks, and retraining the active model with 1 click.
8. **Real Model Evaluation**: Generates true validation accuracy, precision, recall, weighted F1 scores, and an interactive **Confusion Matrix Heatmap**.
9. **Translation History & Analytics**: SQLite / PostgreSQL persistence of sessions, top recognized signs, and confidence distribution charts (Recharts).
10. **Accessibility First**: Text size scaling (S/M/L/XL), High Contrast dark mode, Reduced Motion option, and screen-reader compliant elements.
11. **Privacy By Design**: Video frames are processed locally in the client and never permanently stored on servers.

---

## 📚 Configured Vocabulary (32+ Active ISL Signs)

| Category | Supported Signs |
| :--- | :--- |
| **Greetings** | `HELLO`, `WELCOME`, `GOOD MORNING`, `GOOD NIGHT` |
| **Courtesy** | `THANK YOU`, `PLEASE`, `YES`, `NO`, `GOOD`, `BAD`, `SORRY` |
| **Basic Needs** | `HELP`, `WATER`, `FOOD`, `EMERGENCY`, `NEED` |
| **Places** | `HOME`, `SCHOOL`, `COLLEGE`, `HOSPITAL` |
| **People** | `DOCTOR`, `FRIEND`, `FAMILY`, `NAME`, `YOU`, `ME`, `MY` |
| **Questions** | `WHAT`, `WHERE`, `WHEN`, `WHY`, `HOW` |
| **Actions** | `STOP`, `COME`, `GO`, `WAIT` |

*New vocabulary signs can be added and trained anytime via the in-app **Training Studio**.*

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Canvas Confetti, Web Speech API, MediaPipe Hands.
- **Backend**: Python 3.11+, FastAPI, Uvicorn, WebSockets, Pydantic v2, SQLAlchemy.
- **Machine Learning**: Scikit-Learn, NumPy, Joblib, OpenCV.
- **Database**: SQLite (default local zero-config) / Supabase PostgreSQL (production ready).

---

## 📦 Installation & Setup

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)

---

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (optional)
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run backend test suite
pytest tests/

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be running at: `http://localhost:8000`  
Interactive Swagger API docs: `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```

Frontend will be accessible at: `http://localhost:5173`

---

## ⚡ 1-Click Launch Scripts (Windows)

Double-click `run_dev.bat` or execute in PowerShell:

```powershell
.\run_dev.ps1
```

---

## 🌐 API Endpoints Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/health` | `GET` | System and active model health status |
| `/ws/translate` | `WebSocket` | Real-time streaming inference & temporal smoothing |
| `/api/predict` | `POST` | Single-frame landmark inference |
| `/api/translate-sentence` | `POST` | Grammatical sentence construction (English & Tamil) |
| `/api/signs` | `GET` | List all configured ISL vocabulary classes |
| `/api/dataset/sample` | `POST` | Save user-recorded landmark sample |
| `/api/dataset/stats` | `GET` | Return dataset distribution and sample counts |
| `/api/model/status` | `GET` | Check loaded model classes and version |
| `/api/model/metrics` | `GET` | Retrieve validation accuracy, F1, and confusion matrix |
| `/api/model/train` | `POST` | Trigger model retraining with custom samples |
| `/api/translation/save` | `POST` | Save translation session to history |
| `/api/translation/history` | `GET` | Retrieve past translation logs |
| `/api/translation/history/{id}` | `DELETE` | Delete session entry from history |
| `/api/analytics` | `GET` | Aggregate database analytics and sign frequencies |

---

## 🧪 Testing

```bash
cd backend
python -m pytest tests/ -v
```

All 11 unit & integration tests verify:
- Feature extraction & normalization invariants
- Landmark dataset generation
- Real ML classifier predictions & confidence intervals
- Temporal smoothing and debounce logic
- Translation engine & Tamil mappings
- FastAPI REST endpoints & Database persistence

---

## 🔒 Privacy & Data Ethics

- **Zero Frame Storing**: Camera frames are processed ephemerally on the client to extract 21-point joint vectors.
- **No Unconsented Recording**: Landmark features are only saved when explicitly in "Training Mode".
- **Local SQLite Fallback**: Operates entirely offline on the local system without cloud dependencies.

---

## 🏆 Hackathon Presentation Flow (Demo Mode)

1. Open `/demo` page.
2. Click **[START LIVE DEMO]** to engage webcam.
3. Perform the **"HELLO"** gesture (open palm wave).
4. Observe **8-Stage AI Pipeline** animating in real time with high confidence (90%+).
5. Perform **"THANK YOU"** or **"HELP"**.
6. View accumulated English & Tamil sentence construction.
7. Click **[Speak Sentence]** to trigger multilingual voice synthesis.
8. Switch to `/training` and `/models` to show live confusion matrix and real ML metrics.

---

## 📄 License

Distributed under the MIT License. Built for inclusive communication and AI accessibility.
