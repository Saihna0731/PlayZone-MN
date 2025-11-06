import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import MapView from "./router/MapView";
import List from "./router/List";
import Booking from "./router/Booking";
import Profile from "./router/Profile";
import CenterDetail from "./router/CenterDetail";
import AuthChoice from "./router/AuthChoice";
import Reels from "./router/Reels";
import BottomNav from "./components/MainNavbars/BottomNav";
import Login from "./components/Login";
import Register from "./components/Register";
import { AuthProvider } from "./contexts/AuthContext";
import GlobalToast from "./components/GlobalToast";

function App() {
  const location = useLocation();
  const hideNav = ["/login", "/register", "/auth", "/reels"].includes(location.pathname) || location.pathname.startsWith('/center/');
  const lockScroll = location.pathname === '/map' || location.pathname === '/reels';
  return (
    <AuthProvider>
      <div style={{ height: "100vh", width: "100vw", overflow: lockScroll ? "hidden" : "auto", position: "relative" }}>
        <Routes>
          <Route path="/" element={<Navigate to="/map" replace />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/list" element={<List />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth" element={<AuthChoice />} />
          <Route path="/center/:id" element={<CenterDetail />} />
        </Routes>
        {!hideNav && <BottomNav />}
        <GlobalToast />
      </div>
    </AuthProvider>
  );
}

export default App;
