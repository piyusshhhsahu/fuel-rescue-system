import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import io from 'socket.io-client';
import axios from 'axios';
import API_URL from '../config/api';
import { MapPin, Fuel, Phone, Droplet, Clock, CheckCircle, User as UserIcon, Zap, AlertTriangle, IndianRupee, Truck, CreditCard, Loader2, Crosshair } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons for user (blue) and pumps (red/orange)
const userIcon = L.divIcon({
    html: `<div style="background:#3b82f6;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px rgba(59,130,246,0.7)"></div>`,
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
});

const pumpIcon = L.divIcon({
    html: `<div style="background:#f97316;width:14px;height:14px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 0 6px rgba(249,115,22,0.7)"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});

const socket = io(API_URL);

// ─── Pricing constants (mirrored from backend for instant UI) ───
const FUEL_PRICES = { Petrol: 106, Diesel: 98 };
const DELIVERY_RATE = 30;
const SURGE_MULT = 0.20;
const EMERGENCY_FEE = 50;


function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function isSurgeNow() {
    const h = new Date().getHours();
    return h >= 22 || h < 6;
}

function LocationMarker({ location }) {
    const map = useMap();
    useEffect(() => {
        if (location) map.flyTo(location, 13);
    }, [location, map]);
    return location ? <Marker position={location} icon={userIcon}><Popup>📍 You are here</Popup></Marker> : null;
}

const UserDashboard = () => {
    const [formData, setFormData] = useState({
        fuelType: 'Petrol', amount: '2', contactNumber: '', deliveryLocation: ''
    });
    const [location, setLocation] = useState(null);
    const [status, setStatus] = useState('idle');
    const [orderStatus, setOrderStatus] = useState(null);
    const [message, setMessage] = useState('');
    const [activeOrderId, setActiveOrderId] = useState(null);
    const [agentName, setAgentName] = useState(null);
    const [isEmergency, setIsEmergency] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentDone, setPaymentDone] = useState(false);
    const [nearestPump, setNearestPump] = useState(null);
    const [pumpsLoading, setPumpsLoading] = useState(false);
    const [allPumps, setAllPumps] = useState([]);
    const [trackingLocation, setTrackingLocation] = useState(false);

    useEffect(() => {
        getLocation();
        const user = JSON.parse(localStorage.getItem('user'));
        socket.on('connect', () => {
            if (user) socket.emit('join_room', `user_${user.id}`);
        });
        socket.on('status_changed', (data) => {
            setOrderStatus(data.status);
            if (data.agentName) setAgentName(data.agentName);
            if (data.status === 'Delivered') setMessage('Fuel Delivered! Thank you for using FuelRescue.');
        });
        return () => { socket.off('connect'); socket.off('status_changed'); };
    }, []);

    // ─── When user location is detected, fetch nearest pump ───
    useEffect(() => {
        if (location) fetchNearestPump();
    }, [location]);

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation([pos.coords.latitude, pos.coords.longitude]),
                () => setMessage('Unable to retrieve location. Please allow access.')
            );
        }
    };

    const fetchNearestPump = async () => {
        if (!location) return;
        setPumpsLoading(true);
        try {
            const { data: pumps } = await axios.get(`${API_URL}/api/pumps?lat=${location[0]}&lng=${location[1]}`);

            if (pumps && pumps.length > 0) {
                setAllPumps(pumps);
                // Find nearest pump from the list
                let nearest = null;
                let minDist = Infinity;
                pumps.forEach(pump => {
                    if (pump.location && pump.location.coordinates) {
                        const pLng = pump.location.coordinates[0];
                        const pLat = pump.location.coordinates[1];
                        const d = haversine(location[0], location[1], pLat, pLng);
                        if (d < minDist) {
                            minDist = d;
                            nearest = { ...pump, distanceKm: d };
                        }
                    }
                });
                if (nearest) {
                    setNearestPump(nearest);
                    setPumpsLoading(false);
                    return;
                }
            }

            // Fallback: create mock nearby pumps around user's location
            const mockPumps = [
                { _id: 'mock1', stationName: 'Indian Oil - City Station', fuelTypes: ['Petrol', 'Diesel'] },
                { _id: 'mock2', stationName: 'HP Petroleum', fuelTypes: ['Petrol'] },
                { _id: 'mock3', stationName: 'Bharat Petroleum', fuelTypes: ['Petrol', 'Diesel'] },
            ].map(p => {
                const oLat = (Math.random() * 0.025 + 0.005) * (Math.random() > 0.5 ? 1 : -1);
                const oLng = (Math.random() * 0.025 + 0.005) * (Math.random() > 0.5 ? 1 : -1);
                const mLat = location[0] + oLat;
                const mLng = location[1] + oLng;
                return { ...p, location: { type: 'Point', coordinates: [mLng, mLat] }, distanceKm: haversine(location[0], location[1], mLat, mLng) };
            });
            setAllPumps(mockPumps);
            // Nearest from mocks
            const nearest = mockPumps.reduce((a, b) => a.distanceKm < b.distanceKm ? a : b);
            setNearestPump(nearest);
        } catch (err) {
            console.error('Failed to fetch pumps:', err);
            // Fallback: nearby mock pumps
            const mockPumps = [
                { _id: 'mock1', stationName: 'Indian Oil - Nearby', fuelTypes: ['Petrol', 'Diesel'] },
                { _id: 'mock2', stationName: 'HP Petroleum', fuelTypes: ['Petrol'] },
                { _id: 'mock3', stationName: 'Bharat Petroleum', fuelTypes: ['Diesel'] },
            ].map(p => {
                const oLat = (Math.random() * 0.025 + 0.005) * (Math.random() > 0.5 ? 1 : -1);
                const oLng = (Math.random() * 0.025 + 0.005) * (Math.random() > 0.5 ? 1 : -1);
                const mLat = location[0] + oLat;
                const mLng = location[1] + oLng;
                return { ...p, location: { type: 'Point', coordinates: [mLng, mLat] }, distanceKm: haversine(location[0], location[1], mLat, mLng) };
            });
            setAllPumps(mockPumps);
            const nearest = mockPumps.reduce((a, b) => a.distanceKm < b.distanceKm ? a : b);
            setNearestPump(nearest);
        }
        setPumpsLoading(false);
    };

    // ─── Reverse-geocode current location into address ───
    const trackMyLocation = () => {
        setTrackingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setLocation([lat, lng]);
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                        const data = await res.json();
                        if (data && data.display_name) {
                            setFormData(prev => ({ ...prev, deliveryLocation: data.display_name }));
                        }
                    } catch (err) {
                        console.error('Reverse geocoding failed:', err);
                    }
                    setTrackingLocation(false);
                },
                () => {
                    setMessage('Unable to retrieve location. Please allow access.');
                    setTrackingLocation(false);
                }
            );
        } else {
            setMessage('Geolocation is not supported by your browser.');
            setTrackingLocation(false);
        }
    };

    // ─── Live pricing calculation (uses nearest pump distance) ───
    const pricing = useMemo(() => {
        if (!location || !nearestPump) return null;
        const dist = nearestPump.distanceKm;
        const pricePerLiter = FUEL_PRICES[formData.fuelType] || 106;
        const liters = parseFloat(formData.amount) || 1;
        const fuelCost = pricePerLiter * liters;
        const deliveryCost = DELIVERY_RATE * dist;
        const surge = isSurgeNow();
        const surgeFee = surge ? Math.round(fuelCost * SURGE_MULT) : 0;
        const emergencyFee = isEmergency ? EMERGENCY_FEE : 0;
        const totalCost = Math.round(fuelCost + deliveryCost + surgeFee + emergencyFee);
        return { distanceKm: dist, pricePerLiter, fuelCost: Math.round(fuelCost), deliveryCost: Math.round(deliveryCost), surgeFee, emergencyFee, totalCost, isSurge: surge, pumpName: nearestPump.name };
    }, [location, nearestPump, formData.fuelType, formData.amount, isEmergency]);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // ─── Payment Flow ───
    const handlePayAndOrder = async () => {
        if (!location) return alert('Location is required!');
        if (!formData.contactNumber) return alert('Contact number is required!');
        if (!pricing) return;

        setPaymentProcessing(true);
        try {
            // 1. Create Razorpay order
            const { data: rzpOrder } = await axios.post(`${API_URL}/api/payments/create-order`, {
                amount: pricing.totalCost,
                receipt: `fuel_${Date.now()}`
            });

            if (rzpOrder.mock) {
                // ── Mock payment flow ──
                await new Promise(r => setTimeout(r, 1500)); // simulate processing
                const user = JSON.parse(localStorage.getItem('user'));

                // Create order in backend
                const payload = {
                    ...formData,
                    userLocation: { type: 'Point', coordinates: [location[1], location[0]] },
                    user: user ? user.id : null,
                    ...pricing,
                    isEmergency,
                    paymentStatus: 'Paid',
                    paymentMethod: 'Razorpay',
                    razorpayOrderId: rzpOrder.id
                };
                const { data: order } = await axios.post(`${API_URL}/api/orders`, payload);

                // Verify mock payment
                await axios.post(`${API_URL}/api/payments/verify`, {
                    razorpay_order_id: rzpOrder.id,
                    orderId: order._id,
                    mock: true
                });

                setActiveOrderId(order._id);
                setPaymentDone(true);
                setOrderStatus('Pending');
                setPaymentProcessing(false);

                if (user) socket.emit('join_room', `user_${user.id}`);
                socket.emit('new_request', order);
            } else {
                // ── Real Razorpay checkout ──
                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
                    amount: rzpOrder.amount,
                    currency: rzpOrder.currency,
                    name: 'FuelRescue Pro',
                    description: `${formData.fuelType} - ${formData.amount}L`,
                    order_id: rzpOrder.id,
                    handler: async (response) => {
                        const user = JSON.parse(localStorage.getItem('user'));
                        const payload = {
                            ...formData,
                            userLocation: { type: 'Point', coordinates: [location[1], location[0]] },
                            user: user ? user.id : null,
                            ...pricing,
                            isEmergency,
                            paymentStatus: 'Paid',
                            paymentMethod: 'Razorpay',
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id
                        };
                        const { data: order } = await axios.post(`${API_URL}/api/orders`, payload);

                        await axios.post(`${API_URL}/api/payments/verify`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: order._id
                        });

                        setActiveOrderId(order._id);
                        setPaymentDone(true);
                        setOrderStatus('Pending');
                        setPaymentProcessing(false);

                        if (user) socket.emit('join_room', `user_${user.id}`);
                        socket.emit('new_request', order);
                    },
                    theme: { color: '#F97316' }
                };
                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', () => {
                    setPaymentProcessing(false);
                    setMessage('Payment failed. Please try again.');
                });
                rzp.open();
                setPaymentProcessing(false);
            }
        } catch (err) {
            console.error(err);
            setPaymentProcessing(false);
            setMessage('Payment failed. Please try again.');
        }
    };

    const resetOrder = () => {
        setOrderStatus(null);
        setActiveOrderId(null);
        setAgentName(null);
        setStatus('idle');
        setMessage('');
        setPaymentDone(false);
        setIsEmergency(false);
        setFormData({ fuelType: 'Petrol', amount: '2', contactNumber: '', deliveryLocation: '' });
    };

    const steps = ['Pending', 'Accepted', 'Assigned', 'On the Way', 'Delivered'];
    const currentStepIndex = steps.indexOf(orderStatus) || 0;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-8">

                {/* ─── Left Column: Form + Invoice ─── */}
                <div className="space-y-6">
                    <div className="glass-card p-6">
                        <h2 className="text-2xl font-bold mb-4 flex items-center">
                            <Fuel className="mr-2 text-orange-500" /> Emergency Request
                        </h2>

                        {orderStatus && orderStatus !== 'Delivered' ? (
                            /* ─── Active Order Tracker ─── */
                            <div className="text-center py-8">
                                <div className="animate-pulse mb-4">
                                    <div className="h-16 w-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto text-orange-500">
                                        <Clock size={32} />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold mb-2">Request {orderStatus}</h3>
                                <p className="text-gray-400">Help is on the way! Please stay near your vehicle.</p>

                                {agentName && orderStatus !== 'Pending' && (
                                    <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                        <p className="text-sm text-gray-400">Delivery Agent</p>
                                        <p className="font-bold text-green-400 flex items-center justify-center gap-2">
                                            <UserIcon size={16} /> {agentName}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-6 space-y-2">
                                    {steps.map((step, idx) => (
                                        <div key={idx} className={`flex items-center space-x-3 ${idx <= currentStepIndex ? 'text-green-400' : 'text-gray-600'}`}>
                                            <div className={`w-3 h-3 rounded-full ${idx <= currentStepIndex ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                                            <span>{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : orderStatus === 'Delivered' ? (
                            /* ─── Delivered State ─── */
                            <div className="text-center py-8">
                                <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500 mb-4">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-green-400 mb-2">Fuel Delivered!</h3>
                                <p className="text-gray-400 mb-6">Thank you for using FuelRescue.</p>
                                <button onClick={resetOrder} className="btn-primary py-2 px-6">New Request</button>
                            </div>
                        ) : (
                            /* ─── Request Form ─── */
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Fuel Type</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {['Petrol', 'Diesel'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, fuelType: type })}
                                                className={`p-3 rounded-lg border transition flex items-center justify-center ${formData.fuelType === type ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                            >
                                                <Droplet size={18} className="mr-2" /> {type}
                                                <span className="ml-1 text-xs opacity-70">₹{FUEL_PRICES[type]}/L</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Amount (Liters)</label>
                                    <input
                                        type="number" name="amount" min="1" max="50"
                                        value={formData.amount} onChange={handleInputChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Delivery Address</label>
                                    <div className="relative">
                                        <MapPin size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                        <input
                                            type="text" name="deliveryLocation"
                                            value={formData.deliveryLocation} onChange={handleInputChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-12 py-3 text-white focus:border-orange-500 outline-none"
                                            placeholder="Enter your address"
                                        />
                                        <button
                                            type="button"
                                            onClick={trackMyLocation}
                                            disabled={trackingLocation}
                                            title="Track My Location"
                                            className="absolute right-2 top-2 p-1.5 rounded-md bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 transition disabled:opacity-50"
                                        >
                                            {trackingLocation
                                                ? <Loader2 size={16} className="animate-spin" />
                                                : <Crosshair size={16} />
                                            }
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Contact Number</label>
                                    <div className="relative">
                                        <Phone size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                        <input
                                            type="tel" name="contactNumber" required
                                            value={formData.contactNumber} onChange={handleInputChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-orange-500 outline-none"
                                            placeholder="123-456-7890"
                                        />
                                    </div>
                                </div>

                                {/* ─── Emergency Toggle ─── */}
                                <button
                                    type="button"
                                    onClick={() => setIsEmergency(!isEmergency)}
                                    className={`w-full p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition ${isEmergency
                                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    <AlertTriangle size={16} />
                                    {isEmergency ? '🚨 Emergency Priority ON (+₹50)' : 'Add Emergency Priority (+₹50)'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ─── Invoice / Price Breakdown ─── */}
                    {!orderStatus && pricing && (
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center">
                                <IndianRupee size={18} className="mr-2 text-orange-500" /> Price Breakdown
                            </h3>

                            {pricing.isSurge && (
                                <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-2 text-yellow-400 text-sm">
                                    <Zap size={16} /> Surge pricing active (10PM – 6AM) · +20% on fuel
                                </div>
                            )}

                            <div className="space-y-3 text-sm">
                                {pricing.pumpName && (
                                    <div className="flex justify-between text-gray-300">
                                        <span>⛽ Nearest Pump</span>
                                        <span className="font-medium text-orange-400">{pricing.pumpName}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-300">
                                    <span>📍 Distance to pump</span>
                                    <span className="font-medium text-white">{pricing.distanceKm} km</span>
                                </div>
                                <div className="border-t border-white/5"></div>
                                <div className="flex justify-between text-gray-300">
                                    <span><Droplet size={14} className="inline mr-1" /> Fuel ({formData.fuelType} × {formData.amount}L @ ₹{pricing.pricePerLiter})</span>
                                    <span className="text-white">₹{pricing.fuelCost}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span><Truck size={14} className="inline mr-1" /> Delivery ({pricing.distanceKm} km × ₹30)</span>
                                    <span className="text-white">₹{pricing.deliveryCost}</span>
                                </div>
                                {pricing.surgeFee > 0 && (
                                    <div className="flex justify-between text-yellow-400">
                                        <span><Zap size={14} className="inline mr-1" /> Surge Fee (20%)</span>
                                        <span>+₹{pricing.surgeFee}</span>
                                    </div>
                                )}
                                {pricing.emergencyFee > 0 && (
                                    <div className="flex justify-between text-red-400">
                                        <span><AlertTriangle size={14} className="inline mr-1" /> Emergency Fee</span>
                                        <span>+₹{pricing.emergencyFee}</span>
                                    </div>
                                )}
                                <div className="border-t border-white/10 pt-3 flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span className="text-orange-500">₹{pricing.totalCost}</span>
                                </div>
                            </div>

                            {/* ─── Payment Distribution Info ─── */}
                            <div className="mt-4 bg-white/5 rounded-lg p-3 text-xs text-gray-500 space-y-1">
                                <p>💰 ₹{pricing.fuelCost + pricing.surgeFee} → Petrol Pump</p>
                                <p>🚗 ₹{pricing.deliveryCost + pricing.emergencyFee} → Delivery Agent</p>
                            </div>

                            {/* ─── Pay Button ─── */}
                            <button
                                onClick={handlePayAndOrder}
                                disabled={paymentProcessing || !formData.contactNumber}
                                className="w-full btn-primary flex items-center justify-center mt-6 text-lg py-4 disabled:opacity-50"
                            >
                                {paymentProcessing ? (
                                    <><Loader2 size={20} className="mr-2 animate-spin" /> Processing Payment...</>
                                ) : (
                                    <><CreditCard size={20} className="mr-2" /> Pay ₹{pricing.totalCost} & Request Fuel</>
                                )}
                            </button>
                        </div>
                    )}

                    {message && !orderStatus && (
                        <div className="glass-card p-4 text-center text-red-400">{message}</div>
                    )}
                </div>

                {/* ─── Right Column: Map ─── */}
                <div className="glass-card overflow-hidden h-96 md:h-auto min-h-[400px]">
                    {location && (
                        <MapContainer center={location} zoom={13} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <LocationMarker location={location} />

                            {/* Pump markers */}
                            {allPumps.map(pump => {
                                if (!pump.location || !pump.location.coordinates) return null;
                                const pLat = pump.location.coordinates[1];
                                const pLng = pump.location.coordinates[0];
                                const dist = haversine(location[0], location[1], pLat, pLng);
                                return (
                                    <Marker key={pump._id} position={[pLat, pLng]} icon={pumpIcon}>
                                        <Popup>
                                            <div style={{ minWidth: 160 }}>
                                                <strong>⛽ {pump.stationName || pump.name}</strong>
                                                <br />
                                                <span style={{ fontSize: 12 }}>{(pump.fuelTypes || []).join(', ')}</span>
                                                <br />
                                                <span style={{ fontSize: 12, color: '#999' }}>{dist} km away</span>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                        </MapContainer>
                    )}
                    {!location && (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            Detecting location...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
