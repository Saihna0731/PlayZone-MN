const express = require('express');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');

const router = express.Router();

/**
 * Step 1: Утасны дугаараар SMS код илгээх хүсэлт
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Утасны дугаар оруулна уу' });
    }

    // Phone format шалгах (8 оронтой)
    const phoneRegex = /^[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Утасны дугаар 8 оронтой тоо байх ёстой' });
    }

    // Хэрэглэгч олох
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'Энэ утасны дугаартай хэрэглэгч олдсонгүй' });
    }

    // 6 оронтой санамсаргүй код үүсгэх
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Өмнөх кодуудыг идэвхгүй болгох
    await PasswordReset.updateMany(
      { phone, isUsed: false },
      { isUsed: true }
    );

    // Шинэ код хадгалах
    const resetRequest = await PasswordReset.create({
      phone,
      code,
      userId: user._id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 минут
    });

    // 🔔 Бодит системд SMS илгээх (одоогоор console log)
    console.log('📱 SMS CODE:', {
      phone,
      code,
      message: `PlayZone MN: Таны нууц үг сэргээх код: ${code}. 10 минутын дотор ашиглана уу.`
    });

    // TODO: SMS API ашиглах (Twilio, MessageBird, etc.)
    // await sendSMS(phone, `PlayZone MN: Таны код: ${code}`);

    res.json({
      success: true,
      message: 'SMS код илгээгдлээ. 10 минутын дотор ашиглана уу.',
      expiresAt: resetRequest.expiresAt,
      // DEV ONLY: Production-д кодыг илгээхгүй!
      ...(process.env.NODE_ENV === 'development' && { devCode: code })
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Алдаа гарлаа', error: error.message });
  }
});

/**
 * Step 2: Код баталгаажуулах
 * POST /api/auth/verify-reset-code
 */
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ message: 'Утас болон кодыг оруулна уу' });
    }

    // Код олох
    const resetRequest = await PasswordReset.findOne({
      phone,
      code,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRequest) {
      return res.status(400).json({ 
        message: 'Буруу код эсвэл хугацаа дууссан байна. Дахин оролдоно уу.' 
      });
    }

    // Temporary token үүсгэх (5 минутын хугацаатай)
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    
    // Token-ийг code дээр хадгалах (5 минут)
    resetRequest.resetToken = resetToken;
    resetRequest.resetTokenExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await resetRequest.save();

    res.json({
      success: true,
      message: 'Код баталгаажлаа',
      resetToken,
      userId: resetRequest.userId
    });

  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ message: 'Алдаа гарлаа', error: error.message });
  }
});

/**
 * Step 3: Шинэ нууц үг тохируулах
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Бүх мэдээллийг оруулна уу' });
    }

    // Password validation
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Нууц үг 8-аас дээш тэмдэгт байх ёстой' });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ message: 'Нууц үг дор хаяж 1 том үсэг агуулах ёстой' });
    }

    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ message: 'Нууц үг дор хаяж 1 жижиг үсэг агуулах ёстой' });
    }

    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: 'Нууц үг дор хаяж 1 тоо агуулах ёстой' });
    }

    // Reset token олох
    const resetRequest = await PasswordReset.findOne({
      resetToken,
      isUsed: false,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!resetRequest) {
      return res.status(400).json({ 
        message: 'Буруу эсвэл хугацаа дууссан token байна' 
      });
    }

    // Хэрэглэгчийг олж нууц үг шинэчлэх
    const user = await User.findById(resetRequest.userId);
    if (!user) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    // Нууц үг шинэчлэх (pre-save hook автоматаар hash хийнэ)
    user.password = newPassword;
    await user.save();

    // Reset request ашигласан болгох
    resetRequest.isUsed = true;
    await resetRequest.save();

    console.log('✅ Password reset successful for user:', user.email);

    res.json({
      success: true,
      message: 'Нууц үг амжилттай солигдлоо. Шинэ нууц үгээрээ нэвтэрнэ үү.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Алдаа гарлаа', error: error.message });
  }
});

module.exports = router;
