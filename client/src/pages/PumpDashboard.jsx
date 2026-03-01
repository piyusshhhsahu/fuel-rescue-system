import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Clock, CheckCircle, XCircle, MapPin, User, Truck, RefreshCw } from 'lucide-react';
import API_URL from '../config/api';

const socket = io(API_URL);

const PumpDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [agents, setAgents] = useState([]);
    const [showAgentModal, setShowAgentModal] = useState(null);

    useEffect(() => {
        fetchRequests();
        fetchAgents();

        socket.on('incoming_request', (newRequest) => {
            console.log('New request received', newRequest);
            setRequests(prev => [newRequest, ...prev.filter(r => r._id !== newRequest._id)]);
        });

        socket.on('agent_responded', (data) => {
            console.log('Agent responded:', data);
            setRequests(prev => prev.map(r =>
                r._id === data.orderId ? { ...r, status: data.status, agentName: data.agentName } : r
            ));
            // Refresh agents availability
            fetchAgents();
        });

        return () => {
            socket.off('incoming_request');
            socket.off('agent_responded');
        };
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/orders`);
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAgents = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/agents`);
            setAgents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const updateStatus = async (id, status, agentId = null, agentName = null) => {
        try {
            const payload = { status, agentId, agentName };
            const res = await axios.patch(`${API_URL}/api/orders/${id}/status`, payload);

            // UI Update
            setRequests(requests.map(req => req._id === id ? { ...req, status, agent: agentId, agentName } : req));
            setShowAgentModal(null);

            const req = requests.find(r => r._id === id);

            if (status === 'Assigned' && agentId) {
                // Emit to notify the agent
                socket.emit('assign_agent', {
                    orderId: id,
                    agentId,
                    agentName,
                    userId: req?.user,
                    orderDetails: req
                });
            } else {
                // Notify User of status change
                if (req?.user) {
                    socket.emit('update_status', { userId: req.user, status, orderId: id });
                }
            }

        } catch (err) {
            console.error(err);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Pending': 'bg-yellow-500/20 text-yellow-500',
            'Accepted': 'bg-blue-500/20 text-blue-500',
            'Assigned': 'bg-purple-500/20 text-purple-500',
            'On the Way': 'bg-cyan-500/20 text-cyan-500',
            'Delivered': 'bg-green-500/20 text-green-500',
            'Cancelled': 'bg-red-500/20 text-red-500',
        };
        return styles[status] || 'bg-gray-500/20 text-gray-500';
    };

    const AssignAgentModal = ({ requestId }) => (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-card p-6 w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4">Assign Delivery Agent</h3>
                <div className="space-y-2">
                    {agents.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">No agents registered yet</p>
                    ) : (
                        agents.map(agent => (
                            <button
                                key={agent._id}
                                disabled={!agent.isAvailable}
                                onClick={() => updateStatus(requestId, 'Assigned', agent._id, agent.name)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg border ${agent.isAvailable ? 'bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer' : 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed'}`}
                            >
                                <span className="flex items-center">
                                    <User size={16} className="mr-2" />
                                    <span>
                                        <span className="font-medium">{agent.name}</span>
                                        {agent.vehicleNumber && <span className="text-xs text-gray-400 ml-2">({agent.vehicleNumber})</span>}
                                    </span>
                                </span>
                                {agent.isAvailable
                                    ? <span className="text-green-400 text-xs">Available</span>
                                    : <span className="text-red-400 text-xs">Busy</span>}
                            </button>
                        ))
                    )}
                </div>
                <button
                    onClick={() => setShowAgentModal(null)}
                    className="mt-4 w-full py-2 text-gray-400 hover:text-white"
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Pump Dashboard</h1>
                <div className="flex items-center gap-3">
                    <button onClick={() => { fetchRequests(); fetchAgents(); }} className="text-gray-400 hover:text-white transition p-2">
                        <RefreshCw size={18} />
                    </button>
                    <div className="bg-green-500/10 text-green-500 px-4 py-1 rounded-full text-sm font-semibold border border-green-500/20 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span> Live System
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {requests.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">No active requests</div>
                ) : (
                    requests.map(req => (
                        <div key={req._id} className="glass-card p-6 border-l-4 border-l-orange-500 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                                <Truck size={100} />
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-start relative z-10">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusBadge(req.status)}`}>
                                            {req.status}
                                        </span>
                                        <span className="text-gray-400 text-xs flex items-center">
                                            <Clock size={12} className="mr-1" /> {new Date(req.timestamps?.created || req.createdAt || Date.now()).toLocaleTimeString()}
                                        </span>
                                    </div>

                                    <h3 className="text-2xl font-bold flex items-center gap-2">
                                        {req.fuelType} <span className="text-gray-500">|</span> {req.amount}L
                                    </h3>

                                    <div className="text-sm text-gray-300 space-y-1">
                                        <p className="flex items-center"><User size={14} className="mr-2 text-orange-500" /> {req.contactNumber}</p>
                                        {req.deliveryLocation && (
                                            <p className="flex items-center"><MapPin size={14} className="mr-2 text-orange-500" /> {req.deliveryLocation}</p>
                                        )}
                                        {req.userLocation?.coordinates && (
                                            <p className="flex items-center text-xs text-gray-500">
                                                <MapPin size={12} className="mr-2" /> GPS: {req.userLocation.coordinates[1]?.toFixed(4)}, {req.userLocation.coordinates[0]?.toFixed(4)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 md:mt-0 flex gap-2 flex-shrink-0">
                                    {req.status === 'Pending' && (
                                        <>
                                            <button onClick={() => updateStatus(req._id, 'Cancelled')} className="px-4 py-2 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 transition">Reject</button>
                                            <button onClick={() => updateStatus(req._id, 'Accepted')} className="btn-primary py-2 px-6">Accept</button>
                                        </>
                                    )}

                                    {req.status === 'Accepted' && (
                                        <button onClick={() => setShowAgentModal(req._id)} className="btn-primary py-2 px-6 flex items-center">
                                            Assign Agent <Truck size={18} className="ml-2" />
                                        </button>
                                    )}

                                    {(req.status === 'Assigned' || req.status === 'On the Way') && (
                                        <div className="text-right">
                                            <p className="text-sm text-gray-400">Agent Assigned</p>
                                            <p className="font-bold text-orange-500">{req.agentName || 'Agent'}</p>
                                        </div>
                                    )}

                                    {req.status === 'Delivered' && (
                                        <div className="flex items-center gap-2 text-green-400">
                                            <CheckCircle size={18} /> Completed
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showAgentModal && <AssignAgentModal requestId={showAgentModal} />}
        </div>
    );
};

export default PumpDashboard;
