import React, { useState } from 'react';
import { FaLayerGroup, FaSyncAlt, FaLocationArrow } from 'react-icons/fa';

export default function MapTools({ onRefresh, onStyleChange, currentStyle, onLocate }) {
  const [isOpen, setIsOpen] = useState(false);

  const mapStyles = [
    { id: 'streets', name: 'Гудамж', icon: '🗺️' },
    { id: 'satellite', name: 'Хиймэл дагуул', icon: '🛰️' },
    { id: 'dark', name: 'Харанхуй', icon: '🌑' }
  ];

  return (
    <div className="map-tools-container">
      <div className={`tools-menu ${isOpen ? 'open' : ''}`}>
        <button className="tool-action-btn" onClick={() => { onLocate(); setIsOpen(false); }} title="Миний байршил">
          <FaLocationArrow />
          <span>Миний байршил</span>
        </button>
        <button className="tool-action-btn" onClick={() => { onRefresh(); setIsOpen(false); }} title="Шинэчлэх">
          <FaSyncAlt />
          <span>Шинэчлэх</span>
        </button>
        <div className="style-selector">
          {mapStyles.map(style => (
            <button 
              key={style.id}
              className={`style-option ${currentStyle === style.id ? 'active' : ''}`}
              onClick={() => {
                onStyleChange(style.id);
                setIsOpen(false);
              }}
            >
              <span>{style.icon}</span>
              <span className="style-name">{style.name}</span>
            </button>
          ))}
        </div>
      </div>

      <button 
        className={`main-tool-btn ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaLayerGroup />
      </button>

      <style jsx>{`
        .map-tools-container {
          position: absolute;
          right: 16px;
          top: 160px;
          z-index: 900;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        .main-tool-btn {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: white;
          border: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          color: #374151;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .main-tool-btn.active {
          background: #2563eb;
          color: white;
          transform: rotate(90deg);
        }

        .tools-menu {
          background: white;
          border-radius: 16px;
          padding: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          gap: 8px;
          opacity: 0;
          transform: translateY(-10px) scale(0.95);
          pointer-events: none;
          transition: all 0.2s ease;
          transform-origin: top right;
          position: absolute;
          top: 60px; /* Show below the button */
          bottom: auto;
          right: 0;
          width: 160px;
        }

        .tools-menu.open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .tool-action-btn {
          width: 100%;
          padding: 10px;
          border: none;
          background: #f3f4f6;
          border-radius: 8px;
          color: #374151;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .tool-action-btn:hover {
          background: #e5e7eb;
        }

        .style-selector {
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-top: 1px solid #e5e7eb;
          padding-top: 8px;
        }

        .style-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          color: #4b5563;
          font-size: 13px;
        }

        .style-option:hover {
          background: #f9fafb;
        }

        .style-option.active {
          background: #eff6ff;
          color: #2563eb;
          font-weight: 600;
        }
        
        /* Mobile responsive */
        @media (max-width: 480px) {
          .map-tools-container {
            right: 10px;
            top: 140px;
          }
          .main-tool-btn {
            width: 42px;
            height: 42px;
            border-radius: 10px;
            font-size: 18px;
          }
          .tools-menu {
            width: 150px;
            padding: 6px;
          }
          .tool-action-btn {
            padding: 8px;
            font-size: 13px;
          }
          .style-option {
            padding: 6px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
