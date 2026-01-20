"""
Initialize package modules for the backend API.
"""

from flask import Blueprint

# Create blueprint for API routes
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Import routes to register them with the blueprint
from . import chat_routes, benchmark_routes

# Register sub-blueprints with the main API blueprint
api_bp.register_blueprint(chat_routes.chat_bp)
api_bp.register_blueprint(benchmark_routes.benchmark_bp)
