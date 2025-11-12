import React, { useState, useEffect, useCallback } from "react";
import MapHeader from "../components/MapComponents/MapHeader";
import MapButtons from "../components/MapComponents/MapButtons";
import MapRefreshButton from "../components/MapComponents/MapRefreshButton";
import MapCenters from "../components/MapComponents/MapCenters";
import MapSearch from "../components/MapComponents/MapSearch";
import Toast from "../components/LittleComponents/Toast";
import { cacheUtils } from "../utils/cache";

export default function MapView() {
  const [query, setQuery] = useState("");
  const [isSatellite, setIsSatellite] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const mapStyle = isSatellite ? "sat" : "osm";

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const handleRefresh = async () => {
    setRefreshLoading(true);
    cacheUtils.clear('centers');
    setRefreshKey(prev => prev + 1);
    window.dispatchEvent(new CustomEvent("centers:updated"));
    setTimeout(() => {
      setRefreshLoading(false);
      showToast("Газрын зураг шинэчлэгдлээ", "success");
    }, 1000);
  };

  return (
    <div
      style={{
        height: "100dvh",
        width: "100vw",
        position: "relative",
        overflow: "hidden",
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <MapHeader />
      {/* Floating search over the map, mobile-friendly */}
      <div className="floating-search">
        <div className="search-inner">
          <MapSearch onSearch={(v) => setQuery(v)} />
        </div>
      </div>
      <main style={{ flex: 1, width: "100%", position: 'relative' }}>
        <MapCenters key={refreshKey} query={query} mapStyle={mapStyle} showToast={showToast} />

        <div className="bottom-controls">
          <MapRefreshButton onClick={handleRefresh} loading={refreshLoading} />
          <MapButtons isSatellite={isSatellite} setIsSatellite={setIsSatellite} />
        </div>
      </main>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
