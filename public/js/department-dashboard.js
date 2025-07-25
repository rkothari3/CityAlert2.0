document.addEventListener('DOMContentLoaded', async () => {
    // Get references to DOM elements
    const incidentsContainer = document.getElementById('department-incidents-container');
    const departmentNameDisplay = document.getElementById('department-name');
    const logoutButton = document.getElementById('logout-button');
    const noIncidentsMessage = document.getElementById('no-incidents-message');
    const loadingMessage = document.getElementById('loading-incidents-message');
    
    // API_BASE_URL is now defined in config.js
    
    // Check if user is logged in as a department
    function checkDepartmentLogin() {
        const departmentData = JSON.parse(localStorage.getItem('departmentData'));
        if (!departmentData || !departmentData.name) {
            // If not logged in, redirect to login page
            window.location.href = 'department-login.html';
            return null;
        }
        return departmentData;
    }
    
    // Logout function
    function logout() {
        localStorage.removeItem('departmentData');
        window.location.href = 'department-login.html';
    }
    
    // Fetch incidents for the logged-in department
    async function fetchDepartmentIncidents() {
        try {
            const departmentData = checkDepartmentLogin();
            if (!departmentData) return [];
            
            loadingMessage.classList.remove('hidden');
            noIncidentsMessage.classList.add('hidden');
            
            const response = await fetch(`${API_BASE_URL}/departments/${departmentData.name}/incidents`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const incidents = await response.json();
            return incidents;
        } catch (error) {
            console.error('Error fetching department incidents:', error);
            incidentsContainer.innerHTML = `
                <div class="text-red-600 text-center p-4">
                    Failed to load incidents. Please try again later.<br>
                    Error: ${error.message}
                </div>
            `;
            return [];
        } finally {
            loadingMessage.classList.add('hidden');
        }
    }
    
    // Render incidents to the dashboard
    function renderDepartmentIncidents(incidents) {
        incidentsContainer.innerHTML = '';
        
        if (incidents.length === 0) {
            noIncidentsMessage.classList.remove('hidden');
            return;
        } else {
            noIncidentsMessage.classList.add('hidden');
        }
        
        incidents.forEach(incident => {
            // Determine status color
            let statusColor = 'bg-gray-100 text-gray-800';
            if (incident.status === 'reported') {
                statusColor = 'bg-red-100 text-red-800';
            } else if (incident.status === 'in_progress') {
                statusColor = 'bg-yellow-100 text-yellow-800';
            } else if (incident.status === 'resolved') {
                statusColor = 'bg-green-100 text-green-800';
            }
            
            const incidentDate = new Date(incident.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Fix image URL handling
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
            
            const incidentCard = `
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <div class="p-6">
                        <div class="flex justify-between items-start mb-4">
                            <h2 class="text-xl font-semibold text-gray-800">${incident.description}</h2>
                            <span class="px-3 py-1 rounded-full text-sm font-medium ${statusColor}">
                                ${incident.status.replace(/_/g, ' ')}
                            </span>
                        </div>
                        <p class="text-gray-600 mb-2">
                            <strong>Location:</strong> ${incident.location}
                        </p>
                        ${incident.latitude && incident.longitude ? 
                            `<p class="text-gray-600 mb-2">
                                <strong>Coordinates:</strong> ${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}
                            </p>` : ''}
                        <p class="text-gray-600 mb-4">
                            <strong>Reported:</strong> ${incidentDate}
                        </p>
                        ${imageHtml}
                        <div class="mt-4 flex justify-end space-x-2">
                            <button 
                                onclick="updateIncidentStatus(${incident.id}, 'in_progress')"
                                class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 
                                       ${incident.status === 'in_progress' ? 'opacity-50 cursor-not-allowed' : ''}">
                                Mark In Progress
                            </button>
                            <button 
                                onclick="updateIncidentStatus(${incident.id}, 'resolved')"
                                class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50
                                       ${incident.status === 'resolved' ? 'opacity-50 cursor-not-allowed' : ''}">
                                Mark Resolved
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            incidentsContainer.insertAdjacentHTML('beforeend', incidentCard);
        });
    }
    
    // Update incident status
    window.updateIncidentStatus = async function(incidentId, newStatus) {
        try {
            const departmentData = checkDepartmentLogin();
            if (!departmentData) return;
            
            const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus,
                    department_name: departmentData.name,
                    department_key: departmentData.login_key
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Refresh incidents after updating
            const updatedIncidents = await fetchDepartmentIncidents();
            renderDepartmentIncidents(updatedIncidents);
            
        } catch (error) {
            console.error('Error updating incident status:', error);
            alert(`Failed to update incident status: ${error.message}`);
        }
    };
    
    // Initialize the dashboard
    async function initDashboard() {
        const departmentData = checkDepartmentLogin();
        if (!departmentData) return;
        
        // Set department name in the UI
        if (departmentNameDisplay) {
            departmentNameDisplay.textContent = departmentData.name;
        }
        
        // Set up logout button
        if (logoutButton) {
            logoutButton.addEventListener('click', logout);
        }
        
        // Load and display incidents
        const incidents = await fetchDepartmentIncidents();
        renderDepartmentIncidents(incidents);
        
        // Set up auto-refresh every minute
        setInterval(async () => {
            const refreshedIncidents = await fetchDepartmentIncidents();
            renderDepartmentIncidents(refreshedIncidents);
        }, 60000);
    }
    
    // Initialize the dashboard when the page loads
    initDashboard();
});

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
