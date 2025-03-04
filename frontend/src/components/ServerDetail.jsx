import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ActivityLog from './ActivityLog';
import UserManagement from './UserManagement';

function ServerDetail({ serverId, socket }) {
  const navigate = useNavigate();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pingResult, setPingResult] = useState(null);
  const [isPinging, setIsPinging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    url: '',
    type: '',
    description: ''
  });
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchServerDetails = async () => {
      try {
        setLoading(true);
        const data = await api.getServer(serverId);
        setServer(data);
        setError(null);

        // Initialize edit form with server data
        setEditForm({
          name: data.name || '',
          url: data.url || '',
          type: data.type || 'Production',
          description: data.description || ''
        });
      } catch (err) {
        setError('Failed to fetch server details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchServerDetails();
  }, [serverId]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleServerUpdated = (updatedServer) => {
      if (updatedServer.id === serverId) {
        setServer(updatedServer);
        
        // Update edit form with new data
        setEditForm({
          name: updatedServer.name || '',
          url: updatedServer.url || '',
          type: updatedServer.type || 'Production',
          description: updatedServer.description || ''
        });
      }
    };

    const handleServerDeleted = (data) => {
      if (data.id === serverId) {
        setError('This server has been deleted');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    };

    socket.on('server_updated', handleServerUpdated);
    socket.on('server_deleted', handleServerDeleted);
    socket.on('server_status_changed', handleServerUpdated);

    return () => {
      socket.off('server_updated', handleServerUpdated);
      socket.off('server_deleted', handleServerDeleted);
      socket.off('server_status_changed', handleServerUpdated);
    };
  }, [socket, serverId, navigate]);

  const handlePingServer = async () => {
    try {
      setIsPinging(true);
      setPingResult(null);
      const result = await api.pingServer(serverId);
      setPingResult(result);
    } catch (err) {
      console.error('Error pinging server:', err);
      setPingResult({ success: false, error: 'Failed to ping server' });
    } finally {
      setIsPinging(false);
    }
  };

  const handleConnectDisconnect = async () => {
    try {
      if (server.status === 'Online' || server.status === 'Connected') {
        await api.disconnectServer(serverId);
      } else {
        await api.connectServer(serverId);
      }
    } catch (err) {
      console.error('Error connecting/disconnecting server:', err);
      setError('Failed to connect/disconnect server');
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.updateServer(serverId, editForm);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error('Error updating server:', err);
      setError('Failed to update server');
    }
  };

  const handleDeleteServer = async () => {
    if (window.confirm('Are you sure you want to delete this server?')) {
      try {
        await api.deleteServer(serverId);
        navigate('/');
      } catch (err) {
        console.error('Error deleting server:', err);
        setError('Failed to delete server');
      }
    }
  };

  if (loading) return <div>Loading server details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!server) return <div>Server not found</div>;

  const isWebSocket = server.url.startsWith('ws://') || server.url.startsWith('wss://');

  return (
    <div className="server-detail">
      <div className="server-detail-header">
        <h2>{server.name}</h2>
        <div className={`server-status ${server.status.toLowerCase()}`}>
          {server.status}
        </div>
      </div>

      <div className="server-tabs">
        <button 
          type="button"
          className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Server Details
        </button>
        <button 
          type="button"
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
      </div>

      {activeTab === 'details' ? (
        <div className="tab-content">
          {isEditing ? (
            <div className="server-edit-form">
              <h3>Edit Server</h3>
              <form onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Server Name:</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="url">Server URL:</label>
                  <input
                    type="text"
                    id="url"
                    name="url"
                    value={editForm.url}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="type">Server Type:</label>
                  <select
                    id="type"
                    name="type"
                    value={editForm.type}
                    onChange={handleEditFormChange}
                  >
                    <option value="Production">Production</option>
                    <option value="Testing">Testing</option>
                    <option value="Development">Development</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Description:</label>
                  <textarea
                    id="description"
                    name="description"
                    value={editForm.description}
                    onChange={handleEditFormChange}
                    rows="3"
                  />
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                  <button type="button" className="btn" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="server-info">
                <div className="info-item">
                  <span className="label">URL:</span>
                  <span className="value">{server.url}</span>
                </div>
                <div className="info-item">
                  <span className="label">Type:</span>
                  <span className="value">{server.type}</span>
                </div>
                <div className="info-item">
                  <span className="label">Description:</span>
                  <span className="value">{server.description || 'No description'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Last Ping:</span>
                  <span className="value">{server.last_ping ? `${server.last_ping} ms` : 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Last Connected:</span>
                  <span className="value">{server.last_connected || 'N/A'}</span>
                </div>
              </div>

              <div className="server-actions">
                <button type="button" className="btn" onClick={handlePingServer} disabled={isPinging}>
                  {isPinging ? 'Pinging...' : 'Ping Server'}
                </button>
                
                {isWebSocket && (
                  <button 
                    type="button"
                    className={`btn ${server.status === 'Online' ? 'btn-warning' : 'btn-success'}`}
                    onClick={handleConnectDisconnect}
                  >
                    {server.status === 'Online' || server.status === 'Connected' ? 'Disconnect' : 'Connect'}
                  </button>
                )}
                
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Server
                </button>
                
                <button 
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteServer}
                >
                  Delete Server
                </button>
              </div>

              {pingResult && (
                <div className={`ping-result ${pingResult.success ? 'success' : 'error'}`}>
                  {pingResult.success 
                    ? `Ping successful: ${pingResult.ping_ms}ms` 
                    : `Ping failed: ${pingResult.error}`}
                </div>
              )}
            </>
          )}
          
          <h3>Activity Log</h3>
          <ActivityLog serverId={serverId} socket={socket} />
        </div>
      ) : (
        <div className="tab-content">
          <UserManagement serverId={serverId} socket={socket} />
        </div>
      )}
    </div>
  );
}

export default ServerDetail;