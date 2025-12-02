import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../config";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import SubscriptionPlans from "../admin/components/Tolbor/SubscriptionPlans";
import BottomNav from "../components/MainNavbars/BottomNav";
import SimpleCalendar from "../components/LittleComponents/SimpleCalendar.jsx";
import { FaHistory, FaChartLine, FaUser, FaCalendarAlt, FaMoneyBillWave, FaClock, FaList, FaChevronRight, FaBell } from "react-icons/fa";
import '../styles/Profile.css';

// PlayZone MN Logo Component
const PlayZoneLogo = ({ style }) => (
  <img src="/playzone-logo.svg" alt="PlayZone MN" style={{ height: '32px', ...style }} />
);

// Menu Item Component
function MenuItem({ icon, title, onClick, active, danger, badge, highlight }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        background: highlight ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" : active ? "#f3f4f6" : "#ffffff",
        marginBottom: "8px",
        borderRadius: "12px",
        cursor: "pointer",
        transition: "all 0.2s",
        border: active ? "2px solid #3b82f6" : highlight ? "none" : "1px solid #f0f0f0",
        boxShadow: highlight ? "0 4px 12px rgba(59, 130, 246, 0.3)" : "none"
      }}
      onMouseEnter={(e) => {
        if (!active && !highlight) e.currentTarget.style.background = "#f9fafb";
      }}
      onMouseLeave={(e) => {
        if (!active && !highlight) e.currentTarget.style.background = "#ffffff";
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "16px"
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          background: danger ? "#fee2e2" : highlight ? "rgba(255,255,255,0.2)" : active ? "#dbeafe" : "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px"
        }}>
          {icon}
        </div>
        <span style={{
          fontSize: "15px",
          fontWeight: highlight ? "700" : "600",
          color: danger ? "#ef4444" : highlight ? "#ffffff" : "#1f2937"
        }}>
          {title}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {badge !== undefined && badge > 0 && !danger && (
          <div style={{
            minWidth: "22px",
            padding: "2px 6px",
            borderRadius: "999px",
            background: "#ef4444",
            color: "white",
            fontSize: "11px",
            fontWeight: 700,
            textAlign: "center"
          }}>
            {badge}
          </div>
        )}
        <FaChevronRight style={{ 
          color: "#9ca3af", 
          fontSize: "14px",
          transform: active ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease"
        }} />
      </div>
    </div>
  );
}

// Info Row Component
function InfoRow({ label, value }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 0",
      borderBottom: "1px solid #f0f0f0"
    }}>
      <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "500" }}>
        {label}
      </span>
      <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: "600" }}>
        {value}
      </span>
    </div>
  );
}

export default function Profile() {
  const { user, isAuthenticated, logout, updateProfile, isAdmin, refreshUser } = useAuth();
  const { subscription } = useSubscription();
  const [activeTab, setActiveTab] = useState('profile'); // profile, dashboard, confirm
  const [expandedSection, setExpandedSection] = useState(null); // accordion: profile, manageBookings, confirmBookings, notifications, payments, linked - null by default
  const [viewMode, setViewMode] = useState('list'); // list, calendar
  const [selectedDateBookings, setSelectedDateBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]); // Real bookings data
  const [ownerBookings, setOwnerBookings] = useState([]); // Real owner bookings data
  const [ownedCenters, setOwnedCenters] = useState([]); // Centers owned by user
  const [hasCenters, setHasCenters] = useState(true); // Check if owner has centers
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

  // Derived counts - calculate from actual data
  // Bonus: For owners - total bonuses across all centers; For users - bookings count
  const bonusCount = user?.accountType === 'centerOwner' 
    ? ownedCenters.reduce((sum, center) => sum + (center.bonuses?.length || 0), 0)
    : bookings.length;
  
  // Centers: For owners - owned centers count; For users - favorites count
  const centersCount = user?.accountType === 'centerOwner'
    ? ownedCenters.length
    : (user?.favorites?.length || 0);
  
  // Захиалга: For owners - bookings to their centers; For users - their bookings
  const zahialgaCount = user?.accountType === 'centerOwner'
    ? ownerBookings.length
    : bookings.length;

  // Pending booking requests for center owner (status === 'pending')
  const pendingRequests = ownerBookings.filter(b => b.status === 'pending');
  const pendingRequestCount = pendingRequests.length;

  // Trial status calculation
  const trial = user?.trial;
  const isTrialActive = trial?.isActive && trial?.endDate && new Date() <= new Date(trial.endDate);
  const trialDaysLeft = isTrialActive 
    ? Math.ceil((new Date(trial.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;
  const trialPlanName = trial?.plan === 'normal' ? 'Энгийн' : trial?.plan === 'business_standard' ? 'Бизнес Стандарт' : '';

  // Fetch bookings and centers
  useEffect(() => {
    const fetchBookings = async () => {
      if (!isAuthenticated) return;
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Fetch user's bookings
        const res = await axios.get(`${API_BASE}/api/bookings/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookings(res.data);

        // If owner, fetch owned centers and their bookings
        if (user?.accountType === 'centerOwner') {
           try {
             const centersRes = await axios.get(`${API_BASE}/api/centers/my-centers`, {
               headers: { Authorization: `Bearer ${token}` }
             });
             
             console.log('Fetched centers:', centersRes.data);
             
             if (centersRes.data && centersRes.data.length > 0) {
               setOwnedCenters(centersRes.data);
               setHasCenters(true);
               
               // Fetch bookings for all owned centers
               const allOwnerBookings = [];
               const seenBookingIds = new Set(); // Track unique booking IDs
               
               for (const center of centersRes.data) {
                 try {
                   const centerId = center._id || center.id;
                   console.log(`Fetching bookings for center ${centerId}`);
                   const bookingsRes = await axios.get(`${API_BASE}/api/bookings/center/${centerId}`, {
                     headers: { Authorization: `Bearer ${token}` }
                   });
                   console.log(`Bookings for center ${centerId}:`, bookingsRes.data);
                   
                   if (bookingsRes.data && Array.isArray(bookingsRes.data)) {
                     // Filter out duplicates
                     for (const booking of bookingsRes.data) {
                       const bookingId = booking._id || booking.id;
                       if (!seenBookingIds.has(bookingId)) {
                         seenBookingIds.add(bookingId);
                         allOwnerBookings.push(booking);
                       }
                     }
                   }
                 } catch (err) {
                   console.error(`Error fetching bookings for center ${center._id}:`, err.response?.data || err.message);
                 }
               }
               console.log('Total unique owner bookings:', allOwnerBookings.length);
               setOwnerBookings(allOwnerBookings);
             } else {
               console.log('No centers found for owner');
               setOwnedCenters([]);
               setHasCenters(false);
               setOwnerBookings([]);
             }
           } catch (err) {
             console.error('Error fetching centers:', err.response?.data || err.message);
             setOwnedCenters([]);
             setHasCenters(false);
             setOwnerBookings([]);
           }
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
      }
    };

    fetchBookings();
  }, [isAuthenticated, user, activeTab]);

  // Auto-show upgrade modal for users without valid subscription
  useEffect(() => {
    if (user && !isTrialActive && !subscription?.isActive) {
      // User has no active subscription - show upgrade modal
      setShowUpgradeModal(true);
    }
  }, [user, isTrialActive, subscription]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/api/bookings/${bookingId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh bookings
      setOwnerBookings(prev => prev.map(b => 
        b._id === bookingId ? { ...b, status: newStatus } : b
      ));
    } catch (err) {
      console.error("Error updating status:", err);
      setMessage("Төлөв өөрчлөхөд алдаа гарлаа");
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
              <Link to="/auth?mode=register" className="btn btn-primary">
                🚀 Нэвтрэх
              </Link>
              <Link to="/auth?mode=register" className="btn btn-secondary">
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
    <div style={{ 
      minHeight: "100vh",
      background: "#f3f4f6",
      paddingBottom: "80px"
    }}>
      {/* Modern Header */}
      <div style={{
        background: "#ffffff",
        padding: "24px 20px 20px 20px",
        borderBottom: "1px solid #f0f0f0"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px"
        }}>
          <div style={{
            fontSize: "20px",
            fontWeight: "800",
            color: "#1f2937",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            👤 Profile
          </div>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "18px"
          }}>
            ⚙️
          </div>
        </div>

        {/* Profile Info Card */}
        <div style={{
          textAlign: "center",
          padding: "20px 0"
        }}>
          <div style={{
            position: "relative",
            display: "inline-block",
            marginBottom: "16px"
          }}>
            <div style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: displayAvatar ? `url(${displayAvatar})` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "40px",
              fontWeight: "700",
              border: "4px solid white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}>
              {!displayAvatar && (user.fullName?.charAt(0) || user.username?.charAt(0) || '👤')}
            </div>
            <div style={{
              position: "absolute",
              bottom: "0",
              right: "0",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#10b981",
              border: "3px solid white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "14px"
            }}>
              ✓
            </div>
          </div>
          
          <h2 style={{
            margin: "0 0 8px 0",
            fontSize: "24px",
            fontWeight: "700",
            color: "#1f2937"
          }}>
            {user.fullName || user.username}
          </h2>
          
          {user?.accountType === 'centerOwner' ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "32px",
              marginTop: "20px"
            }}>
              <div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#1f2937" }}>
                  {bonusCount}
                </div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>Bonus</div>
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#1f2937" }}>
                  {centersCount}
                </div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>Centers</div>
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#1f2937" }}>
                  {zahialgaCount}
                </div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>Захиалга</div>
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "20px"
            }}>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#3b82f6" }}>
                  {zahialgaCount}
                </div>
                <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: "600" }}>Миний захиалга</div>
              </div>
            </div>
          )}

          {/* Trial Banner */}
          {isTrialActive && (
            <div style={{
              margin: "20px 20px 0 20px",
              padding: "16px 20px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "16px",
              color: "white",
              boxShadow: "0 4px 12px rgba(102,126,234,0.3)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px" }}>
                    🎁 {trialPlanName} Trial
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.9 }}>
                    {trialDaysLeft} хоног үлдсэн
                  </div>
                </div>
                <div style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  minWidth: "50px",
                  textAlign: "center"
                }}>
                  {trialDaysLeft}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div style={{ padding: "20px" }}>
        {/* Profile - always first */}
        <MenuItem 
          icon="👤"
          title="Profile" 
          onClick={() => {
            setExpandedSection(prev => prev === 'profile' ? '' : 'profile');
            setActiveTab('profile');
          }}
          active={expandedSection === 'profile'}
        />
        {expandedSection === 'profile' && !editing && (
          <div style={{ marginTop: "-4px", marginBottom: "12px" }}>
            {/* Inline profile info panel */}
            <div style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
            }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "700" }}>
                💎 {user?.accountType === 'centerOwner' ? 'Эзэмшигчийн мэдээлэл' : 'Миний мэдээлэл'}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <InfoRow label="👤 Бүтэн нэр" value={user.fullName || 'Тодорхойгүй'} />
                <InfoRow label="🏷️ Хэрэглэгчийн нэр" value={user.username} />
                <InfoRow label="📧 Имэйл" value={user.email} />
                <InfoRow label="📞 Утас" value={user.phone || 'Оруулаагүй'} />
                {user?.accountType === 'centerOwner' ? (
                  <>
                    <InfoRow label="🏢 Эзэмшиж буй төв" value={`${centersCount} төв`} />
                    <InfoRow label="🎁 Нийт бонус" value={`${bonusCount} бонус`} />
                    <InfoRow label="📅 Нийт захиалга" value={`${zahialgaCount} захиалга`} />
                  </>
                ) : (
                  <>
                    <InfoRow label="⭐ Дуртай төв" value={`${centersCount} төв`} />
                    <InfoRow label="🎫 Миний захиалга" value={`${zahialgaCount} захиалга`} />
                  </>
                )}
                <InfoRow label="📅 Бүртгүүлсэн" value={new Date(user.createdAt).toLocaleDateString('mn-MN')} />
                <button
                  onClick={startEditing}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor: "pointer",
                    marginTop: "8px",
                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
                  }}
                >
                  ✏️ Мэдээлэл засах
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show upgrade option - Always visible for centerOwners, show for users without active paid subscription */}
        {(user?.accountType === 'centerOwner' || (!subscription?.isActive || isTrialActive)) && (
          <MenuItem 
            icon="💎"
            title={subscription?.isActive && !isTrialActive ? "Эрх сунгах" : "Эрх шинэчлэх"}
            onClick={() => {
              setExpandedSection(prev => prev === 'payments' ? '' : 'payments');
              setShowUpgradeModal(true);
            }}
            active={expandedSection === 'payments'}
            highlight={!subscription?.isActive || isTrialActive}
          />
        )}

        {/* Center Owner specific menus - TOP PRIORITY */}
        {user?.accountType === 'centerOwner' && (
          <>
            <MenuItem 
              icon="🎮"
              title="Game Center Удирдлага"
              onClick={() => navigate('/game-center-control')}
              active={false}
              highlight={true}
            />
            <MenuItem 
              icon="📅"
              title="Захиалга удирдах"
              onClick={() => navigate('/booking')}
              active={false}
              badge={pendingRequestCount > 0 ? pendingRequestCount : null}
            />
          </>
        )}

        {/* Regular user menu - My Orders */}
        {user?.accountType !== 'centerOwner' && (
          <>
            <MenuItem 
              icon="📅"
              title="Миний захиалгууд"
              onClick={() => {
                setExpandedSection(prev => prev === 'myBookings' ? '' : 'myBookings');
                setActiveTab('bookings');
              }}
              active={expandedSection === 'myBookings'}
              badge={bookings.length}
            />
            {expandedSection === 'myBookings' && activeTab === 'bookings' && (
              <div style={{ marginTop: "-4px", marginBottom: "12px" }}>
                <div className="bookings-list" style={{ paddingTop: '8px' }}>
                  {bookings.length > 0 ? bookings.map(booking => (
                    <div key={booking._id} className={`booking-card ${booking.status}`} style={{
                      background: "#ffffff",
                      borderRadius: "12px",
                      padding: "16px",
                      marginBottom: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                    }}>
                      <div className="booking-header" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
                            {booking.center?.name || 'Төв'}
                          </h4>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            {booking.date}
                          </span>
                        </div>
                        <span className={`status-badge ${booking.status}`} style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: booking.status === 'confirmed' ? '#dcfce7' : 
                                     booking.status === 'pending' ? '#fef3c7' : '#fee2e2',
                          color: booking.status === 'confirmed' ? '#166534' : 
                                 booking.status === 'pending' ? '#92400e' : '#991b1b'
                        }}>
                          {booking.status === 'completed' ? 'Дууссан' : 
                           booking.status === 'confirmed' ? 'Баталгаажсан' :
                           booking.status === 'pending' ? 'Хүлээгдэж буй' : 'Цуцлагдсан'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#4b5563' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaClock /> {booking.time}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaMoneyBillWave /> {booking.price}₮
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          🎮 {booking.type === 'vip' ? 'VIP' : 'Энгийн'} - {booking.duration} цаг
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="no-bookings" style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: '#9ca3af'
                    }}>
                      <p>Захиалга байхгүй байна.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Common menu items */}
        <MenuItem 
          icon={<FaBell />}
          title="Notification"
          onClick={() => setExpandedSection(prev => prev === 'notifications' ? '' : 'notifications')}
          active={expandedSection === 'notifications'}
        />
        {expandedSection === 'notifications' && (
          <div style={{ marginTop: "-4px", marginBottom: "12px" }}>
            <div style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "16px",
              fontSize: "14px",
              color: "#6b7280"
            }}>
              Мэдэгдэл одоогоор байхгүй байна.
            </div>
          </div>
        )}

        <MenuItem 
          icon="🔗"
          title="Linked Accounts"
          onClick={() => setExpandedSection(prev => prev === 'linked' ? '' : 'linked')}
          active={expandedSection === 'linked'}
        />
        {expandedSection === 'linked' && (
          <div style={{ marginTop: "-4px", marginBottom: "12px" }}>
            <div style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "16px",
              fontSize: "14px",
              color: "#6b7280"
            }}>
              Холбогдсон аккаунт одоогоор алга.
            </div>
          </div>
        )}

        <MenuItem 
          icon="🚪"
          title="Logout"
          onClick={handleLogout}
          danger
        />
      </div>

      {/* Profile Edit Modal */}
      {editing && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "500px",
            maxHeight: "90vh",
            overflow: "auto",
            padding: "24px"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px"
            }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
                ✏️ Профайл засах
              </h2>
              <button
                onClick={cancelEditing}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#6b7280"
                }}
              >
                ✕
              </button>
            </div>

            {message && (
              <div style={{
                padding: "12px 16px",
                borderRadius: "12px",
                marginBottom: "16px",
                background: message.includes('амжилттай') ? "#d1fae5" : "#fee2e2",
                color: message.includes('амжилттай') ? "#065f46" : "#991b1b",
                fontSize: "14px"
              }}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                textAlign: "center",
                marginBottom: "8px"
              }}>
                <div style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  background: displayAvatar ? `url(${displayAvatar})` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "40px",
                  fontWeight: "700",
                  border: "4px solid white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  marginBottom: "12px"
                }}>
                  {!displayAvatar && (user.fullName?.charAt(0) || user.username?.charAt(0) || '👤')}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                  👤 Бүтэн нэр
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Бүтэн нэрээ оруулна уу"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                  📱 Утасны дугаар
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="99123456"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                  🖼️ Зургийн холбоос
                </label>
                <input
                  type="url"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.jpg"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                  📤 Зураг upload
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                />
                {selectedFileName && (
                  <small style={{ color: "#6b7280", marginTop: "4px", display: "block" }}>
                    {selectedFileName}
                  </small>
                )}
                {uploadingAvatar && (
                  <div style={{ marginTop: "8px", color: "#3b82f6" }}>
                    ⏳ Зураг уншиж байна...
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: loading ? "#9ca3af" : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading ? "none" : "0 4px 12px rgba(59, 130, 246, 0.3)"
                  }}
                >
                  {loading ? '⏳ Хадгалж байна...' : '💾 Хадгалах'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={loading}
                  style={{
                    padding: "14px 24px",
                    background: "#f3f4f6",
                    color: "#6b7280",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  ❌
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dashboard Tab - legacy full-page calendar (kept minimal for non-owner/user if needed) */}
      {activeTab === 'dashboard' && expandedSection !== 'manageBookings' && (
          <div style={{ padding: "20px" }}>
            <div style={{
              display: "flex",
              gap: "12px",
              marginBottom: "20px"
            }}>
              <div style={{
                flex: 1,
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                padding: "20px",
                borderRadius: "16px",
                color: "white",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
              }}>
                <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
                  Нийт орлого
                </div>
                <div style={{ fontSize: "24px", fontWeight: "700" }}>
                  <FaMoneyBillWave style={{ marginRight: "8px" }} />
                  1.25M₮
                </div>
              </div>
              <div style={{
                flex: 1,
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                padding: "20px",
                borderRadius: "16px",
                color: "white",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
              }}>
                <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
                  Нийт захиалга
                </div>
                <div style={{ fontSize: "24px", fontWeight: "700" }}>
                  <FaCalendarAlt style={{ marginRight: "8px" }} />
                  {ownerBookings.length}
                </div>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '16px' 
            }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1f2937" }}>
                📅 Ирсэн захиалгууд
              </h3>
              <div style={{ 
                display: 'flex', 
                background: '#f3f4f6', 
                padding: '4px', 
                borderRadius: '10px' 
              }}>
                <button 
                  onClick={() => setViewMode('list')}
                  style={{ 
                    padding: '8px 14px', 
                    border: 'none', 
                    borderRadius: '8px', 
                    background: viewMode === 'list' ? 'white' : 'transparent',
                    color: viewMode === 'list' ? '#3b82f6' : '#6b7280',
                    boxShadow: viewMode === 'list' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontWeight: '600',
                    fontSize: '13px',
                    transition: 'all 0.2s'
                  }}
                >
                  <FaList /> Жагсаалт
                </button>
                <button 
                  onClick={() => setViewMode('calendar')}
                  style={{ 
                    padding: '8px 14px', 
                    border: 'none', 
                    borderRadius: '8px', 
                    background: viewMode === 'calendar' ? 'white' : 'transparent',
                    color: viewMode === 'calendar' ? '#3b82f6' : '#6b7280',
                    boxShadow: viewMode === 'calendar' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontWeight: '600',
                    fontSize: '13px',
                    transition: 'all 0.2s'
                  }}
                >
                  <FaCalendarAlt /> Календарь
                </button>
              </div>
            </div>

            {!hasCenters ? (
              <div className="no-centers-warning" style={{ padding: '20px', background: '#fff3cd', color: '#856404', borderRadius: '8px', marginBottom: '20px' }}>
                <p>⚠️ Та одоогоор ямар нэгэн төв эзэмшдэггүй байна. Хэрэв та төв нэмсэн бол админ эрхээр баталгаажуулахыг хүлээнэ үү эсвэл өгөгдлийн санд эзэмшигчээр бүртгэгдээгүй байж магадгүй.</p>
              </div>
            ) : viewMode === 'calendar' ? (
              <>
                <SimpleCalendar 
                  bookings={ownerBookings} 
                  onDateClick={(date, bookings) => {
                    setSelectedDate(date);
                    setSelectedDateBookings(bookings);
                  }} 
                />
                
                <div className="selected-date-bookings">
                  <h4 style={{ margin: '0 0 12px 0', color: '#4b5563' }}>
                    {selectedDate.toLocaleDateString('mn-MN')} - {selectedDateBookings.length > 0 ? `${selectedDateBookings.length} захиалга` : 'Захиалга байхгүй'}
                  </h4>
                  
                  <div className="bookings-list">
                    {(selectedDateBookings.length > 0 ? selectedDateBookings : []).map(booking => (
                      <div key={booking._id} className={`booking-card ${booking.status}`}>
                        <div className="booking-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ 
                              width: '40px', height: '40px', borderRadius: '50%', 
                              background: '#e3f2fd', color: '#1976d2',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 'bold'
                            }}>
                              {booking.user?.fullName?.charAt(0) || '?'}
                            </div>
                            <div>
                              <h4 style={{ margin: 0 }}>{booking.user?.fullName || 'Unknown'}</h4>
                              <span style={{ fontSize: '12px', color: '#666' }}>{booking.user?.phone}</span>
                            </div>
                          </div>
                          <span className={`status-badge ${booking.status}`}>
                            {booking.status === 'completed' ? 'Дууссан' : 
                             booking.status === 'confirmed' ? 'Баталгаажсан' :
                             booking.status === 'pending' ? 'Хүлээгдэж буй' : 'Цуцлагдсан'}
                          </span>
                        </div>
                        <div className="booking-details" style={{ marginTop: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                          <p><FaClock /> {booking.time}</p>
                          <p><FaMoneyBillWave /> {booking.price}₮</p>
                          <p>🎮 {booking.type === 'vip' ? 'VIP' : 'Энгийн'} - {booking.duration} цаг</p>
                        </div>
                        {booking.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button 
                              onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                              style={{ 
                                flex: 1, padding: '8px', border: 'none', borderRadius: '6px', 
                                background: '#4caf50', color: 'white', cursor: 'pointer' 
                              }}
                            >
                              Зөвшөөрөх
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                              style={{ 
                                flex: 1, padding: '8px', border: '1px solid #f44336', borderRadius: '6px', 
                                background: 'white', color: '#f44336', cursor: 'pointer' 
                              }}
                            >
                              Цуцлах
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bookings-list">
                {ownerBookings.length > 0 ? ownerBookings.map(booking => (
                  <div key={booking._id} className={`booking-card ${booking.status}`}>
                    <div className="booking-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '40px', height: '40px', borderRadius: '50%', 
                          background: '#e3f2fd', color: '#1976d2',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 'bold'
                        }}>
                          {booking.user?.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h4 style={{ margin: 0 }}>{booking.user?.fullName || 'Unknown'}</h4>
                          <span style={{ fontSize: '12px', color: '#666' }}>{booking.user?.phone}</span>
                        </div>
                      </div>
                      <span className={`status-badge ${booking.status}`}>
                        {booking.status === 'completed' ? 'Дууссан' : 
                         booking.status === 'confirmed' ? 'Баталгаажсан' :
                         booking.status === 'pending' ? 'Хүлээгдэж буй' : 'Цуцлагдсан'}
                      </span>
                    </div>
                    <div className="booking-details" style={{ marginTop: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <p><FaCalendarAlt /> {booking.date}</p>
                      <p><FaClock /> {booking.time}</p>
                      <p><FaMoneyBillWave /> {booking.price}₮</p>
                      <p>🎮 {booking.type === 'vip' ? 'VIP' : 'Энгийн'} - {booking.duration} цаг</p>
                    </div>
                    {/* Confirmation actions moved to Захиалга баталгаажуулах panel */}
                  </div>
                )) : (
                  <div className="no-bookings">
                    <p>Одоогоор захиалга байхгүй байна.</p>
                  </div>
                )}
              </div>
            )}
          </div>
      )}

      

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