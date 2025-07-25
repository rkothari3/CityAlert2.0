/**
 * Map utilities for displaying incidents on Google Maps
 * Reusable across different pages (alerts, dashboard)
 */

class IncidentMap {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.map = null;
        this.markers = [];
        this.options = {
            center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
            zoom: 12,
            mapId: "4504f8b37365c3d0", // Required for Advanced Markers
            ...options
        };
    }

    /**
     * Initialize the Google Map
     */
    async initMap() {
        try {
            // Request needed libraries
            const { Map } = await google.maps.importLibrary("maps");
            const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
            
            // Store the AdvancedMarkerElement class for later use
            this.AdvancedMarkerElement = AdvancedMarkerElement;
            
            // Create the map
            this.map = new Map(document.getElementById(this.containerId), this.options);
            
            console.log(`✓ Map initialized in container: ${this.containerId}`);
            return this.map;
        } catch (error) {
            console.error('Error initializing map:', error);
            throw error;
        }
    }

    /**
     * Add incidents as markers to the map
     * @param {Array} incidents - Array of incident objects with lat/lng
     */
    addIncidentMarkers(incidents) {
        if (!this.map || !this.AdvancedMarkerElement) {
            console.error('Map not initialized. Call initMap() first.');
            return;
        }

        // Clear existing markers
        this.clearMarkers();

        // Filter incidents that have valid coordinates
        const validIncidents = incidents.filter(incident => 
            incident.latitude && incident.longitude && 
            !isNaN(incident.latitude) && !isNaN(incident.longitude)
        );

        console.log(`Adding ${validIncidents.length} incident markers to map`);

        // Add markers for each incident
        validIncidents.forEach(incident => {
            this.addIncidentMarker(incident);
        });

        // Adjust map bounds to show all markers if we have any
        if (validIncidents.length > 0) {
            this.fitBoundsToMarkers(validIncidents);
        }
    }

    /**
     * Add a single incident marker
     * @param {Object} incident - Incident object with lat/lng and other details
     */
    addIncidentMarker(incident) {
        const position = {
            lat: parseFloat(incident.latitude),
            lng: parseFloat(incident.longitude)
        };

        // Create custom marker content with color coding based on status/department
        const markerContent = this.createMarkerContent(incident);

        // Create the advanced marker
        const marker = new this.AdvancedMarkerElement({
            map: this.map,
            position: position,
            content: markerContent,
            title: incident.description
        });

        // Create info window content
        const infoContent = this.createInfoWindowContent(incident);
        
        // Create info window
        const infoWindow = new google.maps.InfoWindow({
            content: infoContent
        });

        // Add click listener to show info window
        marker.addListener('click', () => {
            // Close any open info windows
            this.closeAllInfoWindows();
            infoWindow.open(this.map, marker);
            this.currentInfoWindow = infoWindow;
        });

        // Store marker reference
        this.markers.push({
            marker: marker,
            infoWindow: infoWindow,
            incident: incident
        });
    }

    /**
     * Create custom marker content with color coding
     * @param {Object} incident - Incident object
     * @returns {HTMLElement} - Custom marker element
     */
    createMarkerContent(incident) {
        const markerDiv = document.createElement('div');
        markerDiv.className = 'custom-marker';
        
        // Determine color based on status and department
        let backgroundColor = '#6B7280'; // Default gray
        let textColor = 'white';
        
        if (incident.status === 'reported') {
            backgroundColor = '#EF4444'; // Red
        } else if (incident.status === 'in_progress') {
            backgroundColor = '#F59E0B'; // Orange
        } else if (incident.status === 'resolved') {
            backgroundColor = '#10B981'; // Green
        }

        // Override with department-specific colors if needed
        if (incident.department_classification?.includes('FIRE')) {
            backgroundColor = '#DC2626'; // Fire red
        } else if (incident.department_classification?.includes('MEDICAL')) {
            backgroundColor = '#7C3AED'; // Purple
        } else if (incident.department_classification?.includes('POLICE')) {
            backgroundColor = '#2563EB'; // Blue
        }

        markerDiv.style.cssText = `
            width: 20px;
            height: 20px;
            background-color: ${backgroundColor};
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            color: ${textColor};
        `;

        // Add status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.textContent = incident.status === 'reported' ? '!' : 
                                     incident.status === 'in_progress' ? '⚠' : '✓';
        markerDiv.appendChild(statusIndicator);

        return markerDiv;
    }

    /**
     * Create info window content
     * @param {Object} incident - Incident object
     * @returns {string} - HTML content for info window
     */
    createInfoWindowContent(incident) {
        const date = new Date(incident.timestamp).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        return `
            <div style="max-width: 250px; font-family: 'Inter', sans-serif;">
                <h3 style="margin: 0 0 8px 0; color: #1F2937; font-size: 14px; font-weight: 600;">
                    ${incident.description}
                </h3>
                <p style="margin: 4px 0; color: #6B7280; font-size: 12px;">
                    <strong>Location:</strong> ${incident.location}
                </p>
                <p style="margin: 4px 0; color: #6B7280; font-size: 12px;">
                    <strong>Status:</strong> <span style="text-transform: capitalize;">${incident.status.replace('_', ' ')}</span>
                </p>
                <p style="margin: 4px 0; color: #6B7280; font-size: 12px;">
                    <strong>Department:</strong> ${incident.department_classification}
                </p>
                <p style="margin: 4px 0; color: #6B7280; font-size: 12px;">
                    <strong>Reported:</strong> ${date}
                </p>
                ${incident.image_url ? `
                    <p style="margin: 8px 0 4px 0;">
                        <a href="${incident.image_url}" target="_blank" style="color: #2563EB; text-decoration: none; font-size: 12px;">
                            📷 View Image
                        </a>
                    </p>
                ` : ''}
            </div>
        `;
    }

    /**
     * Fit map bounds to show all markers
     * @param {Array} incidents - Array of incidents with coordinates
     */
    fitBoundsToMarkers(incidents) {
        if (!incidents.length) return;

        const bounds = new google.maps.LatLngBounds();
        
        incidents.forEach(incident => {
            bounds.extend({
                lat: parseFloat(incident.latitude),
                lng: parseFloat(incident.longitude)
            });
        });

        this.map.fitBounds(bounds);

        // Set minimum zoom level to avoid zooming too far in for single markers
        google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
            if (this.map.getZoom() > 15) {
                this.map.setZoom(15);
            }
        });
    }

    /**
     * Clear all markers from the map
     */
    clearMarkers() {
        this.markers.forEach(({ marker, infoWindow }) => {
            marker.map = null;
            infoWindow.close();
        });
        this.markers = [];
        this.closeAllInfoWindows();
    }

    /**
     * Close all open info windows
     */
    closeAllInfoWindows() {
        if (this.currentInfoWindow) {
            this.currentInfoWindow.close();
            this.currentInfoWindow = null;
        }
    }

    /**
     * Update markers with new incident data
     * @param {Array} incidents - Updated incidents array
     */
    updateMarkers(incidents) {
        this.addIncidentMarkers(incidents);
    }

    /**
     * Set map center to specific coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number} zoom - Optional zoom level
     */
    setCenter(lat, lng, zoom = null) {
        if (this.map) {
            this.map.setCenter({ lat, lng });
            if (zoom) {
                this.map.setZoom(zoom);
            }
        }
    }
}

// Make IncidentMap available globally
window.IncidentMap = IncidentMap;

// Global map instances for backward compatibility
let globalMapInstance = null;
let departmentMapInstance = null;

/**
 * Backward compatibility function - Initialize map with old API
 * @param {string} containerId - Map container ID
 * @param {Object} options - Map options
 * @returns {Promise<Object>} - Map instance
 */
async function initMap(containerId = 'map', options = {}) {
    try {
        const mapInstance = new IncidentMap(containerId, options);
        await mapInstance.initMap();
        
        // Store globally based on container ID
        if (containerId === 'department-map') {
            departmentMapInstance = mapInstance;
            window.departmentMap = mapInstance;
        } else {
            globalMapInstance = mapInstance;
            window.globalMap = mapInstance;
        }
        
        console.log(`✓ Map initialized: ${containerId}`);
        return mapInstance;
    } catch (error) {
        console.error('Error initializing map:', error);
        throw error;
    }
}

/**
 * Backward compatibility function - Add incident markers
 * @param {Array} incidents - Array of incidents
 * @param {Object} mapInstance - Optional map instance
 */
function addIncidentMarkers(incidents, mapInstance = null) {
    const map = mapInstance || departmentMapInstance || globalMapInstance;
    
    if (!map) {
        console.error('Map not initialized. Call initMap() first.');
        return;
    }
    
    if (!map.addIncidentMarkers) {
        console.error('Map instance does not have addIncidentMarkers method');
        return;
    }
    
    map.addIncidentMarkers(incidents);
}

/**
 * Backward compatibility function - Update markers
 * @param {Array} incidents - Array of incidents
 * @param {Object} mapInstance - Optional map instance
 */
function updateMarkers(incidents, mapInstance = null) {
    const map = mapInstance || departmentMapInstance || globalMapInstance;
    
    if (!map) {
        console.error('Map not initialized. Call initMap() first.');
        return;
    }
    
    map.updateMarkers(incidents);
}

/**
 * Backward compatibility function - Focus map on incident
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} zoom - Zoom level
 */
function focusMapOnIncident(lat, lng, zoom = 16) {
    const map = departmentMapInstance || globalMapInstance;
    
    if (!map) {
        console.error('Map not initialized. Call initMap() first.');
        return;
    }
    
    map.setCenter(lat, lng, zoom);
}

// Make backward compatibility functions available globally
window.initMap = initMap;
window.addIncidentMarkers = addIncidentMarkers;
window.updateMarkers = updateMarkers;
window.focusMapOnIncident = focusMapOnIncident;
