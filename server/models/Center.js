const mongoose = require("mongoose");

const CenterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: "gaming" },
  address: String,
  phone: String,
  email: String,
  website: String,
  opening: String,
  price: String,
  pricing: {
    standard: String,
    vip: String,
    stage: String
  },
  rating: Number,
  description: String,
  longDescription: String,
  lat: Number,
  lng: Number,
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },
  logo: String, // PC-center-ийн logo зураг
  image: String, // Хуучин талбар (backward compatibility)
  images: [String], // Шинэ олон зургийн талбар
  facilities: [String], // Дэд бүтцийн жагсаалт
  createdAt: { type: Date, default: Date.now }
});

// Геолокацийн индекс
CenterSchema.index({ location: "2dsphere" });

// Хайлтын индекс
CenterSchema.index({ name: "text", address: "text", category: "text" });

// Категорийн индекс (filtering-д хурдан ажиллах)
CenterSchema.index({ category: 1 });

// Үүсгэсэн огнооны индекс
CenterSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Center", CenterSchema);