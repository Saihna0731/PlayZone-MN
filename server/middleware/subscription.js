const User = require('../models/User');
const Center = require('../models/Center');

// Хэрэглэгчийн subscription шалгах middleware
const checkSubscription = (requiredPlan = 'normal') => {
	return async (req, res, next) => {
		try {
			const user = await User.findById(req.userId);
			if (!user) {
				return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
			}

			// Admin бол бүх зүйлд хандах эрхтэй
			if (user.role === 'admin') {
				return next();
			}

			// User subscription шалгах
			if (user.accountType === 'user') {
				const subscription = user.subscription;
				const trial = user.trial;
				const now = new Date();

				// Trial идэвхтэй эсэхийг эхлээд шалгах
				if (trial && trial.isActive && trial.endDate && now <= new Date(trial.endDate)) {
					// Trial хугацаанд байгаа бол эрх олгох
					return next();
				}

				// Trial дууссан бол идэвхгүй болгох
				if (trial && trial.isActive && trial.endDate && now > new Date(trial.endDate)) {
					user.trial.isActive = false;
					await user.save();
				}
				
				// Free plan хэрэглэгч бол хязгаарлах
				if (!subscription || subscription.plan === 'free') {
					return res.status(403).json({ 
						message: 'Энэ үйлдлийг хийхийн тулд төлбөртэй план авах шаардлагатай',
						upgrade: true 
					});
				}

				// Subscription дууссан эсэх шалгах
				if (subscription.endDate && new Date() > new Date(subscription.endDate)) {
					return res.status(403).json({ 
						message: 'Таны subscription дууссан байна',
						expired: true 
					});
				}

				// Subscription идэвхгүй эсэх
				if (!subscription.isActive) {
					return res.status(403).json({ 
						message: 'Таны subscription идэвхгүй байна',
						inactive: true 
					});
				}
			}

			next();
		} catch (error) {
			console.error('Subscription шалгахад алдаа:', error);
			res.status(500).json({ message: 'Серверийн алдаа' });
		}
	};
};

// Center Owner subscription шалгах
const checkCenterOwnerPlan = (requiredFeature) => {
	return async (req, res, next) => {
		try {
			const user = await User.findById(req.userId);
			if (!user) {
				return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
			}

			// Admin бол бүх зүйлд хандах эрхтэй
			if (user.role === 'admin') {
				return next();
			}

			// Center Owner эсэх шалгах
			if (user.accountType !== 'centerOwner') {
				return res.status(403).json({ 
					message: 'Зөвхөн Game Center эзэмшигчид хандах эрхтэй' 
				});
			}

			const subscription = user.subscription || {};
			const trial = user.trial;
			const now = new Date();

			// Trial идэвхтэй эсэхийг эхлээд шалгах
			if (trial && trial.isActive && trial.endDate && now <= new Date(trial.endDate)) {
				// Trial хугацаанд байгаа бол эрх олгох
				return next();
			}

			// Trial дууссан бол идэвхгүй болгох
			if (trial && trial.isActive && trial.endDate && now > new Date(trial.endDate)) {
				user.trial.isActive = false;
				await user.save();
			}

			// Free plan бол хязгаарлах
			if (!subscription || subscription.plan === 'free') {
				return res.status(403).json({ 
					message: 'Энэ үйлдлийг хийхийн тулд Business план авах шаардлагатай',
					upgrade: true,
					requiredFeature 
				});
			}

			// Subscription дууссан эсэх
			if (subscription.endDate && new Date() > new Date(subscription.endDate)) {
				return res.status(403).json({ 
					message: 'Таны subscription дууссан байна',
					expired: true 
				});
			}

			// Subscription идэвхгүй эсэх
			if (!subscription.isActive) {
				return res.status(403).json({ 
					message: 'Таны subscription идэвхгүй байна',
					inactive: true 
				});
			}

		// Тодорхой feature шаардлагатай бол шалгах
		if (requiredFeature) {
			switch (requiredFeature) {
				case 'video':
					if (!subscription.canUploadVideo) {
						return res.status(403).json({ 
							message: 'Video оруулахын тулд Business Pro план шаардлагатай',
							upgrade: true 
						});
					}
					break;
				case 'analytics':
					if (!subscription.hasAdvancedAnalytics) {
						return res.status(403).json({ 
							message: 'Дэвшилтэт analytics-д хандахын тулд Business Pro план шаардлагатай',
							upgrade: true 
						});
					}
					break;
				case 'marketing':
					if (!subscription.hasMarketingBoost) {
						return res.status(403).json({ 
							message: 'Marketing boost-д хандахын тулд Business Pro план шаардлагатай',
							upgrade: true 
						});
					}
					break;
				default:
					// No specific feature check
					break;
			}
		}			// Subscription мэдээллийг request-д хадгалах
			req.centerOwnerSubscription = subscription;
			next();
		} catch (error) {
			console.error('Center owner subscription шалгахад алдаа:', error);
			res.status(500).json({ message: 'Серверийн алдаа' });
		}
	};
};

// Center тоо хязгаарлах шалгалт
const checkCenterLimit = async (req, res, next) => {
	try {
		const user = await User.findById(req.userId);
		if (!user) {
			return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
		}

		// Admin бол хязгааргүй
		if (user.role === 'admin') {
			return next();
		}

		if (user.accountType !== 'centerOwner') {
			return res.status(403).json({ message: 'Зөвхөн Game Center эзэмшигчид' });
		}

		const subscription = user.subscription || {};
		const trial = user.trial;
		const now = new Date();
		const currentCenterCount = await Center.countDocuments({ owner: user._id });

		// Trial идэвхтэй эсэхийг шалгах
		let effectivePlan = subscription.plan || 'free';
		if (trial && trial.isActive && trial.endDate && now <= new Date(trial.endDate)) {
			effectivePlan = trial.plan; // Trial plan-г ашиглах
		} else if (trial && trial.isActive && trial.endDate && now > new Date(trial.endDate)) {
			// Trial дууссан бол идэвхгүй болгох
			user.trial.isActive = false;
			await user.save();
		}

		// Free plan бол center нэмэх эрхгүй
		if (effectivePlan === 'free') {
			return res.status(403).json({ 
				message: 'Game Center нэмэхийн тулд Business план авах шаардлагатай',
				upgrade: true 
			});
		}

			// Center тоо хязгаарлалт шалгах (trial plan эсвэл subscription plan)
				let maxCenters = 0;
				if (effectivePlan === 'business_standard') {
					maxCenters = Math.max(Number(subscription.maxCenters || 0), 1);
				} else if (effectivePlan === 'business_pro') {
					maxCenters = Math.max(Number(subscription.maxCenters || 0), 2);
				} else {
					maxCenters = Number(subscription.maxCenters || 0);
				}
			if (currentCenterCount >= maxCenters) {
				const extraCenterPrice = 19900; // ₮ per extra center
				return res.status(403).json({ 
					message: `Таны план дээр ${maxCenters} Game Center нэмэх боломжтой. Хязгаар давуулах бол төв бүр ${extraCenterPrice.toLocaleString()}₮ болно.`,
					upgrade: true,
					code: 'CENTER_LIMIT',
					currentCount: currentCenterCount,
					maxCount: maxCenters,
					extraCenterPrice
				});
			}

		next();
	} catch (error) {
		console.error('Center limit шалгахад алдаа:', error);
		res.status(500).json({ message: 'Серверийн алдаа' });
	}
};

module.exports = {
	checkSubscription,
	checkCenterOwnerPlan,
	checkCenterLimit,
	/**
	 * Зөвхөн өөрийн PC Center-ийг засах/устгах эрхийг шалгах
	 * - Admin бүх төвийг засах эрхтэй
	 * - CenterOwner өөрийн centers массивт байгаа төвүүдээ л засна/устгана
	 */
	ownerCanModifyCenter: async (req, res, next) => {
		try {
			const user = await User.findById(req.userId);
			if (!user) {
				return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
			}

			// Admin бүхэнд хандах эрхтэй
			if (user.role === 'admin') {
				return next();
			}

			if (user.accountType !== 'centerOwner') {
				return res.status(403).json({ message: 'Зөвхөн Game Center эзэмшигчид энэ үйлдлийг хийх эрхтэй' });
			}

			const centerId = req.params.id;
			if (!centerId) {
				return res.status(400).json({ message: 'Center ID буруу' });
			}

			const center = await Center.findById(centerId).select('owner');
			if (!center) {
				return res.status(404).json({ message: 'Center олдсонгүй' });
			}

			if (String(center.owner) !== String(user._id)) {
				return res.status(403).json({ message: 'Та зөвхөн өөрийн PC Center-ээ засварлах эрхтэй' });
			}

			return next();
		} catch (error) {
			console.error('Ownership шалгахад алдаа:', error);
			return res.status(500).json({ message: 'Серверийн алдаа' });
		}
	}
};
