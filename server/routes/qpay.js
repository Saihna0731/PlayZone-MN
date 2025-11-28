const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const qpayService = require('../services/qpayService');
const QPayInvoice = require('../models/QPayInvoice');

// План үнүүд
const PLAN_PRICES = {
  normal: 1990,
  business_standard: 19900,
  business_pro: 39900
};

/**
 * POST /api/qpay/create-invoice
 * Шинэ нэхэмжлэх үүсгэх
 */
router.post('/create-invoice', auth, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.userId;

    if (!planId || !PLAN_PRICES[planId]) {
      return res.status(400).json({
        success: false,
        message: 'Буруу план сонгосон байна'
      });
    }

    const amount = PLAN_PRICES[planId];
    const planNames = {
      normal: 'Энгийн',
      business_standard: 'Бизнес Стандарт',
      business_pro: 'Бизнес Про'
    };

    const result = await qpayService.createInvoice({
      userId,
      planId,
      amount,
      description: `PlayZone MN - ${planNames[planId]} план (1 сар)`
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Нэхэмжлэх үүсгэхэд алдаа гарлаа'
    });
  }
});

/**
 * POST /api/qpay/check-payment
 * Төлбөр төлөгдсөн эсэхийг шалгах
 */
router.post('/check-payment', auth, async (req, res) => {
  try {
    const { invoiceId } = req.body;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID шаардлагатай'
      });
    }

    const result = await qpayService.checkPayment(invoiceId);

    res.json(result);
  } catch (error) {
    console.error('Check payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Төлбөр шалгахад алдаа гарлаа'
    });
  }
});

/**
 * GET /api/qpay/invoice/:invoiceId
 * Invoice мэдээлэл авах
 */
router.get('/invoice/:invoiceId', auth, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await QPayInvoice.findOne({
      $or: [
        { qpayInvoiceId: invoiceId },
        { odooInvoiceId: invoiceId }
      ],
      userId: req.userId
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Нэхэмжлэх олдсонгүй'
      });
    }

    res.json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Нэхэмжлэх авахад алдаа гарлаа'
    });
  }
});

/**
 * POST /api/qpay/callback
 * QPay-аас callback (төлбөр төлөгдсөн үед дуудагдана)
 */
router.post('/callback', async (req, res) => {
  try {
    console.log('📥 QPay Callback received:', req.body);

    const result = await qpayService.handleCallback(req.body);

    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/qpay/my-invoices
 * Миний нэхэмжлэхүүд
 */
router.get('/my-invoices', auth, async (req, res) => {
  try {
    const invoices = await QPayInvoice.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      invoices
    });
  } catch (error) {
    console.error('Get my invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Нэхэмжлэхүүд авахад алдаа гарлаа'
    });
  }
});

module.exports = router;
