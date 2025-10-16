import React, { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import axios from "axios";
import { API_BASE } from "../config";
import "leaflet/dist/leaflet.css";
import "../styles/CustomMarker.css";

// Custom marker icon with center's logo
const createCustomIcon = (center) => {
  // Center-ийн logo эсвэл default logo ашиглах
  const logoSrc = center?.logo || "/logo192.png";
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="marker-body" style="
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
        position: relative;
        cursor: pointer;
        transition: all 0.2s ease;
      " 
      onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.5)'" 
      onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 16px rgba(102, 126, 234, 0.3)'">
        <div style="
          width: 48px;
          height: 48px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          box-sizing: border-box;
          overflow: hidden;
        ">
          <img src="${logoSrc}" alt="Logo" style="
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
          " onerror="this.src='/logo192.png'" />
        </div>
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          width: 16px;
          height: 16px;
          background: #ff6b6b;
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: white;
          font-weight: bold;
          animation: pulse 2s infinite;
        ">2×</div>
        <div style="
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 12px solid transparent;
          border-right: 12px solid transparent;
          border-top: 14px solid #667eea;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
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

export default function MapCenters({ query = "", mapStyle = "osm" }) {
  const [centers, setCenters] = useState([]);
  const [focus, setFocus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/centers`);
      setCenters(res.data || []);
    } catch (err) {
      console.error("fetch centers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();
    const onUpdated = (e) => {
      if (e?.detail && e.detail.lat != null && e.detail.lng != null) {
        setFocus([Number(e.detail.lat), Number(e.detail.lng)]);
      }
      // optional: refetch when external event triggers
      // fetchCenters();
    };
    window.addEventListener("centers:updated", onUpdated);
    return () => window.removeEventListener("centers:updated", onUpdated);
  }, []);

  // filter by query
  const q = (query || "").trim().toLowerCase();
  const visible = centers.filter((c) => {
    if (!c || c.lat == null || c.lng == null) return false;
    if (!q) return true;
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.address || "").toLowerCase().includes(q) ||
      (c.category || "").toLowerCase().includes(q)
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
        {visible.map((c) => (
          <Marker 
            key={c._id ?? c.id} 
            position={[Number(c.lat), Number(c.lng)]}
            icon={createCustomIcon(c)}
            eventHandlers={{
              dblclick: () => handleMarkerDoubleClick(c)
            }}
          >
            <Popup>
              <div style={{ minWidth: 220 }}>
                <strong style={{ fontSize: '16px', color: '#333' }}>{c.name}</strong>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{c.address}</div>
                {c.phone && <div style={{ marginTop: 6, fontSize: 13 }}>📞 {c.phone}</div>}
                
                {/* Pricing мэдээлэл */}
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
                      <div style={{ color: '#666' }}>• Энгийн: {c.pricing.standard}</div>
                    )}
                    {c.pricing?.vip && (
                      <div style={{ color: '#e91e63' }}>• VIP: {c.pricing.vip}</div>
                    )}
                    {c.pricing?.stage && (
                      <div style={{ color: '#9c27b0' }}>• Stage: {c.pricing.stage}</div>
                    )}
                    {c.price && !c.pricing && (
                      <div style={{ color: '#666' }}>• {c.price}</div>
                    )}
                  </div>
                )}
                
                <div style={{ 
                  marginTop: 8, 
                  padding: '6px 8px', 
                  background: '#f0f8ff', 
                  borderRadius: '4px',
                  fontSize: 12,
                  color: '#0066cc',
                  textAlign: 'center',
                  border: '1px solid #e0e8ff'
                }}>
                  💡 Marker дээр 2 удаа дарж дэлгэрэнгүй үзнэ үү
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {focus && <FlyToOnChange center={focus} />}
      </MapContainer>
    </div>
  );
}