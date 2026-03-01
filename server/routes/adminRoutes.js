const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { getDbStatus } = require('../config/db');

/**
 * GET /api/admin/stats
 * Returns revenue stats, order counts, and payment distribution
 */
router.get('/stats', async (req, res) => {
    if (!getDbStatus()) {
        // Mock stats
        return res.json({
            totalOrders: 24,
            completedOrders: 18,
            pendingOrders: 6,
            totalRevenue: 15840,
            fuelRevenue: 12720,
            deliveryRevenue: 2620,
            surgeRevenue: 320,
            emergencyRevenue: 150,
            paidOrders: 16,
            unpaidOrders: 2,
            recentOrders: [
                { _id: 'mock1', fuelType: 'Petrol', amount: 3, totalCost: 408, fuelCost: 318, deliveryCost: 90, paymentStatus: 'Paid', status: 'Delivered', timestamps: { created: new Date(Date.now() - 3600000) } },
                { _id: 'mock2', fuelType: 'Diesel', amount: 5, totalCost: 580, fuelCost: 490, deliveryCost: 90, paymentStatus: 'Paid', status: 'Delivered', timestamps: { created: new Date(Date.now() - 7200000) } },
                { _id: 'mock3', fuelType: 'Petrol', amount: 2, totalCost: 272, fuelCost: 212, deliveryCost: 60, paymentStatus: 'Paid', status: 'On the Way', timestamps: { created: new Date(Date.now() - 10800000) } },
                { _id: 'mock4', fuelType: 'Diesel', amount: 4, totalCost: 482, fuelCost: 392, deliveryCost: 90, paymentStatus: 'Pending', status: 'Pending', timestamps: { created: new Date(Date.now() - 14400000) } },
                { _id: 'mock5', fuelType: 'Petrol', amount: 1, totalCost: 166, fuelCost: 106, deliveryCost: 60, paymentStatus: 'Paid', status: 'Delivered', timestamps: { created: new Date(Date.now() - 18000000) } },
            ]
        });
    }

    try {
        const allOrders = await Order.find().sort({ 'timestamps.created': -1 });

        const stats = {
            totalOrders: allOrders.length,
            completedOrders: allOrders.filter(o => o.status === 'Delivered').length,
            pendingOrders: allOrders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length,
            totalRevenue: allOrders.filter(o => o.paymentStatus === 'Paid').reduce((sum, o) => sum + (o.totalCost || 0), 0),
            fuelRevenue: allOrders.filter(o => o.paymentStatus === 'Paid').reduce((sum, o) => sum + (o.fuelCost || 0), 0),
            deliveryRevenue: allOrders.filter(o => o.paymentStatus === 'Paid').reduce((sum, o) => sum + (o.deliveryCost || 0), 0),
            surgeRevenue: allOrders.filter(o => o.paymentStatus === 'Paid').reduce((sum, o) => sum + (o.surgeFee || 0), 0),
            emergencyRevenue: allOrders.filter(o => o.paymentStatus === 'Paid').reduce((sum, o) => sum + (o.emergencyFee || 0), 0),
            paidOrders: allOrders.filter(o => o.paymentStatus === 'Paid').length,
            unpaidOrders: allOrders.filter(o => o.paymentStatus !== 'Paid').length,
            recentOrders: allOrders.slice(0, 10)
        };

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
