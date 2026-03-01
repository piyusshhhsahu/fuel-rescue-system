"""
FuelSense AI — Synthetic Dataset Generator
============================================
Generates 5,000 realistic vehicle + fuel usage records for training
the fuel-exhaustion prediction model.

Each row simulates a snapshot of a vehicle's current state and
the *actual* number of days remaining before the fuel runs out
(our regression target).

Usage:
    python generate_synthetic_data.py
    -> Writes fuel_data.csv to this directory
"""

import numpy as np
import pandas as pd
import os

np.random.seed(42)

N = 5000  # number of records

# ── Vehicle types with typical parameters ──────────────────────────
VEHICLE_PROFILES = {
    #                  (tank_min, tank_max, mileage_min, mileage_max)
    "sedan":           (35, 55,   12, 22),
    "suv":             (50, 80,   8,  16),
    "hatchback":       (30, 45,   14, 24),
    "truck":           (60, 120,  5,  12),
    "motorcycle":      (10, 20,   30, 60),
}

vehicle_types = np.random.choice(list(VEHICLE_PROFILES.keys()), N)

records = []
for vtype in vehicle_types:
    tank_min, tank_max, mil_min, mil_max = VEHICLE_PROFILES[vtype]

    fuel_capacity = round(np.random.uniform(tank_min, tank_max), 1)
    current_fuel  = round(np.random.uniform(1, fuel_capacity), 1)
    avg_mileage   = round(np.random.uniform(mil_min, mil_max), 1)
    daily_travel   = round(np.random.uniform(5, 120), 1)       # km/day
    days_since_refill = int(np.random.randint(0, 30))
    hist_refill_gap   = int(np.random.randint(3, 21))
    highway_ratio     = round(np.random.uniform(0, 1), 2)

    # ── Ground-truth calculation ──────────────────────────────
    # Effective mileage: highway driving is ~20 % more fuel-efficient
    effective_mileage = avg_mileage * (1 + 0.20 * highway_ratio)

    # Daily fuel consumption (liters/day)
    daily_consumption = daily_travel / effective_mileage if effective_mileage > 0 else daily_travel

    # Days remaining = current fuel / daily consumption
    fuel_exhaustion_days = current_fuel / daily_consumption if daily_consumption > 0 else 30
    fuel_exhaustion_days = round(max(fuel_exhaustion_days, 0), 2)

    # Add realistic noise (± up to 10 %)
    noise = np.random.normal(0, fuel_exhaustion_days * 0.05)
    fuel_exhaustion_days = round(max(fuel_exhaustion_days + noise, 0), 2)

    records.append({
        "vehicle_type":                   vtype,
        "fuel_capacity_liters":           fuel_capacity,
        "current_fuel_liters":            current_fuel,
        "avg_mileage_kmpl":               avg_mileage,
        "daily_travel_km":                daily_travel,
        "days_since_last_refill":         days_since_refill,
        "historical_avg_refill_gap_days": hist_refill_gap,
        "highway_ratio":                  highway_ratio,
        "fuel_exhaustion_days":           fuel_exhaustion_days,
    })

df = pd.DataFrame(records)

out_path = os.path.join(os.path.dirname(__file__), "fuel_data.csv")
df.to_csv(out_path, index=False)

print(f"[OK] Generated {len(df)} records -> {out_path}")
print(f"\n-- Sample rows ---------------------------------")
print(df.head(10).to_string(index=False))
print(f"\n-- Summary stats -------------------------------")
print(df.describe().round(2).to_string())
