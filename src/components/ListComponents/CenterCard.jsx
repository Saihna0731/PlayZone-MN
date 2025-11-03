import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight, FaPhone, FaTrash, FaEdit, FaMapMarkerAlt, FaStar, FaArrowRight, FaHeart } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import { API_BASE } from "../../config";
import "../../styles/List.css";

// Текстийг товчлох helper
const snippet = (s, max = 120) => {
  if (!s || typeof s !== 'string') return '';
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

// Бонус жагсаалт харуулах компонент
function BonusList({ bonuses }) {
  if (!Array.isArray(bonuses) || bonuses.length === 0) return null;
  // Дуусаагүй (эсвэл хугацаа заагаагүй) бонусуудыг л харуулна; хамгийн сүүлийн 2-г авна
  const now = Date.now();
  const active = bonuses.filter(b => !b?.expiresAt || new Date(b.expiresAt).getTime() > now);
  const toShow = (active.length ? active : bonuses).slice(0, 2);

  return (
    <div style={{
      marginTop: 8,
      padding: 12,
      background: '#fff8e1',
      borderRadius: 10,
      border: '1px solid #ffe0b2'
    }}>
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: '#e65100',
        marginBottom: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>🎁 Бонус</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toShow.map((b, idx) => (
          <div key={b._id || idx} style={{ fontSize: 13, color: '#5d4037' }}>
            <div style={{ fontWeight: 600 }}>{b.title || 'Шинэ бонус'}</div>
            {(b.standardFree || b.vipFree || b.stageFree) && (
              <div style={{ marginTop: 2, color: '#6d4c41' }}>
                {b.standardFree ? `Энгийн: ${b.standardFree} суудал сул` : ''}
                {b.vipFree ? `${b.standardFree ? ' • ' : ''}VIP: ${b.vipFree} суудал сул` : ''}
                {b.stageFree ? `${(b.standardFree || b.vipFree) ? ' • ' : ''}Stage: ${b.stageFree} суудал сул` : ''}
              </div>
            )}
            {b.text && (
              <div style={{ marginTop: 2, color: '#6d4c41' }}>{snippet(b.text, 120)}</div>
            )}
            {b.expiresAt && (
              <div style={{ marginTop: 2, fontSize: 11, color: '#8d6e63' }}>
                Дуусах хугацаа: {new Date(b.expiresAt).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Ачаалалын өнгө авах функц
const getOccupancyColor = (percentage) => {
  if (percentage <= 50) return "#4caf50"; // Ногоон
  if (percentage <= 85) return "#ffc107"; // Шар
  return "#f44336"; // Улаан
};

// Ачаалал харуулах component - сайжруулсан
function OccupancyDisplay({ occupancy }) {
  if (!occupancy) return null;

  const getDisplayData = (value, type) => {
    const percentage = value || 0;
    const color = getOccupancyColor(percentage);
    let icon, label;
    
    switch(type) {
      case 'standard': icon = '💻'; label = 'Энгийн'; break;
      case 'vip': icon = '👑'; label = 'VIP'; break;
      case 'stage': icon = '🎮'; label = 'Stage'; break;
      default: icon = '📊'; label = 'Ачаалал';
    }
    
    return { percentage, color, icon, label };
  };

  // Дундаж ачаалал тооцох
  const avgOccupancy = Math.round(
    ((occupancy.standard || 0) + (occupancy.vip || 0) + (occupancy.stage || 0)) / 3
  );

  return (
    <div style={{
      background: "#ffffff",
      border: `2px solid ${getOccupancyColor(avgOccupancy)}`,
      borderRadius: "12px",
      padding: "12px",
      marginTop: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px"
      }}>
        <span style={{
          fontSize: "13px",
          fontWeight: "600",
          color: "#333",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          📊 Ачаалал
        </span>
        <span style={{
          fontSize: "16px",
          fontWeight: "700",
          color: getOccupancyColor(avgOccupancy),
          background: `${getOccupancyColor(avgOccupancy)}15`,
          padding: "4px 8px",
          borderRadius: "8px"
        }}>
          {avgOccupancy}%
        </span>
      </div>
      
      <div style={{ display: "flex", gap: "8px" }}>
        {['standard', 'vip', 'stage'].map(type => {
          const { percentage, color, icon, label } = getDisplayData(occupancy[type], type);
          
          return (
            <div key={type} style={{ 
              flex: 1,
              background: `${color}10`,
              borderRadius: "8px",
              padding: "8px 6px",
              textAlign: "center",
              border: `1px solid ${color}30`
            }}>
              <div style={{ fontSize: "16px", marginBottom: "2px" }}>{icon}</div>
              <div style={{ 
                fontSize: "10px", 
                color: "#666",
                marginBottom: "2px",
                fontWeight: "500"
              }}>
                {label}
              </div>
              <div style={{
                fontSize: "14px",
                fontWeight: "700",
                color: color
              }}>
                {percentage}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Карт дээр харагдах загварлаг ачааллын мэдээлэл
function OccupancyInline({ occupancy }) {
  if (!occupancy) return null;

  const items = [
    { key: 'standard', icon: '💻', label: 'Энгийн', value: occupancy.standard || 0 },
    { key: 'vip', icon: '👑', label: 'VIP', value: occupancy.vip || 0 },
    { key: 'stage', icon: '🎮', label: 'Stage', value: occupancy.stage || 0 }
  ];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        marginTop: 12,
        marginBottom: 8,
        padding: '12px',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        borderRadius: 14,
        border: '1px solid #e3e8ef',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        userSelect: 'none',
        overflow: 'hidden'
      }}
    >
      {/* Гарчиг */}
      <div style={{
        fontSize: 11,
        fontWeight: '700',
        color: '#8b95a5',
        letterSpacing: '0.8px',
        textTransform: 'uppercase',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
        <span style={{
          display: 'inline-block',
          width: 3,
          height: 12,
          background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2
        }}></span>
        Ачаалал
      </div>

      {/* Ачааллын карт мөр - mobile дээр илүү өргөн, жигд */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        width: '100%'
      }}>
        {items.map(({ key, icon, label, value }) => {
          const color = getOccupancyColor(value);
          
          return (
            <div
              key={key}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 8px',
                borderRadius: 12,
                background: `linear-gradient(135deg, ${color}10, ${color}18)`,
                border: `2px solid ${color}35`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 4px 12px ${color}15`,
                overflow: 'hidden',
                minHeight: 90,
                maxWidth: '100%'
              }}
            >
              {/* Декоратив фон элемент */}
              <div style={{
                position: 'absolute',
                top: -10,
                right: -10,
                width: 40,
                height: 40,
                background: `radial-gradient(circle, ${color}20, transparent)`,
                borderRadius: '50%',
                pointerEvents: 'none'
              }}></div>
              
              {/* Иконк */}
              <div style={{
                fontSize: 22,
                marginBottom: 8,
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
              }}>
                {icon}
              </div>
              
              {/* Нэр */}
              <div style={{
                fontSize: 10,
                fontWeight: '600',
                color: '#6c757d',
                marginBottom: 4,
                textAlign: 'center',
                lineHeight: 1
              }}>
                {label}
              </div>
              
              {/* Хувь */}
              <div style={{
                fontSize: 18,
                fontWeight: '800',
                color: color,
                textAlign: 'center',
                lineHeight: 1,
                textShadow: `0 1px 2px ${color}30`
              }}>
                {value}%
              </div>
              
              {/* Прогресс бар доод талд */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: 4,
                width: `${value}%`,
                background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                borderRadius: '0 2px 0 0',
                transition: 'width 0.5s ease'
              }}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Booking mode ачаалал шинэчлэх компонент - сайжруулсан
function BookingOccupancyControls({ item, onOccupancyUpdate, updating }) {
  const [showControls, setShowControls] = useState(false);
  const [localOccupancy, setLocalOccupancy] = useState({
    standard: item.occupancy?.standard || 0,
    vip: item.occupancy?.vip || 0,
    stage: item.occupancy?.stage || 0
  });

  const handleQuickUpdate = async () => {
    if (!onOccupancyUpdate) return;
    
    try {
      await onOccupancyUpdate(item._id, localOccupancy);
      setShowControls(false); // controls хаах
    } catch (error) {
      console.error("Failed to update occupancy:", error);
    }
  };

  // Товч харуулах
  if (!showControls) {
    return (
      <button
        onClick={() => setShowControls(true)}
        style={{
          width: "100%",
          padding: "12px",
          background: "linear-gradient(135deg, #4caf50, #66bb6a)",
          color: "white",
          border: "none",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginTop: "12px",
          boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
          transition: "all 0.2s ease"
        }}
        onMouseOver={(e) => {
          e.target.style.transform = "translateY(-2px)";
          e.target.style.boxShadow = "0 6px 20px rgba(76, 175, 80, 0.4)";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 4px 12px rgba(76, 175, 80, 0.3)";
        }}
      >
        ⚡ Ачаалал засах
      </button>
    );
  }

  // Controls харуулах
  return (
    <div style={{
      background: "linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%)",
      border: "2px solid #4caf50",
      borderRadius: "16px",
      padding: "20px",
      marginTop: "12px",
      boxShadow: "0 6px 20px rgba(76, 175, 80, 0.2)"
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "16px"
      }}>
        <span style={{ 
          fontWeight: "700", 
          color: "#2e7d32",
          fontSize: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          ⚡ Ачаалал тохируулах
        </span>
        <button
          onClick={() => setShowControls(false)}
          style={{
            background: "none",
            border: "none",
            fontSize: "18px",
            cursor: "pointer",
            color: "#666",
            padding: "4px",
            borderRadius: "50%"
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Энгийн */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "12px",
          border: "1px solid #e0e0e0"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px"
          }}>
            <label style={{ 
              fontSize: "14px", 
              color: "#333", 
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              💻 Энгийн
            </label>
            <span style={{
              fontSize: "16px",
              fontWeight: "700",
              color: getOccupancyColor(localOccupancy.standard),
              background: `${getOccupancyColor(localOccupancy.standard)}15`,
              padding: "4px 8px",
              borderRadius: "8px"
            }}>
              {localOccupancy.standard}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={localOccupancy.standard}
            onChange={(e) => setLocalOccupancy(prev => ({
              ...prev,
              standard: parseInt(e.target.value)
            }))}
            style={{
              width: "100%",
              height: "8px",
              borderRadius: "4px",
              background: `linear-gradient(to right, ${getOccupancyColor(localOccupancy.standard)} 0%, ${getOccupancyColor(localOccupancy.standard)} ${localOccupancy.standard}%, #ddd ${localOccupancy.standard}%, #ddd 100%)`,
              outline: "none",
              appearance: "none",
              cursor: "pointer"
            }}
          />
        </div>

        {/* VIP */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "12px",
          border: "1px solid #e0e0e0"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px"
          }}>
            <label style={{ 
              fontSize: "14px", 
              color: "#333", 
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              👑 VIP
            </label>
            <span style={{
              fontSize: "16px",
              fontWeight: "700",
              color: getOccupancyColor(localOccupancy.vip),
              background: `${getOccupancyColor(localOccupancy.vip)}15`,
              padding: "4px 8px",
              borderRadius: "8px"
            }}>
              {localOccupancy.vip}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={localOccupancy.vip}
            onChange={(e) => setLocalOccupancy(prev => ({
              ...prev,
              vip: parseInt(e.target.value)
            }))}
            style={{
              width: "100%",
              height: "8px",
              borderRadius: "4px",
              background: `linear-gradient(to right, ${getOccupancyColor(localOccupancy.vip)} 0%, ${getOccupancyColor(localOccupancy.vip)} ${localOccupancy.vip}%, #ddd ${localOccupancy.vip}%, #ddd 100%)`,
              outline: "none",
              appearance: "none",
              cursor: "pointer"
            }}
          />
        </div>

        {/* Stage */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "12px",
          border: "1px solid #e0e0e0"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px"
          }}>
            <label style={{ 
              fontSize: "14px", 
              color: "#333", 
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              🎮 Stage
            </label>
            <span style={{
              fontSize: "16px",
              fontWeight: "700",
              color: getOccupancyColor(localOccupancy.stage),
              background: `${getOccupancyColor(localOccupancy.stage)}15`,
              padding: "4px 8px",
              borderRadius: "8px"
            }}>
              {localOccupancy.stage}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={localOccupancy.stage}
            onChange={(e) => setLocalOccupancy(prev => ({
              ...prev,
              stage: parseInt(e.target.value)
            }))}
            style={{
              width: "100%",
              height: "8px",
              borderRadius: "4px",
              background: `linear-gradient(to right, ${getOccupancyColor(localOccupancy.stage)} 0%, ${getOccupancyColor(localOccupancy.stage)} ${localOccupancy.stage}%, #ddd ${localOccupancy.stage}%, #ddd 100%)`,
              outline: "none",
              appearance: "none",
              cursor: "pointer"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button
            onClick={handleQuickUpdate}
            disabled={updating}
            style={{
              flex: 1,
              padding: "14px",
              background: updating ? "#ccc" : "linear-gradient(45deg, #4caf50, #66bb6a)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: updating ? "not-allowed" : "pointer",
              boxShadow: updating ? "none" : "0 4px 12px rgba(76, 175, 80, 0.3)",
              transition: "all 0.2s ease"
            }}
          >
            {updating ? "🔄 Шинэчилж байна..." : "✅ Хадгалах"}
          </button>
          <button
            onClick={() => setShowControls(false)}
            style={{
              padding: "14px 16px",
              background: "#f5f5f5",
              color: "#666",
              border: "1px solid #ddd",
              borderRadius: "12px",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Болих
          </button>
        </div>
      </div>
    </div>
  );
}

// Small badge to show owner subscription plan (PRO / STANDARD)
function PlanBadge({ owner }) {
  const plan = owner?.subscription?.plan;
  if (plan === 'business_pro') {
    return (
      <span style={{
        background: 'linear-gradient(45deg, #ff6f61, #e91e63)',
        color: '#fff',
        padding: '4px 10px',
        borderRadius: 14,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.6,
        boxShadow: '0 2px 6px rgba(233,30,99,0.25)'
      }}>PRO</span>
    );
  }
  if (plan === 'business_standard') {
    return (
      <span style={{
        background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
        color: '#fff',
        padding: '4px 10px',
        borderRadius: 14,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.6,
        boxShadow: '0 2px 6px rgba(25,118,210,0.25)'
      }}>STANDARD</span>
    );
  }
  return null;
}

export default function CenterCard({ item, expanded, onToggle, onEdit, onDelete, canEdit, showToast, isBookingMode, onOccupancyUpdate }) {
  const navigate = useNavigate();
  const { user, refreshUser, isAdmin: userIsAdmin } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  // Bonus states
  const [showBonusForm, setShowBonusForm] = useState(false);
  const [editingBonusId, setEditingBonusId] = useState(null);
  const [savingBonus, setSavingBonus] = useState(false);
  const [bonusForm, setBonusForm] = useState({
    title: "",
    text: "",
    standardFree: "",
    vipFree: "",
    stageFree: "",
    expiresAt: ""
  });
  
  // Get images and videos from the correct database field and fallbacks
  const adminImages = item.images && Array.isArray(item.images) ? item.images : [];
  
  // Process images - use thumbnail for card view, high quality available for detail
  const processedImages = adminImages.map(img => {
    if (typeof img === 'object' && img.thumbnail) {
      // New format: use thumbnail for card view (faster loading)
      return { type: 'image', url: enhanceImageUrl(img.thumbnail), highQuality: img.highQuality };
    } else {
      // Old format or URL image
      return { type: 'image', url: enhanceImageUrl(img) };
    }
  });
  
  // Handle videos from both array and string formats - object болон string дэмжих
  let adminVideos = [];
  if (item.videos) {
    if (Array.isArray(item.videos)) {
      adminVideos = item.videos.filter(video => {
        if (typeof video === 'object' && video.data) {
          return true; // Video object format
        }
        return video && video.trim(); // String URL format
      });
    } else if (typeof item.videos === 'string' && item.videos.trim()) {
      adminVideos = item.videos.split('\n').filter(url => url && url.trim()).map(url => url.trim());
    }
  }

  // Handle embed videos
  let adminEmbedVideos = [];
  if (item.embedVideos) {
    if (Array.isArray(item.embedVideos)) {
      adminEmbedVideos = item.embedVideos.filter(embed => embed && embed.trim());
    }
  }
  
  const fallbackImages = [item.image, item.img, item.photo].filter(Boolean);
  const fallbackImageItems = fallbackImages.map(url => ({ type: 'image', url: enhanceImageUrl(url) }));
  const allImages = [...processedImages, ...fallbackImageItems].slice(0, 6);
  
  // Create media array for carousel (ONLY IMAGES)
  const imageItems = allImages;
  
  // Separate videos for display below description (not in carousel) - object format дэмжих
  const videoItems = adminVideos.map(video => {
    if (typeof video === 'object' && video.data) {
      return { type: 'video', url: video.data, name: video.name, size: video.size };
    }
    return { type: 'video', url: video };
  });
  const embedVideoItems = adminEmbedVideos.map(embed => ({ type: 'embed', content: embed }));
  
  // Function to enhance image quality
  function enhanceImageUrl(url) {
    if (!url) return url;
    
    // If it's an Unsplash URL, enhance it with better quality parameters
    if (url.includes('unsplash.com')) {
      return url.replace(/w=\d+/, 'w=1200').replace(/h=\d+/, 'h=600').replace(/fit=crop/, 'fit=crop&q=85&auto=format');
    }
    
    // If it's a base64 image, return as is (already processed)
    if (url.startsWith('data:')) {
      return url;
    }
    
    // For other URLs, try to add quality parameters if possible
    return url;
  }

  // Fallback if no images
  const defaultMedia = [
    { type: 'image', url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop&q=85&auto=format" },
    { type: 'image', url: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200&h=600&fit=crop&q=85&auto=format" }
  ];
  
  // Use only images for carousel
  const media = imageItems.length ? imageItems : defaultMedia;
  
  const [index, setIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (imageIndex) => {
    setImageErrors(prev => ({ ...prev, [imageIndex]: true }));
  };

  const getCurrentMedia = () => {
    const currentItem = media[index];
    if (!currentItem) return { type: 'image', url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop&q=85&auto=format" };
    
    if (imageErrors[index]) {
      return { type: 'image', url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop&q=85&auto=format" };
    }
    
    return currentItem;
  };

  useEffect(() => {
    setIndex(0);
    setImageErrors({});
  }, [item?.id, item?._id]);

  const prev = (e) => {
    e.stopPropagation();
    setIndex((i) => (i - 1 + media.length) % media.length);
  };
  
  const next = (e) => {
    e.stopPropagation();
    setIndex((i) => (i + 1) % media.length);
  };

  const handleCardClick = () => {
    const centerId = item._id || item.id;
    console.log("🔗 Navigating to center:", centerId, "Item:", item);
    navigate(`/center/${centerId}`);
  };

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    action();
  };

  // Bonus helpers
  const resetBonusForm = () => {
    setBonusForm({ title: "", text: "", standardFree: "", vipFree: "", stageFree: "", expiresAt: "" });
    setEditingBonusId(null);
    setShowBonusForm(false);
  };

  const startAddBonus = (e) => {
    e.stopPropagation();
    setEditingBonusId(null);
    setBonusForm({ title: "", text: "", standardFree: "", vipFree: "", stageFree: "", expiresAt: "" });
    setShowBonusForm(true);
  };

  const startEditBonus = (e, b) => {
    e.stopPropagation();
    setEditingBonusId(b._id);
    setBonusForm({
      title: b.title || "",
      text: b.text || "",
      standardFree: b.standardFree ?? "",
      vipFree: b.vipFree ?? "",
      stageFree: b.stageFree ?? "",
      expiresAt: b.expiresAt ? new Date(b.expiresAt).toISOString().slice(0,16) : ""
    });
    setShowBonusForm(true);
  };

  const saveBonus = async (e) => {
    e.stopPropagation();
    if (savingBonus) return;
    try {
      setSavingBonus(true);
      const token = localStorage.getItem("token");
      const centerId = item._id || item.id;
      const payload = {
        title: bonusForm.title,
        text: bonusForm.text,
        standardFree: bonusForm.standardFree === "" ? undefined : Number(bonusForm.standardFree),
        vipFree: bonusForm.vipFree === "" ? undefined : Number(bonusForm.vipFree),
        stageFree: bonusForm.stageFree === "" ? undefined : Number(bonusForm.stageFree),
        expiresAt: bonusForm.expiresAt || undefined
      };
      let res;
      if (editingBonusId) {
        res = await axios.put(`${API_BASE}/api/centers/${centerId}/bonus/${editingBonusId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
      } else {
        res = await axios.post(`${API_BASE}/api/centers/${centerId}/bonus`,
          payload,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
      }
      // Дата шинэчлэгдсэнийг бүх газарт мэдэгдэнэ
      window.dispatchEvent(new CustomEvent("centers:updated", { detail: res.data }));
      showToast && showToast(editingBonusId ? "Бонус шинэчлэгдлээ" : "Бонус нэмэгдлээ", "success");
      resetBonusForm();
    } catch (err) {
      console.error("Save bonus error:", err);
      showToast && showToast("Бонус хадгалахад алдаа гарлаа", "error");
    } finally {
      setSavingBonus(false);
    }
  };

  const deleteBonus = async (e, bonusId) => {
    e.stopPropagation();
    if (!window.confirm("Энэ бонусыг устгах уу?")) return;
    try {
      const token = localStorage.getItem("token");
      const centerId = item._id || item.id;
      const res = await axios.delete(`${API_BASE}/api/centers/${centerId}/bonus/${bonusId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.dispatchEvent(new CustomEvent("centers:updated", { detail: res.data }));
      showToast && showToast("Бонус устгагдлаа", "info");
      resetBonusForm();
    } catch (err) {
      console.error("Delete bonus error:", err);
      showToast && showToast("Бонус устгахад алдаа гарлаа", "error");
    }
  };

  // Generate consistent rating for each center (not changing with image index)
  const generateRating = (itemId) => {
    // Use only item ID to create a consistent rating for each center
    const seed = itemId ? itemId.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 123;
    const baseRating = 3.5 + (seed % 15) / 10; // Between 3.5 and 5.0
    return Math.min(5.0, baseRating).toFixed(1);
  };
  
  const rating = item.rating || generateRating(item._id || item.id || 'default');
  
  // Display pricing information
  const getPriceDisplay = () => {
    if (item.pricing && (item.pricing.standard || item.pricing.vip || item.pricing.stage)) {
      const prices = [];
      if (item.pricing.standard) prices.push(`${parseInt(item.pricing.standard).toLocaleString()}₮`);
      if (item.pricing.vip) prices.push(`VIP: ${parseInt(item.pricing.vip).toLocaleString()}₮`);
      if (item.pricing.stage) prices.push(`Stage: ${parseInt(item.pricing.stage).toLocaleString()}₮`);
      return prices.length > 0 ? prices.join(' • ') : item.price || "3000₮/цаг";
    }
    return item.price || "3000₮/цаг";
  };
  
  const price = getPriceDisplay();

  // Check if center is in user's favorites
  useEffect(() => {
    if (user && user.favoritesCenters) {
      const centerId = item._id || item.id;
      const isInFavorites = user.favoritesCenters.some(fav => 
        (fav._id || fav).toString() === centerId.toString()
      );
      setIsFavorite(isInFavorites);
    } else {
      setIsFavorite(false);
    }
  }, [user, item._id, item.id]);

  // Toggle favorite status
  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) {
      showToast && showToast("Нэвтэрч орно уу", "warning");
      return;
    }

    setFavoriteLoading(true);
    try {
      const token = localStorage.getItem("token");
      const centerId = item._id || item.id;
      
      if (isFavorite) {
        // Remove from favorites
        await axios.delete(`${API_BASE}/api/auth/favorites/${centerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(false);
        showToast && showToast("Дуртай жагсаалтаас хасагдлаа", "info");
      } else {
        // Add to favorites
        await axios.post(`${API_BASE}/api/auth/favorites/${centerId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(true);
        showToast && showToast("Дуртай жагсаалтад нэмэгдлээ", "success");
      }
      
      // AuthContext дээрх user мэдээллийг шинэчлэх
      await refreshUser();
    } catch (error) {
      console.error("Toggle favorite error:", error);
      showToast && showToast("Дуртай жагсаалт шинэчлэхэд алдаа гарлаа", "error");
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      style={{
        cursor: "pointer",
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
        marginBottom: 20,
        transition: "all 0.3s ease",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        transform: "translateY(0)",
        position: "relative"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
      }}
    >
      {/* Image carousel (Images only) */}
      <div style={{ position: "relative", height: 200, background: "#f5f5f5" }}>
        <img
          src={getCurrentMedia().url}
          alt={item.name || "center"}
          onError={() => handleImageError(index)}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
          decoding="async"
          fetchpriority="low"
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
            backgroundColor: "#f5f5f5",
            opacity: imageLoaded ? 1 : 0.8,
            transition: "opacity 0.15s ease-out",
            willChange: "opacity",
            transform: "translateZ(0)", // GPU acceleration
            backfaceVisibility: "hidden"
          }}
        />

        {/* Price badge */}
        <div style={{
          position: "absolute",
          top: 16,
          left: 16,
          background: "linear-gradient(45deg, rgba(25, 118, 210, 0.95), rgba(33, 150, 243, 0.95))",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 16,
          fontSize: 12,
          fontWeight: "600",
          backdropFilter: "blur(10px)",
          boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)",
          maxWidth: "200px",
          textAlign: "center",
          lineHeight: "1.2"
        }}>
          {item.pricing && (item.pricing.standard || item.pricing.vip || item.pricing.stage) ? (
            <div>
              {item.pricing.standard && <div>🎮 {parseInt(item.pricing.standard).toLocaleString()}₮</div>}
              {item.pricing.vip && <div style={{fontSize: "10px", opacity: 0.9}}>👑 VIP: {parseInt(item.pricing.vip).toLocaleString()}₮</div>}
              {item.pricing.stage && <div style={{fontSize: "10px", opacity: 0.9}}>🎭 Stage: {parseInt(item.pricing.stage).toLocaleString()}₮</div>}
            </div>
          ) : (
            <div>{price}</div>
          )}
        </div>

        {/* Favorite button */}
        {user && (
          <button
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            style={{
              position: "absolute",
              bottom: 16,
              right: 16,
              background: isFavorite ? "rgba(244, 67, 54, 0.9)" : "rgba(255, 255, 255, 0.9)",
              border: "none",
              color: isFavorite ? "#fff" : "#f44336",
              padding: "10px",
              borderRadius: "50%",
              cursor: favoriteLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              backdropFilter: "blur(10px)",
              opacity: favoriteLoading ? 0.7 : 1,
              transform: favoriteLoading ? "scale(0.9)" : "scale(1)"
            }}
            onMouseEnter={(e) => {
              if (!favoriteLoading) {
                e.target.style.transform = "scale(1.1)";
                e.target.style.background = isFavorite ? "rgba(244, 67, 54, 1)" : "rgba(255, 255, 255, 1)";
              }
            }}
            onMouseLeave={(e) => {
              if (!favoriteLoading) {
                e.target.style.transform = "scale(1)";
                e.target.style.background = isFavorite ? "rgba(244, 67, 54, 0.9)" : "rgba(255, 255, 255, 0.9)";
              }
            }}
          >
            <FaHeart size={16} />
          </button>
        )}

        {/* Rating badge */}
        <div style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "rgba(76, 175, 80, 0.9)",
          color: "#fff",
          padding: "6px 10px",
          borderRadius: 20,
          fontSize: 14,
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: 4,
          backdropFilter: "blur(10px)"
        }}>
          <FaStar size={12} />
          {rating}
        </div>

        {/* Navigation arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={prev}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.6)",
                border: "none",
                color: "#fff",
                padding: 10,
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease"
              }}
            >
              <FaChevronLeft size={14} />
            </button>
            
            <button
              onClick={next}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.6)",
                border: "none",
                color: "#fff",
                padding: 10,
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease"
              }}
            >
              <FaChevronRight size={14} />
            </button>

            {/* Dots indicator */}
            <div style={{ 
              position: "absolute", 
              bottom: 12, 
              left: "50%", 
              transform: "translateX(-50%)", 
              display: "flex", 
              gap: 6 
            }}>
              {media.map((mediaItem, i) => (
                <div
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                  style={{
                    width: i === index ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === index ? "#fff" : "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative"
                  }}
                >
                  {/* Show video icon for video items */}
                  {mediaItem.type === 'video' && i === index && (
                    <div style={{
                      position: "absolute",
                      top: "-20px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      color: "#fff",
                      fontSize: "10px",
                      background: "rgba(0,0,0,0.8)",
                      padding: "2px 4px",
                      borderRadius: "3px",
                      whiteSpace: "nowrap"
                    }}>
                      🎬 Video
                    </div>
                  )}
                  
                  {/* Show embed icon for embed video items */}
                  {mediaItem.type === 'embed' && i === index && (
                    <div style={{
                      position: "absolute",
                      top: "-20px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      color: "#fff",
                      fontSize: "10px",
                      background: "rgba(0,0,0,0.8)",
                      padding: "2px 4px",
                      borderRadius: "3px",
                      whiteSpace: "nowrap"
                    }}>
                      📺 Embed
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 20 }}>
        {/* Header Row: Name + Actions */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "flex-start", 
          marginBottom: 12,
          gap: 12,
          flexWrap: "wrap"
        }}>
          {/* Left: Name */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ 
              marginTop: 0,
              marginRight: 0,
              marginBottom: 0,
              marginLeft: 0,
              fontSize: 20, 
              fontWeight: "700", 
              color: "#1a1a1a"
            }}>
              {item.name || "Unnamed Center"}
            </h3>
          </div>

          {/* Right: Plan Badge + Admin Buttons */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            flexShrink: 0,
            flexWrap: 'wrap'
          }}>
            <PlanBadge owner={typeof item.owner === 'object' ? item.owner : undefined} />
            
            {((canEdit) || userIsAdmin) && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                <button
                  className="card-action-btn card-action-btn-edit"
                  onClick={(e) => handleActionClick(e, onEdit)}
                  title="Засах"
                  style={{
                    background: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 4px rgba(76, 175, 80, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(76, 175, 80, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(76, 175, 80, 0.3)';
                  }}
                >
                  <FaEdit size={12} />
                  <span>Засах</span>
                </button>
                <button
                  className="card-action-btn card-action-btn-delete"
                  onClick={(e) => handleActionClick(e, () => onDelete && onDelete(item._id ?? item.id))}
                  title="Устгах"
                  style={{
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 4px rgba(244, 67, 54, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(244, 67, 54, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(244, 67, 54, 0.3)';
                  }}
                >
                  <FaTrash size={12} />
                  <span>Устгах</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 6, 
          color: "#666", 
          fontSize: 14,
          marginBottom: 12
        }}>
          <FaMapMarkerAlt size={12} />
          <span>{item.address || "No address provided"}</span>
        </div>

        {/* Category tag */}
        {item.category && (
          <span style={{
            display: "inline-block",
            background: "#e3f2fd",
            color: "#1976d2",
            padding: "4px 12px",
            borderRadius: 16,
            fontSize: 12,
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: 12
          }}>
            {item.category}
          </span>
        )}

        {/* Occupancy Display */}
        {item.occupancy && (
          <OccupancyInline occupancy={item.occupancy} />
        )}

        {/* Description preview */}
        <div style={{ 
          color: "#666", 
          fontSize: 14, 
          lineHeight: "1.4",
          marginBottom: 16,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }}>
          {item.description || item.note || "Тайлбар байхгүй байна."}
        </div>

        {/* Bonuses (if any) */}
        {Array.isArray(item.bonus) && item.bonus.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <BonusList bonuses={item.bonus} />
          </div>
        )}

        {/* Videos section (below description) */}
        {(videoItems.length > 0 || embedVideoItems.length > 0) && (
          <div style={{ 
            marginBottom: 16,
            padding: "12px",
            background: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef"
          }}>
            <div style={{ 
              fontSize: "13px", 
              fontWeight: "600", 
              color: "#495057",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              🎬 Видео ({videoItems.length + embedVideoItems.length})
            </div>
            
            <div style={{ 
              fontSize: "12px", 
              color: "#6c757d",
              fontStyle: "italic"
            }}>
              Дэлгэрэнгүй хуудсанд үзэх боломжтой
            </div>
          </div>
        )}
        
        {/* Occupancy Display - зөвхөн expanded (дэлгэрэнгүй) үед харуулах */}
        {item.occupancy && !isBookingMode && expanded && (
          <div style={{ 
            marginBottom: 16,
            padding: "12px",
            background: "#f8feff",
            borderRadius: "8px",
            border: "1px solid #b3e5fc"
          }}>
            <div style={{ 
              fontSize: "13px", 
              fontWeight: "600", 
              color: "#0277bd",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              📊 Одоогийн ачаалал
            </div>
            
            <OccupancyDisplay occupancy={item.occupancy} />
          </div>
        )}

        {/* Phone number */}
        {item.phone && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 8, 
            marginBottom: 16
          }}>
            <FaPhone style={{ color: "#4caf50", fontSize: 14 }} />
            <a
              href={`tel:${item.phone}`}
              onClick={(e) => e.stopPropagation()}
              style={{ 
                color: "#1976d2", 
                textDecoration: "none", 
                fontSize: 14,
                fontWeight: "500"
              }}
            >
              {item.phone}
            </a>
          </div>
        )}

        {/* Booking Mode - Ачаалал шинэчлэх товч */}
  {isBookingMode && ((canEdit) || userIsAdmin) && (
          <div style={{ 
            display: "flex", 
            justifyContent: "center",
            marginTop: "16px",
            paddingTop: "12px",
            borderTop: "1px solid #e0e0e0"
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOccupancyUpdate && onOccupancyUpdate(item);
              }}
              style={{
                background: "linear-gradient(45deg, #4caf50, #66bb6a)",
                color: "white",
                border: "none",
                borderRadius: "20px",
                padding: "10px 20px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 3px 10px rgba(76, 175, 80, 0.4)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 5px 15px rgba(76, 175, 80, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 3px 10px rgba(76, 175, 80, 0.4)";
              }}
            >
              📊 Ачаалал шинэчлэх
            </button>
          </div>
        )}

        {/* Booking Mode - Бонус менежмент (owner/admin) */}
  {isBookingMode && ((canEdit) || userIsAdmin) && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px dashed #e0e0e0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e65100', display: 'flex', alignItems: 'center', gap: 6 }}>🎁 Бонус менежмент</div>
              <button
                onClick={startAddBonus}
                style={{
                  background: '#ffb300', color: '#fff', border: 'none', borderRadius: 16,
                  padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                }}
              >+ Бонус нэмэх</button>
            </div>

            {/* Одоо байгаа бонусууд */}
            {Array.isArray(item.bonus) && item.bonus.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                {item.bonus.slice(0, 3).map((b) => (
                  <div key={b._id} style={{
                    padding: 10, background: '#fff8e1', borderRadius: 10, border: '1px solid #ffe0b2'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#5d4037' }}>{b.title || 'Бонус'}</div>
                        {(b.standardFree || b.vipFree || b.stageFree) && (
                          <div style={{ fontSize: 12, color: '#6d4c41' }}>
                            {b.standardFree ? `Энгийн: ${b.standardFree} суудал сул` : ''}
                            {b.vipFree ? `${b.standardFree ? ' • ' : ''}VIP: ${b.vipFree} суудал сул` : ''}
                            {b.stageFree ? `${(b.standardFree || b.vipFree) ? ' • ' : ''}Stage: ${b.stageFree} суудал сул` : ''}
                          </div>
                        )}
                        {b.text && <div style={{ fontSize: 12, color: '#6d4c41' }}>{snippet(b.text, 140)}</div>}
                        {b.expiresAt && <div style={{ fontSize: 11, color: '#8d6e63' }}>Дуусах: {new Date(b.expiresAt).toLocaleString()}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={(e) => startEditBonus(e, b)}
                          style={{ background: '#42a5f5', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}
                        >Засах</button>
                        <button
                          onClick={(e) => deleteBonus(e, b._id)}
                          style={{ background: '#ef5350', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}
                        >Устгах</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Нэмэх/засах form */}
            {showBonusForm && (
              <div style={{ padding: 12, background: '#fff', borderRadius: 10, border: '1px solid #e0e0e0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                  <input
                    value={bonusForm.title}
                    onChange={(e) => setBonusForm({ ...bonusForm, title: e.target.value })}
                    placeholder="Гарчиг (жишээ нь: Өнөөдөр 50% OFF)"
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}
                  />
                  <textarea
                    value={bonusForm.text}
                    onChange={(e) => setBonusForm({ ...bonusForm, text: e.target.value })}
                    placeholder="Тайлбар (жишээ нь: 09:00-17:00 хооронд 50% хямдрал)"
                    rows={3}
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, resize: 'vertical' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    <input type="number" min="0" value={bonusForm.standardFree}
                      onChange={(e) => setBonusForm({ ...bonusForm, standardFree: e.target.value })}
                      placeholder="Энгийн сул"
                      style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
                    <input type="number" min="0" value={bonusForm.vipFree}
                      onChange={(e) => setBonusForm({ ...bonusForm, vipFree: e.target.value })}
                      placeholder="VIP сул"
                      style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
                    <input type="number" min="0" value={bonusForm.stageFree}
                      onChange={(e) => setBonusForm({ ...bonusForm, stageFree: e.target.value })}
                      placeholder="Stage сул"
                      style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#666' }}>Дуусах хугацаа (сонголттой)</label>
                    <input type="datetime-local" value={bonusForm.expiresAt}
                      onChange={(e) => setBonusForm({ ...bonusForm, expiresAt: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={saveBonus} disabled={savingBonus}
                    style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 700, cursor: savingBonus ? 'not-allowed' : 'pointer' }}>
                    {editingBonusId ? 'Өөрчлөлт хадгалах' : 'Бонус нэмэх'}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); resetBonusForm(); }}
                    style={{ background: '#f5f5f5', color: '#555', border: '1px solid #ddd', borderRadius: 8, padding: '10px 14px', fontSize: 13, cursor: 'pointer' }}>
                    Цуцлах
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Occupancy Display removed from card list to avoid accidental navigation */}

        {/* View details button */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 16,
          borderTop: "1px solid #f0f0f0"
        }}>
          <span style={{ 
            color: "#1976d2", 
            fontSize: 14, 
            fontWeight: "600" 
          }}>
            Дэлгэрэнгүй үзэх
          </span>
          <FaArrowRight style={{ color: "#1976d2", fontSize: 14 }} />
        </div>
      </div>
    </div>
  );
}