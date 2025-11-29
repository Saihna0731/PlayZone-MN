import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaMapMarkerAlt, FaTimes, FaChevronRight } from 'react-icons/fa';
import { useSubscription } from '../../hooks/useSubscription';

export default function MapInfoCard({ center, onClose }) {
  const navigate = useNavigate();
  const { canViewDetails } = useSubscription();

  if (!center) return null;

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

          {/* Occupancy Info - percentage хэлбэрээр харуулна */}
          {canViewDetails && center.occupancy && (
            <div className="occupancy-info">
              {center.occupancy.standard > 0 && <span className="badge std">Std: {center.occupancy.standard}%</span>}
              {center.occupancy.vip > 0 && <span className="badge vip">VIP: {center.occupancy.vip}%</span>}
              {center.occupancy.stage > 0 && <span className="badge stage">Stg: {center.occupancy.stage}%</span>}
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
          width: 80%;
          max-width: 220px;
          min-height: 230px;
          max-height: 320px;
          display: flex;
          flex-direction: column;
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
        .card-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          min-height: 180px;
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
