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
        <div className="auth-card">
          <div className="auth-header">
            <h1>🎮 PC Center</h1>
            <h2>{mode === 'register' ? 'Бүртгүүлэх' : 'Нэвтрэх'}</h2>
            <p>Та хэн байгаагаа сонгоно уу</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* User card */}
            <div style={{
              border: '2px solid #e2e8f0', borderRadius: 16, padding: 20, background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(66, 165, 245, 0.05) 100%)'
            }}>
              <h3 style={{ margin: 0, marginBottom: 10, color: '#1976d2', fontSize: 17, fontWeight: 700 }}>
                👤 Хэрэглэгчид зориулсан
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#555', fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
                <li>PC төвүүдийг хайж олох</li>
                <li>Газрын зураг дээр харах</li>
                <li>Дуртай төвүүдээ хадгалах</li>
                <li>Бонус, ачаалал харах</li>
              </ul>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="auth-btn" style={{ flex: 1, height: 46 }} onClick={() => navigate('/login?type=user')}>
                  Нэвтрэх
                </button>
                <button className="auth-btn" style={{ flex: 1, height: 46, background: 'linear-gradient(135deg,#2e7d32,#66bb6a)' }} onClick={() => navigate('/register?type=user')}>
                  Бүртгүүлэх
                </button>
              </div>
            </div>

            {/* Owner card */}
            <div style={{
              border: '2px solid #e2e8f0', borderRadius: 16, padding: 20, background: 'linear-gradient(135deg, rgba(142, 36, 170, 0.05) 0%, rgba(186, 104, 200, 0.05) 100%)'
            }}>
              <h3 style={{ margin: 0, marginBottom: 10, color: '#8e24aa', fontSize: 17, fontWeight: 700 }}>
                🏢 PC Center эзэмшигчид зориулсан
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#555', fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
                <li>Өөрийн төвийн мэдээлэл оруулах</li>
                <li>Төвийн нэр, байршил, холбоо барих</li>
                <li>Бонус, ачаалал удирдах</li>
                <li>Ажиллах цаг тохируулах</li>
              </ul>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="auth-btn" style={{ flex: 1, height: 46 }} onClick={() => navigate('/login?type=owner')}>
                  Нэвтрэх
                </button>
                <button className="auth-btn" style={{ flex: 1, height: 46, background: 'linear-gradient(135deg,#8e24aa,#ba68c8)' }} onClick={() => navigate('/register?type=owner')}>
                  Бүртгүүлэх
                </button>
              </div>
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255, 152, 0, 0.1)', borderRadius: 8, color: '#e65100', fontSize: 12, lineHeight: 1.5, borderLeft: '3px solid #ff9800' }}>
                <strong>� Анхаар:</strong> Бүртгүүлэхдээ PC Center-ийн нэр, хаяг зэрэг мэдээллээ бүрэн оруулна уу. Админ баталгаажуулсны дараа идэвхжинэ.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
