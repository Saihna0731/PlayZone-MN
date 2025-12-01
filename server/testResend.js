require('dotenv').config();
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
  try {
    console.log('Testing Resend with playzone.cv domain...');
    console.log('API Key:', process.env.RESEND_API_KEY ? 'SET' : 'NOT SET');
    
    const { data, error } = await resend.emails.send({
      from: 'PlayZone MN <onboarding@resend.dev>',
      to: ['baatarhvvbayrsaihan495@gmail.com'],
      subject: 'PlayZone MN - Тест код',
      html: '<div style="font-family: Arial; padding: 20px;"><h1 style="color: #667eea;">🔐 PlayZone MN</h1><p>Таны тест код: <strong style="font-size: 24px; letter-spacing: 5px;">123456</strong></p></div>'
    });
    
    if (error) {
      console.log('Error:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Success! Email ID:', data.id);
      console.log('Email илгээгдлээ! s22c023b@nmct.edu.mn хаягаа шалгаарай.');
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

test();
