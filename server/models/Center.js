const mongoose = require("mongoose");

const CenterSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
  occupancy: {
    standard: Number,
    vip: Number,
    stage: Number
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
  // Like/Dislike системүүд
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Бонус мэдээлэл (owner-ийн оруулдаг сурталчилгаа/сул суудал/хөнгөлөлт)
  bonus: [
    new mongoose.Schema({
      title: String,
      text: String, // тайлбар эсвэл хөнгөлөлтийн мэдээлэл
      standardFree: Number, // Энгийн сул суудал
      vipFree: Number, // VIP сул суудал
      stageFree: Number, // Stage сул суудал
      expiresAt: Date, // дуусах хугацаа (сонголттой)
      createdAt: { type: Date, default: Date.now }
    }, { _id: true })
  ],
  createdAt: { type: Date, default: Date.now }
});

// 2dsphere индекс (заавал нэг удаа үүсгэх)
CenterSchema.index({ location: "2dsphere" });
// Owner-р хайлт хийхэд хурдан болгоно
CenterSchema.index({ owner: 1 });

module.exports = mongoose.model("Center", CenterSchema);