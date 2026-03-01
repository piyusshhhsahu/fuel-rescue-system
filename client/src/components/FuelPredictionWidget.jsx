import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Fuel, AlertTriangle, CheckCircle, RefreshCw, ChevronDown } from 'lucide-react';
import API_URL from '../config/api';

const RISK_STYLES = {
    High: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', badge: 'bg-red-500', emoji: '🔴' },
    Medium: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', badge: 'bg-yellow-500', emoji: '🟡' },
    Low: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400', badge: 'bg-emerald-500', emoji: '🟢' },
};

export default function FuelPredictionWidget() {
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [currentFuel, setCurrentFuel] = useState('');
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [history, setHistory] = useState([]);

    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchVehicles();
        fetchHistory();
    }, []);

    const fetchVehicles = async () => {
        try {
            const res = await fetch(`${API_URL}/api/vehicles`, { headers });
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];
            setVehicles(list);
            if (list.length > 0) setSelectedVehicle(list[0]._id);
        } catch { /* silent */ }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/api/predictions`, { headers });
            const data = await res.json();
            setHistory(Array.isArray(data) ? data.slice(0, 5) : []);
        } catch { /* silent */ }
    };

    const runPrediction = async () => {
        if (!selectedVehicle) { setError('Select a vehicle first'); return; }
        setLoading(true); setError(''); setPrediction(null);
        try {
            const body = { vehicleId: selectedVehicle };
            if (currentFuel) body.currentFuelLiters = parseFloat(currentFuel);

            const res = await fetch(`${API_URL}/api/predictions/run`, {
                method: 'POST', headers, body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok) {
                setPrediction(data.prediction);
                fetchHistory();
            } else {
                setError(data.msg || data.error || 'Prediction failed');
            }
        } catch (e) {
            setError('Could not reach AI engine. Make sure the Python server is running on port 5001.');
        }
        setLoading(false);
    };

    const riskStyle = prediction ? RISK_STYLES[prediction.risk?.level] || RISK_STYLES.Low : null;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl p-6">

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-xl flex items-center justify-center">
                    <Brain size={20} className="text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">FuelSense AI</h3>
                    <p className="text-gray-500 text-xs">Predict. Protect. Provide.</p>
                </div>
            </div>

            {/* Controls */}
            <div className="space-y-3 mb-5">
                <div className="relative">
                    <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 appearance-none focus:ring-2 focus:ring-purple-500 outline-none">
                        <option value="">Select vehicle...</option>
                        {vehicles.map(v => (
                            <option key={v._id} value={v._id}>
                                {v.vehicleName || v.vehicleType} — {v.fuelCapacityLiters}L
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
                </div>

                <div className="flex gap-2">
                    <input type="number" placeholder="Current fuel (L) — optional"
                        value={currentFuel} onChange={e => setCurrentFuel(e.target.value)}
                        className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                    <button onClick={runPrediction} disabled={loading}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white px-5 py-2.5 rounded-lg transition-all font-medium text-sm disabled:opacity-50">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Running...' : 'Predict'}
                    </button>
                </div>
            </div>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            {/* Prediction Result */}
            <AnimatePresence>
                {prediction && riskStyle && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className={`${riskStyle.bg} ${riskStyle.border} border rounded-xl p-5 mb-5`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className={`text-xs font-bold uppercase tracking-wider ${riskStyle.text}`}>
                                {riskStyle.emoji} {prediction.risk.level} Risk
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs text-white ${riskStyle.badge}`}>
                                {prediction.risk.level}
                            </span>
                        </div>
                        <div className="text-center py-2">
                            <div className="text-4xl font-black text-white">
                                {prediction.fuelExhaustionDays}
                            </div>
                            <div className="text-gray-400 text-sm mt-1">days until fuel runs out</div>
                        </div>
                        <p className={`text-sm mt-3 ${riskStyle.text}`}>{prediction.risk.action}</p>

                        {prediction.risk.level === 'High' && (
                            <button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                                <Fuel size={16} /> Order Emergency Fuel Now
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* History */}
            {history.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Recent Predictions</h4>
                    <div className="space-y-1.5">
                        {history.map((h, i) => {
                            const s = RISK_STYLES[h.riskLevel] || RISK_STYLES.Low;
                            return (
                                <div key={h._id || i}
                                    className="flex items-center justify-between bg-gray-700/40 rounded-lg px-3 py-2 text-sm">
                                    <span className="text-gray-400">
                                        {h.vehicle?.vehicleName || h.vehicle?.vehicleType || 'Vehicle'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-medium">{h.fuelExhaustionDays}d</span>
                                        <span className={`px-1.5 py-0.5 rounded text-xs text-white ${s.badge}`}>
                                            {h.riskLevel}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {vehicles.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                    Add a vehicle in <a href="/vehicle-profile" className="text-blue-400 underline">Vehicle Profile</a> to start predictions.
                </p>
            )}

            {/* Manage Vehicles Link */}
            <div className="mt-4 pt-3 border-t border-gray-700 text-center">
                <a href="/vehicle-profile"
                    className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition font-medium">
                    🚗 Manage My Vehicles
                </a>
            </div>
        </motion.div>
    );
}
