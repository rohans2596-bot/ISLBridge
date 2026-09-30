"""
CODE/train_include50_lstm.py
Trains a lightweight 2-layer LSTM on pre-extracted (30, 134) keypoint sequences.
Uses PyTorch (or TensorFlow if available) with EarlyStopping and saves include50_lstm.pt / include50_lstm.onnx.
"""
import os
import sys
import json
import time
import numpy as np
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(os.environ.get("ISL_HACKATHON_DIR", Path(__file__).resolve().parent.parent))
KEYPOINTS_DIR = BASE_DIR / "KEYPOINTS"
MODELS_DIR = BASE_DIR / "MODELS"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_SAVE_PATH = MODELS_DIR / "include50_lstm.pt"
ONNX_SAVE_PATH = MODELS_DIR / "include50_lstm.onnx"
LABEL_JSON = KEYPOINTS_DIR / "labels.json"

def train_pytorch(X_train, y_train, X_val, y_val, X_test, y_test, num_classes=50, epochs=25, batch_size=32):
    import torch
    import torch.nn as nn
    from torch.utils.data import TensorDataset, DataLoader

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training on device: {device}")

    # Build Dataset and DataLoaders
    train_ds = TensorDataset(torch.tensor(X_train, dtype=torch.float32), torch.tensor(y_train, dtype=torch.long))
    val_ds   = TensorDataset(torch.tensor(X_val, dtype=torch.float32),   torch.tensor(y_val, dtype=torch.long))
    test_ds  = TensorDataset(torch.tensor(X_test, dtype=torch.float32),  torch.tensor(y_test, dtype=torch.long))

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader   = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    test_loader  = DataLoader(test_ds, batch_size=batch_size, shuffle=False)

    class Include50LSTM(nn.Module):
        def __init__(self, input_dim=134, hidden_dim=64, num_classes=50):
            super().__init__()
            self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers=2, batch_first=True, dropout=0.2)
            self.fc1 = nn.Linear(hidden_dim, 64)
            self.relu = nn.ReLU()
            self.dropout = nn.Dropout(0.3)
            self.fc2 = nn.Linear(64, num_classes)

        def forward(self, x):
            out, _ = self.lstm(x)
            last_step = out[:, -1, :]
            dense1 = self.relu(self.fc1(last_step))
            dropped = self.dropout(dense1)
            logits = self.fc2(dropped)
            return logits

    model = Include50LSTM(input_dim=134, hidden_dim=64, num_classes=num_classes).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    best_val_loss = float("inf")
    patience, patience_counter = 5, 0

    print("\nStarting Training Loop...")
    for epoch in range(1, epochs + 1):
        model.train()
        total_loss, correct, total = 0.0, 0, 0
        for bx, by in train_loader:
            bx, by = bx.to(device), by.to(device)
            optimizer.zero_grad()
            preds = model(bx)
            loss = criterion(preds, by)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * len(by)
            correct += (preds.argmax(dim=1) == by).sum().item()
            total += len(by)

        train_acc = correct / total
        train_loss = total_loss / total

        # Validation
        model.eval()
        v_loss, v_corr, v_total = 0.0, 0, 0
        with torch.no_grad():
            for bx, by in val_loader:
                bx, by = bx.to(device), by.to(device)
                preds = model(bx)
                loss = criterion(preds, by)
                v_loss += loss.item() * len(by)
                v_corr += (preds.argmax(dim=1) == by).sum().item()
                v_total += len(by)

        val_acc = v_corr / v_total if v_total > 0 else 0
        val_loss = v_loss / v_total if v_total > 0 else 0

        print(f"Epoch {epoch:2d}/{epochs} - loss: {train_loss:.4f} - acc: {train_acc*100:.1f}% | val_loss: {val_loss:.4f} - val_acc: {val_acc*100:.1f}%")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            torch.save(model.state_dict(), str(MODEL_SAVE_PATH))
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"[*] Early stopping triggered after epoch {epoch}.")
                break

    # Load best weights
    model.load_state_dict(torch.load(str(MODEL_SAVE_PATH)))
    model.eval()

    # Evaluation on Test Split
    t_corr, t_total = 0, 0
    test_preds_list, test_targets_list = [], []
    with torch.no_grad():
        for bx, by in test_loader:
            bx = bx.to(device)
            preds = model(bx)
            t_corr += (preds.argmax(dim=1).cpu() == by).sum().item()
            t_total += len(by)
            test_preds_list.extend(preds.softmax(dim=1).cpu().numpy())
            test_targets_list.extend(by.numpy())

    test_acc = t_corr / t_total if t_total > 0 else 0
    print("\n" + "=" * 65)
    print(f">> Final Test Accuracy on INCLUDE-50: {test_acc * 100:.2f}%")
    print("=" * 65)

    # Optional ONNX export if onnxscript is available
    try:
        dummy_input = torch.randn(1, 30, 134, device=device)
        torch.onnx.export(
            model, dummy_input, str(ONNX_SAVE_PATH),
            input_names=["landmarks"], output_names=["probabilities"],
            dynamic_axes={"landmarks": {0: "batch_size"}, "probabilities": {0: "batch_size"}}
        )
        print(f"[*] Exported ONNX runtime model to: {ONNX_SAVE_PATH}")
    except Exception as e:
        print(f"[*] PyTorch native checkpoint saved: {MODEL_SAVE_PATH}")
    return model, test_preds_list, test_targets_list

def main():
    print("=" * 65)
    print("Training INCLUDE-50 LSTM Gesture Classifier")
    print("=" * 65)

    X_train = np.load(KEYPOINTS_DIR / "X_train.npy")
    y_train = np.load(KEYPOINTS_DIR / "y_train.npy")
    X_val   = np.load(KEYPOINTS_DIR / "X_val.npy")
    y_val   = np.load(KEYPOINTS_DIR / "y_val.npy")
    X_test  = np.load(KEYPOINTS_DIR / "X_test.npy")
    y_test  = np.load(KEYPOINTS_DIR / "y_test.npy")

    print(f"[*] Train set: {X_train.shape[0]} samples")
    print(f"[*] Val set:   {X_val.shape[0]} samples")
    print(f"[*] Test set:  {X_test.shape[0]} samples")

    with open(LABEL_JSON, "r", encoding="utf-8") as f:
        meta = json.load(f)
    classes = meta["classes"]

    model, test_preds, test_targets = train_pytorch(
        X_train, y_train, X_val, y_val, X_test, y_test,
        num_classes=len(classes), epochs=20, batch_size=32
    )

    print("\nSample Test Predictions:")
    for i in range(min(5, len(test_preds))):
        actual_name = classes[test_targets[i]]
        pred_idx = int(np.argmax(test_preds[i]))
        pred_name = classes[pred_idx]
        conf = float(test_preds[i][pred_idx])
        print(f"  Actual: {actual_name:<16} | Predicted: {pred_name:<16} | Confidence: {conf:.2f}")

    print(f"\n[SUCCESS] Model checkpoint saved to {MODEL_SAVE_PATH}")

if __name__ == "__main__":
    main()
