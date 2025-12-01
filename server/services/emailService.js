const nodemailer = require('nodemailer');

// Email transporter үүсгэх - Resend эсвэл Gmail
const createTransporter = () => {
  // Resend ашиглах (Railway дээр илүү сайн ажиллана)
  if (process.env.RESEND_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY
      }
    });
  }
  
  // Gmail App Password ашиглах (fallback)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
};

// Password reset code илгээх
const sendPasswordResetEmail = async (email, code, username = '') => {
  try {
    const transporter = createTransporter();
    
    // Resend ашиглаж байвал from хаяг өөрчлөх
    const fromEmail = process.env.RESEND_API_KEY 
      ? `PlayZone MN <onboarding@resend.dev>` 
      : `"PlayZone MN" <${process.env.EMAIL_USER}>`;
    
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: 'PlayZone MN - Нууц үг сэргээх код',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 30px 20px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 700;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 20px;
              color: #1a1a1a;
            }
            .message {
              color: #555;
              margin-bottom: 30px;
              font-size: 15px;
            }
            .code-container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
            }
            .code {
              font-size: 36px;
              font-weight: 700;
              letter-spacing: 8px;
              color: white;
              font-family: 'Courier New', monospace;
            }
            .code-label {
              color: rgba(255,255,255,0.9);
              font-size: 12px;
              text-transform: uppercase;
              margin-bottom: 10px;
              letter-spacing: 1px;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
              font-size: 14px;
            }
            .warning strong {
              color: #856404;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              border-top: 1px solid #e0e0e0;
              font-size: 13px;
              color: #666;
            }
            .footer a {
              color: #667eea;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 PlayZone MN</h1>
            </div>
            <div class="content">
              <div class="greeting">
                Сайн байна уу${username ? ', ' + username : ''}!
              </div>
              <div class="message">
                Таны нууц үг сэргээх хүсэлт ирлээ. Доорх 6 оронтой кодыг ашиглан нууц үгээ солино уу:
              </div>
              
              <div class="code-container">
                <div class="code-label">Таны код</div>
                <div class="code">${code}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Анхаар:</strong> Энэ код <strong>10 минутын</strong> дараа хүчингүй болно. Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тоомсорлоорой.
              </div>
              
              <div class="message" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                Асуулт эсвэл тусламж хэрэгтэй бол бидэнтэй холбогдоорой.
              </div>
            </div>
            <div class="footer">
              <p>© 2025 PlayZone MN. Бүх эрх хуулиар хамгаалагдсан.</p>
              <p>Энэ автомат илгээгдсэн имэйл юм. Хариу бичих шаардлагагүй.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail
};
