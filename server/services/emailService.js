const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// Resend client (Domain verified бол ашиглана)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Email transporter үүсгэх - Direct SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS
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
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"PlayZone MN" <${process.env.EMAIL_USER}>`,
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

    // Gmail эхлээд ашиглах
    try {
      console.log('📧 Trying Gmail SMTP...');
      const info = await transporter.sendMail(mailOptions);
      console.log('📧 Email sent via Gmail:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (gmailError) {
      console.error('❌ Gmail error:', gmailError.message);
      
      // Gmail амжилтгүй бол Resend fallback (зөвхөн verified domain байвал)
      if (resend && process.env.RESEND_DOMAIN_VERIFIED === 'true') {
        try {
          console.log('📧 Trying Resend fallback...');
          const { data, error: resendError } = await resend.emails.send({
            from: `PlayZone MN <noreply@${process.env.RESEND_DOMAIN || 'playzone.mn'}>`,
            to: [email],
            subject: 'PlayZone MN - Нууц үг сэргээх код',
            html: mailOptions.html
          });
          
          if (!resendError && data?.id) {
            console.log('📧 Email sent via Resend:', data.id);
            return { success: true, messageId: data.id };
          }
          console.error('❌ Resend error:', resendError);
        } catch (resendErr) {
          console.error('❌ Resend failed:', resendErr.message);
        }
      }
      
      return { success: false, error: gmailError.message };
    }
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail
};
