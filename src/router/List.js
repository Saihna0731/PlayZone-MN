import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../config";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import SubscriptionPlans from "../admin/components/Tolbor/SubscriptionPlans";
import ListSearch from "../components/ListComponents/ListSearch";
import MapHeader from "../components/MapComponents/MapHeader";
import AdminForm from "../admin/components/AdminForm";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import CenterCard from "../components/ListComponents/CenterCard";
import "../styles/List.css";

export default function List() {
  const { isAuthenticated, isAdmin, isCenterOwner, user } = useAuth();
  const { subscription, isPremiumUser } = useSubscription();
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isAdminLocal, setIsAdminLocal] = useState(localStorage.getItem("admin") === "true");
  const [editingItem, setEditingItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, id: null });

  const fetchCenters = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/centers`);
      setItems(res.data || []);
      setFiltered(res.data || []);
    } catch (err) {
      console.error("fetchCenters:", err);
    }
  }, []);

  useEffect(() => {
    fetchCenters();
    const onUpdated = () => fetchCenters();
  const onAdmin = () => setIsAdminLocal(localStorage.getItem("admin") === "true");
    window.addEventListener("centers:updated", onUpdated);
    window.addEventListener("admin:changed", onAdmin);
    return () => {
      window.removeEventListener("centers:updated", onUpdated);
      window.removeEventListener("admin:changed", onAdmin);
    };
  }, [fetchCenters]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((it) => {
      if (category !== "all" && it.category !== category) return false;
      if (!q) return true;
      return (it.name || "").toLowerCase().includes(q) || (it.address || "").toLowerCase().includes(q);
    });
    setFiltered(list);
  }, [items, query, category]);

  const handleSaved = (saved) => {
    window.dispatchEvent(new CustomEvent("centers:updated", { detail: saved }));
    setEditingItem(null);
    setFormOpen(false);
    // show toast AFTER panel closes
    setTimeout(() => {
      setToast({ type: 'success', message: saved?._id ? 'PC Center амжилттай хадгалагдлаа' : 'PC Center амжилттай нэмэгдлээ' });
      // Also broadcast globally for other pages if needed
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'PC Center амжилттай нэмэгдлээ' } }));
    }, 50);
  };

  const handleDelete = async (id) => {
    setConfirm({ open: true, id });
  };

  const confirmDelete = async () => {
    const id = confirm.id;
    setConfirm({ open: false, id: null });
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/api/centers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      window.dispatchEvent(new CustomEvent("centers:updated"));
      setToast({ type: 'info', message: 'PC Center устгагдлаа' });
    } catch (err) {
      console.error("delete:", err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Устгах үед алдаа гарлаа' });
    }
  };

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
            Жагсаалтыг харахын тулд эхлээд нэвтэрнэ үү
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link
              to="/login"
              style={{
                display: "block",
                padding: "14px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                textDecoration: "none",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "15px",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
              }}
            >
              🚀 Нэвтрэх
            </Link>
            <Link
              to="/register"
              style={{
                display: "block",
                padding: "14px",
                background: "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)",
                color: "#667eea",
                textDecoration: "none",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "15px"
              }}
            >
              🎉 Бүртгүүлэх
            </Link>
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
              ← Нүүр хуудас руу буцах
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Free user/owner хязгаарлалт шалгах
  const isOwnerPaid = isCenterOwner && subscription?.plan !== 'free';
  const canAccessList = isAdmin || isPremiumUser || isOwnerPaid;

  // Free user-д upgrade мэдээлэл харуулах
  if (isAuthenticated && !canAccessList) {
    return (
      <div className="page-with-bottom-space">
        <MapHeader />
        <div className="upgrade-required-container">
          <div className="upgrade-card">
            <div className="upgrade-icon">🔒</div>
            <h2>{isCenterOwner ? 'Бизнес план шаардлагатай' : 'Энгийн план шаардлагатай'}</h2>
            <p>
              {isCenterOwner
                ? 'PC төвүүдийн дэлгэрэнгүй мэдээллийг харахын тулд Business төлөвлөгөө сонгоно уу.'
                : 'Төвүүдийн жагсаалтыг харахын тулд Энгийн төлөвлөгөө авах хэрэгтэй.'}
            </p>
            
            <div className="upgrade-features">
              <div className="feature-item">✅ Бүх төв харах</div>
              <div className="feature-item">✅ Дэлгэрэнгүй мэдээлэл</div>
              <div className="feature-item">✅ Ачаалал шалгах</div>
              <div className="feature-item">✅ Дуртай төв нэмэх</div>
            </div>

            <button 
              className="btn-upgrade-main"
              onClick={() => setShowUpgradeModal(true)}
            >
              🚀 Планаа шинэчлэх
            </button>

            <Link to="/map" className="back-to-map">
              ← Map руу буцах
            </Link>
          </div>
        </div>

        {showUpgradeModal && (
          <SubscriptionPlans
            showModal={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="page-with-bottom-space">
      <MapHeader />
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="list-page-container">
        {/* First row: Search bar + Add button */}
        <div className="list-controls-row">
          <ListSearch value={query} onChange={(v) => setQuery(v)} />
          {(isAdmin || isAdminLocal || (isCenterOwner && subscription?.plan !== 'free')) && (
            <button 
              className="btn-modern btn-primary-modern"
              onClick={() => { 
                setEditingItem(null); 
                setFormOpen(true); 
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
              }}
            >
              <span className="btn-icon">➕</span>
              Шинэ төв нэмэх
            </button>
          )}
        </div>

        {/* Second row: Category select */}
        <div className="list-controls-category">
          <select 
            className="category-select"
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">Бүгд</option>
            <option value="shop">Дэлгүүр</option>
            <option value="office">Оффис</option>
            <option value="service">Үйлчилгээ</option>
          </select>
        </div>

        {(isAdmin || isCenterOwner || isAdminLocal) && (
          <AdminForm 
            editingItem={editingItem}
            isOpen={formOpen}
            onSaved={handleSaved}
            onCancel={() => { setFormOpen(false); setEditingItem(null); }}
          />
        )}

        {/* list */}
        <div className="center-list">
          {filtered.map((it, idx) => {
            const id = it._id ?? it.id;
            return (
              <CenterCard
                key={id}
                item={it}
                expanded={expandedIndex === idx}
                onToggle={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                onEdit={() => { setEditingItem(it); setFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                onDelete={handleDelete}
                canEdit={(isAdmin || isAdminLocal) || (isCenterOwner && it.owner && String(it.owner) === String(user?._id))}
              />
            );
          })}
          {filtered.length === 0 && (
            <div style={{ 
              color: "#666", 
              textAlign: "center", 
              padding: "40px 20px",
              fontSize: "15px" 
            }}>
              🔍 Төв олдсонгүй
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        open={confirm.open}
        title="Устгах уу?"
        message="Энэ PC Center-ийг бүр мөсөн устгах гэж байна. Үйлдлийг буцаах боломжгүй."
        confirmText="Тийм, устга"
        cancelText="Болих"
        onConfirm={confirmDelete}
        onCancel={() => setConfirm({ open: false, id: null })}
      />
    </div>
  );
}
