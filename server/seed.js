const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const Center = require("./models/Center");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  await Center.deleteMany({});
  const docs = [
    { name: "PC Center Ulaanbaatar", category: "shop", address: "Sukhbaatar", phone: "+97670123456", description: "Тест", lat: 47.918, lng: 106.917, location: { type: "Point", coordinates: [106.917, 47.918] } },
    { name: "ByteLab PC Center", category: "shop", address: "Khan-Uul", phone: "+97670111222", description: "Тест 2", lat: 47.925, lng: 106.915, location: { type: "Point", coordinates: [106.915, 47.925] } }
  ];
  await Center.insertMany(docs);
  console.log("Seeded centers:", docs.length);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });