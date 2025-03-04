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
    // First, get server details to obtain WebSocket URL
    const serverDetail = await api.getServer(serverId);

    if (!serverDetail?.url) {
      throw new Error('Server URL not found');
    }

    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(serverDetail.url);

        ws.onopen = () => {
          // Send the CREATE user message with the required fields
          ws.send(JSON.stringify({
            type: "USER",
            action: "CREATE",
            data: {
              name: userData.name,
              email: userData.email,
              password_surfebe: userData.password_surfebe
            }
          }));
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data);
          ws.close();

          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.message || 'Failed to add user'));
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          ws.close();
          reject(error);
        };

        // Timeout for hanging connections
        setTimeout(() => {
          if (ws.readyState !== WebSocket.CLOSED) {
            ws.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000);

      } catch (error) {
        console.error('Error establishing WebSocket connection:', error);
        reject(error);
      }
    });
  },

  updateUserOnServer: async (serverId, userEmail, userData) => {
    // First, get server details to obtain WebSocket URL
    const serverDetail = await api.getServer(serverId);
    
    if (!serverDetail?.url) {
      throw new Error('Server URL not found');
    }
    
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(serverDetail.url);
        
        ws.onopen = () => {
          // Send the UPDATE user message with email and updated data
          ws.send(JSON.stringify({
            type: "USER",
            action: "UPDATE",
            email: userEmail,
            data: {
              name: userData.name,
              password_surfebe: userData.password_surfebe
            }
          }));
        };
        
        ws.onmessage = (event) => {
          const response = JSON.parse(event.data);
          ws.close();
          
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.message || 'Failed to update user'));
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          ws.close();
          reject(error);
        };
        
        // Timeout for hanging connections
        setTimeout(() => {
          if (ws.readyState !== WebSocket.CLOSED) {
            ws.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000);
        
      } catch (error) {
        console.error('Error establishing WebSocket connection:', error);
        reject(error);
      }
    });
  },

  deleteUserFromServer: async (serverId, userEmail) => {
    // First, get server details to obtain WebSocket URL
    const serverDetail = await api.getServer(serverId);
    
    if (!serverDetail?.url) {
      throw new Error('Server URL not found');
    }
    
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(serverDetail.url);
        
        ws.onopen = () => {
          // Send the DELETE user message with the email
          ws.send(JSON.stringify({
            type: "USER",
            action: "DELETE",
            email: userEmail
          }));
        };
        
        ws.onmessage = (event) => {
          const response = JSON.parse(event.data);
          ws.close();
          
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.message || 'Failed to delete user'));
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          ws.close();
          reject(error);
        };
        
        // Timeout for hanging connections
        setTimeout(() => {
          if (ws.readyState !== WebSocket.CLOSED) {
            ws.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000);
        
      } catch (error) {
        console.error('Error establishing WebSocket connection:', error);
        reject(error);
      }
    });
  }
};


export default api;