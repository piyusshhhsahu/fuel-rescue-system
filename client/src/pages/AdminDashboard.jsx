import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import { BarChart3, Package, IndianRupee, CreditCard, Truck, Fuel, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/admin/stats`);
            setStats(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-xl text-gray-400">Loading dashboard...</div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-red-400">Failed to load admin stats.</div>
            </div>
        );
    }

    const statCards = [
        { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: <IndianRupee size={22} />, color: 'from-orange-500 to-red-500' },
        { label: 'Total Orders', value: stats.totalOrders, icon: <Package size={22} />, color: 'from-blue-500 to-purple-500' },
        { label: 'Completed', value: stats.completedOrders, icon: <CheckCircle size={22} />, color: 'from-green-500 to-emerald-500' },
        { label: 'Pending', value: stats.pendingOrders, icon: <Clock size={22} />, color: 'from-yellow-500 to-orange-500' },
    ];

    const revenueBreakdown = [
        { label: 'Fuel Revenue (→ Pumps)', value: stats.fuelRevenue, icon: <Fuel size={18} />, color: 'text-blue-400' },
        { label: 'Delivery Revenue (→ Agents)', value: stats.deliveryRevenue, icon: <Truck size={18} />, color: 'text-green-400' },
        { label: 'Surge Revenue', value: stats.surgeRevenue, icon: <TrendingUp size={18} />, color: 'text-yellow-400' },
        { label: 'Emergency Fees', value: stats.emergencyRevenue, icon: <XCircle size={18} />, color: 'text-red-400' },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-orange-500 p-2 rounded-lg">
                    <BarChart3 size={24} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-gray-400 text-sm">Revenue & Order Analytics</p>
                </div>
            </div>

            {/* ─── Stat Cards ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {statCards.map((card, i) => (
                    <div key={i} className="glass-card p-5 relative overflow-hidden group hover:-translate-y-1 transition duration-300">
                        <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br ${card.color} opacity-20 group-hover:opacity-30 transition`}></div>
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-white mb-3`}>
                            {card.icon}
                        </div>
                        <p className="text-sm text-gray-400">{card.label}</p>
                        <p className="text-2xl font-bold mt-1">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">

                {/* ─── Revenue Distribution ─── */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <CreditCard size={18} className="text-orange-500" /> Payment Distribution
                    </h3>

                    <div className="space-y-4">
                        {revenueBreakdown.map((item, i) => {
                            const pct = stats.totalRevenue > 0 ? Math.round((item.value / stats.totalRevenue) * 100) : 0;
                            return (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className={`flex items-center gap-2 ${item.color}`}>
                                            {item.icon} {item.label}
                                        </span>
                                        <span className="text-white font-medium">₹{item.value.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-700"
                                            style={{ width: `${pct}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-400">Paid Orders</p>
                            <p className="text-xl font-bold text-green-400">{stats.paidOrders}</p>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-400">Unpaid</p>
                            <p className="text-xl font-bold text-red-400">{stats.unpaidOrders}</p>
                        </div>
                    </div>
                </div>

                {/* ─── Recent Orders ─── */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Package size={18} className="text-orange-500" /> Recent Orders
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 border-b border-white/10">
                                    <th className="text-left py-2 font-medium">Fuel</th>
                                    <th className="text-left py-2 font-medium">Qty</th>
                                    <th className="text-left py-2 font-medium">Total</th>
                                    <th className="text-left py-2 font-medium">Payment</th>
                                    <th className="text-left py-2 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentOrders.map((order, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                                        <td className="py-3">{order.fuelType}</td>
                                        <td className="py-3">{order.amount}L</td>
                                        <td className="py-3 font-medium">₹{order.totalCost || 0}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.paymentStatus === 'Paid'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {order.paymentStatus || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-green-500/20 text-green-400' :
                                                order.status === 'Cancelled' ? 'bg-red-500/20 text-red-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
