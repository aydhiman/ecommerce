import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { getImageUrl, getPlaceholderImage } from '../utils/imageHelper';
import './Seller.css';

function SellerDashboard() {
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyForm, setNotifyForm] = useState({
    title: '',
    message: '',
    type: 'promotion'
  });
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState('');
  const [notifyError, setNotifyError] = useState('');

  const { data: products, isLoading } = useQuery({
    queryKey: ['seller-products'],
    queryFn: async () => {
      const response = await api.get('/seller/products');
      return response.data;
    },
  });

  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!notifyForm.title.trim() || !notifyForm.message.trim()) {
      setNotifyError('Title and message are required');
      return;
    }
    
    if (notifyForm.message.length > 300) {
      setNotifyError('Message should be under 300 characters (about 3-4 lines)');
      return;
    }

    setNotifyLoading(true);
    setNotifyError('');

    try {
      await api.post('/community/notifications', {
        title: notifyForm.title,
        message: notifyForm.message,
        type: notifyForm.type,
        targetAudience: 'all',
        priority: 'medium'
      });
      
      setNotifySuccess('Notification sent to all buyers!');
      setNotifyForm({ title: '', message: '', type: 'promotion' });
      setTimeout(() => {
        setNotifySuccess('');
        setShowNotifyModal(false);
      }, 2000);
    } catch (err) {
      setNotifyError(err.response?.data?.error || 'Failed to send notification');
    } finally {
      setNotifyLoading(false);
    }
  };

  return (
    <div className="seller-dashboard">
      <div className="dashboard-header">
        <h1>Seller Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setShowNotifyModal(true)} 
            className="btn btn-notify"
            style={{ 
              background: '#10b981', 
              color: 'white', 
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            🔔 Send Notification
          </button>
          <Link to="/seller/orders" className="btn btn-secondary">
            📦 Manage Orders
          </Link>
          <Link to="/seller/add-product" className="btn btn-primary">
            + Add New Product
          </Link>
        </div>
      </div>

      {/* Notification Modal */}
      {showNotifyModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowNotifyModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}
          >
            <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>
              🔔 Send Notification to Buyers
            </h2>
            
            {notifySuccess && (
              <div style={{ 
                padding: '1rem', 
                background: '#d1fae5', 
                color: '#065f46', 
                borderRadius: '8px', 
                marginBottom: '1rem' 
              }}>
                ✅ {notifySuccess}
              </div>
            )}
            
            {notifyError && (
              <div style={{ 
                padding: '1rem', 
                background: '#fee2e2', 
                color: '#991b1b', 
                borderRadius: '8px', 
                marginBottom: '1rem' 
              }}>
                ❌ {notifyError}
              </div>
            )}

            <form onSubmit={handleSendNotification}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Notification Type
                </label>
                <select
                  value={notifyForm.type}
                  onChange={(e) => setNotifyForm({ ...notifyForm, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem'
                  }}
                >
                  <option value="promotion">🏷️ Promotion / Offer</option>
                  <option value="announcement">📢 Announcement</option>
                  <option value="update">📦 Product Update</option>
                  <option value="alert">⚠️ Alert</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={notifyForm.title}
                  onChange={(e) => setNotifyForm({ ...notifyForm, title: e.target.value })}
                  placeholder="e.g., 🎉 50% OFF on all products!"
                  maxLength={100}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Message (max 300 characters)
                </label>
                <textarea
                  value={notifyForm.message}
                  onChange={(e) => setNotifyForm({ ...notifyForm, message: e.target.value })}
                  placeholder="Write your offer details here... (3-4 lines)"
                  maxLength={300}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
                <small style={{ color: '#6b7280' }}>
                  {notifyForm.message.length}/300 characters
                </small>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  disabled={notifyLoading}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: notifyLoading ? 'not-allowed' : 'pointer',
                    opacity: notifyLoading ? 0.7 : 1
                  }}
                >
                  {notifyLoading ? 'Sending...' : '📤 Send to All Buyers'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotifyModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <div className="products-table">
          <h2>My Products ({products?.length || 0})</h2>
          {!products || products.length === 0 ? (
            <div className="no-products">
              <p>You haven't added any products yet.</p>
              <Link to="/seller/add-product" className="btn btn-primary">
                Add Your First Product
              </Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <img
                        src={getImageUrl(product.image) || getPlaceholderImage(50, 50)}
                        alt={product.name}
                        className="product-thumb"
                        onError={(e) => e.target.src = getPlaceholderImage(50, 50)}
                      />
                    </td>
                    <td>{product.name}</td>
                    <td>₹{product.price?.toLocaleString()}</td>
                    <td>{product.stock}</td>
                    <td>{product.category}</td>
                    <td>
                      <Link to={`/seller/edit-product/${product._id}`} className="btn-edit">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default SellerDashboard;
