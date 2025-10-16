import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import { useAuth } from "../contexts/AuthContext";
import MapHeader from "../components/MapHeader";
import ListSearch from "../components/ListSearch";
import BottomNav from "../components/BottomNav";
import AdminForm from "../components/AdminForm";
import CenterCard from "../components/CenterCard";
import PickerModal from "../components/PickerModal";

export default function List() {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const { isAdmin } = useAuth();
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Check if mobile device
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchCenters = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/centers`);
      setItems(res.data || []);
      setFiltered(res.data || []);
    } catch (err) {
      console.error("fetchCenters:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCenters();
    const onUpdated = () => fetchCenters();
    window.addEventListener("centers:updated", onUpdated);
    return () => {
      window.removeEventListener("centers:updated", onUpdated);
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
    setShowAdminForm(false);
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

  return (
    <div>
      <MapHeader />
      
      <div style={{ padding: 16, paddingBottom: 80 }}>
        <div style={{ 
          display: "flex", 
          gap: isMobile ? 6 : 8, 
          alignItems: "stretch", 
          marginBottom: 16,
          flexDirection: isMobile ? "column" : "row",
          width: "100%"
        }}>
          <div style={{ 
            flex: isMobile ? "none" : "1 1 250px", 
            minWidth: isMobile ? "100%" : "180px",
            width: isMobile ? "100%" : "auto"
          }}>
            <ListSearch value={query} onChange={(v) => setQuery(v)} />
          </div>
          
          <div style={{
            display: "flex",
            gap: 6,
            alignItems: "stretch",
            width: isMobile ? "100%" : "auto",
            justifyContent: isMobile ? "space-between" : "flex-start",
            flexWrap: "wrap"
          }}>
          
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #e0e0e0",
              background: "#fff",
              color: "#333",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              minWidth: "100px",
              height: "36px",
              outline: "none",
              transition: "all 0.2s ease",
              flexShrink: 0
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#1976d2";
              e.target.style.boxShadow = "0 0 0 2px rgba(25, 118, 210, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e0e0e0";
              e.target.style.boxShadow = "none";
            }}
          >
            <option value="all">Бүх ангилал</option>
            <option value="shop">Дэлгүүр</option>
            <option value="office">Оффис</option>
            <option value="service">Үйлчилгээ</option>
            <option value="gaming">Тоглоом</option>
            <option value="internet">Интернет кафе</option>
          </select>

            {isAdmin && (
              <button 
                onClick={() => { setEditingItem(null); setShowAdminForm(true); }}
                style={{
                  background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  whiteSpace: 'nowrap',
                  minWidth: '80px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                }}
              >
                + Нэмэх
              </button>
            )}
            {isAdmin && (
              <button 
                onClick={() => setPickerOpen(true)}
                style={{
                  background: 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  whiteSpace: 'nowrap',
                  minWidth: '80px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                }}
              >
                📍 Сонгох
              </button>
            )}
          </div>
        </div>

        {/* Modal-based AdminForm */}
        {isAdmin && (
          <AdminForm 
            isOpen={showAdminForm}
            editingItem={editingItem} 
            onSaved={handleSaved} 
            onCancel={() => { setEditingItem(null); setShowAdminForm(false); }} 
          />
        )}

        {/* Results header */}
        {items.length > 0 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            padding: "0 4px"
          }}>
            <div style={{ 
              color: "#555", 
              fontSize: "14px",
              fontWeight: "500"
            }}>
              {filtered.length > 0 ? (
                <>
                  <span style={{ color: "#1976d2", fontWeight: "600" }}>{filtered.length}</span> төв олдлоо
                  {query && (
                    <span style={{ color: "#666", marginLeft: "8px" }}>
                      "{query}" хайлтаар
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: "#f44336" }}>Хайлтын үр дүн олдсонгүй</span>
              )}
            </div>
            {category !== "all" && (
              <span style={{ 
                background: "#e3f2fd", 
                color: "#1976d2", 
                padding: "4px 8px", 
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "500"
              }}>
                {category}
              </span>
            )}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px",
            color: "#666"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              border: "3px solid #f3f3f3",
              borderTop: "3px solid #1976d2",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}></div>
            <h3 style={{ color: "#333", marginBottom: "8px", fontSize: "18px" }}>Ачааллаж байна...</h3>
            <p style={{ margin: 0, fontSize: "14px" }}>
              Төвүүдийн мэдээллийг татаж байна
            </p>
          </div>
        )}

        {/* list */}
        {!loading && (
        <div className="center-list">
          {filtered.map((it, idx) => {
            const id = it._id ?? it.id;
            return (
              <CenterCard
                key={id}
                item={it}
                onEdit={() => { setEditingItem(it); setShowAdminForm(true); }}
                onDelete={handleDelete}
                isAdmin={isAdmin}
              />
            );
          })}
        </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && items.length > 0 && (
          <div style={{ 
            textAlign: "center", 
            padding: "40px 20px",
            color: "#666"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <h3 style={{ color: "#333", marginBottom: "8px", fontSize: "18px" }}>Хайлтын үр дүн олдсонгүй</h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "14px" }}>
              "{query || category}" хайлтаар төв олдсонгүй
            </p>
            <button
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
              style={{
                background: "#1976d2",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Бүх төвийг харах
            </button>
          </div>
        )}

        {/* Initial empty state */}
        {!loading && items.length === 0 && (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px",
            color: "#666"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏢</div>
            <h3 style={{ color: "#333", marginBottom: "8px" }}>Төв байхгүй байна</h3>
            <p style={{ margin: 0, fontSize: "14px" }}>
              Одоогоор төв бүртгэгдээгүй байна
            </p>
          </div>
        )}

        {pickerOpen && <PickerModal onCancel={() => setPickerOpen(false)} onConfirm={(pos) => { window.dispatchEvent(new CustomEvent("picker:selected", { detail: pos })); setPickerOpen(false); }} />}
      </div>

      <BottomNav />
    </div>
  );
}
