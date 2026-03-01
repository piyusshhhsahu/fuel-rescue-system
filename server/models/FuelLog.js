const mongoose = require('mongoose');

const FuelLogSchema = new mongoose.Schema({
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fuelLevelLiters: {
        type: Number,
        required: true,
    },
    source: {
        type: String,
        enum: ['manual', 'sensor', 'app_estimate'],
        default: 'manual',
    },
    loggedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('FuelLog', FuelLogSchema);
