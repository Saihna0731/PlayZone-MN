import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import BottomNav from "../components/MainNavbars/BottomNav";
import SimpleCalendar from "../components/LittleComponents/SimpleCalendar.jsx";
import { API_BASE } from "../config";
import { FaCalendarAlt, FaClock, FaMoneyBillWave } from "react-icons/fa";
import "../styles/List.css";

export default function Booking() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [bookingHistory, setBookingHistory] = useState([]);
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [ownedCenters, setOwnedCenters] = useState([]);
  const [hasCenters, setHasCenters] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateBookings, setSelectedDateBookings] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [activeTab, setActiveTab] = useState("all");

  const isCenterOwner = user?.accountType === 'centerOwner' || user?.role === 'centerOwner';

  const subscription = user?.subscription;
  const trial = user?.trial;
  const canAccessBooking = subscription?.plan === "normal" || 
                           trial?.plan === "trial" ||
                           subscription?.plan === "business_standard" || 
                           subscription?.plan === "business_pro" ||
                           isCenterOwner;

  const pendingRequests = ownerBookings.filter(b => b.status === 'pending');
  const pendingRequestCount = pendingRequests.length;

  const fetchBookingHistory = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/bookings/my`, { headers: { Authorization: `Bearer ${token}` } });
      setBookingHistory(res.data || []);
    } catch (error) { setBookingHistory([]); }
    finally { setLoading(false); }
  }, [user]);

  const fetchOwnerData = useCallback(async () => {
    if (!user || !isCenterOwner) { setLoading(false); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const centersRes = await axios.get(`${API_BASE}/api/centers/my-centers`, { headers: { Authorization: `Bearer ${token}` } });
      if (centersRes.data && centersRes.data.length > 0) {
        setOwnedCenters(centersRes.data);
        setHasCenters(true);
        const allOwnerBookings = [];
        const seenBookingIds = new Set();
        for (const center of centersRes.data) {
          try {
            const centerId = center._id || center.id;
            const bookingsRes = await axios.get(`${API_BASE}/api/bookings/center/${centerId}`, { headers: { Authorization: `Bearer ${token}` } });
            if (bookingsRes.data && Array.isArray(bookingsRes.data)) {
              for (const booking of bookingsRes.data) {
                const bookingId = booking._id || booking.id;
                if (!seenBookingIds.has(bookingId)) {
                  seenBookingIds.add(bookingId);
                  allOwnerBookings.push(booking);
                }
              }
            }
          } catch (err) {}
        }
        setOwnerBookings(allOwnerBookings);
      } else {
        setOwnedCenters([]); setHasCenters(false); setOwnerBookings([]);
      }
    } catch (error) { setOwnedCenters([]); setHasCenters(false); setOwnerBookings([]); }
    finally { setLoading(false); }
  }, [user, isCenterOwner]);

  useEffect(() => {
    if (!authLoading && user) {
      if (isCenterOwner) { fetchOwnerData(); } else { fetchBookingHistory(); }
    } else if (!authLoading) { setLoading(false); }
  }, [authLoading, user, isCenterOwner, fetchBookingHistory, fetchOwnerData]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/api/bookings/${bookingId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setOwnerBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b));
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: newStatus === 'confirmed' ? 'Захиалга баталгаажлаа!' : 'Захиалга цуцлагдлаа' } }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Төлөв өөрчлөхөд алдаа гарлаа' } }));
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏳</div>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>Ачааллаж байна...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", paddingBottom: "100px" }}>
        <div style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", padding: "20px", paddingTop: "env(safe-area-inset-top, 20px)", color: "white" }}>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>📋 Захиалгууд</h1>
        </div>
        <div style={{ padding: "20px" }}>
          <div style={{ background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", padding: "40px 20px", borderRadius: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔐</div>
            <h3 style={{ color: "#d84315", marginBottom: "8px", fontSize: "18px", fontWeight: "700" }}>Нэвтэрч захиалгуудаа харъаарай!</h3>
            <p style={{ color: "#bf360c", margin: "0 0 20px 0", fontSize: "14px" }}>Нэвтэрснээр Gaming төвүүдийн мэдээллийг харж, захиалга өгч болно</p>
            <button onClick={() => navigate("/login")} style={{ padding: "14px 28px", background: "#d84315", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontSize: "15px", fontWeight: "700" }}>Нэвтрэх</button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!canAccessBooking && !isCenterOwner) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", paddingBottom: "100px" }}>
        <div style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", padding: "20px", paddingTop: "env(safe-area-inset-top, 20px)", color: "white" }}>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>📋 Миний захиалгууд</h1>
        </div>
        <div style={{ padding: "20px" }}>
          <div style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", padding: "40px 20px", borderRadius: "20px", textAlign: "center", border: "2px solid #f59e0b" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>💎</div>
            <h3 style={{ color: "#92400e", marginBottom: "8px", fontSize: "18px", fontWeight: "700" }}>Premium эрх шаардлагатай</h3>
            <p style={{ color: "#b45309", margin: "0 0 20px 0", fontSize: "14px", lineHeight: "1.6" }}>Захиалга хийх боломжтой болохын тулд Normal эсвэл Business эрх идэвхжүүлнэ үү</p>
            <button onClick={() => navigate("/profile")} style={{ padding: "14px 28px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontSize: "15px", fontWeight: "700", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)" }}>Эрх шинэчлэх</button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { bg: "#fef3c7", text: "#92400e", icon: "⏳", label: "Хүлээгдэж байна" },
      confirmed: { bg: "#d1fae5", text: "#065f46", icon: "✅", label: "Баталгаажсан" },
      cancelled: { bg: "#fee2e2", text: "#991b1b", icon: "❌", label: "Цуцлагдсан" },
      completed: { bg: "#e0e7ff", text: "#3730a3", icon: "🎉", label: "Дууссан" }
    };
    return statusMap[status] || statusMap.pending;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) { days.push(null); }
    for (let i = 1; i <= lastDay.getDate(); i++) { days.push(new Date(year, month, i)); }
    return days;
  };

  const hasBookingOnDate = (date) => {
    if (!date) return false;
    const bookings = isCenterOwner ? ownerBookings : bookingHistory;
    return bookings.some(booking => new Date(booking.date).toDateString() === date.toDateString());
  };

  const getBookingsForDate = (date) => {
    if (!date) return [];
    const bookings = isCenterOwner ? ownerBookings : bookingHistory;
    return bookings.filter(booking => new Date(booking.date).toDateString() === date.toDateString());
  };

  const monthNames = ["1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар", "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар"];

  // CENTER OWNER VIEW
  if (isCenterOwner) {
    const displayBookings = activeTab === 'pending' ? pendingRequests : ownerBookings;
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", paddingBottom: "100px" }}>
        <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", padding: "20px", paddingTop: "env(safe-area-inset-top, 20px)", color: "white" }}>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "800" }}>📋 Ирсэн захиалгууд</h1>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>Төвийнхөө захиалгуудыг удирдах</p>
        </div>
        
        <div style={{ padding: "16px", paddingBottom: "0" }}>
          <div style={{ display: "flex", background: "#e5e7eb", borderRadius: "12px", padding: "4px" }}>
            <button onClick={() => setActiveTab("all")} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", background: activeTab === "all" ? "white" : "transparent", color: activeTab === "all" ? "#1f2937" : "#6b7280", boxShadow: activeTab === "all" ? "0 2px 8px rgba(0,0,0,0.1)" : "none" }}>📋 Бүх ({ownerBookings.length})</button>
            <button onClick={() => setActiveTab("pending")} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", background: activeTab === "pending" ? "white" : "transparent", color: activeTab === "pending" ? "#1f2937" : "#6b7280", boxShadow: activeTab === "pending" ? "0 2px 8px rgba(0,0,0,0.1)" : "none", position: "relative" }}>⏳ Хүлээгдэж ({pendingRequestCount}){pendingRequestCount > 0 && <span style={{ position: "absolute", top: "4px", right: "8px", width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%" }} />}</button>
          </div>
        </div>
        
        <div style={{ padding: "16px", paddingBottom: "0" }}>
          <div style={{ display: "flex", background: "#e5e7eb", borderRadius: "12px", padding: "4px" }}>
            <button onClick={() => setViewMode("list")} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", background: viewMode === "list" ? "white" : "transparent", color: viewMode === "list" ? "#1f2937" : "#6b7280" }}>📝 Жагсаалт</button>
            <button onClick={() => setViewMode("calendar")} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", background: viewMode === "calendar" ? "white" : "transparent", color: viewMode === "calendar" ? "#1f2937" : "#6b7280" }}>📅 Календар</button>
          </div>
        </div>
        
        <div style={{ padding: "16px" }}>
          {!hasCenters ? (
            <div style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", padding: "40px 20px", borderRadius: "20px", textAlign: "center", border: "2px solid #f59e0b" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
              <h3 style={{ color: "#92400e", marginBottom: "8px", fontSize: "18px", fontWeight: "700" }}>Төв бүртгэгдээгүй байна</h3>
              <p style={{ color: "#b45309", margin: "0 0 20px 0", fontSize: "14px" }}>Game Center Control хуудсанд төвөө бүртгүүлнэ үү</p>
              <button onClick={() => navigate("/game-center-control")} style={{ padding: "14px 28px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontSize: "15px", fontWeight: "700" }}>🎮 Төв нэмэх</button>
            </div>
          ) : viewMode === "calendar" ? (
            <div style={{ marginBottom: "20px" }}>
              <SimpleCalendar bookings={displayBookings.filter(b => b.status === 'confirmed' || b.status === 'pending')} onDateClick={(date, bookingsForDate) => { setSelectedDate(date); setSelectedDateBookings(bookingsForDate); }} />
              {selectedDateBookings.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#1f2937", margin: "0 0 12px 0" }}>{selectedDate.toLocaleDateString("mn-MN")} - {selectedDateBookings.length} захиалга</h4>
                  {selectedDateBookings.map(booking => <BookingCard key={booking._id} booking={booking} isOwner={true} onStatusUpdate={handleStatusUpdate} getStatusInfo={getStatusInfo} />)}
                </div>
              )}
            </div>
          ) : displayBookings.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {displayBookings.map(booking => <BookingCard key={booking._id} booking={booking} isOwner={true} onStatusUpdate={handleStatusUpdate} getStatusInfo={getStatusInfo} />)}
            </div>
          ) : (
            <div style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)", padding: "40px 20px", borderRadius: "20px", textAlign: "center", border: "2px solid #818cf8" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
              <h3 style={{ margin: "0 0 8px 0", color: "#3730a3", fontSize: "18px", fontWeight: "700" }}>{activeTab === 'pending' ? 'Хүлээгдэж буй захиалга байхгүй' : 'Захиалга байхгүй байна'}</h3>
              <p style={{ color: "#4338ca", margin: 0, fontSize: "14px" }}>{activeTab === 'pending' ? 'Бүх захиалга баталгаажсан байна' : 'Хэрэглэгчид захиалга өгөхөд энд харагдана'}</p>
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  // REGULAR USER VIEW
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", paddingBottom: "100px" }}>
      <div style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", padding: "20px", paddingTop: "env(safe-area-inset-top, 20px)", color: "white" }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "800" }}>📋 Миний захиалгууд</h1>
        <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>Gaming төвүүдийн захиалгууд</p>
      </div>
      
      <div style={{ padding: "16px", paddingBottom: "0" }}>
        <div style={{ display: "flex", background: "#e5e7eb", borderRadius: "12px", padding: "4px" }}>
          <button onClick={() => setViewMode("list")} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", background: viewMode === "list" ? "white" : "transparent", color: viewMode === "list" ? "#1f2937" : "#6b7280" }}>📝 Жагсаалт</button>
          <button onClick={() => setViewMode("calendar")} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", background: viewMode === "calendar" ? "white" : "transparent", color: viewMode === "calendar" ? "#1f2937" : "#6b7280" }}>📅 Календар</button>
        </div>
      </div>
      
      <div style={{ padding: "16px" }}>
        {viewMode === "calendar" ? (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))} style={{ background: "#f3f4f6", border: "none", width: "40px", height: "40px", borderRadius: "10px", fontSize: "18px", cursor: "pointer" }}>←</button>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>{selectedDate.getFullYear()} оны {monthNames[selectedDate.getMonth()]}</h3>
              <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))} style={{ background: "#f3f4f6", border: "none", width: "40px", height: "40px", borderRadius: "10px", fontSize: "18px", cursor: "pointer" }}>→</button>
            </div>
            <div style={{ background: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "8px" }}>
                {["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"].map(day => (<div key={day} style={{ textAlign: "center", fontSize: "12px", fontWeight: "700", color: "#9ca3af", padding: "8px 0" }}>{day}</div>))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                {getDaysInMonth(selectedDate).map((day, index) => {
                  const hasBooking = hasBookingOnDate(day);
                  const isToday = day && day.toDateString() === new Date().toDateString();
                  return (<div key={index} onClick={() => day && hasBooking && setSelectedDate(day)} style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: "10px", cursor: day && hasBooking ? "pointer" : "default", background: isToday ? "#3b82f6" : hasBooking ? "#e0e7ff" : "transparent", color: isToday ? "white" : day ? "#1f2937" : "#d1d5db", fontSize: "14px", fontWeight: day ? "600" : "400", position: "relative" }}>{day ? day.getDate() : ""}{hasBooking && !isToday && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3b82f6", position: "absolute", bottom: "4px" }} />}</div>);
                })}
              </div>
            </div>
            {getBookingsForDate(selectedDate).length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#1f2937", margin: "0 0 12px 0" }}>{selectedDate.toLocaleDateString("mn-MN")} өдрийн захиалга</h4>
                {getBookingsForDate(selectedDate).map(booking => {
                  const statusInfo = getStatusInfo(booking.status);
                  return (<div key={booking._id} style={{ background: "white", borderRadius: "12px", padding: "14px", marginBottom: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontWeight: "700", fontSize: "14px", color: "#1f2937" }}>{booking.center?.name || "Төв"}</div><div style={{ fontSize: "13px", color: "#6b7280" }}>🕐 {booking.time}</div></div><span style={{ padding: "4px 10px", borderRadius: "8px", background: statusInfo.bg, color: statusInfo.text, fontSize: "11px", fontWeight: "700" }}>{statusInfo.icon} {statusInfo.label}</span></div></div>);
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#1f2937", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>🎮 Захиалгууд ({bookingHistory.length})</h2>
            {bookingHistory.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {bookingHistory.map((booking) => {
                  const center = booking.center;
                  const statusInfo = getStatusInfo(booking.status);
                  return (<div key={booking._id} style={{ background: "#ffffff", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}><div style={{ flex: 1 }}><div style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>{center?.name || "Тодорхойгүй төв"}</div><div style={{ fontSize: "13px", color: "#6b7280" }}>📅 {new Date(booking.date).toLocaleDateString("mn-MN")} | 🕐 {booking.time}</div></div><div style={{ padding: "6px 12px", borderRadius: "12px", background: statusInfo.bg, color: statusInfo.text, fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>{statusInfo.icon} {statusInfo.label}</div></div>{booking.type && <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>🎮 {booking.type} {booking.seats && ` • ${booking.seats} суудал`}</div>}{booking.price && <div style={{ fontSize: "15px", fontWeight: "700", color: "#3b82f6", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #f0f0f0" }}>💰 {booking.price.toLocaleString()}₮</div>}</div>);
                })}
              </div>
            ) : (
              <div style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)", padding: "40px 20px", borderRadius: "20px", textAlign: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", border: "2px solid #818cf8" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
                <h3 style={{ margin: "0 0 8px 0", color: "#3730a3", fontSize: "18px", fontWeight: "700" }}>Захиалга байхгүй байна</h3>
                <p style={{ color: "#4338ca", margin: "0 0 20px 0", fontSize: "14px", lineHeight: "1.6" }}>Gaming төвүүд дээрээ дарж захиалга үүсгэнэ үү</p>
                <Link to="/list" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 28px", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "white", textDecoration: "none", borderRadius: "14px", fontWeight: "700", fontSize: "15px", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)" }}>🎮 Захиалах</Link>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function BookingCard({ booking, isOwner, onStatusUpdate, getStatusInfo }) {
  const statusInfo = getStatusInfo(booking.status);
  return (
    <div style={{ background: "#ffffff", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0", marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "18px" }}>{booking.user?.fullName?.charAt(0) || "?"}</div>
          <div><div style={{ fontWeight: "700", fontSize: "15px", color: "#1f2937" }}>{booking.user?.fullName || "Unknown"}</div><div style={{ fontSize: "12px", color: "#6b7280" }}>📱 {booking.user?.phone || "N/A"}</div></div>
        </div>
        <div style={{ padding: "6px 12px", borderRadius: "12px", background: statusInfo.bg, color: statusInfo.text, fontSize: "12px", fontWeight: "700" }}>{statusInfo.icon} {statusInfo.label}</div>
      </div>
      <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "12px", marginBottom: "12px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "13px", color: "#4b5563" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><FaCalendarAlt /> {booking.date}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><FaClock /> {booking.time}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><FaMoneyBillWave /> {booking.price}₮</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>🎮 {booking.type === 'vip' ? 'VIP' : 'Энгийн'} - {booking.duration} цаг</div>
        </div>
      </div>
      {isOwner && booking.status === 'pending' && (
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => onStatusUpdate(booking._id, 'confirmed')} style={{ flex: 1, padding: "12px", border: "none", borderRadius: "10px", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>✅ Зөвшөөрөх</button>
          <button onClick={() => onStatusUpdate(booking._id, 'cancelled')} style={{ flex: 1, padding: "12px", border: "2px solid #ef4444", borderRadius: "10px", background: "white", color: "#ef4444", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>❌ Цуцлах</button>
        </div>
      )}
      {isOwner && booking.status === 'confirmed' && (
        <button onClick={() => onStatusUpdate(booking._id, 'cancelled')} style={{ width: "100%", padding: "12px", border: "2px solid #ef4444", borderRadius: "10px", background: "white", color: "#ef4444", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>❌ Цуцлах</button>
      )}
    </div>
  );
}
