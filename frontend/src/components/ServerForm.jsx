import { useState } from 'react';
import api from '../services/api';

function ServerForm({ onServerAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    type: 'Production',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const newServer = await api.addServer(formData);
      
      // Reset form
      setFormData({
        name: '',
        url: '',
        type: 'Production',
        description: ''
      });
      
      if (onServerAdded) {
        onServerAdded(newServer);
      }
      
    } catch (err) {
      setError('Failed to add server. Please try again.');
      console.error('Error adding server:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="server-form-container">
      <h2>Add New Server</h2>
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="server-form">
        <div className="form-group">
          <label htmlFor="name">Server Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="url">Server URL:</label>
          <input
            type="text"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="ws://, wss://, http://, or https://..."
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="type">Server Type:</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
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
            value={formData.description}
            onChange={handleChange}
            rows="3"
          />
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adding...' : 'Add Server'}
        </button>
      </form>
    </div>
  );
}

export default ServerForm;