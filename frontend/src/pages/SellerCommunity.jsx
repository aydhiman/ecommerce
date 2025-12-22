import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import './Community.css';

function SellerCommunity() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement',
    targetAudience: 'all',
    priority: 'medium',
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const WS_URL = API_URL.replace('http', 'ws');

  useEffect(() => {
    if (!token || user?.role !== 'seller') {
      navigate('/');
      return;
    }

    fetchNotifications();

    // Connect to WebSocket
    const ws = new WebSocket(`${WS_URL}?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [token, user, navigate, WS_URL]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/community/my-notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.message) {
      setError('Title and message are required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/community/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Notification sent successfully!');
        setFormData({
          title: '',
          message: '',
          type: 'announcement',
          targetAudience: 'all',
          priority: 'medium',
        });
        fetchNotifications();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to send notification');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDelete = async (notificationId) => {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/community/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess('Notification deleted');
        fetchNotifications();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to delete notification');
    }
  };

  return (
    <div className="community-container">
      <div className="community-header">
        <h1>Community Notifications</h1>
        <p>Send notifications to your buyers and manage your communication</p>
        <div className="connection-status">
          <div className={`status-indicator ${wsConnected ? 'connected' : 'disconnected'}`}></div>
          {wsConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="notification-form">
        <h2>Send New Notification</h2>
        
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter notification title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Message *</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Enter your message"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="announcement">Announcement</option>
              <option value="promotion">Promotion</option>
              <option value="update">Update</option>
              <option value="alert">Alert</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="targetAudience">Target Audience</label>
            <select
              id="targetAudience"
              name="targetAudience"
              value={formData.targetAudience}
              onChange={handleChange}
            >
              <option value="all">All Buyers</option>
              <option value="buyers">Active Buyers</option>
              <option value="followers">Followers</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn-send">
          Send Notification
        </button>
      </form>

      <div className="notifications-list">
        <div className="notifications-header">
          <h2>Sent Notifications</h2>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📢</div>
            <p>No notifications sent yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif._id} className="notification-item">
              <div className="notification-header">
                <h3 className="notification-title">{notif.title}</h3>
                <div className="notification-meta">
                  <span className={`notification-type ${notif.type}`}>
                    {notif.type}
                  </span>
                  <span className={`notification-priority ${notif.priority}`}>
                    {notif.priority}
                  </span>
                </div>
              </div>
              <p className="notification-message">{notif.message}</p>
              <div className="notification-footer">
                <div className="notification-stats">
                  <span>📤 Sent: {notif.stats.sent}</span>
                  <span>✅ Delivered: {notif.stats.delivered}</span>
                  <span>👁️ Read: {notif.stats.read}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span>{new Date(notif.createdAt).toLocaleString()}</span>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(notif._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SellerCommunity;
