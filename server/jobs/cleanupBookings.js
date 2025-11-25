const Booking = require('../models/Booking');

/**
 * Cleanup job to delete bookings older than 5 days
 * This should be run periodically (e.g., daily via cron job)
 */
async function cleanupOldBookings() {
  try {
    // Calculate date 5 days ago
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    console.log(`[Cleanup Job] Checking for bookings older than ${fiveDaysAgo.toISOString()}`);
    
    // Delete bookings older than 5 days
    const result = await Booking.deleteMany({
      createdAt: { $lt: fiveDaysAgo }
    });
    
    console.log(`[Cleanup Job] Successfully deleted ${result.deletedCount} bookings older than 5 days`);
    
    return {
      success: true,
      deletedCount: result.deletedCount,
      message: `Cleaned up ${result.deletedCount} old bookings`
    };
  } catch (err) {
    console.error('[Cleanup Job] Error cleaning up old bookings:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Start automatic cleanup job
 * Runs every 24 hours (86400000 ms)
 */
function startCleanupJob() {
  // Run immediately on startup
  cleanupOldBookings();
  
  // Run every 24 hours
  setInterval(() => {
    console.log('[Cleanup Job] Running scheduled cleanup...');
    cleanupOldBookings();
  }, 24 * 60 * 60 * 1000); // 24 hours
  
  console.log('[Cleanup Job] Automatic cleanup job started (runs every 24 hours)');
}

module.exports = {
  cleanupOldBookings,
  startCleanupJob
};
