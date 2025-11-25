import React from 'react';

// BonusCard — төвийн лого/зураг дээр Bonus мэдээлэл болон "Захиалах" товчтой карт
// Props:
// - center: { name, logo|image|images, bonus: [{title,text,...}], rating? }
// - onOrder: () => void
// - onClick: () => void (navigate to center detail, optional)
export default function BonusCard({ center, onOrder, onClick }) {
  if (!center) return null;
  const img = center.image || center.logo || (Array.isArray(center.images) ? (center.images[0]?.high || center.images[0]?.thumbnail || center.images[0]) : null);
  const bonuses = Array.isArray(center.bonus) ? center.bonus.slice() : [];
  const primary = bonuses[0];
  const title = primary?.title || center.name;
  
  // Зургийн дагуу card style
  return (
    <div style={{
      position: 'relative',
      width: '280px',
      height: '160px',
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
        background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)'
      }} />
      
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
          fontSize: '16px',
          fontWeight: '700',
          margin: '0 0 8px 0',
          color: '#fff'
        }}>
          {title}
        </h3>
        
        {/* Seat badges зургийн дагуу */}
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '12px'
        }}>
          {primary?.standardFree && (
            <span style={{
              background: '#10b981',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              Заал {primary.standardFree}
            </span>
          )}
          {primary?.vipFree && (
            <span style={{
              background: '#8B5CF6',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              VIP {primary.vipFree}
            </span>
          )}
        </div>
        
        <button 
          style={{
            background: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
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
          Get Offer Now →
        </button>
      </div>
    </div>
  );
}
