"""
Main Flask application for the unified AGI system.

This module initializes the Flask application and registers all blueprints,
setting up the unified AGI system for web access.
"""

import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS

# Import blueprints
from api.chat_routes import chat_bp
from api.benchmark_routes import benchmark_bp

# Import core components
from core.integration import CoreIntegrationLayer
from tools.tool_interface import ToolRegistry

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def create_app(config=None):
    """
    Create and configure the Flask application.
    
    Args:
        config: Optional configuration dictionary
    
    Returns:
        Configured Flask application
    """
    app = Flask(__name__)
    
    # Enable CORS
    CORS(app)
    
    # Load configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        DATABASE=os.path.join(app.instance_path, 'unified_agi.sqlite'),
        UPLOAD_FOLDER=os.path.join(app.instance_path, 'uploads'),
        STATE_FOLDER=os.path.join(app.instance_path, 'state'),
    )
    
    if config:
        app.config.from_mapping(config)
    
    # Ensure instance folder exists
    try:
        os.makedirs(app.instance_path, exist_ok=True)
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        os.makedirs(app.config['STATE_FOLDER'], exist_ok=True)
    except OSError:
        pass
    
    # Initialize core components
    app.core_integration = CoreIntegrationLayer(
        vector_dim=64,
        load_from=os.path.join(app.config['STATE_FOLDER'], 'core_state.json')
        if os.path.exists(os.path.join(app.config['STATE_FOLDER'], 'core_state.json'))
        else None
    )
    
    app.tool_registry = ToolRegistry()
    
    # Register blueprints
    app.register_blueprint(chat_bp)
    app.register_blueprint(benchmark_bp)
    
    # Root route
    @app.route('/')
    def index():
        return jsonify({
            "name": "Unified AGI System",
            "version": "1.0.0",
            "status": "operational",
            "endpoints": [
                "/api/chat/message",
                "/api/chat/tool",
                "/api/chat/status",
                "/api/chat/history",
                "/api/chat/tools",
                "/api/benchmark/arc",
                "/api/benchmark/swelancer",
                "/api/benchmark/custom",
                "/api/benchmark/results",
                "/api/benchmark/compare"
            ]
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found"}), 404
    
    @app.errorhandler(500)
    def server_error(error):
        return jsonify({"error": "Internal server error"}), 500
    
    return app

# Create the application
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
