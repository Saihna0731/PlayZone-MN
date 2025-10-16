const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Бүртгүүлэх
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, fullName, phone } = req.body;

    // Хэрэглэгч байгаа эсэхийг шалгах
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email 
          ? "Энэ имэйл хаягаар бүртгүүлсэн хэрэглэгч байна" 
          : "Энэ хэрэглэгчийн нэр авч хэрэглэсэн байна"
      });
    }

    // Шинэ хэрэглэгч үүсгэх
    const user = new User({
      username,
      email,
      password,
      fullName,
      phone: phone || ""
    });

    await user.save();

    // JWT token үүсгэх
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Амжилттай бүртгүүллээ",
      token,
      user
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      message: "Бүртгүүлэхэд алдаа гарлаа",
      error: error.message 
    });
  }
});

// Нэвтрэх
router.post("/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Хэрэглэгчийг олох (имэйл эсвэл хэрэглэгчийн нэрээр)
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ]
    });

    if (!user) {
      return res.status(400).json({
        message: "Имэйл/хэрэглэгчийн нэр эсвэл нууц үг буруу байна"
      });
    }

    // Нууц үг шалгах
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Имэйл/хэрэглэгчийн нэр эсвэл нууц үг буруу байна"
      });
    }

    // Хэрэглэгч идэвхтэй эсэхийг шалгах
    if (!user.isActive) {
      return res.status(400).json({
        message: "Таны эрх хязгаарлагдсан байна"
      });
    }

    // JWT token үүсгэх
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Амжилттай нэвтэрлээ",
      token,
      user
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      message: "Нэвтрэхэд алдаа гарлаа",
      error: error.message 
    });
  }
});

// Хэрэглэгчийн мэдээлэл авах
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('favoritesCenters');
    if (!user) {
      return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    }
    res.json(user);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ 
      message: "Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа" 
    });
  }
});

// Хэрэглэгчийн мэдээлэл шинэчлэх
router.put("/profile", auth, async (req, res) => {
  try {
    const { fullName, phone, avatar } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { 
        fullName: fullName || undefined,
        phone: phone || undefined,
        avatar: avatar || undefined
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    }

    res.json({
      message: "Хэрэглэгчийн мэдээлэл амжилттай шинэчлэгдлээ",
      user
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ 
      message: "Хэрэглэгчийн мэдээлэл шинэчлэхэд алдаа гарлаа" 
    });
  }
});

// Дуртай төвөд нэмэх/хасах
router.post("/favorites/:centerId", auth, async (req, res) => {
  try {
    const { centerId } = req.params;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    }

    const isFavorite = user.favoritesCenters.includes(centerId);
    
    if (isFavorite) {
      user.favoritesCenters = user.favoritesCenters.filter(
        id => id.toString() !== centerId
      );
    } else {
      user.favoritesCenters.push(centerId);
    }

    await user.save();

    res.json({
      message: isFavorite ? "Дуртай жагсаалтаас хаслаа" : "Дуртай жагсаалтад нэмлээ",
      isFavorite: !isFavorite
    });
  } catch (error) {
    console.error("Favorites error:", error);
    res.status(500).json({ 
      message: "Дуртай жагсаалт шинэчлэхэд алдаа гарлаа" 
    });
  }
});

// Бүх хэрэглэгчдийг авах (зөвхөн админ)
router.get("/all", auth, async (req, res) => {
  try {
    // Админ эрх шалгах
    const currentUser = await User.findById(req.userId);
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ message: "Энэ үйлдэлд хандах эрх байхгүй" });
    }

    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ 
      message: "Хэрэглэгчдийн жагсаалт авахад алдаа гарлаа" 
    });
  }
});

// Add to favorites
router.post("/favorites/:centerId", auth, async (req, res) => {
  try {
    const { centerId } = req.params;
    const userId = req.userId; // req.user.userId-аас req.userId болгох

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    }

    // Аль хэдийн favorite-д байгаа эсэхийг шалгах
    if (user.favoritesCenters.includes(centerId)) {
      return res.status(400).json({ message: "Энэ төв аль хэдийн дуртай жагсаалтад байна" });
    }

    user.favoritesCenters.push(centerId);
    await user.save();

    res.json({ message: "Дуртай жагсаалтад нэмэгдлээ", favorites: user.favoritesCenters });
  } catch (error) {
    console.error("Add to favorites error:", error);
    res.status(500).json({ message: "Дуртай жагсаалтад нэмэхэд алдаа гарлаа" });
  }
});

// Remove from favorites
router.delete("/favorites/:centerId", auth, async (req, res) => {
  try {
    const { centerId } = req.params;
    const userId = req.userId; // req.user.userId-аас req.userId болгох

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    }

    user.favoritesCenters = user.favoritesCenters.filter(id => id.toString() !== centerId);
    await user.save();

    res.json({ message: "Дуртай жагсаалтаас хасагдлаа", favorites: user.favoritesCenters });
  } catch (error) {
    console.error("Remove from favorites error:", error);
    res.status(500).json({ message: "Дуртай жагсаалтаас хасахад алдаа гарлаа" });
  }
});

// Get user favorites
router.get("/favorites", auth, async (req, res) => {
  try {
    const userId = req.userId; // req.user.userId-аас req.userId болгох

    const user = await User.findById(userId).populate('favoritesCenters');
    if (!user) {
      return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    }

    res.json({ favorites: user.favoritesCenters });
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({ message: "Дуртай жагсаалт авахад алдаа гарлаа" });
  }
});

module.exports = router;