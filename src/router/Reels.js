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
  const boxRef = React.useRef(null);
  const match = /src="([^"]+)"/i.exec(embedCode || '');
  let baseSrc = match ? match[1] : null;
  // Whether the embed is a vertical video (e.g., Facebook Reels or YouTube Shorts)
  let isVertical = false;
  // Build a base URL with autoplay params (width/height will be adjusted after layout)
  try {
    if (baseSrc) {
      let url = new URL(baseSrc, window.location.href);
      const host = url.hostname || '';

      // Facebook Reels линк илэрвэл plugins/video.php руу хөрвүүлнэ
      if (host.includes('facebook.com') && (/\/reel\//i.test(url.pathname) || /\/reels\//i.test(url.pathname))) {
        // Mark as vertical and use the official plugin URL so autoplay works more reliably
        isVertical = true;
        const plugin = new URL('https://www.facebook.com/plugins/video.php');
        plugin.searchParams.set('href', url.toString());
        plugin.searchParams.set('autoplay', '1');
        plugin.searchParams.set('mute', '1');
        plugin.searchParams.set('muted', '1');
        plugin.searchParams.set('playsinline', '1');
        plugin.searchParams.set('show_text', '0');
        // width/height-ийг дараа нь бодитоор хэмжиж тохируулна
        url = plugin;
      }

      if (host.includes('youtube.com') || host.includes('youtu.be')) {
        // Normalize to YouTube embed URL so that controls reliably show
        const toEmbed = (u) => {
          try {
            // Attempt to extract the video id from various URL formats
            const original = new URL(u.toString());
            let vid = original.searchParams.get('v');
            const path = original.pathname || '';
            if (!vid) {
              // youtu.be/<id>
              const short = /youtu\.be\/([A-Za-z0-9_-]{6,})/i.exec(original.href);
              if (short) vid = short[1];
            }
            if (!vid) {
              // /watch?v=..., /embed/<id>, /shorts/<id>
              const fromPath = /\/(embed|shorts)\/([A-Za-z0-9_-]{6,})/i.exec(path);
              if (fromPath) vid = fromPath[2];
            }
            // Fallback: last path segment if it looks like an id
            if (!vid) {
              const segs = path.split('/').filter(Boolean);
              const last = segs[segs.length - 1] || '';
              if (/^[A-Za-z0-9_-]{6,}$/.test(last)) vid = last;
            }
            if (!vid) return u; // could not normalize — return original

            const embed = new URL(`https://www.youtube.com/embed/${vid}`);
            // Preserve start time if present
            if (original.searchParams.has('t')) embed.searchParams.set('start', original.searchParams.get('t'));
            if (original.searchParams.has('start')) embed.searchParams.set('start', original.searchParams.get('start'));
            return embed;
          } catch {
            return u;
          }
        };

        url = toEmbed(url);
  // Prefer showing player controls, and autoplay muted so it starts automatically
  url.searchParams.set('controls', '1');
  url.searchParams.set('autoplay', '1');
  // Autoplay is allowed only if muted in most browsers
  url.searchParams.set('mute', '1');
  url.searchParams.set('muted', '1');
  url.searchParams.set('playsinline', '1');
        url.searchParams.set('rel', '0');
        url.searchParams.set('modestbranding', '1');
        url.searchParams.set('fs', '1');
        url.searchParams.set('enablejsapi', '1');
        try { url.searchParams.set('origin', window.location.origin); } catch (_) {}

        // YouTube Shorts are vertical
        if (/\/shorts\//i.test(baseSrc) || /\/shorts\//i.test(url.pathname)) {
          isVertical = true;
        }
      } else if (host.includes('facebook.com')) {
        // FB plugins/video.php
        url.searchParams.set('autoplay', '1');
        url.searchParams.set('mute', '1');
        url.searchParams.set('muted', '1');
        url.searchParams.set('playsinline', '1');
        // show-text байхгүй/эсвэл 0 бол илүү цэвэр харагдана
        if (!url.searchParams.has('show_text')) url.searchParams.set('show_text', '0');
        // If the plugin points to a reel via its href param, treat as vertical
        try {
          const href = url.searchParams.get('href') || '';
          if (/\/reel(s)?\//i.test(href)) {
            isVertical = true;
          }
        } catch (e) {}
        // width/height-ийг дараа хэмжилтээр тохируулна
      } else {
        // Ерөнхий кейс: autoplay/mute/playsinline параметрүүдийг нэмнэ
        url.searchParams.set('autoplay', url.searchParams.get('autoplay') ?? '1');
        url.searchParams.set('mute', url.searchParams.get('mute') ?? '1');
        url.searchParams.set('muted', url.searchParams.get('muted') ?? '1');
        url.searchParams.set('playsinline', url.searchParams.get('playsinline') ?? '1');
      }
      baseSrc = url.toString();
    }
  } catch (e) {
    // no-op — буруу URL байсан ч алдааг залгиад fallback ашиглана
  }
  const [finalSrc, setFinalSrc] = React.useState(baseSrc || null);

  // Measure wrapper and adjust FB plugin width/height to match real size
  React.useEffect(() => {
    if (!baseSrc) return;
    try {
      const url = new URL(baseSrc, window.location.href);
      const host = url.hostname || '';
      if (!host.includes('facebook.com')) {
        setFinalSrc(baseSrc);
        return;
      }
      const measureAndUpdate = () => {
        const el = boxRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        // Fullscreen wrapper-ийн бодит хэмжээтэй 1:1 тааруулна
        const targetW = Math.max(Math.round(rect.width), 1);
        const targetH = Math.max(Math.round(rect.height), 1);
        const newUrl = new URL(baseSrc);
        // plugins/video.php width/height параметрүүдийг тохируулна
        newUrl.searchParams.set('width', String(targetW));
        newUrl.searchParams.set('height', String(targetH));
        setFinalSrc(newUrl.toString());
      };
      // next frame дээр хэмжинэ
      const r = requestAnimationFrame(measureAndUpdate);
      const onResize = () => measureAndUpdate();
      window.addEventListener('resize', onResize);
      return () => {
        cancelAnimationFrame(r);
        window.removeEventListener('resize', onResize);
      };
    } catch (e) {
      setFinalSrc(baseSrc);
    }
  }, [baseSrc, isVertical]);

  if (!finalSrc) {
    // Fallback: render raw HTML once
    return (
      <div ref={boxRef} className={`reels-embed-box ${fullscreen ? 'fullscreen' : ''}`}>
        <div
          className="reels-embed-fallback"
          dangerouslySetInnerHTML={{ __html: embedCode || '' }}
        />
      </div>
    );
  }
  return (
    <div ref={boxRef} className={`reels-embed-box ${fullscreen ? 'fullscreen' : ''} ${isVertical ? 'vertical' : ''}`}>
      <iframe
        className="reels-embed"
        src={finalSrc}
        title="Embedded Video"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
        referrerPolicy="no-referrer-when-downgrade"
        scrolling="no"
        allowFullScreen
        loading="eager"
        style={{ aspectRatio: isVertical ? '9 / 16' : '16 / 9' }}
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
  const [triedFullscreen, setTriedFullscreen] = useState(false);
  
  // Back neg daraad shuud garna 
  const handleBack = async () => {
    try {
      const doc = document;
      const isFs = doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;
      if (isFs) {
        const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
        if (exit) {
          try { await exit.call(doc); } catch (_) {}
        }
      }
    } finally {
      // Always send user to MapView with a single tap
      navigate('/map', { replace: true });
    }
  };
  
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

  // When current reel changes or on mount, try to programmatically play HTML5 video elements.
  useEffect(() => {
    const playCurrentMedia = async () => {
      if (!containerRef.current) return;
      // Try HTML5 video first
      const video = containerRef.current.querySelector('video');
      if (video) {
        try {
          // Some browsers require muted to allow autoplay; videos are already muted attribute in markup
          await video.play();
        } catch (err) {
          // ignore - browser blocked autoplay
          console.debug('Video play() blocked:', err);
        }
        return;
      }

      // For iframes we rely on query params (autoplay=1 & muted). Nothing safe to call cross-origin.
      const iframe = containerRef.current.querySelector('iframe');
      if (iframe) {
        try {
          // Focus may help some browsers start playback
          iframe.focus();
        } catch (e) {}
      }
    };

    playCurrentMedia();
  }, [currentIndex, reels]);

  // Try to request fullscreen on Windows when entering the Reels page.
  useEffect(() => {
    const tryFullscreenOnWindows = async () => {
      if (triedFullscreen) return;
      setTriedFullscreen(true);
      if (!containerRef.current) return;
      const ua = navigator.userAgent || '';
      const isWindows = /Windows|Win32|Win64/i.test(ua);
      if (!isWindows) return;

      const el = containerRef.current;
      const request = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (request && (document.fullscreenEnabled || document.webkitFullscreenEnabled || document.msFullscreenEnabled)) {
        try {
          await request.call(el);
          console.debug('Requested fullscreen for Reels container');
        } catch (err) {
          console.debug('Fullscreen request blocked or failed:', err);
          try {
            window.dispatchEvent(new CustomEvent('toast:show', {
              detail: { type: 'info', message: 'Браузер fullscreen хүсэлтийг хориглолоо. Та гараар fullscreen хийж болно.' }
            }));
          } catch (_) {}
          // Not fatal — just continue
        }
      }
    };

    // Run shortly after mount so navigation gesture may count as user interaction in some browsers
    const t = setTimeout(tryFullscreenOnWindows, 250);
    return () => clearTimeout(t);
  }, [triedFullscreen]);

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
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Буцах товч */}
      <button 
        onClick={handleBack} 
        className="reels-back-button"
        aria-label="Буцах"
      >
        <FaArrowLeft />
      </button>

      {/* Video */}
      <div className="reels-video-wrapper">
        {currentReel.isEmbed ? (
          <>
            <EmbedIframe key={currentReel.key} embedCode={currentReel.embedCode} fullscreen />
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
            style={{ margin: '0 auto' }}
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
