import React from "react";
import { FiRefreshCw } from "react-icons/fi";

export default function MapRefreshButton({ onClick, loading = false }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: "56px",
        height: "56px",
        borderRadius: "14px",
        border: "none",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        boxShadow: "0 4px 18px rgba(102, 126, 234, 0.45)",
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        opacity: loading ? 0.85 : 1,
        position: "relative",
        overflow: "hidden"
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = "translateY(-3px) scale(1.05)";
          e.currentTarget.style.boxShadow = "0 6px 28px rgba(102, 126, 234, 0.55)";
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 18px rgba(102, 126, 234, 0.45)";
        }
      }}
      title="Газрын зургийг шинэчлэх"
    >
      <FiRefreshCw 
        size={24} 
        color="#ffffff"
        style={{
          animation: loading ? "spin 1s linear infinite" : "none",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
        }}
      />
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </button>
  );
}