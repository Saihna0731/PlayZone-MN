
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPhone, FaMapMarkerAlt, FaClock, FaGlobe, FaEnvelope, FaStar, FaChevronLeft, FaChevronRight, FaExpand, FaTimes, FaPlay } from "react-icons/fa";
import axios from "axios";
import { API_BASE } from "../config";

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

  const showOnMap = () => {
    if (!centerData) return;
    window.dispatchEvent(new CustomEvent("centers:updated", { 
      detail: { lat: centerData.lat, lng: centerData.lng } 
    }));
    navigate("/map");
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f8f9fa"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "4px solid #e0e0e0",
            borderTop: "4px solid #1976d2",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }}></div>
          <p style={{ color: "#666" }}>Мэдээлэл ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  if (!centerData) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f8f9fa"
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#666", marginBottom: "16px" }}>Мэдээлэл олдсонгүй</p>
          <button 
            onClick={() => navigate("/list")}
            style={{
              padding: "12px 24px",
              background: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Буцах
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Header with back button */}
      <div style={{
        position: "sticky",
        top: 0,
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        zIndex: 100,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px"
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            color: "#1976d2",
            cursor: "pointer",
            padding: "8px"
          }}
        >
          <FaArrowLeft />
        </button>
        <h2 style={{ margin: 0, flex: 1, fontSize: "18px", color: "#333" }}>
          {centerData.name}
        </h2>
      </div>

      {/* Image carousel */}
      <div style={{ position: "relative", height: "300px", background: "#000" }}>
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
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover"
          }}
          onError={(e) => {
            // Зураг load болохгүй бол default зураг харуулах
            e.target.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400&h=900&fit=crop&q=90&auto=format";
          }}
        />
        
        {/* Image navigation */}
        <button
          onClick={prevImage}
          style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(0,0,0,0.6)",
            border: "none",
            color: "#fff",
            padding: "12px",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          <FaChevronLeft />
        </button>
        
        <button
          onClick={nextImage}
          style={{
            position: "absolute",
            right: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(0,0,0,0.6)",
            border: "none",
            color: "#fff",
            padding: "12px",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          <FaChevronRight />
        </button>

        {/* Image indicators */}
        <div style={{
          position: "absolute",
          bottom: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "8px"
        }}>
          {centerData.images.map((_, index) => (
            <div
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              style={{
                width: index === currentImageIndex ? "24px" : "8px",
                height: "8px",
                borderRadius: "4px",
                background: index === currentImageIndex ? "#fff" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px", paddingBottom: "80px" }}>
        {/* Title and rating */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "700", color: "#1a1a1a" }}>
              {centerData.name}
            </h1>
            <div style={{
              background: "#4caf50",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <FaStar />
              {centerData.rating}
            </div>
          </div>
          
          <div style={{
            background: "#e3f2fd",
            color: "#1976d2",
            padding: "4px 12px",
            borderRadius: "16px",
            fontSize: "14px",
            fontWeight: "500",
            display: "inline-block",
            marginBottom: "12px"
          }}>
            {centerData.category}
          </div>
        </div>

        {/* Price */}
        <div style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "#333" }}>
            💰 Үнийн мэдээлэл
          </h3>
          
          {centerData.pricing && (centerData.pricing.standard || centerData.pricing.vip || centerData.pricing.stage || centerData.pricing.overnight) ? (
            <div style={{ display: "grid", gap: "12px" }}>
              {centerData.pricing.standard && (
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "#f1f8e9",
                  borderRadius: "8px",
                  border: "1px solid #c8e6c9"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px" }}>🎮</span>
                    <span style={{ fontWeight: "500", color: "#333" }}>Заал</span>
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "#4caf50" }}>
                    {parseInt(centerData.pricing.standard).toLocaleString()}₮/цаг
                  </div>
                </div>
              )}
              
              {centerData.pricing.vip && (
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "#fff3e0",
                  borderRadius: "8px",
                  border: "1px solid #ffcc02"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px" }}>👑</span>
                    <span style={{ fontWeight: "500", color: "#333" }}>VIP өрөө</span>
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "#ff9800" }}>
                    {parseInt(centerData.pricing.vip).toLocaleString()}₮/цаг
                  </div>
                </div>
              )}
              
              {centerData.pricing.stage && (
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "#f3e5f5",
                  borderRadius: "8px",
                  border: "1px solid #ce93d8"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px" }}>🎭</span>
                    <span style={{ fontWeight: "500", color: "#333" }}>Stage өрөө</span>
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "#9c27b0" }}>
                    {parseInt(centerData.pricing.stage).toLocaleString()}₮/цаг
                  </div>
                </div>
              )}
              
              {centerData.pricing.overnight && (
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "#e8eaf6",
                  borderRadius: "8px",
                  border: "1px solid #9fa8da"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px" }}>🌙</span>
                    <span style={{ fontWeight: "500", color: "#333" }}>Хоног</span>
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "#3f51b5" }}>
                    {parseInt(centerData.pricing.overnight).toLocaleString()}₮/хоног
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: "32px", fontWeight: "700", color: "#1976d2", marginBottom: "4px" }}>
                {centerData.price}
              </div>
              <div style={{ color: "#666", fontSize: "14px" }}>
                Цагийн төлбөр
              </div>
            </div>
          )}
        </div>

        {/* Contact info */}
        <div style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}>
            Холбоо барих
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <FaMapMarkerAlt style={{ color: "#f44336", fontSize: "16px" }} />
              <span style={{ color: "#333" }}>{centerData.address}</span>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <FaPhone style={{ color: "#4caf50", fontSize: "16px" }} />
              <a href={`tel:${centerData.phone}`} style={{ color: "#1976d2", textDecoration: "none" }}>
                {centerData.phone}
              </a>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <FaClock style={{ color: "#ff9800", fontSize: "16px" }} />
              <span style={{ color: "#333" }}>{centerData.opening}</span>
            </div>
            
            {centerData.email && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <FaEnvelope style={{ color: "#2196f3", fontSize: "16px" }} />
                <a href={`mailto:${centerData.email}`} style={{ color: "#1976d2", textDecoration: "none" }}>
                  {centerData.email}
                </a>
              </div>
            )}
            
            {centerData.website && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <FaGlobe style={{ color: "#9c27b0", fontSize: "16px" }} />
                <a 
                  href={centerData.website.startsWith('http://') || centerData.website.startsWith('https://') ? 
                    centerData.website : 
                    `https://${centerData.website}`
                  } 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ color: "#1976d2", textDecoration: "none" }}
                >
                  {centerData.website}
                </a>
              </div>
            )}
          </div>
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
        <div style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}>
            Боломжууд
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {centerData.facilities.map((facility, index) => (
              <span
                key={index}
                style={{
                  background: "#f1f3f4",
                  color: "#333",
                  padding: "6px 12px",
                  borderRadius: "16px",
                  fontSize: "14px"
                }}
              >
                {facility}
              </span>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <button
            onClick={showOnMap}
            style={{
              flex: 1,
              background: "#1976d2",
              color: "#fff",
              border: "none",
              padding: "16px",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <FaMapMarkerAlt />
            Газрын зураг дээр харах
          </button>
          
          <button
            style={{
              flex: 1,
              background: "#4caf50",
              color: "#fff",
              border: "none",
              padding: "16px",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Захиалах
          </button>
        </div>
      </div>

      {/* Video Modal */}
      {videoModal.isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.9)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          {/* Modal Content */}
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: "1200px",
            height: "80vh",
            background: "#000",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
          }}>
            {/* Close Button */}
            <button
              onClick={() => setVideoModal({ isOpen: false, content: null, title: "" })}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "rgba(255,255,255,0.9)",
                border: "none",
                color: "#333",
                padding: "12px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "18px",
                zIndex: 10000,
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
              }}
            >
              <FaTimes />
            </button>
            
            {/* Video Title */}
            <div style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              background: "rgba(0,0,0,0.7)",
              color: "white",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              zIndex: 10000
            }}>
              {videoModal.title}
            </div>
            
            {/* Video Content */}
            <div style={{
              width: "100%",
              height: "100%",
              position: "relative"
            }}>
              {videoModal.content}
            </div>
          </div>
          
          {/* Background Click to Close */}
          <div 
            onClick={() => setVideoModal({ isOpen: false, content: null, title: "" })}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: -1
            }}
          />
        </div>
      )}

      </div>
    </>
  );
}
