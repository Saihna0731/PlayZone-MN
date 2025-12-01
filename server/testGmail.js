require('dotenv').config();
const nodemailer = require('nodemailer');

async function testGmail() {
  console.log('Testing Gmail SMTP...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? 'SET' : 'NOT SET');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000
  });

  try {
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified!');
    
    const info = await transporter.sendMail({
      from: `"PlayZone MN" <${process.env.EMAIL_USER}>`,
      to: 's22c023b@nmct.edu.mn',
      subject: 'PlayZone MN - Gmail Test',
      html: '<div style="padding: 20px;"><h1 style="color: #667eea;">🎮 PlayZone MN</h1><p>Gmail SMTP ажиллаж байна!</p><div style="background: #667eea; padding: 15px; border-radius: 8px; text-align: center; color: white; font-size: 24px;">123456</div></div>'
    });
    
    console.log('✅ Email sent via Gmail!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Gmail error:', error.message);
  }
}

testGmail();
