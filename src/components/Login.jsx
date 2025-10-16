import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  });
  const [loginType, setLoginType] = useState('user'); // 'user' or 'admin'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/map';

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.emailOrUsername || !formData.password) {
      setError('Бүх талбарыг бөглөнө үү');
      setLoading(false);
      return;
    }

    const result = await login(formData.emailOrUsername, formData.password);
    
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-card">
          <div className="auth-header">
            <h1>🎮 PC Center</h1>
            <h2>Нэвтрэх</h2>
            <p>Таны дансанд нэвтрэн орно уу</p>
          </div>

          {/* Login Type Selector */}
          <div className="login-type-selector">
            <button
              type="button"
              className={`type-btn ${loginType === 'user' ? 'active' : ''}`}
              onClick={() => setLoginType('user')}
            >
              👤 Энгийн хэрэглэгч
            </button>
            <button
              type="button"
              className={`type-btn ${loginType === 'admin' ? 'active' : ''}`}
              onClick={() => setLoginType('admin')}
            >
              👑 Админ
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-message">
                <span>⚠️ {error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="emailOrUsername">
                📧 Имэйл хаяг эсвэл хэрэглэгчийн нэр
              </label>
              <input
                type="text"
                id="emailOrUsername"
                name="emailOrUsername"
                value={formData.emailOrUsername}
                onChange={handleChange}
                placeholder="example@email.com эсвэл username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                🔒 Нууц үг
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Нууц үгээ оруулна уу"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {loginType === 'admin' && (
              <div className="admin-notice">
                <span>⚡ Админ эрхээр нэвтэрч байна</span>
              </div>
            )}

            <button
              type="submit"
              className={`auth-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? '⏳ Нэвтэрч байна...' : '🚀 Нэвтрэх'}
            </button>
          </form>

          <div className="auth-links">
            <p>
              Бүртгэл байхгүй юу?{' '}
              <Link to="/register" className="auth-link">
                Бүртгүүлэх
              </Link>
            </p>
            <Link to="/map" className="back-link">
              ← Буцах
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;