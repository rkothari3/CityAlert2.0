// public/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Get references to the report incident button and the chatbot modal
    const reportIncidentBtn = document.getElementById('reportIncidentBtn');
    const chatbotModal = document.getElementById('chatbotModal');
    const closeChatBtn = document.getElementById('closeChatBtn');

    // Event listener to open the chatbot modal
    if (reportIncidentBtn) {
        reportIncidentBtn.addEventListener('click', () => {
            chatbotModal.classList.remove('hidden'); // Show the modal
            // You might want to trigger the first bot message here or in chat.js
            // For now, chat.js will handle the initial greeting.
        });
    }

    // Event listener to close the chatbot modal
    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
            chatbotModal.classList.add('hidden'); // Hide the modal
            // Optionally, clear chat history or reset state in chat.js when closing
        });
    }

    console.log("main.js loaded and chatbot modal listeners attached.");
});
