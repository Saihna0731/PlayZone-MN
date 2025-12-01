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
          padding: 8px 0;
        }
        .category-scroll-container {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 4px 16px 8px;
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
          gap: 6px;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border: 1.5px solid rgba(229, 231, 235, 0.8);
          border-radius: 20px;
          white-space: nowrap;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          color: #374151;
          font-size: 13px;
          font-weight: 600;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          flex-shrink: 0;
        }
        .category-chip:hover {
          background: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #9ca3af;
        }
        .category-chip.active {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }
        .category-chip.active:hover {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        }
        .category-icon {
          display: flex;
          align-items: center;
          font-size: 14px;
        }
        .category-label {
          font-size: 12px;
        }
        .category-count {
          background: rgba(0, 0, 0, 0.1);
          color: inherit;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }
        .category-chip.active .category-count {
          background: rgba(255, 255, 255, 0.25);
        }
        
        /* Responsive */
        @media (max-width: 480px) {
          .category-chip {
            padding: 6px 10px;
            gap: 4px;
          }
          .category-icon {
            font-size: 12px;
          }
          .category-label {
            font-size: 11px;
          }
          .category-count {
            font-size: 9px;
            padding: 1px 5px;
          }
        }
        @media (min-width: 768px) {
          .category-chip {
            padding: 10px 18px;
            gap: 8px;
          }
          .category-icon {
            font-size: 16px;
          }
          .category-label {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
