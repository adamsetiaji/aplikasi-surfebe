
import { useState, useEffect } from 'react';
import api from '../services/api';



function UserManagement({ serverId, socket }) {
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [showAddForm, setShowAddForm] = useState(false);
const [showEditForm, setShowEditForm] = useState(false);
const [editingUser, setEditingUser] = useState(null);
const [formData, setFormData] = useState({
    name: '',
    email: '',
    password_surfebe: ''
});
const [editFormData, setEditFormData] = useState({
    name: '',
    password_surfebe: ''
});

// Confirmation dialog state
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [userToDelete, setUserToDelete] = useState(null);
const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

// Captcha state
const [captchaData, setCaptchaData] = useState(null);
const [loadingCaptcha, setLoadingCaptcha] = useState(false);
const [refreshTimer, setRefreshTimer] = useState(0);
const [refreshTimerInterval, setRefreshTimerInterval] = useState(null);

// Table state management
const [searchTerm, setSearchTerm] = useState('');
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(5);
const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
const [selectedUsers, setSelectedUsers] = useState([]);
const [selectAll, setSelectAll] = useState(false);

useEffect(() => {
    return () => {
        if (refreshTimerInterval) {
            clearInterval(refreshTimerInterval);
        }
    };
}, [refreshTimerInterval]);

// Fetch users on component mount and when serverId changes
useEffect(() => {
    // Define fetchUsers inside the useEffect to avoid dependency issues
    const fetchUsers = async () => {
        try {
            setLoading(true);
            // First, get server details to obtain WebSocket URL
            const serverDetail = await api.getServer(serverId);

            // Use WebSocket URL from server details
            const response = await api.getServerUsers(serverDetail?.url);

            // Check response format and extract user array
            if (response?.success && Array.isArray(response?.data)) {
                setUsers(response.data);
            } else if (Array.isArray(response)) {
                // Fallback to old format if needed
                setUsers(response);
            } else {
                setUsers([]);
            }

            // Fetch captcha data
            fetchCaptchaData(serverDetail?.url);

            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to fetch users');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    fetchUsers();
}, [serverId]);

// Function to fetch captcha data
const fetchCaptchaData = async (serverUrl) => {
    if (!serverUrl) return;
    
    try {
        setLoadingCaptcha(true);
        const response = await new Promise((resolve, reject) => {
            try {
                const ws = new WebSocket(serverUrl);
                
                ws.onopen = () => {
                    ws.send(JSON.stringify({
                        type: "RECAPTCHA",
                        action: "GET_ALL"
                    }));
                };
                
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    ws.close();
                    resolve(data);
                };
                
                ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    ws.close();
                    reject(error);
                };
                
                setTimeout(() => {
                    if (ws.readyState !== WebSocket.CLOSED) {
                        ws.close();
                        reject(new Error('WebSocket connection timeout'));
                    }
                }, 5000);
                
            } catch (error) {
                console.error('Error establishing WebSocket connection:', error);
                reject(error);
            }
        });
        
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
            setCaptchaData(response.data[0]);
        }
    } catch (err) {
        console.error('Error fetching captcha data:', err);
    } finally {
        setLoadingCaptcha(false);
    }
};

// Function to refresh captcha token
const refreshCaptchaToken = async () => {
    try {
        setLoadingCaptcha(true);
        setRefreshTimer(0);
        
        // Start timer
        const timerInterval = setInterval(() => {
            setRefreshTimer(prev => prev + 1);
        }, 1000);
        setRefreshTimerInterval(timerInterval);
        
        // Get server URL
        const serverDetail = await api.getServer(serverId);
        if (!serverDetail?.url) {
            throw new Error('Server URL not found');
        }
        
        const response = await new Promise((resolve, reject) => {
            try {
                const ws = new WebSocket(serverDetail.url);
                
                ws.onopen = () => {
                    ws.send(JSON.stringify({
                        type: "RECAPTCHA",
                        action: "GET_TOKEN"
                    }));
                };
                
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    ws.close();
                    resolve(data);
                };
                
                ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    ws.close();
                    reject(error);
                };
                
                // No timeout for token refresh - wait for response
                
            } catch (error) {
                console.error('Error establishing WebSocket connection:', error);
                reject(error);
            }
        });
        
        if (response.success && response.data?.updateData) {
            setCaptchaData(response.data.updateData);
        }
    } catch (err) {
        console.error('Error refreshing captcha token:', err);
        setError('Failed to refresh captcha token: ' + (err.message || 'Unknown error'));
    } finally {
        // Stop timer
        if (refreshTimerInterval) {
            clearInterval(refreshTimerInterval);
            setRefreshTimerInterval(null);
        }
        setLoadingCaptcha(false);
    }
};

// Listen for user events
useEffect(() => {
    if (!socket) return;

    const handleUserAdded = (data) => {
        if (data?.server_id === serverId) {
            setUsers(prev => [...prev, data?.user]);
        }
    };

    const handleUserUpdated = (data) => {
        if (data?.server_id === serverId) {
            setUsers(prev =>
                prev.map(user => user.id === data?.user?.id ? data.user : user)
            );
        }
    };

    const handleUserDeleted = (data) => {
        if (data?.server_id === serverId) {
            setUsers(prev =>
                prev.filter(user => user.id !== data?.user_id)
            );
        }
    };

    socket.on('user_added', handleUserAdded);
    socket.on('user_updated', handleUserUpdated);
    socket.on('user_deleted', handleUserDeleted);

    return () => {
        socket.off('user_added', handleUserAdded);
        socket.off('user_updated', handleUserUpdated);
        socket.off('user_deleted', handleUserDeleted);
    };
}, [socket, serverId]);

// Reset selection when users change
// Fixed dependency array by removing 'users'
useEffect(() => {
    setSelectedUsers([]);
    setSelectAll(false);
}, []);

const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
};

const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
};

const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
        name: user.name || '',
        password_surfebe: '' // For security, don't pre-fill password
    });
    setShowEditForm(true);
    // Hide add form if it's open
    setShowAddForm(false);
};

const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (!editingUser || !editingUser.email) {
        setError('User email not found. Cannot update user.');
        return;
    }
    
    try {
        const updatedUser = await api.updateUserOnServer(
            serverId, 
            editingUser.email, 
            editFormData
        );
        
        if (updatedUser) {
            // Update user in the state
            setUsers(prev => 
                prev.map(user => 
                    user.id === editingUser.id ? { ...user, ...updatedUser } : user
                )
            );
            
            // Close the edit form
            setShowEditForm(false);
            setEditingUser(null);
            setEditFormData({
                name: '',
                password_surfebe: ''
            });
        }
    } catch (err) {
        console.error('Error updating user:', err);
        setError('Failed to update user: ' + (err.message || 'Unknown error'));
    }
};

const handleAddUser = async (e) => {
    e.preventDefault();

    try {
        // Use the API service to add user to server
        const response = await api.addUserToServer(serverId, formData);
        
        if (response) {
            // Add the new user to the list if successful
            setUsers(prev => [...prev, response]);
            
            // Reset form and hide it
            setShowAddForm(false);
            setFormData({
                name: '',
                email: '',
                password_surfebe: ''
            });
        }
    } catch (err) {
        console.error('Error adding user:', err);
        setError('Failed to add user: ' + (err.message || 'Unknown error'));
    }
};

const handleDeleteUser = async (userId, userEmail) => {
    if (!userEmail) {
        setError('User email not found. Cannot delete user.');
        return;
    }
    
    // Set the user to delete and show confirmation dialog
    setUserToDelete({ id: userId, email: userEmail });
    setShowDeleteConfirm(true);
};

const confirmDeleteUser = async () => {
    try {
        await api.deleteUserFromServer(serverId, userToDelete.email);
        setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
        // Remove from selected if present
        setSelectedUsers(prev => prev.filter(id => id !== userToDelete.id));
        
        // Hide confirmation dialog and clear user to delete
        setShowDeleteConfirm(false);
        setUserToDelete(null);
    } catch (err) {
        console.error('Error deleting user:', err);
        setError('Failed to delete user: ' + (err.message || 'Unknown error'));
        setShowDeleteConfirm(false);
    }
};

// Table sorting handler
const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
};

// Table filtering and sorting
// Enhanced search to search all columns
const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;

    const searchTermLower = searchTerm.toLowerCase();

    // Convert all user properties to string and check if any contains the search term
    return Object.entries(user || {}).some(([key, value]) => {
        // Skip non-searchable properties if needed
        if (['id', '__v', '_id'].includes(key)) {
            return String(value).includes(searchTerm);
        }

        // Convert value to string and check if it contains the search term
        const stringValue = String(value || '').toLowerCase();
        return stringValue.includes(searchTermLower);
    });
});

const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a[sortConfig.key] === undefined) return 1;
    if (b[sortConfig.key] === undefined) return -1;

    if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
});

// Pagination
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentUsers = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

// Handle selection
const handleSelectAll = () => {
    if (selectAll) {
        setSelectedUsers([]);
    } else {
        setSelectedUsers(currentUsers.map(user => user.id));
    }
    setSelectAll(!selectAll);
};

const handleSelectUser = (userId) => {
    setSelectedUsers(prevSelected => {
        if (prevSelected.includes(userId)) {
            return prevSelected.filter(id => id !== userId);
        }
        return [...prevSelected, userId];
    });
};

// Bulk delete handler
const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;

    // Show bulk delete confirmation
    setShowBulkDeleteConfirm(true);
};

const confirmBulkDelete = async () => {
    try {
        // Find selected users and get their emails
        const selectedUserDetails = users.filter(user => selectedUsers.includes(user.id));
        
        // Process users one by one
        for (const user of selectedUserDetails) {
            if (user.email) {
                await api.deleteUserFromServer(serverId, user.email);
            } else {
                console.warn(`User with ID ${user.id} has no email, skipping`);
            }
        }

        setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
        setSelectedUsers([]);
        setSelectAll(false);
        
        // Hide confirmation dialog
        setShowBulkDeleteConfirm(false);
    } catch (err) {
        console.error('Error in bulk delete:', err);
        setError('Failed to delete some users: ' + (err.message || 'Unknown error'));
        setShowBulkDeleteConfirm(false);
    }
};

if (loading) return <div>Loading users...</div>;

return (
    <div className="user-management">
        <div className="user-management-header">
            <h3>User Management</h3>
            <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowAddForm(!showAddForm)}
            >
                {showAddForm ? 'Cancel' : 'Add User'}
            </button>
        </div>

        {error && <div className="error">{error}</div>}
        
        {/* Captcha Token Information */}
        <div className="captcha-info-container">
            <div className="captcha-info-header">
                <h4>reCAPTCHA Token Information</h4>
                <button
                    type="button"
                    className="btn btn-refresh"
                    onClick={refreshCaptchaToken}
                    disabled={loadingCaptcha}
                >
                    {loadingCaptcha ? 'Refreshing Token...' : 'Refresh Token'}
                </button>
            </div>
            
            {loadingCaptcha && (
                <div className="captcha-loading">
                    <div className="loading-spinner"></div>
                    <p>Refreshing reCAPTCHA token, please wait... ({refreshTimer}s)</p>
                </div>
            )}
            
            {!loadingCaptcha && captchaData && (
                <div className="captcha-details">
                    <div className="captcha-row">
                        <div className="captcha-label">Site:</div>
                        <div className="captcha-value">{captchaData.site}</div>
                    </div>
                    <div className="captcha-row">
                        <div className="captcha-label">Site Key:</div>
                        <div className="captcha-value">{captchaData.site_key}</div>
                    </div>
                    <div className="captcha-row">
                        <div className="captcha-label">Status:</div>
                        <div className="captcha-value">
                            <span className={`status-badge ${captchaData.status_g_response ? 'active' : 'inactive'}`}>
                                {captchaData.status_g_response ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                    <div className="captcha-row">
                        <div className="captcha-label">Time:</div>
                        <div className="captcha-value">{captchaData.time_g_response}</div>
                    </div>
                    <div className="captcha-row">
                        <div className="captcha-label">Token:</div>
                        <div className="captcha-value token">
                            {captchaData.g_response ? (
                                <>
                                    <span className="token-text">{captchaData.g_response.substring(0, 60)}...</span>
                                    <button
                                        className="btn btn-sm btn-copy"
                                        onClick={() => {
                                            navigator.clipboard.writeText(captchaData.g_response);
                                            // Could add toast notification here
                                        }}
                                        title="Copy token to clipboard"
                                    >
                                        Copy
                                    </button>
                                </>
                            ) : (
                                <span className="no-token">No token available</span>
                            )}
                        </div>
                    </div>
                    <div className="captcha-row">
                        <div className="captcha-label">Last Updated:</div>
                        <div className="captcha-value">
                            {new Date(captchaData.updated_at).toLocaleString()}
                        </div>
                    </div>
                </div>
            )}
            
            {!loadingCaptcha && !captchaData && (
                <div className="no-captcha-data">No reCAPTCHA token information available.</div>
            )}
        </div>

        {showAddForm && (
            <div className="add-user-form">
                <h4>Add New User</h4>
                <form onSubmit={handleAddUser}>
                    <div className="form-group">
                        <label htmlFor="name">Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password_surfebe">Password:</label>
                        <input
                            type="password"
                            id="password_surfebe"
                            name="password_surfebe"
                            value={formData.password_surfebe}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-success">Add User</button>
                </form>
            </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && userToDelete && (
            <div className="modal-overlay">
                <div className="modal-container">
                    <div className="modal-header">
                        <h4>Confirm Delete</h4>
                    </div>
                    <div className="modal-body">
                        <p>Are you sure you want to delete this user?</p>
                        <p className="user-info">
                            <strong>Email:</strong> {userToDelete.email}
                        </p>
                    </div>
                    <div className="modal-footer">
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => {
                                setShowDeleteConfirm(false);
                                setUserToDelete(null);
                            }}
                        >
                            Cancel
                        </button>
                        <button 
                            className="btn btn-danger" 
                            onClick={confirmDeleteUser}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteConfirm && (
            <div className="modal-overlay">
                <div className="modal-container">
                    <div className="modal-header">
                        <h4>Confirm Bulk Delete</h4>
                    </div>
                    <div className="modal-body">
                        <p>Are you sure you want to delete <strong>{selectedUsers.length}</strong> selected users?</p>
                        <p className="warning">This action cannot be undone!</p>
                    </div>
                    <div className="modal-footer">
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => setShowBulkDeleteConfirm(false)}
                        >
                            Cancel
                        </button>
                        <button 
                            className="btn btn-danger" 
                            onClick={confirmBulkDelete}
                        >
                            Delete All
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {showEditForm && editingUser && (
            <div className="edit-user-form">
                <h4>Edit User: {editingUser.email}</h4>
                <form onSubmit={handleUpdateUser}>
                    <div className="form-group">
                        <label htmlFor="edit-name">Name:</label>
                        <input
                            type="text"
                            id="edit-name"
                            name="name"
                            value={editFormData.name}
                            onChange={handleEditInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-password">New Password:</label>
                        <input
                            type="password"
                            id="edit-password"
                            name="password_surfebe"
                            value={editFormData.password_surfebe}
                            onChange={handleEditInputChange}
                            placeholder="Leave blank to keep current password"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-success">Update User</button>
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={() => {
                                setShowEditForm(false);
                                setEditingUser(null);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* Table controls */}
        <div className="table-controls">
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search all fields..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="table-actions">
                <select
                    value={itemsPerPage}
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                    className="items-per-page"
                >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={1000}>1000 per page</option>
                </select>

                {selectedUsers.length > 0 && (
                    <button
                        type="button"
                        className="btn btn-danger bulk-action"
                        onClick={handleBulkDelete}
                        aria-label={`Delete ${selectedUsers.length} selected users`}
                    >
                        Delete Selected ({selectedUsers.length})
                    </button>
                )}
            </div>
        </div>

        {filteredUsers.length === 0 ? (
            <p>No users found for this server.</p>
        ) : (
            <div className="user-list">
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={handleSelectAll}
                                    aria-label="Select all users"
                                />
                            </th>
                            <th>
                                <button
                                    type="button"
                                    className="table-sort-button"
                                    onClick={() => requestSort('id')}
                                    aria-label="Sort by ID"
                                >
                                    ID {sortConfig.key === 'id' && (
                                        <span className="sort-icon">
                                            {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </button>
                            </th>
                            <th>
                                <button
                                    type="button"
                                    className="table-sort-button"
                                    onClick={() => requestSort('name')}
                                    aria-label="Sort by name"
                                >
                                    Name {sortConfig.key === 'name' && (
                                        <span className="sort-icon">
                                            {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </button>
                            </th>
                            <th>
                                <button
                                    type="button"
                                    className="table-sort-button"
                                    onClick={() => requestSort('email')}
                                    aria-label="Sort by email"
                                >
                                    Email {sortConfig.key === 'email' && (
                                        <span className="sort-icon">
                                            {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </button>
                            </th>
                            <th>
                                <button
                                    type="button"
                                    className="table-sort-button"
                                    onClick={() => requestSort('uuid')}
                                    aria-label="Sort by UUID"
                                >
                                    UUID {sortConfig.key === 'uuid' && (
                                        <span className="sort-icon">
                                            {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </button>
                            </th>
                            <th>
                                <button
                                    type="button"
                                    className="table-sort-button"
                                    onClick={() => requestSort('balanceSurfebe')}
                                    aria-label="Sort by balance"
                                >
                                    Balance {sortConfig.key === 'balanceSurfebe' && (
                                        <span className="sort-icon">
                                            {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </button>
                            </th>
                            <th>
                                <button
                                    type="button"
                                    className="table-sort-button"
                                    onClick={() => requestSort('isRunning')}
                                    aria-label="Sort by status"
                                >
                                    Status {sortConfig.key === 'isRunning' && (
                                        <span className="sort-icon">
                                            {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </button>
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentUsers.map(user => (
                            <tr key={user.id} className={selectedUsers.includes(user.id) ? 'selected-row' : ''}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => handleSelectUser(user.id)}
                                        aria-label={`Select user ${user?.name || user.id}`}
                                    />
                                </td>
                                <td>{user.id}</td>
                                <td>{user?.name}</td>
                                <td>{user?.email}</td>
                                <td>{user?.uuid}</td>
                                <td>{user?.balanceSurfebe || '0'}</td>
                                <td>
                                    <span className={`status-badge ${user?.isRunning ? 'active' : 'inactive'}`}>
                                        {user?.isRunning ? 'Running' : 'Stopped'}
                                    </span>
                                </td>
                                <td className="actions">
                                    <div className="button-group">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-primary"
                                            onClick={() => handleEditUser(user)}
                                            aria-label={`Edit user ${user?.name || user.id}`}
                                            disabled={!user.email}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDeleteUser(user.id, user.email)}
                                            aria-label={`Delete user ${user?.name || user.id}`}
                                            disabled={!user.email}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination controls */}
                <div className="pagination">
                    <button
                        type="button"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="pagination-button"
                        aria-label="Go to first page"
                    >
                        &laquo; First
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="pagination-button"
                        aria-label="Go to previous page"
                    >
                        &lt; Prev
                    </button>

                    <span className="pagination-info">
                        Page {currentPage} of {totalPages || 1}
                        ({filteredUsers.length} users)
                    </span>

                    <button
                        type="button"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="pagination-button"
                        aria-label="Go to next page"
                    >
                        Next &gt;
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="pagination-button"
                        aria-label="Go to last page"
                    >
                        Last &raquo;
                    </button>
                </div>
            </div>
        )}

        {/* CSS Styles for the enhanced table */}
        <style jsx>{`
    .user-management {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }
    
    .user-management-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .table-controls {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
      align-items: center;
    }
    
    .search-input {
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      min-width: 250px;
    }
    
    .table-actions {
      display: flex;
      gap: 10px;
    }
    
    .items-per-page {
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #ccc;
    }
    
    .user-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .user-table th, .user-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    
    .user-table th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #444;
    }
    
    .user-table tr:last-child td {
      border-bottom: none;
    }
    
    .user-table tbody tr:hover {
      background-color: #f8f9fa;
    }
    
    .table-sort-button {
      background: none;
      border: none;
      cursor: pointer;
      font-weight: 600;
      color: #444;
      text-align: left;
      padding: 0;
      width: 100%;
      display: flex;
      align-items: center;
    }
    
    .table-sort-button:hover {
      text-decoration: underline;
    }
    
    .sort-icon {
      margin-left: 5px;
      font-size: 12px;
    }
    
    .status-badge {
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      display: inline-block;
    }
    
    .status-badge.active {
      background-color: #d4edda;
      color: #155724;
    }
    
    .status-badge.inactive {
      background-color: #f8d7da;
      color: #721c24;
    }
    
    .actions {
      display: flex;
      gap: 8px;
    }
    
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-danger {
      background-color: #dc3545;
      color: white;
    }
    
    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 20px;
      gap: 8px;
    }
    
    .pagination-button {
      padding: 6px 12px;
      border: 1px solid #dee2e6;
      background-color: #fff;
      color: #495057;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .pagination-button:disabled {
      color: #adb5bd;
      cursor: not-allowed;
    }
    
    .pagination-button:hover:not(:disabled) {
      background-color: #e9ecef;
    }
    
    .pagination-info {
      margin: 0 12px;
      color: #6c757d;
    }
    
    .selected-row {
      background-color: #e8f4ff;
    }
    
    .bulk-action {
      padding: 8px 16px;
    }
    
    .error {
      color: #dc3545;
      padding: 10px;
      background-color: #f8d7da;
      border-radius: 4px;
      margin-bottom: 16px;
    }
    
    .add-user-form, .edit-user-form {
      margin-bottom: 20px;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }
    
    .edit-user-form {
      border-left: 4px solid #007bff;
    }
    
    .form-group {
      margin-bottom: 16px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .form-group input, .form-group select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ced4da;
      border-radius: 4px;
    }
    
    .btn-success {
      background-color: #28a745;
      color: white;
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
      margin-left: 10px;
    }
    
    .form-actions {
      display: flex;
      margin-top: 20px;
    }
    
    .button-group {
      display: flex;
      gap: 8px;
    }
    
    /* Modal styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .modal-container {
      background-color: white;
      border-radius: 8px;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid #e9ecef;
      background-color: #f8f9fa;
    }
    
    .modal-header h4 {
      margin: 0;
      color: #343a40;
    }
    
    .modal-body {
      padding: 20px;
    }
    
    .modal-footer {
      padding: 16px 20px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      border-top: 1px solid #e9ecef;
      background-color: #f8f9fa;
    }
    
    .user-info {
      padding: 10px;
      background-color: #f0f0f0;
      border-radius: 4px;
      margin-top: 10px;
    }
    
    .warning {
      color: #dc3545;
      font-weight: 500;
    }
    
    /* Captcha styles */
    .captcha-info-container {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      border: 1px solid #e9ecef;
    }
    
    .captcha-info-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e9ecef;
    }
    
    .captcha-info-header h4 {
      margin: 0;
      color: #495057;
    }
    
    .btn-refresh {
      background-color: #17a2b8;
      color: white;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .btn-refresh:hover {
      background-color: #138496;
    }
    
    .btn-refresh:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }
    
    .captcha-loading {
      padding: 20px;
      color: #6c757d;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      background-color: #f8f9fa;
      border-radius: 4px;
      border: 1px dashed #ced4da;
      margin: 10px 0;
    }
    
    .captcha-loading p {
      margin: 0;
      font-weight: 500;
    }
    
    .loading-spinner {
      width: 30px;
      height: 30px;
      border: 3px solid rgba(0, 123, 255, 0.2);
      border-radius: 50%;
      border-top-color: #007bff;
      animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .no-captcha-data {
      padding: 15px;
      color: #6c757d;
      text-align: center;
      font-style: italic;
      background-color: #f1f3f5;
      border-radius: 4px;
    }
    
    .captcha-details {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .captcha-row {
      display: flex;
      border-bottom: 1px solid #f0f0f0;
      padding-bottom: 8px;
    }
    
    .captcha-label {
      flex: 0 0 120px;
      font-weight: 600;
      color: #495057;
    }
    
    .captcha-value {
      flex: 1;
      word-break: break-word;
    }
    
    .captcha-value.token {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .token-text {
      font-family: monospace;
      background-color: #f1f3f5;
      padding: 4px 8px;
      border-radius: 4px;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .btn-copy {
      background-color: #6c757d;
      color: white;
      padding: 4px 8px;
      font-size: 12px;
    }
    
    .btn-copy:hover {
      background-color: #5a6268;
    }
    
    .no-token {
      color: #6c757d;
      font-style: italic;
    }
  `}</style>
    </div>
);
}

export default UserManagement