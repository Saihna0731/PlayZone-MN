const express = require('express');
const User = require('../models/User');
const PendingPayment = require('../models/PendingPayment');
const SmsLog = require('../models/SmsLog');
const PaymentCode = require('../models/PaymentCode');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * Уникал төлбөрийн код үүсгэх
 * POST /api/payment/generate-code
 * 
 * Body: {
 *   planId: string ('normal', 'business_standard', 'business_pro')
 * }
 * 
 * Returns: {
 *   code: string (e.g., 'PZ-A1B2C3'),
 *   amount: number,
 *   expiresAt: Date
 * }
 */
router.post('/generate-code', auth, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.userId;

    // План үнэ шалгах
    const planPrices = {
      'normal': 1990,
      'business_standard': 19900,
      'business_pro': 39900
    };

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
      // Хуучин код-ийг буцаах (давхар код үүсгэхгүй)
      return res.json({
        code: existingCode.code,
        amount: existingCode.amount,
        planId: existingCode.planId,
        expiresAt: existingCode.expiresAt,
        message: 'Таны өмнөх код идэвхтэй байна'
      });
    }

    // Уникал 6 оронтой код үүсгэх (PZ-XXXXXX format)
    let code;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate random 6-char alphanumeric code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking: 0,O,1,I
      let randomPart = '';
      for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `PZ-${randomPart}`;

      // Check uniqueness
      const existing = await PaymentCode.findOne({ code });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ message: 'Код үүсгэхэд алдаа гарлаа. Дахин оролдоно уу' });
    }

    // Код хадгалах
    const paymentCode = new PaymentCode({
      code,
      userId,
      planId,
      amount,
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
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
    res.status(500).json({ message: 'Сервер алдаа', error: error.message });
  }
});

/**
 * SMS баталгаажуулалтаар subscription идэвхжүүлэх
 * POST /api/payment/verify-sms
 * 
 * Body: {
 *   userId: string,
 *   planId: string ('normal', 'business_standard', 'business_pro'),
 *   amount: number (1990, 19900, 39900),
 *   transactionId: string (SMS-с ирсэн гүйлгээний дугаар),
 *   smsText: string (Бүтэн SMS текст - optional, logged only)
 * }
 */
router.post('/verify-sms', auth, async (req, res) => {
  try {
    const { planId, amount, transactionId, smsText } = req.body;
    const userId = req.userId;

    // Validation
    if (!planId || !amount || !transactionId) {
      return res.status(400).json({ 
        message: 'План, дүн болон гүйлгээний дугаар шаардлагатай' 
      });
    }

    // План үнэ шалгах
    const planPrices = {
      'normal': 1990,
      'business_standard': 19900,
      'business_pro': 39900
    };

    const expectedPrice = planPrices[planId];
    if (!expectedPrice) {
      return res.status(400).json({ message: 'Буруу план сонгогдсон' });
    }

    // Үнэ тохирч байгаа эсэх
    if (Number(amount) !== expectedPrice) {
      return res.status(400).json({ 
        message: `Төлбөрийн дүн буруу байна. ${planId} планд ${expectedPrice}₮ шаардлагатай` 
      });
    }

    // Log SMS text for debugging (optional)
    if (smsText) {
      console.log('SMS баталгаажуулалт:', {
        userId,
        planId,
        amount,
        transactionId,
        smsText: smsText.substring(0, 100) // First 100 chars only
      });
    }

    // Хэрэглэгч олох
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    // Subscription идэвхжүүлэх
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1); // 1 сарын эрх

    // План тохиргоо
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
        maxImages: -1, // unlimited
        canUploadVideo: true,
        hasAdvancedAnalytics: true,
        hasMarketingBoost: true
      }
    };

    const config = planConfig[planId];

    user.subscription = {
      plan: planId,
      isActive: true,
      startDate: now,
      endDate: endDate,
      autoRenew: false,
      paymentMethod: 'bank_transfer',
      ...config
    };

    // Trial-ийг идэвхгүй болгох (хэрэв идэвхтэй байвал)
    if (user.trial && user.trial.isActive) {
      user.trial.isActive = false;
    }

    await user.save();

    // Payment transaction log үүсгэх (optional - хэрэв Payment model байвал)
    // await Payment.create({
    //   user: userId,
    //   plan: planId,
    //   amount: amount,
    //   transactionId: transactionId,
    //   status: 'completed',
    //   paymentMethod: 'bank_transfer',
    //   verifiedAt: now
    // });

    res.json({
      success: true,
      message: '🎉 Төлбөр амжилттай баталгаажлаа! Таны эрх идэвхжлээ.',
      subscription: user.subscription
    });

  } catch (error) {
    console.error('SMS verification error:', error);
    res.status(500).json({ 
      message: 'Баталгаажуулахад алдаа гарлаа',
      error: error.message 
    });
  }
});

/**
 * Гүйлгээний дугаараар шалгах (Давхар шалгалт өгөх)
 * GET /api/payment/check-transaction/:transactionId
 */
router.get('/check-transaction/:transactionId', auth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // Энэ transaction ID өмнө ашигласан эсэхийг шалгах
    const existingSmsLog = await SmsLog.findOne({ transactionId });
    if (existingSmsLog) {
      return res.status(400).json({ 
        message: 'Энэ гүйлгээг өмнө нь ашигласан байна',
        used: true,
        processedAt: existingSmsLog.createdAt
      });
    }

    res.json({ 
      message: 'Гүйлгээ шинэ байна',
      valid: true,
      transactionId: transactionId
    });

  } catch (error) {
    console.error('Transaction check error:', error);
    res.status(500).json({ message: 'Алдаа гарлаа' });
  }
});

/**
 * Pending payment үүсгэх
 * POST /api/payment/create-pending
 */
router.post('/create-pending', auth, async (req, res) => {
  try {
    const { planId, amount } = req.body;
    
    // Validation
    const validPlans = {
      'normal': 1990,
      'business_standard': 19900,
      'business_pro': 39900
    };

    if (!validPlans[planId] || validPlans[planId] !== amount) {
      return res.status(400).json({ message: 'Invalid plan or amount' });
    }

    // Өмнөх pending төлбөрүүдийг expired болгох
    await PendingPayment.updateMany(
      { userId: req.userId, status: 'pending' },
      { status: 'expired' }
    );

    // Шинэ pending payment үүсгэх
    const pendingPayment = await PendingPayment.create({
      userId: req.userId,
      planId: planId,
      amount: amount,
      status: 'pending'
    });

    res.json({
      success: true,
      paymentId: pendingPayment._id,
      expiresAt: pendingPayment.expiresAt,
      message: 'Pending payment created. Transfer money and SMS will be processed automatically.'
    });

  } catch (error) {
    console.error('Create pending payment error:', error);
    res.status(500).json({ message: 'Error creating pending payment' });
  }
});

/**
 * SMS Webhook - Автомат баталгаажуулалт
 * POST /api/payment/webhook-sms
 */
router.post('/webhook-sms', async (req, res) => {
  try {
    // Security: API key шалгах
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.SMS_WEBHOOK_SECRET) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { from, message, timestamp, phone } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Phone нь webhook-с ирсэн баталгаажуулалт (80119900)
    console.log('SMS webhook received from phone:', phone);

    // SMS parse хийх
    const amountMatch = message.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:₮|MNT)/i);
    const transactionMatch = message.match(/(?:Гүйлгээ|Transaction|Ref|гүйлгээ):\s*[#]?([A-Z0-9]+)/i);
    
    // PayZone код шалгах (PZ-XXXXXX format) - Гүйлгээний утга дээрээс
    const codeMatch = message.match(/(?:утга|description|memo|reference|note):\s*(PZ-[A-Z0-9]{6})/i);
    const paymentCode = codeMatch ? codeMatch[1].toUpperCase() : null;

    console.log('SMS parsed:', { 
      amount: amountMatch ? amountMatch[1] : null, 
      transactionId: transactionMatch ? transactionMatch[1] : null,
      paymentCode: paymentCode
    });
    
    if (!amountMatch || !transactionMatch) {
      console.log('SMS format таарахгүй байна:', message);
      await SmsLog.create({ 
        from, 
        message, 
        timestamp,
        processed: false, 
        error: 'Unable to parse amount or transaction ID' 
      });
      return res.status(400).json({ message: 'Invalid SMS format' });
    }

    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    const transactionId = transactionMatch[1];

    // Давхар гүйлгээ шалгах
    const existingLog = await SmsLog.findOne({ transactionId });
    if (existingLog) {
      return res.status(400).json({ message: 'Transaction already processed' });
    }

    // План тодорхойлох
    let planId = null;
    if (amount === 1990) planId = 'normal';
    else if (amount === 19900) planId = 'business_standard';
    else if (amount === 39900) planId = 'business_pro';
    else {
      console.log('Тодорхойгүй төлбөрийн дүн:', amount);
      await SmsLog.create({ 
        from, 
        message, 
        amount, 
        transactionId, 
        timestamp,
        processed: false,
        error: 'Unknown amount' 
      });
      return res.status(400).json({ message: 'Unknown payment amount' });
    }

    // 🆕 CODE-BASED PAYMENT: Эхлээд payment code шалгах
    let user = null;
    let foundByCode = false;

    if (paymentCode) {
      console.log('Payment code олдлоо, шалгаж байна:', paymentCode);
      
      // PaymentCode collection-с код олох
      const codeRecord = await PaymentCode.findOne({ 
        code: paymentCode,
        status: 'pending',
        expiresAt: { $gt: new Date() }
      });

      if (codeRecord) {
        // Үнэ тохирч байгаа эсэхийг шалгах
        if (codeRecord.amount !== amount) {
          console.log('Код байгаа боловч үнэ таарахгүй байна:', {
            codeAmount: codeRecord.amount,
            smsAmount: amount
          });
          await SmsLog.create({ 
            from, 
            message, 
            amount, 
            transactionId, 
            timestamp,
            processed: false,
            error: `Payment code amount mismatch. Expected: ${codeRecord.amount}, Got: ${amount}`
          });
          return res.status(400).json({ 
            message: 'Төлбөрийн код болон дүн таарахгүй байна' 
          });
        }

        // Хэрэглэгчийг кодоор олох
        user = await User.findById(codeRecord.userId);
        if (!user) {
          await SmsLog.create({ 
            from, 
            message, 
            amount, 
            transactionId, 
            timestamp,
            processed: false,
            error: 'User not found for payment code'
          });
          return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
        }

        planId = codeRecord.planId;
        foundByCode = true;
        console.log('✅ Кодоор хэрэглэгч олдлоо:', { userId: user._id, planId });

        // Кодыг "used" болгох
        codeRecord.status = 'used';
        codeRecord.usedAt = new Date();
        await codeRecord.save();
      } else {
        console.log('Payment код байгаа боловч идэвхгүй эсвэл дууссан:', paymentCode);
      }
    }

    // 🔄 FALLBACK: Код олдоогүй бол pending payment ашиглах (хуучин арга)
    if (!foundByCode) {
      console.log('Code ашиглаагүй, pending payment шалгаж байна...');
      
      const pendingPayment = await PendingPayment.findOne({
        amount: amount,
        status: 'pending',
        createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
      }).sort({ createdAt: -1 });

      if (!pendingPayment) {
        console.log('Pending payment олдсонгүй:', { amount, transactionId });
        await SmsLog.create({ 
          from, 
          message, 
          amount, 
          transactionId, 
          timestamp,
          processed: false,
          error: 'No matching pending payment or code found'
        });
        return res.json({ 
          message: 'SMS logged, but no pending payment or valid code found.' 
        });
      }

      // Pending payment-с хэрэглэгч олох
      user = await User.findById(pendingPayment.userId);
      if (!user) {
        await SmsLog.create({ 
          from, 
          message, 
          amount, 
          transactionId, 
          timestamp,
          userId: pendingPayment.userId,
          processed: false,
          error: 'User not found'
        });
        return res.status(404).json({ message: 'User not found' });
      }

      // Pending payment completed болгох
      pendingPayment.status = 'completed';
      pendingPayment.transactionId = transactionId;
      await pendingPayment.save();
    }

    // ✅ Subscription идэвхжүүлэх (код эсвэл pending payment-аар)
    if (!user) {
      await SmsLog.create({ 
        from, 
        message, 
        amount, 
        transactionId, 
        timestamp,
        userId: pendingPayment.userId,
        processed: false,
        error: 'User not found'
      });
      return res.status(404).json({ message: 'User not found' });
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

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

    user.subscription = {
      plan: planId,
      isActive: true,
      startDate: now,
      endDate: endDate,
      autoRenew: false,
      paymentMethod: 'bank_transfer',
      ...planConfig[planId]
    };

    // Trial идэвхгүй болгох
    if (user.trial && user.trial.isActive) {
      user.trial.isActive = false;
    }

    await user.save();

    // Pending payment баталгаажуулах
    pendingPayment.status = 'completed';
    pendingPayment.transactionId = transactionId;
    pendingPayment.completedAt = now;
    await pendingPayment.save();

    // SMS log хадгалах
    await SmsLog.create({ 
      from, 
      message, 
      amount, 
      transactionId, 
      timestamp,
      userId: user._id,
      planId: planId,
      processed: true
    });

    console.log('✅ Subscription автоматаар идэвхжлээ:', {
      userId: user._id,
      email: user.email,
      planId: planId,
      transactionId: transactionId
    });

    res.json({ 
      success: true, 
      message: 'Subscription activated successfully',
      userId: user._id,
      planId: planId
    });

  } catch (error) {
    console.error('SMS webhook error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * iOS Shortcut баталгаажуулалт
 * POST /api/payment/shortcut-verify
 * 
 * Headers: X-API-Key
 * Body: { paymentCode, smsText?, amount? }
 */
router.post('/shortcut-verify', async (req, res) => {
  try {
    // API Key шалгах
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.SHORTCUT_API_KEY) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized - Invalid API Key' 
      });
    }

    const { paymentCode, smsText, amount } = req.body;

    if (!paymentCode) {
      return res.status(400).json({ 
        success: false,
        message: 'Төлбөрийн код шаардлагатай' 
      });
    }

    // Payment Code олох
    const codeRecord = await PaymentCode.findOne({ 
      code: paymentCode.toUpperCase(),
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (!codeRecord) {
      return res.status(404).json({ 
        success: false,
        message: 'Төлбөрийн код олдсонгүй эсвэл хүчингүй болсон' 
      });
    }

    // Хэрэв SMS текст байвал дүн шалгах
    let parsedAmount = amount;
    let transactionId = null;

    if (smsText) {
      const amountMatch = smsText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:₮|MNT)/i);
      const transactionMatch = smsText.match(/(?:Гүйлгээ|Transaction|Ref|гүйлгээ):\s*[#]?([A-Z0-9]+)/i);
      
      if (amountMatch) {
        parsedAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
      }
      if (transactionMatch) {
        transactionId = transactionMatch[1];
      }
    }

    // Дүн таарч байгаа эсэх шалгах (optional - хэрэв amount parse хийсэн бол)
    if (parsedAmount && parsedAmount !== codeRecord.amount) {
      console.log('Amount mismatch:', { parsed: parsedAmount, expected: codeRecord.amount });
      // Warning log but continue - user might have paid correct amount
    }

    // Давхар гүйлгээ шалгах
    if (transactionId) {
      const existingLog = await SmsLog.findOne({ transactionId });
      if (existingLog) {
        return res.status(400).json({ 
          success: false,
          message: 'Энэ гүйлгээг өмнө нь ашигласан байна' 
        });
      }
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

    user.subscription = {
      plan: codeRecord.planId,
      isActive: true,
      startDate: now,
      endDate: endDate,
      autoRenew: false,
      paymentMethod: 'bank_transfer',
      ...planConfig[codeRecord.planId]
    };

    if (user.trial && user.trial.isActive) {
      user.trial.isActive = false;
    }

    await user.save();

    // Payment Code completed болгох
    codeRecord.status = 'used';
    codeRecord.usedAt = now;
    codeRecord.transactionId = transactionId;
    await codeRecord.save();

    // SMS Log хадгалах
    await SmsLog.create({ 
      from: 'iOS-Shortcut',
      message: smsText || 'Manual verification via Shortcut', 
      amount: codeRecord.amount, 
      transactionId: transactionId || `SC-${Date.now()}`, 
      timestamp: now,
      userId: user._id,
      planId: codeRecord.planId,
      processed: true,
      source: 'ios-shortcut'
    });

    console.log('✅ Shortcut баталгаажуулалт амжилттай:', {
      userId: user._id,
      email: user.email,
      planId: codeRecord.planId,
      paymentCode: paymentCode
    });

    res.json({ 
      success: true, 
      message: `🎉 Амжилттай! ${codeRecord.planId} эрх идэвхжлээ.`,
      subscription: {
        plan: codeRecord.planId,
        endDate: endDate
      }
    });

  } catch (error) {
    console.error('Shortcut verify error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Серверийн алдаа гарлаа' 
    });
  }
});

/**
 * Monpay Notification баталгаажуулалт (iOS Shortcut)
 * POST /api/payment/monpay-verify
 * 
 * Headers: X-API-Key
 * Body: { 
 *   paymentCode: "PZ-ABC123",
 *   notificationText: "Таны 99107463441 дансанд 1990 төгрөгийн орлого хийгдлээ.",
 *   amount?: number
 * }
 * 
 * Monpay notification format:
 * "Таны 99107463441 дансанд 1990 төгрөгийн орлого хийгдлээ."
 */
router.post('/api/payment/monpay-verify', async (req, res) => {
  try {
    console.log('========================================');
    console.log('📱 MONPAY-VERIFY REQUEST RECEIVED');
    console.log('========================================');
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    console.log('========================================');

    // API Key шалгах
    const apiKey = req.headers['x-api-key'];
    console.log('🔑 API Key received:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
    console.log('🔑 Expected API Key:', process.env.SHORTCUT_API_KEY ? `${process.env.SHORTCUT_API_KEY.substring(0, 10)}...` : 'NOT SET');
    
    if (!apiKey || apiKey !== process.env.SHORTCUT_API_KEY) {
      console.log('❌ API Key шалгалт амжилтгүй');
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized - Invalid API Key' 
      });
    }
    console.log('✅ API Key шалгалт амжилттай');

    const { paymentCode, notificationText, amount } = req.body;

    console.log('📱 Parsed data:', { paymentCode, notificationText, amount });

    // Payment Code шаардлагатай
    if (!paymentCode) {
      return res.status(400).json({ 
        success: false,
        message: 'Төлбөрийн код (PZ-XXXXXX) шаардлагатай' 
      });
    }

    // Notification text-ээс мэдээлэл задлах
    let parsedAmount = amount;
    let transactionRef = null;

    if (notificationText) {
      // Monpay notification format parse хийх
      // Format: "Таны 99107463441 дансанд 1990 төгрөгийн орлого хийгдлээ."
      // Format: "Таны 99107463441 дансанд 500 төгрөгийн орлого хийгдлээ."
      // Format: "Танд Баярмаа-с 7500.00₮ ирлээ"
      
      const amountPatterns = [
        // "1990 төгрөгийн" - Monpay notification format
        /дансанд\s+(\d+(?:,\d{3})*(?:\.\d{2})?)\s*төгрөгийн/i,
        // "7500.00₮ ирлээ" - peer transfer (Танд Баярмаа-с 7500.00₮ ирлээ)
        /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*₮\s*ирлээ/i,
        // "+1,990.00₮" - statement format
        /\+(\d+(?:,\d{3})*(?:\.\d{2})?)\s*₮/i,
        // "19,900₮" - general format
        /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*₮/i,
        // "1990 төгрөг" - simple
        /(\d+)\s*төгрөг/i
      ];

      for (const pattern of amountPatterns) {
        const match = notificationText.match(pattern);
        if (match) {
          parsedAmount = parseFloat(match[1].replace(/,/g, ''));
          console.log('💰 Parsed amount:', parsedAmount, 'from pattern:', pattern);
          break;
        }
      }

      // Гүйлгээний утга / код олох (Statement дээрээс)
      // Format: "PZ-123456 ( 540134583..."
      const codePatterns = [
        /(PZ-[A-Z0-9]{6})/i,  // PZ-XXXXXX format
        /^(PZ-[A-Z0-9]+)/i     // Line эхэнд PZ- байвал
      ];

      for (const pattern of codePatterns) {
        const match = notificationText.match(pattern);
        if (match) {
          transactionRef = match[1].toUpperCase();
          console.log('🔑 Found code in notification:', transactionRef);
          break;
        }
      }

      console.log('📱 Monpay parsed:', { parsedAmount, transactionRef });
    }

    // Хэрэв notification дотор код олдвол, paymentCode-тай тохируулах
    const codeToUse = transactionRef || paymentCode.toUpperCase();

    // Payment Code олох
    let codeRecord = await PaymentCode.findOne({ 
      code: codeToUse,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    // Хэрэв олдоогүй бол өгөгдсөн paymentCode-оор дахин хайх
    if (!codeRecord && transactionRef !== paymentCode.toUpperCase()) {
      codeRecord = await PaymentCode.findOne({ 
        code: paymentCode.toUpperCase(),
        status: 'pending',
        expiresAt: { $gt: new Date() }
      });
    }

    if (!codeRecord) {
      return res.status(404).json({ 
        success: false,
        message: 'Төлбөрийн код олдсонгүй эсвэл хүчингүй болсон. Шинэ код үүсгэнэ үү.' 
      });
    }

    // Дүн шалгах
    if (parsedAmount) {
      if (parsedAmount !== codeRecord.amount) {
        console.log('⚠️ Amount mismatch:', { parsed: parsedAmount, expected: codeRecord.amount });
        return res.status(400).json({ 
          success: false,
          message: `Төлбөрийн дүн таарахгүй байна. Шаардлагатай: ${codeRecord.amount}₮, Илгээсэн: ${parsedAmount}₮` 
        });
      }
    }

    // Давхар гүйлгээ шалгах
    const existingLog = await SmsLog.findOne({ 
      source: 'monpay',
      paymentCode: codeRecord.code,
      processed: true
    });

    if (existingLog) {
      return res.status(400).json({ 
        success: false,
        message: 'Энэ төлбөрийн код аль хэдийн ашиглагдсан байна' 
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

    // Log хадгалах
    await SmsLog.create({ 
      from: 'Monpay',
      message: notificationText || 'Monpay notification verification', 
      amount: codeRecord.amount, 
      transactionId: `MP-${Date.now()}`, 
      timestamp: now,
      userId: user._id,
      planId: codeRecord.planId,
      processed: true,
      source: 'monpay',
      paymentCode: codeRecord.code
    });

    console.log('✅ Monpay баталгаажуулалт амжилттай:', {
      userId: user._id,
      email: user.email,
      planId: codeRecord.planId,
      paymentCode: codeRecord.code,
      amount: codeRecord.amount
    });

    const planNames = {
      'normal': 'Энгийн',
      'business_standard': 'Бизнес Стандарт',
      'business_pro': 'Бизнес Про'
    };

    return res.json({ 
      success: true, 
      message: `🎉 Амжилттай! ${planNames[codeRecord.planId]} эрх идэвхжлээ.`,
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
      message: 'Серверийн алдаа гарлаа',
      error: error.message
    });
  }
});

// Monpay төлбөр боловсруулах helper function - removed, merged into main endpoint

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
