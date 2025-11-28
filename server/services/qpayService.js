const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const QPayInvoice = require('../models/QPayInvoice');

// QPay тохиргоо
const QPAY_CONFIG = {
  baseUrl: process.env.QPAY_ENV === 'production' 
    ? 'https://merchant.qpay.mn/v2'
    : 'https://merchant-sandbox.qpay.mn/v2',
  username: process.env.QPAY_USERNAME,
  password: process.env.QPAY_PASSWORD,
  invoiceCode: process.env.QPAY_INVOICE_CODE || 'PLAYZONE_MN_INVOICE'
};

// Fixie Proxy тохиргоо
const getProxyAgent = () => {
  const fixieUrl = process.env.FIXIE_URL;
  if (!fixieUrl) {
    console.warn('⚠️ FIXIE_URL тохируулаагүй байна. Proxy-гүй ажиллана.');
    return null;
  }
  return new HttpsProxyAgent(fixieUrl);
};

// Axios instance with proxy
const createQPayClient = (token = null) => {
  const proxyAgent = getProxyAgent();
  const config = {
    baseURL: QPAY_CONFIG.baseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (proxyAgent) {
    config.httpsAgent = proxyAgent;
    config.proxy = false; // axios proxy-г унтраах, agent ашиглана
  }

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return axios.create(config);
};

// Token хадгалах (memory cache)
let cachedToken = null;
let tokenExpiry = null;

/**
 * QPay Auth Token авах
 */
const getAuthToken = async () => {
  // Cache шалгах
  if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const client = createQPayClient();
    const credentials = Buffer.from(
      `${QPAY_CONFIG.username}:${QPAY_CONFIG.password}`
    ).toString('base64');

    const response = await client.post('/auth/token', {}, {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });

    cachedToken = response.data.access_token;
    // Token 1 цагийн дараа дуусна гэж тооцох
    tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);
    
    console.log('✅ QPay token авлаа');
    return cachedToken;
  } catch (error) {
    console.error('❌ QPay token авахад алдаа:', error.response?.data || error.message);
    throw new Error('QPay authentication амжилтгүй');
  }
};

/**
 * Нэхэмжлэх үүсгэх
 * @param {Object} params - { userId, planId, amount, description }
 */
const createInvoice = async ({ userId, planId, amount, description }) => {
  try {
    const token = await getAuthToken();
    const client = createQPayClient(token);

    const invoiceCode = `PZ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const invoiceData = {
      invoice_code: QPAY_CONFIG.invoiceCode,
      sender_invoice_no: invoiceCode,
      invoice_receiver_code: userId.toString(),
      invoice_description: description || `PlayZone MN - ${planId} план`,
      amount: amount,
      callback_url: `${process.env.BACKEND_URL || 'https://my-map-app-production.up.railway.app'}/api/qpay/callback`
    };

    console.log('📤 QPay invoice үүсгэж байна:', invoiceData);

    const response = await client.post('/invoice', invoiceData);

    console.log('✅ QPay invoice үүсгэгдлээ:', response.data.invoice_id);

    // MongoDB-д хадгалах
    const invoice = new QPayInvoice({
      odooInvoiceId: invoiceCode,
      qpayInvoiceId: response.data.invoice_id,
      userId: userId,
      planId: planId,
      amount: amount,
      qrText: response.data.qr_text,
      qrImage: response.data.qr_image,
      urls: response.data.urls || [],
      status: 'pending'
    });

    await invoice.save();

    return {
      success: true,
      invoiceId: response.data.invoice_id,
      invoiceCode: invoiceCode,
      qrText: response.data.qr_text,
      qrImage: response.data.qr_image,
      urls: response.data.urls || [],
      deeplinks: response.data.urls || []
    };
  } catch (error) {
    console.error('❌ Invoice үүсгэхэд алдаа:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Нэхэмжлэх үүсгэхэд алдаа гарлаа');
  }
};

/**
 * Төлбөр шалгах
 * @param {string} invoiceId - QPay invoice ID
 */
const checkPayment = async (invoiceId) => {
  try {
    const token = await getAuthToken();
    const client = createQPayClient(token);

    const response = await client.post('/payment/check', {
      object_type: 'INVOICE',
      object_id: invoiceId,
      offset: {
        page_number: 1,
        page_limit: 100
      }
    });

    const payments = response.data.rows || [];
    const paidPayment = payments.find(p => p.payment_status === 'PAID');

    if (paidPayment) {
      // Database update
      await QPayInvoice.findOneAndUpdate(
        { qpayInvoiceId: invoiceId },
        { 
          status: 'paid',
          paidAt: new Date(),
          paymentInfo: paidPayment
        }
      );

      return {
        success: true,
        paid: true,
        payment: paidPayment
      };
    }

    return {
      success: true,
      paid: false,
      count: payments.length
    };
  } catch (error) {
    console.error('❌ Төлбөр шалгахад алдаа:', error.response?.data || error.message);
    return {
      success: false,
      paid: false,
      error: error.message
    };
  }
};

/**
 * Callback боловсруулах (QPay-аас дуудагдана)
 */
const handleCallback = async (callbackData) => {
  try {
    console.log('📥 QPay callback:', callbackData);

    const { payment_id, qpay_payment_id } = callbackData;

    // Invoice олох
    const invoice = await QPayInvoice.findOne({
      $or: [
        { qpayInvoiceId: payment_id },
        { 'paymentInfo.payment_id': qpay_payment_id }
      ]
    });

    if (!invoice) {
      console.warn('⚠️ Invoice олдсонгүй:', callbackData);
      return { success: false, error: 'Invoice not found' };
    }

    // Төлбөр шалгах
    const result = await checkPayment(invoice.qpayInvoiceId);

    if (result.paid) {
      // Subscription идэвхжүүлэх
      const User = require('../models/User');
      const user = await User.findById(invoice.userId);
      
      if (user) {
        const now = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 1 сар

        user.subscription = {
          plan: invoice.planId,
          isActive: true,
          startDate: now,
          endDate: endDate,
          paymentMethod: 'qpay'
        };

        await user.save();
        console.log('✅ Subscription идэвхжүүллээ:', user.email, invoice.planId);
      }
    }

    return { success: true, paid: result.paid };
  } catch (error) {
    console.error('❌ Callback боловсруулахад алдаа:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getAuthToken,
  createInvoice,
  checkPayment,
  handleCallback
};
