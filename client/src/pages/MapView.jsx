import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import PumpCard from '../components/PumpCard';
import RequestForm from '../components/RequestForm';
import { Loader2 } from 'lucide-react';

// Fix for default marker icon in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons
const userIcon = L.divIcon({
    html: `<div style="background:#3b82f6;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px rgba(59,130,246,0.7)"></div>`,
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
});

const pumpIcon = L.divIcon({
    html: `<div style="background:#f97316;width:14px;height:14px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 0 6px rgba(249,115,22,0.7)"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});

// Component to recenter map when user location changes
const RecenterMap = ({ location }) => {
    const map = useMap();
    useEffect(() => {
        if (location) {
            map.flyTo(location, 13);
        }
    }, [location, map]);
    return null;
};

const MapView = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [pumps, setPumps] = useState([]);
    const [selectedPump, setSelectedPump] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestSuccess, setRequestSuccess] = useState(false);

    useEffect(() => {
        // Get User Location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation([latitude, longitude]);
                    fetchPumps(latitude, longitude);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setLoading(false);
                    // Fallback to New Delhi for demo if location denied
                    const fallback = [28.6139, 77.2090];
                    setUserLocation(fallback);
                    fetchPumps(fallback[0], fallback[1]);
                }
            );
        } else {
            setLoading(false);
        }
    }, []);

    const fetchPumps = async (lat, lng) => {
        try {
            // Mock API or Real Backend
            // For now using localhost if running, else mock
            // const res = await axios.get(`http://localhost:5000/api/pumps?lat=${lat}&lng=${lng}`);
            // setPumps(res.data);

            // Fallback mock data if server not running or empty
            const mockPumps = [
                {
                    _id: '1',
                    name: "Shell Station - Nearby",
                    location: { coordinates: [lng + 0.01, lat + 0.01] },
                    address: "123 Main Road",
                    contactNumber: "9876543210",
                    fuelTypes: ["Petrol", "Diesel"]
                },
                {
                    _id: '2',
                    name: "Indian Oil",
                    location: { coordinates: [lng - 0.01, lat - 0.005] },
                    address: "456 City Center",
                    contactNumber: "9123456780",
                    fuelTypes: ["Petrol"]
                },
                {
                    _id: '3',
                    name: "HP Patrol",
                    location: { coordinates: [lng + 0.005, lat - 0.01] },
                    address: "789 South Ext",
                    contactNumber: "9988776655",
                    fuelTypes: ["Diesel"]
                }
            ];
            setPumps(mockPumps);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestFuel = (pump) => {
        setSelectedPump(pump);
    };

    const closeRequestForm = () => {
        setSelectedPump(null);
    };

    const submitRequest = async (formData) => {
        try {
            // await axios.post('http://localhost:5000/api/requests', {
            //     ...formData,
            //     userLocation: [userLocation[1], userLocation[0]]
            // });
            // Mock success
            console.log("Request Submitted:", formData);
            setRequestSuccess(true);
            setTimeout(() => {
                setRequestSuccess(false);
                setSelectedPump(null);
            }, 3000);
        } catch (err) {
            console.error(err);
            alert("Failed to submit request.");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    return (
        <div className="relative h-[calc(100vh-64px)] w-full">
            {requestSuccess && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-green-500 text-white px-6 py-3 rounded-full shadow-lg font-bold animate-bounce">
                    Request Sent! Help is on the way.
                </div>
            )}

            {userLocation && (
                <MapContainer center={userLocation} zoom={13} scrollWheelZoom={true} className="h-full w-full">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* User Marker */}
                    <Marker position={userLocation} icon={userIcon}>
                        <Popup>
                            📍 You are here
                        </Popup>
                    </Marker>

                    {/* Pump Markers */}
                    {pumps.map(pump => (
                        <Marker
                            key={pump._id}
                            position={[pump.location.coordinates[1], pump.location.coordinates[0]]}
                            icon={pumpIcon}
                        >
                            <Popup>
                                <div className="min-w-[200px]">
                                    <h3 className="font-bold">{pump.name}</h3>
                                    <p className="text-sm">{pump.fuelTypes.join(', ')}</p>
                                    <button
                                        onClick={() => handleRequestFuel(pump)}
                                        className="mt-2 w-full bg-primary text-white text-xs py-1 rounded"
                                    >
                                        Request Fuel
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    <RecenterMap location={userLocation} />
                </MapContainer>
            )}

            {/* Float List for Mobile (Optional, currently just relying on map markers) */}

            {selectedPump && (
                <RequestForm
                    pump={selectedPump}
                    onClose={closeRequestForm}
                    onSubmit={submitRequest}
                />
            )}
        </div>
    );
};

export default MapView;
