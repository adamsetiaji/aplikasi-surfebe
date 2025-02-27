import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const ServerList = ({ servers, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [selectedServers, setSelectedServers] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingServer, setEditingServer] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedServers(servers.map(server => server.id));
    } else {
      setSelectedServers([]);
    }
  };
  
  const handleSelectServer = (e, serverId) => {
    if (e.target.checked) {
      setSelectedServers([...selectedServers, serverId]);
    } else {
      setSelectedServers(selectedServers.filter(id => id !== serverId));
    }
  };
  
  const handleViewDashboard = (serverId) => {
    navigate(`/server/${serverId}/dashboard`);
  };
  
  const handleEditClick = (server) => {
    setEditingServer(server.id);
    setEditFormData({
      name: server.name,
      url: server.url,
      description: server.description,
      server_type: server.server_type,
      status: server.status
    });
  };
  
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await onEdit(editingServer, editFormData);
      if (result.success) {
        setEditingServer(null);
      } else {
        // Handle error
        console.error('Failed to edit server:', result.error);
      }
    } catch (err) {
      console.error('Error editing server:', err);
    }
  };
  
  const handleDeleteClick = (serverId) => {
    setConfirmDelete(serverId);
  };
  
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      const result = await onDelete(confirmDelete);
      if (result.success) {
        // Remove from selected servers if it was selected
        setSelectedServers(selectedServers.filter(id => id !== confirmDelete));
      } else {
        // Handle error
        console.error('Failed to delete server:', result.error);
      }
    } catch (err) {
      console.error('Error deleting server:', err);
    } finally {
      setConfirmDelete(null);
    }
  };
  
  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };
  
  const handleCancelEdit = () => {
    setEditingServer(null);
  };
  
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Online':
        return {
          backgroundColor: '#27ae60',
          textColor: 'white',
          width: '60px'
        };
      case 'Offline':
        return {
          backgroundColor: '#e74c3c',
          textColor: 'white',
          width: '80px'
        };
      case 'Maintenance':
        return {
          backgroundColor: '#f39c12',
          textColor: 'white',
          width: '95px'
        };
      default:
        return {
          backgroundColor: '#bdc3c7',
          textColor: 'white',
          width: '70px'
        };
    }
  };
  
  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <HeaderRow>
            <HeaderCell width="40px">
              <Checkbox 
                type="checkbox" 
                onChange={handleSelectAll}
                checked={selectedServers.length === servers.length && servers.length > 0}
              />
            </HeaderCell>
            <HeaderCell width="60px">ID</HeaderCell>
            <HeaderCell width="150px">Server Name</HeaderCell>
            <HeaderCell width="250px">URL</HeaderCell>
            <HeaderCell width="100px">Type</HeaderCell>
            <HeaderCell width="100px">Status</HeaderCell>
            <HeaderCell width="180px">Actions</HeaderCell>
          </HeaderRow>
        </TableHeader>
        
        <TableBody>
          {servers.length === 0 ? (
            <EmptyRow>
              <EmptyCell colSpan="7">No servers found. Add a server to get started.</EmptyCell>
            </EmptyRow>
          ) : (
            servers.map(server => (
              <TableRow key={server.id}>
                <Cell>
                  <Checkbox 
                    type="checkbox" 
                    onChange={(e) => handleSelectServer(e, server.id)}
                    checked={selectedServers.includes(server.id)}
                  />
                </Cell>
                <Cell>{String(server.id).padStart(3, '0')}</Cell>
                
                {editingServer === server.id ? (
                  // Edit form inline
                  <EditCell colSpan="4">
                    <EditForm onSubmit={handleEditSubmit}>
                      <EditField>
                        <EditLabel>Name:</EditLabel>
                        <EditInput 
                          name="name" 
                          value={editFormData.name} 
                          onChange={handleEditChange} 
                          required
                        />
                      </EditField>
                      <EditField>
                        <EditLabel>URL:</EditLabel>
                        <EditInput 
                          name="url" 
                          value={editFormData.url} 
                          onChange={handleEditChange} 
                          required
                        />
                      </EditField>
                      <EditField>
                        <EditLabel>Type:</EditLabel>
                        <EditSelect 
                          name="server_type" 
                          value={editFormData.server_type} 
                          onChange={handleEditChange}
                        >
                          <option value="Production">Production</option>
                          <option value="Testing">Testing</option>
                          <option value="Development">Development</option>
                        </EditSelect>
                      </EditField>
                      <EditField>
                        <EditLabel>Status:</EditLabel>
                        <EditSelect 
                          name="status" 
                          value={editFormData.status} 
                          onChange={handleEditChange}
                        >
                          <option value="Online">Online</option>
                          <option value="Offline">Offline</option>
                          <option value="Maintenance">Maintenance</option>
                        </EditSelect>
                      </EditField>
                      <EditButtons>
                        <SaveButton type="submit">Save</SaveButton>
                        <CancelButton type="button" onClick={handleCancelEdit}>Cancel</CancelButton>
                      </EditButtons>
                    </EditForm>
                  </EditCell>
                ) : (
                  // Normal view
                  <>
                    <Cell>{server.name}</Cell>
                    <Cell>{server.url}</Cell>
                    <Cell>{server.server_type}</Cell>
                    <Cell>
                      <StatusBadge 
                        backgroundColor={getStatusStyles(server.status).backgroundColor}
                        textColor={getStatusStyles(server.status).textColor}
                        width={getStatusStyles(server.status).width}
                      >
                        {server.status}
                      </StatusBadge>
                    </Cell>
                    <Cell>
                      <ActionButtons>
                        <DashboardButton onClick={() => handleViewDashboard(server.id)}>
                          Dashboard
                        </DashboardButton>
                        <EditButton onClick={() => handleEditClick(server)}>
                          Edit
                        </EditButton>
                        <DeleteButton onClick={() => handleDeleteClick(server.id)}>
                          Delete
                        </DeleteButton>
                      </ActionButtons>
                    </Cell>
                  </>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <ModalOverlay>
          <Modal>
            <ModalHeader>Confirm Delete</ModalHeader>
            <ModalBody>
              Are you sure you want to delete this server? This action cannot be undone.
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={handleCancelDelete}>Cancel</CancelButton>
              <DeleteButton onClick={handleConfirmDelete}>Delete</DeleteButton>
            </ModalFooter>
          </Modal>
        </ModalOverlay>
      )}
      
      {/* Pagination */}
      {servers.length > 0 && (
        <PaginationContainer>
          <PageButton active>1</PageButton>
          <PageButton>2</PageButton>
          <PageButton>3</PageButton>
        </PaginationContainer>
      )}
    </TableContainer>
  );
};

const TableContainer = styled.div`
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: white;
`;

const TableHeader = styled.thead`
  background-color: #f5f7fa;
`;

const HeaderRow = styled.tr`
  height: 40px;
  border-bottom: 1px solid #ddd;
`;

const HeaderCell = styled.th`
  padding: 0 10px;
  text-align: left;
  font-size: 14px;
  font-weight: bold;
  color: #2c3e50;
  width: ${props => props.width || 'auto'};
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  height: 50px;
  border-bottom: 1px solid #ecf0f1;
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const Cell = styled.td`
  padding: 0 10px;
  font-size: 14px;
  color: #2c3e50;
`;

const EditCell = styled.td`
  padding: 10px;
`;

const EmptyRow = styled.tr`
  height: 100px;
`;

const EmptyCell = styled.td`
  text-align: center;
  color: #7f8c8d;
  font-size: 16px;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1.5px solid #bdc3c7;
  cursor: pointer;
`;

const StatusBadge = styled.div`
  display: inline-block;
  width: ${props => props.width || '60px'};
  height: 22px;
  border-radius: 11px;
  background-color: ${props => props.backgroundColor || '#27ae60'};
  color: ${props => props.textColor || 'white'};
  text-align: center;
  line-height: 22px;
  font-size: 12px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  height: 26px;
  border-radius: 3px;
  border: none;
  padding: 0 10px;
  font-size: 12px;
  color: white;
  cursor: pointer;
`;

const DashboardButton = styled(ActionButton)`
  background-color: #3498db;
  
  &:hover {
    background-color: #2980b9;
  }
`;

const EditButton = styled(ActionButton)`
  background-color: #f39c12;
  
  &:hover {
    background-color: #e67e22;
  }
`;

const DeleteButton = styled(ActionButton)`
  background-color: #e74c3c;
  
  &:hover {
    background-color: #c0392b;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

const PageButton = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 3px;
  border: ${props => props.active ? 'none' : '1px solid #ddd'};
  background-color: ${props => props.active ? '#3498db' : '#f5f7fa'};
  color: ${props => props.active ? 'white' : '#7f8c8d'};
  margin: 0 5px;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.active ? '#2980b9' : '#ecf0f1'};
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  width: 400px;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 15px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ddd;
  font-weight: bold;
  color: #2c3e50;
`;

const ModalBody = styled.div`
  padding: 20px;
  color: #2c3e50;
`;

const ModalFooter = styled.div`
  padding: 15px 20px;
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

// Edit Form Styles
const EditForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const EditField = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 0 45%;
`;

const EditLabel = styled.label`
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 5px;
`;

const EditInput = styled.input`
  height: 30px;
  border-radius: 3px;
  border: 1px solid #bdc3c7;
  padding: 0 8px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const EditSelect = styled.select`
  height: 30px;
  border-radius: 3px;
  border: 1px solid #bdc3c7;
  padding: 0 8px;
  font-size: 14px;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const EditButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
  width: 100%;
  justify-content: flex-end;
`;

const SaveButton = styled(ActionButton)`
  background-color: #27ae60;
  
  &:hover {
    background-color: #219955;
  }
`;

const CancelButton = styled(ActionButton)`
  background-color: #7f8c8d;
  
  &:hover {
    background-color: #95a5a6;
  }
`;

export default ServerList;