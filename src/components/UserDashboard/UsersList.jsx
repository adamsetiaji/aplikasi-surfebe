import React, { useState } from 'react';
import styled from 'styled-components';

const UsersList = ({ users, onUserAction }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };
  
  const handleSelectUser = (e, userId) => {
    if (e.target.checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };
  
  const handleEditClick = (user) => {
    setEditingUser(user.id);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
  };
  
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await onUserAction('edit', editingUser, editFormData);
      if (result.success) {
        setEditingUser(null);
      } else {
        // Handle error
        console.error('Failed to edit user:', result.error);
      }
    } catch (err) {
      console.error('Error editing user:', err);
    }
  };
  
  const handleDeleteClick = (userId) => {
    setConfirmDelete(userId);
  };
  
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      const result = await onUserAction('delete', confirmDelete);
      if (result.success) {
        // Remove from selected users if it was selected
        setSelectedUsers(selectedUsers.filter(id => id !== confirmDelete));
      } else {
        // Handle error
        console.error('Failed to delete user:', result.error);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    } finally {
      setConfirmDelete(null);
    }
  };
  
  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };
  
  const handleCancelEdit = () => {
    setEditingUser(null);
  };
  
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Active':
        return {
          backgroundColor: '#27ae60',
          textColor: 'white',
          width: '60px'
        };
      case 'Inactive':
        return {
          backgroundColor: '#e74c3c',
          textColor: 'white',
          width: '80px'
        };
      case 'Pending':
        return {
          backgroundColor: '#f39c12',
          textColor: 'white',
          width: '80px'
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
                checked={selectedUsers.length === users.length && users.length > 0}
              />
            </HeaderCell>
            <HeaderCell width="60px">ID</HeaderCell>
            <HeaderCell width="150px">Name</HeaderCell>
            <HeaderCell width="250px">Email</HeaderCell>
            <HeaderCell width="100px">Role</HeaderCell>
            <HeaderCell width="100px">Status</HeaderCell>
            <HeaderCell width="100px">Actions</HeaderCell>
          </HeaderRow>
        </TableHeader>
        
        <TableBody>
          {users.length === 0 ? (
            <EmptyRow>
              <EmptyCell colSpan="7">No users found.</EmptyCell>
            </EmptyRow>
          ) : (
            users.map(user => (
              <TableRow key={user.id}>
                <Cell>
                  <Checkbox 
                    type="checkbox" 
                    onChange={(e) => handleSelectUser(e, user.id)}
                    checked={selectedUsers.includes(user.id)}
                  />
                </Cell>
                <Cell>{String(user.id).padStart(3, '0')}</Cell>
                
                {editingUser === user.id ? (
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
                        <EditLabel>Email:</EditLabel>
                        <EditInput 
                          name="email" 
                          value={editFormData.email} 
                          onChange={handleEditChange} 
                          required
                          type="email"
                        />
                      </EditField>
                      <EditField>
                        <EditLabel>Role:</EditLabel>
                        <EditSelect 
                          name="role" 
                          value={editFormData.role} 
                          onChange={handleEditChange}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Manager">Manager</option>
                          <option value="Editor">Editor</option>
                          <option value="User">User</option>
                        </EditSelect>
                      </EditField>
                      <EditField>
                        <EditLabel>Status:</EditLabel>
                        <EditSelect 
                          name="status" 
                          value={editFormData.status} 
                          onChange={handleEditChange}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Pending">Pending</option>
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
                    <Cell>{user.name}</Cell>
                    <Cell>{user.email}</Cell>
                    <Cell>{user.role}</Cell>
                    <Cell>
                      <StatusBadge 
                        backgroundColor={getStatusStyles(user.status).backgroundColor}
                        textColor={getStatusStyles(user.status).textColor}
                        width={getStatusStyles(user.status).width}
                      >
                        {user.status}
                      </StatusBadge>
                    </Cell>
                    <Cell>
                      <ActionsMenu>⋮</ActionsMenu>
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
              Are you sure you want to delete this user? This action cannot be undone.
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={handleCancelDelete}>Cancel</CancelButton>
              <DeleteButton onClick={handleConfirmDelete}>Delete</DeleteButton>
            </ModalFooter>
          </Modal>
        </ModalOverlay>
      )}
      
      {/* Pagination */}
      {users.length > 0 && (
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
  height: 45px;
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

const ActionsMenu = styled.button`
  width: 30px;
  height: 22px;
  border-radius: 3px;
  border: none;
  background-color: #3498db;
  color: white;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background-color: #2980b9;
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

const ActionButton = styled.button`
  height: 26px;
  border-radius: 3px;
  border: none;
  padding: 0 10px;
  font-size: 12px;
  color: white;
  cursor: pointer;
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

const DeleteButton = styled(ActionButton)`
  background-color: #e74c3c;
  
  &:hover {
    background-color: #c0392b;
  }
`;

export default UsersList;