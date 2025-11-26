const mongoose = require('mongoose');

const pendingPaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  planId: {
    type: String,
    enum: ['normal', 'business_standard', 'business_pro'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'expired', 'cancelled'],
    default: 'pending',
    index: true
  },
  transactionId: {
    type: String,
    sparse: true,
    index: true
  },
  completedAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for finding recent pending payments
pendingPaymentSchema.index({ amount: 1, status: 1, createdAt: -1 });

// TTL index for automatic expiry
pendingPaymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingPayment', pendingPaymentSchema);
