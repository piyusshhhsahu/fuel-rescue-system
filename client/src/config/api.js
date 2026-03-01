// Central API configuration
// Uses VITE_API_URL from environment, falls back to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default API_URL;
