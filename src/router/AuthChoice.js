import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/Auth.css';

export default function AuthChoice() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mode = params.get('mode') === 'register' ? 'register' : 'login';

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-card" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div className="auth-header">
            <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>🎮 PC Center</h1>
            <h2 style={{ fontSize: '20px', marginBottom: '6px' }}>{mode === 'register' ? 'Бүртгүүлэх' : 'Нэвтрэх'}</h2>
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Та хэн байгаагаа сонгоно уу</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* User card */}
            <div style={{
              border: '2px solid #e2e8f0', 
              borderRadius: 14, 
              padding: '16px', 
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(66, 165, 245, 0.05) 100%)'
            }}>
              <h3 style={{ margin: 0, marginBottom: 8, color: '#1976d2', fontSize: 16, fontWeight: 700 }}>
                👤 Хэрэглэгчид зориулсан
              </h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#555', fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
                <li>PC төвүүдийг хайж олох</li>
                <li>Газрын зураг дээр харах</li>
                <li>Дуртай төвүүдээ хадгалах</li>
                <li>Бонус, ачаалал харах</li>
              </ul>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="auth-btn" style={{ flex: 1, height: 42, fontSize: '14px' }} onClick={() => navigate('/login?type=user')}>
                  Нэвтрэх
                </button>
                <button className="auth-btn" style={{ flex: 1, height: 42, fontSize: '14px', background: 'linear-gradient(135deg,#2e7d32,#66bb6a)' }} onClick={() => navigate('/register?type=user')}>
                  Бүртгүүлэх
                </button>
              </div>
            </div>

            {/* Owner card */}
            <div style={{
              border: '2px solid #e2e8f0', 
              borderRadius: 14, 
              padding: '16px', 
              background: 'linear-gradient(135deg, rgba(142, 36, 170, 0.05) 0%, rgba(186, 104, 200, 0.05) 100%)'
            }}>
              <h3 style={{ margin: 0, marginBottom: 8, color: '#8e24aa', fontSize: 16, fontWeight: 700 }}>
                🏢 PC Center эзэмшигчид
              </h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#555', fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
                <li>Өөрийн төвийн мэдээлэл оруулах</li>
                <li>Төвийн байршил, холбоо барих</li>
                <li>Бонус, ачаалал удирдах</li>
                <li>Ажиллах цаг тохируулах</li>
              </ul>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="auth-btn" style={{ flex: 1, height: 42, fontSize: '14px' }} onClick={() => navigate('/login?type=owner')}>
                  Нэвтрэх
                </button>
                <button className="auth-btn" style={{ flex: 1, height: 42, fontSize: '14px', background: 'linear-gradient(135deg,#8e24aa,#ba68c8)' }} onClick={() => navigate('/register?type=owner')}>
                  Бүртгүүлэх
                </button>
              </div>
              <div style={{ 
                marginTop: 10, 
                padding: '8px 10px', 
                background: 'rgba(255, 152, 0, 0.1)', 
                borderRadius: 8, 
                color: '#e65100', 
                fontSize: 11, 
                lineHeight: 1.4, 
                borderLeft: '3px solid #ff9800' 
              }}>
                <strong>⚠ Анхаар:</strong> PC Center-ийн нэр, хаяг оруулна уу. Админ баталгаажуулна.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
