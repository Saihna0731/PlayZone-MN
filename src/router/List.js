import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE } from "../config";
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
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem("admin") === "true");
  const [editingItem, setEditingItem] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);

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
    const onAdmin = () => setIsAdmin(localStorage.getItem("admin") === "true");
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
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <ListSearch value={query} onChange={(v) => setQuery(v)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All</option>
          <option value="shop">Shop</option>
          <option value="office">Office</option>
          <option value="service">Service</option>
        </select>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {isAdmin && <button onClick={() => { setEditingItem(null); window.scrollTo({ top: 0 }); }}>New center</button>}
          {isAdmin && <button onClick={() => setPickerOpen(true)}>Pick on map</button>}
        </div>
      </div>

      {isAdmin && <AdminForm editingItem={editingItem} onSaved={handleSaved} onCancel={() => setEditingItem(null)} />}

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
              onEdit={() => { setEditingItem(it); window.scrollTo({ top: 0 }); }}
              onDelete={handleDelete}
              isAdmin={isAdmin}
            />
          );
        })}
        {filtered.length === 0 && <div style={{ color: "#666" }}>No centers found.</div>}
      </div>

      {pickerOpen && <PickerModal onCancel={() => setPickerOpen(false)} onConfirm={(pos) => { window.dispatchEvent(new CustomEvent("picker:selected", { detail: pos })); setPickerOpen(false); }} />}

      <BottomNav />
    </div>
  );
}
