const mongoose = require('mongoose');

const smsLogSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    index: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  planId: {
    type: String,
    enum: ['normal', 'business_standard', 'business_pro']
  },
  processed: {
    type: Boolean,
    default: false,
    index: true
  },
  error: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// TTL index to auto-delete old logs after 90 days
smsLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('SmsLog', smsLogSchema);
