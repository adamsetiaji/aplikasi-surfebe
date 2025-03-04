import datetime

class ActivityLog:
    """
    Model untuk merepresentasikan log aktivitas server.
    """
    def __init__(self, id=None, server_id=None, time=None, activity=None,
                 timestamp=None):
        """
        Inisialisasi objek ActivityLog.
        
        Args:
            id (int): ID unik log (auto-generated)
            server_id (str): ID server terkait
            time (str): Waktu aktivitas (format: "08:30 AM")
            activity (str): Deskripsi aktivitas
            timestamp (datetime): Timestamp saat log dibuat
        """
        self.id = id
        self.server_id = server_id
        self.time = time or datetime.datetime.now().strftime("%I:%M %p")
        self.activity = activity
        self.timestamp = timestamp or datetime.datetime.now()
    
    @classmethod
    def from_dict(cls, data):
        """
        Membuat objek ActivityLog dari dictionary
        
        Args:
            data (dict): Data log dalam bentuk dictionary
        
        Returns:
            ActivityLog: Objek ActivityLog baru
        """
        # Parse timestamp jika ada dan dalam format string
        timestamp = data.get('timestamp')
        if isinstance(timestamp, str):
            try:
                timestamp = datetime.datetime.fromisoformat(timestamp)
            except (ValueError, TypeError):
                timestamp = None
        
        return cls(
            id=data.get('id'),
            server_id=data.get('server_id'),
            time=data.get('time'),
            activity=data.get('activity'),
            timestamp=timestamp
        )
    
    def to_dict(self):
        """
        Mengkonversi objek ActivityLog ke dictionary
        
        Returns:
            dict: Dictionary representasi dari ActivityLog
        """
        timestamp_str = None
        if isinstance(self.timestamp, datetime.datetime):
            timestamp_str = self.timestamp.isoformat()
        
        return {
            'id': self.id,
            'server_id': self.server_id,
            'time': self.time,
            'activity': self.activity,
            'timestamp': timestamp_str
        }
    
    def __repr__(self):
        """String representation dari objek ActivityLog"""
        return f"ActivityLog(time={self.time}, activity={self.activity})"