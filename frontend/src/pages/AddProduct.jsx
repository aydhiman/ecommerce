import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../api/axios';
import ImageUpload from '../components/ImageUpload';
import './Seller.css';

function AddProduct() {
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
  const [imageUploading, setImageUploading] = useState(false);

  const addProductMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Adding product:', data);
      console.log('Token exists:', !!localStorage.getItem('token'));
      console.log('Token value:', localStorage.getItem('token'));
      console.log('API base URL:', api.defaults.baseURL);
      const response = await api.post('/products', data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Product added successfully:', data);
      alert('✅ Product added successfully!');
      navigate('/seller/dashboard');
    },
    onError: (error) => {
      console.error('Add product error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMsg = 'Failed to add product';
      
      if (!error.response) {
        // Network error or server not responding
        errorMsg = 'Network error. Please check if the server is running.';
      } else if (error.response.status === 401) {
        errorMsg = 'Session expired. Please log in again.';
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response.status === 400 && error.response.data?.error) {
        // Validation error
        errorMsg = error.response.data.error;
      } else if (error.response.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setError(errorMsg);
      alert('❌ ' + errorMsg);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    if (!formData.name || !formData.price || !formData.description || !formData.category || !formData.stock) {
      const errorMsg = 'Please fill in all required fields';
      setError(errorMsg);
      alert('❌ ' + errorMsg);
      return;
    }
    
    addProductMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      image: formData.image || '' // Ensure image is at least empty string
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="seller-form-page">
      <h1>Add New Product</h1>

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
              onImageUpload={(imagePath) => {
                console.log('Image uploaded, path:', imagePath);
                setFormData({ ...formData, image: imagePath });
              }}
              onUploadStart={() => setImageUploading(true)}
              onUploadEnd={() => setImageUploading(false)}
            />
            {formData.image && (
              <p style={{ color: 'green', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                ✓ Image uploaded successfully
              </p>
            )}
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
              disabled={addProductMutation.isPending || imageUploading}
            >
              {imageUploading ? 'Uploading Image...' : addProductMutation.isPending ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProduct;
