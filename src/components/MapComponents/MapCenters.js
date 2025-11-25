import React, { useEffect, useState, useCallback, useRef } from "react";
import L from "leaflet";
import { Marker, Popup, useMap } from "react-leaflet";
import axios from "axios";
import { API_BASE } from "../../config";
import "leaflet/dist/leaflet.css";
import "../../styles/CustomMarker.css";
import { cacheUtils } from "../../utils/cache";
import { useSubscription } from "../../hooks/useSubscription";
import { useAuth } from "../../contexts/AuthContext";
import { FaStar, FaMapMarkerAlt, FaClock, FaPhone } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Ачаалалын өнгө авах функц (subscription эрхтэй хэрэглэгчдэд зориулсан)
const getOccupancyColor = (percentage) => {
  if (percentage <= 25) return "#4caf50"; // Ногоон
  if (percentage <= 50) return "#ffc107"; // Шар
  if (percentage <= 75) return "#ff9800"; // Улбар шар
  return "#f44336"; // Улаан
};

// Custom marker icon with center's logo - subscription шалгалттай
// Bonus байгаа эсэхийг шалгана (одоогоор хугацаагаар хязгаарлахгүй)
const hasRecentActivity = (center) => Array.isArray(center?.bonus) && center.bonus.length > 0;

const createCustomIcon = (center, canViewDetails, canInteract = canViewDetails) => {
  // Center-ийн logo эсвэл эхний зураг → thumbnail/highQuality/стринг → legacy image → default
  let logoSrc = "/logo192.png";
  if (center?.logo) {
    logoSrc = center.logo;
  } else if (Array.isArray(center?.images) && center.images.length > 0) {
    const firstImage = center.images[0];
    if (firstImage && typeof firstImage === 'object') {
      logoSrc = firstImage.thumbnail || firstImage.highQuality || logoSrc;
    } else if (typeof firstImage === 'string') {
      logoSrc = firstImage;
    }
  } else if (center?.image) {
    // legacy single image field
    logoSrc = center.image;
  }
  
  // Төлбөртэй хэрэглэгчдэд ачаалалын өнгө, бусдад серийн өнгө
  const borderColor = canViewDetails && center.occupancy 
    ? getOccupancyColor(center.occupancy.standard || center.occupancy.vip || center.occupancy.stage || 0)
    : '#cccccc';
  
  const recent = hasRecentActivity(center);

  return L.divIcon({
    className: canInteract ? 'custom-marker interactive' : 'custom-marker disabled leaflet-interactive-disabled',
    html: `
      <div class="marker-body ${canInteract ? 'interactive' : 'disabled'}" style="
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
        cursor: ${canInteract ? 'pointer' : 'default'};
        transition: ${canInteract ? 'all 0.2s ease' : 'none'};
        pointer-events: ${canInteract ? 'auto' : 'none'};
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      " ${canInteract ? '' : 'onclick="event.preventDefault(); event.stopPropagation(); return false;" onmousedown="event.preventDefault(); event.stopPropagation(); return false;" ondblclick="event.preventDefault(); event.stopPropagation(); return false;" oncontextmenu="event.preventDefault(); event.stopPropagation(); return false;"'}>
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
          pointer-events: ${canInteract ? 'auto' : 'none'};
        ">
            <img src="${logoSrc}" alt="Logo" style="
              width: 100%;
              height: 100%;
              object-fit: cover;
              border-radius: 50%;
              pointer-events: ${canInteract ? 'auto' : 'none'};
              opacity: 1.5;
            " onerror="this.onerror=null; this.src='/logo192.png';" />
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
          z-index: 3;
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
          pointer-events: ${canInteract ? 'auto' : 'none'};
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
          pointer-events: ${canInteract ? 'auto' : 'none'};
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
      </style>`,
    iconSize: [56, 70],
    iconAnchor: [28, 70],
    popupAnchor: [0, -70]
  });
};

export default function MapCenters({ selectedCategory, searchQuery = "", filters = {}, onMarkerClick, onCentersUpdate, onCategoriesUpdate }) {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const { canViewDetails: hasActiveSubscription } = useSubscription();
  const { user } = useAuth();
  const map = useMap();
  const navigate = useNavigate();

  const fetchCenters = useCallback(async () => {
    try {
      // Cache-аас эхлээд шалгах
      const cached = cacheUtils.get('map_centers');
      if (cached && Array.isArray(cached)) {
        setCenters(cached);
        setLoading(false);
        // Background refresh
        const res = await axios.get(`${API_BASE}/api/centers`);
        const data = res.data?.centers || res.data;
        if (Array.isArray(data)) {
          setCenters(data);
          cacheUtils.set('map_centers', data);
        }
        return;
      }

      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/centers`);
      const data = res.data?.centers || res.data;
      if (Array.isArray(data)) {
        setCenters(data);
        cacheUtils.set('map_centers', data);
      }
    } catch (err) {
      console.error("Error fetching centers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCenters();

    // Centers update event listener
    const onUpdated = () => {
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
      }
    };

    window.addEventListener("centers:updated", onUpdated);
    window.addEventListener("occupancy:updated", onOccupancyUpdated);

    return () => {
      window.removeEventListener("centers:updated", onUpdated);
      window.removeEventListener("occupancy:updated", onOccupancyUpdated);
    };
  }, [fetchCenters]);

  // Derive categories from centers and send up (guard against infinite update loops)
  const prevCatsRef = useRef([]);
  useEffect(() => {
    if (!onCategoriesUpdate || !centers.length) return;
    const rawCats = centers.map(c => (c.category || 'gaming').toLowerCase().trim());
    const freqMap = rawCats.reduce((acc, c) => { acc[c] = (acc[c] || 0) + 1; return acc; }, {});
    const unique = Array.from(new Set(rawCats)).sort((a, b) => (freqMap[b] || 0) - (freqMap[a] || 0));
    const prev = prevCatsRef.current;
    if (prev.length === unique.length && prev.every((v, i) => v === unique[i])) {
      return; // No change; skip parent update
    }
    prevCatsRef.current = unique;
    onCategoriesUpdate(unique);
  }, [centers, onCategoriesUpdate]);

  // Filter centers based on category + search
  const filteredCenters = centers.filter(center => {
    // Normalize stored category (fallback to 'gaming' default)
    const rawCat = (center.category || 'gaming').toLowerCase();

    // Category filter
    let categoryMatch = true;
    if (selectedCategory && selectedCategory !== 'all') {
      const targetCat = selectedCategory.toLowerCase();
      if (targetCat === 'gaming') {
        categoryMatch = rawCat.includes('game') && !rawCat.includes('pc');
      } else if (targetCat === 'pc-center') {
        categoryMatch = rawCat.includes('pc') || rawCat.includes('computer');
      } else if (targetCat === 'ps5') {
        categoryMatch = rawCat.includes('ps') || rawCat.includes('playstation');
      } else if (targetCat === 'billard') {
        categoryMatch = rawCat.includes('billard') || rawCat.includes('billiard');
      } else if (targetCat === 'vip') {
        // VIP category: Show centers where owner has 'business_pro' plan
        const plan = center.owner?.subscription?.plan;
        categoryMatch = plan === 'business_pro';
      } else {
        categoryMatch = rawCat.includes(targetCat);
      }
    }

    // Advanced Filters (Panel)
    let filterMatch = true;
    if (filters.onlyGreen) {
      // Check if occupancy is low (<= 25%)
      const occ = center.occupancy?.standard || center.occupancy?.vip || center.occupancy?.stage || 0;
      if (occ > 25) filterMatch = false;
    }
    if (filters.onlyOrange) {
      // Check if occupancy is medium (26-75%)
      const occ = center.occupancy?.standard || center.occupancy?.vip || center.occupancy?.stage || 0;
      if (occ <= 25 || occ > 75) filterMatch = false;
    }
    if (filters.priceRange && filters.priceRange !== 'all') {
      // Parse price (assuming string like "3,000₮" or number)
      let priceVal = 0;
      const pStr = center.pricing?.standard || center.price || "0";
      priceVal = parseInt(pStr.replace(/[^0-9]/g, ''), 10);
      
      if (filters.priceRange === 'low' && priceVal >= 3000) filterMatch = false;
      if (filters.priceRange === 'medium' && (priceVal < 3000 || priceVal > 5000)) filterMatch = false;
      if (filters.priceRange === 'high' && priceVal <= 5000) filterMatch = false;
    }

    // Search filter
    const q = searchQuery.trim().toLowerCase();
    const searchMatch = !q || (
      (center.name && center.name.toLowerCase().includes(q)) ||
      (center.address && center.address.toLowerCase().includes(q)) ||
      (center.description && center.description.toLowerCase().includes(q))
    );

    return categoryMatch && searchMatch && filterMatch;
  });

  // Update parent with filtered centers
  // Use JSON.stringify to avoid infinite loop if filteredCenters is a new array reference every render
  useEffect(() => {
    if (onCentersUpdate) {
      onCentersUpdate(filteredCenters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filteredCenters), onCentersUpdate]);

  const handleMarkerClick = (center) => {
    if (onMarkerClick) {
      onMarkerClick(center);
    }
    if (center?.location?.coordinates && Array.isArray(center.location.coordinates) && center.location.coordinates.length === 2) {
      map.flyTo([center.location.coordinates[1], center.location.coordinates[0]], 15, {
        animate: true,
        duration: 1
      });
    }
  };

  return (
    <>
      {filteredCenters.map((c) => {
        const markerKey = c._id || c.id;
        const canViewDetails = hasActiveSubscription || user?.role === 'admin';
        const canInteract = true; // Always interactive for now

        // Determine coordinates (fallback to legacy lat/lng if location missing)
        const hasLocationArray = c.location && Array.isArray(c.location.coordinates) && c.location.coordinates.length === 2 && typeof c.location.coordinates[0] === 'number' && typeof c.location.coordinates[1] === 'number';
        const lat = hasLocationArray ? c.location.coordinates[1] : (typeof c.lat === 'number' ? c.lat : 47.9188);
        const lng = hasLocationArray ? c.location.coordinates[0] : (typeof c.lng === 'number' ? c.lng : 106.9176);

        // Skip invalid zero default [0,0] to avoid world map cluster at Gulf of Guinea
        if (lat === 0 && lng === 0) return null;

        const markerProps = {
          position: [lat, lng],
          icon: createCustomIcon(c, canViewDetails, canInteract),
          eventHandlers: {
            click: () => handleMarkerClick(c)
          }
        };

        return (
          <Marker key={markerKey} {...markerProps}>
            <Popup className="custom-popup" minWidth={300} maxWidth={340}>
              <div className="popup-card">
                {/* Header Image */}
                <div className="popup-image-container">
                  <img 
                    src={
                      (c.images && c.images.length > 0 && typeof c.images[0] === 'object' && (c.images[0].thumbnail || c.images[0].highQuality)) || 
                      (c.images && c.images.length > 0 && typeof c.images[0] === 'string' && c.images[0]) || 
                      c.image || 
                      "/logo192.png"
                    } 
                    alt={c.name} 
                    className="popup-image"
                    onError={(e) => {e.target.onerror=null; e.target.src="/logo192.png"}}
                  />
                  <div className="popup-rating-badge">
                    <FaStar className="star-icon" /> {c.rating || 4.5}
                  </div>
                  {c.occupancy && (
                    <div className={`popup-status-badge ${
                      (c.occupancy.standard || 0) > 80 ? 'busy' : 
                      (c.occupancy.standard || 0) > 50 ? 'moderate' : 'free'
                    }`}>
                      {(c.occupancy.standard || 0) > 80 ? 'Дүүрсэн' : 
                       (c.occupancy.standard || 0) > 50 ? 'Дундаж' : 'Чөлөөтэй'}
                    </div>
                  )}
                </div>

                <div className="popup-content-body">
                  <h3 className="popup-title">{c.name}</h3>
                  
                  {canViewDetails ? (
                    <>
                      <div className="popup-info-grid">
                        <div className="popup-info-item">
                          <FaMapMarkerAlt className="info-icon" />
                          <span>{c.address || 'Хаяг тодорхойгүй'}</span>
                        </div>
                        <div className="popup-info-item">
                          <FaClock className="info-icon" />
                          <span>{c.opening || '24/7'}</span>
                        </div>
                        <div className="popup-info-item">
                          <FaPhone className="info-icon" />
                          <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()}>{c.phone || '-'}</a>
                        </div>
                      </div>

                      {c.description && (
                        <div className="popup-description">
                          {c.description.length > 60 ? c.description.substring(0, 60) + '...' : c.description}
                        </div>
                      )}

                      {/* Occupancy Details */}
                      {c.occupancy && (
                        <div className="popup-occupancy-grid">
                          <div className="occupancy-item">
                            <span className="occ-label">Заал</span>
                            <div className="occ-bar">
                              <div className="occ-fill" style={{width: `${c.occupancy.standard || 0}%`, background: getOccupancyColor(c.occupancy.standard || 0)}}></div>
                            </div>
                            <span className="occ-val">{c.occupancy.standard || 0}%</span>
                          </div>
                          <div className="occupancy-item">
                            <span className="occ-label">VIP</span>
                            <div className="occ-bar">
                              <div className="occ-fill" style={{width: `${c.occupancy.vip || 0}%`, background: getOccupancyColor(c.occupancy.vip || 0)}}></div>
                            </div>
                            <span className="occ-val">{c.occupancy.vip || 0}%</span>
                          </div>
                          <div className="occupancy-item">
                            <span className="occ-label">Stage</span>
                            <div className="occ-bar">
                              <div className="occ-fill" style={{width: `${c.occupancy.stage || 0}%`, background: getOccupancyColor(c.occupancy.stage || 0)}}></div>
                            </div>
                            <span className="occ-val">{c.occupancy.stage || 0}%</span>
                          </div>
                        </div>
                      )}

                      <div className="popup-pricing-box">
                        <div className="price-row">
                          <span className="price-label">Энгийн</span>
                          <span className="price-value">{c.pricing?.standard || 3000}₮</span>
                        </div>
                        <div className="price-row">
                          <span className="price-label">VIP</span>
                          <span className="price-value">{c.pricing?.vip || 5000}₮</span>
                        </div>
                        <div className="price-row">
                          <span className="price-label">Stage</span>
                          <span className="price-value">{c.pricing?.stage || 6000}₮</span>
                        </div>
                        <div className="price-row">
                          <span className="price-label">Хоног</span>
                          <span className="price-value">{c.pricing?.overnight || 15000}₮</span>
                        </div>
                      </div>

                      <div className="popup-actions">
                        <button 
                          className="popup-btn-primary"
                          onClick={() => navigate(`/center/${c._id}`)}
                        >
                          Дэлгэрэнгүй
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="popup-locked-view">
                      <div className="locked-icon-wrapper">
                        <div className="locked-icon">🔒</div>
                      </div>
                      <p>Дэлгэрэнгүй мэдээлэл харахын тулд эрхээ идэвхжүүлнэ үү.</p>
                      <button 
                        className="popup-btn-upgrade"
                        onClick={() => navigate('/profile')}
                      >
                        Эрх авах
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
      
      <style jsx>{`
        .popup-card {
          display: flex;
          flex-direction: column;
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .popup-image-container {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 Aspect Ratio */
          overflow: hidden;
        }
        .popup-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-bottom: 2px solid #f3f4f6;
        }
        .popup-rating-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 12px;
          padding: 4px 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #333;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .star-icon {
          color: #f59e0b;
          font-size: 14px;
        }
        .popup-status-badge {
          position: absolute;
          bottom: 8px;
          left: 8px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 12px;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 500;
          color: #333;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .popup-content-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .popup-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #111;
        }
        .popup-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .popup-info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #555;
        }
        .info-icon {
          color: #2563eb;
          font-size: 16px;
        }
        .popup-pricing-box {
          background: #f9fafb;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 16px;
          color: #333;
        }
        .price-label {
          font-weight: 500;
        }
        .price-value {
          font-weight: 600;
          color: #2563eb;
        }
        .popup-actions {
          display: flex;
          justify-content: flex-end;
        }
        .popup-btn-primary {
          background: #2563eb;
          color: white;
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.3s;
        }
        .popup-btn-primary:hover {
          background: #1d4ed8;
        }
        .popup-locked-view {
          text-align: center;
          padding: 16px 0;
        }
        .locked-icon-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 8px;
        }
        .locked-icon {
          font-size: 28px;
          color: #f59e0b;
        }
        .popup-btn-upgrade {
          background: #f59e0b;
          color: white;
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.3s;
        }
        .popup-btn-upgrade:hover {
          background: #d97706;
        }
      `}</style>
    </>
  );
}