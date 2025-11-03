const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;

async function fixUsernameIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // 1. Одоо байгаа username: null-тай centerOwner-үүдийг устгах
    console.log('\n1. Deleting centerOwners with username: null...');
    const deleteResult = await usersCollection.deleteMany({ 
      username: null, 
      accountType: 'centerOwner' 
    });
    console.log(`   ✓ Deleted ${deleteResult.deletedCount} documents`);

    // 2. Username index-ийг drop хийх
    console.log('\n2. Dropping username_1 index...');
    try {
      await usersCollection.dropIndex('username_1');
      console.log('   ✓ Index dropped successfully');
    } catch (err) {
      console.log('   ⚠ Index might not exist:', err.message);
    }

    // 3. Шинэ sparse unique index үүсгэх
    console.log('\n3. Creating new sparse unique index on username...');
    await usersCollection.createIndex(
      { username: 1 },
      {
        unique: true,
        // Use partialFilterExpression instead of sparse to only index docs where username is a string
        partialFilterExpression: { username: { $exists: true, $type: 'string' } }
      }
    );
    console.log('   ✓ New index created');

    console.log('\n✅ All done! Username index fixed.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

fixUsernameIndex();
