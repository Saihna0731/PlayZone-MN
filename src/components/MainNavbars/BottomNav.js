import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaMapMarkedAlt, FaList, FaUser } from "react-icons/fa";
import { MdOutlineAssignment } from "react-icons/md";
import '../../styles/BottomNav.css';

function BottomNav() {
  const location = useLocation();

  const navItems = [
    { path: "/map", icon: <FaMapMarkedAlt />, label: "Газрын зураг" },
    { path: "/list", icon: <FaList />, label: "Жагсаалт" },
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
