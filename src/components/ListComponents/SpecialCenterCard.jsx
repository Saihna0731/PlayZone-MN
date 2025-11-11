import React from 'react';

/*
  SpecialCenterCard — VIP төвүүдэд зориулсан орчин үеийн загвар (travel booking style)
  Props:
  - center: { _id, name, address, logo|image|images, rating, pricing }
  - onClick: () => void
*/
export default function SpecialCenterCard({ center, onClick }) {
  if (!center) return null;
  
  const img = center.image || center.logo || (Array.isArray(center.images) ? (center.images[0]?.high || center.images[0]?.thumbnail || center.images[0]) : null);
  const location = center.address || 'Байршил тодорхойгүй';
  const rating = center.rating || 0;
  // VIP үнийг харуулах (pricing.vip эсвэл price)
  const price = center.pricing?.vip || center.price || '';
  
  return (
    <div className="special-center-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="special-card-image-wrapper">
        {img ? (
          <img src={typeof img === 'string' ? img : ''} alt={center.name} className="special-card-image" />
        ) : (
          <div className="special-card-fallback">{center.name?.charAt(0) || '🎮'}</div>
        )}
        {/* Rating badge top-left */}
        {rating > 0 && (
          <div className="special-card-rating">
            ⭐ {rating.toFixed(1)}
          </div>
        )}
        {/* VIP badge top-right */}
        <div className="special-card-vip-badge">VIP</div>
      </div>
      <div className="special-card-body">
        <h4 className="special-card-title">{center.name}</h4>
        <p className="special-card-location">📍 {location}</p>
        {price && <div className="special-card-price">{price}</div>}
      </div>
    </div>
  );
}
