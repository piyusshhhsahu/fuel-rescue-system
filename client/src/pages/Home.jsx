import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gradient-to-b from-white to-green-50 px-4 text-center">

            <div className="max-w-3xl space-y-6">
                <div className="inline-block p-3 rounded-full bg-green-100 text-primary mb-2">
                    <MapPin size={32} />
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
                    Out of Fuel? <span className="text-primary">We've Got You.</span>
                </h1>

                <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                    Instantly find nearby petrol pumps and request fuel delivery to your exact location. Fast, reliable, and available 24/7.
                </p>

                <div className="pt-8">
                    <button
                        onClick={() => navigate('/map')}
                        className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-primary font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary hover:bg-green-600 transform hover:scale-105 shadow-xl"
                    >
                        Find Nearest Pump
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                    <FeatureCard
                        title="Locate"
                        desc="Auto-detects your location to find the closest service stations."
                    />
                    <FeatureCard
                        title="Request"
                        desc="Select fuel type and amount needed for your vehicle."
                    />
                    <FeatureCard
                        title="Rescue"
                        desc="A delivery agent brings fuel directly to you."
                    />
                </div>
            </div>
        </div>
    );
};

const FeatureCard = ({ title, desc }) => (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-xl mb-2 text-gray-800">{title}</h3>
        <p className="text-gray-600">{desc}</p>
    </div>
);

export default Home;
