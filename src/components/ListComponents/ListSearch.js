import React from "react";

export default function ListSearch({ value, onChange }) {
  const handleClear = () => {
    if (onChange) {
      onChange("");
    }
  };

  return (
    <div style={{ 
      position: "relative", 
      width: "100%",
      marginBottom: "0px"
    }}>
      <input
        type="text"
        placeholder="Game Center хайх... (нэр, хаяг)"
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 70px 10px 16px",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          outline: "none",
          fontSize: "14px",
          fontWeight: "400",
          background: "#fff",
          color: "#333",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          transition: "all 0.3s ease",
          height: "36px",
          boxSizing: "border-box"
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#1976d2";
          e.target.style.boxShadow = "0 0 0 2px rgba(25, 118, 210, 0.1)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e0e0e0";
          e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
        }}
      />
      
      {/* Search icon */}
      <div
        style={{
          position: "absolute",
          right: value && value.length > 0 ? "40px" : "12px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#1976d2",
          fontSize: "16px",
          pointerEvents: "none"
        }}
      >
        🔍
      </div>

      {/* Clear button */}
      {value && value.length > 0 && (
        <button
          onClick={handleClear}
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "#999",
            fontSize: "16px",
            cursor: "pointer",
            padding: "2px",
            borderRadius: "50%",
            width: "20px",
            height: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#f0f0f0";
            e.target.style.color = "#666";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "none";
            e.target.style.color = "#999";
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
