import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import MapView from "./router/MapView";
import ListModern from "./router/ListModern";
import Booking from "./router/Booking";
import Profile from "./router/Profile";
import CenterDetail from "./router/CenterDetail";
import Bonuses from "./router/Bonuses";
import AuthChoice from "./router/AuthChoice";
import Reels from "./router/Reels";
import Intro from "./router/Intro";
import BottomNav from "./components/MainNavbars/BottomNav";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import GlobalToast from "./components/LittleComponents/GlobalToast";

function HomeRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/map" replace /> : <Intro />;
}

function App() {
  const location = useLocation();
  const hideNav = ["/login", "/register", "/auth", "/reels", "/"].includes(location.pathname) || location.pathname.startsWith('/center/');
  const lockScroll = location.pathname === '/map' || location.pathname === '/reels';
  return (
    <AuthProvider>
      {/* Use percentage width to avoid 100vw scrollbar gap on pages with vertical scroll */}
      <div style={{ minHeight: "100vh", width: "100%", overflow: lockScroll ? "hidden" : "auto", position: "relative" }}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/list" element={<ListModern />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/auth" element={<AuthChoice />} />
          <Route path="/center/:id" element={<CenterDetail />} />
          <Route path="/bonuses" element={<Bonuses />} />
        </Routes>
        {!hideNav && <BottomNav />}
        <GlobalToast />
      </div>
    </AuthProvider>
  );
}

export default App;
