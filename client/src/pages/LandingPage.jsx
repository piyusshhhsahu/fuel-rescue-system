import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ShieldCheck, ArrowRight, Zap } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-float"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>

                <div className="relative z-10 text-center max-w-4xl mx-auto">
                    <div className="inline-block mb-4 px-4 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm font-semibold tracking-wide uppercase">
                        Emergency Fuel Delivery
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                        Never Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">Stranded</span> Again.
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                        Out of fuel centrally? We deliver Petrol & Diesel to your location in minutes.
                        Live tracking, secure payments, and 24/7 support.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/auth?role=user" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto flex items-center justify-center group">
                            Request Fuel Now <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition" />
                        </Link>
                        <Link to="/auth?role=pump" className="px-8 py-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition w-full sm:w-auto font-semibold">
                            Partner Login
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 bg-black/20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose FuelRescue?</h2>
                        <p className="text-gray-400">Smart technology providing safety and convenience</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, idx) => (
                            <div key={idx} className="glass-card p-8 hover:transform hover:-translate-y-2 transition duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-6 text-white shadow-lg">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-12">
                            <h2 className="text-4xl font-bold leading-tight">
                                Simple Steps to <br />
                                <span className="text-orange-500">Get Moving</span>
                            </h2>
                            <div className="space-y-8">
                                {[
                                    { step: '01', title: 'Request Fuel', desc: 'Share your location and choose fuel type.' },
                                    { step: '02', title: 'Agent Assigned', desc: 'A nearby delivery agent accepts your request.' },
                                    { step: '03', title: 'Refuel & Go', desc: 'Fast delivery securely to your vehicle.' }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6">
                                        <span className="text-4xl font-black text-white/10">{item.step}</span>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                                            <p className="text-gray-400">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            {/* Abstract UI Mockup */}
                            <div className="glass-card p-6 rotate-3 hover:rotate-0 transition duration-500">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                                        <div>
                                            <div className="h-2 w-24 bg-gray-600 rounded mb-1"></div>
                                            <div className="h-2 w-16 bg-gray-700 rounded"></div>
                                        </div>
                                    </div>
                                    <span className="text-green-400 text-sm">On the Way</span>
                                </div>
                                <div className="h-40 bg-gray-800/50 rounded-lg mb-4 flex items-center justify-center text-gray-600">
                                    Live Map View
                                </div>
                                <div className="space-y-3">
                                    <div className="h-10 bg-orange-600 rounded w-full"></div>
                                    <div className="h-10 bg-gray-700 rounded w-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const features = [
    {
        icon: <MapPin size={28} />,
        title: "Geolocation Tracking",
        desc: "We use advanced GPS to pinpoint your exact location, ensuring our agents find you even on remote highways."
    },
    {
        icon: <Clock size={28} />,
        title: "Express Delivery",
        desc: "Our average delivery time is under 30 minutes in city limits. We value your time and safety."
    },
    {
        icon: <ShieldCheck size={28} />,
        title: "Safe & Secure",
        desc: "Trusted implementation. All delivery agents are verified. Contactless payment options available."
    }
];

export default LandingPage;
