const express = require('express');
const User = require('../models/User');
const PaymentCode = require('../models/PaymentCode');
const { auth } = require('../middleware/auth');

const router = express.Router();

// План тохиргоо
const planPrices = {
  'normal': 1990,
  'business_standard': 19900,
  'business_pro': 39900
};

const planNames = {
  'normal': 'Энгийн',
  'business_standard': 'Бизнес Стандарт',
  'business_pro': 'Бизнес Про'
};

const planConfig = {
  normal: { 
    maxCenters: 0, 
    maxImages: 3, 
    canUploadVideo: false,
    hasAdvancedAnalytics: false,
    hasMarketingBoost: false
  },
  business_standard: { 
    maxCenters: 1, 
    maxImages: 3, 
    canUploadVideo: false,
    hasAdvancedAnalytics: false,
    hasMarketingBoost: false
  },
  business_pro: { 
    maxCenters: 2, 
    maxImages: -1, 
    canUploadVideo: true,
    hasAdvancedAnalytics: true,
    hasMarketingBoost: true
  }
};

/**
 * Уникал төлбөрийн код үүсгэх
 * POST /api/payment/generate-code
 */
router.post('/generate-code', auth, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.userId;

    const amount = planPrices[planId];
    if (!amount) {
      return res.status(400).json({ message: 'Буруу план сонгогдсон' });
    }

    // Хэрэглэгчийн идэвхтэй pending код байгаа эсэхийг шалгах
    const existingCode = await PaymentCode.findOne({
      userId,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingCode) {
      return res.json({
        code: existingCode.code,
        amount: existingCode.amount,
        planId: existingCode.planId,
        expiresAt: existingCode.expiresAt,
        message: 'Таны өмнөх код идэвхтэй байна'
      });
    }

    // Уникал 6 оронтой код үүсгэх
    let code;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let randomPart = '';
      for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `PZ-${randomPart}`;

      const existing = await PaymentCode.findOne({ code });
      if (!existing) isUnique = true;
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ message: 'Код үүсгэхэд алдаа гарлаа' });
    }

    const paymentCode = new PaymentCode({
      code,
      userId,
      planId,
      amount,
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await paymentCode.save();

    res.json({
      code,
      amount,
      planId,
      expiresAt: paymentCode.expiresAt,
      message: 'Код амжилттай үүсгэгдлээ'
    });

  } catch (error) {
    console.error('Generate code error:', error);
    res.status(500).json({ message: 'Сервер алдаа' });
  }
});

/**
 * Monpay Notification баталгаажуулалт (iOS Shortcut)
 * POST /api/payment/monpay-verify
 */
router.post('/monpay-verify', async (req, res) => {
  try {
    // API Key шалгах
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.SHORTCUT_API_KEY) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized - Invalid API Key' 
      });
    }

    const { paymentCode, notificationText } = req.body;

    // Payment Code шаардлагатай
    if (!paymentCode) {
      return res.status(400).json({ 
        success: false,
        message: 'Төлбөрийн код (PZ-XXXXXX) шаардлагатай' 
      });
    }

    // Payment Code олох
    const codeRecord = await PaymentCode.findOne({ 
      code: paymentCode.toUpperCase().trim(),
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (!codeRecord) {
      return res.status(404).json({ 
        success: false,
        message: 'Төлбөрийн код олдсонгүй эсвэл хүчингүй болсон' 
      });
    }

    // Хэрэглэгч олох
    const user = await User.findById(codeRecord.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Хэрэглэгч олдсонгүй' 
      });
    }

    // Subscription идэвхжүүлэх
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    user.subscription = {
      plan: codeRecord.planId,
      isActive: true,
      startDate: now,
      endDate: endDate,
      autoRenew: false,
      paymentMethod: 'monpay',
      ...planConfig[codeRecord.planId]
    };

    if (user.trial && user.trial.isActive) {
      user.trial.isActive = false;
    }

    await user.save();

    // Payment Code completed болгох
    codeRecord.status = 'used';
    codeRecord.usedAt = now;
    await codeRecord.save();

    // Амжилттай болсон үед л лог хэвлэх
    console.log('✅ ТӨЛБӨР АМЖИЛТТАЙ:', {
      план: planNames[codeRecord.planId],
      хэрэглэгч: user.phone || user.email,
      дүн: `${codeRecord.amount}₮`
    });

    return res.json({ 
      success: true, 
      message: `🎉 Баяр хүргэе! Таны төлбөр баталгаажиж, ${planNames[codeRecord.planId]} эрх амжилттай идэвхжлээ!`,
      subscription: {
        plan: codeRecord.planId,
        planName: planNames[codeRecord.planId],
        endDate: endDate,
        daysLeft: 30
      }
    });

  } catch (error) {
    console.error('Monpay verify error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Серверийн алдаа гарлаа'
    });
  }
});

/**
 * Subscription status шалгах
 * GET /api/payment/subscription-status
 */
router.get('/subscription-status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('subscription trial');
    if (!user) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    const now = new Date();
    let status = {
      hasSubscription: false,
      plan: 'free',
      isActive: false,
      daysLeft: 0,
      endDate: null,
      isTrial: false
    };

    // Trial шалгах
    if (user.trial && user.trial.isActive && user.trial.endDate && now <= new Date(user.trial.endDate)) {
      const daysLeft = Math.ceil((new Date(user.trial.endDate) - now) / (1000 * 60 * 60 * 24));
      status = {
        hasSubscription: true,
        plan: user.trial.plan,
        isActive: true,
        daysLeft: daysLeft,
        endDate: user.trial.endDate,
        isTrial: true
      };
    }
    // Subscription шалгах
    else if (user.subscription && user.subscription.plan !== 'free') {
      const isActive = user.subscription.isActive && 
                      (!user.subscription.endDate || now <= new Date(user.subscription.endDate));
      
      const daysLeft = user.subscription.endDate 
        ? Math.ceil((new Date(user.subscription.endDate) - now) / (1000 * 60 * 60 * 24))
        : 0;

      status = {
        hasSubscription: true,
        plan: user.subscription.plan,
        isActive: isActive,
        daysLeft: Math.max(0, daysLeft),
        endDate: user.subscription.endDate,
        isTrial: false
      };
    }

    res.json(status);

  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ message: 'Алдаа гарлаа' });
  }
});

module.exports = router;
