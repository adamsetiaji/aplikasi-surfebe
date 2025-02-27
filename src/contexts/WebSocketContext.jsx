import { createContext } from 'react';

// WebSocketContext provides access to the WebSocket connection throughout the app
const WebSocketContext = createContext({
  websocket: null,
  connected: false
});

export default WebSocketContext;