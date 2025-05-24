// departments/js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements
    const departmentNameDisplay = document.getElementById('departmentNameDisplay');
    const logoutBtn = document.getElementById('logoutBtn');
    const statusFilter = document.getElementById('statusFilter');
    const incidentsList = document.getElementById('incidentsList');
    const noIncidentsMessage = document.getElementById('noIncidentsMessage');

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
            const url = `http://127.0.0.1:5000/api/departments/${departmentName}/incidents${status ? `?status=${status}` : ''}`;
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

            // Construct the HTML content for each incident card
            incidentCard.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-xl font-semibold text-gray-800">${incident.description}</h3>
                    <span class="px-3 py-1 rounded-full text-xs font-semibold uppercase status-${incident.status.replace('_', '-')}">
                        ${incident.status.replace('_', ' ')}
                    </span>
                </div>
                <p class="text-gray-600 text-sm mb-2"><strong>Location:</strong> ${incident.location}</p>
                <p class="text-gray-600 text-sm mb-4"><strong>Reported:</strong> ${formattedDate}</p>
                ${incident.image_url ? `<p class="text-gray-600 text-sm mb-4"><strong>Image:</strong> <a href="${incident.image_url}" target="_blank" class="text-blue-600 hover:underline">View Attached Image</a></p>` : ''}
                
                <div class="flex justify-end space-x-2 mt-4">
                    <select class="status-update-select p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" data-incident-id="${incident.id}">
                        <option value="">Update Status</option>
                        <option value="reported" ${incident.status === 'reported' ? 'selected' : ''}>Reported</option>
                        <option value="in_progress" ${incident.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                        <option value="resolved" ${incident.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
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
    }

    /**
     * Updates the status of an incident via the backend API.
     * After a successful update, it refreshes the incident list.
     * @param {number} incidentId The ID of the incident to update.
     * @param {string} newStatus The new status to set for the incident.
     */
    async function updateIncidentStatus(incidentId, newStatus) {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/incidents/${incidentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }), // Send the new status in the request body
            });

            if (response.ok) {
                // If update is successful, re-fetch and re-render the incidents to reflect the change
                fetchIncidents(statusFilter.value);
                console.log(`Incident ${incidentId} status updated to ${newStatus}`);
            } else {
                // Handle errors from the backend API during update
                const errorData = await response.json();
                showCustomAlert(`Failed to update incident status: ${errorData.error || response.statusText}`);
                console.error('Error updating incident status:', errorData);
            }
        } catch (error) {
            // Handle network errors during update
            console.error('Network error updating incident status:', error);
            showCustomAlert("Network error. Could not update incident status. Please check your connection.");
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

    // Initial fetch of incidents when the dashboard page loads
    fetchIncidents();
});

