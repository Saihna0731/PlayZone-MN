import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_BASE } from "../config";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import SubscriptionPlans from "../admin/components/Tolbor/SubscriptionPlans";
import BottomNav from "../components/MainNavbars/BottomNav";
import CenterCard from "../components/ListComponents/CenterCard";
import AdminForm from "../admin/components/AdminForm";
import ConfirmModal from "../components/LittleComponents/ConfirmModal";

// Ачаалал шинэчлэх Modal компонент
function OccupancyModal({ center, isOpen, onClose, onUpdate }) {
  const [localOccupancy, setLocalOccupancy] = useState({
    standard: center?.occupancy?.standard || 0,
    vip: center?.occupancy?.vip || 0,
    stage: center?.occupancy?.stage || 0
  });
  const [updating, setUpdating] = useState(false);

  // Өнгийн функц
  const getOccupancyColor = (percentage) => {
    if (percentage <= 50) return "#4caf50"; // Ногоон
    if (percentage <= 85) return "#ffc107"; // Шар
    return "#f44336"; // Улаан
  };

  const handleUpdate = async () => {
    if (!onUpdate) return;
    
    setUpdating(true);
    try {
      await onUpdate(center._id, localOccupancy);
      onClose();
    } catch (error) {
      console.error("Failed to update occupancy:", error);
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen || !center) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "400px",
        padding: "24px",
        position: "relative",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#666",
            padding: "4px"
          }}
        >
          ✕
        </button>

        <h3 style={{ 
          margin: "0 0 20px 0", 
          fontSize: "18px", 
          fontWeight: "600",
          color: "#2e7d32",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          📊 {center.name} - Ачаалал шинэчлэх
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Энгийн */}
          <div>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px"
            }}>
              <label style={{ fontSize: "14px", color: "#333", fontWeight: "500" }}>
                💻 Энгийн компьютер
              </label>
              <span style={{
                fontSize: "14px",
                fontWeight: "600",
                color: getOccupancyColor(localOccupancy.standard),
                minWidth: "40px",
                textAlign: "right"
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
          <div>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px"
            }}>
              <label style={{ fontSize: "14px", color: "#333", fontWeight: "500" }}>
                👑 VIP компьютер
              </label>
              <span style={{
                fontSize: "14px",
                fontWeight: "600",
                color: getOccupancyColor(localOccupancy.vip),
                minWidth: "40px",
                textAlign: "right"
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
          <div>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px"
            }}>
              <label style={{ fontSize: "14px", color: "#333", fontWeight: "500" }}>
                🎮 Stage компьютер
              </label>
              <span style={{
                fontSize: "14px",
                fontWeight: "600",
                color: getOccupancyColor(localOccupancy.stage),
                minWidth: "40px",
                textAlign: "right"
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

          <div style={{ 
            display: "flex", 
            gap: "12px", 
            marginTop: "8px" 
          }}>
            <button
              onClick={handleUpdate}
              disabled={updating}
              style={{
                flex: 1,
                padding: "12px",
                background: updating ? "#ccc" : "linear-gradient(45deg, #4caf50, #66bb6a)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: updating ? "not-allowed" : "pointer",
                boxShadow: updating ? "none" : "0 4px 12px rgba(76, 175, 80, 0.3)",
                transition: "all 0.2s ease"
              }}
            >
              {updating ? "🔄 Шинэчилж байна..." : "✅ Хадгалах"}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "12px 20px",
                background: "#f5f5f5",
                color: "#666",
                border: "1px solid #ddd",
                borderRadius: "10px",
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              Болих
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Booking() {
  const { user, isAuthenticated, isCenterOwner } = useAuth();
  const { subscription, isPremiumUser, loading: subLoading } = useSubscription();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCenter, setEditingCenter] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [occupancyModalCenter, setOccupancyModalCenter] = useState(null);
  const [occupancyModalOpen, setOccupancyModalOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bonusModalCenter, setBonusModalCenter] = useState(null);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [manageModalCenter, setManageModalCenter] = useState(null);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [bonusManageMode, setBonusManageMode] = useState("edit");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Бүх төвийг авах
      const centersRes = await axios.get(`${API_BASE}/api/centers`);
      const allCenters = Array.isArray(centersRes.data?.centers) 
        ? centersRes.data.centers 
        : Array.isArray(centersRes.data) 
        ? centersRes.data 
        : [];
      
      // Game Center-уудыг шүүх (Game center эзэмшигчдийн оруулсан)
      const pcCenters = allCenters.filter(center => 
        center.category === "pc" || 
        center.category === "gaming" || 
        center.category === "internet" ||
        (center.facilities && center.facilities.some(f => 
          f.toLowerCase().includes("pc") || 
          f.toLowerCase().includes("gaming") || 
          f.toLowerCase().includes("playstation") || 
          f.toLowerCase().includes("xbox") ||
          f.toLowerCase().includes("ps") ||
          f.toLowerCase().includes("computer")
        ))
      );
      
      // Эзэмшигч бол зөвхөн өөрийн төвүүдийг харуулна, эс бөгөөс бүх Gaming төвүүд
      let visible = [];
      
      if (user?.role === 'admin') {
          visible = allCenters;
      } else if (isCenterOwner && user?._id) {
          // If owner, show ALL their centers regardless of category
          visible = allCenters.filter(c => {
            const ownerId = (c && typeof c.owner === 'object' && c.owner !== null) ? (c.owner._id || c.owner.id) : c.owner;
            return String(ownerId) === String(user._id);
          });
      } else {
          // If regular user, show only FAVORITE centers
          if (user?.favorites && Array.isArray(user.favorites)) {
            const favIds = user.favorites.map(f => (f._id || f).toString());
            visible = allCenters.filter(c => favIds.includes(c._id.toString()));
          } else {
            visible = [];
          }
      }

      // Харагдах жагсаалт болгон байршуулна
      setFavorites(visible);
      
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [isCenterOwner, user]);

  // Ачаалал шинэчлэх функц
  const updateOccupancy = async (centerId, occupancyData) => {
    try {
      await axios.put(
        `${API_BASE}/api/centers/${centerId}/occupancy`, 
        { occupancy: occupancyData },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Local state шинэчлэх
      setFavorites(prev => 
        prev.map(center => 
          center._id === centerId 
            ? { ...center, occupancy: occupancyData } 
            : center
        )
      );

      // Map-д мэдээлэл дамжуулах
      window.dispatchEvent(new CustomEvent("occupancy:updated", { 
        detail: { centerId, occupancy: occupancyData } 
      }));

      console.log("Occupancy updated:", centerId, occupancyData);
      
    } catch (err) {
      console.error("Failed to update occupancy:", err);
      alert("Ачаалал шинэчлэхэд алдаа гарлаа");
    }
  };

  // Ачаалал шинэчлэх modal нээх
  const handleOccupancyUpdate = (center) => {
    setOccupancyModalCenter(center);
    setOccupancyModalOpen(true);
  };

  // Ачаалал шинэчлэх modal хаах
  const handleOccupancyModalClose = () => {
    setOccupancyModalCenter(null);
    setOccupancyModalOpen(false);
  };

  // Center засах handler
  const handleEdit = (center) => {
    setEditingCenter(center);
    setFormOpen(true);
    // Match List page behavior: scroll to top when opening the edit form
    if (typeof window !== 'undefined' && window.scrollTo) {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        window.scrollTo(0, 0);
      }
    }
  };

  // Center устгах handler - confirm modal нээх
  const handleDelete = (centerId) => {
    if (!centerId) return;
    setDeleteConfirm({ open: true, id: centerId });
  };

  const confirmDeleteCenter = async () => {
    if (!deleteConfirm.id || deleteLoading) return;

    setDeleteLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(`${API_BASE}/api/centers/${deleteConfirm.id}`, { headers });

      // Local state-ээс устгах
      setFavorites(prev =>
        prev.filter(center => {
          const id = center._id ?? center.id;
          return String(id) !== String(deleteConfirm.id);
        })
      );
      setExpandedIndex(null);

      // Map дээр шинэчлэх
      window.dispatchEvent(new CustomEvent("centers:updated"));

      setDeleteConfirm({ open: false, id: null });
    } catch (err) {
      console.error("Failed to delete center:", err);
      alert(err.response?.data?.message || "PC төв устгахад алдаа гарлаа");
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDeleteCenter = () => {
    if (deleteLoading) return;
    setDeleteConfirm({ open: false, id: null });
  };

  // Center хадгалах handler
  const handleSaved = (savedCenter) => {
    // Local state шинэчлэх
    setFavorites(prev => {
      const exists = prev.find(c => c._id === savedCenter._id);
      if (exists) {
        return prev.map(c => c._id === savedCenter._id ? savedCenter : c);
      } else {
        return [...prev, savedCenter];
      }
    });
    
    // Form хаах
    setEditingCenter(null);
    setFormOpen(false);
    
    // Map дээр шинэчлэх
    window.dispatchEvent(new CustomEvent("centers:updated"));
  };

  useEffect(() => {
    fetchData();
    // centers:updated event-с ирвэл локал state-г шинэчилнэ
    const onCentersUpdated = (e) => {
      const updated = e.detail;
      if (updated && updated._id) {
        setFavorites(prev => prev.map(c => (c._id === updated._id ? updated : c)));
      } else {
        fetchData();
      }
    };
    window.addEventListener("centers:updated", onCentersUpdated);
    return () => window.removeEventListener("centers:updated", onCentersUpdated);
  }, [fetchData]); // fetchData өөрчлөгдөх үед дахин татах

  // Auth шалгалт - бүх hooks-ийн дараа
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px"
      }}>
        <div style={{
          maxWidth: "400px",
          width: "100%",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "40px 32px",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
        }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🔒</div>
          <h2 style={{ margin: "0 0 12px 0", fontSize: "24px", color: "#333" }}>
            Нэвтрэх шаардлагатай
          </h2>
          <p style={{ margin: "0 0 24px 0", color: "#666", fontSize: "15px", lineHeight: "1.6" }}>
            Захиалга өгөхийн тулд системд нэвтэрнэ үү.
          </p>
          <Link
            to="/login"
            style={{
              display: "block",
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              textDecoration: "none",
              borderRadius: "12px",
              fontWeight: "600",
              fontSize: "16px",
              boxShadow: "0 4px 12px rgba(118, 75, 162, 0.3)"
            }}
          >
            Нэвтрэх
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Free user/owner хязгаарлалт
  const canAccessBooking = (isCenterOwner && subscription?.plan !== 'free') || isPremiumUser;

  // Loading state for subscription
  if (subLoading) {
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
            🎅 Loading Christmas Bookings... 🎁
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
        <BottomNav />
      </div>
    );
  }
  
  if (isAuthenticated && !canAccessBooking) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
        paddingBottom: "calc(60px + env(safe-area-inset-bottom))"
      }}>
        <div style={{
          maxWidth: "420px",
          width: "100%",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "40px 32px",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
        }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🔒</div>
          <h2 style={{ margin: "0 0 12px 0", fontSize: "24px", color: "#333" }}>
            Энгийн план шаардлагатай
          </h2>
          <p style={{ margin: "0 0 24px 0", color: "#666", fontSize: "15px", lineHeight: "1.6" }}>
            Gaming төвүүдийг захиалахын тулд төлбөртэй план авах хэрэгтэй.
          </p>
          
          <div style={{ 
            background: "rgba(102, 126, 234, 0.1)", 
            borderRadius: "12px", 
            padding: "20px",
            marginBottom: "24px",
            textAlign: "left"
          }}>
            <div style={{ fontSize: "14px", color: "#333", marginBottom: "12px" }}>
              <strong>Энгийн планд багтсан:</strong>
            </div>
            <div style={{ fontSize: "14px", color: "#666", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>✅ Бүх төв харах</div>
              <div>✅ Дэлгэрэнгүй мэдээлэл</div>
              <div>✅ Ачаалал шалгах</div>
              <div>✅ Дуртай төв нэмэх</div>
            </div>
          </div>

          <button
            onClick={() => setShowUpgradeModal(true)}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontWeight: "700",
              fontSize: "15px",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(240, 147, 251, 0.4)",
              marginBottom: "12px"
            }}
          >
            🚀 Планаа шинэчлэх
          </button>
          
          <Link
            to="/map"
            style={{
              display: "block",
              padding: "10px",
              color: "#666",
              textDecoration: "none",
              fontSize: "14px"
            }}
          >
            ← Map руу буцах
          </Link>
        </div>
        
        {showUpgradeModal && (
          <SubscriptionPlans
            showModal={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
          />
        )}
        
        <BottomNav />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        textAlign: "center",
        padding: 20 
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
            🎅 Loading Gaming Centers... 🎁
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
        <BottomNav />
      </div>
    );
  }

  const deleteTarget = deleteConfirm.id
    ? favorites.find(center => String(center._id ?? center.id) === String(deleteConfirm.id))
    : null;

  return (
    <div style={{ 
      paddingBottom: 80,
      minHeight: "100vh",
      background: "#f3f4f6"
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
          marginBottom: "12px"
        }}>
          <div>
            <div style={{
              fontSize: "12px",
              color: "#6b7280",
              fontWeight: "500",
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              {isCenterOwner ? "Management" : "My Bookings"}
            </div>
            <h1 style={{ 
              fontSize: "24px", 
              margin: 0, 
              fontWeight: "800",
              color: "#1f2937",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              {isCenterOwner ? "💻 Game Centers" : "📅 Захиалгууд"}
            </h1>
          </div>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "20px",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
          }}>
            {isCenterOwner ? "🎮" : "👤"}
          </div>
        </div>
        <p style={{ 
          margin: 0, 
          color: "#6b7280", 
          fontSize: "14px",
          lineHeight: "1.5"
        }}>
          {isCenterOwner ? "Бүх төвүүдээ удирдах, бонус нэмэх, ачаалал шинэчлэх" : "Таны дуртай төвүүд болон захиалгын түүх"}
        </p>
      </div>

      {/* AdminForm - NOTE: AdminForm өөрөө modal-тай тул гаднаас overlay хийх хэрэггүй. 
          formOpen=true үед л харагдана; editingCenter-г editingItem хэлбэрээр дамжуулна. */}
      <AdminForm
        editingItem={editingCenter}
        isOpen={formOpen}
        onSaved={handleSaved}
        onCancel={() => {
          setFormOpen(false);
          setEditingCenter(null);
        }}
      />

      {/* OccupancyModal */}
      <OccupancyModal
        center={occupancyModalCenter}
        isOpen={occupancyModalOpen}
        onClose={handleOccupancyModalClose}
        onUpdate={updateOccupancy}
      />

      <div style={{ padding: "20px" }}>
        {/* PC Centers Section */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "20px" 
          }}>
            <h2 style={{ 
              fontSize: "20px", 
              color: "#1f2937", 
              margin: 0,
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              💻 Gaming төвүүд
              <span style={{ 
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", 
                color: "white", 
                padding: "4px 12px", 
                borderRadius: "20px", 
                fontSize: "13px",
                fontWeight: "700",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)"
              }}>
                {favorites.length}
              </span>
            </h2>
            
            {(isCenterOwner && subscription?.plan !== 'free') && (
              <button
                onClick={() => {
                  setEditingCenter(null);
                  setFormOpen(true);
                }}
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "10px 20px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <span style={{ fontSize: "16px" }}>+</span> Шинэ төв
              </button>
            )}
          </div>
          
          {favorites.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {favorites.map((center, index) => {
                const ownerId = (center && typeof center.owner === 'object' && center.owner !== null) ? (center.owner._id || center.owner.id) : center.owner;
                const isOwner = isCenterOwner && ownerId && String(ownerId) === String(user?._id);
                return (
                  <div key={center._id || center.id} style={{ 
                    background: "#ffffff",
                    borderRadius: "16px",
                    padding: "16px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    border: "1px solid #f0f0f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}>
                    <CenterCard 
                      item={center}
                      expanded={expandedIndex === index}
                      onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
                      onEdit={() => handleEdit(center)}
                      onDelete={handleDelete}
                      canEdit={isOwner}
                      isBookingMode={true}
                      onOccupancyUpdate={handleOccupancyUpdate}
                    />
                    {isOwner && (
                      <div style={{ 
                        display: "flex", 
                        flexWrap: "wrap", 
                        gap: "10px",
                        paddingTop: "12px",
                        borderTop: "1px solid #f0f0f0"
                      }}>
                        <button
                          onClick={() => handleOccupancyUpdate(center)}
                          style={{ 
                            padding: "10px 16px",
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "12px",
                            fontSize: "13px",
                            fontWeight: "700",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 0.2s"
                          }}
                        >
                          📊 Ачаалал
                        </button>
                        <button
                          onClick={() => { setBonusModalCenter(center); setBonusModalOpen(true); }}
                          style={{ 
                            padding: "10px 16px",
                            background: "linear-gradient(135deg, #f59e0b, #d97706)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "12px",
                            fontSize: "13px",
                            fontWeight: "700",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 0.2s"
                          }}
                        >
                          🎁 Бонус
                        </button>
                        <div style={{ 
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 14px",
                          background: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                          flex: 1,
                          minWidth: "fit-content"
                        }}>
                          <span style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280" }}>
                            Bonus:
                          </span>
                          <button
                            onClick={() => { setManageModalCenter(center); setBonusManageMode('edit'); setManageModalOpen(true); }}
                            style={{ 
                              padding: "6px 12px",
                              borderRadius: "10px",
                              border: "none",
                              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
                              transition: "all 0.2s"
                            }}
                          >
                            ✏️ Засах
                          </button>
                          <button
                            onClick={() => { setManageModalCenter(center); setBonusManageMode('delete'); setManageModalOpen(true); }}
                            style={{ 
                              padding: "6px 12px",
                              borderRadius: "10px",
                              border: "none",
                              background: "linear-gradient(135deg, #ef4444, #dc2626)",
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
                              transition: "all 0.2s"
                            }}
                          >
                            🗑️ Устгах
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              padding: "48px 24px",
              borderRadius: "20px",
              textAlign: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              border: "2px solid #fbbf24"
            }}>
              <div style={{ 
                fontSize: "64px", 
                marginBottom: "20px",
                animation: "bounce 2s ease-in-out infinite"
              }}>
                🎮
              </div>
              <h3 style={{ 
                margin: "0 0 12px 0", 
                color: "#92400e", 
                fontSize: "20px", 
                fontWeight: "800"
              }}>
                {isCenterOwner ? "Төв бүртгээгүй байна" : "Дуртай төв алга"}
              </h3>
              <p style={{ 
                color: "#b45309", 
                fontSize: "14px", 
                lineHeight: "1.6",
                maxWidth: "320px",
                margin: "0 auto"
              }}>
                {isCenterOwner 
                  ? "Эхлээд төвөө бүртгэж, gaming төвүүдээ удирдаарай"
                  : "Map эсвэл List хуудаснаас дуртай төвүүдээ нэмээрэй"
                }
              </p>
              <style>{`
                @keyframes bounce {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-10px); }
                }
              `}</style>
            </div>
          )}
        </div>

        {/* Booking History Section */}
        {!isCenterOwner && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ 
              fontSize: "20px", 
              color: "#1f2937", 
              margin: "0 0 20px 0",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              📜 Захиалгын түүх
            </h2>
            
            <div style={{
              background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
              padding: "40px 20px",
              borderRadius: "20px",
              textAlign: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              border: "2px solid #818cf8"
            }}>
              <div style={{ 
                fontSize: "48px", 
                marginBottom: "16px",
                animation: "pulse 2s ease-in-out infinite"
              }}>
                📅
              </div>
              <h3 style={{
                margin: "0 0 8px 0",
                color: "#3730a3",
                fontSize: "18px",
                fontWeight: "700"
              }}>
                Захиалга байхгүй байна
              </h3>
              <p style={{ 
                color: "#4338ca", 
                margin: 0, 
                fontSize: "14px",
                lineHeight: "1.6"
              }}>
                Gaming төвүүд дээрээ дарж захиалга үүсгэнэ үү
              </p>
              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 1; transform: scale(1); }
                  50% { opacity: 0.8; transform: scale(0.95); }
                }
              `}</style>
            </div>
          </div>
        )}

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
              Нэвтэрч Gaming төвүүдээ харъаарай!
            </h3>
            <p style={{ color: "#bf360c", margin: "0 0 16px 0", fontSize: "14px" }}>
              Нэвтэрснээр Gaming төвүүдийн мэдээллийг харж, захиалга өгч болно
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
      
      <ConfirmModal
        open={deleteConfirm.open}
        title="PC төвийг устгах уу?"
        message={
          deleteTarget
            ? `${deleteTarget.name || "PC төв"}-ийг бүр мөсөн устгах гэж байна. Үйлдлийг буцаах боломжгүй.`
            : "PC төвийг устгах уу?"
        }
        confirmText={deleteLoading ? "Устгаж байна..." : "Тийм, устга"}
        cancelText="Болих"
        onConfirm={confirmDeleteCenter}
        onCancel={cancelDeleteCenter}
      />

      {/* Bonus Modal */}
      <AddBonusModal
        center={bonusModalCenter}
        isOpen={bonusModalOpen}
        onClose={() => { setBonusModalOpen(false); setBonusModalCenter(null); }}
        onAdded={(updatedCenter) => {
          if (updatedCenter?._id) {
            setFavorites(prev => prev.map(c => c._id === updatedCenter._id ? updatedCenter : c));
          }
        }}
      />

      <BonusManageModal
        center={manageModalCenter}
        isOpen={manageModalOpen}
        mode={bonusManageMode}
        onClose={() => { 
          setManageModalOpen(false); 
          setManageModalCenter(null); 
          setBonusManageMode('edit');
        }}
        onUpdated={(updatedCenter) => {
          if (updatedCenter?._id) {
            setFavorites(prev => prev.map(c => c._id === updatedCenter._id ? updatedCenter : c));
          }
        }}
      />

      <BottomNav />
    </div>
  );
}

// Бонус нэмэх Modal (энгийн хувилбар)
function AddBonusModal({ center, isOpen, onClose, onAdded }) {
  const [form, setForm] = useState({ title: '', text: '', standardFree: '', vipFree: '', stageFree: '' });
  const [saving, setSaving] = useState(false);
  if (!isOpen || !center) return null;
  const change = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: form.title,
        text: form.text,
        standardFree: form.standardFree ? Number(form.standardFree) : undefined,
        vipFree: form.vipFree ? Number(form.vipFree) : undefined,
        stageFree: form.stageFree ? Number(form.stageFree) : undefined
      };
      const res = await axios.post(`${API_BASE}/api/centers/${center._id}/bonus`, payload, { headers: { Authorization: `Bearer ${token}` } });
      onAdded?.(res.data);
      onClose();
    } catch (err) {
      console.error('Add bonus error:', err);
      alert(err.response?.data?.error || 'Бонус хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', width:'100%', maxWidth:420, borderRadius:16, padding:24, boxShadow:'0 10px 32px rgba(0,0,0,.25)', position:'relative' }}>
        <button onClick={onClose} style={{ position:'absolute', top:12, right:12, background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#666' }}>✕</button>
        <h3 style={{ margin:0, marginBottom:16, fontSize:18, fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>🎁 Бонус нэмэх</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <input name="title" placeholder="Гарчиг" value={form.title} onChange={change} style={inputStyle} />
          <textarea name="text" placeholder="Тайлбар (сонголттой)" value={form.text} onChange={change} style={{ ...inputStyle, minHeight:80 }} />
          <div style={{ display:'flex', gap:8 }}>
            <input name="standardFree" placeholder="Заал" value={form.standardFree} onChange={change} style={{ ...inputStyle, flex:1 }} />
            <input name="vipFree" placeholder="VIP" value={form.vipFree} onChange={change} style={{ ...inputStyle, flex:1 }} />
            <input name="stageFree" placeholder="Stage" value={form.stageFree} onChange={change} style={{ ...inputStyle, flex:1 }} />
          </div>
          <button disabled={saving} onClick={submit} style={btnPrimary}>{saving ? '🔄 Хадгалж байна...' : '✅ Хадгалах'}</button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = { width:'100%', padding:'10px 14px', border:'2px solid #e5e7eb', borderRadius:12, fontSize:13, fontWeight:600, outline:'none' };
const btnPrimary = { padding:'12px 18px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontSize:14, boxShadow:'0 4px 14px rgba(99,102,241,.35)' };

// Бонус засах/устгах Modal (орчин үеийн загвар)
function BonusManageModal({ center, isOpen, onClose, onUpdated, mode = 'edit' }) {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title:'', text:'', standardFree:'', vipFree:'', stageFree:'' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const isDeleteMode = mode === 'delete';
  if (!isOpen || !center) return null;

  const startEdit = (b) => {
    setEditingId(b._id);
    setForm({
      title: b.title || '',
      text: b.text || '',
      standardFree: b.standardFree ?? '',
      vipFree: b.vipFree ?? '',
      stageFree: b.stageFree ?? ''
    });
  };
  const cancelEdit = () => { setEditingId(null); setForm({ title:'', text:'', standardFree:'', vipFree:'', stageFree:'' }); };
  const change = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const doSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: form.title,
        text: form.text,
        standardFree: form.standardFree === '' ? undefined : Number(form.standardFree),
        vipFree: form.vipFree === '' ? undefined : Number(form.vipFree),
        stageFree: form.stageFree === '' ? undefined : Number(form.stageFree)
      };
      const res = await axios.put(`${API_BASE}/api/centers/${center._id}/bonus/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      onUpdated?.(res.data);
      cancelEdit();
    } catch (err) {
      console.error('Update bonus error:', err);
      alert(err.response?.data?.error || 'Бонус шинэчлэхэд алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (bid) => {
    if (!bid || deleting) return;
    setDeleting(bid);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${API_BASE}/api/centers/${center._id}/bonus/${bid}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) {
        onUpdated?.(res.data.center);
        window.dispatchEvent(new CustomEvent('toast', { detail: { type:'info', message:'Бонус амжилттай устлаа' } }));
        if (editingId === bid) cancelEdit();
        // Refresh centers after short delay
        setTimeout(() => window.dispatchEvent(new Event('centers:updated')), 150);
      } else {
        onUpdated?.(res.data);
      }
    } catch (err) {
      console.error('Delete bonus error:', err);
      window.dispatchEvent(new CustomEvent('toast', { detail: { type:'error', message: err.response?.data?.error || 'Бонус устгахад алдаа гарлаа' } }));
    } finally {
      setDeleting(null);
    }
  };

  const bonuses = Array.isArray(center.bonus) ? center.bonus.slice() : [];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', width:'100%', maxWidth:520, borderRadius:16, padding:24, boxShadow:'0 10px 32px rgba(0,0,0,.25)', position:'relative' }}>
        <button onClick={onClose} style={{ position:'absolute', top:12, right:12, background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#666' }}>✕</button>
        <h3 style={{ margin:0, marginBottom:4, fontSize:18, fontWeight:800, display:'flex', alignItems:'center', gap:8 }}>
          {isDeleteMode ? '🗑️ Бонус устгах' : '🎛️ Бонус засах'}
        </h3>
        <p style={{ margin:'0 0 12px 0', fontSize:12, color:'#64748b' }}>
          {isDeleteMode ? 'Устгах бонусоо сонгоно уу' : 'Засах бонусоо сонгохдоо жагсаалтаас сонгоно уу'}
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {bonuses.length === 0 && <div style={{ color:'#666', fontSize:14 }}>Бонус одоогоор байхгүй</div>}
          {bonuses.map(b => (
            <div key={b._id || b.createdAt} style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
              {editingId === b._id ? (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <input name="title" placeholder="Гарчиг" value={form.title} onChange={change} style={inputStyle} />
                  <textarea name="text" placeholder="Тайлбар (сонголттой)" value={form.text} onChange={change} style={{ ...inputStyle, minHeight:80 }} />
                  <div style={{ display:'flex', gap:8 }}>
                    <input name="standardFree" placeholder="STD" value={form.standardFree} onChange={change} style={{ ...inputStyle, flex:1 }} />
                    <input name="vipFree" placeholder="VIP" value={form.vipFree} onChange={change} style={{ ...inputStyle, flex:1 }} />
                    <input name="stageFree" placeholder="STG" value={form.stageFree} onChange={change} style={{ ...inputStyle, flex:1 }} />
                  </div>
                  <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <button onClick={cancelEdit} style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #e5e7eb', background:'#f8fafc', fontWeight:700, fontSize:12 }}>Болих</button>
                    <button disabled={saving} onClick={doSave} style={btnPrimary}>{saving ? '🔄 Хадгалж байна...' : '✅ Хадгалах'}</button>
                  </div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontWeight:800 }}>{b.title || 'Бонус'}</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => startEdit(b)} style={{ padding:'6px 10px', borderRadius:10, border:'1px solid #e5e7eb', background:'#f8fafc', fontSize:12, fontWeight:700 }}>Засах</button>
                      <button onClick={() => doDelete(b._id)} disabled={deleting === b._id} style={{ padding:'6px 10px', borderRadius:10, background:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff', border:'none', fontSize:12, fontWeight:800 }}>{deleting === b._id ? 'Устгаж...' : 'Устгах'}</button>
                    </div>
                  </div>
                  {b.text && <div style={{ fontSize:13, color:'#475569' }}>{b.text}</div>}
                  {(b.standardFree || b.vipFree || b.stageFree) && (
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {b.standardFree ? <span className="seat-badge std">STD {b.standardFree}</span> : null}
                      {b.vipFree ? <span className="seat-badge vip">VIP {b.vipFree}</span> : null}
                      {b.stageFree ? <span className="seat-badge stage">STG {b.stageFree}</span> : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}