const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
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

// ── POST /api/vehicles — Register a new vehicle ──────────────
router.post('/', auth, async (req, res) => {
    try {
        const vehicle = new Vehicle({
            user: req.user.id,
            ...req.body,
        });
        await vehicle.save();
        res.status(201).json(vehicle);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ── GET /api/vehicles — Get all vehicles for logged-in user ──
router.get('/', auth, async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ── GET /api/vehicles/:id — Get a single vehicle ─────────────
router.get('/:id', auth, async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({ _id: req.params.id, user: req.user.id });
        if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });
        res.json(vehicle);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ── PUT /api/vehicles/:id — Update a vehicle ─────────────────
router.put('/:id', auth, async (req, res) => {
    try {
        const vehicle = await Vehicle.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true }
        );
        if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });
        res.json(vehicle);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ── DELETE /api/vehicles/:id — Remove a vehicle ──────────────
router.delete('/:id', auth, async (req, res) => {
    try {
        const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });
        res.json({ msg: 'Vehicle removed' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

module.exports = router;
