const express = require("express");
const router = express.Router();
const Center = require("../models/Center");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const { checkCenterLimit, ownerCanModifyCenter } = require("../middleware/subscription");

// GET all (public)
router.get("/", async (req, res) => {
  try {
    // Owner-ийн subscription.plan-г фронт талд ашиглахын тулд populate хийв
    const centers = await Center.find()
      .populate('owner', 'subscription accountType role')
      .sort({ createdAt: -1 });
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
  const plan = sub?.plan;
  const canVideo = typeof sub?.canUploadVideo === 'boolean' ? sub.canUploadVideo : (plan === 'business_pro');
    const data = {
      ...req.body,
      lat: req.body.lat ? Number(req.body.lat) : undefined,
      lng: req.body.lng ? Number(req.body.lng) : undefined,
      owner: req.userId // эзэмшигчийг холбоно
    };

  if (!isAdmin && user?.accountType === 'centerOwner') {
      // Enforce image limit with sensible defaults by plan
      let allowedImages = 0;
      if (typeof sub.maxImages === 'number' && sub.maxImages > 0) {
        allowedImages = sub.maxImages;
      } else if (sub.plan === 'business_standard') {
        allowedImages = 3; // default for Business Standard if not set in DB
      }
      if (Array.isArray(data.images) && allowedImages > 0 && data.images.length > allowedImages) {
        return res.status(403).json({
          message: `Таны план дээр дээд тал нь ${allowedImages} зураг оруулах боломжтой. Илүү оруулахын тулд upgrade хийнэ үү.`,
          upgrade: true,
          code: 'IMAGE_LIMIT'
        });
      }
      // Enforce video permission
      if (!canVideo && ((Array.isArray(data.videos) && data.videos.length) || (Array.isArray(data.embedVideos) && data.embedVideos.length))) {
        return res.status(403).json({
          message: 'Видео оруулахын тулд Business Pro план шаардлагатай',
          upgrade: true,
          code: 'VIDEO_NOT_ALLOWED'
        });
      }
      // If not allowed, ensure server won't persist accidental inputs
      if (!canVideo) {
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
  const plan = sub?.plan;
  const canVideo = typeof sub?.canUploadVideo === 'boolean' ? sub.canUploadVideo : (plan === 'business_pro');

    const data = {
      ...req.body,
      lat: req.body.lat ? Number(req.body.lat) : undefined,
      lng: req.body.lng ? Number(req.body.lng) : undefined
    };
    
    if (typeof data.lat === "number" && typeof data.lng === "number") {
      data.location = { type: "Point", coordinates: [data.lng, data.lat] };
    }

    if (!isAdmin && user?.accountType === 'centerOwner') {
      let allowedImages = 0;
      if (typeof sub.maxImages === 'number' && sub.maxImages > 0) {
        allowedImages = sub.maxImages;
      } else if (sub.plan === 'business_standard') {
        allowedImages = 3;
      }
      if (Array.isArray(data.images) && allowedImages > 0 && data.images.length > allowedImages) {
        return res.status(403).json({
          message: `Таны план дээр дээд тал нь ${allowedImages} зураг оруулах боломжтой. Илүү оруулахын тулд upgrade хийнэ үү.`,
          upgrade: true,
          code: 'IMAGE_LIMIT'
        });
      }
      if (!canVideo && ((Array.isArray(data.videos) && data.videos.length) || (Array.isArray(data.embedVideos) && data.embedVideos.length))) {
        return res.status(403).json({
          message: 'Видео оруулахын тулд Business Pro план шаардлагатай',
          upgrade: true,
          code: 'VIDEO_NOT_ALLOWED'
        });
      }
      if (!canVideo) {
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

// GET /reels - return all centers with videos for vertical scroll feed
router.get("/api/reels", async (req, res) => {
  try {
    const centers = await Center.find({
      $or: [
        { videos: { $exists: true, $ne: [], $not: { $size: 0 } } },
        { embedVideos: { $exists: true, $ne: [], $not: { $size: 0 } } }
      ]
    })
      .populate('owner', 'username email accountType avatar')
      .sort({ createdAt: -1 });
    
    res.json(centers);
  } catch (err) {
    console.error("Error fetching reels:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============ LIKE/DISLIKE ENDPOINTS ============

// POST /api/centers/:id/like - Center-д Like дарах
router.post("/:id/like", auth, async (req, res) => {
  try {
    const center = await Center.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ error: "Center олдсонгүй" });
    }

    const userId = req.userId;
    const hasLiked = center.likes.includes(userId);
    const hasDisliked = center.dislikes.includes(userId);

    if (hasLiked) {
      // Unlike
      center.likes = center.likes.filter(id => id.toString() !== userId);
    } else {
      // Like хийх, dislike байвал хасах
      center.likes.push(userId);
      if (hasDisliked) {
        center.dislikes = center.dislikes.filter(id => id.toString() !== userId);
      }
    }

    await center.save();

    res.json({
      message: hasLiked ? "Like-ийг цуцаллаа" : "Like хийлээ",
      isLiked: !hasLiked,
      likesCount: center.likes.length,
      dislikesCount: center.dislikes.length
    });
  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/centers/:id/dislike - Center-д Dislike дарах
router.post("/:id/dislike", auth, async (req, res) => {
  try {
    const center = await Center.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ error: "Center олдсонгүй" });
    }

    const userId = req.userId;
    const hasLiked = center.likes.includes(userId);
    const hasDisliked = center.dislikes.includes(userId);

    if (hasDisliked) {
      // Remove dislike
      center.dislikes = center.dislikes.filter(id => id.toString() !== userId);
    } else {
      // Dislike хийх, like байвал хасах
      center.dislikes.push(userId);
      if (hasLiked) {
        center.likes = center.likes.filter(id => id.toString() !== userId);
      }
    }

    await center.save();

    res.json({
      message: hasDisliked ? "Dislike-ийг цуцаллаа" : "Dislike хийлээ",
      isDisliked: !hasDisliked,
      likesCount: center.likes.length,
      dislikesCount: center.dislikes.length
    });
  } catch (err) {
    console.error("Dislike error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/centers/:id/reactions - Center-ийн like/dislike тоог авах
router.get("/:id/reactions", async (req, res) => {
  try {
    const center = await Center.findById(req.params.id)
      .select('likes dislikes');
    
    if (!center) {
      return res.status(404).json({ error: "Center олдсонгүй" });
    }

    res.json({
      likesCount: center.likes?.length || 0,
      dislikesCount: center.dislikes?.length || 0
    });
  } catch (err) {
    console.error("Get reactions error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;