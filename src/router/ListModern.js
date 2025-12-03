import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../config";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import BottomNav from "../components/MainNavbars/BottomNav";
import "../styles/List.css";
import "../styles/ListModern.css";

export default function ListModern() {
  const { isAuthenticated } = useAuth();
  const { canViewDetails, loading: subLoading } = useSubscription();
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [favorites, setFavorites] = useState(new Set());
  const [activeTab, setActiveTab] = useState("normal");
  const navigate = useNavigate();

  const fetchCenters = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/centers`);
      const centers = Array.isArray(res.data?.centers)
        ? res.data.centers
        : Array.isArray(res.data)
        ? res.data
        : [];
      setItems(centers);
      setFiltered(centers);
    } catch (err) {
      console.error("fetchCenters:", err);
    }
  }, []);

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  const normalizeCategoryId = (raw) => {
    const val = (raw || "").toString().trim().toLowerCase();
    if (!val) return "unknown";
    if (/(^|\b)(pc|pc gaming|computer|desktop)(\b|$)/i.test(val)) return "PcGaming";
    if (/(^|\b)(ps|playstation)(\b|$)/i.test(val)) return "Ps";
    if (/(^|\b)(billiard|billard|pool)(\b|$)/i.test(val)) return "Billard";
    if (/(^|\b)(game\s*center|gamecenter|gaming)(\b|$)/i.test(val)) return "GameCenter";
    return raw;
  };

  useEffect(() => {
    const q = query.trim().toLowerCase();
    const base = Array.isArray(items) ? items : [];
    const list = base.filter((it) => {
      const itCat = normalizeCategoryId(it.category);
      if (category !== "all" && itCat !== category) return false;
      if (!q) return true;
      const name = (it.name || "").toLowerCase();
      const addr = (it.address || "").toLowerCase();
      const facilities = Array.isArray(it.facilities)
        ? it.facilities.join(" ").toLowerCase()
        : (it.facilities || "").toString().toLowerCase();
      return name.includes(q) || addr.includes(q) || facilities.includes(q);
    });
    setFiltered(list);
  }, [items, query, category]);

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

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
          </div>
        </div>
      </div>
    );
  }

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
            🎅 Loading Christmas Centers... 🎁
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
      </div>
    );
  }

  if (!canViewDetails) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3f4f6",
        padding: "20px"
      }}>
        <div style={{
          maxWidth: "400px",
          width: "100%",
          background: "#ffffff",
          borderRadius: "20px",
          padding: "40px 32px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
        }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🔒</div>
          <h2 style={{ margin: "0 0 12px 0", fontSize: "24px", color: "#333" }}>
            Эрх дэмжлэг хэрэгтэй
          </h2>
          <p style={{ margin: "0 0 24px 0", color: "#666", fontSize: "15px", lineHeight: "1.6" }}>
            Жагсаалтыг харахын тулд эрх идэвхжүүлэх шаардлагатай
          </p>
          <button
            onClick={() => navigate('/profile')}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #8B5CF6, #A855F7)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontWeight: "700",
              fontSize: "15px",
              cursor: "pointer"
            }}
          >
            ⚡ Эрх идэвхжүүлэх
          </button>
        </div>
      </div>
    );
  }

  // Helper functions
  const safeFiltered = Array.isArray(filtered) ? filtered : [];
  const isBusinessPro = (it) => {
    const ownerPlan = it?.owner?.subscription?.plan || it?.subscription?.plan || '';
    const normalized = ownerPlan.toLowerCase().replace(/[-_\s]+/g,'_');
    return normalized === 'business_pro';
  };
  const hasBonus = (it) => Array.isArray(it.bonus) && it.bonus.length > 0;
  
  // Бүх bonus-тай төвийг харуулах (subscription шалгалтгүй)
  const bonusCenters = safeFiltered.filter(it => hasBonus(it));
  const specialCenters = safeFiltered.filter(it => isBusinessPro(it));
  const regularCenters = safeFiltered.filter(it => !isBusinessPro(it));

  const normalizeImageSource = (img) => {
    if (!img) return null;
    if (typeof img === 'string') return img;
    if (typeof img === 'object') {
      return img.highQuality || img.thumbnail || img.url || img.src || null;
    }
    return null;
  };

  const getCenterImages = (center) => {
    if (!Array.isArray(center?.images)) return [];
    return center.images
      .map(normalizeImageSource)
      .filter((src, index, arr) => Boolean(src) && arr.indexOf(src) === index);
  };

  const getAllImages = (center) => {
    const imgs = getCenterImages(center);
    return imgs.length > 0 ? imgs : ['/logo192.png'];
  };

  return (
    <div className="list-page-container">
      {/* Location Header */}
      <div style={{
        background: "#ffffff",
        padding: "20px",
        borderBottom: "1px solid #f0f0f0"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px"
        }}>
          <div>
            <div style={{
              fontSize: "14px",
              color: "#6b7280",
              fontWeight: "500",
              marginBottom: "4px"
            }}>
              Location
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "16px",
              fontWeight: "700",
              color: "#1f2937"
            }}>
              📍 Ulaanbaatar, Mongolia
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
          </div>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}>
            🔔
          </div>
        </div>

        {/* Search Bar */}
        <div style={{
          position: "relative",
          marginBottom: "16px"
        }}>
          <input
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 48px",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              fontSize: "15px",
              outline: "none",
              background: "#f9fafb",
              boxSizing: "border-box"
            }}
          />
          <div style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#6b7280",
            fontSize: "18px"
          }}>
            🔍
          </div>
          <div style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "32px",
            height: "32px",
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}>
            🔍
          </div>
        </div>

        {/* Category Pills */}
        <div style={{
          display: "flex",
          gap: "16px",
          overflowX: "auto",
          paddingBottom: "4px"
        }}>
          {[
            { id: 'all', name: '🎮 Gaming Center', icon: '🎮' },
            { id: 'PcGaming', name: '💻 PC Gaming', icon: '💻' },
            { id: 'Billard', name: '🎱 Billiard', icon: '🎱' },
            { id: 'Ps', name: '🎯 PlayStation', icon: '🎯' }
          ].map(cat => (
            <div
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                padding: "0",
                cursor: "pointer",
                flex: "0 0 auto"
              }}
            >
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: category === cat.id ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                transition: "all 0.2s"
              }}>
                {cat.icon}
              </div>
              <span style={{
                fontSize: "12px",
                fontWeight: "600",
                color: category === cat.id ? "#3b82f6" : "#6b7280",
                textAlign: "center"
              }}>
                {cat.name.replace(/^[^\s]*\s/, '')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Special centers - VIP Centers */}
      <div style={{ background: "#ffffff", marginTop: "8px" }}>
        <div style={{
          padding: "0 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px"
        }}>
          <h2 style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: "700",
            color: "#1f2937"
          }}>Special centers ({specialCenters.length})</h2>
          <button style={{
            background: "none",
            border: "none",
            color: "#3b82f6",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer"
          }}>
            See all
          </button>
        </div>

        {/* Horizontal Scrolling VIP Cards */}
        <div style={{
          padding: "0 0 20px 0"
        }}>
          <div style={{
            display: "flex",
            gap: "16px",
            overflowX: "auto",
            paddingLeft: "20px",
            paddingRight: "20px",
            scrollbarWidth: "none",
            msOverflowStyle: "none"
          }}>
            {specialCenters.slice(0, 5).map((center, index) => (
              <div
                key={center._id || center.id}
                onClick={() => navigate(`/center/${center._id || center.id}`)}
                style={{
                  position: "relative",
                  width: "280px",
                  height: "200px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${getAllImages(center)[0]})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "16px",
                  cursor: "pointer",
                  flexShrink: 0
                }}
              >
                <div style={{
                  position: "absolute",
                  top: "16px",
                  left: "16px",
                  background: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  📞 {center.phone || "99887766"}
                </div>
                <div
                  onClick={(e) => toggleFavorite(center._id || center.id, e)}
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer"
                  }}
                >
                  {favorites.has(center._id || center.id) ? "❤️" : "♡"}
                </div>
                <div style={{
                  marginTop: "auto",
                  color: "#fff"
                }}>
                  <h3 style={{
                    margin: "0 0 8px 0",
                    fontSize: "20px",
                    fontWeight: "700"
                  }}>
                    {center.name}
                  </h3>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <div>
                      <div style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        ⭐ {center.rating || 4.8}
                      </div>
                    </div>
                    <div style={{
                      textAlign: "right"
                    }}>
                      <div style={{
                        fontSize: "18px",
                        fontWeight: "700"
                      }}>
                        {center.pricing?.standard 
                          ? `${parseInt(center.pricing.standard).toLocaleString()}₮/цаг`
                          : "5000₮/цаг"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular for me - Tab Navigation */}
      <div style={{ background: "#ffffff", marginTop: "8px" }}>
        <div style={{
          padding: "20px 20px 0 20px"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px"
          }}>
            <h2 style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: "700",
              color: "#1f2937"
            }}>Popular for me ({regularCenters.length})</h2>
            <button style={{
              background: "none",
              border: "none",
              color: "#3b82f6",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer"
            }}>
              See all
            </button>
          </div>
          
          <div style={{
            display: "flex",
            gap: "0",
            marginBottom: "16px",
            borderBottom: "1px solid #f0f0f0"
          }}>
            {[
              { id: "normal", label: `Normal centers (${regularCenters.length})` },
              { id: "bonus", label: `Bonus (${bonusCenters.length})` },
              { id: "booking", label: "Захиалга" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "none",
                  background: "transparent",
                  color: activeTab === tab.id ? "#3b82f6" : "#6b7280",
                  fontWeight: activeTab === tab.id ? "700" : "500",
                  fontSize: "14px",
                  cursor: "pointer",
                  borderBottom: activeTab === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
                  transition: "all 0.2s"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "normal" && (
          <div style={{ padding: "0 20px 20px 20px", background: "#ffffff" }}>
            <div className="normal-centers-grid">
              {regularCenters.slice(0, 6).map(center => (
                <div
                  key={center._id || center.id}
                  onClick={() => navigate(`/center/${center._id || center.id}`)}
                  className="normal-center-card"
                >
                  <div className="normal-card-image" style={{
                    background: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url(${getAllImages(center)[0]})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}>
                    {isBusinessPro(center) && (
                      <div style={{
                        alignSelf: "flex-start",
                        background: "linear-gradient(135deg, #8B5CF6, #A855F7)",
                        color: "#ffffff",
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "10px",
                        fontWeight: "700"
                      }}>
                        VIP
                      </div>
                    )}
                    <div
                      onClick={(e) => toggleFavorite(center._id || center.id, e)}
                      style={{
                        alignSelf: "flex-end",
                        background: "rgba(255,255,255,0.9)",
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                      }}
                    >
                      {favorites.has(center._id || center.id) ? "❤️" : "♡"}
                    </div>
                    <div style={{
                      color: "#ffffff",
                      marginTop: "auto"
                    }}>
                      <h3 style={{
                        margin: "0 0 4px 0",
                        fontSize: "14px",
                        fontWeight: "700",
                        lineHeight: "1.2"
                      }}>
                        {center.name}
                      </h3>

                      <div style={{
                        fontSize: "10px",
                        opacity: 0.8,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        📍 {center.address ? center.address.split(',')[0] : "Ulaanbaatar"}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: "12px"
                  }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px"
                    }}>
                      <div style={{
                        fontSize: "12px",
                        color: "#f59e0b",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px"
                      }}>
                        ⭐ {center.rating || 4.8}
                      </div>
                      <div style={{
                        fontSize: "14px",
                        color: "#3b82f6",
                        fontWeight: "700"
                      }}>
                        {center.pricing?.standard 
                          ? `${parseInt(center.pricing.standard).toLocaleString()}₮/цаг`
                          : "3000₮/цаг"}
                      </div>
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <div style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#10b981"
                      }} />
                      <span style={{
                        fontSize: "11px",
                        color: "#10b981",
                        fontWeight: "600"
                      }}>
                        📞 {center.phone || "99887766"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "bonus" && (
          <div style={{
            padding: "0 20px 20px 20px",
            background: "#ffffff"
          }}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}>
              {(bonusCenters.length > 0 ? bonusCenters : regularCenters).slice(0, 6).map(center => (
                <div
                  key={center._id || center.id}
                  onClick={() => navigate(`/center/${center._id || center.id}`)}
                  style={{
                    display: "flex",
                    background: "#ffffff",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid #f0f0f0",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    height: "100px"
                  }}
                >
                  <div style={{
                    position: "relative",
                    width: "100px",
                    height: "100px",
                    flexShrink: 0,
                    background: `url(${getAllImages(center)[0]})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}>
                    {hasBonus(center) && (
                      <div style={{
                        position: "absolute",
                        top: "8px",
                        left: "8px",
                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                        color: "#ffffff",
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "10px",
                        fontWeight: "700",
                        maxWidth: "80px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {hasBonus(center) && center.bonus && center.bonus.length > 0 
                          ? center.bonus[0].title || "BONUS"
                          : "BONUS"}
                      </div>
                    )}
                    <div
                      onClick={(e) => toggleFavorite(center._id || center.id, e)}
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        right: "8px",
                        background: "rgba(255,255,255,0.9)",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                      }}
                    >
                      {favorites.has(center._id || center.id) ? "❤️" : "♡"}
                    </div>
                  </div>
                  <div style={{
                    flex: 1,
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}>
                    <div>
                      {/* Center Name */}
                      <h3 style={{
                        margin: "0 0 6px 0",
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#1f2937",
                        lineHeight: "1.2"
                      }}>
                        {center.name}
                      </h3>
                      
                      {/* Bonus Description OR Room Availability */}
                      {(() => {
                        const bonus = hasBonus(center) && center.bonus && center.bonus.length > 0 ? center.bonus[0] : null;
                        
                        // Check for description in the "text" field from AddBonusModal
                        const description = bonus?.text || bonus?.description || "";
                        const hasDescription = description && description.trim() !== "";
                        
                        if (hasDescription) {
                          // Show only bonus description if available
                          return (
                            <div style={{
                              fontSize: "12px",
                              color: "#3b82f6",
                              fontWeight: "500",
                              marginBottom: "8px",
                              lineHeight: "1.3"
                            }}>
                              {description}
                            </div>
                          );
                        }
                        
                        // Show room availability only if no description
                        // Get available seats from bonus data - using standardFree, vipFree, stageFree from AddBonusModal
                        const zaalSeats = parseInt(bonus?.standardFree) || 0;
                        const vipSeats = parseInt(bonus?.vipFree) || 0;
                        const stageSeats = parseInt(bonus?.stageFree) || 0;
                        
                        return (
                          <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "3px",
                            marginBottom: "8px"
                          }}>
                            {/* Заал availability - only show if has seats */}
                            {zaalSeats > 0 && (
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}>
                                <div style={{
                                  width: "4px",
                                  height: "4px",
                                  borderRadius: "50%",
                                  background: "#10b981"
                                }} />
                                <span style={{
                                  fontSize: "11px",
                                  color: "#10b981",
                                  fontWeight: "600"
                                }}>
                                  Заал: {zaalSeats} сул суудал
                                </span>
                              </div>
                            )}
                            
                            {/* VIP availability - only show if has seats */}
                            {vipSeats > 0 && (
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}>
                                <div style={{
                                  width: "4px",
                                  height: "4px",
                                  borderRadius: "50%",
                                  background: "#10b981"
                                }} />
                                <span style={{
                                  fontSize: "11px",
                                  color: "#10b981",
                                  fontWeight: "600"
                                }}>
                                  VIP: {vipSeats} сул суудал
                                </span>
                              </div>
                            )}
                            
                            {/* Stage availability - only show if has seats */}
                            {stageSeats > 0 && (
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}>
                                <div style={{
                                  width: "4px",
                                  height: "4px",
                                  borderRadius: "50%",
                                  background: "#10b981"
                                }} />
                                <span style={{
                                  fontSize: "11px",
                                  color: "#10b981",
                                  fontWeight: "600"
                                }}>
                                  Stage: {stageSeats} сул суудал
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {bonusCenters.length === 0 && regularCenters.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b7280" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎁</div>
                <p>Одоогоор center олдсонгүй</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "booking" && (
          <div style={{ padding: "20px", background: "#ffffff", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📅</div>
            <h3 style={{ margin: "0 0 8px 0", color: "#1f2937" }}>Захиалга хэсэг</h3>
            <p style={{ margin: "0", color: "#6b7280" }}>Захиалгын жагсаалт энд харагдана</p>
            <button
              style={{
                marginTop: "16px",
                padding: "12px 24px",
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontWeight: "600",
                cursor: "pointer"
              }}
              onClick={() => navigate("/booking")}
            >
              Захиалга үүсгэх
            </button>
          </div>
        )}
      </div>

      {safeFiltered.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          color: "#6b7280"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <p style={{ margin: "0", fontSize: "16px", fontWeight: "500" }}>
            Үр дүн олдсонгүй
          </p>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
}