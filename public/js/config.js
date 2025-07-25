// Configuration file for CityAlert frontend
const API_BASE_URL = 'https://cityalert-backend.onrender.com/api';

// Global configuration object with better fallback handling
window.CITY_ALERT_CONFIG = {
    MAPS_API_KEY: window.GOOGLE_MAPS_API_KEY || 
                  (typeof process !== 'undefined' && process.env?.GOOGLE_MAPS_API_KEY) ||
                  'YOUR_GOOGLE_MAPS_API_KEY_HERE'
};

// Add debugging information for static config fallback
if (window.CITY_ALERT_CONFIG.MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    console.warn('⚠ Using static config fallback - Google Maps API key not configured');
    console.log('Static config loaded. Dynamic config from backend should be preferred.');
} else {
    console.log('✓ Static config loaded with API key');
}