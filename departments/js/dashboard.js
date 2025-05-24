// departments/js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements
    const departmentNameDisplay = document.getElementById('departmentNameDisplay');
    const logoutBtn = document.getElementById('logoutBtn');
    const statusFilter = document.getElementById('statusFilter');
    const incidentsList = document.getElementById('incidentsList');
    const noIncidentsMessage = document.getElementById('noIncidentsMessage');

    // Get the department name from sessionStorage
    const departmentName = sessionStorage.getItem('departmentName');

    // If no department name is found, redirect to login
    if (!departmentName) {
        window.location.href = 'login.html';
        return; // Stop script execution
    }

    // Display the department name
    departmentNameDisplay.textContent = `${departmentName} Department`;

    /**
     * Fetches incidents for the current department from the backend.
     * @param {string} status Optional status to filter incidents by.
     */
    async function fetchIncidents(status = '') {
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
        `; // Show loading placeholders
        noIncidentsMessage.classList.add('hidden'); // Hide no incidents message

        try {
            const url = `http://127.0.0.1:5000/api/departments/${departmentName}/incidents${status ? `?status=${status}` : ''}`;
            const response = await fetch(url);

            if (response.ok) {
                const incidents = await response.json();
                renderIncidents(incidents);
            } else {
                const errorData = await response.json();
                console.error('Error fetching incidents:', errorData.error || response.statusText);
                incidentsList.innerHTML = `<p class="text-red-600 text-center col-span-full">Failed to load incidents: ${errorData.error || 'Unknown error'}</p>`;
            }
        } catch (error) {
            console.error('Network error fetching incidents:', error);
            incidentsList.innerHTML = `<p class="text-red-600 text-center col-span-full">Network error. Please check your connection.</p>`;
        }
    }

    /**
     * Renders the list of incidents into the DOM.
     * @param {Array<Object>} incidents An array of incident objects.
     */
    function renderIncidents(incidents) {
        incidentsList.innerHTML = ''; // Clear existing incidents
        if (incidents.length === 0) {
            noIncidentsMessage.classList.remove('hidden');
            return;
        }

        noIncidentsMessage.classList.add('hidden'); // Hide no incidents message if there are incidents

        incidents.forEach(incident => {
            const incidentCard = document.createElement('div');
            incidentCard.classList.add('bg-white', 'p-6', 'rounded-lg', 'shadow-md', 'border-l-4');

            // Determine border color based on status
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
                    borderColorClass = 'border-gray-300';
            }
            incidentCard.classList.add(borderColorClass);

            // Format timestamp
            const date = new Date(incident.timestamp);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            incidentCard.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-xl font-semibold text-gray-800">${incident.description}</h3>
                    <span class="px-3 py-1 rounded-full text-xs font-semibold uppercase status-${incident.status.replace('_', '-')}">
                        ${incident.status.replace('_', ' ')}
                    </span>
                </div>
                <p class="text-gray-600 text-sm mb-2"><strong>Location:</strong> ${incident.location}</p>
                <p class="text-gray-600 text-sm mb-4"><strong>Reported:</strong> ${formattedDate}</p>
                ${incident.image_url ? `<p class="text-gray-600 text-sm mb-4"><strong>Image:</strong> <a href="#" class="text-blue-600 hover:underline">View Attached Image</a></p>` : ''}
                
                <div class="flex justify-end space-x-2 mt-4">
                    <select class="status-update-select p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" data-incident-id="${incident.id}">
                        <option value="">Update Status</option>
                        <option value="reported" ${incident.status === 'reported' ? 'selected' : ''}>Reported</option>
                        <option value="in_progress" ${incident.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                        <option value="resolved" ${incident.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </div>
            `;
            incidentsList.appendChild(incidentCard);
        });

        // Attach event listeners to newly rendered select elements
        document.querySelectorAll('.status-update-select').forEach(selectElement => {
            selectElement.addEventListener('change', (event) => {
                const incidentId = event.target.dataset.incidentId;
                const newStatus = event.target.value;
                if (newStatus) { // Only update if a valid status is selected
                    updateIncidentStatus(incidentId, newStatus);
                }
            });
        });
    }

    /**
     * Updates the status of an incident via the backend API.
     * @param {number} incidentId The ID of the incident to update.
     * @param {string} newStatus The new status to set.
     */
    async function updateIncidentStatus(incidentId, newStatus) {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/incidents/${incidentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                // Refresh the incidents list to show the updated status
                fetchIncidents(statusFilter.value);
                console.log(`Incident ${incidentId} status updated to ${newStatus}`);
            } else {
                const errorData = await response.json();
                alert(`Failed to update incident status: ${errorData.error || response.statusText}`);
                console.error('Error updating incident status:', errorData);
            }
        } catch (error) {
            console.error('Network error updating incident status:', error);
            alert("Network error. Could not update incident status.");
        }
    }

    // Event listener for status filter dropdown
    statusFilter.addEventListener('change', (event) => {
        fetchIncidents(event.target.value);
    });

    // Event listener for logout button
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('departmentName'); // Clear stored department name
        window.location.href = 'login.html'; // Redirect to login page
    });

    // Initial fetch of incidents when the page loads
    fetchIncidents();
});
