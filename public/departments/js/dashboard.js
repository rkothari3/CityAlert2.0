// departments/js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements
    const departmentNameDisplay = document.getElementById('departmentNameDisplay');
    const logoutBtn = document.getElementById('logoutBtn');
    const statusFilter = document.getElementById('statusFilter');
    const incidentsList = document.getElementById('incidentsList');
    const noIncidentsMessage = document.getElementById('noIncidentsMessage');

    // Initialize the department incident map
    let departmentMap = null;

    // Custom Modal elements (dynamically created to replace browser's alert())
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'customModalOverlay';
    // Tailwind classes for styling the modal overlay
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50';
    document.body.appendChild(modalOverlay); // Append to body

    const modalContent = document.createElement('div');
    modalContent.id = 'customModalContent';
    // Tailwind classes for styling the modal content box
    modalContent.className = 'bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center';
    modalOverlay.appendChild(modalContent); // Append content to overlay

    /**
     * Displays a custom alert modal instead of browser's alert().
     * This provides a more consistent and styled user experience.
     * @param {string} message The message to display in the modal.
     */
    function showCustomAlert(message) {
        modalContent.innerHTML = `
            <p class="text-lg font-semibold mb-4">${message}</p>
            <button id="closeModalBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">OK</button>
        `;
        modalOverlay.classList.remove('hidden'); // Show the modal
        // Add event listener to close button
        document.getElementById('closeModalBtn').onclick = () => modalOverlay.classList.add('hidden');
    }

    // Get the department name from sessionStorage, which was set during login
    const departmentName = sessionStorage.getItem('departmentName');

    // If no department name is found, it means the user is not logged in or session expired.
    // Redirect them to the login page.
    if (!departmentName) {
        window.location.href = 'login.html';
        return; // Stop script execution to prevent further errors
    }

    // Display the retrieved department name on the dashboard
    departmentNameDisplay.textContent = `${departmentName} Department`;

    /**
     * Initialize the Google Map for showing department-specific incident locations
     */
    async function initializeDepartmentMap() {
        try {
            console.log('Initializing department map...');
            
            // Wait for IncidentMap class to be available
            if (typeof IncidentMap === 'undefined') {
                console.error('IncidentMap class not available. Make sure map-utils.js is loaded.');
                throw new Error('IncidentMap class not available');
            }
            
            departmentMap = new IncidentMap('departmentMap', {
                center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
                zoom: 12
            });
            await departmentMap.initMap();
            
            // Set the global window reference for the map instance
            window.departmentMap = departmentMap;
            
            console.log('✓ Department map initialized successfully');
        } catch (error) {
            console.error('Failed to initialize department map:', error);
            // Show error message in map container
            const mapContainer = document.getElementById('departmentMap');
            if (mapContainer) {
                mapContainer.innerHTML = `
                    <div class="h-full flex items-center justify-center bg-red-50 text-red-600">
                        <div class="text-center">
                            <p class="font-medium">Map failed to load</p>
                            <p class="text-sm">Please check your internet connection</p>
                            <p class="text-xs mt-2">Error: ${error.message}</p>
                        </div>
                    </div>
                `;
            }
        }
    }

    /**
     * Fetches incidents for the current department from the backend API.
     * It can optionally filter incidents by status.
     * @param {string} status Optional status to filter incidents by (e.g., 'reported', 'in_progress', 'resolved').
     */
    async function fetchIncidents(status = '') {
        // Show loading placeholders while incidents are being fetched
        incidentsList.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-300 animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div class="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-full mb-4"></div>
                <div class="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-300 animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div class="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-full mb-4"></div>
                <div class="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
        `;
        noIncidentsMessage.classList.add('hidden'); // Hide "no incidents" message during loading

        try {
            // Construct the API URL for fetching department-specific incidents
            const url = `${API_BASE_URL}/departments/${departmentName}/incidents${status ? `?status=${status}` : ''}`;
            const response = await fetch(url);

            if (response.ok) {
                const incidents = await response.json();
                renderIncidents(incidents); // Render the fetched incidents
            } else {
                // Handle API errors (e.g., 404, 500 from backend)
                const errorData = await response.json();
                console.error('Error fetching incidents:', errorData.error || response.statusText);
                incidentsList.innerHTML = `<p class="text-red-600 text-center col-span-full">Failed to load incidents: ${errorData.error || 'Unknown error'}</p>`;
            }
        } catch (error) {
            // Handle network errors (e.g., backend not reachable)
            console.error('Network error fetching incidents:', error);
            incidentsList.innerHTML = `<p class="text-red-600 text-center col-span-full">Network error. Please check your connection and ensure the backend is running.</p>`;
        }
    }

    /**
     * Renders the list of incidents into the DOM.
     * Clears existing incidents and creates new cards for each incident.
     * @param {Array<Object>} incidents An array of incident objects to display.
     */
    function renderIncidents(incidents) {
        incidentsList.innerHTML = ''; // Clear any previously rendered incidents
        if (incidents.length === 0) {
            noIncidentsMessage.classList.remove('hidden'); // Show "no incidents" message
            return;
        }

        noIncidentsMessage.classList.add('hidden'); // Hide "no incidents" message if incidents are present

        // Update the map with department-specific incident markers
        if (departmentMap && departmentMap.updateMarkers) {
            departmentMap.updateMarkers(incidents);
        }

        incidents.forEach(incident => {
            const incidentCard = document.createElement('div');
            incidentCard.classList.add('bg-white', 'p-6', 'rounded-lg', 'shadow-md', 'border-l-4');

            // Determine border color based on incident status for visual cues
            let borderColorClass = '';
            switch (incident.status) {
                case 'reported':
                    borderColorClass = 'border-blue-500';
                    break;
                case 'in_progress':
                    borderColorClass = 'border-yellow-500';
                    break;
                case 'resolved':
                    borderColorClass = 'border-green-500';
                    break;
                default:
                    borderColorClass = 'border-gray-300'; // Default for unknown or other statuses
            }
            incidentCard.classList.add(borderColorClass);

            // Format the incident timestamp for better readability
            const date = new Date(incident.timestamp);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            // Fix image URL handling - this is where the issue is
            let imageHtml = '';
            if (incident.image_url) {
                // Check if the image_url is a relative path (starts with '/uploads/')
                const imageUrl = incident.image_url.startsWith('/uploads/') 
                    ? `${API_BASE_URL}${incident.image_url}`
                    : incident.image_url;
                
                imageHtml = `<div class="incident-image-container">
                                <img src="${imageUrl}" alt="Incident Image" class="w-full h-48 object-cover rounded-md mb-4 cursor-pointer hover:opacity-90 transition-opacity" 
                                     onclick="openImageModal('${imageUrl}')" 
                                     onerror="this.onerror=null;this.src='https://placehold.co/400x200/cccccc/333333?text=No+Image';">
                                <div class="text-blue-600 text-xs text-center -mt-3 mb-3">Click image to enlarge</div>
                             </div>`;
            }

            // Construct the HTML content for each incident card
            incidentCard.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-xl font-semibold text-gray-800">${incident.description}</h3>
                    <span class="px-3 py-1 rounded-full text-xs font-semibold uppercase status-${incident.status.replace('_', '-')}">
                        ${incident.status.replace('_', ' ')}
                    </span>
                </div>
                <p class="text-gray-600 text-sm mb-2"><strong>Location:</strong> ${incident.location}</p>
                ${incident.latitude && incident.longitude ? 
                    `<p class="text-gray-600 text-sm mb-2"><strong>Coordinates:</strong> ${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}</p>` : ''}
                <p class="text-gray-600 text-sm mb-4"><strong>Reported:</strong> ${formattedDate}</p>
                ${imageHtml}
                
                <div class="flex justify-between items-center mt-4">
                    <div class="flex space-x-2">
                        <select class="status-update-select p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" data-incident-id="${incident.id}">
                            <option value="">Update Status</option>
                            <option value="reported" ${incident.status === 'reported' ? 'selected' : ''}>Reported</option>
                            <option value="in_progress" ${incident.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                            <option value="resolved" ${incident.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                        </select>
                        <button class="delete-incident-btn p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition duration-300" 
                            data-incident-id="${incident.id}" title="Delete Incident">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                    ${incident.latitude && incident.longitude ? 
                        `<button onclick="focusDepartmentMapOnIncident(${incident.latitude}, ${incident.longitude})" class="text-blue-600 hover:text-blue-800 text-sm font-medium">📍 View on Map</button>` : ''}
                </div>
            `;
            incidentsList.appendChild(incidentCard); // Add the card to the list container
        });

        // Attach event listeners to the newly rendered status update select elements
        // This ensures that status changes trigger an update to the backend
        document.querySelectorAll('.status-update-select').forEach(selectElement => {
            selectElement.addEventListener('change', (event) => {
                const incidentId = event.target.dataset.incidentId; // Get incident ID from data attribute
                const newStatus = event.target.value; // Get the newly selected status
                if (newStatus) { // Only proceed if a valid status option was selected
                    updateIncidentStatus(incidentId, newStatus);
                }
            });
        });

        // Attach event listeners to the delete buttons
        document.querySelectorAll('.delete-incident-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const incidentId = event.currentTarget.dataset.incidentId;
                confirmDeleteIncident(incidentId);
            });
        });
    }

    /**
     * Show a confirmation dialog before deleting an incident
     * @param {number} incidentId The ID of the incident to delete
     */
    function confirmDeleteIncident(incidentId) {
        modalContent.innerHTML = `
            <p class="text-lg font-semibold mb-4">Delete Incident</p>
            <p class="text-sm text-gray-600 mb-4">Enter your department key to confirm deletion:</p>
            <input type="password" id="departmentKeyInput" placeholder="Department Key" class="w-full p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <p class="text-xs text-red-600 mb-4">This action cannot be undone.</p>
            <div class="flex justify-center space-x-4">
                <button id="cancelDeleteBtn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button id="confirmDeleteBtn" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Delete</button>
            </div>
        `;
        modalOverlay.classList.remove('hidden'); // Show the modal

        // Add event listeners to the buttons
        document.getElementById('cancelDeleteBtn').onclick = () => modalOverlay.classList.add('hidden');
        document.getElementById('confirmDeleteBtn').onclick = () => {
            const departmentKey = document.getElementById('departmentKeyInput').value.trim();
            if (!departmentKey) {
                showCustomAlert("Please enter your department key to confirm deletion.");
                return;
            }
            deleteIncident(incidentId, departmentKey);
            modalOverlay.classList.add('hidden');
        };

        // Allow Enter key to confirm deletion
        document.getElementById('departmentKeyInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('confirmDeleteBtn').click();
            }
        });
    }

    /**
     * Deletes an incident via the backend API.
     * After a successful deletion, it refreshes the incident list.
     * @param {number} incidentId The ID of the incident to delete.
     * @param {string} departmentKey The department key for authentication.
     */
    async function deleteIncident(incidentId, departmentKey) {
        try {
            const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    department_key: departmentKey,
                    department_name: departmentName
                })
            });

            const responseText = await response.text();
            
            // Try to parse as JSON, fallback to text if it fails
            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('Failed to parse response as JSON:', responseText);
                throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}...`);
            }

            if (response.ok) {
                // If deletion is successful, re-fetch and re-render the incidents to reflect the change
                fetchIncidents(statusFilter.value);
                console.log(`Incident ${incidentId} has been deleted`);
                showCustomAlert("Incident successfully deleted");
            } else {
                // Handle errors from the backend API during deletion
                showCustomAlert(`Failed to delete incident: ${responseData.error || response.statusText}`);
                console.error('Error deleting incident:', responseData);
            }
        } catch (error) {
            // Handle network errors during deletion
            console.error('Network error deleting incident:', error);
            showCustomAlert(`Network error: ${error.message}`);
        }
    }

    /**
     * Updates the status of an incident via the backend API.
     * @param {number} incidentId The ID of the incident to update.
     * @param {string} newStatus The new status to set for the incident.
     */
    async function updateIncidentStatus(incidentId, newStatus) {
        try {
            const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus })
            });

            const responseText = await response.text();
            
            // Try to parse as JSON, fallback to text if it fails
            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('Failed to parse response as JSON:', responseText);
                throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}...`);
            }

            if (response.ok) {
                // Status updated successfully, refresh the incidents list
                fetchIncidents(statusFilter.value);
                console.log(`Incident ${incidentId} status updated to: ${newStatus}`);
            } else {
                // Handle errors from the backend API
                console.error('Error updating incident status:', responseData);
                showCustomAlert(`Failed to update status: ${responseData.error || response.statusText}`);
            }
        } catch (error) {
            // Handle network errors
            console.error('Network error updating incident status:', error);
            showCustomAlert(`Network error: ${error.message}`);
        }
    }

    // Event listener for the status filter dropdown.
    // When the filter changes, re-fetch incidents with the new filter.
    statusFilter.addEventListener('change', (event) => {
        fetchIncidents(event.target.value);
    });

    // Event listener for the logout button.
    // Clears session storage and redirects to the login page.
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('departmentName'); // Clear stored department name
        sessionStorage.removeItem('displayName'); // Clear any other stored user data
        window.location.href = 'login.html'; // Redirect to login page
    });

    // Initialize map when page loads - wait for DOM and scripts to be ready
    setTimeout(async () => {
        await initializeDepartmentMap();
        // Initial fetch of incidents when the dashboard page loads
        fetchIncidents();
    }, 100);
});

/**
 * Global function to focus department map on a specific incident
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
function focusDepartmentMapOnIncident(lat, lng) {
    // Scroll to map section
    document.getElementById('departmentMap').scrollIntoView({ behavior: 'smooth' });
    
    // Focus map on incident location
    if (window.departmentMap && window.departmentMap.setCenter) {
        window.departmentMap.setCenter(lat, lng, 16);
    } else {
        console.error('Map not initialized or missing setCenter method');
    }
}

/**
 * Opens a modal to display the full-size image
 * @param {string} imageUrl - URL of the image to display
 */
function openImageModal(imageUrl) {
    // Create modal if it doesn't exist yet
    let imageModal = document.getElementById('image-modal');
    if (!imageModal) {
        // Create the modal element
        imageModal = document.createElement('div');
        imageModal.id = 'image-modal';
        imageModal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 hidden';
        
        // Create modal content
        imageModal.innerHTML = `
            <div class="relative max-w-4xl w-full mx-4">
                <div class="relative">
                    <img id="modal-image" src="" alt="Full size image" class="max-w-full max-h-[85vh] object-contain mx-auto rounded-lg shadow-xl">
                    <button id="close-image-modal" class="absolute top-2 right-2 bg-white bg-opacity-75 rounded-full p-2 hover:bg-opacity-100 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(imageModal);
        
        // Add event listener to close button
        document.getElementById('close-image-modal').addEventListener('click', () => {
            imageModal.classList.add('hidden');
        });
        
        // Close modal when clicking outside the image
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal) {
                imageModal.classList.add('hidden');
            }
        });
        
        // Allow ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !imageModal.classList.contains('hidden')) {
                imageModal.classList.add('hidden');
            }
        });
    }
    
    // Set the image source and display modal
    document.getElementById('modal-image').src = imageUrl;
    imageModal.classList.remove('hidden');
}

// Make image modal function globally available
window.openImageModal = openImageModal;

