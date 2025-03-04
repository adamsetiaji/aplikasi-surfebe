import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';
import HomePage from './pages/HomePage';
import ServerPage from './pages/ServerPage';
import Header from './components/Header';
import './index.css';

const socket = io();

function App() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, []);

  return (
    <Router>
      <div className="app">
        <Header isConnected={isConnected} />
        <main className="content">
          <Routes>
            <Route path="/" element={<HomePage socket={socket} />} />
            <Route path="/server/:serverId" element={<ServerPage socket={socket} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;