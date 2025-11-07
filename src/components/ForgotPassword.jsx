import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config';
import '../styles/Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!email) {
      setError('Имэйл хаягаа оруулна уу');
      setLoading(false);
      return;
    }

    try {
      // 1) Check whether email exists
      const existsRes = await axios.post(`${API_BASE}/api/auth/email-exists`, { email });
      const exists = !!existsRes?.data?.exists;
      if (!exists) {
        setError('Энэ имэйл хаяг бүртгэлгүй байна');
        setLoading(false);
        return;
      }
      // 2) Request password reset
      await axios.post(`${API_BASE}/api/auth/forgot-password`, { email });
      setMessage('Имэйлээр зааврыг илгээлээ. Хэсэг хугацааны дараа шалгана уу.');
    } catch (err) {
      setError('Хүсэлтийг боловсруулах үед алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Нууц үг сэргээх</h1>
            <p>Бүртгэлтэй имэйл хаягаа оруулж, илгээх товчийг дарна уу.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="error-message"><span>⚠️ {error}</span></div>}
            {message && <div className="success-message"><span>✅ {message}</span></div>}

            <div className="form-group">
              <label htmlFor="email">📧 Имэйл</label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <button type="submit" className={`auth-btn ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? 'Илгээж байна...' : 'Имэйл илгээх'}
            </button>
          </form>

          <div className="auth-links" style={{ marginTop: 12 }}>
            <p>
              Санамж: <Link to="/login" className="auth-link">Нэвтрэх рүү буцах</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
