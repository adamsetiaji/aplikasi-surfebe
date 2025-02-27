import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ServerForm from './ServerForm';
import ServerList from './ServerList';
import api from '../../services/api';

const ServerManagement = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState('');
  
  useEffect(() => {
    fetchServers();
  }, []);
  
  const fetchServers = async () => {
    setLoading(true);
    try {
      const result = await api.getServers();
      if (result.success) {
        setServers(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch servers. Please try again.');
      console.error('Error fetching servers:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddServer = async (serverData) => {
    try {
      const result = await api.addServer(serverData);
      if (result.success) {
        setServers([...servers, result.data]);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Error adding server:', err);
      return { success: false, error: 'Failed to add server. Please try again.' };
    }
  };
  
  const handleEditServer = async (serverId, serverData) => {
    try {
      const result = await api.editServer(serverId, serverData);
      if (result.success) {
        setServers(servers.map(server => 
          server.id === serverId ? result.data : server
        ));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Error editing server:', err);
      return { success: false, error: 'Failed to edit server. Please try again.' };
    }
  };
  
  const handleDeleteServer = async (serverId) => {
    try {
      const result = await api.deleteServer(serverId);
      if (result.success) {
        setServers(servers.filter(server => server.id !== serverId));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Error deleting server:', err);
      return { success: false, error: 'Failed to delete server. Please try again.' };
    }
  };
  
  const handleTestConnection = async (serverUrl) => {
    try {
      const result = await api.testConnection(serverUrl);
      return result;
    } catch (err) {
      console.error('Error testing connection:', err);
      return { 
        success: false, 
        error: 'Failed to test connection. Please try again.' 
      };
    }
  };
  
  const handleRefresh = () => {
    fetchServers();
  };
  
  const filteredServers = servers.filter(server => 
    server.name.toLowerCase().includes(filterText.toLowerCase()) ||
    server.url.toLowerCase().includes(filterText.toLowerCase()) ||
    server.server_type.toLowerCase().includes(filterText.toLowerCase())
  );
  
  return (
    <Container>
      <Title>Server Management</Title>
      
      <FormSection>
        <SectionTitle>Add New Server</SectionTitle>
        <ServerForm 
          onSubmit={handleAddServer} 
          onTestConnection={handleTestConnection} 
        />
      </FormSection>
      
      <ListSection>
        <SectionTitle>Server List</SectionTitle>
        <ControlRow>
          <SearchInput
            type="text"
            placeholder="Search servers..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          
          <FilterButton>
            Filter
            <ArrowIcon />
          </FilterButton>
          
          <RefreshButton onClick={handleRefresh}>
            Refresh
            <RefreshIcon />
          </RefreshButton>
        </ControlRow>
        
        {loading ? (
          <LoadingContainer>Loading servers...</LoadingContainer>
        ) : error ? (
          <ErrorContainer>{error}</ErrorContainer>
        ) : (
          <ServerList 
            servers={filteredServers} 
            onEdit={handleEditServer}
            onDelete={handleDeleteServer}
          />
        )}
      </ListSection>
    </Container>
  );
};

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 20px;
`;

const FormSection = styled.section`
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 20px;
  margin-bottom: 20px;
`;

const ListSection = styled.section`
  margin-top: 20px;
`;

const ControlRow = styled.div`
  display: flex;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  width: 250px;
  height: 35px;
  border-radius: 4px;
  border: 1px solid #bdc3c7;
  padding: 0 15px;
  font-size: 14px;
  
  &::placeholder {
    color: #95a5a6;
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 35px;
  border-radius: 4px;
  border: 1px solid #bdc3c7;
  background-color: white;
  margin-left: 20px;
  font-size: 14px;
  color: #2c3e50;
  cursor: pointer;
  
  &:hover {
    background-color: #f5f7fa;
  }
`;

const ArrowIcon = styled.span`
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-left: 5px;
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    width: 6px;
    height: 2px;
    background-color: #95a5a6;
    transform: rotate(45deg);
    top: 5px;
    left: 0;
  }
  
  &:after {
    content: '';
    position: absolute;
    width: 6px;
    height: 2px;
    background-color: #95a5a6;
    transform: rotate(-45deg);
    top: 5px;
    right: 0;
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 35px;
  border-radius: 4px;
  border: 1px solid #bdc3c7;
  background-color: #f5f7fa;
  margin-left: 20px;
  font-size: 14px;
  color: #2c3e50;
  cursor: pointer;
  
  &:hover {
    background-color: #ecf0f1;
  }
`;

const RefreshIcon = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-left: 5px;
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    border: 2px solid #2c3e50;
    border-left-color: transparent;
    border-radius: 50%;
    top: 0;
    left: 0;
  }
  
  &:after {
    content: '';
    position: absolute;
    width: 4px;
    height: 4px;
    border-top: 2px solid #2c3e50;
    border-right: 2px solid #2c3e50;
    transform: rotate(45deg);
    top: 0;
    left: 8px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  font-size: 16px;
  color: #7f8c8d;
`;

const ErrorContainer = styled.div`
  background-color: #fdeded;
  border: 1px solid #f1a9a9;
  border-radius: 4px;
  padding: 10px 15px;
  margin-bottom: 20px;
  color: #e74c3c;
`;

export default ServerManagement;