const mongoose = require('mongoose');
const Center = require('../models/Center');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const assignOwner = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/my-map-app');
    console.log('MongoDB Connected\n');

    // 1. List all centers to help debug
    const centers = await Center.find({});
    console.log('--- ALL CENTERS IN DATABASE ---');
    centers.forEach((c, i) => {
      console.log(`${i + 1}. [${c.name}] (ID: ${c._id}) - Owner: ${c.owner || 'Unassigned'}`);
    });
    console.log('-------------------------------\n');

    // Get arguments
    const args = process.argv.slice(2);
    const targetUsername = args[0];
    const targetCenterIdentifier = args[1]; // Name or ID

    if (!targetUsername) {
      console.log('USAGE: node server/scripts/assignOwner.js <username> <center_name_or_id>');
      console.log('EXAMPLE: node server/scripts/assignOwner.js bat "PC Center"');
      console.log('EXAMPLE: node server/scripts/assignOwner.js bat 6911dd5ec1d5ed94f8a319bc');
      process.exit(0);
    }

    // 2. Find the user
    const user = await User.findOne({ username: targetUsername });
    if (!user) {
      console.log(`ERROR: User '${targetUsername}' not found.`);
      process.exit(1);
    }
    console.log(`Found User: ${user.username} (${user._id})`);

    // 3. Find the center
    let center;
    if (mongoose.Types.ObjectId.isValid(targetCenterIdentifier)) {
      center = await Center.findById(targetCenterIdentifier);
    } 
    
    if (!center) {
      // Try by name (case insensitive)
      center = await Center.findOne({ name: { $regex: new RegExp(targetCenterIdentifier, "i") } });
    }

    if (!center) {
      console.log(`ERROR: Center '${targetCenterIdentifier}' not found.`);
      process.exit(1);
    }

    console.log(`Found Center: ${center.name} (${center._id})`);
    console.log(`Previous Owner: ${center.owner}`);

    // 4. Update
    center.owner = user._id;
    await center.save();

    console.log(`\nSUCCESS! Assigned '${center.name}' to '${user.username}'.`);
    console.log('Please refresh your browser.');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

assignOwner();
