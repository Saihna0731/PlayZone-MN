const express = require("express");
const router = express.Router();
const Center = require("../models/Center");

// GET all
router.get("/", async (req, res) => {
  try {
    const centers = await Center.find().sort({ createdAt: -1 });
    res.json(centers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create
router.post("/", async (req, res) => {
  console.log("POST /api/centers received");
  console.log("Headers:", req.headers);
  console.log("Body raw:", req.body);

  try {
    const data = {
      ...req.body,
      lat: req.body.lat ? Number(req.body.lat) : undefined,
      lng: req.body.lng ? Number(req.body.lng) : undefined
    };
    if (typeof data.lat === "number" && typeof data.lng === "number") {
      data.location = { type: "Point", coordinates: [data.lng, data.lat] };
    }

    const c = new Center(data);
    const saved = await c.save();
    console.log("Saved center id:", saved._id);
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error saving center:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    await Center.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;