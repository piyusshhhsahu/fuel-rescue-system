import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, CheckCircle, XCircle, MapPin } from 'lucide-react';

const Dashboard = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(fetchRequests, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchRequests = async () => {
        try {
            // Mock or Real API
            // const res = await axios.get('http://localhost:5000/api/requests');
            // setRequests(res.data);

            // Mock Data if backend not reachable
            const mockRequests = [
                { _id: '1', fuelType: 'Petrol', amount: 5, status: 'Pending', contactNumber: '9876543210', userLocation: { coordinates: [77.2090, 28.6139] }, createdAt: new Date() },
                { _id: '2', fuelType: 'Diesel', amount: 10, status: 'Accepted', contactNumber: '9123456789', userLocation: { coordinates: [77.2150, 28.6100] }, createdAt: new Date(Date.now() - 3600000) },
            ];
            setRequests(mockRequests); // Using mock for now as server isn't running
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            // await axios.patch(`http://localhost:5000/api/requests/${id}/status`, { status });
            // Update local state for mock
            setRequests(requests.map(req => req._id === id ? { ...req, status } : req));
        } catch (err) {
            console.error(err);
        }
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            Pending: 'bg-yellow-100 text-yellow-800',
            Accepted: 'bg-green-100 text-green-800',
            Rejected: 'bg-red-100 text-red-800',
            Completed: 'bg-blue-100 text-blue-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Pump Owner Dashboard</h1>

            <div className="grid gap-6">
                {requests.map(request => (
                    <div key={request._id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center space-x-3 mb-2">
                                    <span className="font-bold text-lg">{request.fuelType}</span>
                                    <span className="text-gray-500">•</span>
                                    <span>{request.amount} Liters</span>
                                    <StatusBadge status={request.status} />
                                </div>
                                <div className="space-y-1 text-gray-600">
                                    <div className="flex items-center">
                                        <Clock size={16} className="mr-2" />
                                        <span>{new Date(request.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin size={16} className="mr-2" />
                                        <span>{request.userLocation.coordinates.join(', ')}</span>
                                    </div>
                                    <div className="flex items-center font-semibold text-gray-800">
                                        <span className="mr-2">Contact:</span>
                                        <span>{request.contactNumber}</span>
                                    </div>
                                </div>
                            </div>

                            {request.status === 'Pending' && (
                                <div className="flex flex-col space-y-2">
                                    <button
                                        onClick={() => updateStatus(request._id, 'Accepted')}
                                        className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                                    >
                                        <CheckCircle size={16} className="mr-2" /> Accept
                                    </button>
                                    <button
                                        onClick={() => updateStatus(request._id, 'Rejected')}
                                        className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                    >
                                        <XCircle size={16} className="mr-2" /> Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {requests.length === 0 && !loading && (
                    <div className="text-center text-gray-500 py-12">
                        No requests found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
