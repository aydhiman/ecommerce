import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetModal, setResetModal] = useState({ show: false, type: '', id: '', name: '' });
  const [newPassword, setNewPassword] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchStats();
    fetchData();
  }, [token, user, navigate, pagination.page, activeTab]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'users' ? 'users' : 'sellers';
      const response = await fetch(
        `${API_URL}/admin/${endpoint}?page=${pagination.page}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      
      if (response.ok) {
        if (activeTab === 'users') {
          setUsers(data.users);
        } else {
          setSellers(data.sellers);
        }
        setPagination(data.pagination);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const endpoint = resetModal.type === 'user' ? 'users' : 'sellers';
      const response = await fetch(
        `${API_URL}/admin/${endpoint}/${resetModal.id}/reset-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newPassword }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Password reset for ${resetModal.name}`);
        setResetModal({ show: false, type: '', id: '', name: '' });
        setNewPassword('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to reset password');
    }
  };

  const handleToggleStatus = async (id, type) => {
    try {
      const endpoint = type === 'user' ? 'users' : 'sellers';
      const response = await fetch(
        `${API_URL}/admin/${endpoint}/${id}/toggle-status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        fetchData();
        fetchStats();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to toggle status');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (loading && !users.length && !sellers.length) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {stats && (
        <div className="admin-stats">
          <div className="stat-card">
            <h3>Total Users</h3>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
          <div className="stat-card">
            <h3>Active Users</h3>
            <div className="stat-value">{stats.activeUsers}</div>
          </div>
          <div className="stat-card">
            <h3>Total Sellers</h3>
            <div className="stat-value">{stats.totalSellers}</div>
          </div>
          <div className="stat-card">
            <h3>Active Sellers</h3>
            <div className="stat-value">{stats.activeSellers}</div>
          </div>
        </div>
      )}

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('users');
            setPagination({ ...pagination, page: 1 });
          }}
        >
          Users
        </button>
        <button
          className={`tab-button ${activeTab === 'sellers' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('sellers');
            setPagination({ ...pagination, page: 1 });
          }}
        >
          Sellers
        </button>
      </div>

      <div className={activeTab === 'users' ? 'users-table' : 'sellers-table'}>
        <div className="table-header">
          <h2>{activeTab === 'users' ? 'Users' : 'Sellers'}</h2>
        </div>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>{activeTab === 'users' ? 'Phone' : 'Email'}</th>
              {activeTab === 'users' && <th>Address</th>}
              {activeTab === 'sellers' && <th>Products</th>}
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeTab === 'users' ? (
              users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.phone}</td>
                  <td>{user.address}</td>
                  <td>
                    <span className={`status-badge ${user.isActive !== false ? 'active' : 'inactive'}`}>
                      {user.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-reset"
                        onClick={() => setResetModal({ show: true, type: 'user', id: user._id, name: user.name })}
                      >
                        Reset Password
                      </button>
                      <button
                        className={`btn btn-toggle ${user.isActive !== false ? '' : 'active'}`}
                        onClick={() => handleToggleStatus(user._id, 'user')}
                      >
                        {user.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              sellers.map((seller) => (
                <tr key={seller._id}>
                  <td>{seller.name}</td>
                  <td>{seller.email}</td>
                  <td>{seller.products?.length || 0}</td>
                  <td>
                    <span className={`status-badge ${seller.isActive ? 'active' : 'inactive'}`}>
                      {seller.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-reset"
                        onClick={() => setResetModal({ show: true, type: 'seller', id: seller._id, name: seller.name })}
                      >
                        Reset Password
                      </button>
                      <button
                        className={`btn btn-toggle ${seller.isActive ? '' : 'active'}`}
                        onClick={() => handleToggleStatus(seller._id, 'seller')}
                      >
                        {seller.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {pagination.pages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {resetModal.show && (
        <div className="modal-overlay" onClick={() => setResetModal({ show: false, type: '', id: '', name: '' })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reset Password for {resetModal.name}</h3>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
              />
            </div>
            <div className="modal-buttons">
              <button className="btn btn-primary" onClick={handleResetPassword}>
                Reset Password
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setResetModal({ show: false, type: '', id: '', name: '' });
                  setNewPassword('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
