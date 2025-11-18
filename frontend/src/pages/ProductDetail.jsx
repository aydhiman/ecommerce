import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import { getImageUrl, getPlaceholderImage } from '../utils/imageHelper';
import './ProductDetail.css';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`);
      return response.data;
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/cart', {
        productId: id,
        quantity,
      });
      return response.data;
    },
    onSuccess: () => {
      setMessage('Added to cart successfully!');
      queryClient.invalidateQueries(['cart']);
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (error) => {
      setMessage(error.response?.data?.error || 'Failed to add to cart');
    },
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'user') {
      setMessage('Only users can add items to cart');
      return;
    }
    addToCartMutation.mutate();
  };

  if (isLoading) return <div className="loading">Loading product...</div>;
  if (error) return <div className="error">Error loading product: {error.message}</div>;
  if (!product) return <div className="error">Product not found</div>;

  return (
    <div className="product-detail-page">
      <button onClick={() => navigate(-1)} className="btn-back">
        ← Back
      </button>

      <div className="product-detail-container">
        <div className="product-image-large">
          <img
            src={getImageUrl(product.image) || getPlaceholderImage(400, 400)}
            alt={product.name}
            onError={(e) => {
              e.target.src = getPlaceholderImage(400, 400);
            }}
          />
        </div>

        <div className="product-details">
          <h1>{product.name}</h1>
          
          <div className="product-meta">
            <span className="category">{product.category}</span>
            <span className="seller">
              Sold by: {product.seller?.name || 'Unknown'}
            </span>
          </div>

          <p className="price">₹{product.price?.toLocaleString()}</p>

          <p className="description">{product.description}</p>

          <div className="stock-info">
            {product.stock > 0 ? (
              <span className="in-stock">✓ {product.stock} items in stock</span>
            ) : (
              <span className="out-of-stock">✗ Out of stock</span>
            )}
          </div>

          {product.stock > 0 && user?.role === 'user' && (
            <div className="purchase-section">
              <div className="quantity-selector">
                <label>Quantity:</label>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="qty-btn"
                >
                  -
                </button>
                <span className="qty-display">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="qty-btn"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="btn btn-primary btn-large"
                disabled={addToCartMutation.isPending}
              >
                {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}

          {!isAuthenticated && (
            <div className="auth-prompt">
              <p>Please <a href="/login">login</a> to add items to cart</p>
            </div>
          )}

          {message && (
            <div className={message.includes('success') ? 'success-message' : 'error-message'}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
