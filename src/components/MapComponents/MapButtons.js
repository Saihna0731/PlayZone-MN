import React from "react";
import { FaSatellite, FaMapMarkedAlt } from "react-icons/fa";

export default function MapButtons({
  isSatellite = false,
  setIsSatellite = () => {},
  // optional customization
  labelOn = "Сателлит",
  labelOff = "Стандарт",
  style: userStyle = {},
  className = ""
}) {
  const bg = isSatellite ? "#0ea5e9" : "#06b6d4";
  const text = isSatellite ? labelOn : labelOff;
  return (
    <button
      type="button"
      aria-pressed={!!isSatellite}
      onClick={() => setIsSatellite(!isSatellite)}
      className={className}
      onMouseEnter={(e) => {
        e.target.style.transform = "translateY(-2px)";
        e.target.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = "translateY(0)";
        e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: `linear-gradient(45deg, ${bg}, ${isSatellite ? '#0288d1' : '#00acc1'})`,
        color: "#fff",
        border: "none",
        borderRadius: 25,
        padding: "10px 16px",
        cursor: "pointer",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        backdropFilter: "blur(10px)",
        transition: "all 300ms ease",
        fontSize: "13px",
        lineHeight: 1,
        minWidth: "110px",
        justifyContent: "center",
        height: "40px",
        fontWeight: "600",
        ...userStyle
      }}
    >
      {isSatellite ? <FaMapMarkedAlt size={18} /> : <FaSatellite size={18} />}
      <span style={{ whiteSpace: "nowrap", fontWeight: 600 }}>{text}</span>
    </button>
  );
}
