// Configuration file for CityAlert departments frontend
const API_BASE_URL = 'https://cityalert-backend.onrender.com/api';

// Global configuration object with better fallback handling
window.CITY_ALERT_CONFIG = {
    MAPS_API_KEY: window.GOOGLE_MAPS_API_KEY || 
                  (typeof process !== 'undefined' && process.env?.GOOGLE_MAPS_API_KEY) ||
                  'YOUR_GOOGLE_MAPS_API_KEY_HERE',
    GEMINI_API_KEY: window.GEMINI_API_KEY || 
                   (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
                   '',
    HAS_GEMINI_KEY: false // Will be overridden by dynamic config if available
};

// Add debugging information for static config fallback
if (window.CITY_ALERT_CONFIG.MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    console.warn('⚠ Using departments static config fallback - Google Maps API key not configured');
}

if (!window.CITY_ALERT_CONFIG.HAS_GEMINI_KEY) {
    console.warn('⚠ Gemini API key not available - chatbot may not work');
}

console.log('Departments static config loaded. Dynamic config from backend should be preferred.');