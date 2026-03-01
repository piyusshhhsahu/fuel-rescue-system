import React from 'react';
import { MapPin, Phone, Fuel } from 'lucide-react';

const PumpCard = ({ pump, onRequest }) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition duration-300 border-l-4 border-primary">
            <h3 className="text-lg font-bold text-gray-800">{pump.name}</h3>
            <div className="mt-2 text-gray-600 space-y-1">
                <div className="flex items-start">
                    <MapPin size={16} className="mt-1 mr-2 text-primary" />
                    <p className="text-sm">{pump.address}</p>
                </div>
                <div className="flex items-center">
                    <Phone size={16} className="mr-2 text-primary" />
                    <p className="text-sm">{pump.contactNumber}</p>
                </div>
                <div className="flex items-center">
                    <Fuel size={16} className="mr-2 text-primary" />
                    <p className="text-sm">
                        {pump.fuelTypes.join(', ')}
                    </p>
                </div>
            </div>
            <button
                onClick={() => onRequest(pump)}
                className="mt-4 w-full bg-primary text-white py-2 rounded-md hover:bg-green-600 transition duration-300 font-semibold"
            >
                Request Fuel
            </button>
        </div>
    );
};

export default PumpCard;
