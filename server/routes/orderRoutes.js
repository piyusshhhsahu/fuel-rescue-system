const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { getDbStatus } = require('../config/db');
const { calculatePricing, haversineDistance } = require('../config/pricing');

// Default fallback distance if not provided by frontend (km)
const DEFAULT_DISTANCE_KM = 3;

// Mock Data Store
let mockOrders = [];

// Create Order (with auto pricing)
router.post('/', async (req, res) => {
    // Calculate pricing if not already provided
    let orderData = { ...req.body };
    if (!orderData.totalCost && orderData.userLocation && orderData.userLocation.coordinates) {
        const userLng = orderData.userLocation.coordinates[0];
        const userLat = orderData.userLocation.coordinates[1];
        const distanceKm = orderData.distanceKm || DEFAULT_DISTANCE_KM;
        const pricing = calculatePricing(orderData.fuelType, parseFloat(orderData.amount), distanceKm, orderData.isEmergency);
        orderData = { ...orderData, ...pricing };
    }

    if (!getDbStatus()) {
        const newOrder = {
            _id: Date.now().toString(),
            ...orderData,
            status: 'Pending',
            timestamps: { created: new Date() }
        };
        mockOrders.unshift(newOrder);
        return res.json(newOrder);
    }

    try {
        const newOrder = new Order(orderData);
        const savedOrder = await newOrder.save();
        res.json(savedOrder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Orders (Filter by status, agent, pump)
router.get('/', async (req, res) => {
    if (!getDbStatus()) {
        let filtered = [...mockOrders];
        if (req.query.status) filtered = filtered.filter(o => o.status === req.query.status);
        if (req.query.agent) filtered = filtered.filter(o => o.agent === req.query.agent);
        return res.json(filtered);
    }

    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.agent) filter.agent = req.query.agent;
        if (req.query.pump) filter.pump = req.query.pump;

        const orders = await Order.find(filter).sort({ 'timestamps.created': -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Order Status
router.patch('/:id/status', async (req, res) => {
    const { status, agentId, agentName } = req.body;

    if (!getDbStatus()) {
        const order = mockOrders.find(o => o._id === req.params.id);
        if (order) {
            order.status = status;
            if (status === 'Assigned' && agentId) {
                order.agent = agentId;
                order.agentName = agentName;
                order.timestamps.assigned = new Date();
            }
            if (status === 'Accepted') order.timestamps.accepted = new Date();
            if (status === 'Delivered') order.timestamps.delivered = new Date();
            return res.json(order);
        }
        return res.status(404).json({ msg: 'Order not found' });
    }

    try {
        const update = { status };

        if (status === 'Assigned' && agentId) {
            update.agent = agentId;
            update.agentName = agentName;
            update['timestamps.assigned'] = Date.now();
        } else if (status === 'Accepted') {
            update['timestamps.accepted'] = Date.now();
        } else if (status === 'Delivered') {
            update['timestamps.delivered'] = Date.now();
        }

        const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!order) return res.status(404).json({ msg: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single order by ID
router.get('/:id', async (req, res) => {
    if (!getDbStatus()) {
        const order = mockOrders.find(o => o._id === req.params.id);
        if (order) return res.json(order);
        return res.status(404).json({ msg: 'Order not found' });
    }

    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
