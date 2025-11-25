import React, { useRef } from 'react';
import { FaStar, FaMapMarkerAlt, FaChevronRight } from 'react-icons/fa';

export default function MapCenterList({ centers, onCenterClick }) {
  const scrollRef = useRef(null);

  if (!centers || centers.length === 0) return null;

  // Helper to get image
  const getImage = (c) => {
    if (c.images && c.images.length > 0) {
        const img = c.images[0];
        return typeof img === 'object' ? (img.thumbnail || img.highQuality) : img;
    }
    return "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80";
  };

  return (
    <div className="map-center-list-container">
      <div className="list-scroll" ref={scrollRef}>
        {centers.map((center) => (
          <div 
            key={center._id} 
            className="modern-card"
            onClick={() => onCenterClick(center)}
          >
            <div className="card-image-container">
              <img src={getImage(center)} alt={center.name} className="card-image" />
              <div className="card-overlay">
                {center.rating && (
                  <div className="card-rating">
                    <FaStar className="star-icon" /> {center.rating}
                  </div>
                )}
                <div className="card-price-tag">
                  {center.pricing?.standard ? `${parseInt(center.pricing.standard).toLocaleString()}₮` : (center.price || '3,000₮')}
                </div>
              </div>
            </div>
            
            <div className="card-content">
              <div className="card-header">
                <h3 className="card-title">{center.name}</h3>
                <span className="card-category">{center.category || 'Gaming'}</span>
              </div>
              
              <div className="card-footer">
                <div className="card-address">
                  <FaMapMarkerAlt className="location-icon" />
                  <span>{center.address || 'Улаанбаатар'}</span>
                </div>
                <button className="card-action-btn">
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .map-center-list-container {
          position: absolute;
          bottom: 90px; /* Raised slightly above BottomNav */
          left: 0;
          right: 0;
          z-index: 900;
          pointer-events: none;
        }
        
        .list-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 10px 20px;
          pointer-events: auto;
          -ms-overflow-style: none;
          scrollbar-width: none;
          scroll-behavior: smooth;
          scroll-snap-type: x mandatory;
        }
        
        .list-scroll::-webkit-scrollbar {
          display: none;
        }
        
        .modern-card {
          flex: 0 0 280px; /* Wider card */
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          scroll-snap-align: center;
          border: 1px solid rgba(255,255,255,0.5);
          position: relative;
        }
        
        .modern-card:active {
          transform: scale(0.98);
        }
        
        .card-image-container {
          height: 140px;
          position: relative;
          overflow: hidden;
        }
        
        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        
        .modern-card:hover .card-image {
          transform: scale(1.05);
        }
        
        .card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%);
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .card-rating {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .star-icon { color: #f59e0b; }
        
        .card-price-tag {
          align-self: flex-end;
          background: #2563eb;
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        }
        
        .card-content {
          padding: 12px 16px;
          background: white;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        
        .card-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .card-category {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6b7280;
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          flex-shrink: 0;
          margin-left: 8px;
        }
        
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .card-address {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
          max-width: 85%;
        }
        
        .card-address span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .location-icon {
          color: #9ca3af;
          flex-shrink: 0;
        }
        
        .card-action-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #f3f4f6;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4b5563;
          font-size: 10px;
          transition: all 0.2s;
        }
        
        .modern-card:hover .card-action-btn {
          background: #2563eb;
          color: white;
        }
      `}</style>
    </div>
  );
}
