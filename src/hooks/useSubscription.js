import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useSubscription() {
	const { user, isAdmin, isCenterOwner } = useAuth();

	return useMemo(() => {
		const subscription = user?.subscription || { plan: 'free', isActive: true };
		const plan = subscription?.plan || 'free';
		const isPremiumUser = !!user && user.role === 'user' && plan !== 'free';
		const canViewDetails = Boolean(isAdmin || isCenterOwner || isPremiumUser);
		return { subscription, plan, isPremiumUser, isOwner: isCenterOwner, isAdmin, canViewDetails };
	}, [user, isAdmin, isCenterOwner]);
}
