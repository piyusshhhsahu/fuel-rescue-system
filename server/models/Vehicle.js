const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    vehicleType: {
        type: String,
        enum: ['sedan', 'suv', 'hatchback', 'truck', 'motorcycle'],
        required: true,
    },
    vehicleName: {
        type: String,       // e.g., "Hyundai Creta", "Honda Activa"
        default: '',
    },
    fuelCapacityLiters: {
        type: Number,
        required: true,
    },
    avgMileageKmpl: {
        type: Number,
        required: true,
    },
    dailyTravelKm: {
        type: Number,
        required: true,
    },
    highwayRatio: {
        type: Number,       // 0.0 – 1.0
        default: 0.3,
    },
    fuelType: {
        type: String,
        enum: ['Petrol', 'Diesel'],
        default: 'Petrol',
    },
    lastRefillDate: {
        type: Date,
        default: Date.now,
    },
    historicalRefillGapDays: {
        type: Number,       // Average gap between refills
        default: 7,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
