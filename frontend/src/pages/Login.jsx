import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import './Auth.css';

function Login() {
  const [isUser, setIsUser] = useState(true);
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const credentials = isUser
      ? { phone: formData.phone, password: formData.password }
      : { email: formData.email, password: formData.password };

    const result = await login(credentials, isUser ? 'user' : 'seller');

    if (result.success) {
      navigate(isUser ? '/' : '/seller/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>

        <div className="auth-tabs">
          <button
            className={isUser ? 'active' : ''}
            onClick={() => setIsUser(true)}
          >
            User
          </button>
          <button
            className={!isUser ? 'active' : ''}
            onClick={() => setIsUser(false)}
          >
            Seller
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isUser ? (
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Enter your phone number"
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your business email"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
