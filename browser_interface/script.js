document.addEventListener('DOMContentLoaded', () => {
    const chatDisplay = document.getElementById('chat-display');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const automationPreview = document.getElementById('automation-preview');

    // Function to send a message to the backend
    async function sendMessage(message) {
        // Placeholder: Implement backend communication
        console.log(`Sending message: ${message}`);
        // Simulate receiving a response
        const response = await new Promise(resolve => setTimeout(() => resolve(`Echo: ${message}`), 1000));
        displayMessage(response, 'bot'); // Display bot's response

        // Placeholder: Simulate receiving an automation preview
        // In a real scenario, this might come with or after the bot's response
        updateAutomationPreview(`<html><body>Preview for: ${message}</body></html>`);
    }

    // Function to display a message in the chat area
    function displayMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.textContent = message;
        // chatDisplay.appendChild(messageElement); // Appending new messages at the bottom
        chatDisplay.insertBefore(messageElement, chatDisplay.firstChild); // Prepending new messages at the top
        // Scroll to the bottom if appending, or keep view if prepending and user has scrolled up
        // For prepending, it's often better not to auto-scroll, or to scroll to the new message if it's out of view.
        // chatDisplay.scrollTop = chatDisplay.scrollHeight; // Only if appending
    }

    // Function to update the browser automation preview area
    function updateAutomationPreview(htmlContent) {
        // Placeholder: Sanitize HTML content before displaying
        // For now, directly setting innerHTML for simplicity, but be cautious of XSS
        automationPreview.innerHTML = `<h2>Browser Automation Preview</h2>${htmlContent}`;
        console.log("Automation preview updated.");
    }

    // Event listener for the send button
    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim();
        if (message) {
            displayMessage(message, 'user');
            sendMessage(message);
            userInput.value = ''; // Clear input field
        }
    });

    // Event listener for pressing Enter in the input field
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendButton.click();
        }
    });

    // Initial message or state
    displayMessage("Welcome to the chat!", 'system');
    updateAutomationPreview("<html><body>No automation running currently.</body></html>");
});
