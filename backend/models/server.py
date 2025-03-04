import datetime

class Server:
    """
    Model untuk merepresentasikan server.
    """
    def __init__(self, id=None, name=None, url=None, type=None, status="Unknown", 
                 description=None, last_ping=None, last_connected=None):
        """
        Inisialisasi objek Server.
        
        Args:
            id (str): ID unik server
            name (str): Nama server
            url (str): URL server
            type (str): Tipe server (Production, Testing, Development)
            status (str): Status server (Online, Offline, Maintenance)
            description (str): Deskripsi server
            last_ping (int): Ping terakhir dalam ms
            last_connected (str): Waktu terakhir terhubung
        """
        self.id = id
        self.name = name
        self.url = url
        self.type = type
        self.status = status
        self.description = description
        self.last_ping = last_ping
        self.last_connected = last_connected
    
    @classmethod
    def from_dict(cls, data):
        """
        Membuat objek Server dari dictionary
        
        Args:
            data (dict): Data server dalam bentuk dictionary
        
        Returns:
            Server: Objek Server baru
        """
        return cls(
            id=data.get('id'),
            name=data.get('name'),
            url=data.get('url'),
            type=data.get('type'),
            status=data.get('status', 'Unknown'),
            description=data.get('description'),
            last_ping=data.get('last_ping'),
            last_connected=data.get('last_connected')
        )
    
    def to_dict(self):
        """
        Mengkonversi objek Server ke dictionary
        
        Returns:
            dict: Dictionary representasi dari Server
        """
        return {
            'id': self.id,
            'name': self.name,
            'url': self.url,
            'type': self.type,
            'status': self.status,
            'description': self.description,
            'last_ping': self.last_ping,
            'last_connected': self.last_connected
        }
    
    def update(self, data):
        """
        Update atribut Server dari dictionary
        
        Args:
            data (dict): Data untuk update
        """
        for key, value in data.items():
            if hasattr(self, key) and key != 'id':  # Tidak update ID
                setattr(self, key, value)
    
    def is_websocket(self):
        """
        Cek apakah server menggunakan protokol WebSocket
        
        Returns:
            bool: True jika server menggunakan WebSocket, False jika tidak
        """
        return self.url and (self.url.startswith('ws://') or self.url.startswith('wss://'))
    
    def __repr__(self):
        """String representation dari objek Server"""
        return f"Server(id={self.id}, name={self.name}, url={self.url}, status={self.status})"