from flask import request, jsonify
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Service yang akan diinject
server_service = None

def register_server_api_routes(blueprint):
    """
    Register semua route untuk server API
    
    Args:
        blueprint: Flask Blueprint untuk mendaftarkan routes
    """
    
    @blueprint.route('/api/servers', methods=['GET'])
    def get_servers():
        """Mendapatkan semua server"""
        servers = server_service.get_all_servers()
        return jsonify(servers)

    @blueprint.route('/api/servers/<server_id>', methods=['GET'])
    def get_server(server_id):
        """Mendapatkan server berdasarkan ID"""
        server = server_service.get_server_by_id(server_id)
        if server:
            return jsonify(server)
        return jsonify({"error": "Server tidak ditemukan"}), 404

    @blueprint.route('/api/servers', methods=['POST'])
    def add_server():
        """Menambahkan server baru"""
        new_server = request.json
        server = server_service.add_server(new_server)
        
        return jsonify(server), 201

    @blueprint.route('/api/servers/<server_id>', methods=['PUT'])
    def update_server(server_id):
        """Memperbarui server yang ada"""
        data = request.json
        server = server_service.update_server(server_id, data)
        
        if server:
            return jsonify(server)
        return jsonify({"error": "Server tidak ditemukan"}), 404

    @blueprint.route('/api/servers/<server_id>', methods=['DELETE'])
    def delete_server(server_id):
        """Menghapus server"""
        deleted = server_service.delete_server(server_id)
        
        if deleted:
            return jsonify({"message": "Server berhasil dihapus"})
        return jsonify({"error": "Server tidak ditemukan"}), 404

    @blueprint.route('/api/servers/<server_id>/ping', methods=['GET'])
    def ping_server(server_id):
        """Ping server untuk memeriksa status"""
        result = server_service.ping_server(server_id)
        return jsonify(result)

    @blueprint.route('/api/servers/<server_id>/connect', methods=['POST'])
    def connect_to_server(server_id):
        """Menghubungkan ke server WebSocket"""
        result = server_service.connect_to_server(server_id)
        
        if result.get('success', False):
            return jsonify(result)
        return jsonify(result), 400

    @blueprint.route('/api/servers/<server_id>/disconnect', methods=['POST'])
    def disconnect_from_server(server_id):
        """Memutuskan koneksi dari server WebSocket"""
        result = server_service.disconnect_from_server(server_id)
        return jsonify(result)

    @blueprint.route('/api/servers/<server_id>/send', methods=['POST'])
    def send_message_to_server(server_id):
        """Mengirim pesan ke server WebSocket"""
        message = request.json
        result = server_service.send_message_to_server(server_id, message)
        
        if result.get('success', False):
            return jsonify(result)
        return jsonify(result), 500

    @blueprint.route('/api/servers/<server_id>/logs', methods=['GET'])
    def get_server_logs(server_id):
        """Mendapatkan log aktivitas server"""
        limit = request.args.get('limit', 20, type=int)
        logs = server_service.get_server_logs(server_id, limit)
        return jsonify(logs)
    
    logger.info("Server API routes registered")

def init_socket_events(socketio, server_service_instance):
    """
    Mendaftarkan event handler untuk socket.io
    
    Args:
        socketio: Flask-SocketIO instance
        server_service_instance: ServerService instance
    """
    @socketio.on('test_connection')
    def handle_test_connection(data):
        """Test koneksi ke server"""
        server_url = data.get('url', '')
        result = server_service_instance.test_server_connection(server_url)
        socketio.emit('connection_tested', result)
    
    @socketio.on('ping_server')
    def handle_ping_server(data):
        """Ping server"""
        server_id = data.get('server_id')
        if not server_id:
            socketio.emit('ping_result', {
                'success': False,
                'error': 'Server ID diperlukan'
            })
            return
        
        result = server_service_instance.ping_server(server_id)
        socketio.emit('ping_result', result)
    
    @socketio.on('connect_to_server')
    def handle_connect_to_server(data):
        """Menghubungkan ke server WebSocket"""
        server_id = data.get('server_id')
        if not server_id:
            socketio.emit('connection_result', {
                'success': False,
                'error': 'Server ID diperlukan'
            })
            return
        
        result = server_service_instance.connect_to_server(server_id)
        socketio.emit('connection_result', result)
    
    @socketio.on('disconnect_from_server')
    def handle_disconnect_from_server(data):
        """Memutuskan koneksi dari server WebSocket"""
        server_id = data.get('server_id')
        if not server_id:
            socketio.emit('disconnection_result', {
                'success': False,
                'error': 'Server ID diperlukan'
            })
            return
        
        result = server_service_instance.disconnect_from_server(server_id)
        socketio.emit('disconnection_result', result)
        
        # Perbarui status server jika perlu
        if result.get('success', False):
            server = server_service_instance.get_server_by_id(server_id)
            socketio.emit('server_status_changed', {
                'server_id': server_id,
                'status': 'Disconnected',
                'server': server
            }, broadcast=True)
    
    @socketio.on('send_to_server')
    def handle_send_to_server(data):
        """Mengirim pesan ke server WebSocket"""
        server_id = data.get('server_id')
        message = data.get('message')
        
        if not server_id or not message:
            socketio.emit('send_result', {
                'success': False,
                'error': 'Server ID dan pesan diperlukan'
            })
            return
        
        result = server_service_instance.send_message_to_server(server_id, message)
        socketio.emit('send_result', result)
    
    logger.info("Socket.IO events registered")

def set_server_service(service):
    """
    Set server service untuk digunakan oleh API
    
    Args:
        service: ServerService instance
    """
    global server_service
    server_service = service
    logger.info("Server service set for API")