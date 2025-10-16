const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log("MongoDB connected");

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.username);
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      username: "admin",
      email: "admin@pcCenter.mn",
      password: "admin123", // This will be hashed automatically
      fullName: "Системийн Админ",
      phone: "99999999",
      role: "admin"
    });

    await adminUser.save();
    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@pcCenter.mn");
    console.log("🔑 Password: admin123");
    console.log("👑 Role: admin");
    
    // Create a regular test user
    const testUser = new User({
      username: "testuser",
      email: "test@pcCenter.mn", 
      password: "test123",
      fullName: "Туршилтын Хэрэглэгч",
      phone: "88888888",
      role: "user"
    });

    await testUser.save();
    console.log("✅ Test user created successfully!");
    console.log("📧 Email: test@pcCenter.mn");
    console.log("🔑 Password: test123");
    console.log("👤 Role: user");

  } catch (error) {
    console.error("❌ Error creating users:", error.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

createAdminUser();