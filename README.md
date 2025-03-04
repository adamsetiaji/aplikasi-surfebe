# Server Dashboard App - PyWebView + React + WebSocket

## Struktur File
```
server-dashboard-app/
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── server_api.py
│   │   └── user_api.py
│   ├── websocket/
│   │   ├── __init__.py
│   │   └── socket_handler.py
│   ├── database.py
│   ├── main.py
│   └── server_manager.db  # SQLite database (dibuat otomatis)
├── frontend/
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── ...            # (file React)
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── README.md
└── requirements.txt
```

## Cara Menjalankan Aplikasi

### Setup Backend

1. Install dependensi Python:
   ```
   pip install -r requirements.txt
   ```

2. Database SQLite akan dibuat otomatis saat aplikasi pertama kali dijalankan.

### Setup Frontend (Development)

1. Masuk ke direktori frontend:
   ```
   cd frontend
   ```

2. Install dependensi Node.js:
   ```
   npm install
   ```

3. Jalankan server development:
   ```
   npm run dev
   ```

### Build Frontend (Production)

1. Build frontend:
   ```
   cd frontend
   npm run build
   ```

### Menjalankan Aplikasi

1. Jalankan backend:
   ```
   python backend/main.py
   ```

2. Jika frontend sedang dalam pengembangan, Anda juga perlu menjalankan server Vite (`npm run dev`).

3. Untuk mode produksi (setelah build frontend), ubah di `main.py` untuk menggunakan direktori `dist` alih-alih server Flask.

## Fitur Aplikasi

1. **Manajemen Server**
   - Tambah/Edit/Hapus server
   - Tes koneksi server
   - Ping server untuk memeriksa status

2. **Koneksi WebSocket**
   - Koneksi otomatis ke server WebSocket saat aplikasi dimulai
   - Kirim/terima pesan dari server WebSocket
   - Log aktivitas server

3. **Tampilan**
   - Daftar server dengan status real-time
   - Detail server dengan informasi koneksi
   - Log aktivitas untuk setiap server

## Teknis

1. **Backend**
   - PyWebView: Untuk menjalankan aplikasi desktop
   - Flask: Untuk API RESTful
   - Flask-SocketIO: Untuk komunikasi real-time dengan frontend
   - SQLite: Database untuk menyimpan konfigurasi server
   - Websockets: Library untuk koneksi WebSocket ke server eksternal

2. **Frontend**
   - React: Library UI
   - Vite: Build tool
   - Socket.IO: Komunikasi real-time dengan backend
   - Styled Components: Styling

## Catatan Pengembangan

- Backend dan frontend dapat dikembangkan secara terpisah.
- Untuk pengembangan backend, gunakan mode debug PyWebView.
- Untuk pengembangan frontend, jalankan Vite dev server.
- Untuk deployment, build frontend dan gunakan file statis.