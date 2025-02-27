import { createContext } from 'react';

// ServerContext provides the current server information throughout the app
const ServerContext = createContext({
  currentServer: null,
  setCurrentServer: () => {}
});

export default ServerContext;