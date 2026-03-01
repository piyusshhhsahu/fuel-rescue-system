const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    userLocation: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    fuelType: {
        type: String,
        required: true,
        enum: ['Petrol', 'Diesel']
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'Completed'],
        default: 'Pending'
    },
    contactNumber: String,
    pumpId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pump'
    }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
