import React from "react";
import MapPicker from "./ListComponents/MapPicker";

export default function PickerModal({ onCancel, onConfirm }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
      <div style={{ width: 800, maxWidth: "95%", background: "#fff", padding: 12, borderRadius: 8 }}>
        <h3>Pick location</h3>
        <MapPicker initialPosition={[47.92, 106.92]} onCancel={onCancel} onConfirm={onConfirm} />
      </div>
    </div>
  );
}