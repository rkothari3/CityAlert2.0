/**
 * Dashboard script for CityAlert - Department interface
 * Initializes map and fetches incidents for the department
 */

// Global map instance
let departmentMapInstance = null;

async function fetchIncidents() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const department = urlParams.get('department');
        
        if (!department) {
            console.error('No department specified in URL');
            return;
        }
        
        const response = await fetch(`http://127.0.0.1:5000/api/departments/${department}/incidents`);
        
        const responseText = await response.text();
        
        // Try to parse as JSON, fallback to text if it fails
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('Failed to parse response as JSON:', responseText);
            throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}...`);
        }
        
        if (response.ok) {
            if (data && data.length > 0) {
                // Make sure map is initialized before doing anything with it
                if (!departmentMapInstance) {
                    await initializeDepartmentMap();
                }
                
                // Render incidents in the list
                renderIncidents(data);
                
                // Only update markers if the map is properly initialized
                if (departmentMapInstance && departmentMapInstance.map) {
                    departmentMapInstance.updateMarkers(data);
                    window.departmentMap = departmentMapInstance;
                    console.log('✓ Map markers updated with incidents');
                } else {
                    console.warn('Map not ready for marker updates');
                }
            } else {
                console.log('No incidents found for department:', department);
            }
        } else {
            console.error('Error fetching incidents:', data.error || response.statusText);
        }
    } catch (error) {
        console.error('Network error fetching incidents:', error);
    }
}

/**
 * Initialize the department map
 */
async function initializeDepartmentMap() {
    try {
        // Determine container: use 'department-map' if exists, else fallback to 'map'
        const containerId = document.getElementById('department-map') ? 'department-map'
                           : document.getElementById('map') ? 'map' : null;
        if (containerId) {
            departmentMapInstance = await initMap(containerId, {
                center: { lat: 37.7749, lng: -122.4194 },
                zoom: 12
            });
            
            // Also store globally for backward compatibility
            window.departmentMap = departmentMapInstance;
            
            console.log(`✓ Department map initialized (${containerId})`);
        }
    } catch (error) {
        console.error('Error initializing department map:', error);
    }
}

/**
 * Focus department map on specific incident
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
function focusDepartmentMapOnIncident(lat, lng) {
    if (!departmentMapInstance) {
        console.error('Department map not initialized');
        return;
    }
    
    try {
        departmentMapInstance.setCenter(parseFloat(lat), parseFloat(lng), 16);
        console.log(`✓ Map focused on: ${lat}, ${lng}`);
    } catch (error) {
        console.error('Error focusing map:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Dashboard loading...');
    
    // Wait for Google Maps API to load
    if (typeof google === 'undefined') {
        console.log('⏳ Waiting for Google Maps API...');
        await waitForGoogleMaps();
    }
    
    // Initialize map first and wait for it to complete
    await initializeDepartmentMap();
    
    // Add a small delay to ensure map is fully ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Then fetch incidents
    await fetchIncidents();
    
    console.log('✅ Dashboard loaded');
});

/**
 * Wait for Google Maps API to load
 */
function waitForGoogleMaps() {
    return new Promise((resolve) => {
        const checkGoogleMaps = () => {
            if (typeof google !== 'undefined' && google.maps) {
                resolve();
            } else {
                setTimeout(checkGoogleMaps, 100);
            }
        };
        checkGoogleMaps();
    });
}

// Make functions globally available for HTML onclick handlers
window.focusDepartmentMapOnIncident = focusDepartmentMapOnIncident;