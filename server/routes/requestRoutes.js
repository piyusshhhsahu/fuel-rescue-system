const express = require('express');
const router = express.Router();
const Request = require('../models/Request');

// Create a new request
router.post('/', async (req, res) => {
    const { userLocation, fuelType, amount, contactNumber } = req.body;
    const request = new Request({
        userLocation: {
            type: 'Point',
            coordinates: userLocation // [lng, lat]
        },
        fuelType,
        amount,
        contactNumber
    });

    try {
        const newRequest = await request.save();
        res.status(201).json(newRequest);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all requests (for dashboard)
router.get('/', async (req, res) => {
    try {
        const requests = await Request.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update request status
router.patch('/:id/status', async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (request) {
            request.status = req.body.status;
            const updatedRequest = await request.save();
            res.json(updatedRequest);
        } else {
            res.status(404).json({ message: 'Request not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
