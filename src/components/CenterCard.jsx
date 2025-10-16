import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight, FaPhone, FaTrash, FaEdit, FaMapMarkerAlt, FaStar, FaArrowRight, FaHeart } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { API_BASE } from "../config";

export default function CenterCard({ item, expanded, onToggle, onEdit, onDelete, isAdmin }) {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  // Get images from the correct database field and fallbacks
  const adminImages = item.images && Array.isArray(item.images) ? item.images : [];
  const fallbackImages = [item.image, item.img, item.photo].filter(Boolean);
  const allImages = [...adminImages, ...fallbackImages].slice(0, 6);
  
  // Function to enhance image quality
  const enhanceImageUrl = (url) => {
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
  };

  const pictures = allImages.length ? allImages.map(enhanceImageUrl) : [
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop&q=85&auto=format",
    "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200&h=600&fit=crop&q=85&auto=format"
  ];
  
  const [index, setIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (imageIndex) => {
    setImageErrors(prev => ({ ...prev, [imageIndex]: true }));
  };

  const getCurrentImage = () => {
    const currentImg = pictures[index];
    return imageErrors[index] ? 
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop&q=85&auto=format" : 
      currentImg;
  };

  useEffect(() => {
    setIndex(0);
    setImageErrors({});
  }, [item?.id, item?._id]);

  const prev = (e) => {
    e.stopPropagation();
    setIndex((i) => (i - 1 + pictures.length) % pictures.length);
  };
  
  const next = (e) => {
    e.stopPropagation();
    setIndex((i) => (i + 1) % pictures.length);
  };

  const handleCardClick = () => {
    navigate(`/center/${item._id || item.id}`);
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
      alert("Нэвтэрч орно уу");
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
      } else {
        // Add to favorites
        await axios.post(`${API_BASE}/api/auth/favorites/${centerId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(true);
      }
      
      // AuthContext дээрх user мэдээллийг шинэчлэх
      await refreshUser();
    } catch (error) {
      console.error("Toggle favorite error:", error);
      alert("Дуртай жагсаалт шинэчлэхэд алдаа гарлаа");
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
      {/* Image carousel */}
      <div style={{ position: "relative", height: 200, background: "#f5f5f5" }}>
        <img
          src={getCurrentImage()}
          alt={item.name || "center"}
          onError={() => handleImageError(index)}
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
            backgroundColor: "#f5f5f5"
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
        {pictures.length > 1 && (
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
              {pictures.map((_, i) => (
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
                  }}
                />
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

          {/* Admin actions */}
          {isAdmin && (
            <div style={{ 
              display: "flex", 
              gap: 8, 
              marginLeft: 12,
              alignItems: "flex-start" 
            }}>
              <button
                onClick={(e) => handleActionClick(e, onEdit)}
                style={{
                  background: "#e3f2fd",
                  border: "1px solid #bbdefb",
                  color: "#1976d2",
                  padding: "8px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#1976d2";
                  e.target.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#e3f2fd";
                  e.target.style.color = "#1976d2";
                }}
              >
                <FaEdit size={12} />
              </button>
              <button
                onClick={(e) => handleActionClick(e, () => onDelete && onDelete(item._id ?? item.id))}
                style={{
                  background: "#ffebee",
                  border: "1px solid #ffcdd2",
                  color: "#d32f2f",
                  padding: "8px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#d32f2f";
                  e.target.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#ffebee";
                  e.target.style.color = "#d32f2f";
                }}
              >
                <FaTrash size={12} />
              </button>
            </div>
          )}
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