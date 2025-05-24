// public/js/chat.js

document.addEventListener('DOMContentLoaded', () => {
    // Get references to chat UI elements
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const imageUpload = document.getElementById('imageUpload');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const uploadedImagePreview = document.getElementById('uploadedImagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');

    let chatHistory = []; // Stores the conversation history for sending to the LLM
    let uploadedImageBase64 = null; // Stores the base64 string of the uploaded image

    // State variables for incident submission flow
    // This object will hold the parsed incident details before submission
    let currentIncidentDetails = {
        description: '',
        location: '',
        department_classification: '',
        image_url: null
    };
    let awaitingConfirmation = false; // Flag to indicate if the bot is awaiting user confirmation for submission

    /**
     * Adds a message bubble to the chat interface.
     * @param {string} message The text content of the message.
     * @param {string} sender 'user' or 'bot' to apply appropriate styling.
     * @param {string} [imageUrl=null] Optional URL for an image to display with the message.
     */
    function addMessage(message, sender, imageUrl = null) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message-bubble', sender === 'user' ? 'message-user' : 'message-bot');
        messageElement.textContent = message;

        if (imageUrl) {
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            imgElement.classList.add('image-preview'); // Use the same preview class for display
            messageElement.appendChild(imgElement);
        }

        chatMessages.appendChild(messageElement);
        // Scroll to the bottom of the chat messages to show the latest message
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to simulate bot typing indicator
    let typingIndicatorElement = null;
    function showTypingIndicator() {
        if (!typingIndicatorElement) {
            typingIndicatorElement = document.createElement('div');
            typingIndicatorElement.classList.add('message-bubble', 'message-bot', 'animate-pulse');
            typingIndicatorElement.textContent = 'CityAlert Bot is typing...';
            chatMessages.appendChild(typingIndicatorElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    function hideTypingIndicator() {
        if (typingIndicatorElement) {
            typingIndicatorElement.remove();
            typingIndicatorElement = null;
        }
    }

    /**
     * Submits the incident details to the backend API.
     * This function is called when the user confirms the incident report.
     * @param {object} incidentData The incident details to submit.
     */
    async function submitIncident(incidentData) {
        addMessage("Submitting your report...", 'bot'); // Inform user that submission is in progress
        showTypingIndicator(); // Show typing indicator during submission

        try {
            const response = await fetch('http://127.0.0.1:5000/api/incidents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(incidentData)
            });

            if (response.ok) {
                const result = await response.json();
                hideTypingIndicator();
                addMessage("Thank you! Your report has been successfully submitted to the CityAlert system. Incident ID: " + result.id, 'bot');
                // Reset chat for a new report after successful submission
                chatHistory = [];
                currentIncidentDetails = { description: '', location: '', department_classification: '', image_url: null };
                awaitingConfirmation = false;
            } else {
                // Handle errors from the backend API (e.g., validation errors, duplicate incidents)
                const errorData = await response.json();
                hideTypingIndicator();
                console.error('Error submitting incident:', errorData);
                addMessage(`Failed to submit report: ${errorData.error || errorData.warning || 'Unknown error'}. Please try again.`, 'bot');
            }
        } catch (error) {
            // Handle network errors (e.g., backend not reachable)
            hideTypingIndicator();
            console.error('Network error submitting incident:', error);
            addMessage("A network error occurred while submitting your report. Please try again later.", 'bot');
        }
    }

    // Event listener for the send button
    sendChatBtn.addEventListener('click', async () => {
        const userMessage = chatInput.value.trim();

        // If awaiting confirmation, check user's response first
        if (awaitingConfirmation) {
            const lowerCaseMessage = userMessage.toLowerCase();
            // Check for positive confirmation
            if (lowerCaseMessage === 'yes' || lowerCaseMessage === 'yep' || lowerCaseMessage === 'correct' || lowerCaseMessage === 'submit') {
                addMessage(userMessage, 'user'); // Display user's confirmation
                chatInput.value = ''; // Clear input field
                resetImageUpload(); // Clear image preview and data
                await submitIncident(currentIncidentDetails); // Submit the stored incident details
                return; // Stop further processing, as incident is being submitted
            }
            // Check for negative confirmation (user wants to correct something)
            else if (lowerCaseMessage === 'no' || lowerCaseMessage === 'nope' || lowerCaseMessage === 'incorrect') {
                addMessage(userMessage, 'user'); // Display user's negative response
                chatInput.value = ''; // Clear input field
                resetImageUpload(); // Clear image preview and data
                addMessage("Okay, what needs to be corrected or added?", 'bot');
                chatHistory.push({ role: "model", parts: [{ text: "Okay, what needs to be corrected or added?" }] });
                awaitingConfirmation = false; // Reset confirmation state to allow further conversation
                return; // Stop further processing
            }
            // If not a clear yes/no, continue to send to Gemini for clarification
        }

        // Proceed with normal chat if not awaiting confirmation or if response was ambiguous
        if (userMessage || uploadedImageBase64) {
            addMessage(userMessage, 'user', uploadedImageBase64); // Display user's message in chat

            const userParts = [];
            if (userMessage) {
                userParts.push({ text: userMessage });
            }

            // If an image is uploaded, include its base64 data in the message parts for Gemini
            if (uploadedImageBase64) {
                userParts.push({
                    inlineData: {
                        mimeType: "image/png", // Assuming PNG, adjust if other types are supported
                        data: uploadedImageBase64.split(',')[1] // Extract base64 data part
                    }
                });
            }

            chatHistory.push({ role: "user", parts: userParts }); // Add user message to chat history

            chatInput.value = ''; // Clear input field
            resetImageUpload(); // Clear image preview and data

            showTypingIndicator(); // Show typing indicator while waiting for bot response

            try {
                // Send chat history to the backend Gemini proxy
                const response = await fetch('http://127.0.0.1:5000/api/chat/gemini', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ chatHistory: chatHistory })
                });

                if (response.ok) {
                    const data = await response.json();
                    hideTypingIndicator();

                    const botResponse = data.response;
                    addMessage(botResponse, 'bot'); // Display bot's response
                    chatHistory.push({ role: "model", parts: [{ text: botResponse }] }); // Add bot message to chat history

                    // Regex to parse the bot's summary and classification
                    // This regex MUST match the exact format of the final confirmation message from Gemini.
                    // Example: "Okay, so I have that there is a [description] at [location]. This will be classified under [DEPARTMENT]. Is this information correct and complete?"
                    const summaryRegex = /Okay, so I have that there is a (.*) at (.*)\. This will be classified under (.*)\. Is this information correct and complete\?/i;
                    const match = botResponse.match(summaryRegex);

                    // If the bot's response matches the summary pattern, extract details
                    if (match && match.length === 4) {
                        currentIncidentDetails.description = match[1].trim();
                        currentIncidentDetails.location = match[2].trim();
                        currentIncidentDetails.department_classification = match[3].trim().toUpperCase(); // Ensure uppercase for consistent matching with backend
                        currentIncidentDetails.image_url = uploadedImageBase64; // Assign the last uploaded image
                        awaitingConfirmation = true; // Set flag to await user confirmation
                        console.log("Awaiting confirmation for incident:", currentIncidentDetails);
                    } else {
                        awaitingConfirmation = false; // Not in a confirmation state if summary pattern not matched
                    }

                } else {
                    // Handle errors from the Gemini proxy backend
                    const errorData = await response.json();
                    hideTypingIndicator();
                    console.error('Error from chatbot API:', errorData);
                    addMessage("I'm sorry, I encountered an error processing your request.", 'bot');
                    awaitingConfirmation = false;
                }
            } catch (error) {
                // Handle network errors when communicating with the chatbot proxy
                hideTypingIndicator();
                console.error('Error communicating with chatbot:', error);
                addMessage("I'm sorry, I'm having trouble connecting right now. Please try again later.", 'bot');
                awaitingConfirmation = false;
            }
        }
    });

    // Allow sending message with Enter key
    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendChatBtn.click();
        }
    });

    // Event listener for image upload button
    uploadImageBtn.addEventListener('click', () => {
        imageUpload.click(); // Trigger the hidden file input click
    });

    // Event listener for when a file is selected
    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImageBase64 = e.target.result; // Store base64 string of the image
                uploadedImagePreview.src = uploadedImageBase64; // Display image preview
                imagePreviewContainer.classList.remove('hidden'); // Show preview container
            };
            reader.readAsDataURL(file); // Read file as base64 data URL
        }
    });

    // Event listener to remove uploaded image
    removeImageBtn.addEventListener('click', () => {
        resetImageUpload();
    });

    // Function to reset image upload state (clear preview and data)
    function resetImageUpload() {
        uploadedImageBase64 = null;
        imageUpload.value = ''; // Clear the file input to allow re-uploading the same file
        uploadedImagePreview.src = '#'; // Reset image source
        imagePreviewContainer.classList.add('hidden'); // Hide preview container
    }

    // Initial bot greeting when the modal opens (triggered by main.js or on page load)
    addMessage("Hello! I'm CityAlert, your AI assistant for reporting incidents. Please tell me what happened.", 'bot');
    chatHistory.push({ role: "model", parts: [{ text: "Hello! I'm CityAlert, your AI assistant for reporting incidents. Please tell me what happened." }] });

    console.log("chat.js loaded.");
});

