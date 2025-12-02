import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

// Owner Onboarding Guide Modal
function OwnerGuideModal({ isOpen, onClose, onGoToControl }) {
  if (!isOpen) return null;
  
  const steps = [
    { icon: '🏢', title: '1. Төвөө нэмэх', desc: 'Game Center Control хэсэгт орж "Шинэ төв нэмэх" товч дарна' },
    { icon: '📝', title: '2. Мэдээлэл оруулах', desc: 'Нэр, хаяг, зураг, үнэ, нээх хаах цаг оруулах' },
    { icon: '📊', title: '3. Ачаалал шинэчлэх', desc: 'Өдөр бүр ачааллаа (%) шинэчлэх' },
    { icon: '🎁', title: '4. Бонус нэмэх', desc: 'Урамшуулал, хөнгөлөлт нэмж хэрэглэгчдийг татах' },
    { icon: '💎', title: '5. Эрх сунгах', desc: 'Trial дууссаны дараа төлбөр төлж эрхээ сунгах' }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '28px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1f2937' }}>
            Бүртгэл амжилттай!
          </h2>
          <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>
            Төвөө нэмж эхлэхэд бэлэн боллоо
          </p>
        </div>

        {/* Steps */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '16px' }}>
            📋 Эхлэх заавар:
          </h3>
          {steps.map((step, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '14px',
              padding: '14px',
              background: i === 0 ? 'linear-gradient(135deg, #dbeafe, #e0e7ff)' : '#f9fafb',
              borderRadius: '12px',
              marginBottom: '10px',
              border: i === 0 ? '2px solid #3b82f6' : '1px solid #e5e7eb'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: i === 0 ? '#3b82f6' : '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0
              }}>
                {step.icon}
              </div>
              <div>
                <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '14px', marginBottom: '2px' }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trial Info */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          border: '2px solid #f59e0b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>⏰</span>
            <span style={{ fontWeight: '700', color: '#92400e', fontSize: '14px' }}>
              14 хоногийн Trial эрх идэвхжлээ!
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#78350f' }}>
            Trial хугацаанд 1 төв нэмэх боломжтой. Дууссаны дараа эрхээ сунгаарай.
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#4b5563',
              cursor: 'pointer'
            }}
          >
            Дараа үзэх
          </button>
          <button
            onClick={onGoToControl}
            style={{
              flex: 2,
              padding: '14px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '700',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            🎮 Төв нэмэх →
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const wantsTrial = true; // Автоматаар trial эрх олгох
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOwnerGuide, setShowOwnerGuide] = useState(false); // Owner guide modal

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
  const payload = { ...registrationData, accountType, wantsTrial };
  const result = await register(payload);
    
    if (result.success) {
      // Owner бүртгүүлсэн бол guide modal харуулах
      if (accountType === 'centerOwner') {
        setShowOwnerGuide(true);
      } else {
        navigate('/map');
      }
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  // Guide modal handlers
  const handleCloseGuide = () => {
    setShowOwnerGuide(false);
    navigate('/map');
  };

  const handleGoToControl = () => {
    setShowOwnerGuide(false);
    navigate('/game-center-control');
  };

  return (
    <div className="auth-container">
      {/* Owner Guide Modal */}
      <OwnerGuideModal 
        isOpen={showOwnerGuide} 
        onClose={handleCloseGuide}
        onGoToControl={handleGoToControl}
      />
      
      <div className="auth-background">
        <div className="auth-card register-card" style={{
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          padding: '32px',
          maxWidth: '540px',
          maxHeight: '160vh',
          overflowY: 'auto'
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

            {/* Trial Subscription Сонголт */}
            {/* Trial мэдээлэл */}
            <div style={{ 
              background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', 
              padding: '14px 16px', 
              borderRadius: '10px', 
              marginBottom: '16px',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎁</div>
              <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>
                Үнэгүй 7 хоногийн Trial эрх
              </div>
              <small style={{ fontSize: '12px', opacity: 0.95, display: 'block' }}>
                Бүртгүүлсний дараа автоматаар идэвхжинэ!
              </small>
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