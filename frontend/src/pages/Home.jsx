import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { getImageUrl, getPlaceholderImage } from '../utils/imageHelper';
import './Home.css';

function Home() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const response = await api.get('/products?limit=8');
      return response.data;
    },
  });

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to Our E-Commerce Store</h1>
          <p>Discover amazing products at great prices</p>
          <div className="hero-buttons">
            <Link to="/products" className="btn btn-primary">
              Shop Now
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories">
        <div className="container">
          <h2>Shop by Category</h2>
          <div className="category-grid">
            <Link to="/products?category=electronics" className="category-card">
              <div className="category-icon">💻</div>
              <h3>Electronics</h3>
            </Link>
            <Link to="/products?category=fashion" className="category-card">
              <div className="category-icon">👔</div>
              <h3>Fashion</h3>
            </Link>
            <Link to="/products?category=home" className="category-card">
              <div className="category-icon">🏠</div>
              <h3>Home & Garden</h3>
            </Link>
            <Link to="/products?category=sports" className="category-card">
              <div className="category-icon">⚽</div>
              <h3>Sports</h3>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products">
        <div className="container">
          <h2>Featured Products</h2>
          {isLoading ? (
            <div className="loading">Loading products...</div>
          ) : (
            <div className="product-grid">
              {products?.slice(0, 8).map((product) => (
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
                    <p className="price">₹{product.price?.toLocaleString()}</p>
                    <p className="category">{product.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="view-all">
            <Link to="/products" className="btn btn-primary">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🚚</div>
              <h3>Free Shipping</h3>
              <p>On orders over ₹500</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>Secure Payment</h3>
              <p>100% secure transactions</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">↩️</div>
              <h3>Easy Returns</h3>
              <p>30-day return policy</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">24/7</div>
              <h3>24/7 Support</h3>
              <p>Dedicated customer service</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
