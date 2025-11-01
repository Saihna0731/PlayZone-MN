import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";

function MapSearch({ onSearch, placeholder = "Нэр, хаяг, бонус ('сул суудал')..." }) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <form onSubmit={handleSearch} style={{
      display: "flex",
      alignItems: "center",
      background: "rgba(255,255,255,0.95)",
      borderRadius: "22px",
      padding: "6px 12px",
      backdropFilter: "blur(10px)",
      boxShadow: "0 3px 15px rgba(0,0,0,0.15)",
      border: "1px solid rgba(255,255,255,0.2)",
      width: "100%",
      height: "40px"
    }}>
      <FaSearch style={{ 
        color: "#1976d2", 
        marginRight: "8px",
        fontSize: "14px"
      }} />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          fontSize: "13px",
          background: "transparent",
          color: "#333",
          fontWeight: "400"
        }}
      />
      <button
        type="submit"
        style={{
          background: "linear-gradient(45deg, #1976d2, #42a5f5)",
          color: "#fff",
          border: "none",
          borderRadius: "18px",
          padding: "6px 12px",
          fontSize: "12px",
          cursor: "pointer",
          marginLeft: "6px",
          fontWeight: "600",
          height: "28px",
          boxShadow: "0 2px 6px rgba(25,118,210,0.3)",
          transition: "all 0.2s ease",
          minWidth: "50px"
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-1px)";
          e.target.style.boxShadow = "0 3px 8px rgba(25,118,210,0.4)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 2px 6px rgba(25,118,210,0.3)";
        }}
      >
        🔍
      </button>
    </form>
  );
}

export default MapSearch;
