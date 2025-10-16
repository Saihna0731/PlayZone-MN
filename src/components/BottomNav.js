import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaMapMarkedAlt, FaList, FaUser } from "react-icons/fa";
import { MdOutlineAssignment } from "react-icons/md";

function BottomNav() {
  const location = useLocation();

  const navItems = [
  { path: "/map", icon: <FaMapMarkedAlt />, label: "MapView" },
  { path: "/list", icon: <FaList />, label: "List" },
  { path: "/booking", icon: <MdOutlineAssignment />, label: "Миний захиалга" },
  { path: "/profile", icon: <FaUser />, label: "Profile" },
];

  return (
    <div style={styles.navContainer}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          style={location.pathname === item.path ? styles.activeButton : styles.button}
        >
          <div style={{ fontSize: "20px" }}>{item.icon}</div>
          <div style={{ fontSize: "12px" }}>{item.label}</div>
        </Link>
      ))}
    </div>
  );
}

const styles = {
  navContainer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60px",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTop: "1px solid #ccc",
    zIndex: 1000,
  },
  button: {
    flex: 1,
    height: "100%",
    textAlign: "center",
    textDecoration: "none",
    color: "#555",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  },
  activeButton: {
    flex: 1,
    height: "100%",
    textAlign: "center",
    textDecoration: "none",
    color: "#1976d2",
    fontWeight: "bold",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  },
};

export default BottomNav;
