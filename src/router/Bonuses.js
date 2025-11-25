import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import MapHeader from '../components/MapComponents/MapHeader';
import BonusCard from '../components/ListComponents/BonusCard';
import '../styles/List.css';

/*
  Bonuses Page
  - Aggregates ALL bonuses from Business Pro centers
  - Sorting: newest bonus first
  - Filters: search by center name or bonus title
*/
export default function Bonuses() {
  const [centers, setCenters] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const res = await axios.get(`${API_BASE}/api/centers`);
        setCenters(res.data || []);
      } catch (e) {
        setError(e.response?.data?.error || e.message);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  // Filter Business Pro centers with bonus
  const bonusCenters = useMemo(() => {
    return centers.filter(c => {
      const ownerPlan = c?.owner?.subscription?.plan || c?.subscription?.plan || '';
      const normalized = ownerPlan.toLowerCase().replace(/[-_\s]+/g,'_');
      return Array.isArray(c.bonus) && c.bonus.length && normalized === 'business_pro';
    });
  }, [centers]);

  // Flatten bonuses with reference to center for sorting
  const flattened = useMemo(() => {
    const list = [];
    bonusCenters.forEach(center => {
      (center.bonus || []).forEach(b => {
        list.push({ center, bonus: b });
      });
    });
    // newest bonus first
    return list.sort((a,b) => new Date(b.bonus.createdAt) - new Date(a.bonus.createdAt));
  }, [bonusCenters]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flattened;
    return flattened.filter(item => {
      return (item.center.name || '').toLowerCase().includes(q) || (item.bonus.title || '').toLowerCase().includes(q);
    });
  }, [flattened, query]);

  const getPrimaryImage = (center) => {
    if (center?.images && Array.isArray(center.images) && center.images.length > 0) {
      const img = center.images[0];
      if (typeof img === 'string') return img;
      if (typeof img === 'object') return img.highQuality || img.thumbnail || img.url || img.src;
    }
    if (center?.logo) return center.logo;
    return '/logo192.png';
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{
        background: "#ffffff",
        padding: "20px",
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            padding: "4px"
          }}>←</button>
          <h1 style={{
            margin: "0",
            fontSize: "20px",
            fontWeight: "700",
            color: "#1f2937"
          }}>Popular Event 🔥</h1>
        </div>
        <button style={{
          background: "none",
          border: "none",
          fontSize: "18px",
          cursor: "pointer",
          padding: "4px"
        }}>🔍</button>
      </div>

      {/* Search Bar */}
      <div style={{ padding: "20px 20px", background: "#ffffff" }}>
        <div style={{ position: "relative", width: "100%" }}>
          <div style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9ca3af",
            pointerEvents: "none"
          }}>
            🔍
          </div>
          <input
            type="text"
            placeholder="Төв хайх..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 44px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              fontSize: "14px",
              fontWeight: "500",
              background: "#f8f9fa",
              outline: "none"
            }}
          />
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>
          Loading...
        </div>
      )}
      
      {error && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#ef4444" }}>
          {error}
        </div>
      )}
      
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <p style={{ margin: "0", fontSize: "16px", fontWeight: "500" }}>
            Бонус олдсонгүй
          </p>
        </div>
      )}

      {/* Bonus Cards Grid */}
      <div style={{ padding: "0 20px 20px 20px", background: "#ffffff" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "16px",
          marginTop: "8px"
        }}>
          {filtered.map(({ center, bonus }) => {
            const primaryImage = getPrimaryImage(center);
            const createdDate = bonus.createdAt ? new Date(bonus.createdAt) : new Date();
            const dateStr = createdDate.toLocaleDateString('mn-MN', { 
              month: 'short', 
              day: '2-digit' 
            });
            const timeStr = createdDate.toLocaleTimeString('mn-MN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            
            return (
              <div
                key={`${center._id}-${bonus._id || bonus.title}`}
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  background: "#ffffff",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: "1px solid #f0f0f0"
                }}
                onClick={() => window.location.href = `/center/${center._id}`}
                onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
              >
                {/* Image container with FREE badge */}
                <div style={{
                  position: "relative",
                  height: "100px",
                  background: `url(${primaryImage}) center/cover`,
                  borderRadius: "16px 16px 0 0",
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}>
                  {/* FREE Badge */}
                  <div style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    background: "linear-gradient(135deg, #8B5CF6, #A855F7)",
                    color: "#ffffff",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "10px",
                    fontWeight: "700",
                    textTransform: "uppercase"
                  }}>
                    FREE
                  </div>
                  
                  {/* Heart icon */}
                  <div style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "24px",
                    height: "24px",
                    background: "rgba(0,0,0,0.5)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "12px"
                  }}>
                    ♡
                  </div>
                </div>

                {/* Card content */}
                <div style={{ padding: "12px 14px 14px 14px" }}>
                  <h3 style={{
                    margin: "0 0 4px 0",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#1f2937",
                    lineHeight: "1.2"
                  }}>
                    {bonus.title || center.name}
                  </h3>
                  
                  <div style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    <span>📅</span>
                    {dateStr}, {timeStr}
                  </div>
                  
                  <div style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    <span>📍</span>
                    {center.address || center.name}
                    <span style={{
                      marginLeft: "auto",
                      color: "#ef4444"
                    }}>♡</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
