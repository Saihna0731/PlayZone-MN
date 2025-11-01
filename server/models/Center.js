const mongoose = require("mongoose");

const CenterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: "shop" },
  address: String,
  phone: String,
  description: String,
  longDescription: String,
  lat: Number,
  lng: Number,
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },
  image: String,
  createdAt: { type: Date, default: Date.now }
});

// 2dsphere индекс (заавал нэг удаа үүсгэх)
CenterSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Center", CenterSchema);