const express = require("express");
const router = express.Router();
const Center = require("../models/Center");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const { checkCenterLimit, ownerCanModifyCenter } = require("../middleware/subscription");

// GET all (public, optimized)
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    // Lightweight projection for map/list to avoid huge payloads
    const projection = {
      name: 1,
      category: 1,
      address: 1,
      phone: 1,
      pricing: 1,
      price: 1,
      occupancy: 1,
      rating: 1,
      lat: 1,
      lng: 1,
      isVip: 1,
      bonus: 1,
      createdAt: 1
    };

    const centers = await Center.find({}, projection)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Short cache headers for mobile perf
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    res.json({ centers, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single center by ID (public)
router.get("/:id", async (req, res) => {
  try {
    const center = await Center.findById(req.params.id).lean();
    if (!center) {
      return res.status(404).json({ error: "Center not found" });
    }
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
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

// PUT update occupancy (secured by API key or auth)
router.put("/:id/occupancy", async (req, res) => {
  try {
    const { occupancy } = req.body;
    
    if (!occupancy) {
      return res.status(400).json({ error: "Occupancy data required" });
    }

    // Allow either a trusted device with API key or authenticated owner/admin
    const apiKey = req.header('X-API-Key');
    const allowedApiKey = process.env.OCCUPANCY_API_KEY || '';
    if (apiKey !== allowedApiKey) {
      // fallback to auth check via ownerCanModifyCenter
      return ownerCanModifyCenter(req, res, async () => {
        const center = await Center.findByIdAndUpdate(
          req.params.id, 
          { occupancy }, 
          { new: true, runValidators: true }
        ).lean();
        if (!center) return res.status(404).json({ error: "Center not found" });
        return res.json({ success: true, occupancy: center.occupancy });
      });
    }

    const center = await Center.findByIdAndUpdate(
      req.params.id, 
      { occupancy }, 
      { new: true, runValidators: true }
    ).lean();
    if (!center) return res.status(404).json({ error: "Center not found" });
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
    const { id, bonusId } = req.params;
    const center = await Center.findById(id);
    if (!center) return res.status(404).json({ error: "Center not found" });
    if (!Array.isArray(center.bonus)) center.bonus = [];
    const before = center.bonus.length;
    center.bonus = center.bonus.filter(b => String(b._id) !== String(bonusId));
    if (before === center.bonus.length) {
      return res.status(404).json({ error: "Bonus not found" });
    }
    await center.save();
    res.json({ success:true, center });
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