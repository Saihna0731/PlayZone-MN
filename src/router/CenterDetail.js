
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPhone, FaMapMarkerAlt, FaClock, FaGlobe, FaEnvelope, FaStar, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import axios from "axios";
import { API_BASE } from "../config";

export default function CenterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [centerData, setCenterData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCenter = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/centers`);
        const centers = res.data || [];
        const found = centers.find(c => (c._id || c.id) === id);
        
        if (found) {
          setCenterData({
            ...found,
            // Default values if not provided
            email: found.email || "info@example.com",
            website: found.website || "www.example.com",
            opening: found.opening || "10:00 - 23:00",
            price: found.price || "3000₮/hour",
            rating: found.rating || 4.5,
            images: found.images && found.images.length > 0 ? 
              found.images.map(img => {
                if (img && img.includes('unsplash.com')) {
                  return img.replace(/w=\d+/, 'w=1400').replace(/h=\d+/, 'h=900').replace(/fit=crop/, 'fit=crop&q=90&auto=format');
                }
                return img;
              }) : [
              "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400&h=900&fit=crop&q=90&auto=format"
            ],
            facilities: found.facilities && found.facilities.length > 0 ? found.facilities : [
              "Gaming PC", "Wi-Fi", "Ундаа"
            ]
          });
        } else {
          // Fallback data
          setCenterData({
            id: id,
            name: "PC Center",
            category: "Gaming Center",
            address: "Улаанбаатар",
            phone: "+976 9999 9999",
            email: "info@example.com",
            website: "www.example.com",
            opening: "10:00 - 23:00",
            price: "3000₮/hour",
            rating: 4.5,
            description: "PC тоглоомын газар",
            longDescription: "Орчин үеийн тоног төхөөрөмжөөр тоноглогдсон тоглоомын газар.",
            images: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400&h=900&fit=crop&q=90&auto=format"],
            facilities: ["Gaming PC", "Wi-Fi"],
            lat: 47.918,
            lng: 106.917
          });
        }
      } catch (err) {
        console.error("Error fetching center:", err);
        // Fallback data on error
        setCenterData({
          id: id,
          name: "PC Center",
          category: "Gaming Center", 
          address: "Улаанбаатар",
          phone: "+976 9999 9999",
          email: "info@example.com",
          website: "www.example.com",
          opening: "10:00 - 23:00",
          price: "3000₮/hour",
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

    fetchCenter();
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
          src={centerData.images[currentImageIndex]}
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
          
          {centerData.pricing && (centerData.pricing.standard || centerData.pricing.vip || centerData.pricing.stage) ? (
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

        {/* Description */}
        <div style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "600" }}>
            Тайлбар
          </h3>
          <p style={{ margin: 0, color: "#555", lineHeight: "1.6" }}>
            {centerData.longDescription}
          </p>
        </div>

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

      </div>
    </>
  );
}
