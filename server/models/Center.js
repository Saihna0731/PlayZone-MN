const mongoose = require("mongoose");

const CenterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: "gaming" },
  address: String,
  phone: String,
  email: String,
  website: String,
  opening: String, // цагийн хуваарь
  description: String,
  longDescription: String,
  price: String, // legacy price field
  pricing: {
    standard: String,
    vip: String,
    stage: String,
    overnight: String
  },
  rating: Number,
  lat: Number,
  lng: Number,
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },
  logo: String,
  image: String, // legacy field
  images: [mongoose.Schema.Types.Mixed], // array of strings or objects (thumbnail + high quality)
  videos: [mongoose.Schema.Types.Mixed], // array of strings or objects
  embedVideos: [String], // array of embed codes/urls
  facilities: [String], // дэд бүтэц, тоног төхөөрөмжийн жагсаалт
  createdAt: { type: Date, default: Date.now }
});

// 2dsphere индекс (заавал нэг удаа үүсгэх)
CenterSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Center", CenterSchema);