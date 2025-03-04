import os

# Path konfigurasi
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Database
DATABASE_FILE = 'server_manager.db'
DATABASE_PATH = os.path.join(BASE_DIR, DATABASE_FILE)

# Server Flask
FLASK_HOST = '127.0.0.1'
FLASK_PORT = 5000
FLASK_DEBUG = True

# WebSocket
RECONNECT_DELAY = 5  # Delay dalam detik untuk mencoba koneksi ulang ke server WebSocket

# Aplikasi
APP_NAME = 'Aplikasi ABC v.1.0.0'
APP_WIDTH = 1200
APP_HEIGHT = 800
APP_MIN_SIZE = (800, 600)
APP_TEXT_SELECT = True

# Environment
ENVIRONMENT = os.environ.get('APP_ENV', 'development')
IS_PRODUCTION = ENVIRONMENT == 'production'

# Log
LOG_LEVEL = 'INFO'