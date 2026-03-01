// ─── Fuel Rescue Pro — Pricing Configuration ───

const FUEL_PRICES = {
    Petrol: 106, // ₹ per liter
    Diesel: 98   // ₹ per liter
};

const DELIVERY_RATE = 30; // ₹ per kilometer
const SURGE_MULTIPLIER = 0.20; // +20% on fuel cost during surge hours
const EMERGENCY_FEE = 50; // ₹ flat
const SURGE_START_HOUR = 22; // 10 PM
const SURGE_END_HOUR = 6;   // 6 AM

/**
 * Check if current time is surge pricing hours (10PM – 6AM)
 */
function isSurgeTime() {
    const hour = new Date().getHours();
    return hour >= SURGE_START_HOUR || hour < SURGE_END_HOUR;
}

/**
 * Haversine distance between two lat/lng points (in kilometers)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const toRad = (deg) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c * 10) / 10; // rounded to 1 decimal
}

/**
 * Calculate full pricing breakdown
 * @returns {{ fuelCost, deliveryCost, surgeFee, emergencyFee, totalCost, distanceKm, isSurge }}
 */
function calculatePricing(fuelType, liters, distanceKm, isEmergency = false) {
    const pricePerLiter = FUEL_PRICES[fuelType] || FUEL_PRICES.Petrol;
    const fuelCost = pricePerLiter * liters;
    const deliveryCost = DELIVERY_RATE * distanceKm;

    const surge = isSurgeTime();
    const surgeFee = surge ? Math.round(fuelCost * SURGE_MULTIPLIER) : 0;
    const emergencyFee = isEmergency ? EMERGENCY_FEE : 0;

    const totalCost = fuelCost + deliveryCost + surgeFee + emergencyFee;

    return {
        fuelCost: Math.round(fuelCost),
        deliveryCost: Math.round(deliveryCost),
        surgeFee,
        emergencyFee,
        totalCost: Math.round(totalCost),
        distanceKm,
        isSurge: surge,
        pricePerLiter
    };
}

module.exports = {
    FUEL_PRICES,
    DELIVERY_RATE,
    SURGE_MULTIPLIER,
    EMERGENCY_FEE,
    isSurgeTime,
    haversineDistance,
    calculatePricing
};
