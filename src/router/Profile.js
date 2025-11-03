import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import SubscriptionPlans from "../admin/components/Tolbor/SubscriptionPlans";
import BottomNav from "../components/MainNavbars/BottomNav";
import '../styles/Profile.css';

export default function Profile() {
  const { user, isAuthenticated, logout, updateProfile, isAdmin } = useAuth();
  const { subscription } = useSubscription();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    avatar: user?.avatar || ''
  });
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await updateProfile(formData);
    
    if (result.success) {
      setMessage(result.message);
      setEditing(false);
    } else {
      setMessage(result.message);
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/map');
  };

  const startEditing = () => {
    setFormData({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      avatar: user?.avatar || ''
    });
    setEditing(true);
    setMessage('');
  };

  if (!isAuthenticated) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <h1>🎮 PC Center</h1>
            <h2>Профайл</h2>
          </div>
          
          <div className="not-logged-in">
            <div className="icon">👤</div>
            <h3>Нэвтрээгүй байна</h3>
            <p>Профайлаа харахын тулд нэвтэрнэ үү</p>
            
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-primary">
                🚀 Нэвтрэх
              </Link>
              <Link to="/register" className="btn btn-secondary">
                🎉 Бүртгүүлэх
              </Link>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>🎮 PC Center</h1>
          <h2>Миний профайл</h2>
          {isAdmin && (
            <div className="admin-badge">
              👑 Админ
            </div>
          )}
        </div>

        {message && (
          <div className={`message ${message.includes('амжилттай') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="profile-content">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" />
              ) : (
                <span className="avatar-text">
                  {user.fullName?.charAt(0) || user.username?.charAt(0) || '👤'}
                </span>
              )}
            </div>
          </div>

          {!editing ? (
            <div className="profile-info">
              {/* Subscription мэдээлэл */}
              <div className="subscription-section">
                <h3>💎 Миний план</h3>
                <div className="subscription-info">
                  <div className="plan-badge">
                    {subscription?.plan === 'free' && '🆓 Үнэгүй'}
                    {subscription?.plan === 'normal' && '⭐ Энгийн'}
                    {subscription?.plan === 'business_standard' && '🏢 Бизнес Стандарт'}
                    {subscription?.plan === 'business_pro' && '👑 Бизнес Про'}
                  </div>
                  
                  {subscription?.plan !== 'free' && subscription?.endDate && (
                    <div className="plan-expiry">
                      📅 Дуусах огноо: {new Date(subscription.endDate).toLocaleDateString('mn-MN')}
                    </div>
                  )}
                  
                  {/* User-д зориулсан upgrade */}
                  {user?.accountType === 'user' && subscription?.plan === 'free' && (
                    <button 
                      onClick={() => setShowUpgradeModal(true)} 
                      className="btn btn-upgrade"
                    >
                      🚀 Upgrade хийх
                    </button>
                  )}
                  
                  {/* Center Owner-т зориулсан upgrade */}
                  {user?.accountType === 'centerOwner' && (subscription?.plan === 'free' || subscription?.plan === 'business_standard') && (
                    <button 
                      onClick={() => setShowUpgradeModal(true)} 
                      className="btn btn-upgrade"
                    >
                      ⚡ Plan шинэчлэх
                    </button>
                  )}
                </div>
              </div>

              <div className="info-item">
                <label>👤 Бүтэн нэр</label>
                <span>{user.fullName || 'Тодорхойгүй'}</span>
              </div>
              
              <div className="info-item">
                <label>🏷️ Хэрэглэгчийн нэр</label>
                <span>{user.username}</span>
              </div>
              
              <div className="info-item">
                <label>📧 Имэйл хаяг</label>
                <span>{user.email}</span>
              </div>
              
              <div className="info-item">
                <label>� Утасны дугаар</label>
                <span>{user.phone || 'Оруулаагүй'}</span>
              </div>
              
              <div className="info-item">
                <label>⭐ Дуртай төвүүд</label>
                <span>{user.favoritesCenters?.length || 0} төв</span>
              </div>
              
              <div className="info-item">
                <label>📅 Бүртгүүлсэн огноо</label>
                <span>{new Date(user.createdAt).toLocaleDateString('mn-MN')}</span>
              </div>

              <div className="profile-actions">
                <button onClick={startEditing} className="btn btn-primary">
                  ✏️ Засах
                </button>
                <button onClick={handleLogout} className="btn btn-danger">
                  🚪 Гарах
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="fullName">👤 Бүтэн нэр</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Бүтэн нэрээ оруулна уу"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">📱 Утасны дугаар</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="99123456"
                />
              </div>

              <div className="form-group">
                <label htmlFor="avatar">🖼️ Зургийн холбоос</label>
                <input
                  type="url"
                  id="avatar"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className={`btn btn-primary ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? '⏳ Хадгалж байна...' : '💾 Хадгалах'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditing(false)}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  ❌ Цуцлах
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* Subscription Upgrade Modal */}
      {showUpgradeModal && (
        <SubscriptionPlans
          showModal={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          upgradeType={user?.accountType === 'centerOwner' ? 'center' : 'subscription'}
        />
      )}
      
      <BottomNav />
    </div>
  );
}