const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Pump = require('../models/Pump');
const Agent = require('../models/Agent');
const { getDbStatus } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// Register User
router.post('/register/user', async (req, res) => {
    if (!getDbStatus()) {
        const { name, email, role } = req.body;
        const token = jwt.sign({ id: 'mock_user_id', role: 'user' }, JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token, user: { id: 'mock_user_id', name: name || 'Mock User', role: 'user' } });
    }
    try {
        const { name, email, password, phone } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        user = new User({ name, email, password, phone });
        await user.save();

        const token = jwt.sign({ id: user._id, role: 'user' }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, name, role: 'user' } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login (Universal)
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;

    if (!getDbStatus()) {
        const token = jwt.sign({ id: `mock_${role}_id`, role }, JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token, user: { id: `mock_${role}_id`, name: `Mock ${role}`, role } });
    }

    try {
        let Model;
        if (role === 'pump') Model = Pump;
        else if (role === 'agent') Model = Agent;
        else Model = User;

        const user = await Model.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, name: user.name || user.stationName, role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Register Pump
router.post('/register/pump', async (req, res) => {
    if (!getDbStatus()) {
        const { stationName } = req.body;
        const token = jwt.sign({ id: 'mock_pump_id', role: 'pump' }, JWT_SECRET);
        return res.json({ token, pump: { id: 'mock_pump_id', stationName } });
    }
    try {
        const { stationName, email, password, location } = req.body;
        const pump = new Pump({ stationName, email, password, location });
        await pump.save();
        const token = jwt.sign({ id: pump._id, role: 'pump' }, JWT_SECRET);
        res.json({ token, pump });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Register Agent
router.post('/register/agent', async (req, res) => {
    if (!getDbStatus()) {
        const { name } = req.body;
        const token = jwt.sign({ id: 'mock_agent_id', role: 'agent' }, JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token, user: { id: 'mock_agent_id', name: name || 'Mock Agent', role: 'agent' } });
    }
    try {
        const { name, email, password, phone, vehicleNumber } = req.body;
        let agent = await Agent.findOne({ email });
        if (agent) return res.status(400).json({ msg: 'Agent already exists' });

        agent = new Agent({ name, email, password, phone, vehicleNumber });
        await agent.save();

        const token = jwt.sign({ id: agent._id, role: 'agent' }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: agent._id, name, role: 'agent' } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
