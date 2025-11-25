import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Intro.css';

export default function Intro() {
  const navigate = useNavigate();

  return (
    <div className="intro-container">
      <div className="intro-content">
        <h1>Тавтай морилно уу</h1>
        <p>Game Center, VIP өрөө, тоглоомын төвүүдийг нэг дороос захиалж, хянах боломжтой.</p>
        
        <div className="intro-actions">
            <button className="btn-primary" onClick={() => navigate('/auth?mode=register')}>Цааш үргэлжлүүлэх</button>
          {/* <button className="btn-primary" onClick={() => navigate('/login')}>Нэвтрэх</button>
          <button className="btn-secondary" onClick={() => navigate('/register')}>Бүртгүүлэх</button> */}
          {/* <button className="btn-text" onClick={() => navigate('/map')}>Зочноор үргэлжлүүлэх</button> */}
        </div>
      </div>
    </div>
  );
}
