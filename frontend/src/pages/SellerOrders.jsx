import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import './Seller.css';

function SellerOrders() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['seller-orders'],
    queryFn: async () => {
      const response = await api.get('/seller/orders');
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const response = await api.patch(`/seller/orders/${orderId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-orders']);
      alert('✅ Order status updated successfully!');
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || 'Failed to update order status';
      alert('❌ ' + errorMsg);
    },
  });

  const handleStatusChange = (orderId, newStatus) => {
    if (window.confirm(`Are you sure you want to change the status to "${newStatus}"?`)) {
      updateStatusMutation.mutate({ orderId, status: newStatus });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      shipped: '#8b5cf6',
      delivered: '#10b981',
      cancelled: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  if (isLoading) return <div className="loading">Loading orders...</div>;
  if (error) return <div className="error">Failed to load orders</div>;

  return (
    <div className="seller-page">
      <h1>Order Management</h1>

      {!orders || orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="orders-container">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>Order #{order._id.slice(-8)}</h3>
                  <p className="order-date">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="order-status" style={{ backgroundColor: getStatusColor(order.status) }}>
                  {order.status.toUpperCase()}
                </div>
              </div>

              <div className="order-customer">
                <p><strong>Customer:</strong> {order.user?.name || 'Unknown'}</p>
                <p><strong>Phone:</strong> {order.user?.phone || 'N/A'}</p>
                <p><strong>Address:</strong> {order.shippingAddress || 'N/A'}</p>
              </div>

              <div className="order-items">
                <h4>Items:</h4>
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <span>{item.product?.name || 'Unknown Product'}</span>
                    <span>Qty: {item.quantity}</span>
                    <span>₹{item.price?.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="order-total">
                <strong>Total: ₹{order.totalPrice?.toLocaleString()}</strong>
              </div>

              <div className="order-actions">
                <label htmlFor={`status-${order._id}`}>Update Status:</label>
                <select
                  id={`status-${order._id}`}
                  value={order.status}
                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  disabled={updateStatusMutation.isPending || order.status === 'delivered' || order.status === 'cancelled'}
                  className="status-select"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SellerOrders;
