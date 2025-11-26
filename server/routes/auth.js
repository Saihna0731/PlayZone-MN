const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
// CenterOwner model-ийг ашиглахгүй болсон (owner мэдээлэл Users/Center дээр хадгалагдана)
const { auth } = require("../middleware/auth");

const router = express.Router();

// Имэйл бүртгэлтэй эсэхийг шалгах (email enumeration-ийг аль болох багасгах зорилгоор rate-limit хэрэглэхийг зөвлөе)
router.post('/email-exists', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Имэйл шаардлагатай' });
  const existing = await User.findOne({ email }).select('_id');
  return res.json({ exists: !!existing });
  } catch (error) {
    console.error('Email exists check error:', error);
    return res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

// Бүртгүүлэх
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, fullName, phone, accountType, centerName, wantsTrial } = req.body;

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

    // Trial мэдээлэл тохируулах
    const now = new Date();
    let trialDays = 0;
    let trialPlan = null;

    if (accountType === 'user') {
      userData.username = username;
      userData.fullName = fullName;
      trialDays = 7; // Энгийн хэрэглэгчид 7 хоног
      trialPlan = 'normal';
    } else if (accountType === 'centerOwner') {
      // centerOwner-д username оруулахгүй (undefined) - null биш
      userData.centerName = centerName;
      userData.fullName = centerName; // centerName-ийг fullName болгоно
      userData.isApproved = true; // Шууд идэвхжүүлэх
      userData.role = 'centerOwner';
      trialDays = 10; // Center эзэмшигчидэд 10 хоног
      trialPlan = 'business_standard';
      // username талбарыг огт оруулахгүй байх
    }

    // Trial мэдээлэл оруулах (хэрэв хэрэглэгч trial авахыг хүсвэл)
    if (wantsTrial !== false && trialDays > 0) {
      const trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + trialDays);
      
      userData.trial = {
        isActive: true,
        plan: trialPlan,
        startDate: now,
        endDate: trialEndDate,
        hasUsed: true
      };

      console.log('✅ Trial created:', {
        userId: email,
        plan: trialPlan,
        days: trialDays,
        endDate: trialEndDate
      });
    } else {
      console.log('ℹ️ User opted out of trial or no trial available');
    }

    const user = new User(userData);
    await user.save();

    // CenterOwner collection-д автоматаар бичлэг үүсгэдэг хэсгийг устгалаа

    // JWT token үүсгэх
    const token = jwt.sign(
      { userId: user._id, accountType: user.accountType, role: user.role },
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
    const { emailOrUsername, password, accountType } = req.body;

    // Хэрэглэгчийг олох (имэйл эсвэл хэрэглэгчийн нэрээр)
    const baseQuery = [
      { email: emailOrUsername },
      { username: emailOrUsername }
    ];

    // Admin хэрэглэгч user эрхээр нэвтрэх боломжтой
    const user = await User.findOne({
      $or: baseQuery,
      ...(accountType === 'user' ? { role: { $in: ['user', 'admin'] } } : {}),
      ...(accountType === 'centerOwner' ? { role: 'centerOwner' } : {})
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

    // Increment token version to invalidate previous sessions
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    // JWT token үүсгэх
    const token = jwt.sign(
      { 
        userId: user._id, 
        accountType: user.accountType, 
        role: user.role,
        tokenVersion: user.tokenVersion 
      },
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

// Нууц үг сэргээх хүсэлт авах (stub) - Жинхэнэ хэрэгжилт дээр токен үүсгэж имэйлээр илгээнэ
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Имэйл шаардлагатай' });
    // Хэрэглэгч байгаа эсэхийг шалгана (одоогоор токен хадгалахгүй)
    const user = await User.findOne({ email }).select('_id');
    // Enumeration багасгахын тулд үргэлж ижил success мессеж буцаана
    return res.json({ message: 'Хэрэв энэхүү имэйл бүртгэлтэй бол сэргээх заавар илгээгдлээ' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Серверийн алдаа' });
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

  // Зөвхөн энгийн хэрэглэгчдийг (accountType='user') буцаана; centerOwner-ууд Users цуглуулгад хадгалагддаг ч
  // админ жагсаалтад тусад нь харагдах ёстой тул эндээс шүүнэ.
  const users = await User.find({ accountType: 'user' }).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ 
      message: "Хэрэглэгчдийн жагсаалт авахад алдаа гарлаа" 
    });
  }
});

// ============ FOLLOW/UNFOLLOW ENDPOINTS ============

// Center Owner эсвэл Center-ийг дагах (Follow)
router.post("/follow/:targetId", auth, async (req, res) => {
  try {
    const { targetId } = req.params;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    }

    // Өөрийгөө дагахаас сэргийлэх
    if (req.userId === targetId) {
      return res.status(400).json({ message: "Өөрийгөө дагах боломжгүй" });
    }

    // Target user шалгах
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ message: "Дагах хэрэглэгч олдсонгүй" });
    }

    const isFollowing = user.following.includes(targetId);
    
    if (isFollowing) {
      // Unfollow
      user.following = user.following.filter(
        id => id.toString() !== targetId
      );
      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== req.userId
      );
    } else {
      // Follow
      user.following.push(targetId);
      targetUser.followers.push(req.userId);
    }

    await user.save();
    await targetUser.save();

    res.json({
      message: isFollowing ? "Unfollow хийлээ" : "Follow хийлээ",
      isFollowing: !isFollowing,
      followingCount: user.following.length,
      followersCount: targetUser.followers.length
    });
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({ 
      message: "Follow хийхэд алдаа гарлаа" 
    });
  }
});

// Following жагсаалт авах
router.get("/following", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('following', 'username email fullName avatar accountType');

    if (!user) {
      return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    }

    res.json({
      following: user.following || [],
      count: user.following?.length || 0
    });
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({ 
      message: "Following жагсаалт авахад алдаа гарлаа",
      error: error.message 
    });
  }
});

// Followers жагсаалт авах
router.get("/followers", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('followers', 'username email fullName avatar accountType');

    if (!user) {
      return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    }

    res.json({
      followers: user.followers || [],
      count: user.followers?.length || 0
    });
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({ 
      message: "Followers жагсаалт авахад алдаа гарлаа",
      error: error.message 
    });
  }
});

// Send verification code
router.post('/send-verification', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationCode = code;
    user.emailVerificationExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Mock sending email (In production, use nodemailer)
    console.log(`Verification code for ${user.email}: ${code}`);

    res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error("Send verification error:", error);
    res.status(500).json({ message: 'Error sending verification code' });
  }
});

// Verify email
router.post('/verify-email', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user || user.emailVerificationCode !== code || user.emailVerificationExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully', user });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({ message: 'Error verifying email' });
  }
});

module.exports = router;