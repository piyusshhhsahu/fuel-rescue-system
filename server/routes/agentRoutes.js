const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');
const { getDbStatus } = require('../config/db');

// Mock agents store
let mockAgents = [
    { _id: 'a1', name: 'Ramesh Kumar', phone: '9876543210', vehicleNumber: 'DL-01-AB-1234', isAvailable: true },
    { _id: 'a2', name: 'Suresh Singh', phone: '9123456780', vehicleNumber: 'DL-02-CD-5678', isAvailable: true },
    { _id: 'a3', name: 'Mahesh Verma', phone: '9988776655', vehicleNumber: 'DL-03-EF-9012', isAvailable: false },
];

// Get all agents (optionally filter by availability)
router.get('/', async (req, res) => {
    if (!getDbStatus()) {
        return res.json(mockAgents);
    }

    try {
        const filter = {};
        if (req.query.available === 'true') filter.isAvailable = true;
        if (req.query.pumpId) filter.pumpId = req.query.pumpId;

        const agents = await Agent.find(filter).select('-password');
        res.json(agents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update agent availability
router.patch('/:id/availability', async (req, res) => {
    const { isAvailable } = req.body;

    if (!getDbStatus()) {
        const agent = mockAgents.find(a => a._id === req.params.id);
        if (agent) {
            agent.isAvailable = isAvailable;
            return res.json(agent);
        }
        return res.status(404).json({ msg: 'Agent not found' });
    }

    try {
        const agent = await Agent.findByIdAndUpdate(
            req.params.id,
            { isAvailable },
            { new: true }
        ).select('-password');
        if (!agent) return res.status(404).json({ msg: 'Agent not found' });
        res.json(agent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
