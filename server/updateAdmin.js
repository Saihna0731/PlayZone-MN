const mongoose = require('mongoose');
require('dotenv').config();

const newPasswordHash = '$2b$10$PYWY84zyWAx/J8UpRX/HgeUTmfKiOP9KkiQuctduTuuvBeUmLZr.K';

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
  console.log('Password: Admin@123456');
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
