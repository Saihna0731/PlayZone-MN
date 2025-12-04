import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, ZoomControl, CircleMarker, Popup } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MapCenters from "../components/MapComponents/MapCenters";
import MapSearch from "../components/MapComponents/MapSearch";
import MapCategoryFilter from "../components/MapComponents/MapCategoryFilter";
import MapTools from "../components/MapComponents/MapTools";
import FilterPanel from "../components/MapComponents/FilterPanel";
import Toast from "../components/LittleComponents/Toast";
import { cacheUtils } from "../utils/cache";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE } from "../config";
import "leaflet/dist/leaflet.css";
import { FaFilter, FaLock, FaTimes, FaGift, FaChevronRight, FaChair, FaCrown } from "react-icons/fa";

export default function MapView() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [visibleCenters, setVisibleCenters] = useState([]); // For list view
  const [availableCategories, setAvailableCategories] = useState([]); // Dynamic categories from DB
  const [categoryCounts, setCategoryCounts] = useState({}); // Category counts
  const [mapStyle, setMapStyle] = useState("streets"); // streets, satellite, dark
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ onlyGreen: false, priceRange: 'all' });
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSnowEffect, setShowSnowEffect] = useState(false);
  const [showPromoPanel, setShowPromoPanel] = useState(false);
  const [showTrialNotification, setShowTrialNotification] = useState(false);
  const [showBonusPanel, setShowBonusPanel] = useState(false);
  const [bonuses, setBonuses] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Allow admin, trial users, and paid subscribers (normal, business_standard, business_pro) to use filters
  const isRestricted = !user || (
    user.role !== 'admin' && 
    !user.trial?.isActive &&
    (!user.subscription?.plan || user.subscription.plan === 'free')
  );

  // Fetch bonuses for the panel
  const fetchBonuses = useCallback(() => {
    axios.get(`${API_BASE}/api/centers`)
      .then(res => {
        const centers = res.data?.centers || res.data || [];
        const bonusList = [];
        centers.forEach(c => {
          const hasBonus = Array.isArray(c.bonus) && c.bonus.length > 0;
          if (!hasBonus) return;
          // Бүх bonus-тай төвүүдийг харуулна
          c.bonus.forEach(b => {
            bonusList.push({ center: c, bonus: b });
          });
        });
        
        // Сул суудалтай bonus-г эхэнд жагсаах
        bonusList.sort((a, b) => {
          const aHasSeats = a.bonus.standardFree || a.bonus.vipFree;
          const bHasSeats = b.bonus.standardFree || b.bonus.vipFree;
          if (aHasSeats && !bHasSeats) return -1;
          if (!aHasSeats && bHasSeats) return 1;
          // Дараа нь шинээр нэмэгдсэнээр
          return new Date(b.bonus.createdAt) - new Date(a.bonus.createdAt);
        });
        
        if (bonusList.length > 0) {
          setBonuses(bonusList.slice(0, 5));
          setTimeout(() => setShowBonusPanel(true), 500);
        }
      })
      .catch(err => console.error('Bonus fetch error:', err));
  }, []);

  // Check for first-time user and show promotional panel
  useEffect(() => {
    if (user) {
      const promoKey = `playzone_promo_seen_${user._id}`;
      const trialKey = `playzone_trial_notified_${user._id}`;
      const bonusKey = `playzone_bonus_shown_${user._id}_${new Date().toDateString()}`;
      const hasSeenPromo = localStorage.getItem(promoKey);
      const hasSeenTrialNotif = localStorage.getItem(trialKey);
      const hasSeenBonusToday = localStorage.getItem(bonusKey);
      
      // Show promotional panel once for logged-in users who haven't seen it
      if (!hasSeenPromo) {
        setTimeout(() => setShowPromoPanel(true), 2000);
      }
      
      // Show trial notification for new trial users
      if (!hasSeenTrialNotif && user.subscription?.plan === 'trial' && user.subscription?.isActive) {
        setTimeout(() => setShowTrialNotification(true), 500);
        localStorage.setItem(trialKey, 'true');
      }

      // Show bonus panel once per day - promo харсан үгүйгээс үл хамааран
      if (!hasSeenBonusToday) {
        // Promo харсан бол шууд bonus харуулна, үгүй бол promo хаагдахыг хүлээнэ
        if (hasSeenPromo) {
          fetchBonuses();
        }
        // Promo-г хараагүй бол handleClosePromo дотор bonus fetch хийгдэнэ
      }
    }
  }, [user, fetchBonuses]);

  const handleClosePromo = () => {
    if (user) {
      localStorage.setItem(`playzone_promo_seen_${user._id}`, 'true');
      // Promo хаагдсаны дараа bonus panel харуулах
      const bonusKey = `playzone_bonus_shown_${user._id}_${new Date().toDateString()}`;
      const hasSeenBonusToday = localStorage.getItem(bonusKey);
      if (!hasSeenBonusToday) {
        fetchBonuses();
      }
    }
    setShowPromoPanel(false);
  };

  const handleCloseTrialNotif = () => {
    setShowTrialNotification(false);
  };

  const handleCloseBonusPanel = () => {
    if (user) {
      localStorage.setItem(`playzone_bonus_shown_${user._id}_${new Date().toDateString()}`, 'true');
    }
    setShowBonusPanel(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowSnowEffect(true);
      setTimeout(() => setShowSnowEffect(false), 3000);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!mapInstance) return;

    const onLocationFound = (e) => {
      setUserLocation(e.latlng);
      mapInstance.flyTo(e.latlng, 16);
      showToast("Таны байршлыг оллоо", "success");
    };

    const onLocationError = (e) => {
      showToast("Байршил тогтооход алдаа гарлаа: " + e.message, "error");
    };

    mapInstance.on('locationfound', onLocationFound);
    mapInstance.on('locationerror', onLocationError);

    return () => {
      mapInstance.off('locationfound', onLocationFound);
      mapInstance.off('locationerror', onLocationError);
    };
  }, [mapInstance, showToast]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, []);

  const handleRefresh = async () => {
    cacheUtils.clear('map_centers');
    setRefreshKey(prev => prev + 1);
    window.dispatchEvent(new CustomEvent("centers:updated"));
    showToast("Газрын зураг шинэчлэгдлээ", "success");
  };

  const handleLocate = () => {
    if (mapInstance) {
      mapInstance.locate({ setView: true, maxZoom: 16 });
    }
  };

  const handleCenterClick = (center) => {
    if (mapInstance) {
      mapInstance.flyTo([center.location.coordinates[1], center.location.coordinates[0]], 16, {
        animate: true,
        duration: 1
      });
    }
  };

  // Notify user when no results match filters/search
  useEffect(() => {
    // Show toast only when filtering (not default 'all') or searching
    if (visibleCenters.length === 0 && ((selectedCategory && selectedCategory !== 'all') || query.trim())) {
      showToast("Үр дүн олдсонгүй", "info");
    }
  }, [visibleCenters, selectedCategory, query, showToast]);

  // Tile layers for different styles
  const getTileLayer = () => {
    switch (mapStyle) {
      case 'satellite':
        return (
          <TileLayer
            key="satellite"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        );
      case 'dark':
        return (
          <TileLayer
            key="dark"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        );
      case 'streets':
      default:
        return (
          <TileLayer
            key="streets"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        gap: "24px"
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px"
        }}>
          <div style={{ animation: "spin 2s linear infinite" }}>
            <div style={{ fontSize: "60px" }}>🎄</div>
          </div>
          <p style={{
            fontSize: "20px",
            fontWeight: "700",
            background: "linear-gradient(135deg, #ef4444, #22c55e)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "pulse 1.5s ease-in-out infinite",
            margin: 0
          }}>
            🎅 Loading Christmas Map... 🎁
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="map-view-container">
      {/* Trial Activation Notification - For new trial users */}
      {showTrialNotification && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 10002,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '24px',
            padding: '40px 32px',
            maxWidth: '380px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 25px 60px rgba(16,185,129,0.4)',
            animation: 'scaleIn 0.4s ease-out'
          }}>
            <div style={{ fontSize: '80px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: '700',
              margin: '0 0 12px 0'
            }}>
              Trial эрх идэвхжлээ!
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '16px',
              lineHeight: '1.6',
              margin: '0 0 8px 0'
            }}>
              Танд 7 хоногийн турш бүх функцуудыг <strong>ҮНЭГҮЙ</strong> ашиглах боломжтой
            </p>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '12px',
              padding: '16px',
              margin: '20px 0'
            }}>
              <p style={{ color: 'white', margin: '0 0 8px 0', fontSize: '14px' }}>✅ Газрын зураг filter</p>
              <p style={{ color: 'white', margin: '0 0 8px 0', fontSize: '14px' }}>✅ Бүх төвүүдийн мэдээлэл</p>
              <p style={{ color: 'white', margin: '0', fontSize: '14px' }}>✅ Захиалга өгөх</p>
            </div>
            <button
              onClick={handleCloseTrialNotif}
              style={{
                background: 'white',
                color: '#059669',
                border: 'none',
                padding: '14px 40px',
                borderRadius: '30px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
              Эхлүүлье! 🚀
            </button>
          </div>
        </div>
      )}

      {/* Bonus Welcome Panel - Shows once per day for logged-in users */}
      {showBonusPanel && bonuses.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          animation: 'fadeIn 0.3s ease-out',
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '24px 24px 0 0',
            padding: '24px 20px 32px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '70vh',
            overflowY: 'auto',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.4s ease-out'
          }}>
            {/* Header */}
            {(() => {
              const seatsCount = bonuses.filter(b => b.bonus.standardFree || b.bonus.vipFree).length;
              return (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: seatsCount > 0 
                        ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
                        : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {seatsCount > 0 ? (
                        <FaChair style={{ color: 'white', fontSize: '20px' }} />
                      ) : (
                        <FaGift style={{ color: 'white', fontSize: '20px' }} />
                      )}
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                        {seatsCount > 0 ? '🪑 Шуурхай сул суудал!' : '🔥 Өнөөдрийн урамшуулал'}
                      </h2>
                      <p style={{ margin: '2px 0 0', fontSize: '13px', color: seatsCount > 0 ? '#16a34a' : '#6b7280' }}>
                        {seatsCount > 0 
                          ? `${seatsCount} газарт сул суудал байна!` 
                          : `${bonuses.length} шинэ bonus байна!`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseBonusPanel}
                    style={{
                      background: 'rgba(0,0,0,0.05)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6b7280'
                    }}
                  >
                    <FaTimes />
                  </button>
                </div>
              );
            })()}

            {/* Bonus List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {bonuses.map(({ center, bonus }, idx) => {
                const primaryImage = center?.images?.[0]?.thumbnail || center?.images?.[0] || center?.logo || '/logo192.png';
                const hasSeats = bonus.standardFree || bonus.vipFree;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      handleCloseBonusPanel();
                      navigate(`/center/${center._id}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px',
                      background: hasSeats ? 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)' : '#fff',
                      borderRadius: '16px',
                      border: hasSeats ? '2px solid #22c55e' : '1px solid #f0f0f0',
                      boxShadow: hasSeats ? '0 4px 12px rgba(34,197,94,0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    {/* Сул суудал badge */}
                    {hasSeats && (
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '12px',
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        color: '#fff',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(34,197,94,0.3)'
                      }}>
                        <FaChair style={{ fontSize: '10px' }} /> Сул суудал!
                      </div>
                    )}
                    <img
                      src={primaryImage}
                      alt={center.name}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{
                        margin: '0 0 4px',
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#1f2937',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {bonus.title || 'Урамшуулал'}
                      </h4>
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        color: '#6b7280',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        📍 {center.name}
                      </p>
                      {/* Сул суудлын дэлгэрэнгүй */}
                      {hasSeats && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          {bonus.standardFree && (
                            <span style={{
                              background: '#10b981',
                              color: '#fff',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              <FaChair style={{ fontSize: '9px' }} /> {bonus.standardFree}
                            </span>
                          )}
                          {bonus.vipFree && (
                            <span style={{
                              background: '#8b5cf6',
                              color: '#fff',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              <FaCrown style={{ fontSize: '9px' }} /> VIP {bonus.vipFree}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {!hasSeats && (
                      <div style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        FREE
                      </div>
                    )}
                    <FaChevronRight style={{ color: '#9ca3af', fontSize: '14px' }} />
                  </div>
                );
              })}
            </div>

            {/* View All Button */}
            <button
              onClick={() => {
                handleCloseBonusPanel();
                navigate('/bonuses');
              }}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '14px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
              }}
            >
              Бүх урамшуулал харах →
            </button>
          </div>
        </div>
      )}

      {/* New Year Promotional Panel - Shows once for logged-in users */}
      {showPromoPanel && user && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          animation: 'fadeIn 0.3s ease-out',
          overflowY: 'auto',
          padding: '20px 0'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '24px',
            padding: '24px 20px',
            maxWidth: '380px',
            width: '92%',
            position: 'relative',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            border: '2px solid rgba(239,68,68,0.3)',
            animation: 'scaleIn 0.4s ease-out',
            margin: 'auto',
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto'
          }}>
            <button
              onClick={handleClosePromo}
              style={{
                position: 'sticky',
                top: '0',
                float: 'right',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                zIndex: 10,
                marginBottom: '8px'
              }}
            >
              <FaTimes />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '16px', clear: 'both' }}>
              <div style={{ fontSize: '36px', marginBottom: '6px' }}>🎄🎅🎁</div>
              <h2 style={{
                color: 'white',
                fontSize: '17px',
                fontWeight: '700',
                margin: '0 0 6px 0'
              }}>
                Сайн байна уу!
              </h2>
              <p style={{
                background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '14px',
                fontWeight: '700',
                margin: 0
              }}>
                🎉 Шинэ жилийн урамшуулал! 🎉
              </p>
            </div>

            <div style={{
              background: 'rgba(239,68,68,0.15)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '12px'
              }}>
                <span style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: '800'
                }}>
                  50% ХЯМДРАЛ
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* User Plan */}
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', margin: '0 0 2px 0' }}>Хэрэглэгч</p>
                    <p style={{ color: 'white', fontSize: '12px', fontWeight: '600', margin: 0 }}>User Plan</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textDecoration: 'line-through', margin: '0 0 1px 0' }}>4,990₮</p>
                    <p style={{ color: '#22c55e', fontSize: '15px', fontWeight: '700', margin: 0 }}>1,990₮</p>
                  </div>
                </div>

                {/* Business Standard */}
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', margin: '0 0 2px 0' }}>Эзэмшигч</p>
                    <p style={{ color: 'white', fontSize: '12px', fontWeight: '600', margin: 0 }}>Business Standard</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textDecoration: 'line-through', margin: '0 0 1px 0' }}>29,900₮</p>
                    <p style={{ color: '#22c55e', fontSize: '15px', fontWeight: '700', margin: 0 }}>19,900₮</p>
                  </div>
                </div>

                {/* Business Pro */}
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', margin: '0 0 2px 0' }}>Pro</p>
                    <p style={{ color: 'white', fontSize: '12px', fontWeight: '600', margin: 0 }}>Business Pro</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textDecoration: 'line-through', margin: '0 0 1px 0' }}>59,900₮</p>
                    <p style={{ color: '#22c55e', fontSize: '15px', fontWeight: '700', margin: 0 }}>39,900₮</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                handleClosePromo();
                navigate('/profile#subscription');
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(239,68,68,0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              Эрх идэвхжүүлэх 🎁
            </button>

            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '10px',
              textAlign: 'center',
              margin: '8px 0 0 0'
            }}>
              Урамшуулал хязгаартай хугацаанд хүчинтэй
            </p>
          </div>
        </div>
      )}

      {/* Trial Banner */}
      {user && user.subscription?.plan === 'trial' && user.subscription?.isActive && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '30px',
          boxShadow: '0 8px 20px rgba(72,187,120,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          fontWeight: '600',
          animation: 'slideDown 0.5s ease-out'
        }}>
          <span style={{ fontSize: '20px' }}>🎁</span>
          <span>Trial эрх идэвхтэй - {user.subscription?.daysRemaining || 7} хоног үлдсэн</span>
          <button
            onClick={() => navigate('/profile#subscription')}
            style={{
              background: 'rgba(255,255,255,0.3)',
              border: 'none',
              padding: '6px 16px',
              borderRadius: '20px',
              color: 'white',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.4)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
          >
            Эрх идэвхжүүлэх →
          </button>
        </div>
      )}
      
      {/* Snow Effect Overlay */}
      {showSnowEffect && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          pointerEvents: "none",
          overflow: "hidden"
        }}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "-10px",
                left: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 10 + 10}px`,
                animation: `snowfall ${Math.random() * 3 + 2}s linear infinite`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.6 + 0.4
              }}
            >
              ❄️
            </div>
          ))}
          <style>{`
            @keyframes snowfall {
              0% {
                transform: translateY(0) rotate(0deg);
              }
              100% {
                transform: translateY(100vh) rotate(360deg);
              }
            }
          `}</style>
        </div>
      )}
      
      {/* Top Bar with Search and Profile */}
      <div className="map-overlay-top">
        <div className="top-bar">
          <div className="search-row">
            <div className="search-wrapper">
              <MapSearch onSearch={(v) => setQuery(v)} />
            </div>
            <button className="filter-toggle-btn" onClick={() => {
              if (isRestricted) {
                showToast("Шүүлтүүр ашиглахын тулд эрхээ идэвхжүүлнэ үү", "warning");
                return;
              }
              setIsFilterOpen(true);
            }}>
              {isRestricted ? <FaLock /> : <FaFilter />}
            </button>
          </div>
        </div>
        
        <div className="filter-container">
          <MapCategoryFilter 
            selectedCategory={selectedCategory} 
            onSelectCategory={(cat) => {
              if (isRestricted) {
                showToast("Шүүлтүүр ашиглахын тулд эрхээ идэвхжүүлнэ үү", "warning");
                return;
              }
              setSelectedCategory(cat);
            }}
            categoryCounts={categoryCounts}
          />
        </div>
      </div>

      <FilterPanel 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
        centers={visibleCenters}
        onCenterClick={handleCenterClick}
      />

      <div className="map-wrapper">
        <MapContainer
          center={[47.9188, 106.9176]} // Ulaanbaatar default
          zoom={14}
          minZoom={5}
          maxZoom={18}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          whenCreated={setMapInstance}
          ref={setMapInstance}
        >
          {getTileLayer()}
          <ZoomControl position="bottomright" />
          
          {userLocation && (
            <CircleMarker 
              center={userLocation}
              radius={8}
              pathOptions={{ color: 'white', fillColor: '#2563eb', fillOpacity: 1, weight: 2 }}
            >
              <Popup>Таны байршил</Popup>
            </CircleMarker>
          )}

          <MapCenters 
            key={refreshKey}  
            selectedCategory={selectedCategory}
            searchQuery={query}
            filters={filters}
            onCentersUpdate={setVisibleCenters}
            onCategoriesUpdate={setAvailableCategories}
            onCategoryCountsUpdate={setCategoryCounts}
          />
        </MapContainer>

        <MapTools 
          onRefresh={handleRefresh}
          onStyleChange={setMapStyle}
          currentStyle={mapStyle}
          onLocate={handleLocate}
        />
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <style jsx>{`
        .map-view-container {
          height: 100vh;
          height: 100dvh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .map-overlay-top {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 800;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: max(12px, env(safe-area-inset-top, 12px));
          padding-left: env(safe-area-inset-left, 0);
          padding-right: env(safe-area-inset-right, 0);
          background: linear-gradient(to bottom, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.9) 60%, rgba(255,255,255,0) 100%);
          pointer-events: none;
        }

        .top-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          pointer-events: auto;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .search-row {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .search-wrapper {
          flex: 1;
          min-width: 0;
        }

        .filter-toggle-btn {
          width: 42px;
          height: 42px;
          min-width: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        
        .filter-toggle-btn:active {
          transform: scale(0.95);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .filter-container {
          pointer-events: auto;
        }

        .map-wrapper {
          flex: 1;
          position: relative;
          z-index: 1;
        }
        
        /* Adjust Zoom Control Position */
        :global(.leaflet-control-zoom) {
          margin-bottom: 80px !important;
          margin-right: 12px !important;
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        :global(.leaflet-control-zoom-in),
        :global(.leaflet-control-zoom-out) {
          border-radius: 8px !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          color: #374151 !important;
          margin-bottom: 4px !important;
        }
        
        /* Responsive - Mobile */
        @media (max-width: 480px) {
          .map-overlay-top {
            padding-top: max(8px, env(safe-area-inset-top, 8px));
            gap: 6px;
            padding-bottom: 8px;
          }
          .top-bar {
            padding: 0 8px;
            gap: 6px;
          }
          .filter-toggle-btn {
            width: 38px;
            height: 38px;
            min-width: 38px;
            border-radius: 10px;
            font-size: 14px;
          }

          :global(.leaflet-control-zoom) {
            margin-bottom: 70px !important;
            margin-right: 8px !important;
          }
          :global(.leaflet-control-zoom-in),
          :global(.leaflet-control-zoom-out) {
            width: 32px !important;
            height: 32px !important;
            line-height: 32px !important;
          }
        }
        
        /* Responsive - Tablet */
        @media (min-width: 481px) and (max-width: 768px) {
          .top-bar {
            padding: 0 16px;
            gap: 10px;
          }
          .filter-toggle-btn {
            width: 44px;
            height: 44px;
          }

        }
        
        /* Responsive - Desktop */
        @media (min-width: 769px) {
          .map-overlay-top {
            padding-top: 16px;
          }
          .top-bar {
            padding: 0 24px;
            gap: 16px;
          }
          .filter-toggle-btn {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            font-size: 18px;
          }

        }
      `}</style>
    </div>
  );
}
