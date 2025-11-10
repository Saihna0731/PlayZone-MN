import React from 'react';

// BonusCard — төвийн лого/зураг дээр Bonus мэдээлэл болон "Захиалах" товчтой карт
// Props:
// - center: { name, logo|image|images, bonus: [{title,text,...}], rating? }
// - onOrder: () => void
// - onClick: () => void (navigate to center detail, optional)
export default function BonusCard({ center, onOrder, onClick }) {
  if (!center) return null;
  const img = center.image || center.logo || (Array.isArray(center.images) ? (center.images[0]?.high || center.images[0]?.thumbnail || center.images[0]) : null);
  const bonuses = Array.isArray(center.bonus) ? center.bonus.slice().reverse() : []; // Шинэ нь түрүүлж гарна
  const primary = bonuses[0];
  const title = primary?.title || 'Онцгой урамшуулал';
  const text = primary?.text || '';
  const std = primary?.standardFree || 0;
  const vip = primary?.vipFree || 0;
  const stg = primary?.stageFree || 0;

  return (
    <div className="bonus-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="bonus-card-media">
        {img ? (
          <img src={typeof img === 'string' ? img : ''} alt={center.name} />
        ) : (
          <div className="bonus-card-fallback">{center.name?.charAt(0) || '🎮'}</div>
        )}
        <div className="bonus-card-gradient" />
      </div>
      <div className="bonus-card-content">
        <div className="bonus-card-title">{title}</div>
        {text && <div className="bonus-card-text">{text}</div>}
        {!text && (std || vip || stg) ? (
          <div className="bonus-seat-emphasis" aria-label="Сул суудлын мэдээлэл">
            {std ? <span className="seat-badge xl std">STD {std}</span> : null}
            {vip ? <span className="seat-badge xl vip">VIP {vip}</span> : null}
            {stg ? <span className="seat-badge xl stage">STG {stg}</span> : null}
          </div>
        ) : null}
        {!text && primary && (primary.standardFree || primary.vipFree || primary.stageFree) && (
          <div className="bonus-seat-highlight">
            {primary.standardFree ? <span className="seat-badge xl std" title="Энгийн сул суудал">STD {primary.standardFree}</span> : null}
            {primary.vipFree ? <span className="seat-badge xl vip" title="VIP сул суудал">VIP {primary.vipFree}</span> : null}
            {primary.stageFree ? <span className="seat-badge xl stage" title="Stage сул суудал">STG {primary.stageFree}</span> : null}
          </div>
        )}
        <div className="bonus-card-meta">{center.name}</div>
        {bonuses.length > 1 && (
          <div className="bonus-card-list">
            {bonuses.slice(1, 5).map(b => (
              <div key={b._id || b.createdAt || b.title} className="bonus-item">
                <div className="bonus-item-head">
                  <span className="bonus-item-title">{b.title || 'Бонус'}</span>
                  { (b.expiresAt || b.createdAt) && (
                    <span className="bonus-item-time" title={b.expiresAt ? 'Дуусах:' + new Date(b.expiresAt).toLocaleString() : new Date(b.createdAt).toLocaleString()}>
                      {b.expiresAt ? '⏰ ' + new Date(b.expiresAt).toLocaleDateString() : '🗓 ' + new Date(b.createdAt).toLocaleDateString()}
                    </span>
                  ) }
                </div>
                {b.text && <div className="bonus-item-text">{b.text}</div>}
                {(b.standardFree || b.vipFree || b.stageFree) && (
                  <div className="bonus-seat-row">
                    {b.standardFree ? <span className="seat-badge std" title="Энгийн сул суудал">STD {b.standardFree}</span> : null}
                    {b.vipFree ? <span className="seat-badge vip" title="VIP сул суудал">VIP {b.vipFree}</span> : null}
                    {b.stageFree ? <span className="seat-badge stage" title="Stage сул суудал">STG {b.stageFree}</span> : null}
                  </div>
                )}
              </div>
            ))}
            {bonuses.length > 5 && <div className="bonus-more">… бусад {bonuses.length - 5} бонус</div>}
          </div>
        )}
        <button type="button" className="bonus-card-order" onClick={(e) => { e.stopPropagation(); onOrder?.(); }}>
          Get Offer Now →
        </button>
      </div>
    </div>
  );
}
