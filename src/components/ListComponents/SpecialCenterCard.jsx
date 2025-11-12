import React, { useState, useEffect } from 'react';

/*
  SpecialCenterCard — Business Pro төвүүдэд зориулсан орчин үеийн загвар (travel booking style)
  Props:
  - center: { _id, name, phone, logo|image|images, rating, pricing }
  - onClick: () => void
*/
export default function SpecialCenterCard({ center, onClick }) {
  // Auto-rotate images every 3 seconds
  const images = center && Array.isArray(center.images) && center.images.length > 0
    ? center.images.map(img => typeof img === 'string' ? img : (img?.high || img?.thumbnail || img))
    : center ? [center.image || center.logo].filter(Boolean) : [];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);
  
  if (!center) return null;
  
  const currentImage = images[currentImageIndex];
  const phone = center.phone || 'Утас байхгүй';
  const rating = center.rating || 0;
  
  // Pricing: standard, vip, stage
  const standardPrice = center.pricing?.standard || '';
  const vipPrice = center.pricing?.vip || '';
  const stagePrice = center.pricing?.stage || '';
  
  return (
    <div className="special-center-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="special-card-image-wrapper">
        {currentImage ? (
          <img key={currentImageIndex} src={currentImage} alt={center.name} className="special-card-image" />
        ) : (
          <div className="special-card-fallback">{center.name?.charAt(0) || '🎮'}</div>
        )}
        {/* Rating badge top-left */}
        {rating > 0 && (
          <div className="special-card-rating">
            ⭐ {rating.toFixed(1)}
          </div>
        )}
        {/* Business Pro badge top-right */}
        <div className="special-card-vip-badge">PRO</div>
      </div>
      <div className="special-card-body">
        <h4 className="special-card-title">{center.name}</h4>
        <p className="special-card-phone">📞 {phone}</p>
        <div className="special-card-pricing">
          {standardPrice && (
            <div className="special-card-price-row">
              <span className="special-card-price-label">Заал</span>
              <span className="special-card-price">{standardPrice} ₮</span>
            </div>
          )}
          {vipPrice && (
            <div className="special-card-price-row">
              <span className="special-card-price-label">VIP</span>
              <span className="special-card-price">{vipPrice} ₮</span>
            </div>
          )}
          {stagePrice && (
            <div className="special-card-price-row">
              <span className="special-card-price-label">Stage</span>
              <span className="special-card-price">{stagePrice} ₮</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
