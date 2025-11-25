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
            <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>🎮 Game Centers</h1>
            <h2 style={{ fontSize: '20px', marginBottom: '6px' }}>Та хэрэглэгч эсвэл тоглоомийн төвийн эзэмшигч эсэхээ сонгоно уу!!!</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* User card */}
            <div style={{
              border: 'none',
              borderRadius: 16, 
              padding: '20px', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
              color: 'white'
            }}>
              <h3 style={{ margin: 0, marginBottom: 12, color: 'white', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                👤 Хэрэглэгчид зориулсан
              </h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'rgba(255,255,255,0.95)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                <li>PC төвүүдийг хайж олох</li>
                <li>Газрын зураг дээр харах</li>
                <li>Дуртай төвүүдээ хадгалах</li>
                <li>Бонус, ачаалал харах</li>
              </ul>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="auth-btn" style={{ flex: 1, height: 44, fontSize: '14px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => navigate('/login?type=user')}>
                  Нэвтрэх
                </button>
                <button className="auth-btn" style={{ flex: 1, height: 44, fontSize: '14px', background: 'white', color: '#667eea', fontWeight: 700 }} onClick={() => navigate('/register?type=user')}>
                  Бүртгүүлэх
                </button>
              </div>
            </div>

            {/* Owner card */}
            <div style={{
              border: 'none',
              borderRadius: 16, 
              padding: '20px', 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              boxShadow: '0 8px 24px rgba(240, 147, 251, 0.3)',
              color: 'white'
            }}>
              <h3 style={{ margin: 0, marginBottom: 12, color: 'white', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                🏢 Game Center эзэмшигчид
              </h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'rgba(255,255,255,0.95)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                <li>Өөрийн төвийн мэдээлэл оруулах(Video, Зураг, Ачаалал, Шинэлэг төхөөрөмжүүд)</li>
                <li>Төвийн байршил, холбоо барих</li>
                <li>Бонус(event, сул суудал оруулах), ачаалал удирдах</li>
                <li>Ажиллах цаг тохируулах</li>
              </ul>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="auth-btn" style={{ flex: 1, height: 44, fontSize: '14px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => navigate('/login?type=owner')}>
                  Нэвтрэх
                </button>
                <button className="auth-btn" style={{ flex: 1, height: 44, fontSize: '14px', background: 'white', color: '#f5576c', fontWeight: 700 }} onClick={() => navigate('/register?type=owner')}>
                  Бүртгүүлэх
                </button>
              </div>
              <div style={{ 
                marginTop: 12, 
                padding: '10px 12px', 
                background: 'rgba(255, 255, 255, 0.2)', 
                backdropFilter: 'blur(10px)',
                borderRadius: 10, 
                color: 'white', 
                fontSize: 12, 
                lineHeight: 1.5, 
                border: '1px solid rgba(255,255,255,0.3)'
              }}>
                <strong>⚠️ Анхаар:</strong> Game Center-ийн нэр, mail, дугаарыг үнэн зөв оруулна уу. Админ баталгаажуулна.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
