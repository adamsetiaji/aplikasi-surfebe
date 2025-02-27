/**
 * API service for communicating with the backend
 * 
 * This service will use PyWebView API in production
 * and mock data in development mode
 */

// Mock data for development mode
const mockServers = [
    {
      id: 1,
      name: "Production Server",
      url: "https://api.example.com/v1",
      description: "Main production server",
      server_type: "Production",
      status: "Online",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z"
    }
  ];
  
  const mockUsers = [
    {
      id: 1,
      server_id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      role: "Admin",
      status: "Active",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z"
    },
    {
      id: 2,
      server_id: 1,
      name: "Jane Smith",
      email: "jane.smith@example.com",
      role: "Manager",
      status: "Active",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z"
    },
    {
      id: 3,
      server_id: 1,
      name: "Robert Johnson",
      email: "robert.j@example.com",
      role: "User",
      status: "Inactive",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z"
    },
    {
      id: 4,
      server_id: 1,
      name: "Maria Garcia",
      email: "maria.g@example.com",
      role: "User",
      status: "Active",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z"
    },
    {
      id: 5,
      server_id: 1,
      name: "David Lee",
      email: "david.lee@example.com",
      role: "Editor",
      status: "Active",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z"
    },
    {
      id: 6,
      server_id: 1,
      name: "Lisa Wang",
      email: "lisa.w@example.com",
      role: "User",
      status: "Pending",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z"
    }
  ];
  
  const mockActivityLogs = [
    {
      id: 1,
      server_id: 1,
      activity: "User data updated",
      time: "09:45 AM",
      timestamp: "2023-01-01T09:45:00.000Z"
    },
    {
      id: 2,
      server_id: 1,
      activity: "New user added",
      time: "09:30 AM",
      timestamp: "2023-01-01T09:30:00.000Z"
    },
    {
      id: 3,
      server_id: 1,
      activity: "Report generated",
      time: "09:15 AM",
      timestamp: "2023-01-01T09:15:00.000Z"
    }
  ];
  
  // API wrapper
  const api = {
    // Server Management APIs
    getServers: async () => {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          data: mockServers
        };
      }
      
      // In production, use PyWebView API
      if (window.pywebview && window.pywebview.api) {
        try {
          const result = await window.pywebview.api.get_servers();
          return result;
        } catch (err) {
          console.error('Error calling get_servers API:', err);
          return {
            success: false,
            error: 'Failed to get servers. Please try again.'
          };
        }
      }
      
      return {
        success: false,
        error: 'PyWebView API not available'
      };
    },
    
    getServerById: async (serverId) => {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        const server = mockServers.find(s => s.id === parseInt(serverId));
        
        if (server) {
          return {
            success: true,
            data: server
          };
        } else {
          return {
            success: false,
            error: 'Server not found'
          };
        }
      }
      
      // In production, filter from the full list
      if (window.pywebview && window.pywebview.api) {
        try {
          const result = await window.pywebview.api.get_servers();
          if (result.success) {
            const server = result.data.find(s => s.id === parseInt(serverId));
            
            if (server) {
              return {
                success: true,
                data: server
              };
            } else {
              return {
                success: false,
                error: 'Server not found'
              };
            }
          } else {
            return result;
          }
        } catch (err) {
          console.error('Error calling get_server_by_id:', err);
          return {
            success: false,
            error: 'Failed to get server. Please try again.'
          };
        }
      }
      
      return {
        success: false,
        error: 'PyWebView API not available'
      };
    },
    
    addServer: async (serverData) => {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        // Simulate adding a server
        const newServer = {
          ...serverData,
          id: mockServers.length + 1,
          status: "Offline",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        mockServers.push(newServer);
        
        return {
          success: true,
          data: newServer
        };
      }
      
      // In production, use PyWebView API
      if (window.pywebview && window.pywebview.api) {
        try {
          const result = await window.pywebview.api.add_server(serverData);
          return result;
        } catch (err) {
          console.error('Error calling add_server API:', err);
          return {
            success: false,
            error: 'Failed to add server. Please try again.'
          };
        }
      }
      
      return {
        success: false,
        error: 'PyWebView API not available'
      };
    },
    
    editServer: async (serverId, serverData) => {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        const index = mockServers.findIndex(s => s.id === parseInt(serverId));
        
        if (index !== -1) {
          const updatedServer = {
            ...mockServers[index],
            ...serverData,
            updated_at: new Date().toISOString()
          };
          
          mockServers[index] = updatedServer;
          
          return {
            success: true,
            data: updatedServer
          };
        } else {
          return {
            success: false,
            error: 'Server not found'
          };
        }
      }
      
      // In production, use PyWebView API
      if (window.pywebview && window.pywebview.api) {
        try {
          const result = await window.pywebview.api.edit_server(serverId, serverData);
          return result;
        } catch (err) {
          console.error('Error calling edit_server API:', err);
          return {
            success: false,
            error: 'Failed to edit server. Please try again.'
          };
        }
      }
      
      return {
        success: false,
        error: 'PyWebView API not available'
      };
    },
    
    deleteServer: async (serverId) => {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        const index = mockServers.findIndex(s => s.id === parseInt(serverId));
        
        if (index !== -1) {
          mockServers.splice(index, 1);
          
          return {
            success: true
          };
        } else {
          return {
            success: false,
            error: 'Server not found'
          };
        }
      }
      
      // In production, use PyWebView API
      if (window.pywebview && window.pywebview.api) {
        try {
          const result = await window.pywebview.api.delete_server(serverId);
          return result;
        } catch (err) {
          console.error('Error calling delete_server API:', err);
          return {
            success: false,
            error: 'Failed to delete server. Please try again.'
          };
        }
      }
      
      return {
        success: false,
        error: 'PyWebView API not available'
      };
    },
    
    testConnection: async (serverUrl) => {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        // Simulate testing connection
        // In development mode, we'll return success for valid URLs
        const urlPattern = /^(https?:\/\/|wss?:\/\/).+/i;
        if (urlPattern.test(serverUrl)) {
          return {
            success: true,
            ping: Math.floor(Math.random() * 100) + 10 // Random ping between 10-110ms
          };
        } else {
          return {
            success: false,
            error: 'Invalid URL format'
          };
        }
      }
      
      // In production, use PyWebView API
      if (window.pywebview && window.pywebview.api) {
        try {
          const result = await window.pywebview.api.test_connection(serverUrl);
          return result;
        } catch (err) {
          console.error('Error calling test_connection API:', err);
          return {
            success: false,
            error: 'Failed to test connection. Please try again.'
          };
        }
      }
      
      return {
        success: false,
        error: 'PyWebView API not available'
      };
    },
    
    // User Management APIs
    getUsers: async (serverId) => {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        const serverUsers = mockUsers.filter(user => user.server_id === parseInt(serverId));
        
        return {
          success: true,
          data: serverUsers
        };
      }
      
      // In production, use PyWebView API
      if (window.pywebview && window.pywebview.api) {
        try {
          const result = await window.pywebview.api.get_users(serverId);
          return result;
        } catch (err) {
          console.error('Error calling get_users API:', err);
          return {
            success: false,
            error: 'Failed to get users. Please try again.'
          };
        }
      }
      
      return {
        success: false,
        error: 'PyWebView API not available'
      };
    },
    
    addUser: async (serverId, userData) => {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        // Simulate adding a user
        const newUser = {
          ...userData,
          id: mockUsers.length + 1,
          server_id: parseInt(serverId),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        mockUsers.push(newUser);
        
        // Add to activity log
        mockActivityLogs.unshift({
          id: mockActivityLogs.length + 1,
          server_id: parseInt(serverId),
          activity: `New user ${newUser.name} added`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date().toISOString()
        });
        
        return {
          success: true,
          data: newUser
        };
      }
      
      // In production, use PyWebView API
      if (window.pywebview && window.pywebview.api) {
        try {
          const result = await window.pywebview.api.add_user(serverId, userData);
          return result;
        } catch (err) {
          console.error('Error calling add_user API:', err);
          return {
            success: false,
            error: 'Failed to add user. Please try again.'
          };
        }
      }
      
      return {
        success: false,
        error: 'PyWebView API not available'
      };
    },
    
    editUser: async (serverId, userId, userData) => {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        const index = mockUsers.findIndex(u => u.id === parseInt(userId) && u.server_id === parseInt(serverId));
        
        if (index !== -1) {
          const updatedUser = {
            ...mockUsers[index],
            ...userData,
            updated_at: new Date().toISOString()
          };
          
          mockUsers[index] = updatedUser;
          
          // Add to activity log
          mockActivityLogs.unshift({
            id: mockActivityLogs.length + 1,
            server_id: parseInt(serverId),
            activity: `User ${updatedUser.name} updated`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString()
          });
          
          return {
            success: true,
            data: updatedUser
          };
        } else {
          return {
            success: false,
            error: 'User not found'
          };
        }
      }
      
      // In production, use PyWebView API
      if (window.pywebview && window.pywebview.api) {
        try {
          const result = await window.pywebview.api.edit_user(serverId, userId, userData);
          return result;
        } catch (err) {
          console.error('Error calling edit_user API:', err);
          return {
            success: false,
            error: 'Failed to edit user. Please try again.'
          };
        }
      }
      
      return {
        success: false,
        error: 'PyWebView API not available'
      };
    },
    
    deleteUser: async (serverId, userId) => {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        const index = mockUsers.findIndex(u => u.id === parseInt(userId) && u.server_id === parseInt(serverId));
        
        if (index !== -1) {
          const deletedUser = mockUsers[index];
          mockUsers.splice(index, 1);
          
          // Add to activity log
          mockActivityLogs.unshift({
            id: mockActivityLogs.length + 1,
            server_id: parseInt(serverId),
            activity: `User ${deletedUser.name} deleted`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString()
          });
          
          return {
            success: true
          };
        } else {
          return {
            success: false,
            error: 'User not found'
          };
        }
      }
      
      // In production, use PyWebView API
      if (window.pywebview && window.pywebview.api) {
        try {
          const result = await window.pywebview.api.delete_user(serverId, userId);
          return result;
        } catch (err) {
          console.error('Error calling delete_user API:', err);
          return {
            success: false,
            error: 'Failed to delete user. Please try again.'
          };
        }
      }
      
      return {
        success: false,
        error: 'PyWebView API not available'
      };
    },
    
    // Activity Log APIs
    getActivityLog: async (serverId) => {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        const logs = mockActivityLogs.filter(log => log.server_id === parseInt(serverId));
        
        return {
          success: true,
          data: logs
        };
      }
      
      // In production, use PyWebView API
      if (window.pywebview && window.pywebview.api) {
        try {
          const result = await window.pywebview.api.get_activity_log(serverId);
          return result;
        } catch (err) {
          console.error('Error calling get_activity_log API:', err);
          return {
            success: false,
            error: 'Failed to get activity log. Please try again.'
          };
        }
      }
      
      return {
        success: false,
        error: 'PyWebView API not available'
      };
    }
  };
  
  export default api;