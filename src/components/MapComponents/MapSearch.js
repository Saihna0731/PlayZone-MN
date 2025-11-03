import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";

function MapSearch({ onSearch, placeholder = "Нэр, хаяг, бонус ('сул суудал')..." }) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  // Бичих болгонд шүүж (debounce 300ms)
  useEffect(() => {
    const id = setTimeout(() => {
      if (onSearch) onSearch(searchQuery);
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery, onSearch]);

  return (
    <form onSubmit={handleSearch} style={{
      display: "flex",
      alignItems: "center",
      background: "rgba(255,255,255,0.98)",
      borderRadius: "14px",
      padding: "8px 14px",
      backdropFilter: "blur(12px)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
      border: "1px solid rgba(102, 126, 234, 0.15)",
      width: "100%",
      height: "48px"
    }}>
      <FaSearch style={{ 
        color: "#667eea", 
        marginRight: "10px",
        fontSize: "16px"
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
          fontSize: "14px",
          background: "transparent",
          color: "#333",
          fontWeight: "500"
        }}
      />
      <button
        type="submit"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          padding: "8px 16px",
          fontSize: "13px",
          cursor: "pointer",
          marginLeft: "8px",
          fontWeight: "600",
          height: "34px",
          boxShadow: "0 3px 8px rgba(102, 126, 234, 0.3)",
          transition: "all 0.2s ease",
          minWidth: "60px"
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-1px)";
          e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 3px 8px rgba(102, 126, 234, 0.3)";
        }}
      >
        Хайх
      </button>
    </form>
  );
}

export default MapSearch;
