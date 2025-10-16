const express = require("express");
const router = express.Router();
const Center = require("../models/Center");

// GET all with optimization
router.get("/", async (req, res) => {
  try {
    const { category, search, limit = 50 } = req.query;
    
    // Build query object
    let query = {};
    
    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Execute query with limit to improve performance
    const centers = await Center.find(query)
      .select('name category address phone lat lng location logo images pricing createdAt') // Only select needed fields
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean(); // Use lean() for better performance (returns plain JS objects)
    
    res.json(centers);
  } catch (err) {
    console.error("Get centers error:", err);
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

// PUT update
router.put("/:id", async (req, res) => {
  console.log("PUT /api/centers/:id received");
  console.log("ID:", req.params.id);
  console.log("Body:", req.body);

  try {
    const data = {
      ...req.body,
      lat: req.body.lat ? Number(req.body.lat) : undefined,
      lng: req.body.lng ? Number(req.body.lng) : undefined
    };
    
    if (typeof data.lat === "number" && typeof data.lng === "number") {
      data.location = { type: "Point", coordinates: [data.lng, data.lat] };
    }

    const updated = await Center.findByIdAndUpdate(
      req.params.id, 
      data, 
      { new: true, runValidators: true }
    );
    
    if (!updated) {
      return res.status(404).json({ error: "Center not found" });
    }
    
    console.log("Updated center:", updated._id);
    res.json(updated);
  } catch (err) {
    console.error("Error updating center:", err);
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