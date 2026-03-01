import React from 'react';
import { Link } from 'react-router-dom';
import { Fuel, PhoneCall } from 'lucide-react';

const Navbar = () => {
    return (
        <nav className="bg-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link to="/" className="flex items-center space-x-2 text-primary font-bold text-xl">
                    <Fuel size={28} />
                    <span>Fuel Rescue</span>
                </Link>
                <div className="flex items-center space-x-2 md:space-x-6">
                    <Link to="/user-dashboard" className="text-gray-700 hover:text-red-600 font-medium transition">
                        Request Fuel
                    </Link>
                    <Link to="/pump-dashboard" className="text-gray-700 hover:text-primary font-medium transition">
                        Pump Station
                    </Link>
                    <a href="tel:112" className="flex items-center px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-300 shadow-md">
                        <PhoneCall size={18} className="mr-2" />
                        <span className="hidden sm:inline">Emergency</span>
                    </a>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
