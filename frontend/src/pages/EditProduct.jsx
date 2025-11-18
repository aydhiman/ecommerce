import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/axios';
import ImageUpload from '../components/ImageUpload';
import './Seller.css';

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    stock: '',
    image: ''
  });
  const [error, setError] = useState('');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`);
      return response.data;
    }
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price || '',
        description: product.description || '',
        category: product.category || '',
        stock: product.stock || '',
        image: product.image || ''
      });
    }
  }, [product]);

  const updateProductMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Updating product:', id, data);
      const response = await api.put(`/products/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Product updated successfully:', data);
      alert('✅ Product updated successfully!');
      navigate('/seller/dashboard');
    },
    onError: (error) => {
      console.error('Update product error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to update product';
      setError(errorMsg);
      alert('❌ ' + errorMsg);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    updateProductMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock)
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (isLoading) return <div className="loading">Loading product...</div>;

  return (
    <div className="seller-form-page">
      <h1>Edit Product</h1>

      <div className="form-container">
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Product Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price (₹) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="stock">Stock *</label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Home">Home & Garden</option>
              <option value="Sports">Sports</option>
              <option value="Books">Books</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Product Image</label>
            <ImageUpload 
              initialImage={formData.image}
              onImageUpload={(imagePath) => setFormData({ ...formData, image: imagePath })}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/seller/dashboard')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateProductMutation.isPending}
            >
              {updateProductMutation.isPending ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProduct;
