import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const Register = () => {
  const [params] = useSearchParams();
  const initialType = params.get('type') === 'owner' ? 'centerOwner' : 'user';
  const accountType = initialType;
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    centerName: ''
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
    // Нийтлэг validation
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      return 'Бүх шаардлагатай талбарыг бөглөнө үү';
    }

    // Хэрэглэгчийн validation
    if (accountType === 'user') {
      if (!formData.fullName || !formData.username) {
        return 'Бүх шаардлагатай талбарыг бөглөнө үү';
      }
      
      if (formData.username.length < 3) {
        return 'Хэрэглэгчийн нэр 3-аас дээш тэмдэгт байх ёстой';
      }

      if (formData.username.length > 30) {
        return 'Хэрэглэгчийн нэр 30-аас бага тэмдэгт байх ёстой';
      }
    }

    // Эзэмшигчийн validation
    if (accountType === 'centerOwner' && !formData.centerName) {
      return 'Game Center-ийн нэрийг оруулна уу';
    }

    // ✅ Имэйл шалгах
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return '⚠️ Зөв имэйл хаяг оруулна уу (жишээ: name@example.com)';
    }

    // ✅ Утасны дугаар шалгах (Монгол)
    if (formData.phone) {
      const phoneRegex = /^[0-9]{8}$/;
      if (!phoneRegex.test(formData.phone)) {
        return '⚠️ Утасны дугаар 8 оронтой тоо байх ёстой (жишээ: 99123456)';
      }
    }

    // ✅ Хүчтэй нууц үг шалгах
    if (formData.password.length < 8) {
      return '⚠️ Нууц үг 8-аас дээш тэмдэгт байх ёстой';
    }

    // Том үсэг шалгах
    if (!/[A-Z]/.test(formData.password)) {
      return '⚠️ Нууц үг дор хаяж 1 том үсэг агуулах ёстой (A-Z)';
    }

    // Жижиг үсэг шалгах
    if (!/[a-z]/.test(formData.password)) {
      return '⚠️ Нууц үг дор хаяж 1 жижиг үсэг агуулах ёстой (a-z)';
    }

    // Тоо шалгах
    if (!/[0-9]/.test(formData.password)) {
      return '⚠️ Нууц үг дор хаяж 1 тоо агуулах ёстой (0-9)';
    }

    // Тусгай тэмдэгт шалгах
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      return '⚠️ Нууц үг дор хаяж 1 тусгай тэмдэгт агуулах ёстой (!@#$%^&* гэх мэт)';
    }

    if (formData.password !== formData.confirmPassword) {
      return '⚠️ Нууц үг таарахгүй байна';
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
  const payload = { ...registrationData, accountType };
  const result = await register(payload);
    
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
        <div className="auth-card register-card" style={{
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          padding: '32px',
          maxWidth: '540px'
        }}>
          <div className="auth-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>🎮 Game Center</h1>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6', marginBottom: '6px' }}>
              {accountType === 'centerOwner' ? '🏢 Эзэмшигч бүртгэл' : '👤 Хэрэглэгч бүртгэл'}
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Шинэ данс үүсгэн орно уу</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-message">
                <span>⚠️ {error}</span>
              </div>
            )}

            {accountType === 'user' ? (
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
                    required={accountType === 'user'}
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
                    required={accountType === 'user'}
                  />
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="centerName">
                  🏢 Game Center-ийн нэр *
                </label>
                <input
                  type="text"
                  id="centerName"
                  name="centerName"
                  value={formData.centerName}
                  onChange={handleChange}
                  placeholder="Жишээ: Elite Gaming Center"
                  required={accountType === 'centerOwner'}
                />
              </div>
            )}

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
              <small style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                ⚠️ Үнэн зөв имэйл хаяг оруулна уу (нууц үг сэргээхэд ашиглагдана)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                📱 Утасны дугаар *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="99123456"
                required
              />
              <small style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                ⚠️ 8 оронтой дугаар оруулна уу (нууц үг сэргээхэд SMS код ирнэ)
              </small>
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
                    placeholder="8+ тэмдэгт, том үсэг, тоо, тусгай тэмдэгт"
                    minLength="8"
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
                <small style={{ color: '#6b7280', fontSize: '11px', display: 'block', marginTop: '4px', lineHeight: '1.4' }}>
                  💡 Хүчтэй нууц үг: 8+ тэмдэгт, том үсэг (A-Z), жижиг үсэг (a-z), тоо (0-9), тусгай тэмдэгт (!@#$)
                </small>
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
              <Link to={`/login?type=${accountType==='centerOwner'?'owner':'user'}`} className="auth-link">
                Нэвтрэх
              </Link>
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/auth?mode=login" className="back-link">
                ← Сонголт руу буцах
              </Link>
              <Link to="/map" className="back-link">
                🏠 Нүүр хуудас
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;