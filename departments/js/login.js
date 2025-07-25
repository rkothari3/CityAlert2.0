// departments/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements
    const loginForm = document.getElementById('loginForm');
    const loginKeyInput = document.getElementById('loginKey');
    const loginMessage = document.getElementById('loginMessage');

    /**
     * Displays a message to the user (e.g., error or success).
     * @param {string} message The message text.
     * @param {boolean} isError True if it's an error message, false for success.
     */
    function displayMessage(message, isError) {
        loginMessage.textContent = message;
        loginMessage.classList.remove('hidden');
        if (isError) {
            loginMessage.classList.remove('text-green-600');
            loginMessage.classList.add('text-red-600');
        } else {
            loginMessage.classList.remove('text-red-600');
            loginMessage.classList.add('text-green-600');
        }
    }

    // Add event listener for form submission
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission (page reload)

        const loginKey = loginKeyInput.value.trim();
        if (!loginKey) {
            displayMessage("Please enter your login key.", true);
            return;
        }

        loginMessage.classList.add('hidden'); // Hide previous messages
        displayMessage("Logging in...", false); // Show a loading message

        try {
            const response = await fetch(`${API_BASE_URL}/departments/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ login_key: loginKey }),
            });

            if (response.ok) {
                const departmentData = await response.json();
                displayMessage(`Login successful! Welcome, ${departmentData.name}.`, false);
                
                // Store department name in UPPERCASE to match the format in incident classifications
                sessionStorage.setItem('departmentName', departmentData.name.toUpperCase());
                sessionStorage.setItem('displayName', departmentData.name); // Store display name separately
                
                // Redirect to the department dashboard
                window.location.href = `dashboard.html?department=${encodeURIComponent(departmentData.name)}`;

            } else {
                const errorData = await response.json();
                displayMessage(errorData.message || "Login failed. Please check your key.", true);
            }
        } catch (error) {
            console.error('Network error during login:', error);
            displayMessage("A network error occurred. Please try again.", true);
        }
    });
});
