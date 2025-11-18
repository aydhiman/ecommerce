import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import './Navbar.css';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
              ) : (
                <>
                  <Link to="/cart">Cart</Link>
                  <Link to="/orders">Orders</Link>
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
