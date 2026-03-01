"""
FuelSense AI — Data Preprocessing Pipeline
============================================
Loads raw CSV, cleans, encodes, and scales features.
Returns train/test splits ready for model training.

Usage:
    from preprocessing import load_and_preprocess
    X_train, X_test, y_train, y_test, scaler, feature_names = load_and_preprocess()
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

DATA_PATH = os.path.join(os.path.dirname(__file__), "dataset", "fuel_data.csv")


def load_and_preprocess(data_path: str = DATA_PATH, test_size: float = 0.2):
    """
    Full preprocessing pipeline.

    Steps:
        1. Load CSV
        2. Handle missing values (drop rows with NaN — synthetic data should be clean)
        3. One-hot encode `vehicle_type`
        4. Separate features (X) and target (y)
        5. Scale numeric features with StandardScaler
        6. Train/test split (80/20)

    Returns:
        X_train, X_test, y_train, y_test, scaler, feature_names
    """
    # ── 1. Load ────────────────────────────────────────────────
    df = pd.read_csv(data_path)
    print(f"[LOAD] Loaded {len(df)} rows from {data_path}")

    # ── 2. Handle missing values ───────────────────────────────
    before = len(df)
    df.dropna(inplace=True)
    after = len(df)
    if before != after:
        print(f"[WARN] Dropped {before - after} rows with missing values")

    # ── 3. One-hot encode vehicle_type ─────────────────────────
    df = pd.get_dummies(df, columns=["vehicle_type"], prefix="vtype", drop_first=False)

    # ── 4. Separate X and y ────────────────────────────────────
    target_col = "fuel_exhaustion_days"
    y = df[target_col].values
    X = df.drop(columns=[target_col])

    feature_names = list(X.columns)

    # ── 5. Scale features ──────────────────────────────────────
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # ── 6. Train/test split ────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=test_size, random_state=42
    )

    print(f"[OK] Preprocessing complete -- Train: {len(X_train)}, Test: {len(X_test)}")
    print(f"    Features ({len(feature_names)}): {feature_names}")

    return X_train, X_test, y_train, y_test, scaler, feature_names


if __name__ == "__main__":
    X_train, X_test, y_train, y_test, scaler, feature_names = load_and_preprocess()
    print(f"\n-- Target distribution -------------------------")
    print(f"   Train  mean={y_train.mean():.2f}  std={y_train.std():.2f}")
    print(f"   Test   mean={y_test.mean():.2f}   std={y_test.std():.2f}")
