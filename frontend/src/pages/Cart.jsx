import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getImageUrl, getPlaceholderImage } from '../utils/imageHelper';
import './Cart.css';

function Cart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cart, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await api.get('/cart');
      return response.data;
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId) => {
      await api.delete(`/cart/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Failed to remove item');
    }
  });

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting checkout...');
      const response = await api.post('/orders');
      console.log('Order response:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Order placed successfully:', data);
      queryClient.invalidateQueries(['cart']);
      queryClient.invalidateQueries(['orders']);
      alert('🎉 Order placed successfully!');
      navigate('/orders');
    },
    onError: (error) => {
      console.error('Checkout error:', error);
      console.error('Error response:', error.response);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to place order. Please try again.';
      alert('❌ ' + errorMsg);
    }
  });

  const total = cart?.items?.reduce((sum, item) => 
    sum + (item.product?.price || 0) * item.quantity, 0
  ) || 0;

  if (isLoading) return <div className="loading">Loading cart...</div>;
  
  if (error) {
    return (
      <div className="cart-page">
        <div className="error-message">
          Failed to load cart. Please try refreshing the page.
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>

      {!cart?.items || cart.items.length === 0 ? (
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Add some products to get started!</p>
          <button onClick={() => navigate('/products')} className="btn btn-primary">
            Browse Products
          </button>
        </div>
      ) : (
        <div className="cart-container">
          <div className="cart-items">
            {cart.items.map((item) => (
              <div key={item._id} className="cart-item">
                <img
                  src={getImageUrl(item.product?.image) || getPlaceholderImage(100, 100)}
                  alt={item.product?.name}
                  onError={(e) => e.target.src = getPlaceholderImage(100, 100)}
                />
                <div className="item-details">
                  <h3>{item.product?.name}</h3>
                  <p className="item-price">₹{item.product?.price?.toLocaleString()}</p>
                  <p className="item-quantity">Quantity: {item.quantity}</p>
                </div>
                <div className="item-actions">
                  <p className="item-total">
                    ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                  </p>
                  <button
                    onClick={() => removeFromCartMutation.mutate(item._id)}
                    className="btn-remove"
                    disabled={removeFromCartMutation.isPending}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal ({cart.items.length} items)</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>₹{total > 500 ? 0 : 50}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{(total + (total > 500 ? 0 : 50)).toLocaleString()}</span>
            </div>
            <button
              onClick={() => placeOrderMutation.mutate()}
              className="btn btn-primary btn-checkout"
              disabled={placeOrderMutation.isPending}
            >
              {placeOrderMutation.isPending ? 'Processing...' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
