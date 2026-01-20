"""
Chat API routes for the unified AGI system.

This module provides the API endpoints for the chat interface,
allowing interaction with the AGI system through a RESTful API.
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from flask import Blueprint, request, jsonify, current_app

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Create blueprint
chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')

@chat_bp.route('/message', methods=['POST'])
def process_message():
    """
    Process a chat message and generate a response.
    
    Expects JSON: {
        "message": "User message text",
        "context": [Optional context objects],
        "session_id": "Optional session identifier"
    }
    
    Returns JSON: {
        "response": "Generated response text",
        "processing_results": {Processing details},
        "session_id": "Session identifier"
    }
    """
    data = request.json
    
    if not data or 'message' not in data:
        return jsonify({"error": "Missing 'message' in request body"}), 400
    
    message = data['message']
    context = data.get('context', None)
    session_id = data.get('session_id', None)
    
    # Get core integration layer from app context
    core = current_app.core_integration
    
    # Process message and generate response
    result = core.process_and_respond(message, context)
    
    # Create or retrieve session
    if not session_id:
        session_id = f"session_{len(core.memory_system['dialogue_history'])}"
    
    return jsonify({
        "response": result['response'],
        "processing_results": result['input_results'],
        "session_id": session_id
    })

@chat_bp.route('/tool', methods=['POST'])
def execute_tool():
    """
    Execute a tool through the AGI system.
    
    Expects JSON: {
        "tool_name": "Name of the tool to execute",
        "tool_params": {Tool parameters},
        "session_id": "Optional session identifier"
    }
    
    Returns JSON: {
        "result": {Tool execution result},
        "session_id": "Session identifier"
    }
    """
    data = request.json
    
    if not data or 'tool_name' not in data:
        return jsonify({"error": "Missing 'tool_name' in request body"}), 400
    
    tool_name = data['tool_name']
    tool_params = data.get('tool_params', {})
    session_id = data.get('session_id', None)
    
    # Get core integration layer from app context
    core = current_app.core_integration
    
    # Execute tool
    result = core.execute_tool(tool_name, tool_params)
    
    # Create or retrieve session
    if not session_id:
        session_id = f"session_{len(core.memory_system['tool_usage_history'])}"
    
    return jsonify({
        "result": result,
        "session_id": session_id
    })

@chat_bp.route('/status', methods=['GET'])
def get_status():
    """
    Get the current status of the AGI system.
    
    Returns JSON: {
        "status": {System status information}
    }
    """
    # Get core integration layer from app context
    core = current_app.core_integration
    
    # Get system status
    status = core.get_system_status()
    
    return jsonify({
        "status": status
    })

@chat_bp.route('/history', methods=['GET'])
def get_history():
    """
    Get the dialogue history for a session.
    
    Query parameters:
        session_id: Optional session identifier
        limit: Optional limit on number of messages to return (default: 50)
    
    Returns JSON: {
        "history": [Dialogue history entries],
        "session_id": "Session identifier"
    }
    """
    session_id = request.args.get('session_id', None)
    limit = int(request.args.get('limit', 50))
    
    # Get core integration layer from app context
    core = current_app.core_integration
    
    # Get dialogue history
    history = core.memory_system['dialogue_history'][-limit:]
    
    return jsonify({
        "history": history,
        "session_id": session_id
    })

@chat_bp.route('/tools', methods=['GET'])
def get_available_tools():
    """
    Get the list of available tools.
    
    Query parameters:
        category: Optional category filter
    
    Returns JSON: {
        "tools": [Tool information],
        "categories": [Available categories]
    }
    """
    category = request.args.get('category', None)
    
    # Get tool registry from app context
    registry = current_app.tool_registry
    
    if category:
        tools = registry.get_tools_by_category(category)
    else:
        tools = registry.get_all_tools()
    
    # Convert tools to dictionaries
    tool_dicts = [tool.to_dict() for tool in tools]
    
    return jsonify({
        "tools": tool_dicts,
        "categories": registry.get_categories()
    })

@chat_bp.route('/save', methods=['POST'])
def save_state():
    """
    Save the current state of the AGI system.
    
    Expects JSON: {
        "filepath": "Optional filepath to save state",
        "session_id": "Optional session identifier"
    }
    
    Returns JSON: {
        "result": {Save result information}
    }
    """
    data = request.json or {}
    
    filepath = data.get('filepath', './agi_state.json')
    session_id = data.get('session_id', None)
    
    # Get core integration layer from app context
    core = current_app.core_integration
    
    # Save state
    result = core.save_state(filepath)
    
    return jsonify({
        "result": result
    })

@chat_bp.route('/load', methods=['POST'])
def load_state():
    """
    Load the state of the AGI system.
    
    Expects JSON: {
        "filepath": "Filepath to load state from"
    }
    
    Returns JSON: {
        "result": {Load result information}
    }
    """
    data = request.json
    
    if not data or 'filepath' not in data:
        return jsonify({"error": "Missing 'filepath' in request body"}), 400
    
    filepath = data['filepath']
    
    # Get core integration layer from app context
    core = current_app.core_integration
    
    # Load state
    result = core.load_state(filepath)
    
    return jsonify({
        "result": result
    })
