const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true
  },
  code: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  isUsed: {
    type: Boolean,
    default: false,
    index: true
  },
  resetToken: {
    type: String,
    index: true,
    sparse: true
  },
  resetTokenExpiry: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// TTL index - 1 цагийн дараа устгах
passwordResetSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 });

// Compound index
passwordResetSchema.index({ phone: 1, code: 1, isUsed: 1 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
