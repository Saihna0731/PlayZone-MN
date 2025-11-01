import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../config";
import { useAuth } from "../contexts/AuthContext";
import ListSearch from "../components/ListComponents/ListSearch";
import MapHeader from "../components/MapComponents/MapHeader";
import AdminForm from "../admin/components/AdminForm";
import CenterCard from "../components/ListComponents/CenterCard";
import "../styles/List.css";

export default function List() {
  const { isAuthenticated, isAdmin, isCenterOwner } = useAuth();
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isAdminLocal, setIsAdminLocal] = useState(localStorage.getItem("admin") === "true");
  const [editingItem, setEditingItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

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
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Устгах уу?")) return;
    try {
      await axios.delete(`${API_BASE}/api/centers/${id}`);
      window.dispatchEvent(new CustomEvent("centers:updated"));
    } catch (err) {
      console.error("delete:", err);
      alert("Delete failed");
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

  return (
    <div className="page-with-bottom-space">
      <MapHeader />
      <div className="list-page-container">
        {/* First row: Search bar + Add button */}
        <div className="list-controls-row">
          <ListSearch value={query} onChange={(v) => setQuery(v)} />
          {(isAdmin || isCenterOwner || isAdminLocal) && (
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
                isAdmin={isAdmin || isCenterOwner || isAdminLocal}
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
    </div>
  );
}
