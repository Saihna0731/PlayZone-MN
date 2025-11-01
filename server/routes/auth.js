const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Бүртгүүлэх
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, fullName, phone, accountType, centerName } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Имэйл болон нууц үг шаардлагатай"
      });
    }

    if (accountType === 'user' && (!username || !fullName)) {
      return res.status(400).json({
        message: "Хэрэглэгчийн нэр болон бүтэн нэр шаардлагатай"
      });
    }

    if (accountType === 'centerOwner' && !centerName) {
      return res.status(400).json({
        message: "PC Center-ийн нэр шаардлагатай"
      });
    }

    // Хэрэглэгч байгаа эсэхийг шалгах
    const query = accountType === 'user' 
      ? { $or: [{ email }, { username }] }
      : { email };
    
    const existingUser = await User.findOne(query);

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email 
          ? "Энэ имэйл хаягаар бүртгүүлсэн хэрэглэгч байна" 
          : "Энэ хэрэглэгчийн нэр авч хэрэглэсэн байна"
      });
    }

    // Шинэ хэрэглэгч үүсгэх
    const userData = {
      email,
      password,
      phone: phone || "",
      accountType: accountType || 'user',
      role: 'user'
    };

    if (accountType === 'user') {
      userData.username = username;
      userData.fullName = fullName;
    } else if (accountType === 'centerOwner') {
      userData.centerName = centerName;
      userData.isApproved = false; // Админаар баталгаажуулах
      userData.role = 'centerOwner';
    }

    const user = new User(userData);
    await user.save();

    // JWT token үүсгэх
    const token = jwt.sign(
      { userId: user._id, accountType: user.accountType, role: user.role },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: accountType === 'centerOwner' 
        ? "Амжилттай бүртгүүллээ. Админаар баталгаажуулагдсаны дараа нэвтрэх боломжтой болно."
        : "Амжилттай бүртгүүллээ",
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

    // Эзэмшигч баталгаажсан эсэхийг шалгах
    if (user.accountType === 'centerOwner' && !user.isApproved) {
      return res.status(403).json({
        message: "Таны бүртгэл хараахан админаар баталгаажаагүй байна. Та удахгүй эрх авах болно."
      });
    }

    // JWT token үүсгэх
    const token = jwt.sign(
      { userId: user._id, accountType: user.accountType, role: user.role },
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
    const user = await User.findById(req.userId).populate('favorites');
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

// Дуртай төвүүдийг авах (GET)
router.get("/favorites", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('favorites');
    
    if (!user) {
      return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    }

    res.json({
      favorites: user.favorites || []
    });
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({ 
      message: "Дуртай жагсаалт авахад алдаа гарлаа",
      error: error.message 
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

    const isFavorite = user.favorites.includes(centerId);
    
    if (isFavorite) {
      user.favorites = user.favorites.filter(
        id => id.toString() !== centerId
      );
    } else {
      user.favorites.push(centerId);
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

module.exports = router;