import asyncio
import logging

# Import modules
import database
from models.server import Server
from websocket.socket_handler import WebSocketManager, ping_server, test_server_connection

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ServerService:
    """
    Service untuk operasi terkait server.
    
    Menyediakan abstraksi untuk operasi database dan koneksi WebSocket,
    serta menangani logika bisnis terkait server.
    """
    
    def __init__(self, socketio=None, ws_manager=None):
        """
        Inisialisasi ServerService
        
        Args:
            socketio: Instance Flask-SocketIO untuk broadcast events
            ws_manager: Instance WebSocketManager untuk koneksi WebSocket
        """
        self.socketio = socketio
        self.ws_manager = ws_manager or WebSocketManager(socketio)
        
        logger.info("ServerService initialized")
    
    def set_socketio(self, socketio):
        """
        Set instance Flask-SocketIO
        
        Args:
            socketio: Instance Flask-SocketIO
        """
        self.socketio = socketio
        self.ws_manager.socketio = socketio
        logger.info("SocketIO set for ServerService")
    
    def get_all_servers(self):
        """
        Mendapatkan semua server dari database
        
        Returns:
            list: Daftar server dalam bentuk dictionary
        """
        return database.get_servers()
    
    def get_server_by_id(self, server_id):
        """
        Mendapatkan server berdasarkan ID
        
        Args:
            server_id (str): ID server
        
        Returns:
            dict: Data server atau None jika tidak ditemukan
        """
        return database.get_server(server_id)
    
    def add_server(self, server_data):
        """
        Menambahkan server baru ke database
        
        Args:
            server_data (dict): Data server baru
        
        Returns:
            dict: Data server yang ditambahkan
        """
        # Buat objek Server untuk validasi data
        server_obj = Server.from_dict(server_data)
        
        # Tambahkan ke database
        server = database.add_server(server_obj.to_dict())
        
        # Broadcast event jika socketio tersedia
        if self.socketio:
            self.socketio.emit('server_added', server)
        
        # Coba hubungkan ke server jika itu adalah WebSocket
        if server_obj.is_websocket() and self.ws_manager:
            self.ws_manager.connect_to_server(server['id'])
        
        logger.info(f"Server added: {server['id']} - {server['name']}")
        return server
    
    def update_server(self, server_id, server_data):
        """
        Memperbarui server yang ada
        
        Args:
            server_id (str): ID server
            server_data (dict): Data baru untuk server
        
        Returns:
            dict: Data server setelah diperbarui atau None jika tidak ditemukan
        """
        # Dapatkan server yang ada
        existing_server = database.get_server(server_id)
        if not existing_server:
            logger.warning(f"Server not found for update: {server_id}")
            return None
        
        # Buat objek Server dari yang sudah ada
        server_obj = Server.from_dict(existing_server)
        
        # Update dengan data baru
        server_obj.update(server_data)
        
        # Simpan kembali ke database
        server = database.update_server(server_id, server_obj.to_dict())
        
        if not server:
            logger.error(f"Failed to update server: {server_id}")
            return None
        
        # Broadcast event jika socketio tersedia
        if self.socketio:
            self.socketio.emit('server_updated', server)
        
        # Jika URL berubah dan ini adalah WebSocket, perbarui koneksi
        url_changed = 'url' in server_data and existing_server['url'] != server_data['url']
        
        if url_changed and self.ws_manager:
            # Putuskan koneksi lama jika ada
            if server_id in self.ws_manager.connections:
                self.ws_manager.disconnect_from_server(server_id)
            
            # Buat koneksi baru jika server adalah WebSocket
            if server_obj.is_websocket():
                self.ws_manager.connect_to_server(server_id)
        
        logger.info(f"Server updated: {server_id} - {server['name']}")
        return server
    
    def delete_server(self, server_id):
        """
        Menghapus server
        
        Args:
            server_id (str): ID server
        
        Returns:
            bool: True jika berhasil dihapus, False jika tidak
        """
        # Putuskan koneksi WebSocket jika ada
        if self.ws_manager and server_id in self.ws_manager.connections:
            self.ws_manager.disconnect_from_server(server_id)
        
        # Hapus dari database
        deleted = database.delete_server(server_id)
        
        # Broadcast event jika socketio tersedia dan server berhasil dihapus
        if deleted and self.socketio:
            self.socketio.emit('server_deleted', {"id": server_id})
            logger.info(f"Server deleted: {server_id}")
        
        return deleted
    
    def ping_server(self, server_id):
        """
        Ping server untuk mengecek status
        
        Args:
            server_id (str): ID server
        
        Returns:
            dict: Hasil ping berisi status, ping time, dan info lainnya
        """
        result = ping_server(server_id)
        
        # Broadcast event jika socketio tersedia dan ping berhasil
        if result.get('success', False) and self.socketio:
            server = database.get_server(server_id)
            self.socketio.emit('server_status_changed', {
                'server_id': server_id,
                'status': result.get('status'),
                'ping_ms': result.get('ping_ms'),
                'server': server
            })
        
        return result
    
    def connect_to_server(self, server_id):
        """
        Menghubungkan ke server WebSocket
        
        Args:
            server_id (str): ID server
        
        Returns:
            dict: Hasil operasi koneksi
        """
        if not self.ws_manager:
            logger.error("WebSocketManager not initialized")
            return {'success': False, 'error': 'WebSocketManager not initialized'}
        
        server = database.get_server(server_id)
        if not server:
            logger.error(f"Server not found: {server_id}")
            return {'success': False, 'error': 'Server not found'}
        
        # Cek apakah server menggunakan protokol WebSocket
        if not server['url'].startswith(('ws://', 'wss://')):
            logger.warning(f"Server {server_id} does not use WebSocket protocol")
            return {
                'success': False, 
                'error': 'Server tidak menggunakan protokol WebSocket',
                'server_id': server_id
            }
        
        # Hubungkan ke server
        connected = self.ws_manager.connect_to_server(server_id)
        
        if connected:
            logger.info(f"Connection initiated to server: {server_id}")
            return {
                'success': True,
                'message': "Koneksi dimulai",
                'server_id': server_id
            }
        
        logger.error(f"Failed to connect to server: {server_id}")
        return {
            'success': False,
            'error': "Gagal menghubungkan ke server",
            'server_id': server_id
        }
    
    def disconnect_from_server(self, server_id):
        """
        Memutuskan koneksi dari server WebSocket
        
        Args:
            server_id (str): ID server
        
        Returns:
            dict: Hasil operasi pemutusan koneksi
        """
        if not self.ws_manager:
            logger.error("WebSocketManager not initialized")
            return {'success': False, 'error': 'WebSocketManager not initialized'}
        
        # Coba putuskan koneksi
        disconnected = self.ws_manager.disconnect_from_server(server_id)
        
        if disconnected:
            # Update status server
            database.update_server_status(server_id, "Disconnected")
            
            logger.info(f"Disconnected from server: {server_id}")
            return {
                'success': True,
                'message': "Koneksi diputus",
                'server_id': server_id
            }
        
        logger.warning(f"Server was not connected: {server_id}")
        return {
            'success': False,
            'message': "Server tidak dalam keadaan terhubung",
            'server_id': server_id
        }
    
    def send_message_to_server(self, server_id, message):
        """
        Mengirim pesan ke server WebSocket
        
        Args:
            server_id (str): ID server
            message: Pesan yang akan dikirim (string atau object)
        
        Returns:
            dict: Hasil operasi pengiriman pesan
        """
        if not self.ws_manager:
            logger.error("WebSocketManager not initialized")
            return {'success': False, 'error': 'WebSocketManager not initialized'}
        
        # Coba kirim pesan
        sent = self.ws_manager.send_message_to_server(server_id, message)
        
        if sent:
            logger.info(f"Message sent to server: {server_id}")
            return {
                'success': True,
                'message': "Pesan terkirim",
                'server_id': server_id
            }
        
        logger.error(f"Failed to send message to server: {server_id}")
        return {
            'success': False,
            'error': "Gagal mengirim pesan",
            'server_id': server_id
        }
    
    def get_server_logs(self, server_id, limit=20):
        """
        Mendapatkan log aktivitas server
        
        Args:
            server_id (str): ID server
            limit (int): Jumlah log yang akan diambil
        
        Returns:
            list: Daftar log aktivitas
        """
        logs = database.get_activity_logs(server_id, limit)
        return logs
    
    def test_server_connection(self, server_url):
        """
        Menguji koneksi ke URL server
        
        Args:
            server_url (str): URL server yang akan diuji
        
        Returns:
            dict: Hasil pengujian koneksi
        """
        try:
            success, message, error = asyncio.run(test_server_connection(server_url))
            
            logger.info(f"Connection test to {server_url}: {success}, {message}")
            return {
                'success': success,
                'message': message,
                'error': error
            }
        except Exception as e:
            logger.error(f"Error testing connection to {server_url}: {str(e)}")
            return {
                'success': False,
                'message': "Error saat menguji koneksi",
                'error': str(e)
            }
    
    def connect_to_all_websocket_servers(self):
        """
        Menghubungkan ke semua server WebSocket yang ada di database
        
        Returns:
            int: Jumlah server yang berhasil dihubungkan
        """
        if not self.ws_manager:
            logger.error("WebSocketManager not initialized")
            return 0
        
        count = self.ws_manager.connect_to_all_servers()
        logger.info(f"Connected to {count} WebSocket servers")
        return count
    
    def disconnect_from_all_servers(self):
        """
        Memutuskan semua koneksi WebSocket
        """
        if not self.ws_manager:
            logger.error("WebSocketManager not initialized")
            return
        
        self.ws_manager.disconnect_from_all_servers()
        logger.info("Disconnected from all servers")