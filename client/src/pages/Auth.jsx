import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

const Auth = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialRole = searchParams.get('role') || 'user';
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState(initialRole); // user, pump, agent
    const [showPassword, setShowPassword] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        stationName: '' // for pumps
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? '/api/auth/login' : `/api/auth/register/${role}`;

        try {
            // For production, use actual API. For now, mock it if needed or use real if backend running.
            // Using placeholder logic for the demo to ensure UI flow works without robust backend setup

            // Real Logic:
            const payload = { ...formData, role };
            const res = await axios.post(`http://localhost:5000${endpoint}`, payload);
            const { token, user } = res.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            if (role === 'pump') navigate('/pump-dashboard');
            else if (role === 'agent') navigate('/agent-dashboard');
            else if (role === 'admin') navigate('/admin-dashboard');
            else navigate('/user-dashboard');

        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.msg || err.response?.data?.error || 'Server might be down. Please try again later.';
            alert(`Authentication failed: ${errorMsg}`);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 flex items-center justify-center px-4">
            <div className="glass-card w-full max-w-md p-8 relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500 rounded-full blur-[60px] opacity-20"></div>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-gray-400">
                        {role === 'pump' ? 'Partner Portal' : role === 'agent' ? 'Delivery Agent' : role === 'admin' ? 'Admin Portal' : 'Standard User'}
                    </p>
                </div>

                {/* Role Toggles */}
                <div className="flex bg-black/20 p-1 rounded-lg mb-8">
                    {[
                        { key: 'user', label: 'User' },
                        { key: 'agent', label: 'Delivery Agent' },
                        { key: 'pump', label: 'Pump' },
                        { key: 'admin', label: 'Admin' }
                    ].map((r) => (
                        <button
                            key={r.key}
                            onClick={() => setRole(r.key)}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${role === r.key ? 'bg-orange-500 text-white shadow' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <>
                            {role === 'pump' ? (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Station Name</label>
                                    <input
                                        type="text"
                                        name="stationName"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none transition"
                                        onChange={handleChange}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none transition"
                                        onChange={handleChange}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none transition"
                                    onChange={handleChange}
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none transition"
                            onChange={handleChange}
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-sm text-gray-400 mb-1">Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none transition"
                            onChange={handleChange}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-9 text-gray-400 hover:text-white"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button type="submit" className="w-full btn-primary flex items-center justify-center mt-6">
                        {isLogin ? 'Sign In' : 'Get Started'} <ArrowRight size={18} className="ml-2" />
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-gray-400 hover:text-white transition"
                    >
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
