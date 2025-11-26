# PlayZone MN - Deployment & SMS Forwarder Setup Guide

## 🚀 Deployment Заавар

### Яагаад Deploy хийх хэрэгтэй вэ?

SMS Forwarder app нь **HTTPS URL** шаарддаг. `http://localhost` ажиллахгүй учир production server дээр deploy хийх шаардлагатай.

---

## 📱 Option 1: Backend Deploy (Зөвлөмж)

### Railway Deployment (Үнэгүй)

```bash
# 1. Railway CLI суулгах
npm install -g @railway/cli

# 2. Нэвтрэх
railway login

# 3. Шинэ project үүсгэх
railway init

# 4. Backend deploy хийх
cd server
railway up

# 5. Environment variables тохируулах
railway variables set MONGO_URI="your-mongodb-atlas-uri"
railway variables set JWT_SECRET="your-jwt-secret"
railway variables set SMS_WEBHOOK_SECRET="your-sms-secret"
railway variables set PORT=8080

# 6. URL авах
railway domain
# Output: https://your-app.railway.app
```

**SMS Forwarder URL:** `https://your-app.railway.app/api/payment/webhook-sms`

---

### Render Deployment (Үнэгүй)

1. **GitHub-д код push хийх**
```bash
git add .
git commit -m "Deploy ready"
git push origin main
```

2. **Render.com-д орж Web Service үүсгэх**
- Build Command: `cd server && npm install`
- Start Command: `cd server && npm start`
- Environment Variables:
  ```
  MONGO_URI=your-mongodb-atlas-uri
  JWT_SECRET=your-jwt-secret
  SMS_WEBHOOK_SECRET=your-sms-webhook-secret
  PORT=8080
  NODE_ENV=production
  ```

3. **Deploy хийх**
- Auto-deploy: GitHub commit бүр дээр автоматаар deploy хийнэ

**SMS Forwarder URL:** `https://your-app.onrender.com/api/payment/webhook-sms`

---

## 📱 Option 2: Full Stack Deploy

### Vercel (Frontend) + Railway (Backend)

**Frontend (Vercel):**
```bash
# 1. Vercel CLI суулгах
npm install -g vercel

# 2. Frontend deploy
vercel --prod

# 3. Environment variables тохируулах
# Vercel Dashboard → Settings → Environment Variables
REACT_APP_API_BASE=https://your-backend.railway.app
```

**Backend (Railway):**
```bash
# Дээрх Railway заавраар backend deploy хийнэ
```

---

## 🔗 SMS Forwarder Setup

### 1. App татах

**Android:** Google Play Store → "SMS Forwarder" (pppscn/SmsForwarder)

### 2. Battery Optimization идэвхгүй болгох

```
Settings → Apps → SMS Forwarder → Battery → Don't optimize
```

### 3. Permissions олгох

- SMS read permission
- Notifications access
- Background execution

### 4. Sender Rule үүсгэх

**Rule Configuration:**

```
Rule Name: PlayZone Payment SMS
Sender: KHANBANK (эсвэл 1800)
Content Filter: PZ- (код агуулсан SMS-ийг л илгээнэ)
```

### 5. Forward Method тохируулах

**HTTP/HTTPS Request:**

```
URL: https://your-app.railway.app/api/payment/webhook-sms
Method: POST

Headers:
Content-Type: application/json
X-API-Key: your-sms-webhook-secret

Body Template:
{
  "from": "{{from}}",
  "message": "{{message}}",
  "timestamp": "{{timestamp}}",
  "phone": "60643016"
}
```

### 6. Test хийх

**Test SMS илгээх:**
```
KHANBANK: 19,900₮ орлого. Гүйлгээний утга: PZ-ABC123. Гүйлгээ: TEST123. Үлдэгдэл: 150,000₮
```

**Expected Result:**
- SMS Forwarder app автоматаар уншина
- Webhook руу илгээнэ
- Backend код баталгаажуулна
- Subscription идэвхжинэ

---

## 🧪 Local Testing (ngrok)

Deploy хийхээс өмнө test хийх бол:

```bash
# Terminal 1: Backend ажиллуулах
cd server
npm start

# Terminal 2: ngrok
ngrok http 5000

# ngrok URL-ийг SMS Forwarder-д оруулах
https://abc123.ngrok.io/api/payment/webhook-sms
```

⚠️ **Анхааруулга:** ngrok нь зөвхөн test-д ашиглагдана. 24 цагийн дараа URL солигдоно.

---

## 🔐 Password Reset System

### SMS Code Урсгал:

```
1. User → Forgot Password хуудас нээх
2. Утасны дугаар оруулах (99123456)
3. Backend → 6 оронтой код үүсгэж SMS илгээнэ
4. User → Код оруулах
5. Backend → Код баталгаажуулж temporary token үүсгэнэ
6. User → Шинэ нууц үг оруулах
7. Backend → Нууц үг солигдоно
```

### Security Features:

✅ **Code Expiry:** 10 минутын дараа хүчингүй  
✅ **One-time use:** Нэг удаа л ашиглагдана  
✅ **Strong Password:** 8+ тэмдэгт, том үсэг, тоо, тусгай тэмдэгт шаардлагатай  
✅ **Phone Validation:** 8 оронтой Монголын дугаар  
✅ **TTL Cleanup:** 1 цагийн дараа database-с устгагдана  

---

## 📊 Database Schema

### PasswordReset Collection

```javascript
{
  _id: ObjectId,
  phone: "99123456",           // indexed
  code: "123456",              // 6 оронтой
  userId: ObjectId,            // User reference
  isUsed: false,               // indexed
  resetToken: "abc123...",     // Step 2 дээр үүснэ
  resetTokenExpiry: Date,      // 5 минут
  expiresAt: Date,             // 10 минут
  createdAt: Date              // TTL: 1 цаг
}
```

**Indexes:**
- `phone`: faster lookup
- `{ phone, code, isUsed }`: compound index
- `resetToken`: sparse index
- `createdAt`: TTL (1 hour auto-delete)

---

## 🎨 Frontend Features

### Register Page:

✅ **Strong Password Validation:**
- 8+ тэмдэгт
- Том үсэг (A-Z)
- Жижиг үсэг (a-z)
- Тоо (0-9)
- Тусгай тэмдэгт (!@#$%^&*)

✅ **Phone Validation:**
- 8 оронтой тоо
- Зөвхөн тоо (0-9)

✅ **Email Validation:**
- Зөв format (name@example.com)

✅ **Hint Messages:**
- Password hint: "💡 Хүчтэй нууц үг: 8+ тэмдэгт..."
- Phone hint: "⚠️ 8 оронтой дугаар оруулна уу..."
- Email hint: "⚠️ Үнэн зөв имэйл хаяг оруулна уу..."

### Forgot Password Page:

✅ **3 Step Process:**
1. Phone number оруулах
2. SMS code баталгаажуулах
3. Шинэ нууц үг тохируулах

✅ **Dev Mode:**
- Development-д код console-д харагдана
- Production-д харагдахгүй

✅ **User-Friendly:**
- Clear instructions
- Error messages
- Success messages
- Back buttons

---

## 🚀 Deployment Checklist

### Backend:

- [ ] MongoDB Atlas database үүсгэх
- [ ] Environment variables тохируулах (.env)
  ```env
  MONGO_URI=mongodb+srv://...
  JWT_SECRET=random-secret-key
  SMS_WEBHOOK_SECRET=another-random-key
  PORT=8080
  NODE_ENV=production
  ```
- [ ] Railway/Render дээр deploy хийх
- [ ] Database indexes үүссэн эсэхийг шалгах
- [ ] API endpoints ажиллаж байгаа эсэхийг test хийх

### Frontend:

- [ ] API_BASE URL өөрчлөх (production backend URL)
- [ ] Vercel дээр deploy хийх
- [ ] Logo файл байгаа эсэхийг шалгах
- [ ] Routes ажиллаж байгаа эсэхийг test хийх

### SMS Forwarder:

- [ ] Android утас дээр app суулгах
- [ ] Battery optimization идэвхгүй болгох
- [ ] Permissions олгох
- [ ] Rule үүсгэх (KHANBANK sender)
- [ ] Webhook URL тохируулах (production URL)
- [ ] Headers болон API key тохируулах
- [ ] Test SMS илгээж test хийх

---

## 🧪 Testing Commands

### 1. Password Reset Code Request

```bash
curl -X POST https://your-app.railway.app/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"phone":"99123456"}'
```

**Expected:**
```json
{
  "success": true,
  "message": "SMS код илгээгдлээ",
  "devCode": "123456"
}
```

### 2. Verify Code

```bash
curl -X POST https://your-app.railway.app/api/auth/verify-reset-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"99123456","code":"123456"}'
```

**Expected:**
```json
{
  "success": true,
  "message": "Код баталгаажлаа",
  "resetToken": "abc123..."
}
```

### 3. Reset Password

```bash
curl -X POST https://your-app.railway.app/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"resetToken":"abc123...","newPassword":"NewPass@123"}'
```

**Expected:**
```json
{
  "success": true,
  "message": "Нууц үг амжилттай солигдлоо"
}
```

### 4. Test Payment Code SMS

```bash
curl -X POST https://your-app.railway.app/api/payment/webhook-sms \
  -H "X-API-Key: your-sms-webhook-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "from":"1800",
    "message":"KHANBANK: 19,900₮ орлого. Гүйлгээний утга: PZ-ABC123. Гүйлгээ: TEST123",
    "phone":"60643016"
  }'
```

---

## 📞 SMS Integration (Production)

### Option 1: SMS Service Provider

Бодит production-д SMS service ашиглах (Twilio, MessageBird, etc.):

```javascript
// server/routes/passwordReset.js

const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// SMS илгээх
await client.messages.create({
  body: `PlayZone MN: Таны нууц үг сэргээх код: ${code}`,
  from: process.env.TWILIO_PHONE,
  to: `+976${phone}`
});
```

### Option 2: SMS Forwarder (Одоогийн систем)

User-ийн утас дээр SMS Forwarder app ашиглан SMS автоматаар webhook руу илгээх.

---

## ⚠️ Production Considerations

1. **Environment Variables:** `.env` файлыг Git-д оруулахгүй! `.gitignore`-д нэмнэ.
2. **API Keys:** Random, secure keys ашиглах (crypto.randomBytes)
3. **Rate Limiting:** SMS spam-аас хамгаалах
4. **HTTPS Only:** Production дээр зөвхөн HTTPS ашиглах
5. **Database Backup:** MongoDB Atlas auto-backup идэвхжүүлэх
6. **Monitoring:** Error tracking (Sentry, LogRocket)
7. **SMS Cost:** SMS service ашиглавал өртөг тооцох

---

## 🎉 Summary

✅ **Password Reset:** SMS code-той 3-step систем  
✅ **Strong Password:** 8+ тэмдэгт, том/жижиг үсэг, тоо, тусгай тэмдэгт  
✅ **Phone/Email Validation:** Үнэн зөв мэдээлэл шаардах  
✅ **Deployment Ready:** Railway/Render/Vercel дээр deploy хийхэд бэлэн  
✅ **SMS Forwarder:** Android app ашиглан автомат SMS forwarding  
✅ **Security:** TTL, one-time codes, API key protection  

**Дараагийн алхам:** Railway дээр backend deploy хийж, SMS Forwarder app тохируулаарай! 🚀
