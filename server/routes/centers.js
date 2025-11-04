const express = require("express");
const router = express.Router();
const Center = require("../models/Center");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const { checkCenterLimit, ownerCanModifyCenter } = require("../middleware/subscription");

// GET all (public)
router.get("/", async (req, res) => {
  try {
    const centers = await Center.find().sort({ createdAt: -1 });
    res.json(centers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single center by ID (public)
router.get("/:id", async (req, res) => {
  try {
    const center = await Center.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ error: "Center not found" });
    }
    res.json(center);
  } catch (err) {
    console.error("Error fetching center:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST create (protected) - Center limit шалгах
router.post("/", auth, checkCenterLimit, async (req, res) => {
  console.log("POST /api/centers received");
  console.log("Headers:", req.headers);
  console.log("Body raw:", req.body);

  try {
    // Subscription-based media restrictions
    const user = await User.findById(req.userId);
    const sub = user?.subscription || {};
    const isAdmin = user?.role === 'admin';
    const data = {
      ...req.body,
      lat: req.body.lat ? Number(req.body.lat) : undefined,
      lng: req.body.lng ? Number(req.body.lng) : undefined,
      owner: req.userId // эзэмшигчийг холбоно
    };

    if (!isAdmin && user?.accountType === 'centerOwner') {
      // Enforce image limit
      const allowedImages = Number(sub.maxImages || 0);
      if (Array.isArray(data.images) && allowedImages > 0 && data.images.length > allowedImages) {
        return res.status(403).json({
          message: `Таны план дээр дээд тал нь ${allowedImages} зураг оруулах боломжтой. Илүү оруулахын тулд upgrade хийнэ үү.`,
          upgrade: true,
          code: 'IMAGE_LIMIT'
        });
      }
      // Enforce video permission
      if (!sub.canUploadVideo && ((Array.isArray(data.videos) && data.videos.length) || (Array.isArray(data.embedVideos) && data.embedVideos.length))) {
        return res.status(403).json({
          message: 'Видео оруулахын тулд Business Pro план шаардлагатай',
          upgrade: true,
          code: 'VIDEO_NOT_ALLOWED'
        });
      }
      // If not allowed, ensure server won't persist accidental inputs
      if (!sub.canUploadVideo) {
        data.videos = [];
        data.embedVideos = [];
      }
    }
    if (typeof data.lat === "number" && typeof data.lng === "number") {
      data.location = { type: "Point", coordinates: [data.lng, data.lat] };
    }

    const c = new Center(data);
    const saved = await c.save();
    // centers:updated эвентэд ашиглах лог хэвээр
    console.log("Saved center id:", saved._id);
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error saving center:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update center (protected)
router.put("/:id", auth, ownerCanModifyCenter, async (req, res) => {
  try {
    // Subscription-based media restrictions
    const user = await User.findById(req.userId);
    const sub = user?.subscription || {};
    const isAdmin = user?.role === 'admin';

    const data = {
      ...req.body,
      lat: req.body.lat ? Number(req.body.lat) : undefined,
      lng: req.body.lng ? Number(req.body.lng) : undefined
    };
    
    if (typeof data.lat === "number" && typeof data.lng === "number") {
      data.location = { type: "Point", coordinates: [data.lng, data.lat] };
    }

    if (!isAdmin && user?.accountType === 'centerOwner') {
      const allowedImages = Number(sub.maxImages || 0);
      if (Array.isArray(data.images) && allowedImages > 0 && data.images.length > allowedImages) {
        return res.status(403).json({
          message: `Таны план дээр дээд тал нь ${allowedImages} зураг оруулах боломжтой. Илүү оруулахын тулд upgrade хийнэ үү.`,
          upgrade: true,
          code: 'IMAGE_LIMIT'
        });
      }
      if (!sub.canUploadVideo && ((Array.isArray(data.videos) && data.videos.length) || (Array.isArray(data.embedVideos) && data.embedVideos.length))) {
        return res.status(403).json({
          message: 'Видео оруулахын тулд Business Pro план шаардлагатай',
          upgrade: true,
          code: 'VIDEO_NOT_ALLOWED'
        });
      }
      if (!sub.canUploadVideo) {
        data.videos = [];
        data.embedVideos = [];
      }
    }

    const center = await Center.findByIdAndUpdate(req.params.id, data, { 
      new: true, 
      runValidators: true 
    });
    
    if (!center) {
      return res.status(404).json({ error: "Center not found" });
    }
    
    res.json(center);
  } catch (err) {
    console.error("Error updating center:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update occupancy only (no auth required for real-time updates)
router.put("/:id/occupancy", async (req, res) => {
  try {
    const { occupancy } = req.body;
    
    if (!occupancy) {
      return res.status(400).json({ error: "Occupancy data required" });
    }

    const center = await Center.findByIdAndUpdate(
      req.params.id, 
      { occupancy }, 
      { new: true, runValidators: true }
    );
    
    if (!center) {
      return res.status(404).json({ error: "Center not found" });
    }
    
    res.json({ success: true, occupancy: center.occupancy });
  } catch (err) {
    console.error("Error updating occupancy:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---- BONUS endpoints (protected) ----
// Add a new bonus to a center
router.post("/:id/bonus", auth, ownerCanModifyCenter, async (req, res) => {
  try {
    const bonus = {
      title: req.body.title || "",
      text: req.body.text || "",
      standardFree: req.body.standardFree ?? undefined,
      vipFree: req.body.vipFree ?? undefined,
      stageFree: req.body.stageFree ?? undefined,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
      createdAt: new Date()
    };

    const center = await Center.findById(req.params.id);
    if (!center) return res.status(404).json({ error: "Center not found" });
    if (!Array.isArray(center.bonus)) center.bonus = [];
    center.bonus.unshift(bonus);
    await center.save();
    res.json(center);
  } catch (err) {
    console.error("Error adding bonus:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update an existing bonus
router.put("/:id/bonus/:bonusId", auth, ownerCanModifyCenter, async (req, res) => {
  try {
    const center = await Center.findById(req.params.id);
    if (!center) return res.status(404).json({ error: "Center not found" });
    const b = (center.bonus || []).id(req.params.bonusId);
    if (!b) return res.status(404).json({ error: "Bonus not found" });

    ["title", "text", "standardFree", "vipFree", "stageFree"].forEach((k) => {
      if (req.body[k] !== undefined) b[k] = req.body[k];
    });
    if (req.body.expiresAt !== undefined) {
      b.expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : undefined;
    }
    await center.save();
    res.json(center);
  } catch (err) {
    console.error("Error updating bonus:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a bonus
router.delete("/:id/bonus/:bonusId", auth, ownerCanModifyCenter, async (req, res) => {
  try {
    const center = await Center.findById(req.params.id);
    if (!center) return res.status(404).json({ error: "Center not found" });
    const b = (center.bonus || []).id(req.params.bonusId);
    if (!b) return res.status(404).json({ error: "Bonus not found" });
    b.remove();
    await center.save();
    res.json(center);
  } catch (err) {
    console.error("Error deleting bonus:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE (protected)
router.delete("/:id", auth, ownerCanModifyCenter, async (req, res) => {
  try {
    const id = req.params.id;
    await Center.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting center:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;