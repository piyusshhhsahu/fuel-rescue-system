const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true,
    },
    fuelExhaustionDays: {
        type: Number,
        required: true,
    },
    riskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        required: true,
    },
    riskColor: {
        type: String,
        default: '#10B981',
    },
    riskAction: {
        type: String,
        default: '',
    },
    inputSnapshot: {
        vehicleType: String,
        fuelCapacityLiters: Number,
        currentFuelLiters: Number,
        avgMileageKmpl: Number,
        dailyTravelKm: Number,
        daysSinceLastRefill: Number,
        historicalAvgRefillGapDays: Number,
        highwayRatio: Number,
    },
    acknowledged: {
        type: Boolean,
        default: false,
    },
    predictedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Prediction', PredictionSchema);
