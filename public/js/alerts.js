// public/js/alerts.js

document.addEventListener('DOMContentLoaded', () => {
    // Get references to the DOM elements where alerts will be displayed
    const alertsContainer = document.getElementById('alerts-container');
    const noAlertsMessage = document.getElementById('no-alerts-message');
    const loadingAlertsMessage = document.getElementById('loading-alerts-message');

    // Define the base URL for your backend API
    // Ensure this matches the host and port your Flask backend is running on
    const API_BASE_URL = 'http://127.0.0.1:5000/api';

    /**
     * Fetches incident data from the backend API.
     * @returns {Promise<Array>} A promise that resolves to an array of incident objects.
     */
    async function fetchIncidents() {
        try {
            // Show loading message and hide others
            loadingAlertsMessage.classList.remove('hidden');
            noAlertsMessage.classList.add('hidden');
            alertsContainer.innerHTML = ''; // Clear existing alerts

            console.log('Fetching incidents from:', `${API_BASE_URL}/incidents`);
            const response = await fetch(`${API_BASE_URL}/incidents`);

            // Check if the response was successful (status code 200-299)
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
            }

            const incidents = await response.json();
            console.log('Incidents fetched successfully:', incidents);
            return incidents;
        } catch (error) {
            console.error('Error fetching incidents:', error);
            // Display an error message to the user if fetching fails
            alertsContainer.innerHTML = `<div class="text-red-600 text-center col-span-full">
                                            <p>Failed to load alerts. Please try again later.</p>
                                            <p>Error: ${error.message}</p>
                                        </div>`;
            return []; // Return an empty array on error
        } finally {
            // Hide loading message once fetching is complete (whether successful or not)
            loadingAlertsMessage.classList.add('hidden');
        }
    }

    /**
     * Renders the given incident data into the alerts container.
     * @param {Array} incidents - An array of incident objects to display.
     */
    function renderIncidents(incidents) {
        // Clear previous alerts before rendering new ones
        alertsContainer.innerHTML = '';

        if (incidents.length === 0) {
            // If no incidents, show the "no alerts" message
            noAlertsMessage.classList.remove('hidden');
            return;
        } else {
            noAlertsMessage.classList.add('hidden');
        }

        // Iterate over each incident and create its HTML representation
        incidents.forEach(incident => {
            // Determine border color based on incident status or department classification
            let borderColor = 'border-gray-400'; // Default color
            if (incident.status === 'reported') {
                borderColor = 'border-red-500';
            } else if (incident.status === 'in_progress') {
                borderColor = 'border-orange-500';
            } else if (incident.status === 'resolved') {
                borderColor = 'border-green-500';
            } else if (incident.department_classification.includes('FIRE')) {
                borderColor = 'border-red-500';
            } else if (incident.department_classification.includes('MEDICAL')) {
                borderColor = 'border-purple-500';
            } else if (incident.department_classification.includes('POLICE')) {
                borderColor = 'border-blue-500';
            }
            // You can add more specific color mappings based on department_classification

            const incidentDate = new Date(incident.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Create the HTML structure for a single alert card
            const alertCard = `
                <div class="bg-white p-6 rounded-lg shadow-md border-l-4 ${borderColor}">
                    <h2 class="text-xl font-semibold text-gray-800 mb-2">${incident.description}</h2>
                    <p class="text-gray-600 text-sm mb-1">Location: ${incident.location}</p>
                    <p class="text-gray-600 text-sm mb-3">Posted: ${incidentDate} | Status: <span class="capitalize">${incident.status.replace(/_/g, ' ')}</span></p>
                    <p class="text-gray-700 mb-4">
                        Departments: ${incident.department_classification.split(',').map(d => `<span class="inline-block bg-blue-100 text-blue-800 text-xs font-medium mr-1 px-2.5 py-0.5 rounded-full">${d.trim()}</span>`).join('')}
                    </p>
                    ${incident.image_url ? `<img src="${incident.image_url}" alt="Incident Image" class="w-full h-48 object-cover rounded-md mb-4" onerror="this.onerror=null;this.src='https://placehold.co/400x200/cccccc/333333?text=No+Image';">` : ''}
                    </div>
            `;
            alertsContainer.insertAdjacentHTML('beforeend', alertCard); // Add the card to the container
        });
    }

    /**
     * Main function to load and refresh alerts.
     */
    async function loadAndRefreshAlerts() {
        const incidents = await fetchIncidents();
        renderIncidents(incidents);
    }

    // Initial load of alerts when the page loads
    loadAndRefreshAlerts();

    // Set up polling to refresh alerts every 30 seconds
    // This will ensure the alerts page is updated without a manual refresh
    setInterval(loadAndRefreshAlerts, 30000); // Refresh every 30 seconds (30000 milliseconds)

    console.log("alerts.js loaded and incident fetching initiated.");
});
