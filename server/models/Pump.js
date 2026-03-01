const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PumpSchema = new mongoose.Schema({
    stationName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' } // [lng, lat]
    },
    address: { type: String },
    contactNumber: { type: String },
    fuelTypes: { type: [String], default: ['Petrol', 'Diesel'] }, // e.g., ['Petrol', 'Diesel']
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

PumpSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

PumpSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Pump', PumpSchema);
