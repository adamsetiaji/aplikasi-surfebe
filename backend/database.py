# backend/database.py
import sqlite3
import os
import datetime
import logging

# Import konfigurasi
from config import DATABASE_PATH

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_path():
    """Mendapatkan path absolut untuk file database"""
    return DATABASE_PATH

def init_db():
    """Inisialisasi database dengan tabel jika belum ada"""
    db_path = get_db_path()
    db_exists = os.path.exists(db_path)
    
    # Buat direktori jika tidak ada
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Buat tabel servers
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        description TEXT,
        last_ping INTEGER,
        last_connected TEXT
    )
    ''')
    
    # Buat tabel activity logs untuk mencatat aktivitas koneksi server
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT,
        time TEXT NOT NULL,
        activity TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (server_id) REFERENCES servers (id) ON DELETE CASCADE
    )
    ''')
    
    # Aktifkan dukungan kunci asing
    cursor.execute("PRAGMA foreign_keys = ON")
    
    conn.commit()
    conn.close()
    
    logger.info(f"Database initialized at {db_path}")
    
    # Tidak perlu lagi menginisialisasi data sampel
    # if not db_exists:
    #     logger.info("New database created, initializing with sample data")
    #     init_sample_data()

def get_connection():
    """Dapatkan koneksi ke database"""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row  # Mengembalikan row sebagai dictionary
    return conn

def dict_factory(cursor, row):
    """Konversi hasil row SQL ke dictionary"""
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

# Operasi server
def get_servers():
    """Dapatkan semua server dari database"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM servers ORDER BY id")
    servers = cursor.fetchall()
    
    conn.close()
    return servers

def get_server(server_id):
    """Dapatkan server berdasarkan ID"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM servers WHERE id = ?", (server_id,))
    server = cursor.fetchone()
    
    conn.close()
    return server

def add_server(server_data):
    """Tambahkan server baru ke database"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Generate ID jika tidak disediakan
    if 'id' not in server_data or not server_data['id']:
        cursor.execute("SELECT COALESCE(MAX(CAST(id AS INTEGER)), 0) FROM servers")
        max_id = cursor.fetchone()[0]
        server_data['id'] = f"{int(max_id) + 1:03d}"
    
    # Set status awal jika tidak disediakan
    if 'status' not in server_data or not server_data['status']:
        server_data['status'] = 'Unknown'
    
    cursor.execute(
        """INSERT INTO servers 
           (id, name, url, type, status, description, last_ping, last_connected) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            server_data['id'],
            server_data['name'],
            server_data['url'],
            server_data['type'],
            server_data.get('status', 'Unknown'),
            server_data.get('description', ''),
            server_data.get('last_ping', None),
            server_data.get('last_connected', None)
        )
    )
    
    # Tambahkan log aktivitas
    now = datetime.datetime.now()
    time_str = now.strftime("%I:%M %p")
    
    cursor.execute(
        "INSERT INTO activity_logs (server_id, time, activity) VALUES (?, ?, ?)",
        (
            server_data['id'],
            time_str,
            f"Server added: {server_data['name']}"
        )
    )
    
    conn.commit()
    conn.close()
    
    logger.info(f"Server added: {server_data['id']} - {server_data['name']}")
    
    return get_server(server_data['id'])

def update_server(server_id, server_data):
    """Update server yang ada"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Buat query SQL secara dinamis berdasarkan field yang disediakan
    update_fields = []
    update_values = []
    
    valid_fields = ['name', 'url', 'type', 'status', 'description', 'last_ping', 'last_connected']
    
    for key, value in server_data.items():
        if key != 'id' and key in valid_fields:
            update_fields.append(f"{key} = ?")
            update_values.append(value)
    
    if not update_fields:
        conn.close()
        return get_server(server_id)
    
    update_values.append(server_id)
    
    cursor.execute(
        f"UPDATE servers SET {', '.join(update_fields)} WHERE id = ?",
        tuple(update_values)
    )
    
    # Tambahkan log aktivitas jika ada perubahan
    if cursor.rowcount > 0:
        now = datetime.datetime.now()
        time_str = now.strftime("%I:%M %p")
        
        # Dapatkan nama server untuk log
        cursor.execute("SELECT name FROM servers WHERE id = ?", (server_id,))
        server_name = cursor.fetchone()[0]
        
        cursor.execute(
            "INSERT INTO activity_logs (server_id, time, activity) VALUES (?, ?, ?)",
            (
                server_id,
                time_str,
                f"Server updated: {server_name}"
            )
        )
        
        logger.info(f"Server updated: {server_id} - {server_name}")
    
    conn.commit()
    conn.close()
    
    return get_server(server_id)

def delete_server(server_id):
    """Hapus server dan data terkait"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Dapatkan nama server untuk log sebelum menghapus
    cursor.execute("SELECT name FROM servers WHERE id = ?", (server_id,))
    server = cursor.fetchone()
    
    if not server:
        conn.close()
        return False
    
    server_name = server[0]
    
    # Hapus server (kaskade kunci asing akan menangani penghapusan terkait)
    cursor.execute("DELETE FROM servers WHERE id = ?", (server_id,))
    deleted = cursor.rowcount > 0
    
    conn.commit()
    conn.close()
    
    if deleted:
        logger.info(f"Server deleted: {server_id} - {server_name}")
    
    return deleted

# Operasi log aktivitas
def get_activity_logs(server_id=None, limit=20):
    """Dapatkan log aktivitas untuk server atau semua log jika server_id None"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    if server_id:
        cursor.execute(
            """SELECT time, activity FROM activity_logs 
               WHERE server_id = ? ORDER BY timestamp DESC LIMIT ?""", 
            (server_id, limit)
        )
    else:
        cursor.execute(
            """SELECT al.time, al.activity, s.name as server_name 
               FROM activity_logs al
               LEFT JOIN servers s ON al.server_id = s.id
               ORDER BY al.timestamp DESC LIMIT ?""", 
            (limit,)
        )
    
    logs = cursor.fetchall()
    
    conn.close()
    return logs

def add_activity_log(server_id, activity):
    """Tambahkan entri log aktivitas baru"""
    conn = get_connection()
    cursor = conn.cursor()
    
    now = datetime.datetime.now()
    time_str = now.strftime("%I:%M %p")
    
    cursor.execute(
        "INSERT INTO activity_logs (server_id, time, activity) VALUES (?, ?, ?)",
        (server_id, time_str, activity)
    )
    
    conn.commit()
    conn.close()
    
    logger.info(f"Activity log added: {server_id} - {activity}")

def update_server_status(server_id, status, ping_ms=None):
    """Update status server dan waktu ping terakhir"""
    conn = get_connection()
    cursor = conn.cursor()
    
    now = datetime.datetime.now()
    time_str = now.strftime("%Y-%m-%d %H:%M:%S")
    
    # Dapatkan status saat ini untuk membandingkan
    cursor.execute("SELECT status FROM servers WHERE id = ?", (server_id,))
    server_data = cursor.fetchone()
    
    if not server_data:
        conn.close()
        return None
    
    current_status = server_data[0]
    
    # Update hanya jika status berubah atau ping diperbarui
    if current_status != status or ping_ms is not None:
        cursor.execute(
            """UPDATE servers SET 
               status = ?, 
               last_ping = ?,
               last_connected = ?
               WHERE id = ?""",
            (status, ping_ms, time_str if status == 'Online' else None, server_id)
        )
        
        # Tambahkan log aktivitas jika status berubah
        if current_status != status:
            log_time = now.strftime("%I:%M %p")
            
            cursor.execute(
                "INSERT INTO activity_logs (server_id, time, activity) VALUES (?, ?, ?)",
                (
                    server_id,
                    log_time,
                    f"Server status changed to {status}" + 
                    (f" (ping: {ping_ms}ms)" if ping_ms is not None else "")
                )
            )
            
            logger.info(f"Server status changed: {server_id} - {current_status} -> {status}")
    
    conn.commit()
    conn.close()
    
    return get_server(server_id)

# Hapus fungsi init_sample_data() karena tidak lagi dibutuhkan