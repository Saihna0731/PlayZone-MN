import React from "react";

export default function MapRefreshButton({ onClick, loading = false }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        border: "none",
        background: "rgba(255, 255, 255, 0.95)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.2rem",
        transition: "all 0.3s ease",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        opacity: loading ? 0.7 : 1,
        animation: loading ? "spin 1s linear infinite" : "none",
        marginBottom: "8px"
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.target.style.transform = "scale(1.1)";
          e.target.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.2)";
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.target.style.transform = "scale(1)";
          e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
        }
      }}
      title="Газрын зургийг шинэчлэх"
    >
      🔄
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