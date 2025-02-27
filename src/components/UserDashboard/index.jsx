import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import UsersList from './UsersList';
import ActivityLog from './ActivityLog';
import ServerContext from '../../contexts/ServerContext';
import WebSocketContext from '../../contexts/WebSocketContext';
import api from '../../services/api';

const UserDashboard = () => {
  const { serverId } = useParams();
  const { setCurrentServer } = useContext(ServerContext);
  const { websocket, connected } = useContext(WebSocketContext);
  
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pingTime, setPingTime] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showColumns, setShowColumns] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);
  
  // Statistics
  const [userStats, setUserStats] = useState({
    active: 0,
    inactive: 0,
    pending: 0
  });
  
  useEffect(() => {
    // Fetch server details
    const fetchServerDetails = async () => {
      try {
        const server = await api.getServerById(serverId);
        if (server.success) {
          setServerInfo(server.data);
          setCurrentServer(server.data);
        } else {
          setError(`Failed to load server details: ${server.error}`);
        }
      } catch (err) {
        console.error('Error fetching server details:', err);
        setError('Failed to load server details. Please try again.');
      }
    };
    
    fetchServerDetails();
    
    // Fetch users and activity logs
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch users
        const usersResult = await api.getUsers(serverId);
        if (usersResult.success) {
          setUsers(usersResult.data);
          
          // Calculate user statistics
          const stats = {
            active: usersResult.data.filter(user => user.status === 'Active').length,
            inactive: usersResult.data.filter(user => user.status === 'Inactive').length,
            pending: usersResult.data.filter(user => user.status === 'Pending').length
          };
          setUserStats(stats);
        } else {
          setError(`Failed to load users: ${usersResult.error}`);
        }
        
        // Fetch activity logs
        const logsResult = await api.getActivityLog(serverId);
        if (logsResult.success) {
          setActivityLogs(logsResult.data);
        } else {
          console.error('Failed to load activity logs:', logsResult.error);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Connect to server via WebSocket
    if (websocket && connected) {
      const connectToServer = () => {
        websocket.send(JSON.stringify({
          action: 'connect_to_server',
          server_id: serverId,
          server_url: serverInfo?.url || ''
        }));
        
        // Start ping
        startPing();
      };
      
      // Wait until we have server info
      if (serverInfo) {
        connectToServer();
      }
    }
    
    // WebSocket message handler
    const handleWebSocketMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.action === 'activity_log_update' && data.server_id === parseInt(serverId)) {
          setActivityLogs(data.logs);
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };
    
    if (websocket) {
      websocket.addEventListener('message', handleWebSocketMessage);
    }
    
    return () => {
      if (websocket) {
        websocket.removeEventListener('message', handleWebSocketMessage);
      }
    };
  }, [serverId, websocket, connected, serverInfo]);
  
  const startPing = () => {
    const startTime = Date.now();
    
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({ action: 'ping' }));
      
      const pingHandler = (event) => {
        const data = JSON.parse(event.data);
        if (data.action === 'pong') {
          const endTime = Date.now();
          setPingTime(endTime - startTime);
          websocket.removeEventListener('message', pingHandler);
        }
      };
      
      websocket.addEventListener('message', pingHandler);
    }
  };
  
  const handleAddUser = async (userData) => {
    try {
      const result = await api.addUser(serverId, userData);
      if (result.success) {
        setUsers([...users, result.data]);
        // Update stats
        setUserStats({
          ...userStats,
          [result.data.status.toLowerCase()]: userStats[result.data.status.toLowerCase()] + 1
        });
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Error adding user:', err);
      return { success: false, error: 'Failed to add user. Please try again.' };
    }
  };
  
  const handleUserAction = async (actionType, userId, userData) => {
    try {
      let result;
      
      switch (actionType) {
        case 'edit':
          result = await api.editUser(serverId, userId, userData);
          if (result.success) {
            setUsers(users.map(user => 
              user.id === userId ? result.data : user
            ));
          }
          break;
          
        case 'delete':
          result = await api.deleteUser(serverId, userId);
          if (result.success) {
            const userToRemove = users.find(user => user.id === userId);
            setUsers(users.filter(user => user.id !== userId));
            
            // Update stats
            if (userToRemove) {
              setUserStats({
                ...userStats,
                [userToRemove.status.toLowerCase()]: userStats[userToRemove.status.toLowerCase()] - 1
              });
            }
          }
          break;
          
        default:
          return { success: false, error: 'Invalid action type' };
      }
      
      return result;
    } catch (err) {
      console.error(`Error performing user action ${actionType}:`, err);
      return { 
        success: false, 
        error: `Failed to ${actionType} user. Please try again.` 
      };
    }
  };
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase()) ||
    user.role.toLowerCase().includes(searchText.toLowerCase())
  );
  
  const totalUsers = users.length;
  
  return (
    <DashboardContainer>
      <LeftPanel>
        <DashboardHeader>
          <Title>Users Management</Title>
          <Subtitle>
            {serverInfo?.name || 'Server'} - Total Users: {totalUsers}
          </Subtitle>
        </DashboardHeader>
        
        <ControlsRow>
          <SearchInput
            type="text"
            placeholder="Search users..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          
          <ColumnsButton onClick={() => setShowColumns(!showColumns)}>
            Columns
          </ColumnsButton>
          
          {showColumns && (
            <ColumnsDropdown>
              <ColumnOption>
                <input type="checkbox" defaultChecked /> ID
              </ColumnOption>
              <ColumnOption>
                <input type="checkbox" defaultChecked /> Name
              </ColumnOption>
              <ColumnOption>
                <input type="checkbox" defaultChecked /> Email
              </ColumnOption>
              <ColumnOption>
                <input type="checkbox" defaultChecked /> Role
              </ColumnOption>
              <ColumnOption>
                <input type="checkbox" defaultChecked /> Status
              </ColumnOption>
              <ColumnOption>
                <input type="checkbox"  /> Actions
              </ColumnOption>
            </ColumnsDropdown>
          )}
          
          <Spacer />
          
          <AddButton>Add</AddButton>
          <ActionsButton>Actions ▾</ActionsButton>
          
        </ControlsRow>
        
        {loading ? (
          <LoadingContainer>Loading users...</LoadingContainer>
        ) : error ? (
          <ErrorContainer>{error}</ErrorContainer>
        ) : (
          <UsersList 
            users={filteredUsers}
            onUserAction={handleUserAction}
          />
        )}
      </LeftPanel>
      
      <RightPanel>
        <ActivityLog logs={activityLogs} />
        
        <ServerStats>
          <StatsTitle>Server Statistics</StatsTitle>
          <StatItem>Active Users: {userStats.active}</StatItem>
          <StatItem>Inactive Users: {userStats.inactive}</StatItem>
          <StatItem>Pending Users: {userStats.pending}</StatItem>
        </ServerStats>
        
        <ServerStatus>
          <StatsTitle>Server Status</StatsTitle>
          <StatusRow>
            <StatusIndicator active={connected} />
            <StatusText>Connection: {connected ? 'Active' : 'Inactive'}</StatusText>
          </StatusRow>
          <StatusRow>
            <StatusText>Last Ping: {pingTime ? `${pingTime} ms` : 'N/A'}</StatusText>
          </StatusRow>
        </ServerStatus>
      </RightPanel>
    </DashboardContainer>
  );
};

const DashboardContainer = styled.div`
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  gap: 20px;
`;

const LeftPanel = styled.div`
  flex: 1;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 20px;
`;

const RightPanel = styled.div`
  width: 290px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const DashboardHeader = styled.div`
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: bold;
  color: #2c3e50;
  margin: 0 0 10px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
`;

const ControlsRow = styled.div`
  display: flex;
  margin-bottom: 20px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 150px;
  height: 35px;
  border-radius: 4px;
  border: 1px solid #bdc3c7;
  padding: 0 15px;
  font-size: 14px;
  color: #95a5a6;
`;

const ColumnsButton = styled.button`
  height: 35px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background-color: #f5f7fa;
  margin-left: 20px;
  padding: 0 15px;
  font-size: 14px;
  color: #2c3e50;
  cursor: pointer;
  
  &:hover {
    background-color: #ecf0f1;
  }
`;

const ColumnsDropdown = styled.div`
  position: absolute;
  top: 45px;
  left: 170px;
  width: 150px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 10px;
  z-index: 10;
`;

const ColumnOption = styled.div`
  padding: 5px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #2c3e50;
`;

const Spacer = styled.div`
  flex: 1;
`;

const ActionButton = styled.button`
  height: 35px;
  border-radius: 4px;
  border: none;
  padding: 0 15px;
  font-size: 14px;
  color: white;
  cursor: pointer;
  margin-left: 10px;
`;

const AddButton = styled(ActionButton)`
  background-color: #27ae60;
  
  &:hover {
    background-color: #219955;
  }
`;

const ActionsButton = styled(ActionButton)`
  background-color: #3498db;
  
  &:hover {
    background-color: #2980b9;
  }
`;

const ServerStats = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
`;

const ServerStatus = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
`;

const StatsTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
  margin: 0 0 15px 0;
`;

const StatItem = styled.p`
  font-size: 14px;
  color: #2c3e50;
  margin: 10px 0;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  margin: 10px 0;
`;

const StatusIndicator = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#27ae60' : '#e74c3c'};
  margin-right: 10px;
`;

const StatusText = styled.p`
  font-size: 14px;
  color: #2c3e50;
  margin: 0;
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

export default UserDashboard;