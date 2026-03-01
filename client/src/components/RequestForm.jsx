import React, { useState } from 'react';
import { X } from 'lucide-react';

const RequestForm = ({ pump, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        amount: '',
        fuelType: pump.fuelTypes[0] || 'Petrol',
        contactNumber: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ ...formData, pumpId: pump._id });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-primary px-6 py-4 flex justify-between items-center text-white">
                    <h3 className="text-xl font-bold">Request Fuel</h3>
                    <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Requesting from:</p>
                        <p className="font-semibold text-gray-800">{pump.name}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                        <select
                            name="fuelType"
                            value={formData.fuelType}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {pump.fuelTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Liters)</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            min="1"
                            max="50"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="e.g. 5"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                        <input
                            type="tel"
                            name="contactNumber"
                            value={formData.contactNumber}
                            onChange={handleChange}
                            required
                            pattern="[0-9]{10}"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="10-digit mobile number"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full bg-primary text-white py-3 rounded-lg font-bold text-lg hover:bg-green-600 transition shadow-lg"
                        >
                            Confirm Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RequestForm;
