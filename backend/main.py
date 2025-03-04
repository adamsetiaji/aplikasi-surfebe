import os
import sys
import threading
import logging
import webview
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pastikan path ke modul backend tersedia
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, os.path.dirname(current_dir))

# Import modul backend
import database
from config import FLASK_HOST, FLASK_PORT, FLASK_DEBUG, APP_NAME, APP_WIDTH, APP_HEIGHT, APP_MIN_SIZE
from api import register_api, api_bp
from api.server_api import set_server_service, init_socket_events
from services.server_service import ServerService
from websocket.socket_handler import WebSocketManager

# Inisialisasi aplikasi Flask
app = Flask(__name__, static_folder='../frontend/dist', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Inisialisasi WebSocketManager dan ServerService
ws_manager = WebSocketManager(socketio)
server_service = ServerService(socketio, ws_manager)
set_server_service(server_service)

# Inisialisasi database
database.init_db()

# Register API routes
register_api(app)
init_socket_events(socketio, server_service)

# Rute untuk halaman utama (untuk frontend static)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    
    # Return index.html untuk semua rute lain (untuk SPA)
    if app.static_folder and os.path.exists(os.path.join(app.static_folder, 'index.html')):
        return send_from_directory(app.static_folder, 'index.html')
    
    # Jika frontend belum di-build
    return "Frontend not built. Please run 'npm run build' in the frontend directory."

# Event handlers websocket
@socketio.on('connect')
def handle_connect():
    logger.info("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    logger.info("Client disconnected")

# PyWebView API
class Api:
    def __init__(self, service):
        self.service = service
    
    def get_servers(self):
        """Dapatkan semua server"""
        return self.service.get_all_servers()
    
    def get_server(self, server_id):
        """Dapatkan server berdasarkan ID"""
        return self.service.get_server_by_id(server_id)
    
    def add_server(self, server_data):
        """Tambahkan server baru"""
        return self.service.add_server(server_data)
    
    def update_server(self, server_id, server_data):
        """Update server yang ada"""
        return self.service.update_server(server_id, server_data)
    
    def delete_server(self, server_id):
        """Hapus server"""
        return self.service.delete_server(server_id)
    
    def ping_server(self, server_id):
        """Ping server"""
        return self.service.ping_server(server_id)
    
    def connect_to_server(self, server_id):
        """Hubungkan ke server"""
        return self.service.connect_to_server(server_id)
    
    def disconnect_from_server(self, server_id):
        """Putuskan koneksi dari server"""
        return self.service.disconnect_from_server(server_id)
    
    def send_message_to_server(self, server_id, message):
        """Kirim pesan ke server"""
        return self.service.send_message_to_server(server_id, message)
    
    def get_server_logs(self, server_id, limit=20):
        """Dapatkan log server"""
        return self.service.get_server_logs(server_id, limit)
    
    def fullscreen(self):
        """Toggle fullscreen"""
        try:
            webview.windows[0].toggle_fullscreen()
            return {"success": True}
        except Exception as e:
            logger.error(f"Error toggling fullscreen: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def minimize(self):
        """Minimize window"""
        try:
            webview.windows[0].minimize()
            return {"success": True}
        except Exception as e:
            logger.error(f"Error minimizing window: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def exit_app(self):
        """Keluar dari aplikasi"""
        try:
            # Putuskan semua koneksi WebSocket sebelum keluar
            self.service.disconnect_from_all_servers()
            webview.windows[0].destroy()
            return {"success": True}
        except Exception as e:
            logger.error(f"Error exiting app: {str(e)}")
            return {"success": False, "error": str(e)}

def start_server():
    """Start server Flask+SocketIO"""
    logger.info(f"Starting Flask server on {FLASK_HOST}:{FLASK_PORT}")
    socketio.run(
        app, 
        host=FLASK_HOST, 
        port=FLASK_PORT, 
        debug=FLASK_DEBUG, 
        use_reloader=False, 
        allow_unsafe_werkzeug=True
    )

# Pada bagian main() di backend/main.py
def main():
    """Main entry point"""
    try:
        # Start Flask+SocketIO in thread terpisah
        logger.info("Starting Flask+SocketIO server in a separate thread")
        t = threading.Thread(target=start_server)
        t.daemon = True
        t.start()
        
        # Dapatkan lokasi direktori frontend
        frontend_dir = os.path.join(os.path.dirname(current_dir), 'frontend', 'dist')
        
        # Tentukan URL yang akan digunakan
        url = f'http://{FLASK_HOST}:{FLASK_PORT}'  # Default untuk development
        
        # Cek apakah frontend telah di-build
        if os.path.exists(os.path.join(frontend_dir, 'index.html')):
            # Gunakan file statis jika dalam mode produksi
            if os.environ.get('APP_ENV') == 'production':
                url = frontend_dir
                logger.info(f"Using static files from {frontend_dir}")
        
        # Tidak perlu mencoba menghubungkan ke server WebSocket jika tidak ada server di database
        servers = server_service.get_all_servers()
        if servers:
            logger.info("Connecting to WebSocket servers...")
            server_service.connect_to_all_websocket_servers()
        else:
            logger.info("No servers found in database. Skipping WebSocket connections.")
        
        # Buat PyWebView API
        api = Api(server_service)
        
        # Buat window
        logger.info(f"Creating window with URL: {url}")
        window = webview.create_window(
            APP_NAME, 
            url=url,
            js_api=api,
            width=APP_WIDTH,
            height=APP_HEIGHT,
            min_size=APP_MIN_SIZE,
            text_select=True
        )
        
        # Mulai aplikasi
        logger.info("Starting PyWebView application")
        webview.start(debug=FLASK_DEBUG)
        
        # Putuskan semua koneksi WebSocket saat aplikasi ditutup
        logger.info("Application closing, disconnecting from all servers")
        server_service.disconnect_from_all_servers()
        
    except Exception as e:
        logger.error(f"Error in main: {str(e)}")
        raise

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Application terminated by user")
    except Exception as e:
        logger.error(f"Unhandled exception: {str(e)}")
        import traceback
        traceback.print_exc()