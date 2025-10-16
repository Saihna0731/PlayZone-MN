import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || 
        !formData.confirmPassword || !formData.fullName) {
      return 'Бүх шаардлагатай талбарыг бөглөнө үү';
    }

    if (formData.username.length < 3) {
      return 'Хэрэглэгчийн нэр 3-аас дээш тэмдэгт байх ёстой';
    }

    if (formData.username.length > 30) {
      return 'Хэрэглэгчийн нэр 30-аас бага тэмдэгт байх ёстой';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Зөв имэйл хаяг оруулна уу';
    }

    if (formData.password.length < 6) {
      return 'Нууц үг 6-аас дээш тэмдэгт байх ёстой';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Нууц үг таарахгүй байна';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const { confirmPassword, ...registrationData } = formData;
    const result = await register(registrationData);
    
    if (result.success) {
      navigate('/map');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-card register-card">
          <div className="auth-header">
            <h1>🎮 PC Center</h1>
            <h2>Бүртгүүлэх</h2>
            <p>Шинэ данс үүсгэн орно уу</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-message">
                <span>⚠️ {error}</span>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fullName">
                  👤 Бүтэн нэр *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Жишээ: Батбаяр"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="username">
                  🏷️ Хэрэглэгчийн нэр *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="username123"
                  minLength="3"
                  maxLength="30"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">
                📧 Имэйл хаяг *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                📱 Утасны дугаар
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="99123456"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">
                  🔒 Нууц үг *
                </label>
                <div className="password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="6+ тэмдэгт"
                    minLength="6"
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

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  🔒 Нууц үг давтах *
                </label>
                <div className="password-input">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Нууц үгээ давтна уу"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={`auth-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? '⏳ Бүртгүүлж байна...' : '🎉 Бүртгүүлэх'}
            </button>
          </form>

          <div className="auth-links">
            <p>
              Аль хэдийн данстай юу?{' '}
              <Link to="/login" className="auth-link">
                Нэвтрэх
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

export default Register;