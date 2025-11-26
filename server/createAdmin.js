require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function main() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/my-map-app';
  const email = process.env.ADMIN_EMAIL || '**********';
  const password = process.env.ADMIN_PASSWORD || '**********';
  const fullName = process.env.ADMIN_NAME || 'Bayr_Admin';

  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected!!!!!!!!!!!!!!!!!');

    // Find by email OR admin username
    let admin = await User.findOne({ $or: [{ email }, { username: 'Bayr_Admin' }, { username: 'admin' }] });
    if (admin) {
      console.log('Admin user already exists:', admin.email || email);
      // Update role if needed
      if (admin.role !== 'admin') {
        admin.role = 'admin';
        await admin.save();
        console.log('Admin role updated.');
      }
      // Update username and fullName
      admin.username = 'Bayr_Admin';
      admin.fullName = fullName;
      admin.password = password; // Will be hashed by pre-save hook
      await admin.save();
      console.log('Admin credentials updated.');
    } else {
      admin = new User({
        email,
        username: 'Bayr_Admin',
        fullName,
        password, // will be hashed by pre-save hook
        accountType: 'user',
        role: 'admin',
        isActive: true
      });
      await admin.save();
      console.log('Admin user created:', email);
    }
  } catch (err) {
    console.error('Create admin error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
