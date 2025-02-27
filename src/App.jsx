import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/Header';
import ServerManagement from './components/ServerManagement';
import UserDashboard from './components/UserDashboard';
import WebSocketContext from './contexts/WebSocketContext';
import ServerContext from './contexts/ServerContext';

function App() {
  const [websocket, setWebsocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [appInfo, setAppInfo] = useState({
    appName: 'Aplikasi ABC',
    version: 'v.1.0.0'
  });
  
  // Current server context
  const [currentServer, setCurrentServer] = useState(null);
  
  // Initialize application
  useEffect(() => {
    // In development mode, we'll skip the PyWebView API calls
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      console.log('Running in development mode');
      initializeWebSocket(8765);
    } else {
      // In production, use the PyWebView API
      if (window.pywebview && window.pywebview.api) {
        window.pywebview.api.init_app().then(result => {
          setAppInfo({
            appName: result.appName,
            version: result.version
          });
          initializeWebSocket(result.websocketPort);
        });
      }
    }
    
    return () => {
      // Cleanup WebSocket connection on unmount
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);
  
  const initializeWebSocket = (port) => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
      setConnected(true);
      setWebsocket(ws);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
      
      // Try to reconnect after 5 seconds
      setTimeout(() => {
        initializeWebSocket(port);
      }, 5000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };
  };
  
  const handleWebSocketMessage = (data) => {
    // Handle different WebSocket message types
    switch (data.action) {
      case 'connection_status':
        console.log('Connection status:', data.status);
        break;
      default:
        console.log('Unhandled WebSocket message:', data);
    }
  };
  
  return (
    <WebSocketContext.Provider value={{ websocket, connected }}>
      <ServerContext.Provider value={{ currentServer, setCurrentServer }}>
        <AppContainer>
          <Router>
            <Header appName={appInfo.appName} version={appInfo.version} />
            <MainContent>
              <Routes>
                <Route path="/server-management" element={<ServerManagement />} />
                <Route path="/server/:serverId/dashboard" element={<UserDashboard />} />
                <Route path="/" element={<Navigate replace to="/server-management" />} />
              </Routes>
            </MainContent>
          </Router>
        </AppContainer>
      </ServerContext.Provider>
    </WebSocketContext.Provider>
  );
}

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 20px;
`;

export default App;