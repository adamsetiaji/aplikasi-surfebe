import json
import asyncio
import websockets
import threading
import time
import sys
import os
import logging

# Import konfigurasi
from config import RECONNECT_DELAY

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Menambahkan path untuk import database
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import database

class WebSocketConnection:
    """Kelas untuk menangani koneksi WebSocket ke server eksternal"""
    
    def __init__(self, server_id, server_url, socketio=None):
        self.server_id = server_id
        self.server_url = server_url
        self.socketio = socketio
        self.websocket = None
        self.connected = False
        self.should_reconnect = True
        self.reconnect_delay = RECONNECT_DELAY
        self.thread = None
        self.connection_attempts = 0
        self.max_connection_attempts = 5

    async def connect(self):
        """Menghubungkan ke server WebSocket"""
        try:
            logger.info(f"Connecting to {self.server_url}")
            self.connection_attempts += 1
            
            self.websocket = await websockets.connect(self.server_url)
            self.connected = True
            self.connection_attempts = 0  # Reset setelah berhasil
            
            # Update status server di database
            database.update_server_status(self.server_id, "Online")
            
            # Emit event ke frontend jika socketio tersedia
            if self.socketio:
                server = database.get_server(self.server_id)
                self.socketio.emit('server_status_changed', {
                    'server_id': self.server_id,
                    'status': 'Online',
                    'server': server
                })
            
            # Log aktivitas
            database.add_activity_log(
                self.server_id, 
                f"Connected to {self.server_url}"
            )
            
            logger.info(f"Connected to {self.server_url}")
            
            # Panggil metode untuk memproses pesan yang masuk
            await self.process_messages()
            
        except (websockets.exceptions.WebSocketException, ConnectionRefusedError) as e:
            self.connected = False
            
            # Update status server di database
            database.update_server_status(self.server_id, "Offline")
            
            # Emit event ke frontend jika socketio tersedia
            if self.socketio:
                server = database.get_server(self.server_id)
                self.socketio.emit('server_status_changed', {
                    'server_id': self.server_id,
                    'status': 'Offline',
                    'server': server,
                    'error': str(e)
                })
            
            # Log aktivitas
            database.add_activity_log(
                self.server_id, 
                f"Failed to connect: {str(e)}"
            )
            
            logger.error(f"Failed to connect to {self.server_url}: {str(e)}")
            
            # Coba koneksi ulang jika diperlukan dan belum mencapai batas percobaan
            if self.should_reconnect and self.connection_attempts < self.max_connection_attempts:
                delay = self.reconnect_delay * (2 ** (self.connection_attempts - 1))  # Exponential backoff
                logger.info(f"Retrying connection in {delay} seconds (attempt {self.connection_attempts} of {self.max_connection_attempts})")
                await asyncio.sleep(delay)
                await self.connect()
            elif self.connection_attempts >= self.max_connection_attempts:
                logger.warning(f"Maximum connection attempts reached for {self.server_url}")
                database.add_activity_log(
                    self.server_id, 
                    f"Maximum connection attempts reached ({self.max_connection_attempts})"
                )

    async def process_messages(self):
        """Memproses pesan yang masuk dari server WebSocket"""
        try:
            async for message in self.websocket:
                try:
                    # Coba parse pesan sebagai JSON
                    data = json.loads(message)
                    
                    # Emit event ke frontend jika socketio tersedia
                    if self.socketio:
                        self.socketio.emit('server_message', {
                            'server_id': self.server_id,
                            'data': data
                        })
                    
                    logger.debug(f"Received message from {self.server_url}: {message[:50]}..." if len(message) > 50 else f"Received message: {message}")
                    
                except json.JSONDecodeError:
                    # Pesan bukan JSON
                    if self.socketio:
                        self.socketio.emit('server_message', {
                            'server_id': self.server_id,
                            'data': message
                        })
                    
                    logger.debug(f"Received non-JSON message from {self.server_url}")
        
        except websockets.exceptions.ConnectionClosed as e:
            self.connected = False
            
            # Update status server di database
            database.update_server_status(self.server_id, "Disconnected")
            
            # Emit event ke frontend jika socketio tersedia
            if self.socketio:
                server = database.get_server(self.server_id)
                self.socketio.emit('server_status_changed', {
                    'server_id': self.server_id,
                    'status': 'Disconnected',
                    'server': server
                })
            
            # Log aktivitas
            database.add_activity_log(
                self.server_id, 
                f"Connection closed: {str(e)}"
            )
            
            logger.info(f"Connection closed to {self.server_url}: {str(e)}")
            
            # Coba koneksi ulang jika diperlukan
            if self.should_reconnect:
                await asyncio.sleep(self.reconnect_delay)
                await self.connect()

    async def send_message(self, message):
        """Mengirim pesan ke server WebSocket"""
        if not self.connected or not self.websocket:
            logger.warning(f"Cannot send message to {self.server_url}: Not connected")
            return False
        
        try:
            # Konversi ke string jika message adalah dict/object
            if isinstance(message, (dict, list)):
                message = json.dumps(message)
                
            await self.websocket.send(message)
            logger.debug(f"Sent message to {self.server_url}: {message[:50]}..." if len(message) > 50 else f"Sent message: {message}")
            return True
        except websockets.exceptions.WebSocketException as e:
            # Log error
            database.add_activity_log(
                self.server_id, 
                f"Failed to send message: {str(e)}"
            )
            logger.error(f"Failed to send message to {self.server_url}: {str(e)}")
            return False

    async def disconnect(self):
        """Memutuskan koneksi ke server WebSocket"""
        self.should_reconnect = False
        
        if self.websocket:
            try:
                await self.websocket.close()
                self.connected = False
                
                # Update status server di database
                database.update_server_status(self.server_id, "Disconnected")
                
                # Log aktivitas
                database.add_activity_log(
                    self.server_id, 
                    f"Disconnected from {self.server_url}"
                )
                
                logger.info(f"Disconnected from {self.server_url}")
            except Exception as e:
                logger.error(f"Error disconnecting from {self.server_url}: {str(e)}")

    def start_in_thread(self):
        """Memulai koneksi WebSocket dalam thread terpisah"""
        if self.thread and self.thread.is_alive():
            logger.info(f"Connection to {self.server_url} already running")
            return self.thread
            
        def run_async_loop():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(self.connect())
            
        self.thread = threading.Thread(target=run_async_loop)
        self.thread.daemon = True
        self.thread.start()
        
        return self.thread

    def stop(self):
        """Menghentikan koneksi WebSocket"""
        self.should_reconnect = False
        if self.websocket:
            asyncio.run(self.disconnect())


class WebSocketManager:
    """Kelas untuk mengelola beberapa koneksi WebSocket"""
    
    def __init__(self, socketio=None):
        self.connections = {}  # {server_id: WebSocketConnection}
        self.socketio = socketio

    def connect_to_server(self, server_id):
        """Menghubungkan ke server berdasarkan ID"""
        if server_id in self.connections:
            logger.info(f"Already connected to server {server_id}")
            return True
            
        server = database.get_server(server_id)
        if not server:
            logger.error(f"Server {server_id} not found")
            return False
            
        # Hanya hubungkan ke URL dengan protokol WebSocket
        if server['url'].startswith(('ws://', 'wss://')):
            connection = WebSocketConnection(server_id, server['url'], self.socketio)
            connection.start_in_thread()
            self.connections[server_id] = connection
            
            logger.info(f"Connection initiated for server {server_id}")
            return True
        
        logger.warning(f"Server {server_id} does not use WebSocket protocol")
        return False

    def disconnect_from_server(self, server_id):
        """Memutuskan koneksi dari server berdasarkan ID"""
        if server_id in self.connections:
            logger.info(f"Disconnecting from server {server_id}")
            self.connections[server_id].stop()
            del self.connections[server_id]
            return True
        
        logger.warning(f"Server {server_id} not connected")
        return False

    def send_message_to_server(self, server_id, message):
        """Mengirim pesan ke server tertentu"""
        if server_id not in self.connections:
            # Coba hubungkan terlebih dahulu
            logger.info(f"Not connected to server {server_id}, trying to connect first")
            connected = self.connect_to_server(server_id)
            if not connected:
                logger.error(f"Failed to connect to server {server_id}")
                return False
        
        # Tunggu beberapa saat agar koneksi terbentuk
        start_time = time.time()
        connection = self.connections[server_id]
        
        while not connection.connected and time.time() - start_time < 5:
            time.sleep(0.5)
        
        if not connection.connected:
            logger.error(f"Server {server_id} not connected after waiting")
            return False
        
        # Kirim pesan
        return asyncio.run(connection.send_message(message))

    def connect_to_all_servers(self):
        """Menghubungkan ke semua server WebSocket yang ada di database"""
        servers = database.get_servers()
        
        connected_count = 0
        for server in servers:
            if server['url'].startswith(('ws://', 'wss://')):
                if self.connect_to_server(server['id']):
                    connected_count += 1
        
        logger.info(f"Connected to {connected_count} WebSocket servers")
        return connected_count

    def disconnect_from_all_servers(self):
        """Memutuskan semua koneksi WebSocket"""
        server_ids = list(self.connections.keys())
        for server_id in server_ids:
            self.disconnect_from_server(server_id)
        
        logger.info("Disconnected from all servers")


# Fungsi bantuan untuk menguji koneksi server
async def test_server_connection(server_url):
    """Menguji koneksi ke server"""
    try:
        # Jika URL adalah WebSocket
        if server_url.startswith(('ws://', 'wss://')):
            try:
                websocket = await websockets.connect(server_url)
                await websocket.close()
                return True, "Connection successful", None
            except Exception as e:
                return False, f"Connection failed: {str(e)}", str(e)
        
        # Jika URL adalah HTTP/HTTPS
        elif server_url.startswith(('http://', 'https://')):
            # Di sini bisa ditambahkan kode untuk cek HTTP server
            # Misalnya dengan requests
            # Untuk saat ini, kita simulasikan saja
            return True, "Connection successful (simulated for HTTP)", None
        
        # URL tidak dikenal
        else:
            return False, "Unsupported URL protocol", "URL must start with ws://, wss://, http://, or https://"
        
    except Exception as e:
        return False, f"Connection failed: {str(e)}", str(e)


def ping_server(server_id):
    """Ping server untuk mengukur latensi"""
    server = database.get_server(server_id)
    if not server:
        logger.error(f"Server {server_id} not found")
        return {'success': False, 'error': 'Server not found'}
    
    # Simulasi ping (implementasi nyata akan menggunakan protokol yang sesuai)
    start_time = time.time()
    
    # Jika server menggunakan WebSocket
    if server['url'].startswith(('ws://', 'wss://')):
        success, message, error = asyncio.run(test_server_connection(server['url']))
    else:
        # Simulasi untuk server HTTP/lainnya
        time.sleep(0.05)  # Simulasi delay jaringan
        success = server['status'] != 'Offline'
        message = "HTTP connection simulated"
    
    end_time = time.time()
    
    # Hitung ping time dalam milidetik
    ping_time = int((end_time - start_time) * 1000)
    
    if success:
        # Update status dan ping time di database
        database.update_server_status(server_id, 'Online', ping_time)
        
        logger.info(f"Ping to server {server_id} successful: {ping_time}ms")
        return {
            'success': True,
            'status': 'Online',
            'ping_ms': ping_time,
            'message': message
        }
    else:
        # Update status di database
        database.update_server_status(server_id, 'Offline')
        
        logger.warning(f"Ping to server {server_id} failed: {message}")
        return {
            'success': False,
            'status': 'Offline',
            'error': message or "Could not connect to server"
        }