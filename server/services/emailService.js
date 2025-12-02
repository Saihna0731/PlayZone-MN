const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// Resend client функц - дуудах бүрт шинээр авна (env variable өөрчлөгдөхөд автоматаар шинэчлэгдэнэ)
const getResendClient = () => {
  if (process.env.RESEND_API_KEY) {
    return new Resend(process.env.RESEND_API_KEY);
  }
  return null;
};

// Email transporter үүсгэх - Direct SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
  });
};

// Password reset code илгээх
const sendPasswordResetEmail = async (email, code, username = '') => {
  console.log('📧 sendPasswordResetEmail called for:', email);
  console.log('📧 RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
  
  const resend = getResendClient();
  console.log('📧 resend client created:', !!resend);
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700;">🔐 PlayZone MN</h1>
        </div>
        <div style="padding: 40px 30px;">
          <div style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #1a1a1a;">
            Сайн байна уу${username ? ', ' + username : ''}!
          </div>
          <div style="color: #555; margin-bottom: 30px; font-size: 15px;">
            Таны нууц үг сэргээх хүсэлт ирлээ. Доорх 6 оронтой кодыг ашиглан нууц үгээ солино уу:
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="color: rgba(255,255,255,0.9); font-size: 12px; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px;">Таны код</div>
            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: white; font-family: 'Courier New', monospace;">${code}</div>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px;">
            <strong style="color: #856404;">⚠️ Анхаар:</strong> Энэ код <strong>10 минутын</strong> дараа хүчингүй болно.
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 13px; color: #666;">
          <p style="margin: 5px 0;">© 2025 PlayZone MN. Бүх эрх хуулиар хамгаалагдсан.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Resend ЭХЛЭЭД ашиглах (Railway дээр Gmail ажиллахгүй)
  if (resend) {
    try {
      console.log('📧 Sending via Resend...');
      const { data, error: resendError } = await resend.emails.send({
        from: 'PlayZone MN <onboarding@resend.dev>',
        to: [email],
        subject: 'PlayZone MN - Нууц үг сэргээх код',
        html: htmlContent
      });
      
      if (resendError) {
        console.error('❌ Resend API error:', JSON.stringify(resendError));
      } else if (data?.id) {
        console.log('✅ Email sent via Resend:', data.id);
        return { success: true, messageId: data.id };
      }
    } catch (resendErr) {
      console.error('❌ Resend exception:', resendErr.message);
    }
  } else {
    console.log('⚠️ Resend client not initialized - RESEND_API_KEY missing');
  }

  // Gmail fallback (local dev-д ажиллана)
  try {
    console.log('📧 Trying Gmail SMTP fallback...');
    const transporter = createTransporter();
    const mailOptions = {
      from: `"PlayZone MN" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'PlayZone MN - Нууц үг сэргээх код',
      html: htmlContent
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent via Gmail:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (gmailError) {
    console.error('❌ Gmail error:', gmailError.message);
    return { success: false, error: 'Email илгээхэд алдаа гарлаа. Дараа дахин оролдоно уу.' };
  }
};

module.exports = {
  sendPasswordResetEmail
};
