import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight, FaPhone, FaTrash, FaEdit, FaMapMarkerAlt, FaStar, FaArrowRight, FaHeart } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import { API_BASE } from "../../config";
import "../../styles/List.css";

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

export default function CenterCard({ item, expanded, onToggle, onEdit, onDelete, isAdmin, showToast }) {
  const navigate = useNavigate();
  const { user, refreshUser, isAdmin: userIsAdmin, isCenterOwner } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: 20, 
              fontWeight: "700", 
              color: "#1a1a1a",
              marginBottom: 6
            }}>
              {item.name || "Unnamed Center"}
            </h3>
            
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 6, 
              color: "#666", 
              fontSize: 14,
              marginBottom: 8
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
                marginTop: 4
              }}>
                {item.category}
              </span>
            )}
          </div>

          {/* Right rail: Plan badge + (optional) admin actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
            <PlanBadge owner={typeof item.owner === 'object' ? item.owner : undefined} />
            {(isAdmin || userIsAdmin || (isCenterOwner && String((typeof item.owner === 'object' ? (item.owner?._id || item.owner?.id) : item.owner)) === String(user?._id))) && (
              <>
                <button
                  className="card-action-btn card-action-btn-edit"
                  onClick={(e) => handleActionClick(e, onEdit)}
                  title="Засах"
                >
                  <FaEdit />
                  <span style={{ display: window.innerWidth > 640 ? 'inline' : 'none' }}>Засах</span>
                </button>
                <button
                  className="card-action-btn card-action-btn-delete"
                  onClick={(e) => handleActionClick(e, () => onDelete && onDelete(item._id ?? item.id))}
                  title="Устгах"
                >
                  <FaTrash />
                  <span style={{ display: window.innerWidth > 640 ? 'inline' : 'none' }}>Устгах</span>
                </button>
              </>
            )}
          </div>
        </div>

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