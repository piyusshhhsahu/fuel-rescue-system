"""
FuelSense AI — Flask REST API
===============================
Serves the trained fuel-exhaustion prediction model via HTTP.

Endpoints:
    POST /predict   — Accept vehicle data → return prediction + risk level
    GET  /health    — Returns service health status

Usage:
    python app.py             # Development (port 5001)
    gunicorn app:app -b :5001 # Production
"""

import os
import sys
import numpy as np
import pandas as pd
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ── Load model artifacts ──────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")

try:
    model = joblib.load(os.path.join(MODEL_DIR, "model.pkl"))
    meta  = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
    scaler = meta["scaler"]
    feature_names = meta["feature_names"]
    MODEL_LOADED = True
    print(f"[OK] Model loaded with {len(feature_names)} features")
except Exception as e:
    MODEL_LOADED = False
    print(f"[WARN] Model not found -- run train_model.py first. Error: {e}")
    model = None
    scaler = None
    feature_names = []


def classify_risk(days: float) -> dict:
    """Classify fuel exhaustion into risk levels."""
    if days <= 1:
        return {"level": "High",   "color": "#EF4444", "emoji": "🔴", "action": "Immediate refuel required!"}
    elif days <= 3:
        return {"level": "Medium", "color": "#F59E0B", "emoji": "🟡", "action": "Plan a refuel soon."}
    else:
        return {"level": "Low",    "color": "#10B981", "emoji": "🟢", "action": "Fuel level is comfortable."}


def build_feature_vector(data: dict) -> np.ndarray:
    """
    Convert raw JSON input into a feature vector matching
    the training schema (including one-hot encoded vehicle_type).
    """
    vehicle_types = ["hatchback", "motorcycle", "sedan", "suv", "truck"]
    vtype = data.get("vehicle_type", "sedan").lower()

    row = {
        "fuel_capacity_liters":           float(data.get("fuel_capacity_liters", 45)),
        "current_fuel_liters":            float(data.get("current_fuel_liters", 10)),
        "avg_mileage_kmpl":               float(data.get("avg_mileage_kmpl", 15)),
        "daily_travel_km":                float(data.get("daily_travel_km", 40)),
        "days_since_last_refill":         int(data.get("days_since_last_refill", 5)),
        "historical_avg_refill_gap_days": int(data.get("historical_avg_refill_gap_days", 7)),
        "highway_ratio":                  float(data.get("highway_ratio", 0.3)),
    }

    # One-hot encode vehicle type
    for vt in vehicle_types:
        row[f"vtype_{vt}"] = 1.0 if vtype == vt else 0.0

    # Build DataFrame in the same column order as training
    df = pd.DataFrame([row])

    # Ensure column order matches
    for col in feature_names:
        if col not in df.columns:
            df[col] = 0.0
    df = df[feature_names]

    return scaler.transform(df.values)


# ── Routes ────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy" if MODEL_LOADED else "model_not_loaded",
        "service": "FuelSense AI Engine",
        "version": "1.0.0",
        "model_loaded": MODEL_LOADED,
        "features": len(feature_names),
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict fuel exhaustion days and risk level.

    Request JSON:
    {
        "vehicle_type": "sedan",
        "fuel_capacity_liters": 45,
        "current_fuel_liters": 8,
        "avg_mileage_kmpl": 15,
        "daily_travel_km": 40,
        "days_since_last_refill": 5,
        "historical_avg_refill_gap_days": 7,
        "highway_ratio": 0.3
    }

    Response JSON:
    {
        "fuel_exhaustion_days": 3.12,
        "risk": { "level": "Medium", "color": "#F59E0B", "emoji": "🟡", "action": "..." },
        "input_summary": { ... }
    }
    """
    if not MODEL_LOADED:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 503

    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON body provided."}), 400

    # Required fields
    required = ["vehicle_type", "current_fuel_liters", "avg_mileage_kmpl", "daily_travel_km"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {missing}"}), 400

    try:
        X = build_feature_vector(data)
        prediction = model.predict(X)[0]
        prediction = max(round(float(prediction), 2), 0)

        risk = classify_risk(prediction)

        return jsonify({
            "fuel_exhaustion_days": prediction,
            "risk": risk,
            "input_summary": {
                "vehicle_type":        data.get("vehicle_type"),
                "current_fuel_liters": data.get("current_fuel_liters"),
                "avg_mileage_kmpl":    data.get("avg_mileage_kmpl"),
                "daily_travel_km":     data.get("daily_travel_km"),
            },
        })
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


@app.route("/batch-predict", methods=["POST"])
def batch_predict():
    """
    Batch prediction for fleet management.

    Request: { "vehicles": [ {...}, {...} ] }
    Response: { "predictions": [ {...}, {...} ] }
    """
    if not MODEL_LOADED:
        return jsonify({"error": "Model not loaded."}), 503

    data = request.get_json()
    vehicles = data.get("vehicles", [])

    if not vehicles:
        return jsonify({"error": "No vehicles provided."}), 400

    results = []
    for v in vehicles:
        try:
            X = build_feature_vector(v)
            pred = max(round(float(model.predict(X)[0]), 2), 0)
            results.append({
                "vehicle_type": v.get("vehicle_type"),
                "fuel_exhaustion_days": pred,
                "risk": classify_risk(pred),
            })
        except Exception as e:
            results.append({"error": str(e), "vehicle_type": v.get("vehicle_type")})

    return jsonify({"predictions": results, "total": len(results)})


if __name__ == "__main__":
    print("[START] FuelSense AI Engine starting on port 5001 ...")
    app.run(host="0.0.0.0", port=5001, debug=True)
