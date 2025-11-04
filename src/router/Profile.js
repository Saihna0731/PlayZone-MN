import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import SubscriptionPlans from "../admin/components/Tolbor/SubscriptionPlans";
import BottomNav from "../components/MainNavbars/BottomNav";
import '../styles/Profile.css';

export default function Profile() {
  const { user, isAuthenticated, logout, updateProfile, isAdmin, refreshUser } = useAuth();
  const { subscription } = useSubscription();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
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
    if (e.target.name === 'avatar') {
      setSelectedFileName('');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Файлын хэмжээ шалгах (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Зургийн хэмжээ 5MB-аас бага байх ёстой');
      return;
    }

    // Зургийн төрөл шалгах
    if (!file.type.startsWith('image/')) {
      setMessage('Зөвхөн зургийн файл upload хийнэ үү');
      return;
    }

    setUploadingAvatar(true);
    setMessage('');

    try {
      // Base64 руу хөрвүүлэх
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          avatar: reader.result
        }));
        setSelectedFileName(file.name);
        setUploadingAvatar(false);
        setMessage('Зураг амжилттай сонгогдлоо. Хадгалах товч дарна уу.');
      };
      reader.onerror = () => {
        setUploadingAvatar(false);
        setMessage('Зураг уншихад алдаа гарлаа');
        setSelectedFileName('');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Avatar upload error:', error);
      setUploadingAvatar(false);
      setMessage('Зураг upload хийхэд алдаа гарлаа');
      setSelectedFileName('');
    }
  };

  useEffect(() => {
    if (!editing && user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      });
    }
  }, [user, editing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await updateProfile(formData);
    
    if (result.success) {
      setMessage(result.message);
      setEditing(false);
      setSelectedFileName('');
      // Серверээс хамгийн сүүлийн profile-ийг дахин татаж баталгаажуулна
      try { await refreshUser(); } catch (err) {}
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
    setSelectedFileName('');
    setEditing(true);
    setMessage('');
  };

  const cancelEditing = () => {
    setEditing(false);
    setSelectedFileName('');
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      });
    }
  };

  const displayAvatar = (formData.avatar || user?.avatar || '');

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
              {displayAvatar ? (
                <img src={displayAvatar} alt="Avatar" />
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
                <label>📞 Утасны дугаар</label>
                <span>{user.phone || 'Оруулаагүй'}</span>
              </div>
              
              <div className="info-item">
                <label>⭐ Дуртай төвүүд</label>
                <span>{user.favorites?.length || 0} төв</span>
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
                <div className="avatar-link-row">
                  <input
                    type="url"
                    id="avatar"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  {formData.avatar !== (user?.avatar || '') && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, avatar: user?.avatar || '' }));
                        setSelectedFileName('');
                        setMessage('Зураг хуучин төлөвт шилжлээ.');
                      }}
                    >
                      ↩️ Сэргээх
                    </button>
                  )}
                </div>
              </div>

              {/* Avatar Upload хэсэг */}
              <div className="form-group">
                <label htmlFor="avatarFile">📤 Зураг upload хийх</label>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    id="avatarFile"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="file-upload-input"
                  />
                  <label
                    htmlFor="avatarFile"
                    className={`file-upload-btn${uploadingAvatar ? ' disabled' : ''}`}
                  >
                    🖼️ Файлаас сонгох
                  </label>
                  <span className="file-upload-name">
                    {selectedFileName || 'Файл сонгогдоогүй'}
                  </span>
                </div>
                <small className="file-upload-hint">
                  Max хэмжээ: 5MB • Зөвхөн зураг (JPG, PNG, GIF) • Файлаар сонговол автоматаар урьдчилан харагдана
                </small>
                {uploadingAvatar && (
                  <div style={{ marginTop: '8px', color: '#1976d2' }}>
                    ⏳ Зураг уншиж байна...
                  </div>
                )}
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
                  onClick={cancelEditing}
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