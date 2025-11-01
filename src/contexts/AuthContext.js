import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	// Configure axios base and auth header
	const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
	if (token) {
		axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
	} else {
		delete axios.defaults.headers.common['Authorization'];
	}

	const fetchProfile = async () => {
		try {
			if (!localStorage.getItem('token')) {
				setUser(null);
				return;
			}
			const res = await axios.get(`${API_BASE}/api/auth/profile`);
			setUser(res.data);
		} catch (e) {
			// Хуучин/буруу token байвал автоматаар цэвэрлэнэ
			if (e?.response?.status === 401) {
				localStorage.removeItem('token');
				delete axios.defaults.headers.common['Authorization'];
			}
			setUser(null);
		}
	};

	useEffect(() => {
		// 401 global handler — зөвхөн profile дуудлагад token-ийг цэвэрлэнэ
		const respInterceptor = axios.interceptors.response.use(
			(res) => res,
			(err) => {
				const status = err?.response?.status;
				const url = err?.config?.url || '';
				if (status === 401 && url.includes('/api/auth/profile')) {
					localStorage.removeItem('token');
					delete axios.defaults.headers.common['Authorization'];
					setUser(null);
				}
				return Promise.reject(err);
			}
		);

		(async () => {
			await fetchProfile();
			setLoading(false);
		})();

		return () => axios.interceptors.response.eject(respInterceptor);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const login = async ({ emailOrUsername, password }) => {
		try {
			const res = await axios.post(`${API_BASE}/api/auth/login`, { emailOrUsername, password });
			const { token, user } = res.data;
			localStorage.setItem('token', token);
			axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
			setUser(user);
			return { success: true };
		} catch (err) {
			const message = err?.response?.data?.message || 'Нэвтрэхэд алдаа гарлаа';
			return { success: false, message };
		}
	};

		const register = async (payload) => {
		try {
				// Одоогоор backend зөвхөн /register-г дэмждэг. accountType-ийг илгээж хадгалж болно (server ignore хийхэд OK)
				const res = await axios.post(`${API_BASE}/api/auth/register`, payload);
			const { token, user } = res.data;
			localStorage.setItem('token', token);
			axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
			setUser(user);
			return { success: true };
		} catch (err) {
			const message = err?.response?.data?.message || 'Бүртгүүлэхэд алдаа гарлаа';
			return { success: false, message };
		}
	};

	const logout = () => {
		localStorage.removeItem('token');
		delete axios.defaults.headers.common['Authorization'];
		setUser(null);
	};

	const updateProfile = async (payload) => {
		try {
			const res = await axios.put(`${API_BASE}/api/auth/profile`, payload);
			setUser(res.data.user);
			return { success: true, message: res.data.message || 'Амжилттай шинэчлэгдлээ' };
		} catch (err) {
			const message = err?.response?.data?.message || 'Шинэчлэхэд алдаа гарлаа';
			return { success: false, message };
		}
	};

		const value = useMemo(() => ({
			user,
			isAuthenticated: !!user,
			isAdmin: user?.role === 'admin' || user?.accountType === 'admin',
			isCenterOwner: user?.role === 'centerOwner' || user?.accountType === 'centerOwner',
			token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
			login,
			register,
			logout,
			updateProfile,
			refresh: fetchProfile,
			refreshUser: fetchProfile,
			loading
		}), [user, loading]);

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}
