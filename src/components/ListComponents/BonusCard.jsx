import React from 'react';
import { FaChair, FaCrown, FaTag } from 'react-icons/fa';

// BonusCard — төвийн лого/зураг дээр Bonus мэдээлэл болон "Захиалах" товчтой карт
// Props:
// - center: { name, logo|image|images, bonus: [{title,text,standardFree,vipFree,...}], rating? }
// - onOrder: () => void
// - onClick: () => void (navigate to center detail, optional)
export default function BonusCard({ center, onOrder, onClick }) {
  if (!center) return null;
  const img = center.image || center.logo || (Array.isArray(center.images) ? (center.images[0]?.high || center.images[0]?.thumbnail || center.images[0]) : null);
  const bonuses = Array.isArray(center.bonus) ? center.bonus.slice() : [];
  const primary = bonuses[0];
  const title = primary?.title || center.name;
  
  // Сул суудал байгаа эсэх
  const hasSeats = primary?.standardFree || primary?.vipFree;
  // Зөвхөн тайлбар байгаа эсэх (сул суудалгүй)
  const hasTextOnly = !hasSeats && primary?.text;
  
  // Зургийн дагуу card style
  return (
    <div style={{
      position: 'relative',
      width: '280px',
      height: '180px',
      borderRadius: '16px',
      overflow: 'hidden',
      cursor: 'pointer',
      flexShrink: 0,
      background: '#000'
    }} onClick={onClick}>
      {/* Background Image */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: img ? `url(${img})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: img ? 'transparent' : 'linear-gradient(135deg, #8B5CF6, #A855F7)'
      }}>
        {!img && (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
            fontSize: '40px',
            color: '#fff'
          }}>
            🎮
          </div>
        )}
      </div>
      
      {/* Gradient Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)'
      }} />

      {/* Badge - баруун дээд буланд */}
      {hasSeats ? (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          padding: '6px 10px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          boxShadow: '0 2px 8px rgba(34,197,94,0.4)',
          animation: 'pulse 2s infinite'
        }}>
          <FaChair style={{ color: '#fff', fontSize: '12px' }} />
          <span style={{ color: '#fff', fontSize: '11px', fontWeight: '700' }}>
            Сул суудал
          </span>
        </div>
      ) : hasTextOnly ? (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          padding: '6px 10px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          boxShadow: '0 2px 8px rgba(59,130,246,0.4)'
        }}>
          <FaTag style={{ color: '#fff', fontSize: '11px' }} />
          <span style={{ color: '#fff', fontSize: '11px', fontWeight: '700' }}>
            Урамшуулал
          </span>
        </div>
      ) : null}
      
      {/* Content */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px',
        color: '#fff'
      }}>
        <h3 style={{
          fontSize: '15px',
          fontWeight: '700',
          margin: '0 0 6px 0',
          color: '#fff',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)'
        }}>
          {title}
        </h3>

        <p style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.8)',
          margin: '0 0 10px 0'
        }}>
          📍 {center.name}
        </p>
        
        {/* Badges based on bonus type */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px',
          flexWrap: 'wrap'
        }}>
          {/* Сул суудал байвал */}
          {primary?.standardFree && (
            <span style={{
              background: 'rgba(16,185,129,0.9)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <FaChair style={{ fontSize: '10px' }} />
              Заал: {primary.standardFree} сул суудал
            </span>
          )}
          {primary?.vipFree && (
            <span style={{
              background: 'rgba(139,92,246,0.9)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <FaCrown style={{ fontSize: '10px' }} />
              VIP: {primary.vipFree} сул суудал
            </span>
          )}
          {/* Зөвхөн тайлбар байвал цэнхэрээр */}
          {hasTextOnly && (
            <span style={{
              background: 'rgba(59,130,246,0.9)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {primary.text}
            </span>
          )}
        </div>
        
        <button 
          style={{
            background: hasSeats 
              ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
              : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
          onClick={(e) => { e.stopPropagation(); onOrder?.(); }}
        >
          Дэлгэрэнгүй →
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
