import React from 'react';
import { FaTimes, FaCheck, FaLeaf, FaStar, FaMapMarkerAlt, FaChevronRight, FaLock, FaFire } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';

export default function FilterPanel({ isOpen, onClose, filters, onFilterChange, centers, onCenterClick }) {
  const navigate = useNavigate();
  const { canViewDetails } = useSubscription();

  // Helper to get image
  const getImage = (c) => {
    if (c.images && c.images.length > 0) {
        const img = c.images[0];
        return typeof img === 'object' ? (img.thumbnail || img.highQuality) : img;
    }
    return "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80";
  };

  if (!isOpen) return null;

  const handleToggleGreen = () => {
    onFilterChange({ ...filters, onlyGreen: !filters.onlyGreen, onlyOrange: false });
  };

  const handleToggleOrange = () => {
    onFilterChange({ ...filters, onlyOrange: !filters.onlyOrange, onlyGreen: false });
  };

  const handlePriceChange = (range) => {
    onFilterChange({ ...filters, priceRange: filters.priceRange === range ? 'all' : range });
  };

  const handleCardClick = (center) => {
    if (canViewDetails) {
      navigate(`/center/${center._id}`);
      onClose();
    } else {
      // Navigate to profile or show subscription modal
      navigate('/profile');
      onClose();
    }
  };

  return (
    <>
      <div className="filter-backdrop" onClick={onClose} />
      <div className="filter-panel">
        <div className="filter-header">
          <h3>Шүүлтүүр & Жагсаалт</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="filter-content">
          {/* Filters Section */}
          <div className="filters-container">
            {/* Occupancy Filter */}
            <div className="filter-section">
              <label className="filter-label">Ачаалал</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  className={`filter-option ${filters.onlyGreen ? 'active' : ''}`}
                  onClick={handleToggleGreen}
                >
                  <div className="option-icon green">
                    <FaLeaf />
                  </div>
                  <div className="option-text">
                    <span>Сул суудалтай (Ногоон)</span>
                    <small>Ачаалал 25%-иас бага</small>
                  </div>
                  {filters.onlyGreen && <FaCheck className="check-icon" />}
                </button>

                <button 
                  className={`filter-option ${filters.onlyOrange ? 'active' : ''}`}
                  onClick={handleToggleOrange}
                >
                  <div className="option-icon orange">
                    <FaFire />
                  </div>
                  <div className="option-text">
                    <span>Дундаж ачаалалтай (Улбар шар)</span>
                    <small>Ачаалал 26% - 75%</small>
                  </div>
                  {filters.onlyOrange && <FaCheck className="check-icon" />}
                </button>
              </div>
            </div>

            {/* Price Filter */}
            <div className="filter-section">
              <label className="filter-label">Үнийн дүн</label>
              <div className="price-options">
                <button 
                  className={`price-chip ${filters.priceRange === 'low' ? 'active' : ''}`}
                  onClick={() => handlePriceChange('low')}
                >
                  <span>Хямд</span>
                  <small>&lt; 3,000₮</small>
                </button>
                <button 
                  className={`price-chip ${filters.priceRange === 'medium' ? 'active' : ''}`}
                  onClick={() => handlePriceChange('medium')}
                >
                  <span>Дундаж</span>
                  <small>3k - 5k</small>
                </button>
                <button 
                  className={`price-chip ${filters.priceRange === 'high' ? 'active' : ''}`}
                  onClick={() => handlePriceChange('high')}
                >
                  <span>Үнэтэй</span>
                  <small>&gt; 5,000₮</small>
                </button>
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* Centers List Section */}
          <div className="centers-list-section">
            <h4 className="section-title">Илэрц ({centers?.length || 0})</h4>
            <div className="centers-list">
              {centers && centers.map((center) => (
                <div 
                  key={center._id} 
                  className={`panel-card ${!canViewDetails ? 'locked' : ''}`}
                  onClick={() => handleCardClick(center)}
                >
                  <div className="panel-card-img">
                    <img src={getImage(center)} alt={center.name} />
                    {center.rating && (
                      <div className="panel-rating">
                        <FaStar className="star-icon" /> {center.rating}
                      </div>
                    )}
                    {!canViewDetails && (
                      <div className="lock-overlay">
                        <FaLock />
                      </div>
                    )}
                  </div>
                  <div className="panel-card-content">
                    <div className="panel-card-header">
                      <h5 className="panel-card-title">{center.name}</h5>
                      <span className="panel-card-price">
                        {canViewDetails ? (
                          center.pricing?.standard ? `${parseInt(center.pricing.standard).toLocaleString()}₮` : (center.price || '3,000₮')
                        ) : '***'}
                      </span>
                    </div>
                    <div className="panel-card-footer">
                      <span className="panel-card-cat">{center.category || 'Gaming'}</span>
                      <div className="panel-card-address">
                        <FaMapMarkerAlt /> {canViewDetails ? (center.address || 'UB') : '******'}
                      </div>
                    </div>
                  </div>
                  <button className="panel-arrow">
                    <FaChevronRight />
                  </button>
                </div>
              ))}
              {(!centers || centers.length === 0) && (
                <div className="no-results">
                  Үр дүн олдсонгүй
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .filter-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.3);
          z-index: 1000;
          backdrop-filter: blur(2px);
        }
        .filter-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 85%;
          max-width: 360px;
          background: white;
          z-index: 1001;
          box-shadow: -4px 0 20px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .filter-header {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f3f4f6;
          background: white;
          z-index: 10;
        }
        .filter-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #111;
        }
        .close-btn {
          background: #f3f4f6;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          cursor: pointer;
        }
        .filter-content {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .filters-container {
          padding: 20px;
        }
        .filter-section {
          margin-bottom: 20px;
        }
        .filter-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .filter-option {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 12px;
          background: #f9fafb;
          border: 2px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        .filter-option.active {
          background: #ecfdf5;
          border-color: #10b981;
        }
        .filter-option.active .option-icon.orange {
          background: #fff7ed;
          color: #f97316;
        }
        .option-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          font-size: 16px;
        }
        .option-icon.green {
          background: #d1fae5;
          color: #059669;
        }
        .option-icon.orange {
          background: #ffedd5;
          color: #f97316;
        }
        .option-text {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .option-text span {
          font-weight: 600;
          color: #374151;
          font-size: 13px;
        }
        .option-text small {
          color: #6b7280;
          font-size: 11px;
        }
        .check-icon {
          color: #10b981;
        }
        
        .price-options {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }
        .price-chip {
          padding: 8px 4px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .price-chip.active {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #2563eb;
        }
        .price-chip span {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .price-chip small {
          font-size: 10px;
          opacity: 0.7;
        }

        .divider {
          height: 8px;
          background: #f3f4f6;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }

        .centers-list-section {
          padding: 20px;
          flex: 1;
        }
        .section-title {
          margin: 0 0 16px 0;
          font-size: 14px;
          font-weight: 700;
          color: #374151;
        }
        .centers-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-bottom: 20px;
        }
        .panel-card {
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 8px;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .panel-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .panel-card.locked {
          opacity: 0.8;
          background: #f9fafb;
        }
        .panel-card-img {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          flex-shrink: 0;
        }
        .panel-card-img img {
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
          font-size: 16px;
        }
        .panel-rating {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0,0,0,0.6);
          color: white;
          font-size: 9px;
          padding: 2px;
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2px;
        }
        .star-icon { color: #fbbf24; font-size: 8px; }
        
        .panel-card-content {
          flex: 1;
          min-width: 0;
        }
        .panel-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }
        .panel-card-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #111;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-right: 8px;
        }
        .panel-card-price {
          font-size: 12px;
          font-weight: 700;
          color: #2563eb;
          white-space: nowrap;
        }
        .panel-card-footer {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .panel-card-cat {
          font-size: 10px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
        }
        .panel-card-address {
          font-size: 11px;
          color: #9ca3af;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .panel-arrow {
          color: #d1d5db;
          background: none;
          border: none;
          font-size: 12px;
        }
        .no-results {
          text-align: center;
          padding: 20px;
          color: #9ca3af;
          font-size: 14px;
        }
      `}</style>
    </>
  );
}
