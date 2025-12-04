import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const Login = () => {
	const [params] = useSearchParams();
	const initialType = params.get('type') === 'owner' ? 'centerOwner' : 'user';
	const accountType = initialType;
	const [formData, setFormData] = useState({ emailOrUsername: '', password: '' });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const { login } = useAuth();
	const navigate = useNavigate();

	const handleChange = (e) => {
		setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
		setError('');
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		if (!formData.emailOrUsername || !formData.password) {
			setError('Имэйл/нэр болон нууц үгээ бөглөнө үү');
			setLoading(false);
			return;
		}

		const result = await login({ ...formData, accountType });
		if (result.success) {
			navigate('/map');
		} else {
			setError(result.message);
		}
		setLoading(false);
	};

	return (
		<div className="auth-container">
			<div className="auth-background">
				<div className="auth-card login-card" style={{
					background: 'white',
					borderRadius: '20px',
					boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
					padding: '32px',
					maxWidth: '440px'
				}}>
				<div className="auth-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
					<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
						<img src="/playzone-logo.svg" alt="PlayZone MN" style={{ height: '50px' }} />
					</div>
					<h2 style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6', marginBottom: '6px' }}>
						{accountType === 'centerOwner' ? '🏢 Эзэмшигч нэвтрэх' : accountType === 'admin' ? '👨‍💼 Админ нэвтрэх' : '👤 Хэрэглэгч нэвтрэх'}
					</h2>
					<p style={{ color: '#6b7280', fontSize: '14px' }}>Тавтай морил! Дансандаа нэвтэрнэ үү</p>
				</div>

				<form onSubmit={handleSubmit} className="auth-form">
						{error && (
							<div className="error-message">
								<span>⚠️ {error}</span>
							</div>
						)}
						<div className="form-group">
							<label htmlFor="emailOrUsername">📧 Имэйл эсвэл хэрэглэгчийн нэр</label>
							<input
								id="emailOrUsername"
								name="emailOrUsername"
								type="text"
								value={formData.emailOrUsername}
								onChange={handleChange}
								placeholder="email@example.com эсвэл username"
							/>
						</div>
						<div className="form-group">
							<label htmlFor="password">🔒 Нууц үг</label>
							<input
								id="password"
								name="password"
								type="password"
								value={formData.password}
								onChange={handleChange}
								placeholder="••••••"
							/>
						</div>
						<button type="submit" className={`auth-btn ${loading ? 'loading' : ''}`} disabled={loading}>
							{loading ? '⏳ Нэвтэрч байна...' : '🚀 Нэвтрэх'}
						</button>
					</form>

					<div className="auth-links">
						{accountType !== 'admin' && (
							<p>
								Дансгүй юу?{' '}
								<Link to={`/register?type=${accountType==='centerOwner'?'owner':'user'}`} className="auth-link">Бүртгүүлэх</Link>
							</p>
						)}
						{/* Forgot password link */}
						<p>
							<Link to="/forgot" className="auth-link">Нууц үгээ мартсан уу?</Link>
						</p>
						<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
							<Link to="/auth?mode=register" className="back-link">← Сонголт руу буцах</Link>
							<Link to="/map" className="back-link">🏠 Нүүр хуудас</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
