import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { getImageUrl, getPlaceholderImage } from '../utils/imageHelper';
import './Seller.css';

function SellerDashboard() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['seller-products'],
    queryFn: async () => {
      const response = await api.get('/seller/products');
      return response.data;
    },
  });

  return (
    <div className="seller-dashboard">
      <div className="dashboard-header">
        <h1>Seller Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/seller/orders" className="btn btn-secondary">
            📦 Manage Orders
          </Link>
          <Link to="/seller/add-product" className="btn btn-primary">
            + Add New Product
          </Link>
        </div>
      </div>

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
