/**
 * WebSocket service for realtime communication with the backend
 */

class WebSocketService {
    constructor() {
      this.socket = null;
      this.connected = false;
      this.messageHandlers = [];
      this.connectionHandlers = [];
      this.reconnectInterval = null;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 5;
      this.reconnectDelay = 3000; // 3 seconds
    }
    
    connect(port = 8765) {
      // Close existing connection if any
      if (this.socket) {
        this.close();
      }
      
      try {
        this.socket = new WebSocket(`ws://localhost:${port}`);
        
        this.socket.onopen = () => {
          console.log('WebSocket connection established');
          this.connected = true;
          this.reconnectAttempts = 0;
          this.notifyConnectionHandlers(true);
          
          // Clear reconnect interval if it exists
          if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
          }
        };
        
        this.socket.onclose = () => {
          console.log('WebSocket connection closed');
          this.connected = false;
          this.notifyConnectionHandlers(false);
          
          // Only attempt to reconnect if we're not manually closing
          if (!this.manualClose) {
            this.scheduleReconnect();
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.notifyMessageHandlers(data);
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };
        
        return true;
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        return false;
      }
    }
    
    close() {
      if (this.socket) {
        this.manualClose = true;
        this.socket.close();
        this.socket = null;
        this.connected = false;
        
        // Clear reconnect interval if it exists
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }
      }
    }
    
    scheduleReconnect() {
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
      }
      
      this.reconnectInterval = setInterval(() => {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log('Maximum reconnect attempts reached');
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
          return;
        }
        
        console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
        this.reconnectAttempts++;
        this.manualClose = false;
        this.connect();
      }, this.reconnectDelay);
    }
    
    sendMessage(message) {
      if (this.socket && this.connected) {
        this.socket.send(typeof message === 'string' ? message : JSON.stringify(message));
        return true;
      } else {
        console.error('Cannot send message, WebSocket is not connected');
        return false;
      }
    }
    
    addMessageHandler(handler) {
      if (typeof handler === 'function') {
        this.messageHandlers.push(handler);
        return true;
      }
      return false;
    }
    
    removeMessageHandler(handler) {
      const index = this.messageHandlers.indexOf(handler);
      if (index !== -1) {
        this.messageHandlers.splice(index, 1);
        return true;
      }
      return false;
    }
    
    addConnectionHandler(handler) {
      if (typeof handler === 'function') {
        this.connectionHandlers.push(handler);
        return true;
      }
      return false;
    }
    
    removeConnectionHandler(handler) {
      const index = this.connectionHandlers.indexOf(handler);
      if (index !== -1) {
        this.connectionHandlers.splice(index, 1);
        return true;
      }
      return false;
    }
    
    notifyMessageHandlers(data) {
      this.messageHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (e) {
          console.error('Error in message handler:', e);
        }
      });
    }
    
    notifyConnectionHandlers(isConnected) {
      this.connectionHandlers.forEach(handler => {
        try {
          handler(isConnected);
        } catch (e) {
          console.error('Error in connection handler:', e);
        }
      });
    }
    
    isConnected() {
      return this.connected;
    }
    
    ping() {
      const startTime = Date.now();
      return new Promise((resolve, reject) => {
        if (!this.socket || !this.connected) {
          reject(new Error('WebSocket is not connected'));
          return;
        }
        
        const pingHandler = (data) => {
          if (data.action === 'pong') {
            const endTime = Date.now();
            const pingTime = endTime - startTime;
            
            this.removeMessageHandler(pingHandler);
            resolve(pingTime);
          }
        };
        
        this.addMessageHandler(pingHandler);
        
        // Set timeout for ping response
        setTimeout(() => {
          this.removeMessageHandler(pingHandler);
          reject(new Error('Ping timeout'));
        }, 5000);
        
        this.sendMessage({ action: 'ping' });
      });
    }
  }
  
  // Export a singleton instance
  const websocketService = new WebSocketService();
  export default websocketService;