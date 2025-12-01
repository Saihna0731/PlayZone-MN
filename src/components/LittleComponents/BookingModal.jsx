import React, { useState } from 'react';
import { FaTimes, FaCalendarAlt, FaClock, FaChair } from 'react-icons/fa';
import '../../styles/BookingModal.css';

export default function BookingModal({ isOpen, onClose, center, onConfirm }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [seatType, setSeatType] = useState('standard');
  const [seats, setSeats] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (submitting) return; // Prevent double click
    if (!date || !time) {
      setError('Өдөр болон цаг сонгоно уу');
      return;
    }
    setSubmitting(true);
    setError('');
    const price = (center.pricing?.[seatType] || center.price || 0) * duration * seats;
    try {
      await onConfirm({ 
        date, 
        time, 
        duration, 
        type: seatType, 
        seats,
        price 
      });
    } catch (err) {
      setError('Захиалга илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-modal-backdrop">
      <div className="booking-modal">
        <div className="booking-modal-header">
          <h3>Захиалга өгөх</h3>
          <button onClick={onClose}><FaTimes /></button>
        </div>
        
        <div className="booking-modal-content">
          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}
          <div className="booking-field">
            <label><FaCalendarAlt /> Өдөр</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="booking-field">
            <label><FaClock /> Цаг</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>

          <div className="booking-field">
            <label>Үргэлжлэх хугацаа (цаг)</label>
            <div className="duration-selector">
              {[1, 2, 3, 4, 5].map(h => (
                <button 
                  key={h} 
                  className={duration === h ? 'active' : ''}
                  onClick={() => setDuration(h)}
                >
                  {h}ц
                </button>
              ))}
            </div>
          </div>

          <div className="booking-field">
            <label><FaChair /> Суудлын төрөл</label>
            <select value={seatType} onChange={e => setSeatType(e.target.value)}>
              <option value="standard">Энгийн</option>
              <option value="vip">VIP</option>
              <option value="stage">Stage</option>
            </select>
          </div>

          <div className="booking-field">
            <label>Хүний тоо</label>
            <input 
              type="number" 
              min="1" 
              max="10" 
              value={seats} 
              onChange={e => setSeats(parseInt(e.target.value))} 
            />
          </div>
        </div>

        <div className="booking-modal-footer">
          <div className="total-price">
            Нийт: {(center.pricing?.[seatType] || center.price || 0) * duration * seats}₮
          </div>
          <button 
            className="confirm-btn" 
            onClick={handleSubmit}
            disabled={submitting}
            style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? '⏳ Илгээж байна...' : 'Баталгаажуулах'}
          </button>
        </div>
      </div>
    </div>
  );
}
