import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Onboarding.css';

// Slide data with emoji icons (no images needed)
const slides = [
  {
    id: 1,
    icon: '🎮',
    title: 'PlayZone MN-д тавтай морилно уу!',
    description: 'Монголын хамгийн том Game Center платформ. Бүх тоглоомын төвүүдийг нэг дороос олж, захиалаарай!',
    emoji: '🎮🕹️🎯',
    badge: 'Шинэ',
    bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 2,
    icon: '📍',
    title: 'Газрын зураг дээрээс хайх',
    description: 'Ойролцоох Game Center-үүдийг газрын зураг дээр харж, ачаалал, үнийг шууд мэдэж аваарай.',
    emoji: '🗺️📍🔍',
    badge: null,
    bgColor: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
  },
  {
    id: 3,
    icon: '🏠',
    title: 'Дэлгэрэнгүй мэдээлэл',
    description: 'Зураг, үнэ, ачаалал, бонус мэдээллийг бүгдийг нэг дор харж болно.',
    emoji: '📊💰🖼️',
    badge: null,
    bgColor: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)'
  },
  {
    id: 4,
    icon: '📅',
    title: 'Хялбар захиалга',
    description: 'VIP өрөө, PC суудлаа урьдчилж захиалаад, ээлжгүй тоглоорой!',
    emoji: '📅✅🎟️',
    badge: null,
    bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    id: 5,
    icon: '📋',
    title: 'Захиалга удирдах',
    description: 'Бүх захиалгаа нэг дороос харж, статусыг хянаарай.',
    emoji: '📋📱✔️',
    badge: null,
    bgColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  },
  {
    id: 6,
    icon: '🎁',
    title: 'Бонус & Урамшуулал',
    description: 'Тусгай хөнгөлөлт, сул суудлын мэдээллийг алдалгүй аваарай!',
    emoji: '🎁🎉💎',
    badge: 'Hot',
    bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);

  // Auto slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentSlide < slides.length - 1) {
        setCurrentSlide(prev => prev + 1);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/auth?mode=register');
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const skip = () => {
    navigate('/auth?mode=register');
  };

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) nextSlide();
    else if (diff < -50) prevSlide();
    setTouchStart(null);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="onboarding-container">
      {/* Header */}
      <div className="onboarding-header">
        <div className="logo-area">
          <span className="logo-icon">🎮</span>
          <span className="logo-text">PlayZone</span>
          <span className="logo-mn">MN</span>
        </div>
        <button className="skip-btn" onClick={skip}>
          Алгасах →
        </button>
      </div>

      {/* Phone Mockup with Emoji Display */}
      <div 
        className="phone-mockup-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="phone-frame">
          {/* Phone notch */}
          <div className="phone-notch"></div>
          
          {/* Emoji Display instead of Screenshot */}
          <div className="phone-screen" style={{ background: currentSlideData.bgColor }}>
            {currentSlideData.badge && (
              <div className={`slide-badge ${currentSlideData.badge === 'Hot' ? 'hot' : ''}`}>
                {currentSlideData.badge}
              </div>
            )}
            <div className="emoji-display" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontSize: '60px',
              letterSpacing: '10px',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
              {currentSlideData.emoji}
            </div>
          </div>
        </div>

        {/* Floating decorations */}
        <div className="floating-decoration d1">✨</div>
        <div className="floating-decoration d2">🎯</div>
        <div className="floating-decoration d3">⭐</div>
      </div>

      {/* Content */}
      <div className="onboarding-content">
        <div className="slide-icon">{currentSlideData.icon}</div>
        <h1 className="slide-title">{currentSlideData.title}</h1>
        <p className="slide-description">{currentSlideData.description}</p>

        {/* Progress dots */}
        <div className="dots-container">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''} ${index < currentSlide ? 'completed' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="onboarding-actions">
        {currentSlide > 0 ? (
          <button className="back-btn" onClick={prevSlide}>
            ←
          </button>
        ) : (
          <div style={{ width: '50px' }}></div>
        )}
        
        <button className="next-btn" onClick={nextSlide}>
          {currentSlide === slides.length - 1 ? (
            <>
              <span>🚀</span>
              Эхлэх
            </>
          ) : (
            <>
              Үргэлжлүүлэх
              <span>→</span>
            </>
          )}
        </button>
      </div>

      {/* Login link */}
      <div className="login-link">
        Бүртгэлтэй юу? <span onClick={() => navigate('/login')}>Нэвтрэх</span>
      </div>
    </div>
  );
}
