document.addEventListener('DOMContentLoaded', () => {
    const chatDisplay = document.getElementById('chat-display');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const automationPreview = document.getElementById('automation-preview');
    let currentTaskId = null; // To keep track of the current task

    // --- Socket.IO Connection ---
    // The server URL will default to the host serving the page.
    // For local development, if Flask runs on 5001 and this page is opened from file system or different server,
    // you might need to specify: const socket = io('http://localhost:5001');
    const socket = io(); // Connects to the server that serves the page, or specify URL

    socket.on('connect', () => {
        console.log('Successfully connected to Socket.IO server!', socket.id);
        displayMessage('Connected to agent service.', 'system');
    });

    socket.on('disconnect', (reason) => {
        console.log(`Disconnected from Socket.IO server: ${reason}`);
        displayMessage('Disconnected from agent service.', 'system-error');
    });

    socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        displayMessage('Error connecting to agent service.', 'system-error');
    });

    socket.on('connection_ack', (data) => {
        console.log('Server Acknowledged Connection:', data);
    });

    // --- Send User Message & Initiate Task ---
    async function sendUserMessageAndStartTask(message) {
        try {
            const response = await fetch('/api/agent/task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command: message }),
            });
            const data = await response.json();

            if (response.ok) {
                console.log('Task submission response:', data);
                currentTaskId = data.task_id;
                displayMessage(`Task started (ID: ${currentTaskId}). Waiting for updates...`, 'system');
                // Clear previous automation preview for the new task
                clearAutomationPreview();
                appendMessageToAutomationPreview(`Task ${currentTaskId} initiated for: "${message}"`);
            } else {
                console.error('Failed to start task:', data);
                displayMessage(`Error starting task: ${data.message || 'Unknown error'}`, 'system-error');
                currentTaskId = null;
            }
        } catch (error) {
            console.error('Error sending message to backend:', error);
            displayMessage('Failed to send message to backend.', 'system-error');
            currentTaskId = null;
        }
    }

    // --- Display Messages in Chat Area ---
    function displayMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        // Sanitize message text before adding to DOM to prevent XSS
        const textNode = document.createTextNode(message);
        messageElement.appendChild(textNode);
        chatDisplay.insertBefore(messageElement, chatDisplay.firstChild);
    }

    // --- Update Browser Automation Preview Area ---
    function clearAutomationPreview() {
        // Remove all child elements except the H2
        const h2 = automationPreview.querySelector('h2');
        automationPreview.innerHTML = ''; // Clear existing content
        if (h2) {
            automationPreview.appendChild(h2); // Re-add the title
        } else {
            // If h2 was also removed, recreate it
            const titleElement = document.createElement('h2');
            titleElement.textContent = "Browser Automation Preview";
            automationPreview.appendChild(titleElement);
        }
    }

    function appendMessageToAutomationPreview(stepDescription) {
        const stepElement = document.createElement('p');
        // Sanitize stepDescription before adding to DOM
        stepElement.textContent = stepDescription;
        stepElement.classList.add('automation-step');
        automationPreview.appendChild(stepElement);
        automationPreview.scrollTop = automationPreview.scrollHeight; // Scroll to the latest step
    }

    // --- Socket.IO Event Listener for Agent Updates ---
    socket.on('agent_update', (data) => {
        console.log('Received agent_update:', data);
        if (data.task_id && data.task_id !== currentTaskId) {
            console.warn(`Received update for a different task ID: ${data.task_id}. Current: ${currentTaskId}`);
            // Optionally, handle updates for other tasks or ignore
        }
        // For now, display any agent update if a task is active or if it's a general message
        let updateMessage = `Step: ${data.step}`;
        if (data.screenshot) {
            updateMessage += ` (Screenshot: ${data.screenshot})`; // Later, could make this an <img> tag
        }
        appendMessageToAutomationPreview(updateMessage);

        // If the agent sends a "final_response" or similar, display it in chat
        if (data.final_response) {
            displayMessage(data.final_response, 'bot');
        }
    });

    // --- Event Listeners for UI Elements ---
    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim();
        if (message) {
            displayMessage(message, 'user'); // Display user's message immediately
            sendUserMessageAndStartTask(message); // Send to backend and start task
            userInput.value = ''; // Clear input field
        }
    });

    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendButton.click();
        }
    });

    // --- Initial State ---
    displayMessage("Welcome! Connect to the agent service by typing a command.", 'system');
    clearAutomationPreview(); // Ensure preview is clean on load
    appendMessageToAutomationPreview("No automation running currently. Send a command to start.");
});
