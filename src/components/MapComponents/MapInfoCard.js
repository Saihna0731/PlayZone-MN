import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaClock, FaMapMarkerAlt, FaTimes, FaChevronRight, FaLock } from 'react-icons/fa';
import { useSubscription } from '../../hooks/useSubscription';

export default function MapInfoCard({ center, onClose }) {
  const navigate = useNavigate();
  const { canViewDetails } = useSubscription();

  if (!center) return null;

  // Helper to get image
  const getImage = (c) => {
    if (c.images && c.images.length > 0) {
        const img = c.images[0];
        // Handle object structure (thumbnail/highQuality) or direct string
        if (typeof img === 'object') {
            return img.thumbnail || img.highQuality || img.url;
        }
        return img;
    }
    return c.image || c.logo || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80";
  };

  const handleCardClick = () => {
    if (canViewDetails) {
      navigate(`/center/${center._id}`);
    } else {
      navigate('/profile');
    }
  };

  return (
    <div className="map-info-card-container">
      <div className="map-info-card">
        <button className="close-btn" onClick={onClose}>
          <FaTimes />
        </button>
        
        <div className="card-image-wrapper" onClick={handleCardClick}>
          <img src={getImage(center)} alt={center.name} className="card-image" onError={(e) => e.target.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80"} />
          {center.rating && (
            <div className="card-rating">
              <FaStar className="star-icon" />
              <span>{center.rating}</span>
            </div>
          )}
          {!canViewDetails && (
            <div className="lock-overlay">
              <FaLock />
            </div>
          )}
        </div>

        <div className="card-content" onClick={handleCardClick}>
          <div className="card-header">
            <h3 className="card-title">{center.name}</h3>
            <span className="card-category">{center.category || 'Gaming Center'}</span>
          </div>

          <div className="card-details">
            <div className="detail-item">
              <FaClock className="detail-icon" />
              <span>{center.opening || '24/7'}</span>
            </div>
            <div className="detail-item">
              <FaMapMarkerAlt className="detail-icon" />
              <span className="address-text">{canViewDetails ? (center.address || 'Ulaanbaatar') : '******'}</span>
            </div>
          </div>

          {/* Occupancy Info */}
          {canViewDetails && center.occupancy && (
            <div className="occupancy-info">
              {center.occupancy.standard > 0 && <span className="badge std">Std: {center.occupancy.standard}</span>}
              {center.occupancy.vip > 0 && <span className="badge vip">VIP: {center.occupancy.vip}</span>}
              {center.occupancy.stage > 0 && <span className="badge stage">Stg: {center.occupancy.stage}</span>}
            </div>
          )}

          <div className="card-footer">
            <div className="price-list">
              {canViewDetails ? (
                <>
                  {center.pricing?.standard && <div className="price-item">Std: {parseInt(center.pricing.standard).toLocaleString()}₮</div>}
                  {center.pricing?.vip && <div className="price-item">VIP: {parseInt(center.pricing.vip).toLocaleString()}₮</div>}
                  {!center.pricing?.standard && !center.pricing?.vip && (
                    <div className="price-item">{center.price || '3,000₮'}</div>
                  )}
                </>
              ) : (
                <div className="price-item">***₮</div>
              )}
            </div>
            <button className="view-btn">
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .map-info-card-container {
          position: absolute;
          bottom: 80px; /* Raised slightly to not cover bottom nav if present */
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          display: flex;
          justify-content: center;
          pointer-events: none;
          width: 100%;
        }
        .map-info-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          width: 90%;
          max-width: 320px; /* Reduced width */
          display: flex;
          flex-direction: column; /* Stack vertically for mobile friendliness */
          overflow: hidden;
          pointer-events: auto;
          position: relative;
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .close-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0,0,0,0.5);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 2;
          backdrop-filter: blur(4px);
        }
        .card-image-wrapper {
          width: 100%;
          height: 140px;
          position: relative;
          cursor: pointer;
        }
        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .card-rating {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(255, 255, 255, 0.9);
          padding: 4px 8px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: #111;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .star-icon { color: #f59e0b; }
        .lock-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          backdrop-filter: blur(2px);
        }
        .card-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          cursor: pointer;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .card-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #111;
          line-height: 1.3;
        }
        .card-category {
          font-size: 11px;
          color: #6b7280;
          background: #f3f4f6;
          padding: 2px 8px;
          border-radius: 10px;
          white-space: nowrap;
        }
        .card-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #4b5563;
        }
        .detail-icon { color: #9ca3af; font-size: 12px; }
        .address-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }
        .occupancy-info {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }
        .badge.std { background: #e0f2fe; color: #0369a1; }
        .badge.vip { background: #fef3c7; color: #b45309; }
        .badge.stage { background: #fce7f3; color: #be185d; }
        
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
          padding-top: 10px;
          border-top: 1px solid #f3f4f6;
        }
        .price-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .price-item {
          font-size: 13px;
          font-weight: 700;
          color: #2563eb;
        }
        .view-btn {
          background: #111;
          color: white;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .view-btn:hover {
          transform: scale(1.05);
          background: #000;
        }
      `}</style>
    </div>
  );
}
          position: relative;
          pointer-events: auto;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .close-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0,0,0,0.5);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
        }
        .card-image-wrapper {
          width: 120px;
          position: relative;
          flex-shrink: 0;
          cursor: pointer;
        }
        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .lock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
        }
        .card-rating {
          position: absolute;
          bottom: 8px;
          left: 8px;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
          backdrop-filter: blur(4px);
        }
        .star-icon { color: #fbbf24; }
        
        .card-content {
          flex: 1;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          cursor: pointer;
        }
        .card-header {
          margin-bottom: 8px;
        }
        .card-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #111;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-category {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .card-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
        }
        .detail-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #4b5563;
        }
        .detail-icon {
          color: #9ca3af;
          font-size: 12px;
        }
        .card-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .price-tag {
          font-size: 16px;
          font-weight: 700;
          color: #2563eb;
        }
        .unit {
          font-size: 10px;
          color: #6b7280;
          font-weight: 400;
        }
        .view-btn {
          background: #eff6ff;
          color: #2563eb;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .view-btn:hover {
          background: #dbeafe;
        }
      `}</style>
    </div>
  );
}
