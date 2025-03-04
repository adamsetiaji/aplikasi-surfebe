# Package untuk API endpoints
from flask import Blueprint

# Buat blueprint untuk API routes
api_bp = Blueprint('api', __name__)

# Import routes setelah blueprint dibuat untuk menghindari circular import
from api.server_api import register_server_api_routes

# Register sub-routes dengan blueprint utama
register_server_api_routes(api_bp)

def register_api(app):
    """
    Register API blueprint dengan aplikasi Flask
    
    Args:
        app: Flask application instance
    """
    app.register_blueprint(api_bp)