# Email Configuration for Password Reset

## 📧 Gmail Setup (Recommended)

### 1. Gmail App Password үүсгэх

1. Google Account руу нэвтрэх: https://myaccount.google.com
2. **Security** → **2-Step Verification** идэвхжүүлэх
3. **Security** → **App passwords** дарах
4. **Select app**: Mail
5. **Select device**: Other (Custom name) → "PlayZone MN Server"
6. **Generate** дарах
7. 16 оронтой кодыг хуулж авах (жишээ: `abcd efgh ijkl mnop`)

### 2. Environment Variables нэмэх

**Local Development (.env файл):**
```env
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop
```

**Railway Production:**
```bash
cd server
railway variables set EMAIL_USER="your-email@gmail.com"
railway variables set EMAIL_APP_PASSWORD="your-app-password"
railway up
```

**Vercel Frontend (шаардлагагүй):**
Frontend email илгээхгүй, зөвхөн backend.

---

## 📱 SMS API Setup (Optional)

### Option 1: Twilio

```bash
npm install twilio
```

```javascript
// server/services/smsService.js
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const sendSMS = async (phone, message) => {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: `+976${phone}`
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { sendSMS };
```

**Environment Variables:**
```env
TWILIO_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE=+1234567890
```

### Option 2: SMS Forwarder (Current)

Одоогийн систем SMS Forwarder ашиглаж байгаа тул SMS API шаардлагагүй.

---

## 🧪 Test

### Email Test:

```bash
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"your-email@gmail.com"}'
```

### SMS Test:

```bash
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"99123456"}'
```

---

## ✅ Checklist

- [ ] Gmail App Password үүсгэсэн
- [ ] `.env` файлд `EMAIL_USER` болон `EMAIL_APP_PASSWORD` нэмсэн
- [ ] `nodemailer` суулгасан (`npm install nodemailer`)
- [ ] Railway дээр environment variables тохируулсан
- [ ] Test хийсэн (email илгээгдэж байгаа эсэх)
- [ ] Frontend дээр email эсвэл утас оруулж туршсан

---

## 🔐 Security Notes

- **App Password-ийг `.env` файлд хадгална, Git-д оруулахгүй!**
- `.gitignore` дээр `.env` байгаа эсэхийг шалгах
- Production дээр Railway Variables ашиглах
- Email sender (FROM) нь verified байх ёстой

---

## 🎯 Next Steps

1. Gmail App Password үүсгэх
2. `.env` файлд нэмэх
3. Server restart (`npm start`)
4. Frontend дээр email оруулж test хийх
5. Gmail inbox шалгах (Spam folder ч шалгах!)
