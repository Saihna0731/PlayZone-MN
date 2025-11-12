import React from 'react';

// BonusCard — төвийн лого/зураг дээр Bonus мэдээлэл болон "Захиалах" товчтой карт
// Props:
// - center: { name, logo|image|images, bonus: [{title,text,...}], rating? }
// - onOrder: () => void
// - onClick: () => void (navigate to center detail, optional)
export default function BonusCard({ center, onOrder, onClick }) {
  if (!center) return null;
  const img = center.image || center.logo || (Array.isArray(center.images) ? (center.images[0]?.high || center.images[0]?.thumbnail || center.images[0]) : null);
  // Server талд bonus-ыг unshift-аар хамгийн эхэнд нэмдэг тул шууд slice() хийж хуулж авна
  const bonuses = Array.isArray(center.bonus) ? center.bonus.slice() : [];
  const primary = bonuses[0];
  const title = primary?.title || 'Онцгой урамшуулал';
  const text = primary?.text || '';
  const showSeats = !!(primary && (primary.standardFree || primary.vipFree || primary.stageFree));
  const showText = !showSeats && !!text;

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
        {showText && <div className="bonus-card-text">{text}</div>}
        {/* Primary bonus seat (compact, no background panel). Stage shown on second row below STD/VIP */}
        {showSeats && (
          <div className="bonus-seat-compact">
            <div className="bonus-seat-row">
              {primary.standardFree ? <span className="seat-badge std" title="Энгийн сул суудал">STD {primary.standardFree}</span> : null}
              {primary.vipFree ? <span className="seat-badge vip" title="VIP сул суудал">VIP {primary.vipFree}</span> : null}
            </div>
            {primary.stageFree ? (
              <div className="bonus-seat-row">
                <span className="seat-badge stage" title="Stage сул суудал">STG {primary.stageFree}</span>
              </div>
            ) : null}
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
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    <div className="bonus-seat-row">
                      {b.standardFree ? <span className="seat-badge std" title="Энгийн сул суудал">STD {b.standardFree}</span> : null}
                      {b.vipFree ? <span className="seat-badge vip" title="VIP сул суудал">VIP {b.vipFree}</span> : null}
                    </div>
                    {b.stageFree ? (
                      <div className="bonus-seat-row">
                        <span className="seat-badge stage" title="Stage сул суудал">STG {b.stageFree}</span>
                      </div>
                    ) : null}
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
