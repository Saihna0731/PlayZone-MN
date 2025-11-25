const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function createIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📊 Connected to MongoDB');

    const db = mongoose.connection.db;

    // Users collection indexes
    console.log('\n👤 Creating User indexes...');
    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
    } catch (e) {
      if (e.code !== 86) throw e; // Ignore index exists error
    }
    
    try {
      // Drop conflicting username index and recreate
      try {
        await db.collection('users').dropIndex('username_1');
      } catch (e) {
        // Ignore if doesn't exist
      }
      await db.collection('users').createIndex({ username: 1 }, { unique: true, sparse: true });
    } catch (e) {
      if (e.code !== 86) throw e;
    }
    
    await db.collection('users').createIndex({ accountType: 1 });
    await db.collection('users').createIndex({ createdAt: -1 });
    console.log('✅ User indexes created');

    // Centers collection indexes
    console.log('\n🏢 Creating Center indexes...');
    await db.collection('centers').createIndex({ name: 1 });
    await db.collection('centers').createIndex({ category: 1 });
    await db.collection('centers').createIndex({ owner: 1 });
    await db.collection('centers').createIndex({ location: '2dsphere' }); // Geospatial index for location queries
    await db.collection('centers').createIndex({ createdAt: -1 });
    await db.collection('centers').createIndex({ 'occupancy.standard': 1 });
    await db.collection('centers').createIndex({ 'occupancy.vip': 1 });
    console.log('✅ Center indexes created');

    // Bookings collection indexes
    console.log('\n📅 Creating Booking indexes...');
    await db.collection('bookings').createIndex({ user: 1 });
    await db.collection('bookings').createIndex({ center: 1 });
    await db.collection('bookings').createIndex({ status: 1 });
    await db.collection('bookings').createIndex({ date: 1 });
    await db.collection('bookings').createIndex({ createdAt: -1 });
    await db.collection('bookings').createIndex({ user: 1, status: 1 }); // Compound index
    await db.collection('bookings').createIndex({ center: 1, status: 1 }); // Compound index
    await db.collection('bookings').createIndex({ center: 1, date: 1 }); // Compound index
    console.log('✅ Booking indexes created');

    // List all indexes
    console.log('\n📋 Current indexes:');
    const collections = ['users', 'centers', 'bookings'];
    for (const collName of collections) {
      const indexes = await db.collection(collName).indexes();
      console.log(`\n${collName}:`);
      indexes.forEach(idx => {
        console.log(`  - ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''}`);
      });
    }

    console.log('\n✅ All indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();
