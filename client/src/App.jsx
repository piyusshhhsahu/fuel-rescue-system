import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import UserDashboard from './pages/UserDashboard';
import PumpDashboard from './pages/PumpDashboard';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/user-dashboard" element={<UserDashboard />} />
                <Route path="/pump-dashboard" element={<PumpDashboard />} />
                <Route path="/agent-dashboard" element={<AgentDashboard />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
            </Routes>
        </Layout>
    );
}

export default App;

