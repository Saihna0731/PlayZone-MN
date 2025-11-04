import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { API_BASE } from '../config';
import axios from 'axios';
import { FaHeart, FaArrowLeft } from 'react-icons/fa';
import '../styles/Reels.css';

// Iframe renderer for embed codes (e.g., Facebook) to avoid remounts on fullscreen toggle
const EmbedIframe = React.memo(function EmbedIframe({ embedCode, fullscreen }) {
  const match = /src="([^"]+)"/i.exec(embedCode || '');
  let src = match ? match[1] : null;
  // Autoplay сайжруулалт: YouTube/Facebook линк дээр query параметрүүд нэмнэ
  try {
    if (src) {
      const url = new URL(src, window.location.href);
      const host = url.hostname || '';
      if (host.includes('youtube.com') || host.includes('youtu.be')) {
        // Ensure embed endpoint
        // (ихэнх тохиолдолд аль хэдийн /embed/... байна)
        url.searchParams.set('autoplay', '1');
        url.searchParams.set('mute', '1');
        url.searchParams.set('playsinline', '1');
        url.searchParams.set('rel', '0');
        url.searchParams.set('enablejsapi', '1');
      } else if (host.includes('facebook.com')) {
        // FB plugins/video.php
        url.searchParams.set('autoplay', 'true');
        // show-text байхгүй/эсвэл 0 бол илүү цэвэр харагдана
        if (!url.searchParams.has('show_text')) url.searchParams.set('show_text', '0');
      }
      src = url.toString();
    }
  } catch (e) {
    // no-op — буруу URL байсан ч алдааг залгиад fallback ашиглана
  }
  if (!src) {
    // Fallback: render raw HTML once
    return (
      <div className={`reels-embed-box ${fullscreen ? 'fullscreen' : ''}`}>
        <div
          className="reels-embed-fallback"
          dangerouslySetInnerHTML={{ __html: embedCode || '' }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  }
  return (
    <div className={`reels-embed-box ${fullscreen ? 'fullscreen' : ''}`}>
      <iframe
        className="reels-embed"
        src={src}
        title="Embedded Video"
        frameBorder="0"
        allow="autoplay; encrypted-media; picture-in-picture; web-share"
        referrerPolicy="no-referrer-when-downgrade"
        scrolling="no"
        allowFullScreen
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
});

export default function Reels() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { canViewDetails } = useSubscription();
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const [touchStart, setTouchStart] = useState(0);
  
  // Интерактив товчнуудын төлөвүүд
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  // Fullscreen toggle UI-ийг ашиглахгүй, embed өөр дээрээ fullscreen-тэй

  // currentIndex-г reels уртад тааруулж хавчих
  useEffect(() => {
    if (reels.length && currentIndex > reels.length - 1) {
      setCurrentIndex(reels.length - 1);
    }
  }, [reels.length, currentIndex]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const fetchReels = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/centers/api/reels`);
        const centers = response.data || [];
        console.log('Fetched centers for reels:', centers.length, centers[0]); // debug owner
        // Flatten: each center can have multiple videos
        const allReels = [];
        centers.forEach(center => {
          const videos = center.videos || [];
          const embeds = center.embedVideos || [];
          const ownerName = center.owner?.username || center.owner?.email || 'Эзэмшигч';
          const ownerAvatar = center.owner?.avatar || null;
          const ownerId = center.owner?._id || center.owner;
          console.log(`Center ${center.name} owner:`, center.owner); // debug
          videos.forEach((video, idx) => {
            allReels.push({
              centerId: center._id,
              centerName: center.name,
              ownerName,
              ownerAvatar,
              ownerId,
              videoSrc: typeof video === 'object' ? video.data : video,
              isEmbed: false,
              key: `${center._id}-video-${idx}`
            });
          });
          embeds.forEach((embed, idx) => {
            allReels.push({
              centerId: center._id,
              centerName: center.name,
              ownerName,
              ownerAvatar,
              ownerId,
              embedCode: embed,
              isEmbed: true,
              key: `${center._id}-embed-${idx}`
            });
          });
        });
        setReels(allReels);
      } catch (error) {
        console.error('Error fetching reels:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, [user, navigate]);

  const handleOwnerClick = (centerId) => {
    if (!canViewDetails) {
      window.dispatchEvent(new CustomEvent('toast:show', {
        detail: { type: 'error', message: 'Дэлгэрэнгүй үзэхийн тулд төлбөртэй план авах шаардлагатай' }
      }));
      return;
    }
    navigate(`/center/${centerId}`);
  };

  // Дуртай төвд нэмэх/хасах
  const toggleFavorite = async () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('toast:show', {
        detail: { type: 'warning', message: 'Нэвтэрч орно уу' }
      }));
      return;
    }

    const currentReel = reels[currentIndex];
    if (!currentReel) return;

    setFavoriteLoading(true);
    try {
      const token = localStorage.getItem("token");
      const centerId = currentReel.centerId;
      // Backend нь POST-оор toggle хийдэг тул үргэлж POST хэрэглэнэ
      const res = await axios.post(`${API_BASE}/api/auth/favorites/${centerId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const toggled = typeof res?.data?.isFavorite === 'boolean' ? res.data.isFavorite : !isFavorite;
      setIsFavorite(toggled);
      window.dispatchEvent(new CustomEvent('toast:show', {
        detail: { type: toggled ? 'success' : 'info', message: toggled ? 'Дуртай жагсаалтад нэмэгдлээ' : 'Дуртай жагсаалтаас хасагдлаа' }
      }));
      await refreshUser();
    } catch (error) {
      console.error("Toggle favorite error:", error);
      window.dispatchEvent(new CustomEvent('toast:show', {
        detail: { type: 'error', message: 'Дуртай жагсаалт шинэчлэхэд алдаа гарлаа' }
      }));
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Follow feature has been removed per requirements

  const goNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd;
    // Instagram reels шиг - 80px-с илүү swipe хийхэд л шилжинэ
    if (Math.abs(diff) > 80) {
      if (diff > 0) {
        // Доошоо swipe - дараагийн video
        goNext();
      } else {
        // Дээшээ swipe - өмнөх video
        goPrev();
      }
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    const wheelHandler = (e) => {
      if (e.deltaY > 0 && currentIndex < reels.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (e.deltaY < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    };
    if (container) {
      container.addEventListener('wheel', wheelHandler, { passive: true });
      return () => container.removeEventListener('wheel', wheelHandler);
    }
  }, [currentIndex, reels.length]);

  // Одоогийн reel-ийн favorite статусыг шалгах
  useEffect(() => {
    if (user && Array.isArray(user.favorites) && reels.length > 0) {
      const currentReel = reels[currentIndex];
      if (currentReel) {
        const centerId = currentReel.centerId;
        const isInFavorites = user.favorites.some(fav =>
          (fav._id || fav).toString() === centerId.toString()
        );
        setIsFavorite(isInFavorites);
      }
    } else {
      setIsFavorite(false);
    }
  }, [user, currentIndex, reels]);

  // Following статусыг шалгах — устгасан

  if (loading) {
    return (
      <div className="reels-loading">
        <div className="reels-loading-spinner"></div>
        <p className="reels-loading-text">Loading reels...</p>
      </div>
    );
  }

  if (!reels.length) {
    return (
      <div className="reels-empty">
        <p className="reels-empty-text">Одоогоор видео байхгүй байна</p>
      </div>
    );
  }

  const currentReel = reels[currentIndex];
  if (!currentReel) {
    // Index зөрсөн үед түр тулж үзүүлэх
    return (
      <div className="reels-loading">
        <div className="reels-loading-spinner"></div>
        <p className="reels-loading-text">Loading video...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="reels-container"
    >
      {/* Буцах товч */}
      <button 
        onClick={() => navigate(-1)} 
        className="reels-back-button"
        aria-label="Буцах"
      >
        <FaArrowLeft />
      </button>

      {/* Video */}
      <div className="reels-video-wrapper">
        {currentReel.isEmbed ? (
          <>
            <EmbedIframe key={currentReel.key} embedCode={currentReel.embedCode} />
            <span className="reels-embed-decor" aria-hidden>🎬</span>
          </>
        ) : (
          <video
            key={currentReel.key}
            src={currentReel.videoSrc}
            autoPlay
            loop
            muted
            playsInline
            className="reels-video"
          />
        )}
      </div>

      {/* Баруун талын интерактив товчнууд — устгасан (зүрхийг доор owner мөрөнд байрлуулсан) */}

      {/* Эзэмшигчийн мэдээлэл + Follow товч */}
      <div className="reels-owner-info">
        <div className="reels-owner-wrapper" onClick={() => handleOwnerClick(currentReel.centerId)}>
          {/* Profile зураг */}
          <div className="reels-owner-avatar">
            {currentReel.ownerAvatar ? (
              <img src={currentReel.ownerAvatar} alt={currentReel.ownerName} />
            ) : (
              <span>{currentReel.ownerName?.charAt(0) || '👤'}</span>
            )}
          </div>
          
          {/* Нэр болон Center нэр */}
          <div className="reels-owner-details">
            <div className="reels-owner-name">{currentReel.ownerName}</div>
            <div className="reels-center-name">{currentReel.centerName}</div>
          </div>

          {/* Дээш/Доош сумнууд — нэг мөрөнд */}
          <div className="reels-owner-nav" onClick={(e) => e.stopPropagation()}>
            <button
              className="reels-owner-nav-btn"
              onClick={goPrev}
              disabled={currentIndex === 0}
              aria-label="Дээшээ"
              title="Дээшээ"
            >
              ↑
            </button>
            <button
              className="reels-owner-nav-btn"
              onClick={goNext}
              disabled={currentIndex >= reels.length - 1}
              aria-label="Доошоо"
              title="Доошоо"
            >
              ↓
            </button>
          </div>

          {/* Favorite (Heart) товч — CenterCard-ийн logic-ийг ашигласан */}
          {user && (!currentReel.ownerId || user._id !== currentReel.ownerId) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite();
              }}
              disabled={favoriteLoading}
              className={`reels-owner-fav ${isFavorite ? 'favorited' : ''}`}
              aria-label="Дуртайд нэмэх"
              title={isFavorite ? 'Дуртай жагсаалтаас хасах' : 'Дуртай жагсаалтад нэмэх'}
            >
              <FaHeart size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation hints — сумнуудыг owner мөрөнд байрлуулсан тул эндээс устгав */}

      {/* Index indicator */}
      <div className="reels-index-indicator">
        {currentIndex + 1} / {reels.length}
      </div>
    </div>
  );
}
