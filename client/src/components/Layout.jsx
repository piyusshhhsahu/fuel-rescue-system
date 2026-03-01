import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Fuel, Menu, X } from 'lucide-react';

const Layout = ({ children }) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const location = useLocation();

    // Hide Navbar on specific routes if needed, currently showing on all

    return (
        <div className="min-h-screen bg-hero-gradient text-white flex flex-col font-sans">
            {/* Glassmorphism Navbar */}
            <nav className="fixed w-full z-50 glass bg-opacity-30 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <Link to="/" className="flex items-center space-x-3 group">
                            <div className="bg-orange-500 p-2 rounded-lg group-hover:rotate-12 transition duration-300">
                                <Fuel size={24} className="text-white" />
                            </div>
                            <span className="font-bold text-2xl tracking-wide">
                                Fuel<span className="text-orange-500">Rescue</span>
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-8">
                            <Link to="/" className="hover:text-orange-400 transition font-medium">Home</Link>
                            <Link to="/auth?role=user" className="hover:text-orange-400 transition font-medium">User Login</Link>
                            <Link to="/auth?role=pump" className="hover:text-orange-400 transition font-medium">Partner</Link>
                            <Link to="/auth?role=agent" className="hover:text-orange-400 transition font-medium">Agent</Link>
                            <Link to="/auth?role=admin" className="hover:text-orange-400 transition font-medium">Admin</Link>
                            <Link to="/auth?role=user" className="btn-primary py-2 px-5 rounded-full text-sm">
                                Get Started
                            </Link>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:text-orange-500">
                                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden glass border-t border-white/10 absolute w-full">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            <Link to="/" className="block px-3 py-2 rounded-md hover:bg-white/10" onClick={() => setIsMenuOpen(false)}>Home</Link>
                            <Link to="/auth?role=user" className="block px-3 py-2 rounded-md hover:bg-white/10" onClick={() => setIsMenuOpen(false)}>User Login</Link>
                            <Link to="/auth?role=pump" className="block px-3 py-2 rounded-md hover:bg-white/10" onClick={() => setIsMenuOpen(false)}>Partner</Link>
                            <Link to="/auth?role=agent" className="block px-3 py-2 rounded-md hover:bg-white/10" onClick={() => setIsMenuOpen(false)}>Agent</Link>
                            <Link to="/auth?role=admin" className="block px-3 py-2 rounded-md hover:bg-white/10" onClick={() => setIsMenuOpen(false)}>Admin</Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="flex-grow pt-20">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-[#050B14] py-8 text-center text-gray-400 text-sm border-t border-white/5">
                <p>&copy; 2026 FuelRescue Pro. All rights reserved.</p>
                <div className="flex justify-center space-x-4 mt-2">
                    <a href="#" className="hover:text-orange-500">Privacy</a>
                    <a href="#" className="hover:text-orange-500">Terms</a>
                    <a href="#" className="hover:text-orange-500">Contact</a>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
