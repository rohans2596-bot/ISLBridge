# AI4Bharat INCLUDE-50 LSTM Pipeline (24-Hour Hackathon)

This repository sub-project implements the official **AI4Bharat INCLUDE-50** dataset pipeline using **MediaPipe Pose + Hands (134 features)** and a lightweight **2-Layer LSTM**.

---

## 📁 Directory Structure

```text
include50/
├── CODE/
│   ├── select_include50.py          # Extracts 958 INCLUDE-50 videos from raw Zenodo files
│   ├── check_include50.py           # Validates 50 clean class names and creates labels.json
│   ├── extract_include50_keypoints.py # Computes 134-D keypoints per frame once
│   ├── prepare_lstm_data.py         # Samples uniform (30, 134) sequences & train/val/test splits
│   ├── train_include50_lstm.py      # Trains PyTorch LSTM with EarlyStopping
│   ├── live_predict.py              # Real-time webcam inference + temporal stabilizer + sentence builder
│   └── labels.json                  # Official 50 INCLUDE-50 classes list
├── KEYPOINTS/
│   ├── X_train.npy, y_train.npy     # 689 Train samples shape (689, 30, 134)
│   ├── X_val.npy, y_val.npy         # 77 Val samples shape (77, 30, 134)
│   ├── X_test.npy, y_test.npy       # 192 Test samples shape (192, 30, 134)
│   └── labels.json
└── MODELS/
    └── include50_lstm.pt            # Trained 50-class LSTM checkpoint
```

---

## 🚀 Step-by-Step Execution Sequence

### Step 1: Clone Official AI4Bharat INCLUDE Repository
```powershell
git clone https://github.com/AI4Bharat/INCLUDE.git C:\INCLUDE
```
*Contains `train_test_paths/include50_train.txt`, `include50_val.txt`, and `include50_test.txt`.*

### Step 2: Download Dataset from Zenodo
Download category zip archives from [Zenodo Record 4010759](https://zenodo.org/records/4010759) and extract into `include50/INCLUDE_RAW/` (or `C:\ISL_HACKATHON\INCLUDE_RAW\`).

### Step 3: Select Only the 958 INCLUDE-50 Videos
```powershell
python include50/CODE/select_include50.py
```

### Step 4: Validate the 50 Target Classes
```powershell
python include50/CODE/check_include50.py
```

### Step 5: Extract 134-D MediaPipe Keypoints Once
```powershell
python include50/CODE/extract_include50_keypoints.py
```
- **Pose (0..24):** 25 landmarks × 2 (x, y) = 50
- **Left Hand:** 21 landmarks × 2 (x, y) = 42
- **Right Hand:** 21 landmarks × 2 (x, y) = 42
- **Total:** 134 values per frame

### Step 6: Prepare Uniform (30, 134) Splits
```powershell
python include50/CODE/prepare_lstm_data.py
```

### Step 7: Train the 2-Layer LSTM
```powershell
python include50/CODE/train_include50_lstm.py
```

### Step 8: Run Real-time Webcam Inference
```powershell
python include50/CODE/live_predict.py
```
- Press `q` to exit.
- Press `c` to clear the word buffer.

---

## 🎯 50 INCLUDE-50 Official Classes
`Bank`, `Bird`, `Black`, `Boy`, `Brother`, `Car`, `Cell phone`, `Court`, `Cow`, `Death`, `Dog`, `Election`, `Fall`, `Fan`, `Father`, `Girl`, `Good Morning`, `Hat`, `Hello`, `House`, `I`, `Monday`, `Paint`, `Pen`, `Priest`, `Red`, `Shoes`, `Shop`, `Summer`, `T-Shirt`, `Teacher`, `Thank you`, `Time`, `White`, `Window`, `Year`, `Large`, `Dry`, `Good`, `Happy`, `Hot`, `It`, `Long`, `Loud`, `New`, `Quiet`, `Short`, `Small`, `Train Ticket`, `You (plural)`.
