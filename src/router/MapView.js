import React, { useState, useEffect, useCallback } from "react";
import MapHeader from "../components/MapComponents/MapHeader";
import MapSearch from "../components/MapComponents/MapSearch";
import MapButtons from "../components/MapComponents/MapButtons";
import MapRefreshButton from "../components/MapComponents/MapRefreshButton";
import MapCenters from "../components/MapComponents/MapCenters";
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
        height: "100vh",
        width: "100vw",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <MapHeader />
      <main style={{ height: "calc(100% - 56px)", width: "100%", position: 'relative' }}>
        <MapCenters key={refreshKey} query={query} mapStyle={mapStyle} showToast={showToast} />

      <div
        style={{
          position: "fixed",
          top: 18,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1401,
          pointerEvents: "auto",
          width: "clamp(320px, 45vw, 720px)",
          maxWidth: "95vw",
        }}
      >
        <MapSearch onSearch={(v) => setQuery(v)} />
      </div>

      <div
        style={{
          position: "fixed",
          left: 18,
          bottom: 60,
          zIndex: 1401,
          pointerEvents: "auto",
        }}
      >
        <MapRefreshButton onClick={handleRefresh} loading={refreshLoading} />
        <MapRefreshButton onClick={handleRefresh} loading={refreshLoading} />
        <MapButtons isSatellite={isSatellite} setIsSatellite={setIsSatellite} />
      </div>
      </main>
    </div>
);
}
