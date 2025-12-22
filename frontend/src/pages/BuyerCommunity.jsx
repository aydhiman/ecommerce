import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import './Community.css';

function BuyerCommunity() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [ws, setWs] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const WS_URL = API_URL.replace('http', 'ws');

  useEffect(() => {
    if (!token || user?.role !== 'user') {
      navigate('/');
      return;
    }

    fetchNotifications();
    fetchPreferences();

    // Connect to WebSocket
    const websocket = new WebSocket(`${WS_URL}?token=${token}`);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_notification') {
        // Add new notification to the list
        setNotifications((prev) => [data.notification, ...prev]);
        // Show success message
        setSuccess('New notification received!');
        setTimeout(() => setSuccess(''), 3000);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [token, user, navigate, WS_URL]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/community/notifications`, {
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

  const fetchPreferences = async () => {
    try {
      const response = await fetch(`${API_URL}/api/community/preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setPreferences(data.preferences);
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_URL}/api/community/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Update UI
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const updatePreferences = async (updates) => {
    try {
      const response = await fetch(`${API_URL}/api/community/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok) {
        setPreferences(data.preferences);
        setSuccess('Preferences updated');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to update preferences');
    }
  };

  const toggleNotifications = async () => {
    await updatePreferences({
      enableNotifications: !preferences.enableNotifications,
    });
  };

  const togglePreference = async (key) => {
    await updatePreferences({
      preferences: {
        ...preferences.preferences,
        [key]: !preferences.preferences[key],
      },
    });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="community-container">
      <div className="community-header">
        <div>
          <h1>
            Notifications
            {unreadCount > 0 && <span className="unread-badge" style={{ marginLeft: '1rem' }}>{unreadCount}</span>}
          </h1>
          <p>Stay updated with announcements and promotions from sellers</p>
        </div>
        <div className="connection-status">
          <div className={`status-indicator ${wsConnected ? 'connected' : 'disconnected'}`}></div>
          {wsConnected ? 'Live Updates Active' : 'Disconnected'}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {preferences && (
        <div className="preferences-section">
          <h3>Notification Preferences</h3>
          
          <div className="preference-item">
            <span>Enable Notifications</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.enableNotifications}
                onChange={toggleNotifications}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {preferences.enableNotifications && (
            <>
              <div className="preference-item">
                <span>Announcements</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.preferences.announcements}
                    onChange={() => togglePreference('announcements')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="preference-item">
                <span>Promotions</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.preferences.promotions}
                    onChange={() => togglePreference('promotions')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="preference-item">
                <span>Updates</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.preferences.updates}
                    onChange={() => togglePreference('updates')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="preference-item">
                <span>Alerts</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.preferences.alerts}
                    onChange={() => togglePreference('alerts')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </>
          )}
        </div>
      )}

      <div className="notifications-list">
        <div className="notifications-header">
          <h2>All Notifications</h2>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
              onClick={() => !notif.isRead && markAsRead(notif._id)}
              style={{ cursor: !notif.isRead ? 'pointer' : 'default' }}
            >
              <div className="notification-header">
                <div>
                  <h3 className="notification-title">
                    {notif.title}
                    {!notif.isRead && <span className="unread-badge" style={{ marginLeft: '0.5rem' }}>New</span>}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#7f8c8d', margin: '0.25rem 0 0 0' }}>
                    From: {notif.sellerId?.name || 'Seller'}
                  </p>
                </div>
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
                <span>{new Date(notif.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BuyerCommunity;
