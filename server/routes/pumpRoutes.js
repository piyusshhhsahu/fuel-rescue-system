const express = require('express');
const router = express.Router();
const Pump = require('../models/Pump');

// Get all pumps (or filter by location if we add geospatial query later)
router.get('/', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        let pumps;

        if (lat && lng) {
            // Find pumps within 10km
            pumps = await Pump.find({
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(lng), parseFloat(lat)]
                        },
                        $maxDistance: 10000 // 10km
                    }
                }
            });
        } else {
            pumps = await Pump.find();
        }
        res.json(pumps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Seed some mock pumps
router.post('/seed', async (req, res) => {
    try {
        const mockPumps = [
            {
                name: "Shell Station - Highway 1",
                location: { type: "Point", coordinates: [77.2090, 28.6139] }, // Near New Delhi
                address: "Highway 1, New Delhi",
                contactNumber: "9876543210",
                fuelTypes: ["Petrol", "Diesel"]
            },
            {
                name: "Indian Oil - City Center",
                location: { type: "Point", coordinates: [77.2150, 28.6100] },
                address: "City Center, New Delhi",
                contactNumber: "9123456780",
                fuelTypes: ["Petrol"]
            },
            {
                name: "HP Patrol - South Ext",
                location: { type: "Point", coordinates: [77.2200, 28.6200] },
                address: "South Ext, New Delhi",
                contactNumber: "9988776655",
                fuelTypes: ["Diesel"]
            }
        ];

        await Pump.deleteMany({});
        await Pump.insertMany(mockPumps);
        res.json({ message: "Mock pumps seeded successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
