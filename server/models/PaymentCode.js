const mongoose = require('mongoose');

const paymentCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  planId: {
    type: String,
    required: true,
    enum: ['normal', 'business_standard', 'business_pro']
  },
  amount: {
    type: Number,
    required: true,
    enum: [1990, 19900, 39900]
  },
  status: {
    type: String,
    required: true,
    default: 'pending',
    enum: ['pending', 'used', 'expired'],
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    index: true
  },
  usedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for efficient queries
paymentCodeSchema.index({ userId: 1, status: 1, createdAt: -1 });
paymentCodeSchema.index({ status: 1, expiresAt: 1 });

// TTL index to auto-delete expired codes after 7 days
paymentCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Virtual for checking if code is expired
paymentCodeSchema.virtual('isExpired').get(function() {
  return this.status === 'pending' && this.expiresAt < new Date();
});

// Method to mark code as used
paymentCodeSchema.methods.markAsUsed = function() {
  this.status = 'used';
  this.usedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('PaymentCode', paymentCodeSchema);
