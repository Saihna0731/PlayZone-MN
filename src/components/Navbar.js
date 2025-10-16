import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Navbar(props) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav style={{ 
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
      padding: "12px 16px", 
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    }} className="navbar">
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <h2 style={{ margin: 0, fontSize: "1.5rem" }}>🎮 PC Center</h2>
        {isAdmin && (
          <span style={{ 
            background: "rgba(255,255,255,0.2)", 
            padding: "4px 8px", 
            borderRadius: "12px", 
            fontSize: "0.8rem",
            fontWeight: "600"
          }}>
            👑 Админ
          </span>
        )}
      </div>
      
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {isAuthenticated ? (
          <>
            <Link 
              to="/profile" 
              style={{ 
                color: "white", 
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.1)",
                fontSize: "0.9rem",
                fontWeight: "500"
              }}
            >
              👤 {user?.fullName || user?.username}
            </Link>
            <button 
              onClick={handleLogout}
              style={{ 
                padding: "6px 12px", 
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.1)",
                color: "white",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.9rem"
              }}
            >
              🚪 Гарах
            </button>
          </>
        ) : (
          <>
            <Link 
              to="/login" 
              style={{ 
                color: "white", 
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.1)",
                fontSize: "0.9rem",
                fontWeight: "500"
              }}
            >
              🚀 Нэвтрэх
            </Link>
            <Link 
              to="/register" 
              style={{ 
                color: "white", 
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.2)",
                fontSize: "0.9rem",
                fontWeight: "500"
              }}
            >
              🎉 Бүртгүүлэх
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
