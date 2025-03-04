import { useState, useEffect } from 'react';
import api from '../services/api';

function UserManagement({ serverId, socket }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'User',
        status: 'Active'
    });

    // Table state management
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

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

    const handleAddUser = async (e) => {
        e.preventDefault();

        try {
            const response = await api.addUserToServer(serverId, formData);
            if (response) {
                setUsers(prev => [...prev, response]);
                setShowAddForm(false);
                setFormData({
                    name: '',
                    email: '',
                    role: 'User',
                    status: 'Active'
                });
            }
        } catch (err) {
            console.error('Error adding user:', err);
            setError('Failed to add user');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await api.deleteUserFromServer(serverId, userId);
                setUsers(prev => prev.filter(user => user.id !== userId));
                // Remove from selected if present
                setSelectedUsers(prev => prev.filter(id => id !== userId));
            } catch (err) {
                console.error('Error deleting user:', err);
                setError('Failed to delete user');
            }
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

        if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} selected users?`)) {
            try {
                // Assume the API supports bulk operations or make multiple calls
                for (const userId of selectedUsers) {
                    await api.deleteUserFromServer(serverId, userId);
                }

                setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
                setSelectedUsers([]);
                setSelectAll(false);
            } catch (err) {
                console.error('Error in bulk delete:', err);
                setError('Failed to delete some users');
            }
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
                            <label htmlFor="role">Role:</label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                            >
                                <option value="Admin">Admin</option>
                                <option value="Manager">Manager</option>
                                <option value="User">User</option>
                                <option value="Editor">Editor</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="status">Status:</label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>

                        <button type="submit" className="btn btn-success">Add User</button>
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
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDeleteUser(user.id)}
                                            aria-label={`Delete user ${user?.name || user.id}`}
                                        >
                                            Delete
                                        </button>
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
        
        .add-user-form {
          margin-bottom: 20px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
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
      `}</style>
        </div>
    );
}

export default UserManagement