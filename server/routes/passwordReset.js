const express = require('express');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();

/**
 * Step 1: Email эсвэл утасны дугаараар код илгээх хүсэлт
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    if (!emailOrPhone) {
      return res.status(400).json({ message: 'Имэйл эсвэл утасны дугаар оруулна уу' });
    }

    // Email эсвэл утас эсэхийг шалгах
    const isEmail = emailOrPhone.includes('@');
    const isPhone = /^[0-9]{8}$/.test(emailOrPhone);

    if (!isEmail && !isPhone) {
      return res.status(400).json({ message: 'Зөв имэйл эсвэл 8 оронтой утасны дугаар оруулна уу' });
    }

    // Хэрэглэгч олох (email-ийг lowercase болгож шалгах)
    const query = isEmail 
      ? { email: emailOrPhone.trim().toLowerCase() } 
      : { phone: emailOrPhone.trim() };
    const user = await User.findOne(query);
    
    if (!user) {
      return res.status(404).json({ 
        message: isEmail 
          ? 'Энэ имэйл хаягтай хэрэглэгч олдсонгүй' 
          : 'Энэ утасны дугаартай хэрэглэгч олдсонгүй' 
      });
    }

    // 6 оронтой санамсаргүй код үүсгэх
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Өмнөх кодуудыг идэвхгүй болгох
    const resetQuery = isEmail ? { userId: user._id } : { phone: emailOrPhone };
    await PasswordReset.updateMany(
      { ...resetQuery, isUsed: false },
      { isUsed: true }
    );

    // Шинэ код хадгалах
    const resetRequest = await PasswordReset.create({
      phone: isPhone ? emailOrPhone : (user.phone || ''),
      code,
      userId: user._id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 минут
    });

    // Email эсвэл SMS илгээх
    if (isEmail) {
      // Email илгээх
      const emailResult = await sendPasswordResetEmail(emailOrPhone, code, user.username);
      
      if (!emailResult.success) {
        console.error('❌ Email send failed:', emailResult.error);
        return res.status(500).json({ 
          message: 'Имэйл илгээхэд алдаа гарлаа. Дахин оролдоно уу.' 
        });
      }

      console.log('📧 Email sent successfully:', emailResult.messageId);
      res.json({
        success: true,
        message: 'Таны имэйл хаяг руу код илгээгдлээ. 10 минутын дотор ашиглана уу.',
        method: 'email',
        expiresAt: resetRequest.expiresAt,
        ...(process.env.NODE_ENV === 'development' && { devCode: code })
      });
    } else {
      // SMS илгээх (одоогоор console log)
      console.log('📱 SMS CODE:', {
        phone: emailOrPhone,
        code,
        message: `PlayZone MN: Таны нууц үг сэргээх код: ${code}. 10 минутын дотор ашиглана уу.`
      });

      // TODO: SMS API ашиглах (Twilio, MessageBird гэх мэт)
      // await sendSMS(emailOrPhone, `PlayZone MN: Таны код: ${code}`);

      res.json({
        success: true,
        message: 'SMS код илгээгдлээ. 10 минутын дотор ашиглана уу.',
        method: 'sms',
        expiresAt: resetRequest.expiresAt,
        ...(process.env.NODE_ENV === 'development' && { devCode: code })
      });
    }

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
    const { emailOrPhone, code } = req.body;

    if (!emailOrPhone || !code) {
      return res.status(400).json({ message: 'Имэйл/утас болон кодыг оруулна уу' });
    }

    // Хэрэглэгч олох
    const isEmail = emailOrPhone.includes('@');
    const query = isEmail ? { email: emailOrPhone } : { phone: emailOrPhone };
    const user = await User.findOne(query);
    
    if (!user) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    // Код олох
    const resetRequest = await PasswordReset.findOne({
      userId: user._id,
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
