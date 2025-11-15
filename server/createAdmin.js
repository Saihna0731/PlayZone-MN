require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function main() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/my-map-app';
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const fullName = process.env.ADMIN_NAME || 'admin';

  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected!!!!!!!!!!!!!!!!!');

    // Find by email OR default admin username to avoid duplicate username errors
    let admin = await User.findOne({ $or: [{ email }, { username: 'admin' }] });
    if (admin) {
      console.log('Admin user already exists:', admin.email || email);
      // Update role if needed
      if (admin.role !== 'admin') {
        admin.role = 'admin';
        await admin.save();
        console.log('Admin role updated.');
      }
      // Ensure username and fullName are set
      if (!admin.username) admin.username = 'admin';
      if (!admin.fullName) admin.fullName = fullName;
      await admin.save();
    } else {
      admin = new User({
        email,
        username: 'admin',
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
