"""
FuelSense AI — Model Training & Evaluation
============================================
Trains a Gradient Boosting Regressor to predict how many days
remain before a vehicle's fuel is exhausted.

Evaluation Metrics:
    • MAE  (Mean Absolute Error)
    • RMSE (Root Mean Squared Error)

Risk-Level Classification:
    ≤ 1 day   →  High   (🔴)
    1–3 days  →  Medium (🟡)
    > 3 days  →  Low    (🟢)

Usage:
    python train_model.py
    -> Saves model.pkl and scaler.pkl into ai-engine/model/
"""

import os
import sys
import time
import numpy as np
import joblib
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

# Add parent dir so we can import preprocessing
sys.path.insert(0, os.path.dirname(__file__))
from preprocessing import load_and_preprocess

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")


def classify_risk(days: float) -> str:
    """Classify fuel exhaustion risk level."""
    if days <= 1:
        return "High"
    elif days <= 3:
        return "Medium"
    else:
        return "Low"


def train():
    """Train the model and save artifacts."""
    print("=" * 60)
    print("  FuelSense AI — Model Training")
    print("=" * 60)

    # ── Load preprocessed data ─────────────────────────────────
    X_train, X_test, y_train, y_test, scaler, feature_names = load_and_preprocess()

    # ── Train Gradient Boosting Regressor ──────────────────────
    print("\n[TRAIN] Training Gradient Boosting Regressor ...")
    start = time.time()

    model = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.1,
        subsample=0.8,
        min_samples_split=5,
        min_samples_leaf=3,
        random_state=42,
    )

    model.fit(X_train, y_train)
    elapsed = time.time() - start
    print(f"   Training complete in {elapsed:.2f}s")

    # ── Evaluate ───────────────────────────────────────────────
    y_pred = model.predict(X_test)

    mae  = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    print(f"\n-- Evaluation Metrics --------------------------")
    print(f"   MAE  : {mae:.4f} days")
    print(f"   RMSE : {rmse:.4f} days")

    # ── Risk-level breakdown on test set ───────────────────────
    risk_actual   = [classify_risk(d) for d in y_test]
    risk_predicted = [classify_risk(d) for d in y_pred]

    from collections import Counter
    print(f"\n-- Risk Distribution (Predicted) ---------------")
    for level, count in sorted(Counter(risk_predicted).items()):
        print(f"   {level:8s}: {count:4d}  ({count/len(risk_predicted)*100:.1f}%)")

    # Accuracy of risk classification
    correct = sum(a == p for a, p in zip(risk_actual, risk_predicted))
    print(f"\n   Risk classification accuracy: {correct/len(risk_actual)*100:.1f}%")

    # ── Feature importance ─────────────────────────────────────
    importances = model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]

    print(f"\n-- Top Feature Importances ---------------------")
    for i in range(min(8, len(feature_names))):
        idx = sorted_idx[i]
        print(f"   {feature_names[idx]:40s}  {importances[idx]:.4f}")

    # ── Save model artifacts ───────────────────────────────────
    os.makedirs(MODEL_DIR, exist_ok=True)

    model_path  = os.path.join(MODEL_DIR, "model.pkl")
    scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")
    meta_path   = os.path.join(MODEL_DIR, "metadata.txt")

    joblib.dump(model, model_path)
    joblib.dump({"scaler": scaler, "feature_names": feature_names}, scaler_path)

    with open(meta_path, "w") as f:
        f.write(f"MAE:  {mae:.4f}\n")
        f.write(f"RMSE: {rmse:.4f}\n")
        f.write(f"Features: {feature_names}\n")
        f.write(f"Risk Classification Accuracy: {correct/len(risk_actual)*100:.1f}%\n")

    print(f"\n[SAVE] Model saved     -> {model_path}")
    print(f"[SAVE] Scaler saved    -> {scaler_path}")
    print(f"[SAVE] Metadata saved  -> {meta_path}")
    print("=" * 60)

    return model, scaler, feature_names


if __name__ == "__main__":
    train()
