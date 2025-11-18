import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { getImageUrl, getPlaceholderImage } from '../utils/imageHelper';
import './Products.css';

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const category = searchParams.get('category') || '';

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', searchTerm, category],
    queryFn: async () => {
      let url = '/products';
      if (searchTerm) {
        url = `/search?q=${searchTerm}`;
      } else if (category) {
        url = `/products?category=${category}`;
      }
      const response = await api.get(url);
      return searchTerm ? response.data.products : response.data;
    },
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSearchParams({});
  };

  return (
    <div className="products-page">
      <div className="products-header">
        <h1>Products</h1>
        
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        {(searchTerm || category) && (
          <div className="active-filters">
            {searchTerm && <span>Search: "{searchTerm}"</span>}
            {category && <span>Category: {category}</span>}
            <button onClick={clearFilters} className="btn-clear">Clear All</button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="loading">Loading products...</div>
      ) : error ? (
        <div className="error">Error loading products: {error.message}</div>
      ) : (
        <div className="products-container">
          {products && products.length > 0 ? (
            <div className="product-grid">
              {products.map((product) => (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  className="product-card"
                >
                  <div className="product-image">
                    <img
                      src={getImageUrl(product.image) || getPlaceholderImage(200, 200)}
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = getPlaceholderImage(200, 200);
                      }}
                    />
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="description">{product.description?.substring(0, 100)}...</p>
                    <p className="price">₹{product.price?.toLocaleString()}</p>
                    <p className="category">{product.category}</p>
                    <p className="stock">
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="no-products">
              <h2>No products found</h2>
              <p>Try adjusting your search or filters</p>
              <button onClick={clearFilters} className="btn btn-primary">
                View All Products
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Products;
