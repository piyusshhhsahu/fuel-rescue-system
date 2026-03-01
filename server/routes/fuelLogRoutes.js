const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const FuelLog = require('../models/FuelLog');
const Vehicle = require('../models/Vehicle');

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

// ── POST /api/fuel-logs — Log current fuel level ─────────────
router.post('/', auth, async (req, res) => {
    try {
        const { vehicleId, fuelLevelLiters, source } = req.body;

        // Verify ownership
        const vehicle = await Vehicle.findOne({ _id: vehicleId, user: req.user.id });
        if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });

        const log = new FuelLog({
            vehicle: vehicleId,
            user: req.user.id,
            fuelLevelLiters,
            source: source || 'manual',
        });
        await log.save();
        res.status(201).json(log);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ── GET /api/fuel-logs/:vehicleId — Get logs for a vehicle ───
router.get('/:vehicleId', auth, async (req, res) => {
    try {
        const logs = await FuelLog.find({
            vehicle: req.params.vehicleId,
            user: req.user.id,
        }).sort({ loggedAt: -1 }).limit(50);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ── GET /api/fuel-logs/:vehicleId/latest — Latest fuel level ─
router.get('/:vehicleId/latest', auth, async (req, res) => {
    try {
        const log = await FuelLog.findOne({
            vehicle: req.params.vehicleId,
            user: req.user.id,
        }).sort({ loggedAt: -1 });
        res.json(log || { fuelLevelLiters: 0 });
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

module.exports = router;
