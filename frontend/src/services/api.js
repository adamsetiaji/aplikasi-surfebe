import axios from 'axios';

const api = {
  // Server operations
  getServers: async () => {
    const response = await axios.get('/api/servers');
    return response.data;
  },

  getServer: async (serverId) => {
    const response = await axios.get(`/api/servers/${serverId}`);
    return response.data;
  },

  addServer: async (serverData) => {
    const response = await axios.post('/api/servers', serverData);
    return response.data;
  },

  updateServer: async (serverId, serverData) => {
    const response = await axios.put(`/api/servers/${serverId}`, serverData);
    return response.data;
  },

  deleteServer: async (serverId) => {
    const response = await axios.delete(`/api/servers/${serverId}`);
    return response.data;
  },

  pingServer: async (serverId) => {
    const response = await axios.get(`/api/servers/${serverId}/ping`);
    return response.data;
  },

  // Server logs
  getServerLogs: async (serverId) => {
    const response = await axios.get(`/api/servers/${serverId}/logs`);
    return response.data;
  },
  // Tambahkan ke api.js
  connectServer: async (serverId) => {
    const response = await axios.post(`/api/servers/${serverId}/connect`);
    return response.data;
  },

  disconnectServer: async (serverId) => {
    const response = await axios.post(`/api/servers/${serverId}/disconnect`);
    return response.data;
  },

  sendMessageToServer: async (serverId, message) => {
    const response = await axios.post(`/api/servers/${serverId}/send`, message);
    return response.data;
  },

  // MANAGEMENT USERS
  getServerUsers: async (urlServerId) => {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(urlServerId);

        ws.onopen = () => {
          ws.send(JSON.stringify({
            type: "USER",
            action: "GET_ALL"
          }));
        };

        // Handler untuk menerima data
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          ws.close(); // Tutup koneksi setelah menerima data
          resolve(data);
        };

        // Handler untuk error
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          ws.close();
          reject(error);
        };

        // Timeout untuk mencegah koneksi menggantung
        setTimeout(() => {
          if (ws.readyState !== WebSocket.CLOSED) {
            ws.close();
            console.error('WebSocket connection timeout');
            resolve([]); // Kembalikan array kosong jika timeout
          }
        }, 5000);

      } catch (error) {
        console.error('Error establishing WebSocket connection:', error);
        resolve([]);
      }
    });
  },

  addUserToServer: async (serverId, userData) => {
    const response = await axios.post(`/api/servers/${serverId}/users`, userData);
    return response.data;
  },

  updateUserOnServer: async (serverId, userId, userData) => {
    const response = await axios.put(`/api/servers/${serverId}/users/${userId}`, userData);
    return response.data;
  },

  deleteUserFromServer: async (serverId, userId) => {
    const response = await axios.delete(`/api/servers/${serverId}/users/${userId}`);
    return response.data;
  }
};

export default api;