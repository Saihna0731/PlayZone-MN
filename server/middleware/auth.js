const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "Нэвтрэх шаардлагатай" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Хэрэглэгч олдсонгүй эсвэл идэвхгүй байна" });
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Токен буруу байна" });
  }
};

// Админ эрх шалгах middleware
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: "Админ эрх шаардлагатай" });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ message: "Нэвтрэх шаардлагатай" });
  }
};

module.exports = { auth, adminAuth };