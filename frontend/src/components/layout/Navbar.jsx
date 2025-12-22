import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import './Navbar.css';

function Navbar() {
  const { isAuthenticated, user, logout, token } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef(null);

  // WebSocket connection for real-time notifications (buyers only)
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'seller' && user?.role !== 'admin' && token) {
      const wsUrl = `ws://localhost:5000?token=${token}`;
      
      try {
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          console.log('🔌 Connected to notification service');
        };
        
        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'new_notification') {
              setNotifications(prev => [data.notification, ...prev].slice(0, 10));
              setUnreadCount(prev => prev + 1);
            }
          } catch (err) {
            console.error('Failed to parse notification:', err);
          }
        };
        
        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        wsRef.current.onclose = () => {
          console.log('WebSocket disconnected');
        };
      } catch (err) {
        console.error('Failed to connect WebSocket:', err);
      }
      
      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }
  }, [isAuthenticated, user?.role, token]);

  const handleLogout = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    logout();
    navigate('/login');
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setUnreadCount(0);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'promotion': return '🏷️';
      case 'announcement': return '📢';
      case 'update': return '📦';
      case 'alert': return '⚠️';
      default: return '🔔';
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">
          <h1>🛒 E-Commerce</h1>
        </Link>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>

          {isAuthenticated ? (
            <>
              {user?.role === 'seller' ? (
                <>
                  <Link to="/seller/dashboard">Dashboard</Link>
                  <Link to="/seller/add-product">Add Product</Link>
                </>
              ) : user?.role === 'admin' ? (
                <>
                  <Link to="/admin/dashboard">Admin Panel</Link>
                </>
              ) : (
                <>
                  <Link to="/cart">Cart</Link>
                  <Link to="/orders">Orders</Link>
                  
                  {/* Notification Bell for Buyers */}
                  <div className="notification-bell" style={{ position: 'relative' }}>
                    <button 
                      onClick={handleNotificationClick}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        position: 'relative',
                        padding: '0.5rem'
                      }}
                    >
                      🔔
                      {unreadCount > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          background: '#ef4444',
                          color: 'white',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold'
                        }}>
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Notification Dropdown */}
                    {showNotifications && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        width: '350px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        zIndex: 1000,
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{
                          padding: '1rem',
                          borderBottom: '1px solid #e5e7eb',
                          fontWeight: '600',
                          color: '#333'
                        }}>
                          📬 Notifications
                        </div>
                        
                        {notifications.length === 0 ? (
                          <div style={{
                            padding: '2rem',
                            textAlign: 'center',
                            color: '#6b7280'
                          }}>
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((notif, index) => (
                            <div 
                              key={notif.id || index}
                              style={{
                                padding: '1rem',
                                borderBottom: '1px solid #f3f4f6',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                              onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem'
                              }}>
                                <span>{getNotificationIcon(notif.type)}</span>
                                <strong style={{ color: '#333', fontSize: '0.95rem' }}>
                                  {notif.title}
                                </strong>
                              </div>
                              <p style={{
                                margin: 0,
                                color: '#4b5563',
                                fontSize: '0.9rem',
                                lineHeight: '1.4'
                              }}>
                                {notif.message}
                              </p>
                              <small style={{
                                color: '#9ca3af',
                                fontSize: '0.8rem',
                                marginTop: '0.5rem',
                                display: 'block'
                              }}>
                                From: {notif.sellerName} • {new Date(notif.createdAt).toLocaleTimeString()}
                              </small>
                            </div>
                          ))
                        )}
                        
                        <Link 
                          to="/community"
                          onClick={() => setShowNotifications(false)}
                          style={{
                            display: 'block',
                            padding: '1rem',
                            textAlign: 'center',
                            color: '#667eea',
                            textDecoration: 'none',
                            borderTop: '1px solid #e5e7eb',
                            fontWeight: '500'
                          }}
                        >
                          View All Notifications →
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
              <span className="user-info">Welcome, {user?.name}!</span>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary">
                Login
              </Link>
              <Link to="/register" className="btn btn-secondary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
