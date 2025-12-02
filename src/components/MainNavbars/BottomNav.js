import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaMapMarkedAlt, FaList, FaUser, FaGamepad } from "react-icons/fa";
import { MdOutlineAssignment, MdVideoLibrary } from "react-icons/md";
import { useAuth } from "../../contexts/AuthContext";
import '../../styles/BottomNav.css';

function BottomNav() {
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  
  // Check if user is owner or admin
  const isOwner = user?.accountType === 'centerOwner' || user?.role === 'centerOwner';
  const showGameControl = isOwner || isAdmin;

  const navItems = [
    { path: "/map", icon: <FaMapMarkedAlt />, label: "Газрын зураг" },
    { path: "/list", icon: <FaList />, label: "Жагсаалт" },
    // Show Game Control for owners/admins, Reels for others
    ...(showGameControl 
      ? [{ path: "/game-center-control", icon: <FaGamepad />, label: "Төв удирдах" }]
      : [{ path: "/reels", icon: <MdVideoLibrary />, label: "Reels" }]
    ),
    { path: "/booking", icon: <MdOutlineAssignment />, label: "Захиалга" },
    { path: "/profile", icon: <FaUser />, label: "Профайл" },
  ];

  return (
    <div className="bottom-nav-wrapper">
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${active ? 'active' : ''}`}
            >
              <div className="nav-icon">{item.icon}</div>
              <span className="nav-label">{item.label}</span>
              {active && <div className="nav-indicator" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default BottomNav;
