const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { calculatePricing, haversineDistance } = require('../config/pricing');
const { getDbStatus } = require('../config/db');
const Order = require('../models/Order');

// ─── Default pump location (used for distance calculation) ───
const DEFAULT_PUMP_LOCATION = { lat: 21.1458, lng: 79.0882 }; // Nagpur, India

// ─── Check if Razorpay keys are configured ───
let razorpay = null;
try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        const Razorpay = require('razorpay');
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        console.log('✅ Razorpay initialized (live test mode)');
    } else {
        console.log('ℹ️  Razorpay keys not found — running in MOCK payment mode');
    }
} catch (e) {
    console.log('ℹ️  Razorpay package not installed — running in MOCK payment mode');
}

/**
 * POST /api/payments/calculate
 * Returns pricing breakdown without creating any order
 */
router.post('/calculate', (req, res) => {
    try {
        const { fuelType, liters, userLat, userLng, pumpLat, pumpLng, isEmergency } = req.body;

        const pLat = pumpLat || DEFAULT_PUMP_LOCATION.lat;
        const pLng = pumpLng || DEFAULT_PUMP_LOCATION.lng;

        const distanceKm = haversineDistance(userLat, userLng, pLat, pLng);
        const pricing = calculatePricing(fuelType, parseFloat(liters), distanceKm, isEmergency);

        res.json(pricing);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order (or mock order) for the given amount
 */
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        if (razorpay) {
            // ── Real Razorpay ──
            const options = {
                amount: Math.round(amount * 100), // Razorpay expects paise
                currency,
                receipt: receipt || `rcpt_${Date.now()}`
            };
            const order = await razorpay.orders.create(options);
            return res.json({
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                mock: false
            });
        }

        // ── Mock Mode ──
        const mockOrderId = `mock_order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        res.json({
            id: mockOrderId,
            amount: Math.round(amount * 100),
            currency,
            mock: true
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/payments/verify
 * Verifies Razorpay payment signature (or mock success)
 */
router.post('/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, mock } = req.body;

        if (mock) {
            // ── Mock: always succeeds ──
            if (!getDbStatus()) {
                return res.json({ verified: true, paymentId: `mock_pay_${Date.now()}` });
            }
            // Update order in DB
            if (orderId) {
                await Order.findByIdAndUpdate(orderId, {
                    paymentStatus: 'Paid',
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: `mock_pay_${Date.now()}`,
                    'timestamps.paid': Date.now()
                });
            }
            return res.json({ verified: true, paymentId: `mock_pay_${Date.now()}` });
        }

        // ── Real Razorpay verification ──
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Update order in DB
            if (orderId && getDbStatus()) {
                await Order.findByIdAndUpdate(orderId, {
                    paymentStatus: 'Paid',
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    'timestamps.paid': Date.now()
                });
            }
            return res.json({ verified: true, paymentId: razorpay_payment_id });
        }

        res.status(400).json({ verified: false, msg: 'Payment verification failed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
