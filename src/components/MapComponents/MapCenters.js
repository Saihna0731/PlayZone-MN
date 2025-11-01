import React, { useEffect, useState, useCallback } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import axios from "axios";
import { API_BASE } from "../../config";
import "leaflet/dist/leaflet.css";
import "../../styles/CustomMarker.css";
import { cacheUtils } from "../../utils/cache";
import { useSubscription } from "../../hooks/useSubscription";

// Ачаалалын өнгө авах функц (subscription эрхтэй хэрэглэгчдэд зориулсан)
const getOccupancyColor = (percentage) => {
  if (percentage <= 25) return "#4caf50"; // Ногоон
  if (percentage <= 50) return "#ffc107"; // Шар
  if (percentage <= 75) return "#ff9800"; // Улбар шар
  return "#f44336"; // Улаан
};

// Custom marker icon with center's logo - subscription шалгалттай
const isRecent = (dateStrOrDate, days = 3) => {
  try {
    const d = new Date(dateStrOrDate);
    return Date.now() - d.getTime() <= days * 24 * 60 * 60 * 1000;
  } catch { return false; }
};

const hasRecentActivity = (center) => {
  // Зөвхөн bonus-ийг авч үзнэ
  if (!Array.isArray(center.bonus)) return false;
  return center.bonus.some(it => it && isRecent(it.createdAt || it.expiresAt));
};

// Тухайн төвийн хамгийн сүүлийн (шинэ) бонусыг авах helper
const getLatestBonus = (center) => {
  try {
    if (!center || !Array.isArray(center.bonus) || center.bonus.length === 0) return null;
    const items = center.bonus
      .filter(b => b && (b.title || b.text || b.description))
      .sort((a, b) => {
        const ad = new Date(a.createdAt || a.expiresAt || a.updatedAt || 0).getTime();
        const bd = new Date(b.createdAt || b.expiresAt || b.updatedAt || 0).getTime();
        return bd - ad;
      });
    return items[0] || null;
  } catch {
    return null;
  }
};

// Урт текстийг popup-д багтаах богино тайлбар болгоно
const snippet = (s, max = 120) => {
  if (!s || typeof s !== 'string') return '';
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

const createCustomIcon = (center, canViewDetails) => {
  // Center-ийн logo эсвэл default logo ашиглах
  const logoSrc = center?.logo || "/logo192.png";
  
  // Төлбөртэй хэрэглэгчдэд ачаалалын өнгө, бусдад серийн өнгө
  const borderColor = canViewDetails && center.occupancy 
    ? getOccupancyColor(center.occupancy.standard || center.occupancy.vip || center.occupancy.stage || 0)
    : '#cccccc';
  
  const recent = hasRecentActivity(center);

  return L.divIcon({
    className: canViewDetails ? 'custom-marker interactive' : 'custom-marker disabled leaflet-interactive-disabled',
    html: `
      <div class="marker-body ${canViewDetails ? 'interactive' : 'disabled'}" style="
        width: 56px;
        height: 56px;
        background: white;
        border: 4px solid ${borderColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3), 0 0 0 2px ${borderColor}40;
        position: relative;
        cursor: ${canViewDetails ? 'pointer' : 'default'};
        transition: ${canViewDetails ? 'all 0.2s ease' : 'none'};
        pointer-events: ${canViewDetails ? 'auto' : 'none'};
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      " ${canViewDetails ? '' : 'onclick="event.preventDefault(); event.stopPropagation(); return false;" onmousedown="event.preventDefault(); event.stopPropagation(); return false;" ondblclick="event.preventDefault(); event.stopPropagation(); return false;" oncontextmenu="event.preventDefault(); event.stopPropagation(); return false;"'}>
        <div style="
          width: 44px;
          height: 44px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          box-sizing: border-box;
          overflow: hidden;
          pointer-events: ${canViewDetails ? 'auto' : 'none'};
        ">
          <img src="${logoSrc}" alt="Logo" style="
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
            pointer-events: ${canViewDetails ? 'auto' : 'none'};
          " onerror="this.src='/logo192.png'" />
        </div>
        ${recent ? `
        <div style="
          position: absolute;
          top: -6px;
          left: -6px;
          width: 14px;
          height: 14px;
          background: #e53935;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(229,57,53,0.6);
          animation: pulse 1.5s infinite;
        "></div>
        ` : ''}
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          width: 20px;
          height: 20px;
          background: ${borderColor};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: white;
          font-weight: bold;
          pointer-events: ${canViewDetails ? 'auto' : 'none'};
        ">${canViewDetails && center.occupancy ? 
          Math.round(center.occupancy.standard || center.occupancy.vip || center.occupancy.stage || 0) + '%' 
          : '?'}</div>
        <div style="
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 12px solid transparent;
          border-right: 12px solid transparent;
          border-top: 14px solid ${borderColor};
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
          pointer-events: ${canViewDetails ? 'auto' : 'none'};
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
      </style>
    `,
    iconSize: [56, 70],
    iconAnchor: [28, 70],
    popupAnchor: [0, -70]
  });
};

function FlyToOnChange({ center }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.flyTo(center, 14, { animate: true });
  }, [center, map]);
  return null;
}

// Map click блоклох component - цэвэрлэсэн хувилбар
function MapClickBlocker({ canViewDetails, showToast, getSubscriptionMessage }) {
  const map = useMap();
  
  useEffect(() => {
    const handleMarkerClick = (e) => {
      // Зөвхөн эрхгүй хэрэглэгчдэд block хийх
      if (!canViewDetails) {
        const clickedElement = e.originalEvent?.target;
        
        // Marker element шалгах
        const isMarkerClick = clickedElement && (
          clickedElement.closest('.custom-marker') ||
          clickedElement.closest('.leaflet-marker-icon') ||
          clickedElement.classList?.contains('marker-body') ||
          clickedElement.tagName === 'IMG'
        );
        
        if (isMarkerClick) {
          e.originalEvent?.preventDefault();
          e.originalEvent?.stopPropagation();
          e.originalEvent?.stopImmediatePropagation();
          
          // Эрхгүй хэрэглэгчдэд сануулга
          if (showToast) {
            showToast(getSubscriptionMessage(), "warning");
          }
          
          return false;
        }
      }
    };

    // Map click event listener
    map.on('click', handleMarkerClick);
    map.on('dblclick', handleMarkerClick);
    
    return () => {
      map.off('click', handleMarkerClick);
      map.off('dblclick', handleMarkerClick);
    };
  }, [map, canViewDetails, showToast, getSubscriptionMessage]);

  return null;
}

export default function MapCenters({ query = "", mapStyle = "osm", showToast }) {
  const [centers, setCenters] = useState([]);
  const [focus, setFocus] = useState(null);
  const { canViewDetails, subscription } = useSubscription();
  
  // Subscription мэдээлэл notification-д ашиглах
  const getSubscriptionMessage = () => {
    if (!subscription || subscription.plan === 'free') {
      return "Дэлгэрэнгүй мэдээлэл харахын тулд планаа шинэчлэх шаардлагатай";
    }
    return "Энэ үйлдэл хийх эрх танд байхгүй байна";
  };
  const [loading, setLoading] = useState(true);

  const fetchCenters = useCallback(async (retryCount = 0) => {
    try {
      // Cache-аас эхлээд шалгах
      const cached = cacheUtils.get('centers');
      if (cached && Array.isArray(cached)) {
        setCenters(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Axios timeout тохиргоо
      const source = axios.CancelToken.source();
      const timeout = setTimeout(() => {
        source.cancel('Request timeout after 20 seconds');
      }, 20000); // 20 секунд timeout
      
      const res = await axios.get(`${API_BASE}/api/centers?limit=50`, {
        timeout: 30000, // 30 секунд timeout багасгалаа
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        validateStatus: (status) => status < 500 // 500+ алдааг л error гэж үзэх
      });
      
      clearTimeout(timeout);
      
      // Handle both old and new API response formats
      let centers;
      if (res.data.centers && Array.isArray(res.data.centers)) {
        centers = res.data.centers;
      } else if (Array.isArray(res.data)) {
        centers = res.data;
      } else {
        centers = [];
      }
      
      // Cache-д хадгалах (зөвхөн амжилттай бол)
      if (centers.length > 0) {
        cacheUtils.set('centers', centers);
      }
      
      setCenters(centers);
      setLoading(false);
      
    } catch (err) {
      console.error("fetch centers error:", err);
      
      // Timeout эсвэл network алдааны үед retry хийх
      if ((err.code === 'ECONNABORTED' || err.message.includes('timeout') || err.message.includes('Network Error')) && retryCount < 2) {
        setTimeout(() => {
          fetchCenters(retryCount + 1);
        }, 3000);
        return;
      }
      
      // Cache-аас аваад үзэх (алдаа гарсан үед)
      const cached = cacheUtils.get('centers');
      if (cached && Array.isArray(cached)) {
        setCenters(cached);
      } else {
        setCenters([]);
      }
      
      setLoading(false);
      
      // Toast notification харуулах
      if (showToast) {
        showToast("Серверээс мэдээлэл авахад асуудал гарлаа. Дахин оролдоно уу.", "error");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCenters();
    
    // Centers update event listener
    const onUpdated = (e) => {
      if (e?.detail && e.detail.lat != null && e.detail.lng != null) {
        setFocus([Number(e.detail.lat), Number(e.detail.lng)]);
      }
      // Cache дахин ачаалах
      fetchCenters();
    };
    
    // Occupancy update event listener - ачаалал шинэчлэгдэхэд map дээр шууд харуулах
    const onOccupancyUpdated = (e) => {
      if (e?.detail) {
        const { centerId, occupancy } = e.detail;
        setCenters(prevCenters => 
          prevCenters.map(center => 
            center._id === centerId 
              ? { ...center, occupancy } 
              : center
          )
        );
        console.log("Map occupancy updated:", centerId, occupancy);
      }
    };
    
    window.addEventListener("centers:updated", onUpdated);
    window.addEventListener("occupancy:updated", onOccupancyUpdated);
    
    return () => {
      window.removeEventListener("centers:updated", onUpdated);
      window.removeEventListener("occupancy:updated", onOccupancyUpdated);
    };
  }, [fetchCenters]);

  // filter by query
  const q = (query || "").trim().toLowerCase();
  
  // Ensure centers is always an array
  const centersArray = Array.isArray(centers) ? centers : [];
  
  const visible = centersArray.filter((c) => {
    if (!c || c.lat == null || c.lng == null) return false;
    if (!q) return true;
    // Бонусын агуулгыг нэгтгэж хайлтад хамруулна
    const bonusBlob = Array.isArray(c.bonus)
      ? c.bonus
          .map(b => `${(b?.title || "")} ${(b?.text || b?.description || "")}`)
          .join(" ")
          .toLowerCase()
      : "";

    const includes = (v) => (v || "").toLowerCase().includes(q);

    return (
      includes(c.name) ||
      includes(c.address) ||
      includes(c.category) ||
      bonusBlob.includes(q)
    );
  });



  const initial = visible.length ? [Number(visible[0].lat), Number(visible[0].lng)] : [47.917, 106.917];

  const tileUrl =
    mapStyle === "sat"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : mapStyle === "carto"
      ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution =
    mapStyle === "sat"
      ? "&copy; Esri"
      : mapStyle === "carto"
      ? '&copy; CARTO'
      : '&copy; OpenStreetMap contributors';

  // Double click handler for marker
  const handleMarkerDoubleClick = (center) => {
    // Subscription шалгах
    if (!canViewDetails) {
      if (showToast) {
        showToast("Дэлгэрэнгүй мэдээлэл харахын тулд планаа шинэчлэх шаардлагатай", "warning");
      }
      return;
    }
    // CenterDetail хуудас руу шилжих
    window.location.href = `/center/${center._id || center.id}`;
  };

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(255, 255, 255, 0.9)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          backdropFilter: "blur(2px)"
        }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #1976d2",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: "16px"
          }}></div>
          <div style={{
            color: "#333",
            fontSize: "16px",
            fontWeight: "500",
            marginBottom: "8px"
          }}>
            Газрын зургийг ачааллаж байна...
          </div>
          <div style={{
            color: "#666",
            fontSize: "14px"
          }}>
            Marker-ууд удахгүй гарч ирнэ
          </div>
        </div>
      )}
      
      <MapContainer center={initial} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url={tileUrl} attribution={attribution} />
        <MapClickBlocker 
          canViewDetails={canViewDetails} 
          showToast={showToast} 
          getSubscriptionMessage={getSubscriptionMessage} 
        />
        {visible.map((c) => {
          // Marker үүсгэх үед subscription эрх шалгах
          const markerId = c._id ?? c.id;
          

          
          const markerProps = {
            position: [Number(c.lat), Number(c.lng)],
            icon: createCustomIcon(c, canViewDetails),
            interactive: canViewDetails, // Subscription эрхтэй болвол interactive
            riseOnHover: canViewDetails,
            riseOffset: canViewDetails ? 250 : 0,
            bubblingMouseEvents: canViewDetails,
            keyboard: canViewDetails,
            opacity: 1
          };

          // Event handlers - цэвэрлэсэн хувилбар
          if (canViewDetails) {
            markerProps.eventHandlers = {
              dblclick: () => handleMarkerDoubleClick(c)
            };
          }

          return (
            <Marker key={markerId} {...markerProps}>
            {/* Popup зөвхөн subscription эрхтэй хэрэглэгчдэд харуулах */}
            {canViewDetails && (
              <Popup>
                <div style={{ minWidth: 220 }}>
                  <strong style={{ fontSize: '16px', color: '#333' }}>{c.name}</strong>
                  {/* Хаягийн оронд хамгийн сүүлийн бонусыг харуулна */}
                  {(() => {
                    const latest = getLatestBonus(c);
                    if (latest) {
                      return (
                        <div style={{
                          marginTop: 6,
                          padding: '8px',
                          background: '#fff8e1',
                          borderRadius: '6px',
                          border: '1px solid #ffe0b2'
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#e65100', marginBottom: 4 }}>🎁 News</div>
                          <div style={{ fontSize: 13, color: '#5d4037' }}>{latest.title || 'Бонус'}</div>
                          {(latest.text || latest.description) && (
                            <div style={{ fontSize: 12, color: '#6d4c41', marginTop: 4 }}>
                              {snippet(latest.text || latest.description)}
                            </div>
                          )}
                        </div>
                      );
                    }
                    // Бонус байхгүй бол хуучин байдлаар хаягийг харуулна
                    return <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{c.address}</div>;
                  })()}
                  {c.phone && <div style={{ marginTop: 6, fontSize: 13 }}>📞 {c.phone}</div>}
                
                {/* Үнийн мэдээлэл */}
                {(c.pricing || c.price) && (
                  <div style={{ 
                    marginTop: 8, 
                    padding: '8px', 
                    background: '#f8f9fa', 
                    borderRadius: '6px',
                    fontSize: 12
                  }}>
                    <div style={{ fontWeight: '600', color: '#333', marginBottom: 4 }}>💰 Үнэ:</div>
                    {c.pricing?.standard && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        color: '#666'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: c.occupancy?.standard !== undefined 
                              ? getOccupancyColor(c.occupancy.standard) 
                              : '#ddd'
                          }}></div>
                          • Энгийн: {c.pricing.standard}
                        </div>

                      </div>
                    )}
                    {c.pricing?.vip && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        color: '#e91e63'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: c.occupancy?.vip !== undefined 
                              ? getOccupancyColor(c.occupancy.vip) 
                              : '#ddd'
                          }}></div>
                          • VIP: {c.pricing.vip}
                        </div>

                      </div>
                    )}
                    {c.pricing?.stage && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        color: '#9c27b0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: c.occupancy?.stage !== undefined 
                              ? getOccupancyColor(c.occupancy.stage) 
                              : '#ddd'
                          }}></div>
                          • Stage: {c.pricing.stage}
                        </div>

                      </div>
                    )}
                    {c.price && !c.pricing && (
                      <div style={{ color: '#666' }}>• {c.price}</div>
                    )}
                  </div>
                )}

                {/* Ачаалалын мэдээлэл - төлбөртэй хэрэглэгчдэд л харуулах */}
                {canViewDetails && c.occupancy && (
                  <div style={{ 
                    marginTop: 8, 
                    padding: '8px', 
                    background: '#e8f5e8', 
                    borderRadius: '6px',
                    fontSize: 12,
                    border: '1px solid #c8e6c9'
                  }}>
                    <div style={{ fontWeight: '600', color: '#2e7d32', marginBottom: 4 }}>📊 Бодит цагийн ачаалал:</div>
                    {c.occupancy.standard !== undefined && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        background: 'rgba(76, 175, 80, 0.1)',
                        borderRadius: '4px',
                        marginBottom: '4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: getOccupancyColor(c.occupancy.standard)
                          }}></div>
                          <span style={{ fontWeight: '500' }}>Энгийн компьютер:</span>
                        </div>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: getOccupancyColor(c.occupancy.standard),
                          fontSize: '14px'
                        }}>{c.occupancy.standard}%</span>
                      </div>
                    )}
                    {c.occupancy.vip !== undefined && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        background: 'rgba(233, 30, 99, 0.1)',
                        borderRadius: '4px',
                        marginBottom: '4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: getOccupancyColor(c.occupancy.vip)
                          }}></div>
                          <span style={{ fontWeight: '500' }}>VIP компьютер:</span>
                        </div>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: getOccupancyColor(c.occupancy.vip),
                          fontSize: '14px'
                        }}>{c.occupancy.vip}%</span>
                      </div>
                    )}
                    {c.occupancy.stage !== undefined && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        background: 'rgba(156, 39, 176, 0.1)',
                        borderRadius: '4px',
                        marginBottom: '4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: getOccupancyColor(c.occupancy.stage)
                          }}></div>
                          <span style={{ fontWeight: '500' }}>Stage компьютер:</span>
                        </div>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: getOccupancyColor(c.occupancy.stage),
                          fontSize: '14px'
                        }}>{c.occupancy.stage}%</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div style={{ 
                  marginTop: 8, 
                  padding: '6px 8px', 
                  background: '#f0f8ff', 
                  borderRadius: '4px',
                  fontSize: 11,
                  color: '#0066cc',
                  textAlign: 'center',
                  border: '1px solid #e0e8ff'
                }}>
                  💡 Marker дээр 2 удаа дарж дэлгэрэнгүй үзнэ үү
                </div>
                </div>
              </Popup>
            )}
            </Marker>
          );
        })}
        {focus && <FlyToOnChange center={focus} />}
      </MapContainer>
    </div>
  );
}