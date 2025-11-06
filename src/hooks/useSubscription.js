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

		setLoading(true);
		try {
			const token = localStorage.getItem('token');
			const response = await axios.get(`${API_URL}/subscription/me`, {//Database-с subscription мэдээлэл авах
				headers: { Authorization: `Bearer ${token}` }//Эндпоинт рүү илгээх токен
			});
			
			if (response.data.success) {
				setSubscription(response.data.subscription);
			} else {
				setSubscription(null);
			}
		} catch (error) {
			console.error('Subscription татахад алдаа:', error);
			setSubscription(null);
		} finally {
			setLoading(false);
		}
	}, [user]);

	// Component mount хийхэд subscription татах
	useEffect(() => {
		fetchSubscription();
	}, [fetchSubscription]);

	// Logout хийсний дараа subscription мэдээллийг цэвэрлэнэ
	useEffect(() => {
		if (!user) {
			setSubscription(null);
			setLoading(false);
		}
	}, [user]);

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
		if (!user) {
			return {
				subscription: null,
				plan: 'free',
				isPremiumUser: false,
				isOwner: false,
				isAdmin: false,
				canViewDetails: false,
				loading
			};
		}

		const planInfo = subscription?.plan;
		const planCandidate = typeof planInfo === 'string'
			? planInfo
			: planInfo?.id || planInfo?.slug || planInfo?.code || planInfo?.name || '';
		const planString = planCandidate ? String(planCandidate) : 'free';
		const normalizedPlan = planString.toLowerCase();

		const statusRaw = (subscription?.status || subscription?.state || '').toString().toLowerCase();
		const statusImpliesActive = ['active', 'trialing', 'pending'].includes(statusRaw);
		const endDateRaw = subscription?.endDate ? new Date(subscription.endDate) : null;
		const endDateValid = endDateRaw instanceof Date && !Number.isNaN(endDateRaw.valueOf()) ? endDateRaw : null;
		const now = Date.now();
		const notExpired = !endDateValid || endDateValid.getTime() >= now;
		// isActive === false бол зөвхөн хугацаа дууссан (expired) үед л идэвхгүй гэж үзнэ
		const explicitInactive = (subscription?.isActive === false) && (endDateValid != null) && (endDateValid.getTime() < now);
		// Нэмэлт идэвхтэй нөхцөлүүд: сервер статус идэвхтэй эсвэл хугацаа дуусаагүй, эсвэл isActive === true
		const inferredActive = statusImpliesActive || (!statusRaw && notExpired) || subscription?.isActive === true;
		const isActive = !explicitInactive && inferredActive;
		// Төлбөртэй (free биш) болон хугацаа дуусаагүй бол төлбөртэй гэж үзнэ
		const hasPaidPlan = (normalizedPlan !== 'free' && normalizedPlan !== '') && notExpired && !explicitInactive;

		const role = user?.role || user?.accountType;
		const isPaidOwner = Boolean(isCenterOwner && hasPaidPlan);
		const isPaidUser = Boolean(hasPaidPlan && !isCenterOwner && role !== 'admin');
		const canViewDetails = Boolean(isAdmin || isPaidOwner || isPaidUser);
		
		return {
			subscription,
			plan: planString,
			isPremiumUser: isPaidUser,
			isOwner: isCenterOwner,
			isAdmin,
			canViewDetails,
			isActiveSubscription: isActive,
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
