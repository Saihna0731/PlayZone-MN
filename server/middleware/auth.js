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

    // Хэрэв isActive талбар байхгүй бол (хуучин өгөгдөл) идэвхтэй гэж үзнэ
    if (!user || user.isActive === false) {
      return res.status(401).json({ message: "Хэрэглэгч олдсонгүй эсвэл идэвхгүй байна" });
    }

    // Check token version if it exists in token
    if (decoded.tokenVersion !== undefined && user.tokenVersion !== decoded.tokenVersion) {
       return res.status(401).json({ message: "Session expired. Please login again." });
    }

    req.userId = decoded.userId;
    req.user = user;
    // role-г токенээс унших (хуучин токенууд accountType-ыг хадгалдаг)
    req.userRole = decoded.role || decoded.accountType;
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