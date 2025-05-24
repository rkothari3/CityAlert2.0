// public/js/chat.js

// Get references to DOM elements
const reportIncidentBtn = document.getElementById('reportIncidentBtn');
const chatModal = document.getElementById('chatModal');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
// New image-related DOM elements
const imageUpload = document.getElementById('imageUpload');
const attachImageBtn = document.getElementById('attachImageBtn');
const imageUploadPreview = document.getElementById('imageUploadPreview');
const imageName = document.getElementById('imageName');
const removeImageBtn = document.getElementById('removeImageBtn');

// State variables for the chat flow
let chatHistory = []; // Stores the conversation history for the LLM
let currentIncident = {}; // Stores details of the incident being reported
let currentStep = 0; // Tracks the current step in the reporting flow (0: initial, 1: description, 2: location, 3: image, 4: summary, 5: confirmation)
let isAwaitingConfirmation = false; // Flag to indicate if we're waiting for final submission confirmation

// --- Utility Functions ---

/**
 * Appends a message to the chat display.
 * @param {string} message The text message to display.
 * @param {string} sender 'user' or 'bot' to style the message.
 */
function appendMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('flex', 'mb-4');

    if (sender === 'user') {
        messageElement.classList.add('justify-end');
        messageElement.innerHTML = `
            <div class="bg-blue-500 text-white p-3 rounded-lg max-w-[80%] shadow">
                ${message}
            </div>
        `;
    } else { // sender === 'bot'
        messageElement.classList.add('justify-start');
        messageElement.innerHTML = `
            <div class="bg-gray-200 text-gray-800 p-3 rounded-lg max-w-[80%] shadow">
                ${message}
            </div>
        `;
    }
    chatMessages.appendChild(messageElement);
    // Scroll to the bottom of the chat messages
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Displays a loading indicator in the chat.
 */
function showLoadingIndicator() {
    const loadingElement = document.createElement('div');
    loadingElement.id = 'loadingIndicator';
    loadingElement.classList.add('flex', 'justify-start', 'mb-4');
    loadingElement.innerHTML = `
        <div class="bg-gray-200 text-gray-800 p-3 rounded-lg max-w-[80%] shadow flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.000 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Thinking...
        </div>
    `;
    chatMessages.appendChild(loadingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Removes the loading indicator from the chat.
 */
function hideLoadingIndicator() {
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) {
        loadingElement.remove();
    }
}

/**
 * Sends the collected incident data to the Flask backend.
 * @param {object} incidentData The incident data to submit.
 */
async function submitIncidentToBackend(incidentData) {
    console.log("Attempting to submit incident to backend:", incidentData); // DEBUG: Log data before submission
    try {
        appendMessage("Submitting your report...", "bot");
        showLoadingIndicator();

        const response = await fetch('http://127.0.0.1:5000/api/incidents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(incidentData),
        });

        hideLoadingIndicator();

        if (response.ok) {
            const result = await response.json();
            appendMessage(`✨ Your report (ID: ${result.id}) has been successfully submitted to the relevant city department! Thank you for helping keep our city safe.`, "bot");
            // Set a timeout to hide the modal after the success message
            setTimeout(() => {
                resetChat();
            }, 5000); // 5 seconds delay to let the user read the confirmation
        } else {
            const errorData = await response.json();
            appendMessage(`Oops! There was an error submitting your report: ${errorData.error || response.statusText}. Please try again.`, "bot");
            console.error('Backend submission error:', errorData); // DEBUG: Log backend error
        }
    } catch (error) {
        hideLoadingIndicator();
        console.error('Error submitting incident (network/fetch issue):', error); // DEBUG: Log network error
        appendMessage("A network error occurred while submitting your report. Please check your connection and try again.", "bot");
    }
}

/**
 * Resets the chat state and clears messages for a new conversation.
 */
function resetChat() {
    chatHistory = [];
    currentIncident = {};
    currentStep = 0;
    isAwaitingConfirmation = false;
    chatMessages.innerHTML = `
        <div class="flex justify-start mb-4">
            <div class="bg-gray-200 text-gray-800 p-3 rounded-lg max-w-[80%] shadow">
                Hi there! I'm CityAlert, your AI assistant. I'm here to help you report incidents. Please tell me what happened.
            </div>
        </div>
    `;
    chatInput.value = '';
    
    // Reset image-related UI elements
    imageUpload.value = '';
    imageUploadPreview.classList.add('hidden');
    attachImageBtn.classList.add('hidden');
    
    // Reset send button to original state
    sendMessageBtn.textContent = "Send";
    sendMessageBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
    sendMessageBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
    
    // Hide the modal after reset
    chatModal.classList.add('hidden');
}

// --- Gemini API Integration ---

// System instructions for the Gemini chatbot
const SYSTEM_INSTRUCTIONS = `
You are CityAlert, an AI assistant for a community safety platform. Your ONLY purpose is to help users report incidents (such as fire, accident, crime, hazard, or public safety issues), classify them by department, and guide users through the CityAlert reporting workflow.

DEPARTMENT CLASSIFICATION GUIDE:
- POLICE: Criminal activities, suspicious behavior, traffic violations, missing persons, theft, vandalism
- FIRE: Fires, smoke, burning smells, fire hazards, fire safety concerns
- MEDICAL: Medical emergencies, injuries, health hazards, public health concerns
- PUBLIC_WORKS: Potholes, street lights, road hazards, drainage issues, fallen trees
- ENVIRONMENT: Pollution, illegal dumping, hazardous materials, water quality issues
- ANIMAL_CONTROL: Stray animals, animal cruelty, wildlife concerns, dangerous animals
- BUILDING_SAFETY: Unsafe structures, building code violations, construction issues
- TRANSPORTATION: Traffic signal issues, road signs, public transit problems, parking violations
- PARKS_RECREATION: Park maintenance, playground equipment, public space issues
- UTILITIES: Power outages, water leaks, gas leaks, utility emergencies

For each incident, you must classify it into one or more of these departments. If multiple departments are needed, separate them with commas (e.g., "POLICE,MEDICAL"). If uncertain, default to "GENERAL".

After collecting all incident details, you MUST include a department classification in your response in this format:

DEPARTMENT_CLASSIFICATION: [department1,department2,...]

For example:
DEPARTMENT_CLASSIFICATION: [FIRE,MEDICAL]

STRICT RULES:
- You MUST NOT answer any questions or requests unrelated to incident reporting, safety alerts, or CityAlert platform features.
- If a user asks anything off-topic (e.g., general knowledge, jokes, personal questions, tech support, etc.), politely respond: "I'm here only to help you report incidents or access CityAlert safety resources."
- Do NOT provide opinions, advice, or information outside the CityAlert context.
- NEVER speculate, hallucinate, or invent information. If unsure, ask the user to clarify the incident details.
- NEVER roleplay, pretend, or break character.

REPORTING FLOW:
1.  **Initiation & Description:** When a user starts, ask for a brief description of the incident. Acknowledge their situation supportively (e.g., "I'm here to help. Please tell me what happened."). 
        -   If the user's initial description is very brief (e.g., "fire," "help," "accident") or seems too generic, you MUST ask for more specific details before moving to the next step. For example: "I understand. To help me understand the situation better, could you please provide a bit more detail about what happened or what you see?" Only once a slightly more detailed description is given, should you proceed.
2.  **Location:** Next, ask for the location of the incident.
        -   If the location provided is too general (e.g., "downtown," "near the park"), gently ask for more specifics like a street address, cross-street, or well-known landmark. For example: "Got it. To help responders find the location quickly, could you provide a street name or nearby landmark if possible?"
3.  **Image Upload (Optional):** Then, optionally, ask if they can safely upload an image. Explain its utility: "If it's safe for you to do so, an image can be very helpful for the response team. Would you like to upload one?"
4.  **Incident-Specific Guidance & Safety Reminders:**
        * **General Principle:** For any situation that appears to be an immediate, life-threatening emergency, your first guidance should be to ensure professional emergency services (like 911, police, fire, or ambulance) have been contacted or are being contacted. Clarify that you are for reporting to city departments for follow-up and documentation, and not a replacement for direct emergency calls.
        * **FIRE:** If the user describes a fire, respond with: "This sounds like a fire. Please ensure everyone is safe and that emergency services (911 or your local equivalent) have been called immediately. I can then take down details for the fire department report."
        * **MEDICAL EMERGENCY** (e.g., if the user mentions serious injury, someone collapsed, severe bleeding, difficulty breathing, chest pains, stroke symptoms, or a seizure): Respond with: "This sounds like a serious medical situation. The most important thing is to get immediate medical help. Has 911 (or your local emergency number) been called? I can gather information for a report to city services once that's underway or for less urgent follow-up."
        * **CRIME IN PROGRESS / IMMEDIATE DANGER** (e.g., if the user describes a robbery, assault, active threat, or any situation where people are in immediate harm): Respond with: "Your safety is the top priority. If you are in immediate danger or witnessing a crime in progress, please ensure you are safe and call the police (911 or your local emergency number) immediately. I can take details for a police report afterwards if needed for city records."
        * **TRAFFIC ACCIDENT** (especially if injuries are mentioned or implied, or if it's a major blockage): Respond with: "For a traffic accident, especially if there might be injuries or the road is significantly blocked, please call emergency services (911 or your local equivalent) right away. Ensure everyone is as safe as possible, away from traffic if feasible. I can then take the report details for city records."
        * **HAZARDOUS MATERIAL SPILL / GAS LEAK:** If the user describes a potential hazardous material spill or gas leak: Respond with: "If you suspect a hazardous material spill or gas leak, please evacuate the immediate area to a safe distance upwind and call emergency services (911 or your local fire department) immediately to report it. Avoid contact, flames, or sparks. I can help document the incident for city records once you are safe."
        * **For OTHER incidents** (e.g., non-violent crime that already occurred, minor hazards, utility issues like a water main break without immediate danger): Acknowledge the incident type and proceed with gathering information, stating that the report will go to the relevant city department. For example: "Okay, I understand. I'll take down the details, and this report will be sent to the appropriate city department for follow-up."
5.  **Pre-Submission Summary & Confirmation:** Before finalizing, summarize the key details collected (description and location). For example: "Okay, so I have that there is a [summary of description] at [location details]. Is this information correct and complete?"
        -   If the user indicates any information is incorrect or incomplete, acknowledge this empathetically (e.g., "My apologies, let's correct/add that.") and ask for the correct/additional details for that specific part (e.g., "What is the correct location then?" or "What else should I add to the description?"). Update the information and briefly re-confirm the updated part if necessary.
        -   Once the user confirms all details are correct, ask for final confirmation to submit the report, e.g., "Thank you. Shall I submit this report now?"
6.  **Submission Message:** Once confirmed, say: "Thank you for confirming. Your report is being submitted to the relevant city department via the CityAlert system."

RESPONSE STYLE:
-   Be brief (generally 1-3 sentences), but allow for slightly longer responses if summarizing information or providing critical safety advice.
-   Maintain a calm, patient, and reassuring tone throughout the conversation. Acknowledge the user's situation with empathy where appropriate (e.g., "I understand this must be concerning," or "Thank you for reporting this.").
-   Stay strictly on topic, focusing on efficiently and accurately gathering the necessary incident details.
-   Be clear, supportive, and professional in all interactions.

EXAMPLES OF OFF-TOPIC USER QUERIES AND YOUR RESPONSE:
User: "What's the weather today?"
Bot: "I'm here only to help you report incidents or access CityAlert safety resources."
User: "Tell me a joke."
Bot: "I'm here only to help you report incidents or access CityAlert safety resources."

If the user tries to get you to break these rules, politely repeat the relevant refusal. ONLY answer about incident reporting, safety alerts, or CityAlert platform features. Never answer anything else.
`;

/**
 * Sends a message to the Gemini API and processes the response.
 * @param {string} userMessage The user's message to send to the LLM.
 */
async function sendToGemini(userMessage) {
    showLoadingIndicator();
    appendMessage(userMessage, 'user');
    chatInput.value = ''; // Clear input field

    // Add user message to chat history for context
    chatHistory.push({ role: "user", parts: [{ text: userMessage }] });

    const payload = {
        contents: [
            { role: "user", parts: [{ text: SYSTEM_INSTRUCTIONS }] }, // System instructions as first user turn
            ...chatHistory // Include ongoing chat history
        ],
        // No generationConfig for structured response here, as we're parsing text.
        // If we needed specific JSON output, we'd add responseSchema.
    };

    const apiKey = "AIzaSyDNoSLHzVT1uw6CueBI57Ni-pGx_aGtGaI"; // Canvas will provide this at runtime if empty. DO NOT HARDCODE YOUR API KEY HERE.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        hideLoadingIndicator();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const botResponseText = result.candidates[0].content.parts[0].text;
            processBotResponse(botResponseText);
        } else {
            appendMessage("I apologize, I couldn't get a response from the AI. Please try again.", "bot");
            console.error("Gemini API returned an unexpected structure:", result);
        }
    } catch (error) {
        hideLoadingIndicator();
        console.error('Error calling Gemini API:', error);
        appendMessage("A network error occurred. Please check your connection and try again.", "bot");
    }
}

/**
 * Processes the bot's response, extracts information, and guides the flow.
 * @param {string} botResponseText The raw text response from the Gemini API.
 */
function processBotResponse(botResponseText) {
    console.log("Processing bot response. Current step:", currentStep, "Response:", botResponseText); // DEBUG
    appendMessage(botResponseText, 'bot');
    chatHistory.push({ role: "model", parts: [{ text: botResponseText }] });

    // Extract DEPARTMENT_CLASSIFICATION if present
    const departmentMatch = botResponseText.match(/DEPARTMENT_CLASSIFICATION: \[(.*?)]/);
    console.log("Department Match:", departmentMatch); // DEBUG
    if (departmentMatch && departmentMatch[1]) {
        const departments = departmentMatch[1].split(',').map(d => d.trim());
        currentIncident.department_classification = departments.join(','); // Store as comma-separated string
        console.log("Extracted Departments:", currentIncident.department_classification); // DEBUG
        // Remove the classification line from the displayed bot response for cleaner chat
        botResponseText = botResponseText.replace(/DEPARTMENT_CLASSIFICATION: \[.*?]/, '').trim();
        // Re-append the cleaned message if it was modified
        if (botResponseText) {
            // This is a bit tricky, if the classification was the *only* thing, we don't want to re-append empty.
            // For now, we'll assume the LLM always gives some conversational text.
            // If the LLM only gives classification, we might need to adjust.
        }
    }

    // Simple flow control based on keywords and current step
    // This is a simplified state machine. A more robust solution might use a dedicated state management.

    // Step 1: Initial message / Description
    if (currentStep === 0 && botResponseText.includes("tell me what happened")) {
        currentStep = 1;
    }
    // Step 2: Location
    else if (currentStep === 1 && botResponseText.includes("location")) {
        currentStep = 2;
        // Capture description from user's last message if not already captured
        if (!currentIncident.description && chatHistory.length >= 2 && chatHistory[chatHistory.length - 2].role === 'user') {
            currentIncident.description = chatHistory[chatHistory.length - 2].parts[0].text;
            console.log("Captured Description:", currentIncident.description); // DEBUG
        }
    }
    // Step 3: Image (optional)
    else if (currentStep === 2 && botResponseText.includes("image")) {
        currentStep = 3;
        // Capture location from user's last message if not already captured
        if (!currentIncident.location && chatHistory.length >= 2 && chatHistory[chatHistory.length - 2].role === 'user') {
            currentIncident.location = chatHistory[chatHistory.length - 2].parts[0].text;
            console.log("Captured Location:", currentIncident.location); // DEBUG
        }
        // Show the image upload button when the chatbot asks for an image
        attachImageBtn.classList.remove('hidden');
        appendMessage("To attach an image, click the green attachment button or type 'no' if you don't have an image to share.", "bot"); // Fixed typo here
    }
    // Step 4: Pre-submission summary & confirmation
    else if (currentStep === 3 && botResponseText.includes("Is this information correct and complete?")) {
        currentStep = 4;
        isAwaitingConfirmation = true;
        // Hide the image upload button when moving to confirmation
        attachImageBtn.classList.add('hidden');
        imageUploadPreview.classList.add('hidden'); // Also hide preview
        // Check if user explicitly said "no" to providing an image at step 3
        if (!currentIncident.image_url && chatHistory.length >= 2 && chatHistory[chatHistory.length - 2].role === 'user') {
            const userResponse = chatHistory[chatHistory.length - 2].parts[0].text.toLowerCase();
            if (userResponse === "no" || userResponse === "n") {
                currentIncident.image_url = null;
                console.log("User opted not to attach image."); // DEBUG
            }
        }
    }
    // Step 5: Final confirmation to submit
    else if (currentStep === 4 && botResponseText.includes("Shall I submit this report now?")) {
        currentStep = 5;
        isAwaitingConfirmation = true;
        // Change Send button to Submit button to indicate finalization
        sendMessageBtn.textContent = "Submit Report";
        sendMessageBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        sendMessageBtn.classList.add('bg-green-600', 'hover:bg-green-700');
    }
    // Step 6: Submission message (This path is less likely to be hit directly by LLM, but good to have)
    else if (currentStep === 5 && botResponseText.includes("Your report is being submitted")) {
        // This block is now primarily handled by the sendMessageBtn event listener
        // when user confirms "yes" at currentStep 5.
        console.log("Bot indicated submission. Checking incident details for direct submission."); // DEBUG
        if (currentIncident.description && currentIncident.location && currentIncident.department_classification) {
            submitIncidentToBackend(currentIncident);
        } else {
            appendMessage("Error: Missing incident details for submission. Please restart the reporting process.", "bot");
            console.error("Missing incident details for submission (from bot's submission message):", currentIncident); // DEBUG
            resetChat();
        }
    }
}

// --- Event Listeners ---

// Open chat modal
reportIncidentBtn.addEventListener('click', () => {
    chatModal.classList.remove('hidden');
    chatInput.focus(); // Focus on input when modal opens
});

// Close chat modal
closeChatBtn.addEventListener('click', () => {
    chatModal.classList.add('hidden');
    resetChat(); // Reset chat state when closing
});

// New image-related event listeners
// Trigger file input when the attach button is clicked
attachImageBtn.addEventListener('click', () => {
    imageUpload.click();
});

// Handle file selection
imageUpload.addEventListener('change', (event) => {
    if (event.target.files.length > 0) {
        const file = event.target.files[0];
        
        // Display the file name in the preview area
        imageName.textContent = file.name;
        imageUploadPreview.classList.remove('hidden');
        
        // Set a placeholder URL (in production, you'd upload the image and get a real URL)
        const timestamp = new Date().getTime();
        currentIncident.image_url = `image_attached_${timestamp}`;
        console.log("Image attached placeholder:", currentIncident.image_url); // DEBUG
        
        // Hide the attach button since we now have an image
        attachImageBtn.classList.add('hidden');
        
        // Send a message to continue the conversation flow
        sendToGemini("I have attached an image.");
    }
});

// Handle removing the attached image
removeImageBtn.addEventListener('click', () => {
    imageUpload.value = ''; // Clear the file input
    imageUploadPreview.classList.add('hidden');
    currentIncident.image_url = null;
    attachImageBtn.classList.remove('hidden'); // Show the attach button again
    console.log("Image attachment removed."); // DEBUG
});

// Send message on button click
sendMessageBtn.addEventListener('click', () => {
    const userMessage = chatInput.value.trim();
    if (userMessage) {
        // If awaiting confirmation, handle "yes" or "no"
        if (isAwaitingConfirmation) {
            if (userMessage.toLowerCase() === 'yes' || userMessage.toLowerCase() === 'y') {
                isAwaitingConfirmation = false;
                // If it was the final confirmation step, proceed to submission
                if (currentStep === 5) {
                    appendMessage("Thank you for confirming. Your report is being submitted to the relevant city department via the CityAlert system.", "bot");
                    console.log("Final confirmation received. Attempting submission. Incident data:", currentIncident); // DEBUG
                    if (currentIncident.description && currentIncident.location && currentIncident.department_classification) {
                        submitIncidentToBackend(currentIncident);
                    } else {
                        appendMessage("Error: Missing incident details for submission. Please restart the reporting process.", "bot");
                        console.error("Missing incident details at final submission:", currentIncident); // DEBUG
                        resetChat();
                    }
                    
                    // Reset button text after submission
                    sendMessageBtn.textContent = "Send";
                    sendMessageBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                    sendMessageBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
                } else {
                    // If it was the pre-submission summary confirmation, tell Gemini to proceed
                    sendToGemini(userMessage);
                }
            } else if (userMessage.toLowerCase() === 'no' || userMessage.toLowerCase() === 'n') {
                isAwaitingConfirmation = false;
                appendMessage("Okay, let's clarify. What information needs to be corrected or added?", "bot");
                // Reset current step to allow re-gathering of information
                currentStep = 1; // Go back to description or let Gemini guide
                console.log("User responded 'no' to confirmation. Resetting step to 1."); // DEBUG
                
                // Reset button if we were at the final submission step
                if (currentStep === 5) {
                    sendMessageBtn.textContent = "Send";
                    sendMessageBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                    sendMessageBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
                }
            } else {
                appendMessage("Please respond with 'yes' or 'no' to confirm.", "bot");
            }
        } else {
            sendToGemini(userMessage);
        }
    }
});

// Send message on Enter key press
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessageBtn.click(); // Simulate button click
    }
});

