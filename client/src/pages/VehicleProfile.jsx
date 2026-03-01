import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Fuel, Gauge, Route, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import API_URL from '../config/api';

const VEHICLE_TYPES = ['sedan', 'suv', 'hatchback', 'truck', 'motorcycle'];

const VEHICLE_ICONS = {
    sedan: '🚗', suv: '🚙', hatchback: '🚘', truck: '🚛', motorcycle: '🏍️',
};

const initialForm = {
    vehicleType: 'sedan', vehicleName: '', fuelCapacityLiters: '',
    avgMileageKmpl: '', dailyTravelKm: '', highwayRatio: 0.3,
    fuelType: 'Petrol', historicalRefillGapDays: 7,
};

export default function VehicleProfile() {
    const [vehicles, setVehicles] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    useEffect(() => { fetchVehicles(); }, []);

    const fetchVehicles = async () => {
        try {
            const res = await fetch(`${API_URL}/api/vehicles`, { headers });
            const data = await res.json();
            setVehicles(Array.isArray(data) ? data : []);
        } catch { setVehicles([]); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = editing
                ? `${API_URL}/api/vehicles/${editing}`
                : `${API_URL}/api/vehicles`;
            const method = editing ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
            if (res.ok) {
                setMsg(editing ? '✅ Vehicle updated!' : '✅ Vehicle registered!');
                setForm(initialForm); setEditing(null); setShowForm(false);
                fetchVehicles();
            } else {
                const err = await res.json();
                setMsg(`❌ ${err.msg || 'Error saving vehicle'}`);
            }
        } catch { setMsg('❌ Network error'); }
        setLoading(false);
        setTimeout(() => setMsg(''), 3000);
    };

    const handleEdit = (v) => {
        setForm({
            vehicleType: v.vehicleType, vehicleName: v.vehicleName || '',
            fuelCapacityLiters: v.fuelCapacityLiters, avgMileageKmpl: v.avgMileageKmpl,
            dailyTravelKm: v.dailyTravelKm, highwayRatio: v.highwayRatio,
            fuelType: v.fuelType, historicalRefillGapDays: v.historicalRefillGapDays,
        });
        setEditing(v._id); setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this vehicle?')) return;
        await fetch(`${API_URL}/api/vehicles/${id}`, { method: 'DELETE', headers });
        fetchVehicles();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Car className="text-blue-400" size={32} /> My Vehicles
                        </h1>
                        <p className="text-gray-400 mt-1">Manage your vehicles for AI fuel predictions</p>
                    </div>
                    <button onClick={() => { setForm(initialForm); setEditing(null); setShowForm(!showForm); }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all">
                        {showForm ? <X size={18} /> : <Plus size={18} />}
                        {showForm ? 'Cancel' : 'Add Vehicle'}
                    </button>
                </div>

                {msg && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="mb-4 p-3 rounded-lg bg-gray-800 text-white text-center">{msg}</motion.div>
                )}

                {/* Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} onSubmit={handleSubmit}
                            className="bg-gray-800/60 backdrop-blur-md border border-gray-700 rounded-2xl p-6 mb-8 overflow-hidden">
                            <h2 className="text-xl font-semibold text-white mb-4">
                                {editing ? 'Edit Vehicle' : 'Register New Vehicle'}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Vehicle Name</label>
                                    <input type="text" placeholder="e.g. My Creta" value={form.vehicleName}
                                        onChange={e => setForm({ ...form, vehicleName: e.target.value })}
                                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Vehicle Type</label>
                                    <select value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })}
                                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                                        {VEHICLE_TYPES.map(t => <option key={t} value={t}>{VEHICLE_ICONS[t]} {t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Fuel Tank (Liters)</label>
                                    <input type="number" required min="5" max="200" value={form.fuelCapacityLiters}
                                        onChange={e => setForm({ ...form, fuelCapacityLiters: parseFloat(e.target.value) })}
                                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Avg Mileage (km/L)</label>
                                    <input type="number" required min="1" max="100" step="0.1" value={form.avgMileageKmpl}
                                        onChange={e => setForm({ ...form, avgMileageKmpl: parseFloat(e.target.value) })}
                                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Daily Travel (km)</label>
                                    <input type="number" required min="1" max="500" value={form.dailyTravelKm}
                                        onChange={e => setForm({ ...form, dailyTravelKm: parseFloat(e.target.value) })}
                                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Highway Ratio (0–1)</label>
                                    <input type="range" min="0" max="1" step="0.05" value={form.highwayRatio}
                                        onChange={e => setForm({ ...form, highwayRatio: parseFloat(e.target.value) })}
                                        className="w-full accent-blue-500" />
                                    <span className="text-gray-500 text-xs">{(form.highwayRatio * 100).toFixed(0)}% highway</span>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Fuel Type</label>
                                    <select value={form.fuelType} onChange={e => setForm({ ...form, fuelType: e.target.value })}
                                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="Petrol">⛽ Petrol</option>
                                        <option value="Diesel">🛢️ Diesel</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Avg Refill Gap (days)</label>
                                    <input type="number" min="1" max="60" value={form.historicalRefillGapDays}
                                        onChange={e => setForm({ ...form, historicalRefillGapDays: parseInt(e.target.value) })}
                                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <button type="submit" disabled={loading}
                                className="mt-6 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-6 py-2.5 rounded-xl transition-all font-medium">
                                <Save size={18} /> {loading ? 'Saving...' : (editing ? 'Update' : 'Register')}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* Vehicle Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vehicles.map((v, i) => (
                        <motion.div key={v._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl p-5 hover:border-blue-500/50 transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="text-2xl mr-2">{VEHICLE_ICONS[v.vehicleType]}</span>
                                    <span className="text-lg font-semibold text-white">
                                        {v.vehicleName || v.vehicleType}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(v)} className="text-gray-400 hover:text-blue-400 transition">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(v._id)} className="text-gray-400 hover:text-red-400 transition">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-1.5 text-gray-400">
                                    <Fuel size={14} className="text-yellow-400" />
                                    {v.fuelCapacityLiters}L tank • {v.fuelType}
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-400">
                                    <Gauge size={14} className="text-green-400" />
                                    {v.avgMileageKmpl} km/L
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-400">
                                    <Route size={14} className="text-cyan-400" />
                                    {v.dailyTravelKm} km/day
                                </div>
                                <div className="text-gray-500">
                                    {(v.highwayRatio * 100).toFixed(0)}% highway
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {vehicles.length === 0 && !showForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-16 text-gray-500">
                        <Car size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No vehicles registered yet. Add your first vehicle to get AI predictions!</p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
