import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import AdminForm from "../admin/components/AdminForm";
import CenterCard from "../components/ListComponents/CenterCard";
import ConfirmModal from "../components/LittleComponents/ConfirmModal";
import BottomNav from "../components/MainNavbars/BottomNav";
import { API_BASE } from "../config";

// OccupancyModal - Ачаалал шинэчлэх modal (percentage-based: 0-100%)
function OccupancyModal({ center, isOpen, onClose, onUpdate }) {
  // Occupancy нь percentage хэлбэрээр хадгалагдана (0-100)
  const [localOccupancy, setLocalOccupancy] = useState({
    standard: 0,
    vip: 0,
    stage: 0
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (center && isOpen) {
      // Backend-ээс ирсэн occupancy нь шууд percentage (Number)
      setLocalOccupancy({
        standard: center.occupancy?.standard || 0,
        vip: center.occupancy?.vip || 0,
        stage: center.occupancy?.stage || 0
      });
    }
  }, [center, isOpen]);

  if (!isOpen || !center) return null;

  const getOccupancyColor = (percentage) => {
    if (percentage >= 90) return "#ef4444"; // red
    if (percentage >= 70) return "#f59e0b"; // yellow
    if (percentage >= 50) return "#3b82f6"; // blue
    return "#22c55e"; // green
  };

  const handleSliderChange = (type, value) => {
    setLocalOccupancy(prev => ({
      ...prev,
      [type]: parseInt(value)
    }));
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(center._id, localOccupancy);
      onClose();
    } catch (error) {
      console.error("Occupancy update failed:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderSlider = (type, label, emoji) => {
    const percentage = localOccupancy[type] || 0;
    const color = getOccupancyColor(percentage);

    return (
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "14px", fontWeight: "700", color: "#374151", display: "flex", alignItems: "center", gap: "6px" }}>
            {emoji} {label}
          </span>
          <span style={{ 
            fontSize: "13px", 
            fontWeight: "800", 
            color: color,
            background: `${color}20`,
            padding: "4px 10px",
            borderRadius: "8px"
          }}>
            {percentage}%
          </span>
        </div>
        <div style={{ position: "relative" }}>
          <input
            type="range"
            min="0"
            max="100"
            value={percentage}
            onChange={(e) => handleSliderChange(type, e.target.value)}
            style={{
              width: "100%",
              height: "8px",
              borderRadius: "4px",
              appearance: "none",
              background: `linear-gradient(to right, ${color} ${percentage}%, #e5e7eb ${percentage}%)`,
              cursor: "pointer",
              outline: "none"
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>0%</span>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>100%</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px",
      backdropFilter: "blur(4px)"
    }}>
      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "24px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        animation: "slideUp 0.3s ease"
      }}>
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            background: white;
            border: 3px solid currentColor;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          }
        `}</style>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#1f2937" }}>
              📊 Ачаалал шинэчлэх
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#6b7280" }}>
              {center.name}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f3f4f6",
              border: "none",
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              fontSize: "16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: "20px" }}>
          {renderSlider("standard", "Заал (Стандарт)", "🖥️")}
          {renderSlider("vip", "VIP", "⭐")}
          {renderSlider("stage", "Stage", "🎮")}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "14px",
              background: "#f3f4f6",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "700",
              color: "#374151",
              cursor: "pointer"
            }}
          >
            Болих
          </button>
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            style={{
              flex: 1,
              padding: "14px",
              background: isUpdating 
                ? "#9ca3af" 
                : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "700",
              color: "white",
              cursor: isUpdating ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
            }}
          >
            {isUpdating ? "🔄 Хадгалж байна..." : "✓ Хадгалах"}
          </button>
        </div>
      </div>
    </div>
  );
}

// AddBonusModal - Бонус нэмэх
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
      const res = await axios.post(`${API_BASE}/api/centers/${center._id}/bonus`, payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      onAdded?.(res.data);
      setForm({ title: '', text: '', standardFree: '', vipFree: '', stageFree: '' });
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

// BonusManageModal - Бонус засах/устгах
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
  
  const cancelEdit = () => { 
    setEditingId(null); 
    setForm({ title:'', text:'', standardFree:'', vipFree:'', stageFree:'' }); 
  };
  
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
      const res = await axios.put(`${API_BASE}/api/centers/${center._id}/bonus/${editingId}`, payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
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
      const res = await axios.delete(`${API_BASE}/api/centers/${center._id}/bonus/${bid}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.data?.success) {
        onUpdated?.(res.data.center);
        window.dispatchEvent(new CustomEvent('toast', { detail: { type:'info', message:'Бонус амжилттай устлаа' } }));
        if (editingId === bid) cancelEdit();
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
        <div style={{ display:'flex', flexDirection:'column', gap:12, maxHeight: '400px', overflowY: 'auto' }}>
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
                    <button onClick={cancelEdit} style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #e5e7eb', background:'#f8fafc', fontWeight:700, fontSize:12, cursor:'pointer' }}>Болих</button>
                    <button disabled={saving} onClick={doSave} style={btnPrimary}>{saving ? '🔄 Хадгалж байна...' : '✅ Хадгалах'}</button>
                  </div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontWeight:800 }}>{b.title || 'Бонус'}</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => startEdit(b)} style={{ padding:'6px 10px', borderRadius:10, border:'1px solid #e5e7eb', background:'#f8fafc', fontSize:12, fontWeight:700, cursor:'pointer' }}>Засах</button>
                      <button onClick={() => doDelete(b._id)} disabled={deleting === b._id} style={{ padding:'6px 10px', borderRadius:10, background:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff', border:'none', fontSize:12, fontWeight:800, cursor:'pointer' }}>{deleting === b._id ? 'Устгаж...' : 'Устгах'}</button>
                    </div>
                  </div>
                  {b.text && <div style={{ fontSize:13, color:'#475569' }}>{b.text}</div>}
                  {(b.standardFree || b.vipFree || b.stageFree) && (
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {b.standardFree ? <span style={badgeStyle('#3b82f6')}>STD {b.standardFree}</span> : null}
                      {b.vipFree ? <span style={badgeStyle('#eab308')}>VIP {b.vipFree}</span> : null}
                      {b.stageFree ? <span style={badgeStyle('#22c55e')}>STG {b.stageFree}</span> : null}
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

// Styles
const inputStyle = { width:'100%', padding:'10px 14px', border:'2px solid #e5e7eb', borderRadius:12, fontSize:13, fontWeight:600, outline:'none', boxSizing:'border-box' };
const btnPrimary = { padding:'12px 18px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontSize:14, boxShadow:'0 4px 14px rgba(99,102,241,.35)' };
const badgeStyle = (color) => ({
  fontSize: '11px',
  fontWeight: '700',
  padding: '3px 8px',
  borderRadius: '6px',
  background: `${color}20`,
  color: color
});

export default function GameCenterControl() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { subscription, isActive: hasActiveSubscription, plan, maxCenters: hookMaxCenters } = useSubscription();
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editCenter, setEditCenter] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); // Search state
  
  // Check max centers allowed - Trial = Business Standard (1 төв)
  const normalizedPlan = (plan || '').toLowerCase();
  const isTrial = normalizedPlan === 'trial' || normalizedPlan.includes('trial');
  const maxCenters = subscription?.maxCenters || hookMaxCenters || (isTrial || normalizedPlan === 'business_standard' ? 1 : normalizedPlan === 'business_pro' ? 3 : 0);
  const safeCenters = Array.isArray(centers) ? centers : [];
  const canAddMore = (hasActiveSubscription || isTrial) && safeCenters.length < maxCenters;
  
  // Occupancy Modal state
  const [occupancyModal, setOccupancyModal] = useState({ open: false, center: null });
  
  // Bonus Modal states
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [bonusModalCenter, setBonusModalCenter] = useState(null);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [manageModalCenter, setManageModalCenter] = useState(null);
  const [bonusManageMode, setBonusManageMode] = useState('edit');
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Check if user is center owner or admin
  const isCenterOwner = user?.accountType === 'centerOwner' || user?.role === 'centerOwner';
  const hasAccess = isCenterOwner || isAdmin;

  // Filter centers by search query
  const filteredCenters = safeCenters.filter(center => 
    center.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    center.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    center.owner?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchCenters = useCallback(async () => {
    if (!user || !hasAccess) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Admin gets all centers, owners get only their own
      const endpoint = isAdmin ? `${API_BASE}/api/centers` : `${API_BASE}/api/centers/my-centers`;
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // API хариу нь array эсвэл object.centers байж болно
      const data = res.data;
      if (Array.isArray(data)) {
        setCenters(data);
      } else if (data && Array.isArray(data.centers)) {
        setCenters(data.centers);
      } else {
        setCenters([]);
      }
    } catch (error) {
      console.error("Error fetching centers:", error);
      setCenters([]);
    } finally {
      setLoading(false);
    }
  }, [user, hasAccess, isAdmin]);

  useEffect(() => {
    fetchCenters();

    // Listen for center updates
    const handleCenterUpdate = () => fetchCenters();
    window.addEventListener('centers:updated', handleCenterUpdate);
    return () => window.removeEventListener('centers:updated', handleCenterUpdate);
  }, [fetchCenters]);

  // Update occupancy
  const updateOccupancy = async (centerId, occupancyData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE}/api/centers/${centerId}/occupancy`,
        { occupancy: occupancyData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'success', message: 'Ачаалал амжилттай шинэчлэгдлээ!' } 
      }));
      fetchCenters();
    } catch (error) {
      console.error("Occupancy update error:", error);
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'error', message: 'Ачаалал шинэчлэхэд алдаа гарлаа' } 
      }));
      throw error;
    }
  };

  // Edit center
  const handleEdit = (center) => {
    setEditCenter(center);
    setShowAddForm(false);
  };

  // Delete center
  const handleDelete = (center) => {
    setDeleteTarget(center);
    setDeleteConfirm({ open: true });
  };

  const confirmDeleteCenter = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/api/centers/${deleteTarget._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCenters(prev => prev.filter(c => c._id !== deleteTarget._id));
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'success', message: 'Төв амжилттай устгагдлаа!' } 
      }));
      setDeleteConfirm({ open: false });
      setDeleteTarget(null);
    } catch (error) {
      console.error("Delete error:", error);
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'error', message: error.response?.data?.error || 'Устгахад алдаа гарлаа' } 
      }));
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDeleteCenter = () => {
    setDeleteConfirm({ open: false });
    setDeleteTarget(null);
  };

  // After saving center
  const handleSaved = (savedCenter) => {
    if (editCenter) {
      setCenters(prev => prev.map(c => c._id === savedCenter._id ? savedCenter : c));
    } else {
      setCenters(prev => [...prev, savedCenter]);
    }
    setEditCenter(null);
    setShowAddForm(false);
    window.dispatchEvent(new Event('centers:updated'));
  };

  // Update centers after bonus change
  const handleCenterUpdated = (updatedCenter) => {
    if (updatedCenter?._id) {
      setCenters(prev => prev.map(c => c._id === updatedCenter._id ? updatedCenter : c));
    }
  };

  // Non-owner/non-admin redirect
  if (!hasAccess && !loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}>
        <div style={{
          background: "white",
          borderRadius: "20px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)"
        }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🔒</div>
          <h2 style={{ margin: "0 0 12px 0", color: "#1f2937", fontSize: "20px" }}>
            Хандах эрхгүй байна
          </h2>
          <p style={{ color: "#6b7280", margin: "0 0 24px 0", fontSize: "14px" }}>
            Энэ хуудас зөвхөн Game Center эзэмшигчдэд зориулагдсан
          </p>
          <button
            onClick={() => navigate('/profile')}
            style={{
              padding: "14px 28px",
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            Профайл руу буцах
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      paddingBottom: "100px"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        padding: "20px",
        paddingTop: "env(safe-area-inset-top, 20px)",
        color: "white"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
          <button
            onClick={() => navigate('/profile')}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              color: "white",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ←
          </button>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
            🎮 {isAdmin ? 'Admin Control Panel' : 'Game Center Control'}
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: "13px", opacity: 0.9, marginLeft: "48px" }}>
          {isAdmin ? 'Бүх төвүүдийг удирдах' : 'Төвүүдээ нэмэх, засах, удирдах'}
        </p>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Search Bar - Everyone */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'white',
            borderRadius: '12px',
            padding: '12px 16px',
            border: '2px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <span style={{ fontSize: '18px' }}>🔍</span>
            <input
              type="text"
              placeholder="Төвийн нэр, хаягаар хайх..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#6b7280'
                }}
              >
                ✕
              </button>
            )}
          </div>
          {isAdmin && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
              Нийт {filteredCenters.length} / {centers.length} төв
            </div>
          )}
        </div>
        {/* Subscription Warning */}
        {subscriptionMessage && (
          <div style={{
            background: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>{subscriptionMessage}</div>
              <button
                onClick={() => navigate('/profile')}
                style={{
                  padding: '8px 16px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                💎 Эрх шинэчлэх
              </button>
            </div>
            <button onClick={() => setSubscriptionMessage(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#92400e' }}>✕</button>
          </div>
        )}

        {/* Add/Edit Form */}
        {(showAddForm || editCenter) && (
          <div style={{ marginBottom: "20px" }}>
            <AdminForm
              editingItem={editCenter}
              isOpen={true}
              onCancel={() => { setEditCenter(null); setShowAddForm(false); }}
              onSaved={handleSaved}
            />
          </div>
        )}

        {/* Add New Center Button - For owners and admin */}
        {!showAddForm && !editCenter && (
          <button
            onClick={() => {
              // Admin-д хязгаарлалт байхгүй
              if (!isAdmin) {
                if (!hasActiveSubscription && !isTrial) {
                  setSubscriptionMessage('Таны эрх дууссан байна. Шинэ төв нэмэхийн тулд эрхээ сунгана уу.');
                  return;
                }
                if (centers.length >= maxCenters) {
                  setSubscriptionMessage(`Таны эрхээр хамгийн ихдээ ${maxCenters} төв нэмэх боломжтой. Илүү төв нэмэхийн тулд эрхээ шинэчлээрэй.`);
                  return;
                }
              }
              setShowAddForm(true);
            }}
            style={{
              width: "100%",
              padding: "16px",
              background: (isAdmin || canAddMore)
                ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" 
                : "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
              border: "none",
              borderRadius: "16px",
              color: "white",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "20px",
              boxShadow: (isAdmin || canAddMore) ? "0 4px 16px rgba(34, 197, 94, 0.3)" : "none"
            }}
          >
            ➕ Шинэ төв нэмэх {!isAdmin && `(${centers.length}/${maxCenters})`}
          </button>
        )}

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏳</div>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>Ачааллаж байна...</p>
          </div>
        ) : (
          <>
            {/* Centers List */}
            <h2 style={{ 
              fontSize: "16px", 
              fontWeight: "800", 
              color: "#1f2937", 
              margin: "0 0 16px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              🏢 {isAdmin ? 'Бүх төвүүд' : 'Миний төвүүд'} ({filteredCenters.length})
            </h2>

            {filteredCenters.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredCenters.map((center) => (
                  <div key={center._id} style={{ position: "relative" }}>
                    <CenterCard 
                      center={center} 
                      showDistance={false}
                      onEdit={() => handleEdit(center)}
                      onDelete={(id) => handleDelete(center)}
                    />
                    
                    {/* Action Buttons */}
                    <div style={{
                      display: "flex",
                      gap: "8px",
                      padding: "12px",
                      background: "#f8fafc",
                      borderRadius: "0 0 16px 16px",
                      marginTop: "-8px",
                      flexWrap: "wrap"
                    }}>
                      <button
                        onClick={() => setOccupancyModal({ open: true, center })}
                        style={{
                          flex: "1 1 calc(50% - 4px)",
                          padding: "10px 12px",
                          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                          border: "none",
                          borderRadius: "10px",
                          color: "white",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px"
                        }}
                      >
                        📊 Ачаалал
                      </button>
                      
                      <button
                        onClick={() => {
                          setBonusModalCenter(center);
                          setBonusModalOpen(true);
                        }}
                        style={{
                          flex: "1 1 calc(50% - 4px)",
                          padding: "10px 12px",
                          background: "linear-gradient(135deg, #f59e0b, #d97706)",
                          border: "none",
                          borderRadius: "10px",
                          color: "white",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px"
                        }}
                      >
                        🎁 Бонус(Шинэ бонус нэмэх)
                      </button>
                      
                      <button
                        onClick={() => {
                          setManageModalCenter(center);
                          setBonusManageMode('edit');
                          setManageModalOpen(true);
                        }}
                        style={{
                          flex: "1 1 calc(50% - 4px)",
                          padding: "10px 12px",
                          background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                          border: "none",
                          borderRadius: "10px",
                          color: "white",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px"
                        }}
                      >
                        🎛️ Бонус засах
                      </button>
                      
                      <button
                        onClick={() => handleEdit(center)}
                        style={{
                          flex: "1 1 calc(25% - 6px)",
                          padding: "10px 12px",
                          background: "#e0e7ff",
                          border: "none",
                          borderRadius: "10px",
                          color: "#4338ca",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px"
                        }}
                      >
                        ✏️ Засах(Төвийн мэдээллийг засах)
                      </button>
                      
                      <button
                        onClick={() => handleDelete(center)}
                        style={{
                          flex: "1 1 calc(25% - 6px)",
                          padding: "10px 12px",
                          background: "#fee2e2",
                          border: "none",
                          borderRadius: "10px",
                          color: "#dc2626",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px"
                        }}
                      >
                        🗑️ Устгах(Төвийг устгах)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
                padding: "40px 20px",
                borderRadius: "20px",
                textAlign: "center",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                border: "2px solid #818cf8"
              }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏢</div>
                <h3 style={{
                  margin: "0 0 8px 0",
                  color: "#3730a3",
                  fontSize: "18px",
                  fontWeight: "700"
                }}>
                  Төв бүртгэгдээгүй байна
                </h3>
                <p style={{ 
                  color: "#4338ca", 
                  margin: "0 0 20px 0", 
                  fontSize: "14px",
                  lineHeight: "1.6"
                }}>
                  Дээрх "Шинэ төв нэмэх" товчийг дарж Gaming төвөө бүртгүүлээрэй
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <OccupancyModal
        center={occupancyModal.center}
        isOpen={occupancyModal.open}
        onClose={() => setOccupancyModal({ open: false, center: null })}
        onUpdate={updateOccupancy}
      />

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

      <AddBonusModal
        center={bonusModalCenter}
        isOpen={bonusModalOpen}
        onClose={() => { setBonusModalOpen(false); setBonusModalCenter(null); }}
        onAdded={handleCenterUpdated}
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
        onUpdated={handleCenterUpdated}
      />

      <BottomNav />
    </div>
  );
}
