import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import { useAuth } from "../contexts/AuthContext";
import BottomNav from "../components/BottomNav";
import CenterCard from "../components/CenterCard";

export default function Booking() {
  const [favorites, setFavorites] = useState([]);
  const [gamingCenters, setGamingCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Бүх төвийг авах
      const centersRes = await axios.get(`${API_BASE}/api/centers`);
      const allCenters = centersRes.data || [];
      
      // Тоглоомын төвүүдийг шүүх
      const gaming = allCenters.filter(center => 
        center.category === "gaming" || 
        center.category === "internet" ||
        (center.facilities && center.facilities.some(f => 
          f.toLowerCase().includes("gaming") || 
          f.toLowerCase().includes("playstation") || 
          f.toLowerCase().includes("xbox") ||
          f.toLowerCase().includes("ps")
        ))
      );
      setGamingCenters(gaming);
      
      // User-ийн favorites авах (хэрэв нэвтэрсэн бол)
      if (user) {
        try {
          const token = localStorage.getItem("token");
          const favRes = await axios.get(`${API_BASE}/api/auth/favorites`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // API-аас favorites-ийг авах
          const userFavoritesCenters = favRes.data.favorites || [];
          setFavorites(userFavoritesCenters);
        } catch (err) {
          console.error("Failed to fetch favorites:", err);
        }
      } else {
        setFavorites([]);
      }
      
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchData өөрчлөгдөх үед дахин татах

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "calc(100vh - 60px)",
        textAlign: "center",
        padding: 20 
      }}>
        <div style={{ fontSize: "24px", marginBottom: 16 }}>⏳</div>
        <p style={{ color: "#666" }}>Мэдээлэл ачааллаж байна...</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ 
      paddingBottom: 80,
      minHeight: "100vh",
      background: "#f8f9fa"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "20px 16px",
        textAlign: "center"
      }}>
        <h1 style={{ fontSize: "24px", margin: 0, fontWeight: "600" }}>🎮 Миний захиалга</h1>
        <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
          Дуртай төвүүд болон тоглоомын газрууд
        </p>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Favorites Section */}
        {user && (
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ 
              fontSize: "18px", 
              color: "#333", 
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              ❤️ Дуртай төвүүд
              <span style={{ 
                background: "#e3f2fd", 
                color: "#1976d2", 
                padding: "2px 8px", 
                borderRadius: "12px", 
                fontSize: "12px" 
              }}>
                {favorites.length}
              </span>
            </h2>
            
            {favorites.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {favorites.map((center) => (
                  <CenterCard 
                    key={center._id || center.id} 
                    item={center}
                    isAdmin={false}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                background: "white",
                padding: "32px 20px",
                borderRadius: "12px",
                textAlign: "center",
                border: "1px solid #e0e0e0"
              }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>💔</div>
                <p style={{ color: "#666", margin: 0 }}>
                  Одоогоор дуртай төв байхгүй байна
                </p>
              </div>
            )}
          </div>
        )}

        {/* Gaming Centers Section */}
        <div>
          <h2 style={{ 
            fontSize: "18px", 
            color: "#333", 
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            🎮 Тоглоомын төвүүд
            <span style={{ 
              background: "#e8f5e8", 
              color: "#2e7d32", 
              padding: "2px 8px", 
              borderRadius: "12px", 
              fontSize: "12px" 
            }}>
              {gamingCenters.length}
            </span>
          </h2>
          
          {gamingCenters.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {gamingCenters.map((center) => (
                <CenterCard 
                  key={center._id || center.id} 
                  item={center}
                  isAdmin={false}
                />
              ))}
            </div>
          ) : (
            <div style={{
              background: "white",
              padding: "32px 20px",
              borderRadius: "12px",
              textAlign: "center",
              border: "1px solid #e0e0e0"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎮</div>
              <p style={{ color: "#666", margin: 0 }}>
                Тоглоомын төв олдсонгүй
              </p>
            </div>
          )}
        </div>

        {/* Login prompt for non-authenticated users */}
        {!user && (
          <div style={{
            background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            marginTop: "24px"
          }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>👋</div>
            <h3 style={{ color: "#d84315", marginBottom: "8px", fontSize: "16px" }}>
              Нэвтэрч дуртай төвүүдээ хадгалаарай!
            </h3>
            <p style={{ color: "#bf360c", margin: "0 0 16px 0", fontSize: "14px" }}>
              Нэвтэрснээр өөрийн дуртай төвүүдийг хадгалж, захиалгын түүхийг харж болно
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              style={{
                background: "#d84315",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              Нэвтрэх
            </button>
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}