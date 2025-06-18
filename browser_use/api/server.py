from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
import uuid
import logging

# Configure basic logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_very_secret_key_here!' # Replace with a real secret key
socketio = SocketIO(app, cors_allowed_origins="*") # Allow all origins for now, adjust for production

# Placeholder for actual agent service interaction
# from browser_use.agent.service import AgentService # Assuming such a service exists
# agent_service = AgentService()

def send_agent_step_update(task_id: str, step_description: str, screenshot_path: str = None):
    """
    Sends an update about an agent's step to connected SocketIO clients.
    This function would be called by the AgentService.
    """
    message = {'task_id': task_id, 'step': step_description}
    if screenshot_path:
        message['screenshot'] = screenshot_path # Or a URL to the screenshot

    logging.info(f"Sending agent update for task {task_id}: {step_description}")
    # In a real implementation, this emit would send data to specific rooms if needed.
    socketio.emit('agent_update', message)
    # Example of how AgentService might call this:
    # agent_service.register_step_callback(lambda desc, path=None: send_agent_step_update(current_task_id, desc, path))


@app.route('/api/agent/task', methods=['POST'])
def agent_task():
    """
    Accepts a task for the browser automation agent.
    """
    try:
        data = request.get_json()
        if not data or 'command' not in data:
            return jsonify({"status": "error", "message": "Missing 'command' in request"}), 400

        command = data['command']
        logging.info(f"Received command: {command}")

        task_id = str(uuid.uuid4())

        # TODO: Here you would typically call the actual browser_use agent service
        # For example:
        # agent_service.process_command(command, task_id)
        # The agent_service would then call send_agent_step_update() periodically.

        # Simulate some agent steps for demonstration if you were testing this directly
        # send_agent_step_update(task_id, f"Starting task for command: {command}")
        # send_agent_step_update(task_id, "Step 1: Navigating to website...")
        # send_agent_step_update(task_id, "Step 2: Clicking button...", "path/to/screenshot1.png")

        logging.info(f"Task {task_id} accepted for command: {command}")
        return jsonify({"status": "received", "task_id": task_id, "command_received": command}), 202
    except Exception as e:
        logging.error(f"Error processing request: {e}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500

@socketio.on('connect')
def handle_connect():
    """
    Handles a new SocketIO connection.
    """
    logging.info(f"Client connected: {request.sid}")
    emit('connection_ack', {'message': 'Successfully connected to server!', 'sid': request.sid})

@socketio.on('disconnect')
def handle_disconnect():
    """
    Handles a SocketIO disconnection.
    """
    logging.info(f"Client disconnected: {request.sid}")

@socketio.on('message_from_client')
def handle_message_from_client(data):
    """
    Example handler for messages from client.
    """
    logging.info(f"Message from client {request.sid}: {data}")
    emit('response_to_client', {'echo': data}, room=request.sid)


if __name__ == '__main__':
    # This is for development purposes only.
    # For production, use a WSGI server like Gunicorn or uWSGI with appropriate worker types (e.g., eventlet or gevent).
    logging.info("Starting Flask-SocketIO server...")
    socketio.run(app, debug=True, port=5001, use_reloader=False) # use_reloader=False is good for debugging threads
                                                                # consider host='0.0.0.0' to be accessible externally
                                                                # For production: eventlet or gevent recommended. Example:
                                                                # import eventlet
                                                                # eventlet.wsgi.server(eventlet.listen(('', 5001)), app)
