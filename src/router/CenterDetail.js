
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaPhone, FaMapMarkerAlt, FaClock, FaGlobe, FaEnvelope, FaStar, FaChevronLeft, FaChevronRight, FaExpand, FaTimes, FaPlay } from "react-icons/fa";
import axios from "axios";
import { API_BASE } from "../config";
import "../styles/CenterDetail.css";

// Текстийг товчлох helper
const snippet = (s, max = 140) => {
  if (!s || typeof s !== 'string') return '';
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

export default function CenterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [centerData, setCenterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoModal, setVideoModal] = useState({ isOpen: false, content: null, title: "" });

  useEffect(() => {
    const fetchCenter = async () => {
      setLoading(true);
      try {
        console.log(`Fetching center details for ID: ${id}`);
        console.log(`Full API URL: ${API_BASE}/api/centers/${id}`);
        const res = await axios.get(`${API_BASE}/api/centers/${id}`);
        console.log("API Response:", res);
        console.log("Response status:", res.status);
        console.log("Response data:", res.data);
        
        const center = res.data;
        
        if (!center) {
          console.log("No center data received");
          throw new Error("No center data received");
        }
        
        console.log("Processing center data:", center);
        
        if (center) {
          const processedData = {
            ...center,
            // Ensure all required fields have values
            name: center.name || "PC Center",
            category: center.category || "Gaming Center",
            address: center.address || "Улаанбаатар",
            phone: center.phone || "+976 9999 9999",
            email: center.email || "info@example.com",
            website: center.website || "www.example.com",
            opening: center.opening || "10:00 - 23:00",
            price: center.price || (center.pricing?.standard ? `${center.pricing.standard}₮/цаг` : "3000₮/цаг"),
            rating: center.rating || 4.5,
            // Handle new image format (thumbnail + high quality)
            images: center.images && center.images.length > 0 ? center.images : [
              "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400&h=900&fit=crop&q=90&auto=format"
            ],
            // Handle videos
            videos: center.videos || [],
            embedVideos: center.embedVideos || [],
            // Handle facilities
            facilities: center.facilities && center.facilities.length > 0 ? center.facilities : [
              "Gaming PC", "Wi-Fi", "Ундаа"
            ],
            // Handle pricing
            pricing: center.pricing || {
              standard: "3000",
              vip: "",
              stage: "",
              overnight: ""
            },
            // Location
            lat: center.lat || 47.918,
            lng: center.lng || 106.917
          };
          
          console.log("Final processed data:", processedData);
          setCenterData(processedData);
        } else {
          throw new Error("Center not found");
        }
      } catch (err) {
        console.error("Error fetching center:", err);
        // Fallback data on error or 404
        setCenterData({
          id: id,
          name: "PC Center",
          category: "Gaming Center", 
          address: "Улаанбаатар",
          phone: "+976 9999 9999",
          email: "info@example.com",
          website: "www.example.com",
          opening: "10:00 - 23:00",
          price: "3000₮/цаг",
          rating: 4.5,
          description: "PC тоглоомын газар",
          longDescription: "Орчин үеийн тоног төхөөрөмжөөр тоноглогдсон тоглоомын газар.",
          images: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400&h=900&fit=crop&q=90&auto=format"],
          facilities: ["Gaming PC", "Wi-Fi"],
          lat: 47.918,
          lng: 106.917
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCenter();
    }
  }, [id]);

  const nextImage = () => {
    if (!centerData || !centerData.images) return;
    setCurrentImageIndex((prev) => 
      prev === centerData.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!centerData || !centerData.images) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? centerData.images.length - 1 : prev - 1
    );
  };

  // "Show on map" action removed from header; if needed later, reintroduce as a button using navigate("/map")

  if (loading) {
    return (
      <div className="center-loading-state">
        <div className="center-loading-content">
          <div className="center-loading-spinner"></div>
          <p className="center-loading-text">Мэдээлэл ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  if (!centerData) {
    return (
      <div className="center-error-state">
        <div className="center-error-content">
          <p className="center-error-text">Мэдээлэл олдсонгүй</p>
          <button onClick={() => navigate("/list")} className="center-error-btn">
            Буцах
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="center-detail-container">
      {/* Image carousel - Airbnb style */}
      <div className="center-hero-carousel">
        <img
          src={(() => {
            const currentImage = centerData.images[currentImageIndex];
            // Шинэ format: object with high quality
            if (typeof currentImage === 'object' && currentImage.highQuality) {
              return currentImage.highQuality;
            }
            // Хуучин format эсвэл URL зураг
            return currentImage;
          })()}
          alt={centerData.name}
          className="center-carousel-image"
          onError={(e) => {
            // Зураг load болохгүй бол default зураг харуулах
            e.target.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400&h=900&fit=crop&q=90&auto=format";
          }}
        />
        {/* Доод градиент overlay – зураг дээрх текстийг тодруулна */}
        <div className="center-carousel-gradient" />
        
        {/* Top overlay controls */}
        <div className="center-carousel-top-controls">
          <button onClick={() => navigate(-1)} className="center-carousel-close">
            <FaTimes />
          </button>
        </div>
        
        {/* VIP badge */}
        {((centerData.isVip) || (centerData.owner && centerData.owner.subscription && (String(centerData.owner.subscription.plan || '').toLowerCase() === 'business_pro' || String(centerData.owner.subscription.plan || '').toLowerCase() === 'business pro'))) && (
          <div className="center-vip-badge">VIP</div>
        )}

        {/* Photo counter badge */}
        <div className="center-photo-counter">
          {currentImageIndex + 1} / {centerData.images.length}
        </div>
        
        {/* Image navigation */}
        <button onClick={prevImage} className="center-carousel-nav center-carousel-nav-left">
          <FaChevronLeft />
        </button>
        
        <button onClick={nextImage} className="center-carousel-nav center-carousel-nav-right">
          <FaChevronRight />
        </button>

        {/* Image indicators */}
        <div className="center-carousel-indicators">
          {centerData.images.map((_, index) => (
            <div
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`center-carousel-dot ${index === currentImageIndex ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Title and rating - Airbnb style: below carousel */}
      <div className="center-title-section">
        <h1 className="center-title">{centerData.name}</h1>
        <div className="center-title-meta">
          <div className="center-rating-inline">
            <FaStar /> {centerData.rating} <span className="reviews-text">(116 reviews)</span>
          </div>
          <span className="meta-separator">·</span>
          <div className="center-category-inline">{centerData.category}</div>
        </div>
      </div>

      {/* Content */}
      <div className="center-detail-content">
        {/* Bonus section - if any */}
        {centerData.bonus && centerData.bonus.length > 0 && (
          <div className="center-bonus-section">
            <h3 className="center-bonus-title">🎁 Идэвхтэй бонус</h3>
            <div className="center-bonus-list">
              {(() => {
                const now = Date.now();
                const active = centerData.bonus.filter(b => !b?.expiresAt || new Date(b.expiresAt).getTime() > now);
                const toShow = (active.length ? active : centerData.bonus).slice(0, 3);
                return toShow.map((b, idx) => (
                  <div key={b._id || idx} className="center-bonus-card">
                    <div className="center-bonus-card-title">{b.title || 'Бонус'}</div>
                    {(b.standardFree || b.vipFree || b.stageFree) && (
                      <div className="center-bonus-card-seats">
                        {b.standardFree ? `Энгийн: ${b.standardFree} суудал сул` : ''}
                        {b.vipFree ? `${b.standardFree ? ' • ' : ''}VIP: ${b.vipFree} суудал сул` : ''}
                        {b.stageFree ? `${(b.standardFree || b.vipFree) ? ' • ' : ''}Stage: ${b.stageFree} суудал сул` : ''}
                      </div>
                    )}
                    {b.text && (
                      <div className="center-bonus-card-text">{snippet(b.text, 180)}</div>
                    )}
                    {b.expiresAt && (
                      <div className="center-bonus-card-expiry">Дуусах хугацаа: {new Date(b.expiresAt).toLocaleString()}</div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Price */}
        <div className="center-section">
          <h3 className="center-section-title">💰 Үнийн мэдээлэл</h3>
          
          {centerData.pricing && (centerData.pricing.standard || centerData.pricing.vip || centerData.pricing.stage || centerData.pricing.overnight) ? (
            <div className="center-pricing-grid">
              {centerData.pricing.standard && (
                <div className="center-pricing-card standard">
                  <div className="center-pricing-card-label">
                    <span className="center-pricing-card-icon">🎮</span>
                    <span>Заал</span>
                  </div>
                  <div className="center-pricing-card-price">
                    {parseInt(centerData.pricing.standard).toLocaleString()}₮/цаг
                  </div>
                </div>
              )}
              
              {centerData.pricing.vip && (
                <div className="center-pricing-card vip">
                  <div className="center-pricing-card-label">
                    <span className="center-pricing-card-icon">👑</span>
                    <span>VIP өрөө</span>
                  </div>
                  <div className="center-pricing-card-price">
                    {parseInt(centerData.pricing.vip).toLocaleString()}₮/цаг
                  </div>
                </div>
              )}
              
              {centerData.pricing.stage && (
                <div className="center-pricing-card stage">
                  <div className="center-pricing-card-label">
                    <span className="center-pricing-card-icon">🎭</span>
                    <span>Stage өрөө</span>
                  </div>
                  <div className="center-pricing-card-price">
                    {parseInt(centerData.pricing.stage).toLocaleString()}₮/цаг
                  </div>
                </div>
              )}
              
              {centerData.pricing.overnight && (
                <div className="center-pricing-card overnight">
                  <div className="center-pricing-card-label">
                    <span className="center-pricing-card-icon">🌙</span>
                    <span>Хоног</span>
                  </div>
                  <div className="center-pricing-card-price">
                    {parseInt(centerData.pricing.overnight).toLocaleString()}₮/хоног
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="center-pricing-fallback">
              <div className="center-pricing-fallback-price">{centerData.price}</div>
              <div className="center-pricing-fallback-label">Цагийн төлбөр</div>
            </div>
          )}
        </div>

        {/* Contact info */}
        <div className="center-info-cards">
          <div className="center-info-card">
            <FaMapMarkerAlt className="center-info-icon location" />
            <div className="center-info-content">
              <div className="center-info-label">Хаяг</div>
              <div className="center-info-value">{centerData.address}</div>
            </div>
          </div>
          
          <div className="center-info-card">
            <FaPhone className="center-info-icon phone" />
            <div className="center-info-content">
              <div className="center-info-label">Утас</div>
              <a href={`tel:${centerData.phone}`} className="center-info-value link">
                {centerData.phone}
              </a>
            </div>
          </div>
          
          <div className="center-info-card">
            <FaClock className="center-info-icon clock" />
            <div className="center-info-content">
              <div className="center-info-label">Цагийн хуваарь</div>
              <div className="center-info-value">{centerData.opening}</div>
            </div>
          </div>
          
          {centerData.email && (
            <div className="center-info-card">
              <FaEnvelope className="center-info-icon email" />
              <div className="center-info-content">
                <div className="center-info-label">Имэйл</div>
                <a href={`mailto:${centerData.email}`} className="center-info-value link">
                  {centerData.email}
                </a>
              </div>
            </div>
          )}
          
          {centerData.website && (
            <div className="center-info-card">
              <FaGlobe className="center-info-icon website" />
              <div className="center-info-content">
                <div className="center-info-label">Вэб хуудас</div>
                <a 
                  href={centerData.website.startsWith('http://') || centerData.website.startsWith('https://') ? 
                    centerData.website : 
                    `https://${centerData.website}`
                  } 
                  target="_blank" 
                  rel="noreferrer" 
                  className="center-info-value link"
                >
                  {centerData.website}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Embed Videos */}
        {centerData.embedVideos && centerData.embedVideos.length > 0 && (
          <div style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
          }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}>
              🎬 Видео
            </h3>
            <div style={{ display: "grid", gap: "20px" }}>
              {centerData.embedVideos.map((embed, index) => {
                // Clean up the embed string
                const cleanEmbed = embed.trim();
                
                // Check if it's a direct iframe/video embed
                if (cleanEmbed.includes('<iframe') || cleanEmbed.includes('<video')) {
                  return (
                    <div 
                      key={index}
                      style={{ 
                        borderRadius: "12px", 
                        overflow: "hidden",
                        background: "#f8f9fa",
                        border: "1px solid #e9ecef"
                      }}
                    >
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: cleanEmbed.replace(/width="[^"]*"/g, 'width="100%"').replace(/height="[^"]*"/g, 'height="315"')
                        }}
                      />
                    </div>
                  );
                }
                
                // YouTube URL processing with enhanced player
                if (cleanEmbed.includes('youtube.com/watch') || cleanEmbed.includes('youtu.be/')) {
                  const videoId = cleanEmbed.includes('youtu.be/') 
                    ? cleanEmbed.split('youtu.be/')[1].split('?')[0].split('&')[0]
                    : cleanEmbed.split('v=')[1]?.split('&')[0];
                  
                  if (videoId) {
                    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                    return (
                      <div key={index} style={{ position: "relative" }}>
                        {/* YouTube Thumbnail with Play Button */}
                        <div 
                          onClick={() => setVideoModal({
                            isOpen: true,
                            content: (
                              <iframe
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1&fs=1&cc_load_policy=0&iv_load_policy=3&showinfo=1&quality=hd1080`}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                allowFullScreen
                                allow="autoplay; encrypted-media; fullscreen"
                                title={`YouTube Video ${index + 1}`}
                                style={{ borderRadius: "12px" }}
                              />
                            ),
                            title: `YouTube Video ${index + 1}`
                          })}
                          style={{ 
                            position: "relative",
                            borderRadius: "12px", 
                            overflow: "hidden",
                            background: "#000",
                            cursor: "pointer",
                            backgroundImage: `url(${thumbnailUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            height: "315px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "transform 0.2s ease, box-shadow 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = "scale(1.02)";
                            e.target.style.boxShadow = "0 8px 25px rgba(0,0,0,0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = "scale(1)";
                            e.target.style.boxShadow = "none";
                          }}
                        >
                          {/* Dark overlay */}
                          <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "rgba(0,0,0,0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background 0.3s ease"
                          }}>
                            {/* Large play button */}
                            <div style={{
                              background: "rgba(255,255,255,0.95)",
                              borderRadius: "50%",
                              width: "80px",
                              height: "80px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "28px",
                              color: "#ff0000",
                              boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
                              transition: "transform 0.2s ease"
                            }}>
                              <FaPlay style={{ marginLeft: "6px" }} />
                            </div>
                          </div>
                          
                          {/* Quality badge */}
                          <div style={{
                            position: "absolute",
                            top: "12px",
                            left: "12px",
                            background: "rgba(255,0,0,0.9)",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}>
                            HD
                          </div>
                          
                          {/* Expand button */}
                          <button
                            style={{
                              position: "absolute",
                              top: "12px",
                              right: "12px",
                              background: "rgba(0,0,0,0.8)",
                              border: "none",
                              color: "white",
                              padding: "8px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              transition: "background 0.2s ease"
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setVideoModal({
                                isOpen: true,
                                content: (
                                  <iframe
                                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1&fs=1&cc_load_policy=0&iv_load_policy=3&showinfo=1&quality=hd1080`}
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    allowFullScreen
                                    allow="autoplay; encrypted-media; fullscreen"
                                    title={`YouTube Video ${index + 1}`}
                                    style={{ borderRadius: "12px" }}
                                  />
                                ),
                                title: `YouTube Video ${index + 1}`
                              });
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = "rgba(0,0,0,0.9)";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = "rgba(0,0,0,0.8)";
                            }}
                          >
                            <FaExpand />
                            <span style={{ fontSize: "12px" }}>Томруулах</span>
                          </button>
                        </div>
                      </div>
                    );
                  }
                }
                
                // Facebook video processing with enhanced display
                if (cleanEmbed.includes('facebook.com/') || cleanEmbed.includes('fb.com/')) {
                  return (
                    <div key={index} style={{ position: "relative" }}>
                      <div style={{ 
                        borderRadius: "12px", 
                        overflow: "hidden",
                        background: "#1877f2",
                        minHeight: "314px",
                        position: "relative"
                      }}>
                        <iframe
                          src={`https://www.facebook.com/plugins/video.php?height=314&href=${encodeURIComponent(cleanEmbed)}&show_text=false&width=560&t=0`}
                          width="100%"
                          height="314"
                          style={{ border: "none", overflow: "hidden" }}
                          scrolling="no"
                          frameBorder="0"
                          allowFullScreen={true}
                          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                          title={`Facebook Video ${index + 1}`}
                        />
                        
                        {/* Quality badge */}
                        <div style={{
                          position: "absolute",
                          top: "12px",
                          left: "12px",
                          background: "rgba(24,119,242,0.9)",
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}>
                          FB
                        </div>
                        
                        {/* Expand button */}
                        <button
                          style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            background: "rgba(0,0,0,0.8)",
                            border: "none",
                            color: "white",
                            padding: "8px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                          onClick={() => setVideoModal({
                            isOpen: true,
                            content: (
                              <iframe
                                src={`https://www.facebook.com/plugins/video.php?height=600&href=${encodeURIComponent(cleanEmbed)}&show_text=false&width=800&t=0`}
                                width="100%"
                                height="100%"
                                style={{ border: "none", overflow: "hidden" }}
                                scrolling="no"
                                frameBorder="0"
                                allowFullScreen={true}
                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                title={`Facebook Video ${index + 1}`}
                              />
                            ),
                            title: `Facebook Video ${index + 1}`
                          })}
                        >
                          <FaExpand />
                          <span style={{ fontSize: "12px" }}>Томруулах</span>
                        </button>
                      </div>
                    </div>
                  );
                }
                
                // Instagram processing with enhanced display
                if (cleanEmbed.includes('instagram.com/')) {
                  const postId = cleanEmbed.split('/p/')[1]?.split('/')[0] || cleanEmbed.split('/reel/')[1]?.split('/')[0];
                  if (postId) {
                    return (
                      <div key={index} style={{ position: "relative" }}>
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "center",
                          background: "linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
                          borderRadius: "12px",
                          padding: "20px",
                          position: "relative"
                        }}>
                          <iframe
                            src={`https://www.instagram.com/p/${postId}/embed/captioned/`}
                            width="400"
                            height="500"
                            frameBorder="0"
                            scrolling="no"
                            allowTransparency="true"
                            style={{ 
                              borderRadius: "8px",
                              maxWidth: "100%",
                              background: "#fff"
                            }}
                            title={`Instagram Post ${index + 1}`}
                          />
                          
                          {/* Instagram badge */}
                          <div style={{
                            position: "absolute",
                            top: "12px",
                            left: "12px",
                            background: "rgba(0,0,0,0.8)",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}>
                            IG
                          </div>
                          
                          {/* Expand button */}
                          <button
                            style={{
                              position: "absolute",
                              top: "12px",
                              right: "12px",
                              background: "rgba(0,0,0,0.8)",
                              border: "none",
                              color: "white",
                              padding: "8px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            onClick={() => setVideoModal({
                              isOpen: true,
                              content: (
                                <div style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  height: "100%",
                                  background: "#000"
                                }}>
                                  <iframe
                                    src={`https://www.instagram.com/p/${postId}/embed/captioned/`}
                                    width="600"
                                    height="700"
                                    frameBorder="0"
                                    scrolling="no"
                                    allowTransparency="true"
                                    style={{ 
                                      borderRadius: "8px",
                                      maxWidth: "100%",
                                      maxHeight: "100%"
                                    }}
                                    title={`Instagram Post ${index + 1}`}
                                  />
                                </div>
                              ),
                              title: `Instagram Post ${index + 1}`
                            })}
                          >
                            <FaExpand />
                            <span style={{ fontSize: "12px" }}>Томруулах</span>
                          </button>
                        </div>
                      </div>
                    );
                  }
                }
                
                // Vimeo processing with enhanced display and HD quality
                if (cleanEmbed.includes('vimeo.com/')) {
                  const videoId = cleanEmbed.split('vimeo.com/')[1]?.split('?')[0];
                  if (videoId && !isNaN(videoId)) {
                    return (
                      <div key={index} style={{ position: "relative" }}>
                        <div style={{ 
                          borderRadius: "12px", 
                          overflow: "hidden",
                          background: "#00adef",
                          position: "relative"
                        }}>
                          <iframe
                            src={`https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479&controls=1&portrait=0&title=0&byline=0&quality=auto`}
                            width="100%"
                            height="315"
                            frameBorder="0"
                            allowFullScreen
                            allow="autoplay; fullscreen; picture-in-picture"
                            title={`Vimeo Video ${index + 1}`}
                          />
                          
                          {/* Quality badge */}
                          <div style={{
                            position: "absolute",
                            top: "12px",
                            left: "12px",
                            background: "rgba(0,173,239,0.9)",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}>
                            HD
                          </div>
                          
                          {/* Expand button */}
                          <button
                            style={{
                              position: "absolute",
                              top: "12px",
                              right: "12px",
                              background: "rgba(0,0,0,0.8)",
                              border: "none",
                              color: "white",
                              padding: "8px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            onClick={() => setVideoModal({
                              isOpen: true,
                              content: (
                                <iframe
                                  src={`https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479&controls=1&portrait=0&title=0&byline=0&autoplay=1&quality=auto`}
                                  width="100%"
                                  height="100%"
                                  frameBorder="0"
                                  allowFullScreen
                                  allow="autoplay; fullscreen; picture-in-picture"
                                  title={`Vimeo Video ${index + 1}`}
                                />
                              ),
                              title: `Vimeo Video ${index + 1}`
                            })}
                          >
                            <FaExpand />
                            <span style={{ fontSize: "12px" }}>Томруулах</span>
                          </button>
                        </div>
                      </div>
                    );
                  }
                }
                
                // Fallback: display as styled link
                return (
                  <div key={index} style={{
                    padding: "20px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "12px",
                    textAlign: "center"
                  }}>
                    <div style={{ 
                      fontSize: "32px", 
                      marginBottom: "12px" 
                    }}>
                      🎥
                    </div>
                    <a 
                      href={cleanEmbed} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ 
                        color: "#fff", 
                        textDecoration: "none",
                        fontWeight: "600",
                        fontSize: "16px"
                      }}
                    >
                      Видео харах
                    </a>
                    <div style={{
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.8)",
                      marginTop: "8px",
                      wordBreak: "break-all"
                    }}>
                      {cleanEmbed.length > 50 ? cleanEmbed.substring(0, 50) + "..." : cleanEmbed}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Facilities */}
        <div className="center-section">
          <h3 className="center-section-title">✨ Боломжууд</h3>
          <div className="center-facilities-wrap">
            {centerData.facilities.map((facility, index) => (
              <span key={index} className="center-facilities-chip">
                {facility}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* Sticky booking footer - Airbnb style */}
      <div className="center-booking-footer">
        <div className="center-booking-info">
          <div className="center-booking-price">
            {centerData.pricing?.standard ? (
              <>
                <span className="price-amount">{parseInt(centerData.pricing.standard).toLocaleString()}₮</span>
                <span className="price-unit">/ цаг</span>
              </>
            ) : (
              <span className="price-amount">{centerData.price}</span>
            )}
          </div>
          {centerData.rating && (
            <div className="center-booking-rating">
              <FaStar /> {centerData.rating} <span className="reviews-count">(116 reviews)</span>
            </div>
          )}
        </div>
        <button className="center-booking-btn">
          Захиалах
        </button>
      </div>

      {/* Video Modal */}
      {videoModal.isOpen && (
        <div className="center-video-modal">
          <div className="center-video-modal-content">
            <button
              onClick={() => setVideoModal({ isOpen: false, content: null, title: "" })}
              className="center-video-modal-close"
            >
              <FaTimes />
            </button>
            
            <div className="center-video-modal-title">
              {videoModal.title}
            </div>
            
            <div className="center-video-modal-wrapper">
              {videoModal.content}
            </div>
          </div>
          
          <div 
            onClick={() => setVideoModal({ isOpen: false, content: null, title: "" })}
            className="center-video-modal-backdrop"
          />
        </div>
      )}
    </div>
  );
}
