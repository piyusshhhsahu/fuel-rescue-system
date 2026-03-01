import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import io from 'socket.io-client';
import axios from 'axios';
import { MapPin, Navigation, Phone, CheckCircle, XCircle, Clock, Fuel, Truck, IndianRupee, AlertTriangle, Bike, Package } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const deliveryIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});

const socket = io('http://localhost:5000');

function FlyToMarker({ position }) {
    const map = useMap();
    useEffect(() => { if (position) map.flyTo(position, 14); }, [position, map]);
    return null;
}

const AgentDashboard = () => {
    const [assignments, setAssignments] = useState([]);
    const [activeOrder, setActiveOrder] = useState(null);
    const [isOnline, setIsOnline] = useState(true);
    const [deliveredOrders, setDeliveredOrders] = useState(0);
    const [totalEarnings, setTotalEarnings] = useState(0);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;

        socket.emit('join_room', `agent_${user.id}`);

        socket.on('new_assignment', (data) => {
            console.log('New assignment received:', data);
            setAssignments(prev => {
                if (prev.find(a => a.orderId === data.orderId)) return prev;
                return [data, ...prev];
            });
        });

        fetchAssignedOrders(user.id);

        return () => { socket.off('new_assignment'); };
    }, []);

    const fetchAssignedOrders = async (agentId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/orders?agent=${agentId}`);
            const orders = res.data;
            const active = orders.find(o => ['Assigned', 'On the Way'].includes(o.status));
            if (active) setActiveOrder(active);

            const delivered = orders.filter(o => o.status === 'Delivered');
            setDeliveredOrders(delivered.length);
            setTotalEarnings(delivered.reduce((sum, o) => sum + (o.deliveryCost || 0) + (o.emergencyFee || 0), 0));
        } catch (err) { console.error(err); }
    };

    const handleAccept = async (assignment) => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            await axios.patch(`http://localhost:5000/api/orders/${assignment.orderId}/status`, {
                status: 'On the Way', agentId: user?.id
            });
            socket.emit('agent_response', {
                orderId: assignment.orderId, status: 'On the Way',
                agentId: user?.id, agentName: user?.name,
                userId: assignment.userId || assignment.orderDetails?.user
            });
            const orderDetails = assignment.orderDetails || {};
            setActiveOrder({ _id: assignment.orderId, ...orderDetails, status: 'On the Way' });
            setAssignments(prev => prev.filter(a => a.orderId !== assignment.orderId));
        } catch (err) { console.error(err); alert('Failed to accept order'); }
    };

    const handleDecline = async (assignment) => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            await axios.patch(`http://localhost:5000/api/orders/${assignment.orderId}/status`, { status: 'Accepted' });
            socket.emit('agent_response', {
                orderId: assignment.orderId, status: 'Accepted',
                agentId: user?.id, agentName: user?.name,
                userId: assignment.userId || assignment.orderDetails?.user
            });
            setAssignments(prev => prev.filter(a => a.orderId !== assignment.orderId));
        } catch (err) { console.error(err); }
    };

    const handleDelivered = async () => {
        if (!activeOrder) return;
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            await axios.patch(`http://localhost:5000/api/orders/${activeOrder._id}/status`, { status: 'Delivered' });
            socket.emit('agent_response', {
                orderId: activeOrder._id, status: 'Delivered',
                agentId: user?.id, agentName: user?.name,
                userId: activeOrder.user
            });
            setTotalEarnings(prev => prev + (activeOrder.deliveryCost || 0) + (activeOrder.emergencyFee || 0));
            setDeliveredOrders(prev => prev + 1);
            setActiveOrder(null);
        } catch (err) { console.error(err); }
    };

    const getDeliveryCoords = () => {
        if (!activeOrder) return null;
        const coords = activeOrder.userLocation?.coordinates;
        if (coords && coords.length === 2) return [coords[1], coords[0]];
        return null;
    };
    const deliveryCoords = getDeliveryCoords();

    // ─── Blinkit-style incoming order popup ───
    const incomingAssignment = assignments[0];

    return (
        <div className="container mx-auto px-4 py-8 relative">

            {/* ═══ BLINKIT-STYLE INCOMING ORDER POPUP ═══ */}
            {incomingAssignment && !activeOrder && (
                <IncomingOrderPopup
                    assignment={incomingAssignment}
                    onAccept={() => handleAccept(incomingAssignment)}
                    onDecline={() => handleDecline(incomingAssignment)}
                />
            )}

            {/* ─── Top Bar ─── */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bike size={28} className="text-orange-500" /> Delivery Partner
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Your delivery hub</p>
                </div>
                <div className={`${isOnline ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'} px-4 py-2 rounded-full text-sm font-semibold border flex items-center cursor-pointer select-none`}
                    onClick={() => setIsOnline(!isOnline)}>
                    <span className={`w-2.5 h-2.5 ${isOnline ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-2 ${isOnline ? 'animate-pulse' : ''}`}></span>
                    {isOnline ? 'Online' : 'Offline'}
                </div>
            </div>

            {/* ─── Stats Cards ─── */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="glass-card p-4 text-center">
                    <Package size={20} className="mx-auto mb-2 text-orange-500" />
                    <p className="text-2xl font-bold">{deliveredOrders}</p>
                    <p className="text-xs text-gray-500">Deliveries</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <IndianRupee size={20} className="mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold text-green-400">₹{totalEarnings}</p>
                    <p className="text-xs text-gray-500">Earnings</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <Clock size={20} className="mx-auto mb-2 text-blue-400" />
                    <p className="text-2xl font-bold">{assignments.length}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                </div>
            </div>

            {/* ═══ ACTIVE DELIVERY ═══ */}
            {activeOrder && (
                <div className="mb-8">
                    <h2 className="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-3">🔴 Active Delivery</h2>
                    <div className="glass-card p-6 border-2 border-orange-500/40 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>

                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <p className="text-xs text-gray-500">Order #{activeOrder._id?.slice(-6)}</p>
                                <h2 className="text-3xl font-extrabold mt-1">
                                    {activeOrder.amount}L <span className="text-lg font-normal text-gray-400">{activeOrder.fuelType}</span>
                                </h2>
                            </div>
                            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase animate-pulse">
                                In Transit
                            </div>
                        </div>

                        {/* Order details */}
                        <div className="space-y-3 mb-5">
                            {activeOrder.deliveryLocation && (
                                <div className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
                                    <MapPin className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                                    <div>
                                        <p className="text-xs text-gray-500">Drop Location</p>
                                        <p className="text-white font-medium">{activeOrder.deliveryLocation}</p>
                                    </div>
                                </div>
                            )}
                            {activeOrder.contactNumber && (
                                <div className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
                                    <Phone className="text-blue-400 mt-0.5 flex-shrink-0" size={18} />
                                    <div>
                                        <p className="text-xs text-gray-500">Customer</p>
                                        <p className="text-white font-medium">{activeOrder.contactNumber}</p>
                                    </div>
                                </div>
                            )}
                            {(activeOrder.deliveryCost > 0 || activeOrder.emergencyFee > 0) && (
                                <div className="flex items-start gap-3 bg-green-500/10 rounded-lg p-3">
                                    <IndianRupee className="text-green-400 mt-0.5 flex-shrink-0" size={18} />
                                    <div>
                                        <p className="text-xs text-gray-500">Your Earnings</p>
                                        <p className="text-green-400 font-bold text-lg">₹{(activeOrder.deliveryCost || 0) + (activeOrder.emergencyFee || 0)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Map */}
                        {deliveryCoords && (
                            <div className="rounded-lg overflow-hidden mb-5 h-56 border border-white/10">
                                <MapContainer center={deliveryCoords} zoom={14} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    />
                                    <Marker position={deliveryCoords} icon={deliveryIcon}>
                                        <Popup>
                                            <strong>Delivery Location</strong><br />
                                            {activeOrder.deliveryLocation || 'Customer Location'}
                                        </Popup>
                                    </Marker>
                                    <FlyToMarker position={deliveryCoords} />
                                </MapContainer>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="space-y-3">
                            {deliveryCoords && (
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${deliveryCoords[0]},${deliveryCoords[1]}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center transition"
                                >
                                    <Navigation size={18} className="mr-2" /> Open in Google Maps
                                </a>
                            )}
                            <button
                                onClick={handleDelivered}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-lg flex items-center justify-center transition text-lg"
                            >
                                <CheckCircle size={22} className="mr-2" /> Confirm Delivery
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Idle State ─── */}
            {!activeOrder && assignments.length === 0 && (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bike size={36} className="text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-300 mb-2">Waiting for orders...</h3>
                    <p className="text-gray-500">Stay online to receive delivery requests</p>
                    <div className="flex justify-center mt-4 gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                </div>
            )}

            {/* ─── Queue (if more than 1 assignment while popup shows first) ─── */}
            {assignments.length > 1 && (
                <div className="mt-4">
                    <h3 className="text-sm text-gray-500 font-medium mb-2">More orders in queue ({assignments.length - 1})</h3>
                    {assignments.slice(1).map((a, i) => {
                        const o = a.orderDetails || {};
                        return (
                            <div key={a.orderId || i} className="glass-card p-3 mb-2 text-sm flex justify-between items-center">
                                <span>{o.fuelType || 'Fuel'} · {o.amount || '?'}L · {o.deliveryLocation || 'Unknown location'}</span>
                                <span className="text-yellow-500 text-xs font-bold">QUEUED</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BLINKIT-STYLE INCOMING ORDER POPUP COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const IncomingOrderPopup = ({ assignment, onAccept, onDecline }) => {
    const order = assignment.orderDetails || {};
    const [countdown, setCountdown] = useState(30);
    const timerRef = useRef(null);

    useEffect(() => {
        setCountdown(30);
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    onDecline(); // Auto-decline after timeout
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [assignment.orderId]);

    const earnings = (order.deliveryCost || 30) + (order.emergencyFee || 0);
    const pct = Math.round((countdown / 30) * 100);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
            <div className="w-full max-w-md animate-slideUp">
                {/* Glowing card */}
                <div className="bg-gradient-to-b from-[#1a1f2e] to-[#0f1218] rounded-2xl border border-orange-500/30 shadow-2xl shadow-orange-500/10 overflow-hidden">

                    {/* Timer bar */}
                    <div className="w-full h-1.5 bg-gray-800">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000 ease-linear"
                            style={{ width: `${pct}%` }}
                        ></div>
                    </div>

                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                                    <Truck size={20} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-orange-500 font-bold text-sm uppercase tracking-wider">New Delivery!</p>
                                    <p className="text-gray-500 text-xs">Order #{assignment.orderId?.slice(-6)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-black text-white">{countdown}s</p>
                                <p className="text-xs text-gray-500">Auto-decline</p>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Fuel size={18} className="text-orange-400" />
                                    <span className="text-white font-semibold">{order.fuelType || 'Fuel'}</span>
                                </div>
                                <span className="text-2xl font-extrabold text-white">{order.amount || '?'}L</span>
                            </div>

                            {order.deliveryLocation && (
                                <div className="flex items-start gap-2 pt-2 border-t border-white/5">
                                    <MapPin size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-gray-300 text-sm">{order.deliveryLocation}</p>
                                </div>
                            )}

                            {order.contactNumber && (
                                <div className="flex items-center gap-2">
                                    <Phone size={16} className="text-blue-400 flex-shrink-0" />
                                    <p className="text-gray-300 text-sm">{order.contactNumber}</p>
                                </div>
                            )}

                            {order.distanceKm && (
                                <div className="flex items-center gap-2">
                                    <Navigation size={16} className="text-green-400 flex-shrink-0" />
                                    <p className="text-gray-300 text-sm">{order.distanceKm} km away</p>
                                </div>
                            )}
                        </div>

                        {/* Earnings */}
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <IndianRupee size={20} className="text-green-400" />
                                <span className="text-green-400 font-medium">Your Earnings</span>
                            </div>
                            <span className="text-2xl font-black text-green-400">₹{earnings}</span>
                        </div>

                        {/* Accept / Decline Buttons */}
                        <div className="grid grid-cols-5 gap-3">
                            <button
                                onClick={onDecline}
                                className="col-span-2 py-4 rounded-xl border-2 border-red-500/40 text-red-400 hover:bg-red-500/10 transition font-bold flex items-center justify-center gap-1 text-base"
                            >
                                <XCircle size={20} /> Decline
                            </button>
                            <button
                                onClick={onAccept}
                                className="col-span-3 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold flex items-center justify-center gap-2 text-lg shadow-lg shadow-green-500/20 transition"
                            >
                                <CheckCircle size={22} /> Accept
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentDashboard;
