import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaPhone, FaMapMarkerAlt, FaClock, FaGlobe, FaEnvelope, FaStar, FaChevronLeft, FaChevronRight, FaExpand, FaTimes, FaBell, FaLock, FaGift } from "react-icons/fa";
import axios from "axios";
import { API_BASE } from "../config";
import "../styles/CenterDetail.css";
import BookingModal from "../components/LittleComponents/BookingModal";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import Toast from "../components/LittleComponents/Toast";

// Текстийг товчлох helper (unused) — устгав

export default function CenterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { canViewDetails, loading: subLoading } = useSubscription();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [centerData, setCenterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoModal, setVideoModal] = useState({ isOpen: false, content: null, title: "" });
  const [bonusPanelOpen, setBonusPanelOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Touch swipe state for image carousel
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleBookingConfirm = async (bookingData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setToast({ message: "Та эхлээд нэвтэрнэ үү", type: "error", id: Date.now() });
      throw new Error('No token');
    }

    await axios.post(`${API_BASE}/api/bookings`, { 
      centerId: id, 
      ...bookingData 
    }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000 // 15 seconds timeout
    });
    
    setBookingModalOpen(false);
    setToast({ message: "Захиалга амжилттай илгээгдлээ! Эзэмшигч баталгаажуулахыг хүлээнэ үү.", type: "success", id: Date.now() });
  };

  // Helper: Get high quality image
  const getHighQualityImage = (img) => {
    if (!img) return "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400&h=900&fit=crop&q=90&auto=format";
    let src = img;
    if (typeof img === 'object' && img.highQuality) {
      src = img.highQuality;
    } else if (typeof img === 'object' && img.url) {
      src = img.url;
    }
    
    // Enhance Unsplash quality if detected
    if (typeof src === 'string' && src.includes('images.unsplash.com')) {
       // Ensure high quality params
       if (!src.includes('q=')) src += '&q=100';
       else src = src.replace(/q=\d+/, 'q=100');
    }
    return src;
  };

  // Helper: responsive iframe renderer with provider-specific tweaks
  const ResponsiveEmbed = ({ src, title = 'Embedded Video' }) => {
    try {
      const u = new URL(src, window.location.href);
      const host = u.hostname || '';
      let isVertical = false;

      if (host.includes('youtube.com') || host.includes('youtu.be')) {
        if (/\/shorts\//i.test(u.pathname)) isVertical = true;
      }
      if (host.includes('facebook.com')) {
        // Normalize to plugins/video.php if a plain video/reel URL is provided
        if (!/\/plugins\/video\.php/i.test(u.pathname)) {
          const plugin = new URL('https://www.facebook.com/plugins/video.php');
          plugin.searchParams.set('href', u.toString());
          plugin.searchParams.set('show_text', '0');
          plugin.searchParams.set('playsinline', '1');
          plugin.searchParams.set('autoplay', '0');
          src = plugin.toString();
        } else {
          // Ensure params for good UX
          u.searchParams.set('show_text', u.searchParams.get('show_text') ?? '0');
          u.searchParams.set('playsinline', '1');
          u.searchParams.set('autoplay', '0');
          src = u.toString();
        }
        const href = new URL(src, window.location.href).searchParams.get('href') || '';
        if (/\/reel(s)?\//i.test(href)) isVertical = true;
      }

      const boxStyle = {
        position: 'relative',
        width: '100%',
        paddingTop: isVertical ? '150%' : '56.25%', // бага зэрэг томруулна
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#000'
      };
      const iframeStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 0,
        overflow: 'hidden'
      };
      const isFB = /facebook\.com/i.test(src);
      const allow = isFB
        ? 'clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen'
        : 'autoplay; encrypted-media; picture-in-picture; web-share; fullscreen';
      return (
        <div style={boxStyle} onClick={(e) => { e.stopPropagation(); setVideoModal({ isOpen: true, content: (
          <iframe src={src} title={title} allow={allow} allowFullScreen style={{ width:'100%', height:'100%', border:0 }} />
        ), title }); }}>
          <iframe src={src} title={title} allow={allow} allowFullScreen style={iframeStyle} />
        </div>
      );
    } catch {
      // Fallback simple iframe
      return (
        <div style={{ position:'relative', width:'100%', paddingTop:'56.25%', borderRadius:'12px', overflow:'hidden', background:'#000' }}>
          <iframe src={src} title={title} allow="autoplay; encrypted-media; picture-in-picture; web-share; fullscreen" allowFullScreen style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:0 }} />
        </div>
      );
    }
  };

  // Component: Video Card with Inline Play
  const VideoCard = ({ embed, index }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const cleanEmbed = embed.trim();

    // Extract dimensions
    const widthMatch = /width="(\d+)"/i.exec(cleanEmbed);
    const heightMatch = /height="(\d+)"/i.exec(cleanEmbed);
    let embedWidth = widthMatch ? parseInt(widthMatch[1]) : null;
    let embedHeight = heightMatch ? parseInt(heightMatch[1]) : null;

    // Detect vertical orientation - most social media videos are vertical
    let isVertical = /shorts\//i.test(cleanEmbed) || /reel(s)?\//i.test(cleanEmbed) || /instagram\.com\/p\//i.test(cleanEmbed) || /instagram\.com\/reel\//i.test(cleanEmbed) || /facebook\.com\//i.test(cleanEmbed) || /fb\.com\//i.test(cleanEmbed);
    if (embedWidth && embedHeight && !isVertical) {
        isVertical = embedHeight > embedWidth;
    }

    // Responsive video cards - mobile full width, desktop limited width
    const cardStyle = {
      position: 'relative',
      width: '100%',
      maxWidth: '500px', // Limit width on desktop
      aspectRatio: '9/16', // Consistent vertical aspect ratio
      borderRadius: 16,
      overflow: 'hidden',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      border: '1px solid rgba(0,0,0,0.1)',
      marginBottom: 12,
      margin: '0 auto 12px auto' // Center on desktop
    };

    const expandButtonStyle = {
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 10,
      background: 'rgba(0,0,0,0.6)',
      color: '#fff',
      border: 'none',
      borderRadius: '50%',
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      backdropFilter: 'blur(4px)'
    };

    // 1. Iframe Embeds - шууд тоглуулна (embed өөрөө play товчтой)
    if (cleanEmbed.includes('<iframe')) {
      const srcMatch = /src="([^"]+)"/i.exec(cleanEmbed);
      let src = srcMatch ? srcMatch[1] : '';
      
      // Facebook Autoplay Fix
      if (src && (src.includes('facebook.com') || src.includes('fb.com'))) {
          if (!src.includes('autoplay=')) {
               src += (src.includes('?') ? '&' : '?');
          }
      }

      return (
        <div style={cardStyle}>
          <iframe
            src={src}
            title={`Preview ${index + 1}`}
            allow="autoplay; encrypted-media; picture-in-picture; web-share; fullscreen"
            scrolling="no"
            style={{ width:'100%', height:'100%', border:0, objectFit:'contain' }}
          />

          {/* Expand Button */}
          <button 
            style={expandButtonStyle}
            onClick={(e) => {
              e.stopPropagation();
              setVideoModal({ isOpen: true, content: (<ResponsiveEmbed src={src} title="" />), title: "" });
            }}
            title="Томруулах"
          >
            <FaExpand size={14} />
          </button>
        </div>
      );
    }

    // 2. Video Tag
    if (cleanEmbed.includes('<video')) {
      return (
        <div style={cardStyle}>
           <div style={{position:'relative',width:'100%',height:'100%'}} dangerouslySetInnerHTML={{ __html: cleanEmbed.replace(/width="[^"]*"/g, '').replace(/height="[^"]*"/g, '').replace('<video','<video style="width:100%;height:100%;object-fit:cover;" ' + (isPlaying ? 'controls autoplay' : 'muted loop playsinline autoplay')) }} />
          
          {!isPlaying && (
            <div 
              onClick={() => setIsPlaying(true)}
              style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(transparent, rgba(0,0,0,0.35))', cursor: 'pointer'}}
            >
               <div style={{background:'rgba(255,255,255,0.95)', width:48, height:48, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#e11d48', fontWeight:900, boxShadow: '0 4px 12px rgba(0,0,0,0.2)'}}>▶</div>
            </div>
          )}

          <button 
            style={expandButtonStyle}
            onClick={(e) => {
              e.stopPropagation();
              setVideoModal({ isOpen: true, content: (<div style={{position:'relative',width:'100%',height:'100%'}} dangerouslySetInnerHTML={{ __html: cleanEmbed.replace(/width="[^"]*"/g, '').replace(/height="[^"]*"/g, '').replace('<video','<video style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;border:0;border-radius:12px;" controls autoplay') }} />), title: "" });
            }}
            title="Томруулах"
          >
            <FaExpand size={14} />
          </button>
        </div>
      );
    }

    // 3. YouTube
    if (cleanEmbed.includes('youtube.com/watch') || cleanEmbed.includes('youtu.be/')) {
      const videoId = cleanEmbed.includes('youtu.be/') 
        ? cleanEmbed.split('youtu.be/')[1].split('?')[0].split('&')[0]
        : cleanEmbed.split('v=')[1]?.split('&')[0];
      
      if (videoId) {
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        return (
          <div style={cardStyle}>
            {isPlaying ? (
               <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&controls=1&modestbranding=1&rel=0`}
                title=""
                allow="autoplay; encrypted-media; picture-in-picture; web-share; fullscreen"
                style={{width:'100%',height:'100%',border:0}}
                allowFullScreen
              />
            ) : (
              <>
                <div style={{position:'absolute', inset:0, backgroundImage:`url(${thumbnailUrl})`, backgroundSize:'cover', backgroundPosition:'center'}} />
                <div 
                  onClick={() => setIsPlaying(true)}
                  style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(transparent, rgba(0,0,0,0.35))', cursor: 'pointer'}}
                > 
                  <div style={{background:'rgba(255,255,255,0.95)', width:48, height:48, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#e11d48', fontWeight:900, boxShadow: '0 4px 12px rgba(0,0,0,0.2)'}}>▶</div>
                </div>
              </>
            )}

            <button 
              style={expandButtonStyle}
              onClick={(e) => {
                e.stopPropagation();
                setVideoModal({ isOpen: true, content: (
                  <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&controls=1&modestbranding=1&rel=0`}
                      title=""
                      allow="autoplay; encrypted-media; picture-in-picture; web-share; fullscreen"
                      style={{maxWidth:'100%',maxHeight:'100%',width:'100%',height:'100%',border:0}}
                      allowFullScreen
                    />
                  </div>
                ), title: "" });
              }}
              title="Томруулах"
            >
              <FaExpand size={14} />
            </button>
          </div>
        );
      }
    }

    // 4. Facebook
    if (cleanEmbed.includes('facebook.com/') || cleanEmbed.includes('fb.com/')) {
        let previewSrc = cleanEmbed;
        try {
            const u = new URL(cleanEmbed, window.location.href);
            if (!/\/plugins\/video\.php/i.test(u.pathname)) {
                const plugin = new URL('https://www.facebook.com/plugins/video.php');
                plugin.searchParams.set('href', u.toString());
                plugin.searchParams.set('show_text', '0');
                plugin.searchParams.set('playsinline', '1');
                plugin.searchParams.set('autoplay', isPlaying ? '1' : '0');
                // plugin.searchParams.set('mute', '0'); 
                previewSrc = plugin.toString();
            } else {
                u.searchParams.set('autoplay', isPlaying ? '1' : '0');
                previewSrc = u.toString();
            }
        } catch {}

        return (
            <div style={cardStyle}>
                <div style={{ width: '100%', height: '100%', pointerEvents: isPlaying ? 'auto' : 'none' }}>
                    <iframe
                        src={previewSrc}
                        title=""
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
                        scrolling="no"
                        style={{ width:'100%', height:'100%', border:0, objectFit:'contain' }}
                    />
                </div>
                
                {!isPlaying && (
                    <div 
                        onClick={() => setIsPlaying(true)}
                        style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(transparent, rgba(0,0,0,0.35))', cursor: 'pointer'}}
                    >
                        <div style={{background:'rgba(255,255,255,0.95)', width:48, height:48, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#e11d48', fontWeight:900, boxShadow: '0 4px 12px rgba(0,0,0,0.2)'}}>▶</div>
                    </div>
                )}
                
                <button 
                    style={expandButtonStyle}
                    onClick={(e) => {
                        e.stopPropagation();
                        setVideoModal({ isOpen: true, content: (<ResponsiveEmbed src={cleanEmbed} title="" />), title: "" });
                    }}
                    title="Томруулах"
                >
                    <FaExpand size={14} />
                </button>
            </div>
        );
    }

    // Default fallback for others
    return (
       <div style={cardStyle}>
          <div style={{padding: 20, textAlign: 'center', color: '#fff'}}>
             Video Preview
          </div>
          <button 
            style={expandButtonStyle}
            onClick={() => setVideoModal({ isOpen: true, content: (<ResponsiveEmbed src={cleanEmbed} title="" />), title: "" })}
          >
            <FaExpand size={14} />
          </button>
       </div>
    );
  };

  // Helper: responsive iframe renderer with provider-specific tweaks


  useEffect(() => {
    const fetchCenter = async () => {
      setLoading(true);
      try {
        console.log(`Fetching center details for ID: ${id}`);
        console.log(`Full API URL: ${API_BASE}/api/centers/${id}`);
        const res = await axios.get(`${API_BASE}/api/centers/${id}`);
        console.log("API Response:", res);
        console.log("Response status:", res.status);
        console.log("Response data:", res.data);
        
        const center = res.data;
        
        if (!center) {
          console.log("No center data received");
          throw new Error("No center data received");
        }
        
        console.log("Processing center data:", center);
        
        if (center) {
          const processedData = {
            ...center,
            // Ensure all required fields have values
            name: center.name || "PC Center",
            category: center.category || "Gaming Center",
            address: center.address || "Улаанбаатар",
            phone: center.phone || "+976 9999 9999",
            email: center.email || "info@example.com",
            website: center.website || "www.example.com",
            opening: center.opening || "10:00 - 23:00",
            price: center.price || (center.pricing?.standard ? `${center.pricing.standard}₮/цаг` : "3000₮/цаг"),
            rating: center.rating || 4.5,
            // Handle new image format (thumbnail + high quality)
            images: center.images && center.images.length > 0 ? center.images : [
              "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400&h=900&fit=crop&q=90&auto=format"
            ],
            // Handle videos
            videos: center.videos || [],
            embedVideos: center.embedVideos || [],
            // Handle facilities
            facilities: center.facilities && center.facilities.length > 0 ? center.facilities : [
              "Gaming PC", "Wi-Fi", "Ундаа"
            ],
            // Handle pricing
            pricing: center.pricing || {
              standard: "3000",
              vip: "",
              stage: "",
              overnight: ""
            },
            // Location
            lat: center.lat || 47.918,
            lng: center.lng || 106.917
          };
          
          console.log("Final processed data:", processedData);
          setCenterData(processedData);
        } else {
          throw new Error("Center not found");
        }
      } catch (err) {
        console.error("Error fetching center:", err);
        // Fallback data on error or 404
        setCenterData({
          id: id,
          name: "PC Center",
          category: "Gaming Center", 
          address: "Улаанбаатар",
          phone: "+976 9999 9999",
          email: "info@example.com",
          website: "www.example.com",
          opening: "10:00 - 23:00",
          price: "3000₮/цаг",
          rating: 4.5,
          description: "PC тоглоомын газар",
          longDescription: "Орчин үеийн тоног төхөөрөмжөөр тоноглогдсон тоглоомын газар.",
          images: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400&h=900&fit=crop&q=90&auto=format"],
          facilities: ["Gaming PC", "Wi-Fi"],
          lat: 47.918,
          lng: 106.917
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCenter();
    }
  }, [id]);

  useEffect(() => {
    if (location.state?.openBonus) {
      setBonusPanelOpen(true);
      // Clear state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Loading state: Subscription болон center data хоёуланг нь ачаалж байгаа үед
  // Эрхтэй хэрэглэгчдэд lock харуулахгүйн тулд бүгдийг ачаалаад шалгана
  if (loading || subLoading) {
    return (
      <div style={{ 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        background: "#f3f4f6",
        gap: "16px"
      }}>
        <div className="loading-spinner" style={{
          width: "48px",
          height: "48px",
          border: "4px solid #e5e7eb",
          borderTopColor: "#2563eb",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <p style={{ color: "#6b7280", fontSize: "14px" }}>Мэдээлэл ачааллаж байна...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!canViewDetails) {
    return (
      <div style={{ 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        background: "#f3f4f6",
        padding: "20px"
      }}>
        <div style={{
          maxWidth: "400px",
          width: "100%",
          background: "white",
          borderRadius: "24px",
          padding: "40px 32px",
          textAlign: "center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.05)"
        }}>
          <div style={{ 
            fontSize: "48px", 
            marginBottom: "20px",
            color: "#d97706",
            background: "#fff7ed",
            width: "96px",
            height: "96px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px auto"
          }}>
            <FaLock />
          </div>
          <h2 style={{ margin: "0 0 12px 0", fontSize: "24px", color: "#111" }}>
            Дэлгэрэнгүй мэдээлэл хаалттай
          </h2>
          <p style={{ margin: "0 0 24px 0", color: "#6b7280", fontSize: "15px", lineHeight: "1.6" }}>
            Та энэ төвийн дэлгэрэнгүй мэдээллийг үзэхийн тулд эрхээ идэвхжүүлнэ үү.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button
              onClick={() => navigate('/profile')}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "15px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
              }}
            >
              Эрх идэвхжүүлэх
            </button>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: "100%",
                padding: "14px",
                background: "transparent",
                color: "#6b7280",
                border: "none",
                borderRadius: "12px",
                fontWeight: "600",
                fontSize: "15px",
                cursor: "pointer"
              }}
            >
              Буцах
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    if (!centerData || !centerData.images) return;
    setCurrentImageIndex((prev) => 
      prev === centerData.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!centerData || !centerData.images) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? centerData.images.length - 1 : prev - 1
    );
  };

  // Swipe handlers for touch devices
  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }
  };

  // "Show on map" action removed from header; if needed later, reintroduce as a button using navigate("/map")

  if (!centerData) {
    return (
      <div className="center-error-state">
        <div className="center-error-content">
          <p className="center-error-text">Мэдээлэл олдсонгүй</p>
          <button onClick={() => navigate("/list")} className="center-error-btn">
            Буцах
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="center-detail-container">
      {/* Image carousel - Airbnb style */}
      <div 
        className="center-hero-carousel" 
        style={{ background: '#000', position: 'relative', overflow: 'hidden' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Blurred Background for Ambiance */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${getHighQualityImage(centerData.images[currentImageIndex])})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px) brightness(0.6)',
            transform: 'scale(1.1)', // Prevent blur edges
            zIndex: 0
          }}
        />
        
        {/* Main Image - Contained */}
        <img
          src={getHighQualityImage(centerData.images[currentImageIndex])}
          alt={centerData.name}
          className="center-carousel-image"
          style={{ 
            objectFit: 'contain', 
            position: 'relative', 
            zIndex: 1,
            width: '100%',
            height: '100%',
            backdropFilter: 'none' // Reset any inherited filters
          }}
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400&h=900&fit=crop&q=90&auto=format";
          }}
        />
        {/* Доод градиент overlay – зураг дээрх текстийг тодруулна */}
        <div className="center-carousel-gradient" style={{ zIndex: 2 }} />
        
        {/* Top overlay controls */}
        <div className="center-carousel-top-controls">
          <button onClick={() => navigate(-1)} className="center-carousel-close">
            <FaTimes />
          </button>
          
          {/* Bonus button with badge */}
          {centerData.bonus && centerData.bonus.length > 0 && (
            <button 
              onClick={() => setBonusPanelOpen(true)} 
              className="center-notification-btn"
              aria-label="Бонус"
            >
              <FaGift />
              <span className="center-notification-badge">{centerData.bonus.length}</span>
            </button>
          )}
        </div>
        
        {/* VIP badge */}
        {((centerData.isVip) || (centerData.owner && centerData.owner.subscription && (String(centerData.owner.subscription.plan || '').toLowerCase() === 'business_pro' || String(centerData.owner.subscription.plan || '').toLowerCase() === 'business pro'))) && (
          <div className="center-vip-badge">VIP</div>
        )}

        {/* Photo counter badge */}
        <div className="center-photo-counter">
          {currentImageIndex + 1} / {centerData.images.length}
        </div>
        
        {/* Image navigation */}
        <button onClick={prevImage} className="center-carousel-nav center-carousel-nav-left">
          <FaChevronLeft />
        </button>
        
        <button onClick={nextImage} className="center-carousel-nav center-carousel-nav-right">
          <FaChevronRight />
        </button>

        {/* Image indicators */}
        <div className="center-carousel-indicators">
          {centerData.images.map((_, index) => (
            <div
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`center-carousel-dot ${index === currentImageIndex ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Title and rating - Airbnb style: below carousel */}
      <div className="center-title-section">
        <h1 className="center-title">{centerData.name}</h1>
        <div className="center-title-meta">
          <div className="center-rating-inline">
            <FaStar /> {centerData.rating} <span className="reviews-text">(116 reviews)</span>
          </div>
          <span className="meta-separator">·</span>
          <div className="center-category-inline">{centerData.category}</div>
        </div>
      </div>

      {/* Content */}
      <div className="center-detail-content">

        {/* Price */}
        <div className="center-section">
          <h3 className="center-section-title">💰 Үнийн мэдээлэл</h3>
          
          {centerData.pricing && (centerData.pricing.standard || centerData.pricing.vip || centerData.pricing.stage || centerData.pricing.overnight) ? (
            <div className="center-pricing-grid">
              {centerData.pricing.standard && (
                <div className="center-pricing-card standard">
                  <div className="center-pricing-card-label">
                    <span className="center-pricing-card-icon">🎮</span>
                    <span>Заал</span>
                  </div>
                  <div className="center-pricing-card-price">
                    {parseInt(centerData.pricing.standard).toLocaleString()}₮/цаг
                  </div>
                </div>
              )}
              
              {centerData.pricing.vip && (
                <div className="center-pricing-card vip">
                  <div className="center-pricing-card-label">
                    <span className="center-pricing-card-icon">👑</span>
                    <span>VIP өрөө</span>
                  </div>
                  <div className="center-pricing-card-price">
                    {parseInt(centerData.pricing.vip).toLocaleString()}₮/цаг
                  </div>
                </div>
              )}
              
              {centerData.pricing.stage && (
                <div className="center-pricing-card stage">
                  <div className="center-pricing-card-label">
                    <span className="center-pricing-card-icon">🎭</span>
                    <span>Stage өрөө</span>
                  </div>
                  <div className="center-pricing-card-price">
                    {parseInt(centerData.pricing.stage).toLocaleString()}₮/цаг
                  </div>
                </div>
              )}
              
              {centerData.pricing.overnight && (
                <div className="center-pricing-card overnight">
                  <div className="center-pricing-card-label">
                    <span className="center-pricing-card-icon">🌙</span>
                    <span>Хоног</span>
                  </div>
                  <div className="center-pricing-card-price">
                    {parseInt(centerData.pricing.overnight).toLocaleString()}₮/хоног
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="center-pricing-fallback">
              <div className="center-pricing-fallback-price">{centerData.price}</div>
              <div className="center-pricing-fallback-label">Цагийн төлбөр</div>
            </div>
          )}
        </div>

        {/* Contact info */}
        <div className="center-info-cards">
          <div className="center-info-card">
            <FaMapMarkerAlt className="center-info-icon location" />
            <div className="center-info-content">
              <div className="center-info-label">Хаяг</div>
              <div className="center-info-value">{centerData.address}</div>
            </div>
          </div>
          
          <div className="center-info-card">
            <FaPhone className="center-info-icon phone" />
            <div className="center-info-content">
              <div className="center-info-label">Утас</div>
              <a href={`tel:${centerData.phone}`} className="center-info-value link">
                {centerData.phone}
              </a>
            </div>
          </div>
          
          <div className="center-info-card">
            <FaClock className="center-info-icon clock" />
            <div className="center-info-content">
              <div className="center-info-label">Цагийн хуваарь</div>
              <div className="center-info-value">{centerData.opening}</div>
            </div>
          </div>
          
          {centerData.email && (
            <div className="center-info-card">
              <FaEnvelope className="center-info-icon email" />
              <div className="center-info-content">
                <div className="center-info-label">Имэйл</div>
                <a href={`mailto:${centerData.email}`} className="center-info-value link">
                  {centerData.email}
                </a>
              </div>
            </div>
          )}
          
          {centerData.website && (
            <div className="center-info-card">
              <FaGlobe className="center-info-icon website" />
              <div className="center-info-content">
                <div className="center-info-label">Вэб хуудас</div>
                <a 
                  href={centerData.website.startsWith('http://') || centerData.website.startsWith('https://') ? 
                    centerData.website : 
                    `https://${centerData.website}`
                  } 
                  target="_blank" 
                  rel="noreferrer" 
                  className="center-info-value link"
                >
                  {centerData.website}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Embed Videos — Full width vertical layout like Facebook Reels */}
        {Array.isArray(centerData.embedVideos) && centerData.embedVideos.length > 0 && (
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
          }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "700", color: "#111827" }}>
              🎬 Видео
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[...centerData.embedVideos].slice().reverse().map((embed, index) => (
                <VideoCard key={index} embed={embed} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Facilities */}
        <div className="center-section">
          <h3 className="center-section-title">✨ Боломжууд</h3>
          <div className="center-facilities-wrap">
            {centerData.facilities.map((facility, index) => (
              <span key={index} className="center-facilities-chip">
                {facility}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* Sticky booking footer - Airbnb style */}
      <div className="center-booking-footer" style={{ zIndex: bonusPanelOpen || bookingModalOpen ? 1 : 1000 }}>
        <div className="center-booking-info">
          <div className="center-booking-price">
            {centerData.pricing?.standard ? (
              <>
                <span className="price-amount">{parseInt(centerData.pricing.standard).toLocaleString()}₮</span>
                <span className="price-unit">/ цаг</span>
              </>
            ) : (
              <span className="price-amount">{centerData.price}</span>
            )}
          </div>
          {centerData.rating && (
            <div className="center-booking-rating">
              <FaStar /> {centerData.rating} <span className="reviews-count">(1161 reviews)</span>
            </div>
          )}
        </div>
        <button 
          className="center-booking-btn"
          onClick={() => {
            if (!isAuthenticated) {
              navigate('/login');
              return;
            }
            if (user?.accountType === 'centerOwner') {
              setToast({ message: "Та өөрийн төвд захиалга хийх боломжгүй", type: "error", id: Date.now() });
              return;
            }
            setBookingModalOpen(true);
          }}
          style={{
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
            color: 'white',
            border: 'none',
            padding: '14px 32px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
          }}
        >
          Захиалах
        </button>
      </div>

      {/* Booking Modal */}
      <BookingModal 
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        center={centerData}
        onConfirm={handleBookingConfirm}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Video Modal */}
      {videoModal.isOpen && (
        <div className="center-video-modal">
          <div className="center-video-modal-content">
            <button
              onClick={() => setVideoModal({ isOpen: false, content: null, title: "" })}
              className="center-video-modal-close"
            >
              <FaTimes />
            </button>
            
            {videoModal.title && (
              <div className="center-video-modal-title">
                {videoModal.title}
              </div>
            )}
            
            <div className="center-video-modal-wrapper">
              {videoModal.content}
            </div>
          </div>
          
          <div 
            onClick={() => setVideoModal({ isOpen: false, content: null, title: "" })}
            className="center-video-modal-backdrop"
          />
        </div>
      )}

      {/* Bonus Slide-in Panel */}
      {bonusPanelOpen && (
        <>
          <div 
            className="bonus-panel-backdrop" 
            onClick={() => setBonusPanelOpen(false)}
          />
          <div className="bonus-panel">
            <div className="bonus-panel-header">
              <h3 className="bonus-panel-title">🎁 Идэвхтэй бонус</h3>
              <button 
                onClick={() => setBonusPanelOpen(false)} 
                className="bonus-panel-close"
                aria-label="Хаах"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="bonus-panel-content">
              {centerData.bonus && centerData.bonus.length > 0 ? (
                <div className="bonus-panel-list">
                  {(() => {
                    const now = Date.now();
                    const active = centerData.bonus.filter(b => !b?.expiresAt || new Date(b.expiresAt).getTime() > now);
                    const toShow = active.length ? active : centerData.bonus;
                    return toShow.map((b, idx) => (
                      <div key={b._id || idx} style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '20px',
                        marginBottom: '16px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        border: '2px solid #f59e0b'
                      }}>
                        {/* Gift icon and title */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '16px'
                        }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px'
                          }}>
                            🎁
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '18px',
                              fontWeight: '700',
                              color: '#1f2937',
                              marginBottom: '4px'
                            }}>
                              {b.title || 'Бонус'}
                            </div>
                            {b.expiresAt && (
                              <div style={{
                                fontSize: '13px',
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span>⏰</span>
                                <span>Дуусах: {new Date(b.expiresAt).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Description section */}
                        {b.text && (
                          <div style={{
                            background: '#f9fafb',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '16px'
                          }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#6b7280',
                              marginBottom: '8px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              📝 Тайлбар
                            </div>
                            <div style={{
                              fontSize: '15px',
                              color: '#374151',
                              lineHeight: '1.6'
                            }}>
                              {b.text}
                            </div>
                          </div>
                        )}
                        
                        {/* Available seats section */}
                        {(b.standardFree > 0 || b.vipFree > 0 || b.stageFree > 0) && (
                          <div style={{
                            background: '#f0fdf4',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '16px',
                            border: '1px solid #86efac'
                          }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#15803d',
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <span>✅</span>
                              <span>СУЛ СУУДАЛ</span>
                            </div>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px'
                            }}>
                              {b.standardFree > 0 && (
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '10px 14px',
                                  background: '#fff',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}>
                                    <span style={{ fontSize: '18px' }}>🎮</span>
                                    <span style={{
                                      fontSize: '15px',
                                      fontWeight: '600',
                                      color: '#374151'
                                    }}>Заал</span>
                                  </div>
                                  <span style={{
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    color: '#16a34a'
                                  }}>
                                    {b.standardFree} суудал
                                  </span>
                                </div>
                              )}
                              {b.vipFree > 0 && (
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '10px 14px',
                                  background: '#fff',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}>
                                    <span style={{ fontSize: '18px' }}>👑</span>
                                    <span style={{
                                      fontSize: '15px',
                                      fontWeight: '600',
                                      color: '#374151'
                                    }}>VIP өрөө</span>
                                  </div>
                                  <span style={{
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    color: '#16a34a'
                                  }}>
                                    {b.vipFree} суудал
                                  </span>
                                </div>
                              )}
                              {b.stageFree > 0 && (
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '10px 14px',
                                  background: '#fff',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}>
                                    <span style={{ fontSize: '18px' }}>🎭</span>
                                    <span style={{
                                      fontSize: '15px',
                                      fontWeight: '600',
                                      color: '#374151'
                                    }}>Stage өрөө</span>
                                  </div>
                                  <span style={{
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    color: '#16a34a'
                                  }}>
                                    {b.stageFree} суудал
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Call to action button */}
                        <button 
                          onClick={() => {
                            if (centerData.phone) {
                              window.location.href = `tel:${centerData.phone}`;
                            } else {
                              setToast({ message: "Утасны дугаар олдсонгүй", type: "error", id: Date.now() });
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "14px",
                            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: "12px",
                            fontSize: "16px",
                            fontWeight: "700",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                          }}
                        >
                          <FaPhone style={{ fontSize: '18px' }} />
                          <span>Захиалах (Залгах)</span>
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="bonus-panel-empty">
                  <div className="bonus-panel-empty-icon">🎁</div>
                  <p>Одоогоор бонус байхгүй байна</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
