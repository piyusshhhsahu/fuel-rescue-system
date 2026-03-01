const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Vehicle = require('../models/Vehicle');
const FuelLog = require('../models/FuelLog');
const Prediction = require('../models/Prediction');

// AI Engine URL — configure via env for production
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5001';

// ── Auth middleware ───────────────────────────────────────────
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// ── POST /api/predictions/run — Run AI prediction ────────────
// This is the core endpoint that:
//   1. Fetches the vehicle + latest fuel log
//   2. Calls the Python AI engine
//   3. Saves the prediction to MongoDB
//   4. Returns the result (and optionally triggers Socket.io alert)
router.post('/run', auth, async (req, res) => {
    try {
        const { vehicleId, currentFuelLiters } = req.body;

        // 1. Fetch vehicle
        const vehicle = await Vehicle.findOne({ _id: vehicleId, user: req.user.id });
        if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });

        // 2. Get current fuel level (from request body or latest log)
        let fuelLevel = currentFuelLiters;
        if (!fuelLevel) {
            const latestLog = await FuelLog.findOne({ vehicle: vehicleId }).sort({ loggedAt: -1 });
            fuelLevel = latestLog ? latestLog.fuelLevelLiters : vehicle.fuelCapacityLiters * 0.25;
        }

        // Calculate days since last refill
        const daysSinceRefill = Math.floor(
            (Date.now() - new Date(vehicle.lastRefillDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        // 3. Build AI request payload
        const aiPayload = {
            vehicle_type: vehicle.vehicleType,
            fuel_capacity_liters: vehicle.fuelCapacityLiters,
            current_fuel_liters: fuelLevel,
            avg_mileage_kmpl: vehicle.avgMileageKmpl,
            daily_travel_km: vehicle.dailyTravelKm,
            days_since_last_refill: daysSinceRefill,
            historical_avg_refill_gap_days: vehicle.historicalRefillGapDays,
            highway_ratio: vehicle.highwayRatio,
        };

        // 4. Call Python AI Engine
        const aiResponse = await fetch(`${AI_ENGINE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aiPayload),
        });

        if (!aiResponse.ok) {
            const errData = await aiResponse.json().catch(() => ({}));
            return res.status(502).json({
                msg: 'AI Engine error',
                error: errData.error || `Status ${aiResponse.status}`,
            });
        }

        const aiResult = await aiResponse.json();

        // 5. Save prediction to MongoDB
        const prediction = new Prediction({
            user: req.user.id,
            vehicle: vehicleId,
            fuelExhaustionDays: aiResult.fuel_exhaustion_days,
            riskLevel: aiResult.risk.level,
            riskColor: aiResult.risk.color,
            riskAction: aiResult.risk.action,
            inputSnapshot: {
                vehicleType: vehicle.vehicleType,
                fuelCapacityLiters: vehicle.fuelCapacityLiters,
                currentFuelLiters: fuelLevel,
                avgMileageKmpl: vehicle.avgMileageKmpl,
                dailyTravelKm: vehicle.dailyTravelKm,
                daysSinceLastRefill: daysSinceRefill,
                historicalAvgRefillGapDays: vehicle.historicalRefillGapDays,
                highwayRatio: vehicle.highwayRatio,
            },
        });
        await prediction.save();

        // 6. If high risk, emit Socket.io alert (if io is available)
        if (aiResult.risk.level === 'High' && req.app.get('io')) {
            const io = req.app.get('io');
            io.to(`user_${req.user.id}`).emit('fuel_alert', {
                type: 'HIGH_RISK',
                message: `⚠️ Your ${vehicle.vehicleName || vehicle.vehicleType} is predicted to run out of fuel in ${aiResult.fuel_exhaustion_days} days!`,
                prediction: {
                    fuelExhaustionDays: aiResult.fuel_exhaustion_days,
                    riskLevel: aiResult.risk.level,
                    vehicleId: vehicleId,
                },
            });
        }

        res.json({
            prediction: {
                _id: prediction._id,
                fuelExhaustionDays: aiResult.fuel_exhaustion_days,
                risk: aiResult.risk,
                vehicleType: vehicle.vehicleType,
                vehicleName: vehicle.vehicleName,
                currentFuelLiters: fuelLevel,
                predictedAt: prediction.predictedAt,
            },
        });

    } catch (err) {
        console.error('Prediction error:', err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ── GET /api/predictions — Get prediction history ────────────
router.get('/', auth, async (req, res) => {
    try {
        const predictions = await Prediction.find({ user: req.user.id })
            .populate('vehicle', 'vehicleName vehicleType')
            .sort({ predictedAt: -1 })
            .limit(20);
        res.json(predictions);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ── GET /api/predictions/latest/:vehicleId — Latest for vehicle
router.get('/latest/:vehicleId', auth, async (req, res) => {
    try {
        const prediction = await Prediction.findOne({
            user: req.user.id,
            vehicle: req.params.vehicleId,
        }).sort({ predictedAt: -1 });

        if (!prediction) return res.status(404).json({ msg: 'No predictions yet' });
        res.json(prediction);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ── PATCH /api/predictions/:id/acknowledge — Mark as seen ────
router.patch('/:id/acknowledge', auth, async (req, res) => {
    try {
        const prediction = await Prediction.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { acknowledged: true },
            { new: true }
        );
        if (!prediction) return res.status(404).json({ msg: 'Prediction not found' });
        res.json(prediction);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

module.exports = router;
