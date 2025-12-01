import React from 'react';
import { FaGamepad, FaPlaystation, FaStar, FaDesktop, FaDotCircle } from 'react-icons/fa';

// Standardized categories - PC Gaming эхэнд, "all" хасагдсан
const STANDARD_CATEGORIES = [
  { id: 'pc-center', label: 'PC Gaming', icon: <FaDesktop />, keywords: ['pc', 'computer', 'pc gaming'] },
  { id: 'gaming', label: 'Game Center', icon: <FaGamepad />, keywords: ['game', 'gaming', 'gamecenter'] },
  { id: 'ps5', label: 'PlayStation', icon: <FaPlaystation />, keywords: ['ps', 'playstation', 'ps5'] },
  { id: 'billard', label: 'Billard', icon: <FaDotCircle />, keywords: ['billard', 'billiard'] },
  { id: 'vip', label: 'VIP', icon: <FaStar />, keywords: ['vip'] }
];

export default function MapCategoryFilter({ selectedCategory, onSelectCategory, categoryCounts = {} }) {
  return (
    <div className="map-category-filter">
      <div className="category-scroll-container">
        {STANDARD_CATEGORIES.map((cat) => {
          const count = categoryCounts[cat.id] || 0;
          return (
            <button
              key={cat.id}
              className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => onSelectCategory(selectedCategory === cat.id ? null : cat.id)}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-label">{cat.label}</span>
              {count > 0 && <span className="category-count">{count}</span>}
            </button>
          );
        })}
      </div>
      <style jsx>{`
        .map-category-filter {
          width: 100%;
          padding: 6px 0 10px;
        }
        .category-scroll-container {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 6px 16px 10px;
          pointer-events: auto;
          -ms-overflow-style: none;
          scrollbar-width: none;
          scroll-behavior: smooth;
        }
        .category-scroll-container::-webkit-scrollbar {
          display: none;
        }
        .category-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(12px);
          border: 2px solid rgba(229, 231, 235, 0.9);
          border-radius: 25px;
          white-space: nowrap;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          color: #374151;
          font-size: 14px;
          font-weight: 600;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          flex-shrink: 0;
        }
        .category-chip:hover {
          background: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
          border-color: #6366f1;
        }
        .category-chip:active {
          transform: scale(0.97);
        }
        .category-chip.active {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
          transform: translateY(-1px);
        }
        .category-chip.active:hover {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        }
        .category-icon {
          display: flex;
          align-items: center;
          font-size: 18px;
        }
        .category-label {
          font-size: 14px;
          font-weight: 600;
        }
        .category-count {
          background: rgba(99, 102, 241, 0.15);
          color: #6366f1;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 12px;
          min-width: 24px;
          text-align: center;
        }
        .category-chip.active .category-count {
          background: rgba(255, 255, 255, 0.3);
          color: white;
        }
        
        /* Responsive - Mobile */
        @media (max-width: 480px) {
          .category-scroll-container {
            gap: 8px;
            padding: 4px 12px 8px;
          }
          .category-chip {
            padding: 10px 16px;
            gap: 6px;
            border-radius: 20px;
          }
          .category-icon {
            font-size: 16px;
          }
          .category-label {
            font-size: 13px;
          }
          .category-count {
            font-size: 11px;
            padding: 3px 8px;
            min-width: 22px;
          }
        }
        
        /* Responsive - Tablet & Desktop */
        @media (min-width: 768px) {
          .category-scroll-container {
            gap: 12px;
            padding: 8px 24px 12px;
          }
          .category-chip {
            padding: 14px 24px;
            gap: 10px;
            border-radius: 30px;
          }
          .category-icon {
            font-size: 20px;
          }
          .category-label {
            font-size: 15px;
          }
          .category-count {
            font-size: 13px;
            padding: 5px 12px;
            min-width: 28px;
          }
        }
      `}</style>
    </div>
  );
}
