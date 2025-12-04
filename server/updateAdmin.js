const mongoose = require('mongoose');
require('dotenv').config();

// Strong password: PlayZone@Admin#2025!Mn
const newPasswordHash = '$2b$10$NmPt1IuQniYo93hm8Z9AGOhejxLMS6iiYbwuX1V7VTxodnbFQWGhm';

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to MongoDB');
  
  const result = await mongoose.connection.db.collection('users').updateOne(
    { email: 'admin@pccenter.mn' },
    { $set: { password: newPasswordHash } }
  );
  
  console.log('Updated:', result.modifiedCount, 'document(s)');
  console.log('');
  console.log('Admin login info:');
  console.log('Email: admin@pccenter.mn');
  console.log('Password: PlayZone@Admin#2025!Mn');
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
