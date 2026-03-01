const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pump: { type: mongoose.Schema.Types.ObjectId, ref: 'Pump' },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
    agentName: { type: String },

    fuelType: { type: String, required: true },
    amount: { type: Number, required: true }, // liters

    // ─── Pricing Fields ───
    distanceKm: { type: Number, default: 0 },
    fuelCost: { type: Number, default: 0 },
    deliveryCost: { type: Number, default: 0 },
    surgeFee: { type: Number, default: 0 },
    emergencyFee: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },

    // ─── Payment Fields ───
    paymentMethod: { type: String, enum: ['COD', 'UPI', 'Razorpay'], default: 'Razorpay' },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },

    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Assigned', 'On the Way', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },

    userLocation: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true } // [lng, lat]
    },
    deliveryLocation: { type: String },

    contactNumber: { type: String, required: true },

    timestamps: {
        created: { type: Date, default: Date.now },
        accepted: { type: Date },
        assigned: { type: Date },
        delivered: { type: Date },
        paid: { type: Date }
    }
});

module.exports = mongoose.model('Order', OrderSchema);
