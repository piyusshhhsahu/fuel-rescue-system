const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fuel-rescue-pro', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 2000 // Fast fail
        });
        console.log('MongoDB Connected (FuelRescue Pro)');
        isConnected = true;
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        console.log('-> Switching to MOCK MODE for demo purposes.');
        isConnected = false;
    }
};

const getDbStatus = () => isConnected;

module.exports = { connectDB, getDbStatus };
