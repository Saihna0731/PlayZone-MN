import React from 'react';
import { FaGamepad, FaPlaystation, FaStar, FaDesktop, FaLayerGroup, FaDotCircle } from 'react-icons/fa';

// Standardized categories that should always be available
const STANDARD_CATEGORIES = [
  { id: 'gaming', label: 'Gaming Center', icon: <FaGamepad />, keywords: ['game', 'gaming'] },
  { id: 'pc-center', label: 'PC Gaming', icon: <FaDesktop />, keywords: ['pc', 'computer'] },
  { id: 'ps5', label: 'PlayStation', icon: <FaPlaystation />, keywords: ['ps', 'playstation'] },
  { id: 'billard', label: 'Billard', icon: <FaDotCircle />, keywords: ['billard', 'billiard'] },
  { id: 'vip', label: 'VIP Rooms', icon: <FaStar />, keywords: ['vip'] }
];

export default function MapCategoryFilter({ selectedCategory, onSelectCategory }) {
  // Always show standard categories + 'all'
  const displayCategories = [
    { id: 'all', label: 'Бүгд', icon: <FaLayerGroup /> },
    ...STANDARD_CATEGORIES
  ];

  return (
    <div className="map-category-filter">
      <div className="category-scroll-container">
        {displayCategories.map((cat) => (
          <button
            key={cat.id}
            className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => onSelectCategory(selectedCategory === cat.id ? 'all' : cat.id)}
          >
            <span className="category-icon">{cat.icon}</span>
            <span className="category-label">{cat.label}</span>
          </button>
        ))}
      </div>
      <style jsx>{`
        .map-category-filter {
          width: 100%;
          padding: 12px 0;
        }
        .category-scroll-container {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 0 16px;
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
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(229, 231, 235, 0.8);
          border-radius: 24px;
          white-space: nowrap;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          color: #374151;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.3px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .category-chip:hover {
          background: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
          border-color: #9ca3af;
        }
        .category-chip.active {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.5);
        }
        .category-chip.active:hover {
          background: #1d4ed8;
        }
        .category-icon {
          display: flex;
          align-items: center;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}
