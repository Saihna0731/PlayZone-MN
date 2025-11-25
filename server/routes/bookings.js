const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Center = require('../models/Center');
const { auth } = require('../middleware/auth');

// Create a booking
router.post('/', auth, async (req, res) => {
  try {
    const { centerId, date, time, duration, type, price, seats = 1 } = req.body;
    
    // 1. Validate Center Existence
    const center = await Center.findById(centerId);
    if (!center) {
      return res.status(404).json({ message: 'Center not found' });
    }

    // 2. Check Capacity (Overbooking Protection)
    // Calculate start and end time of the requested booking in minutes
    const [reqHour, reqMinute] = time.split(':').map(Number);
    const reqStartMins = reqHour * 60 + reqMinute;
    const reqEndMins = reqStartMins + (duration * 60);

    // Find existing bookings for the same center, date, and type that are NOT cancelled
    const existingBookings = await Booking.find({
      center: centerId,
      date: date,
      type: type,
      status: { $ne: 'cancelled' }
    });

    // Count overlaps (considering number of seats in each booking)
    let occupiedSeats = 0;
    for (const booking of existingBookings) {
      const [bHour, bMinute] = booking.time.split(':').map(Number);
      const bStartMins = bHour * 60 + bMinute;
      const bEndMins = bStartMins + (booking.duration * 60);

      // Check overlap: (StartA < EndB) and (EndA > StartB)
      if (reqStartMins < bEndMins && reqEndMins > bStartMins) {
        occupiedSeats += (booking.seats || 1);
      }
    }

    // Get capacity for the specific type
    const maxCapacity = center.occupancy ? center.occupancy[type] : 0;

    if (maxCapacity > 0 && (occupiedSeats + seats) > maxCapacity) {
      return res.status(400).json({ 
        message: `Уучлаарай, энэ цагт ${type === 'vip' ? 'VIP' : type === 'stage' ? 'Stage' : 'Энгийн'} суудлын багтаамж хүрэлцэхгүй байна. (Сул суудал: ${Math.max(0, maxCapacity - occupiedSeats)})` 
      });
    }

    const booking = new Booking({
      user: req.user.id,
      center: centerId,
      date,
      time,
      duration,
      type,
      seats,
      price,
      status: 'pending'
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get user's bookings
router.get('/my', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('center', 'name address phone')
      .sort({ createdAt: -1 })
      .lean() // Use lean() for faster queries
      .limit(100); // Limit results
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get center's bookings (for owner)
router.get('/center/:centerId', auth, async (req, res) => {
  try {
    console.log('Fetching bookings for center:', req.params.centerId);
    console.log('User ID:', req.userId);
    
    // Verify center exists
    const center = await Center.findById(req.params.centerId);
    if (!center) {
      console.log('Center not found:', req.params.centerId);
      return res.status(404).json({ message: 'Center not found' });
    }
    
    // Verify ownership - check if the user owns this center
    if (center.owner && center.owner.toString() !== req.userId) {
      console.log('Ownership mismatch. Center owner:', center.owner, 'User:', req.userId);
      return res.status(403).json({ message: 'Access denied. You do not own this center.' });
    }
    
    const bookings = await Booking.find({ center: req.params.centerId })
      .populate('user', 'fullName phone username email')
      .populate('center', 'name address')
      .sort({ date: 1, time: 1 });
    
    console.log(`Found ${bookings.length} bookings for center ${req.params.centerId}`);
    
    // Ensure all bookings have user data with fallbacks
    const bookingsWithUserData = bookings.map(booking => {
      const bookingObj = booking.toObject();
      if (bookingObj.user) {
        bookingObj.user = {
          _id: bookingObj.user._id,
          fullName: bookingObj.user.fullName || bookingObj.user.username || 'Хэрэглэгч',
          username: bookingObj.user.username,
          email: bookingObj.user.email,
          phone: bookingObj.user.phone || 'Тодорхойгүй'
        };
      }
      return bookingObj;
    });
    
    res.json(bookingsWithUserData);
  } catch (err) {
    console.error('Error fetching center bookings:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// Update booking status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    booking.status = status;
    await booking.save();
    
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Cleanup old bookings (called automatically or manually)
router.delete('/cleanup/old', auth, async (req, res) => {
  try {
    // Calculate date 5 days ago
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    // Delete bookings older than 5 days
    const result = await Booking.deleteMany({
      createdAt: { $lt: fiveDaysAgo }
    });
    
    console.log(`Cleaned up ${result.deletedCount} old bookings`);
    res.json({ 
      message: `Successfully deleted ${result.deletedCount} bookings older than 5 days`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Error cleaning up old bookings:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

module.exports = router;
