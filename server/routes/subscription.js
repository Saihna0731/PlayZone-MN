const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// Plan үнийн мэдээлэл
const PLAN_PRICES = {
	// User plans
	normal: {
		price: 4990,
		name: 'Энгийн',
		duration: 30, // days
		features: ['Бүх төв харах', 'Дэлгэрэнгүй мэдээлэл', 'Ачаалал шалгах', 'Дуртай төв нэмэх']
	},
	// Center Owner plans
	business_standard: {
		price: 29900,
		name: 'Бизнес Стандарт',
		duration: 30,
		maxCenters: 1,
		maxImages: 3,
		canUploadVideo: false,
		hasMarketingBoost: false,
		hasAdvancedAnalytics: false,
		features: ['1 төв нэмэх', '3 зураг оруулах', 'Ачаалал засах']
	},
	business_pro: {
		price: 59900,
		name: 'Бизнес Про',
		duration: 30,
		maxCenters: 3,
		maxImages: 999,
		canUploadVideo: true,
		hasMarketingBoost: true,
		hasAdvancedAnalytics: true,
		features: ['3 төв нэмэх', 'Хязгааргүй зураг', 'Video оруулах', 'VIP дэмжлэг']
	}
};

// Хэрэглэгчийн subscription мэдээлэл авах
router.get('/me', auth, async (req, res) => {
	try {
		const userId = req.userId;
		if (!userId) {
			return res.status(401).json({ message: 'Нэвтрэх шаардлагатай' });
		}
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
		}

	const plan = user.subscription?.plan || 'free';
		// Default based on plan when not stored on user
		const defaults = {
			maxCenters: plan === 'business_standard' ? 1 : plan === 'business_pro' ? 3 : 0,
			maxImages: plan === 'business_standard' ? 3 : plan === 'business_pro' ? PLAN_PRICES.business_pro.maxImages : 0,
			canUploadVideo: plan === 'business_pro'
		};

		let subscriptionData = {
			plan,
			isActive: user.subscription?.isActive || false,
			startDate: user.subscription?.startDate,
			endDate: user.subscription?.endDate,
			autoRenew: user.subscription?.autoRenew || false,
			accountType: user.accountType,
			maxCenters: Math.max(Number(user.subscription?.maxCenters || 0), defaults.maxCenters),
			maxImages: Math.max(Number(user.subscription?.maxImages || 0), defaults.maxImages),
			canUploadVideo: typeof user.subscription?.canUploadVideo === 'boolean' ? user.subscription.canUploadVideo : defaults.canUploadVideo,
			hasMarketingBoost: user.subscription?.hasMarketingBoost || false,
			hasAdvancedAnalytics: user.subscription?.hasAdvancedAnalytics || false
		};

		res.json({ success: true, subscription: subscriptionData });
	} catch (error) {
		console.error('Subscription мэдээлэл авахад алдаа:', error);
		res.status(500).json({ message: 'Серверийн алдаа' });
	}
});

// Plan-руу upgrade хийх (Mock төлбөр)
router.post('/upgrade', auth, async (req, res) => {
	try {
		const { planId, paymentMethod = 'mock' } = req.body;

		if (!planId || !PLAN_PRICES[planId]) {
			return res.status(400).json({ message: 'Буруу план сонгогдсон' });
		}

		const userId = req.userId;
		if (!userId) {
			return res.status(401).json({ message: 'Нэвтрэх шаардлагатай' });
		}
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
		}

		const planInfo = PLAN_PRICES[planId];
		// Normalize payment method to allowed enum to avoid validation 500
		const allowed = ['qpay', 'mostmoney', 'card', 'mock', 'admin'];
		const method = allowed.includes(paymentMethod) ? paymentMethod : 'mock';
		const now = new Date();
		const endDate = new Date(now.getTime() + planInfo.duration * 24 * 60 * 60 * 1000);

		// Block repurchasing same active plan
		if (user.subscription && user.subscription.plan === planId) {
			const notExpired = !user.subscription.endDate || new Date(user.subscription.endDate) > now;
			if (user.subscription.isActive !== false && notExpired) {
				return res.status(400).json({ message: 'Та энэ плантай аль хэдийн идэвхтэй байна' });
			}
		}

		// User subscription upgrade
		if (planId === 'normal' && user.accountType === 'user') {
					user.subscription = {
				plan: planId,
				isActive: true,
				startDate: now,
				endDate: endDate,
				autoRenew: true,
						paymentMethod: method
			};
			await user.save();

			return res.json({
				success: true,
				message: `${planInfo.name} план руу амжилттай шинэчлэгдлээ!`,
				subscription: user.subscription
			});
		}


		// Center Owner subscription upgrade (users collection-д хадгална)
		if ((planId === 'business_standard' || planId === 'business_pro') && user.accountType === 'centerOwner') {
					user.subscription = {
				plan: planId,
				isActive: true,
				startDate: now,
				endDate: endDate,
				autoRenew: true,
						paymentMethod: method,
				maxCenters: planInfo.maxCenters,
				maxImages: planInfo.maxImages,
				canUploadVideo: planInfo.canUploadVideo,
				hasMarketingBoost: planInfo.hasMarketingBoost,
				hasAdvancedAnalytics: planInfo.hasAdvancedAnalytics
			};
			await user.save();

			return res.json({
				success: true,
				message: `${planInfo.name} план руу амжилттай шинэчлэгдлээ!`,
				subscription: user.subscription
			});
		}

		return res.status(400).json({ 
			message: 'Таны эрхэд тохирох план сонгоно уу' 
		});

	} catch (error) {
		console.error('Upgrade хийхэд алдаа:', error);
		res.status(500).json({ message: 'Серверийн алдаа' });
	}
});

// Subscription цуцлах
router.post('/cancel', auth, async (req, res) => {
	try {
		const userId = req.userId;
		if (!userId) {
			return res.status(401).json({ message: 'Нэвтрэх шаардлагатай' });
		}
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
		}

		// Албан ёсны бүх төрлийн хэрэглэгчийн subscription-г идэвхгүй болгоно
		if (user.subscription) {
			user.subscription.isActive = false;
			user.subscription.autoRenew = false;
			await user.save();
		}

		res.json({ 
			success: true, 
			message: 'Subscription амжилттай цуцлагдлаа' 
		});
	} catch (error) {
		console.error('Subscription цуцлахад алдаа:', error);
		res.status(500).json({ message: 'Серверийн алдаа' });
	}
});

// Admin: Хэрэглэгчийн subscription удирдах
router.post('/admin/set-plan', auth, async (req, res) => {
	try {
		const authUserId = req.userId;
		if (!authUserId) {
			return res.status(401).json({ message: 'Нэвтрэх шаардлагатай' });
		}
		const user = await User.findById(authUserId);
		if (!user || user.role !== 'admin') {
			return res.status(403).json({ message: 'Зөвхөн админ хандах эрхтэй' });
		}

		const { userId, planId, duration = 30 } = req.body;
		
		const targetUser = await User.findById(userId);
		if (!targetUser) {
			return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
		}

		const now = new Date();
		const endDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

		const planInfo = PLAN_PRICES[planId] || {};
		targetUser.subscription = {
			plan: planId,
			isActive: true,
			startDate: now,
			endDate: endDate,
			autoRenew: false,
			paymentMethod: 'admin',
			maxCenters: planInfo.maxCenters || 0,
			maxImages: planInfo.maxImages || 0,
			canUploadVideo: planInfo.canUploadVideo || false,
			hasMarketingBoost: planInfo.hasMarketingBoost || false,
			hasAdvancedAnalytics: planInfo.hasAdvancedAnalytics || false
		};
		await targetUser.save();

		res.json({ 
			success: true, 
			message: 'Subscription амжилттай тохируулагдлаа' 
		});
	} catch (error) {
		console.error('Admin subscription тохируулахад алдаа:', error);
		res.status(500).json({ message: 'Серверийн алдаа' });
	}
});

// Plan-ууд авах
router.get('/plans', async (req, res) => {
	try {
		res.json({ success: true, plans: PLAN_PRICES });
	} catch (error) {
		res.status(500).json({ message: 'Серверийн алдаа' });
	}
});

module.exports = router;
