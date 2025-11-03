import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_BASE } from '../config';

// Use the same base as the server (server/index.js -> PORT/.env)
const API_URL = `${API_BASE}/api`;

export function useSubscription() {
	const { user, isAdmin, isCenterOwner } = useAuth();
	const [subscription, setSubscription] = useState(null);
	const [loading, setLoading] = useState(false);

	// Subscription мэдээлэл татах
	const fetchSubscription = useCallback(async () => {
		if (!user) return;
		
		try {
			const token = localStorage.getItem('token');
			const response = await axios.get(`${API_URL}/subscription/me`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			
			if (response.data.success) {
				setSubscription(response.data.subscription);
			}
		} catch (error) {
			console.error('Subscription татахад алдаа:', error);
		}
	}, [user]);

	// Component mount хийхэд subscription татах
	useEffect(() => {
		fetchSubscription();
	}, [fetchSubscription]);

	// Plan upgrade хийх
	const upgradeToplan = useCallback(async (plan, paymentMethod = 'mock') => {
		setLoading(true);
		try {
			const token = localStorage.getItem('token');
			const response = await axios.post(
				`${API_URL}/subscription/upgrade`,
				{ 
					planId: plan.id, 
					paymentMethod 
				},
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data.success) {
				// Subscription мэдээлэл шинэчлэх
				await fetchSubscription();
				return { success: true, message: response.data.message };
			}
		} catch (error) {
			console.error('Upgrade хийхэд алдаа:', error);
			return { 
				success: false, 
				message: error.response?.data?.message || 'Алдаа гарлаа' 
			};
		} finally {
			setLoading(false);
		}
	}, [fetchSubscription]);

	// Subscription цуцлах
	const cancelSubscription = useCallback(async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem('token');
			const response = await axios.post(
				`${API_URL}/subscription/cancel`,
				{},
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data.success) {
				await fetchSubscription();
				return { success: true, message: response.data.message };
			}
		} catch (error) {
			console.error('Subscription цуцлахад алдаа:', error);
			return { 
				success: false, 
				message: error.response?.data?.message || 'Алдаа гарлаа' 
			};
		} finally {
			setLoading(false);
		}
	}, [fetchSubscription]);

	// Subscription мэдээллийг шинэчлэх
	const refreshSubscription = useCallback(async () => {
		await fetchSubscription();
	}, [fetchSubscription]);

	// Computed values
	const computed = useMemo(() => {
		const plan = subscription?.plan || 'free';
		const isPremiumUser = Boolean(user && user.role === 'user' && plan !== 'free');
		const isPaidOwner = Boolean(isCenterOwner && plan !== 'free');
		// paid access only: admin OR paid owner OR premium user
		const canViewDetails = Boolean(isAdmin || isPaidOwner || isPremiumUser);
		
		return {
			subscription,
			plan,
			isPremiumUser,
			isOwner: isCenterOwner,
			isAdmin,
			canViewDetails,
			loading
		};
	}, [subscription, user, isAdmin, isCenterOwner, loading]);

	return {
		...computed,
		upgradeToplan,
		cancelSubscription,
		refreshSubscription
	};
}
