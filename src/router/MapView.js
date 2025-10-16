import React, { useState, useEffect } from "react";
import MapHeader from "../components/MapHeader";
import MapSearch from "../components/MapSearch";
import MapButtons from "../components/MapButtons";
import MapRefreshButton from "../components/MapRefreshButton";
import MapCenters from "../components/MapCenters";
import BottomNav from "../components/BottomNav";

export default function MapView() {
  const [query, setQuery] = useState("");
  const [isSatellite, setIsSatellite] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const mapStyle = isSatellite ? "sat" : "osm";

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshLoading(true);
    
    // Газрын зургийг шинэчлэх
    setRefreshKey(prev => prev + 1);
    
    // Centers updated event-ийг илгээх
    window.dispatchEvent(new CustomEvent("centers:updated"));
    
    // Loading animation-г харуулах
    setTimeout(() => {
      setRefreshLoading(false);
    }, 1000);
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <MapHeader />
      
      <main style={{ flex: 1, width: "100%", position: "relative" }}>
        <MapCenters query={query} mapStyle={mapStyle} key={refreshKey} />
        
        {/* Search bar - top center */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            pointerEvents: "auto",
            width: "70%",
            maxWidth: "280px"
          }}
        >
          <MapSearch onSearch={(searchQuery) => setQuery(searchQuery)} />
        </div>

        {/* Map buttons - bottom left */}
        <div
          style={{
            position: "absolute",
            left: "16px",
            bottom: "80px",
            zIndex: 1000,
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "8px"
          }}
        >
          <MapRefreshButton onClick={handleRefresh} loading={refreshLoading} />
          <MapButtons isSatellite={isSatellite} setIsSatellite={setIsSatellite} />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
