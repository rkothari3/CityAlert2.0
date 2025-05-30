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
    const placePickerContainer = document.getElementById('placePickerContainer');
    const placePicker = document.getElementById('placePicker');

    let chatHistory = []; // Stores the conversation history for sending to the LLM
    let uploadedImageBase64 = null; // Stores the base64 string of the uploaded image
    let isLocationMode = false; // Flag to track if we're in location input mode
    let hasAnalyzedImage = false; // Flag to track if image has been analyzed

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
        addMessage("Submitting your report...", 'bot');
        showTypingIndicator();

        try {
            const response = await fetch('http://127.0.0.1:5000/api/incidents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(incidentData)
            });

            const responseText = await response.text();
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {
                hideTypingIndicator();
                console.error('Failed to parse response as JSON:', responseText);
                addMessage(`Server error: Unable to process response. Please try again later.`, 'bot');
                return;
            }

            if (response.ok) {
                hideTypingIndicator();
                addMessage("Thank you! Your report has been successfully submitted to the CityAlert system. Incident ID: " + result.id, 'bot');
                // Reset chat for a new report after successful submission
                chatHistory = [];
                currentIncidentDetails = { description: '', location: '', department_classification: '', image_url: null };
                awaitingConfirmation = false;
            } else if (response.status === 409) {
                // Handle duplicate incident detection
                hideTypingIndicator();
                console.log('Duplicate incident detected:', result);
                
                const duplicateMessage = `${result.message || 'A similar incident has already been reported.'} You can view current incidents and their status on the Alerts page.`;
                addMessage(duplicateMessage, 'bot');
                
                // Add a helpful button to view alerts
                addDuplicateIncidentActions(result.existing_incident);
                
                // Reset chat state
                chatHistory = [];
                currentIncidentDetails = { description: '', location: '', department_classification: '', image_url: null };
                awaitingConfirmation = false;
            } else {
                hideTypingIndicator();
                console.error('Error submitting incident:', result);
                addMessage(`Failed to submit report: ${result.error || result.warning || 'Unknown error'}. Please try again.`, 'bot');
            }
        } catch (error) {
            hideTypingIndicator();
            console.error('Network error submitting incident:', error);
            addMessage("A network error occurred while submitting your report. Please try again later.", 'bot');
        }
    }

    /**
     * Adds interactive elements for duplicate incident scenarios
     * @param {object} existingIncident - The existing incident data
     */
    function addDuplicateIncidentActions(existingIncident) {
        const actionsElement = document.createElement('div');
        actionsElement.classList.add('message-bubble', 'message-bot', 'duplicate-actions');
        
        const formattedDate = new Date(existingIncident.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        actionsElement.innerHTML = `
            <div class="duplicate-incident-info">
                <p><strong>Existing Incident:</strong></p>
                <p><em>"${existingIncident.description}"</em></p>
                <p><strong>Location:</strong> ${existingIncident.location}</p>
                <p><strong>Reported:</strong> ${formattedDate}</p>
                <p><strong>Status:</strong> <span class="status-${existingIncident.status}">${existingIncident.status.replace('_', ' ')}</span></p>
            </div>
            <div class="duplicate-actions-buttons" style="margin-top: 10px;">
                <button class="view-alerts-btn" style="background-color: #3b82f6; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; margin-right: 8px;">
                    View Alerts Page
                </button>
                <button class="report-anyway-btn" style="background-color: #6b7280; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer;">
                    Report Different Incident
                </button>
            </div>
        `;

        chatMessages.appendChild(actionsElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Add event listeners to the buttons
        actionsElement.querySelector('.view-alerts-btn').addEventListener('click', () => {
            window.open('alerts.html', '_blank');
        });
        
        actionsElement.querySelector('.report-anyway-btn').addEventListener('click', () => {
            addMessage("I'd like to report a different incident.", 'user');
            addMessage("Of course! Please tell me about the new incident you'd like to report.", 'bot');
            chatHistory = [];
            resetImageUpload();
        });
    }

    /**
     * Switches between normal text input and location autocomplete input
     * @param {boolean} enableLocationMode - Whether to enable location autocomplete
     */
    function toggleLocationMode(enableLocationMode) {
        isLocationMode = enableLocationMode;
        
        if (enableLocationMode) {
            chatInput.style.display = 'none';
            placePickerContainer.classList.add('active');
            placePicker.setAttribute('placeholder', 'Enter the location of the incident');
            placePicker.focus();
        } else {
            chatInput.style.display = 'block';
            placePickerContainer.classList.remove('active');
            placePicker.value = '';
            chatInput.focus();
        }
    }

    /**
     * Detects if the bot's response is asking for location information
     * @param {string} botResponse - The bot's response text
     * @returns {boolean} - True if the bot is asking for location
     */
    function isAskingForLocation(botResponse) {
        const locationKeywords = [
            'location', 'address', 'where', 'street', 'place',
            'happening', 'occurred', 'incident location', 'cross-street',
            'landmark', 'neighborhood'
        ];
        
        const lowerResponse = botResponse.toLowerCase();
        return locationKeywords.some(keyword => lowerResponse.includes(keyword)) &&
               (lowerResponse.includes('?') || lowerResponse.includes('provide'));
    }

    /**
     * Formats a complete address from place details
     * @param {Object} place - The place object from the place picker
     * @returns {string} - The full formatted address
     */
    function formatFullAddress(place) {
        if (!place) return '';

        // If place has a formattedAddress property, use that
        if (place.formattedAddress) {
            return place.formattedAddress;
        }

        // Otherwise try to construct from display name and address components
        let fullAddress = place.displayName || '';
        
        // If we have address components, add city, state, country
        if (place.addressComponents) {
            const cityComponent = place.addressComponents.find(component => 
                component.types.includes('locality') || component.types.includes('sublocality'));
            
            const stateComponent = place.addressComponents.find(component => 
                component.types.includes('administrative_area_level_1'));
            
            const countryComponent = place.addressComponents.find(component => 
                component.types.includes('country'));
            
            // Construct the additional address parts
            let additionalParts = [];
            
            if (cityComponent) additionalParts.push(cityComponent.longText);
            if (stateComponent) additionalParts.push(stateComponent.shortText);
            if (countryComponent) additionalParts.push(countryComponent.longText);
            
            // Add the additional parts to the display name if they're not already included
            if (additionalParts.length > 0) {
                const additionalText = additionalParts.join(', ');
                // Only add if not already part of the display name
                if (!fullAddress.includes(additionalText)) {
                    fullAddress += ', ' + additionalText;
                }
            }
        }
        
        return fullAddress;
    }

    // Event listener for place picker selection
    placePicker.addEventListener('gmpx-placechange', (event) => {
        const place = event.target.value;
        if (place) {
            // Format the full address with city, state, country
            const fullAddress = formatFullAddress(place);
            // Send the complete formatted address
            sendLocationMessage(fullAddress);
        }
    });

    /**
     * Sends the selected location as a message
     * @param {string} locationText - The selected location text
     */
    async function sendLocationMessage(locationText) {
        addMessage(locationText, 'user');
        
        const userParts = [{ text: locationText }];
        chatHistory.push({ role: "user", parts: userParts });
        
        // Switch back to normal input mode
        toggleLocationMode(false);
        
        showTypingIndicator();
        
        try {
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
                addMessage(botResponse, 'bot');
                chatHistory.push({ role: "model", parts: [{ text: botResponse }] });

                // Use the same improved pattern matching logic
                const summaryRegex = /(?:Okay|Alright|So),?\s+(?:so\s+)?I\s+have\s+that\s+there\s+is\s+(?:an?\s+)?(.*?)\s+at\s+(.*?)\.\s+This\s+will\s+be\s+classified\s+under\s+([A-Z_,\s]+)\.\s+Is\s+this\s+information\s+correct\s+and\s+complete\?/i;
                const match = botResponse.match(summaryRegex);

                console.log("🔍 Location response - checking for confirmation:", botResponse);
                console.log("🔍 Location response - pattern match:", match);

                if (match && match.length >= 4) {
                    console.log("✅ Confirmation pattern detected after location!");
                    currentIncidentDetails.description = match[1].trim();
                    currentIncidentDetails.location = match[2].trim();
                    const deptClassification = match[3].trim().split(',')[0].trim().toUpperCase();
                    currentIncidentDetails.department_classification = deptClassification;
                    currentIncidentDetails.image_url = uploadedImageBase64;
                    awaitingConfirmation = true;
                    console.log("📋 Incident details parsed from location response:", currentIncidentDetails);
                } else {
                    awaitingConfirmation = false;
                }

            } else {
                const errorData = await response.json();
                hideTypingIndicator();
                console.error('Error from chatbot API:', errorData);
                addMessage("I'm sorry, I encountered an error processing your request.", 'bot');
                awaitingConfirmation = false;
            }
        } catch (error) {
            hideTypingIndicator();
            console.error('Error communicating with chatbot:', error);
            addMessage("I'm sorry, I'm having trouble connecting right now. Please try again later.", 'bot');
            awaitingConfirmation = false;
        }
    }

    // Event listener for the send button
    sendChatBtn.addEventListener('click', async () => {
        // Handle location mode separately
        if (isLocationMode) {
            const selectedPlace = placePicker.value;
            if (selectedPlace && selectedPlace.displayName) {
                await sendLocationMessage(selectedPlace.displayName);
            }
            return;
        }

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

                    // Check if bot is asking for location and switch to location mode
                    if (isAskingForLocation(botResponse)) {
                        toggleLocationMode(true);
                    }

                    // IMPROVED: More flexible regex pattern to catch confirmation messages
                    // This pattern is more forgiving while still being specific enough
                    const summaryRegex = /(?:Okay|Alright|So),?\s+(?:so\s+)?I\s+have\s+that\s+there\s+is\s+(?:an?\s+)?(.*?)\s+at\s+(.*?)\.\s+This\s+will\s+be\s+classified\s+under\s+([A-Z_,\s]+)\.\s+Is\s+this\s+information\s+correct\s+and\s+complete\?/i;
                    const match = botResponse.match(summaryRegex);

                    console.log("🔍 Checking for confirmation pattern in:", botResponse);
                    console.log("🔍 Pattern match result:", match);

                    if (match && match.length >= 4) {
                        console.log("✅ Confirmation pattern detected!");
                        currentIncidentDetails.description = match[1].trim();
                        currentIncidentDetails.location = match[2].trim();
                        // Clean up department classification - take first department if multiple
                        const deptClassification = match[3].trim().split(',')[0].trim().toUpperCase();
                        currentIncidentDetails.department_classification = deptClassification;
                        currentIncidentDetails.image_url = uploadedImageBase64;
                        awaitingConfirmation = true;
                        console.log("📋 Incident details parsed:", currentIncidentDetails);
                    } else {
                        // Additional fallback patterns for edge cases
                        const altPattern1 = /I\s+(?:understand|have)\s+(?:that\s+)?(?:you\s+have\s+)?(?:reported\s+)?(?:an?\s+)?(.*?)\s+(?:at|in|on|near)\s+(.*?)\.\s+.*?(?:classified|category|department).*?([A-Z_]+)/i;
                        const altMatch = botResponse.match(altPattern1);
                        
                        if (altMatch && altMatch.length >= 4) {
                            console.log("✅ Alternative confirmation pattern detected!");
                            currentIncidentDetails.description = altMatch[1].trim();
                            currentIncidentDetails.location = altMatch[2].trim();
                            currentIncidentDetails.department_classification = altMatch[3].trim().toUpperCase();
                            currentIncidentDetails.image_url = uploadedImageBase64;
                            awaitingConfirmation = true;
                            console.log("📋 Incident details parsed (alt pattern):", currentIncidentDetails);
                        } else {
                            console.log("❌ No confirmation pattern found");
                            awaitingConfirmation = false;
                        }
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
        if (event.key === 'Enter' && !isLocationMode) {
            sendChatBtn.click();
        }
    });

    // Handle Enter key for place picker
    placePicker.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && isLocationMode) {
            sendChatBtn.click();
        }
    });

    // Event listener for image upload button
    uploadImageBtn.addEventListener('click', () => {
        imageUpload.click(); // Trigger the hidden file input click
    });

    /**
     * Analyzes an uploaded image immediately using Gemini
     * @param {string} imageBase64 - The base64 string of the uploaded image
     */
    async function analyzeImageImmediately(imageBase64) {
        showTypingIndicator();
        
        // Create a special message for immediate image analysis
        const analysisMessage = {
            role: "user",
            parts: [
                { text: "Please analyze this image and tell me what type of incident or safety issue you can identify. Describe what you see and suggest what should be reported." },
                {
                    inlineData: {
                        mimeType: "image/png",
                        data: imageBase64.split(',')[1]
                    }
                }
            ]
        };

        // Add to chat history
        chatHistory.push(analysisMessage);

        try {
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
                addMessage(botResponse, 'bot');
                chatHistory.push({ role: "model", parts: [{ text: botResponse }] });
                
                hasAnalyzedImage = true;

                // Check if bot is asking for location after analysis
                if (isAskingForLocation(botResponse)) {
                    toggleLocationMode(true);
                }

                // Check for confirmation pattern
                const summaryRegex = /Okay, so I have that there is a (.*) at (.*)\. This will be classified under (.*)\. Is this information correct and complete\?/i;
                const match = botResponse.match(summaryRegex);

                if (match && match.length === 4) {
                    currentIncidentDetails.description = match[1].trim();
                    currentIncidentDetails.location = match[2].trim();
                    currentIncidentDetails.department_classification = match[3].trim().toUpperCase();
                    currentIncidentDetails.image_url = uploadedImageBase64;
                    awaitingConfirmation = true;
                    console.log("Awaiting confirmation for incident:", currentIncidentDetails);
                }

            } else {
                const errorData = await response.json();
                hideTypingIndicator();
                console.error('Error from image analysis:', errorData);
                addMessage("I'm sorry, I encountered an error analyzing the image. You can describe the incident instead.", 'bot');
            }
        } catch (error) {
            hideTypingIndicator();
            console.error('Error during image analysis:', error);
            addMessage("I'm sorry, I'm having trouble analyzing the image right now. You can describe the incident instead.", 'bot');
        }
    }

    // Event listener for when a file is selected
    imageUpload.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                uploadedImageBase64 = e.target.result; // Store base64 string of the image
                uploadedImagePreview.src = uploadedImageBase64; // Display image preview
                imagePreviewContainer.classList.remove('hidden'); // Show preview container
                
                // Display the image in chat
                addMessage("I've uploaded an image for analysis.", 'user', uploadedImageBase64);
                
                // If this is the first interaction or no meaningful conversation has started,
                // immediately analyze the image
                if (chatHistory.length <= 2 || !hasAnalyzedImage) {
                    await analyzeImageImmediately(uploadedImageBase64);
                } else {
                    // If conversation is ongoing, just show that image was uploaded
                    addMessage("I can see your image. Please tell me what you'd like me to analyze or report about it.", 'bot');
                }
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
    addMessage("Hello! I'm CityAlert, your AI assistant for reporting incidents. You can either describe what happened or upload an image for me to analyze.", 'bot');
    chatHistory.push({ role: "model", parts: [{ text: "Hello! I'm CityAlert, your AI assistant for reporting incidents. You can either describe what happened or upload an image for me to analyze." }] });

    console.log("chat.js loaded.");
});

