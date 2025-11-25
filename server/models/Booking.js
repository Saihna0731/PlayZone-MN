const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  time: {
    type: String, // HH:mm
    required: true
  },
  duration: {
    type: Number, // in hours
    default: 1
  },
  type: {
    type: String,
    enum: ['standard', 'vip', 'stage'],
    default: 'standard'
  },
  seats: {
    type: Number,
    default: 1,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', BookingSchema);
