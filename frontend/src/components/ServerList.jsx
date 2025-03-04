import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function ServerList({ socket }) {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch servers on component mount
  useEffect(() => {
    const fetchServers = async () => {
      try {
        setLoading(true);
        const data = await api.getServers();
        setServers(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch servers');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  // Listen for server events
  useEffect(() => {
    if (!socket) return;

    const handleServerAdded = (newServer) => {
      setServers(prev => [...prev, newServer]);
    };

    const handleServerUpdated = (updatedServer) => {
      setServers(prev => 
        prev.map(server => server.id === updatedServer.id ? updatedServer : server)
      );
    };

    const handleServerDeleted = (data) => {
      setServers(prev => 
        prev.filter(server => server.id !== data.id)
      );
    };

    socket.on('server_added', handleServerAdded);
    socket.on('server_updated', handleServerUpdated);
    socket.on('server_deleted', handleServerDeleted);
    socket.on('server_status_changed', handleServerUpdated);

    return () => {
      socket.off('server_added', handleServerAdded);
      socket.off('server_updated', handleServerUpdated);
      socket.off('server_deleted', handleServerDeleted);
      socket.off('server_status_changed', handleServerUpdated);
    };
  }, [socket]);

  if (loading) return <div>Loading servers...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="server-list">
      <h2>Servers</h2>
      {servers.length === 0 ? (
        <p>No servers found. Add a server to get started.</p>
      ) : (
        <div className="server-grid">
          {servers.map(server => (
            <div key={server.id} className={`server-card ${server.status.toLowerCase()}`}>
              <h3>{server.name}</h3>
              <p className="server-url">{server.url}</p>
              <p className="server-type">{server.type}</p>
              <div className={`server-status ${server.status.toLowerCase()}`}>
                {server.status}
              </div>
              <div className="server-actions">
                <Link to={`/server/${server.id}`} className="btn">View Details</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ServerList;