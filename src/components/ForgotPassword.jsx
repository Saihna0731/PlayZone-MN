import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config';
import '../styles/Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email/Phone, 2: Code, 3: New Password
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [devCode, setDevCode] = useState(''); // DEV only
  const [resetMethod, setResetMethod] = useState(''); // 'email' or 'sms'

  // Step 1: Имэйл эсвэл утасны дугаар оруулах, код авах
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!emailOrPhone) {
      setError('Имэйл эсвэл утасны дугаараа оруулна уу');
      setLoading(false);
      return;
    }

    const isEmail = emailOrPhone.includes('@');
    const isPhone = /^[0-9]{8}$/.test(emailOrPhone);

    if (!isEmail && !isPhone) {
      setError('Зөв имэйл эсвэл 8 оронтой утасны дугаар оруулна уу');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/auth/forgot-password`, { emailOrPhone });
      setResetMethod(response.data.method);
      setMessage(response.data.message);
      setStep(2);
      
      // DEV only: Show code in console/UI
      if (response.data.devCode) {
        setDevCode(response.data.devCode);
        console.log('🔐 DEV CODE:', response.data.devCode);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Код баталгаажуулах
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!code) {
      setError('Кодоо оруулна уу');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/auth/verify-reset-code`, { emailOrPhone, code });
      setResetToken(response.data.resetToken);
      setMessage('Код баталгаажлаа! Шинэ нууц үгээ оруулна уу.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Буруу код эсвэл хугацаа дууссан байна.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Шинэ нууц үг тохируулах
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!newPassword || !confirmPassword) {
      setError('Бүх талбарыг бөглөнө үү');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Нууц үг 8-аас дээш тэмдэгт байх ёстой');
      setLoading(false);
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Нууц үг том үсэг, жижиг үсэг, тоо агуулах ёстой');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Нууц үг таарахгүй байна');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_BASE}/api/auth/reset-password`, { resetToken, newPassword });
      setMessage('Нууц үг амжилттай солигдлоо! Нэвтэрч орно уу.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-card" style={{
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          padding: '32px',
          maxWidth: '440px'
        }}>
          <div className="auth-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <img src="/playzone-logo.svg" alt="PlayZone MN" style={{ height: '40px' }} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>🔑 Нууц үг сэргээх</h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              {step === 1 && 'Бүртгэлтэй имэйл хаягаа оруулна уу'}
              {step === 2 && resetMethod === 'email' && 'Имэйл хаягт ирсэн 6 оронтой кодыг оруулна уу'}
              {step === 2 && resetMethod === 'sms' && 'Утасан дээр ирсэн 6 оронтой кодыг оруулна уу'}
              {step === 3 && 'Шинэ нууц үгээ оруулна уу'}
            </p>
          </div>

          {error && <div className="error-message" style={{ marginBottom: '16px' }}><span>⚠️ {error}</span></div>}
          {message && <div className="success-message" style={{ marginBottom: '16px', background: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '8px', fontSize: '14px' }}><span>✅ {message}</span></div>}

          {/* Step 1: Email or Phone */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="auth-form">
              <div className="form-group">
                <label htmlFor="emailOrPhone">📧 Бүртгэлтэй имэйл хаяг</label>
                <input
                  id="emailOrPhone"
                  name="emailOrPhone"
                  type="email"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
                <small style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  📧 Бүртгэлтэй имэйл хаягаа оруулна уу, код илгээгдэнэ
                </small>
              </div>

              <button type="submit" className={`auth-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                {loading ? '⏳ Илгээж байна...' : '🔐 Код авах'}
              </button>
            </form>
          )}

          {/* Step 2: Verify Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="auth-form">
              {devCode && (
                <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '2px solid #fbbf24' }}>
                  <strong style={{ color: '#92400e' }}>🔐 DEV CODE:</strong> <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '700', color: '#92400e' }}>{devCode}</span>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="code">🔢 {resetMethod === 'email' ? 'Email Код' : 'SMS Код'}</label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  maxLength="6"
                  required
                  style={{ fontSize: '20px', fontWeight: '600', textAlign: 'center', letterSpacing: '4px' }}
                />
                <small style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  {phone} дугаарт илгээсэн 6 оронтой кодыг оруулна уу
                </small>
              </div>

              <button type="submit" className={`auth-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                {loading ? '⏳ Шалгаж байна...' : '✅ Код баталгаажуулах'}
              </button>
              
              <button type="button" onClick={() => setStep(1)} style={{ marginTop: '12px', width: '100%', padding: '10px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#6b7280' }}>
                ← Буцах
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="form-group">
                <label htmlFor="newPassword">🔒 Шинэ нууц үг</label>
                <div className="password-input">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                  💡 8+ тэмдэгт, том үсэг (A-Z), жижиг үсэг (a-z), тоо (0-9), тусгай тэмдэгт (!@#$)
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">🔒 Нууц үг давтах</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Нууц үгээ давтна уу"
                  required
                />
              </div>

              <button type="submit" className={`auth-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                {loading ? '⏳ Хадгалж байна...' : '💾 Нууц үг солих'}
              </button>
            </form>
          )}

          <div className="auth-links" style={{ marginTop: '16px' }}>
            <p>
              <Link to="/login" className="auth-link">← Нэвтрэх рүү буцах</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
