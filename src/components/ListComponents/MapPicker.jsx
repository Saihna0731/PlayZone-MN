import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// small fix for default icon in many builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png")
});

function ClickableMap({ initialPosition = [47.92, 106.92], onSelect }) {
  useMapEvents({
    click(e) {
      onSelect([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

export default function MapPicker({ initialPosition, onCancel, onConfirm }) {
  const [pos, setPos] = useState(initialPosition || null);

  return (
    <div style={{ width: "100%", height: "400px" }}>
      <MapContainer center={initialPosition || [47.92, 106.92]} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {pos && <Marker position={[pos[0], pos[1]]} />}
        <ClickableMap
          initialPosition={initialPosition}
          onSelect={(latlng) => {
            setPos(latlng);
          }}
        />
      </MapContainer>

      <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={() => onCancel && onCancel()}>Cancel</button>
        <button onClick={() => onConfirm && onConfirm({ lat: pos ? pos[0] : null, lng: pos ? pos[1] : null })} disabled={!pos}>
          Confirm location
        </button>
      </div>
    </div>
  );
}