import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, ZoomControl, CircleMarker, Popup } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import MapCenters from "../components/MapComponents/MapCenters";
import MapSearch from "../components/MapComponents/MapSearch";
import MapCategoryFilter from "../components/MapComponents/MapCategoryFilter";
import MapTools from "../components/MapComponents/MapTools";
import FilterPanel from "../components/MapComponents/FilterPanel";
import Toast from "../components/LittleComponents/Toast";
import { cacheUtils } from "../utils/cache";
import { useAuth } from "../contexts/AuthContext";
import "leaflet/dist/leaflet.css";
import { FaFilter, FaLock } from "react-icons/fa";

export default function MapView() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [visibleCenters, setVisibleCenters] = useState([]); // For list view
  const [availableCategories, setAvailableCategories] = useState([]); // Dynamic categories from DB
  const [mapStyle, setMapStyle] = useState("streets"); // streets, satellite, dark
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ onlyGreen: false, priceRange: 'all' });
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSnowEffect, setShowSnowEffect] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isRestricted = !user || (user.role !== 'admin' && (!user.subscription?.plan || user.subscription.plan === 'free'));

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowSnowEffect(true);
      setTimeout(() => setShowSnowEffect(false), 3000);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!mapInstance) return;

    const onLocationFound = (e) => {
      setUserLocation(e.latlng);
      mapInstance.flyTo(e.latlng, 16);
      showToast("Таны байршлыг оллоо", "success");
    };

    const onLocationError = (e) => {
      showToast("Байршил тогтооход алдаа гарлаа: " + e.message, "error");
    };

    mapInstance.on('locationfound', onLocationFound);
    mapInstance.on('locationerror', onLocationError);

    return () => {
      mapInstance.off('locationfound', onLocationFound);
      mapInstance.off('locationerror', onLocationError);
    };
  }, [mapInstance, showToast]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, []);

  const handleRefresh = async () => {
    cacheUtils.clear('map_centers');
    setRefreshKey(prev => prev + 1);
    window.dispatchEvent(new CustomEvent("centers:updated"));
    showToast("Газрын зураг шинэчлэгдлээ", "success");
  };

  const handleLocate = () => {
    if (mapInstance) {
      mapInstance.locate({ setView: true, maxZoom: 16 });
    }
  };

  const handleCenterClick = (center) => {
    if (mapInstance) {
      mapInstance.flyTo([center.location.coordinates[1], center.location.coordinates[0]], 16, {
        animate: true,
        duration: 1
      });
    }
  };

  // Notify user when no results match filters/search
  useEffect(() => {
    // Show toast only when filtering (not default 'all') or searching
    if (visibleCenters.length === 0 && ((selectedCategory && selectedCategory !== 'all') || query.trim())) {
      showToast("Үр дүн олдсонгүй", "info");
    }
  }, [visibleCenters, selectedCategory, query, showToast]);

  // Tile layers for different styles
  const getTileLayer = () => {
    switch (mapStyle) {
      case 'satellite':
        return (
          <TileLayer
            key="satellite"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        );
      case 'dark':
        return (
          <TileLayer
            key="dark"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        );
      case 'streets':
      default:
        return (
          <TileLayer
            key="streets"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        );
    }
  };

  if (isLoading) {
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
            🎅 Loading Christmas Map... 🎁
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

  return (
    <div className="map-view-container">
      {/* Snow Effect Overlay */}
      {showSnowEffect && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          pointerEvents: "none",
          overflow: "hidden"
        }}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "-10px",
                left: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 10 + 10}px`,
                animation: `snowfall ${Math.random() * 3 + 2}s linear infinite`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.6 + 0.4
              }}
            >
              ❄️
            </div>
          ))}
          <style>{`
            @keyframes snowfall {
              0% {
                transform: translateY(0) rotate(0deg);
              }
              100% {
                transform: translateY(100vh) rotate(360deg);
              }
            }
          `}</style>
        </div>
      )}
      
      {/* Top Bar with Search and Profile */}
      <div className="map-overlay-top">
        <div className="top-bar">
          <div className="search-row">
            <div className="search-wrapper">
              <MapSearch onSearch={(v) => setQuery(v)} />
            </div>
            <button className="filter-toggle-btn" onClick={() => {
              if (isRestricted) {
                showToast("Шүүлтүүр ашиглахын тулд эрхээ идэвхжүүлнэ үү", "warning");
                return;
              }
              setIsFilterOpen(true);
            }}>
              {isRestricted ? <FaLock /> : <FaFilter />}
            </button>
          </div>
          <div className="profile-wrapper" onClick={() => navigate('/profile')}>
            <img 
              src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=random"} 
              alt="Profile" 
              className="profile-avatar"
            />
          </div>
        </div>
        
        <div className="filter-container">
          <MapCategoryFilter 
            selectedCategory={selectedCategory} 
            onSelectCategory={(cat) => {
              if (isRestricted) {
                showToast("Шүүлтүүр ашиглахын тулд эрхээ идэвхжүүлнэ үү", "warning");
                return;
              }
              setSelectedCategory(cat);
            }}
            categories={availableCategories}
          />
        </div>
      </div>

      <FilterPanel 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
        centers={visibleCenters}
        onCenterClick={handleCenterClick}
      />

      <div className="map-wrapper">
        <MapContainer
          center={[47.9188, 106.9176]} // Ulaanbaatar default
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          whenCreated={setMapInstance}
          ref={setMapInstance}
        >
          {getTileLayer()}
          <ZoomControl position="bottomright" />
          
          {userLocation && (
            <CircleMarker 
              center={userLocation}
              radius={8}
              pathOptions={{ color: 'white', fillColor: '#2563eb', fillOpacity: 1, weight: 2 }}
            >
              <Popup>Таны байршил</Popup>
            </CircleMarker>
          )}

          <MapCenters 
            key={refreshKey}  
            selectedCategory={selectedCategory}
            searchQuery={query}
            filters={filters}
            onCentersUpdate={setVisibleCenters}
            onCategoriesUpdate={setAvailableCategories}
          />
        </MapContainer>

        <MapTools 
          onRefresh={handleRefresh}
          onStyleChange={setMapStyle}
          currentStyle={mapStyle}
          onLocate={handleLocate}
        />
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <style jsx>{`
        .map-view-container {
          height: 100dvh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .map-overlay-top {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 800;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 16px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 100%);
          pointer-events: none;
        }

        .top-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 16px;
          pointer-events: auto;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }

        .search-row {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .search-wrapper {
          flex: 1;
        }

        .filter-toggle-btn {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .filter-toggle-btn:active {
          transform: scale(0.95);
        }

        .profile-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          overflow: hidden;
          border: 2px solid white;
          flex-shrink: 0;
        }

        .profile-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .filter-container {
          pointer-events: auto;
        }

        .map-wrapper {
          flex: 1;
          position: relative;
          z-index: 1;
        }
        
        /* Adjust Zoom Control Position */
        :global(.leaflet-control-zoom) {
          margin-bottom: 20px !important; /* Lowered to avoid overlap with MapTools */
          margin-right: 16px !important;
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        :global(.leaflet-control-zoom-in),
        :global(.leaflet-control-zoom-out) {
          border-radius: 8px !important;
          width: 40px !important;
          height: 40px !important;
          line-height: 40px !important;
          color: #374151 !important;
          margin-bottom: 4px !important; /* Reduced gap */
        }
      `}</style>
    </div>
  );
}
