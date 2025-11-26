const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: function() {
      return this.accountType === 'user';
    },
    unique: true,
    sparse: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: function() {
      return this.accountType === 'user';
    },
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: '',
    trim: true
  },
  accountType: {
    type: String,
    enum: ['user', 'centerOwner'],
    default: 'user'
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'centerOwner'],
    default: 'user'
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationCode: String,
  emailVerificationExpires: Date,
  centerName: {
    type: String,
    required: function() {
      return this.accountType === 'centerOwner';
    },
    trim: true
  },
  isApproved: {
    type: Boolean,
    default: function() {
      return this.accountType === 'user';
    }
  },
  // Хэрэглэгчийн идэвхтэй эсэх (default: true)
  isActive: {
    type: Boolean,
    default: true
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center'
  }],
  
  // Subscription/Төлбөрийн мэдээлэл
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'normal', 'business_standard', 'business_pro'],
      default: 'free'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    paymentMethod: {
      type: String,
      enum: ['qpay', 'mostmoney', 'card', 'mock', 'admin'],
      default: null
    }
  },
  // Trial мэдээлэл - Шинэ хэрэглэгчдэд автоматаар олгогдоно
  trial: {
    isActive: {
      type: Boolean,
      default: false
    },
    plan: {
      type: String,
      enum: ['normal', 'business_standard'],
      default: null
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    hasUsed: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Нууц үг hash хийх middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Нууц үг шалгах method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Нууц үгийг response-д оруулахгүй байх
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
