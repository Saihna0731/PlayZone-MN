const mongoose = require('mongoose');

/**
 * QPay Invoice Model
 * QPay-аас үүссэн нэхэмжлэх мэдээллийг хадгалах
 */
const qpayInvoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // QPay-аас ирсэн invoice мэдээлэл
  invoiceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  qpayInvoiceId: {
    type: String,
    required: true,
    index: true
  },
  
  qpayPaymentId: {
    type: String,
    index: true
  },
  
  // Төлбөрийн мэдээлэл
  amount: {
    type: Number,
    required: true
  },
  
  currency: {
    type: String,
    default: 'MNT'
  },
  
  // Plan мэдээлэл
  planId: {
    type: String,
    enum: ['normal', 'business_standard', 'business_pro'],
    required: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  // QPay QR болон deeplinks
  qrText: String,
  qrImage: String,
  
  urls: [{
    name: String,
    description: String,
    logo: String,
    link: String
  }],
  
  // Төлөв
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'EXPIRED', 'CANCELLED'],
    default: 'PENDING',
    index: true
  },
  
  // Огнооны мэдээлэл
  paidAt: Date,
  expireAt: Date,
  
  // Callback мэдээлэл
  callbackData: mongoose.Schema.Types.Mixed,
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
qpayInvoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Compound indexes
qpayInvoiceSchema.index({ userId: 1, status: 1, createdAt: -1 });
qpayInvoiceSchema.index({ status: 1, expireAt: 1 });

// TTL index - 30 хоногийн дараа автоматаар устгах
qpayInvoiceSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('QPayInvoice', qpayInvoiceSchema);
