# PlayZone MN - Хурдан Эхлүүлэх Зааварчилгаа

## 🎯 Товч Тойм

Төлбөрийн систем одоо **банкны шилжүүлэг + SMS автоматжуулалт** ашигладаг болсон.

**Үнэ**:
- Хэрэглэгч: 1,990₮
- Бизнес Стандарт: 19,900₮
- Бизнес Про: 39,900₮

**Банк**:
- Дансны дугаар: 5073073107
- Нэр: Б.Сайхан
- Утас: 80119900

---

## 🚀 Хурдан Эхлүүлэх (5 минут)

### Алхам 1: Server тохиргоо

```bash
cd server
```

**1. .env файл үүсгэх/засах**:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/my-map-app

# JWT
JWT_SECRET=your-jwt-secret-key

# SMS Webhook Security
SMS_WEBHOOK_SECRET=your-random-secret-key-123456

# Server
PORT=5000
```

**2. Dependencies суулгах**:
```bash
npm install
```

**3. Server эхлүүлэх**:
```bash
npm start
```

✅ Terminal дээр харагдах ёстой:
```
MongoDB connected
Server running on port 5000
```

---

### Алхам 2: Frontend эхлүүлэх

```bash
# Workspace root folder дээр
npm install
npm start
```

✅ Browser автоматаар нээгдэх: `http://localhost:3000`

---

### Алхам 3: Test хийх (Manual)

1. **Бүртгүүлэх**: `/auth-choice` → "Хэрэглэгч" сонгох → Бүртгүүлэх
2. **Profile**: 7 хоногийн trial banner харагдах
3. **Upgrade**: Profile → Subscription upgrade → План сонгох
4. **Банк мэдээлэл**: Payment modal нээгдэх
5. **Хуулах**: "Хуулах" товчоор бүх мэдээлэл clipboard-д хуулагдана
6. **Manual test**: Backend дээр manual verification хийх (SMS-гүй)

---

## 📱 SMS Автоматжуулалт (Android)

### Хамгийн хялбар арга: SMS Forwarder

**1. App татах**:
- Google Play Store → "SMS Forwarder"
- ЭСВЭЛ GitHub: https://github.com/pppscn/SmsForwarder

**2. Тохиргоо (5 минут)**:

```
1. App нээх → "Grant Permissions"
2. "Add Rule" дарах:
   - Rule Name: "Bank to PlayZone"
   - Sender: "KHANBANK" эсвэл "1800"
   - Content: "Гүйлгээ"
   
3. "Add Forwarder":
   - Type: HTTP/HTTPS
   - URL: https://YOUR-SERVER.com/api/payment/webhook-sms
   - Method: POST
   - Headers:
     {
       "Content-Type": "application/json",
       "X-API-Key": "your-random-secret-key-123456"
     }
   - Body:
     {
       "from": "{{from}}",
       "message": "{{message}}",
       "timestamp": "{{timestamp}}",
       "phone": "80119900"
     }
     
4. "Test" дарж шалгах
5. "Enable" → ON
```

**3. Утас тохиргоо**:
- ✅ Battery optimization OFF (App settings)
- ✅ Background app refresh ON
- ✅ Internet холболттой байх

---

## 🧪 Test хийх (Local - ngrok ашиглах)

### Production-д deploy хийхээс өмнө local test:

**1. ngrok суулгах**:
```bash
# Download: https://ngrok.com/download
# Or: choco install ngrok (Windows)
```

**2. Server эхлүүлэх**:
```bash
cd server
npm start
```

**3. ngrok эхлүүлэх (шинэ terminal)**:
```bash
ngrok http 5000
```

**4. Public URL хуулах**:
```
Forwarding: https://abc123.ngrok-free.app -> localhost:5000
```

**5. SMS Forwarder дээр URL солих**:
```
https://abc123.ngrok-free.app/api/payment/webhook-sms
```

**6. Test SMS илгээх (curl)**:
```bash
curl -X POST https://abc123.ngrok-free.app/api/payment/webhook-sms \
  -H "X-API-Key: your-random-secret-key-123456" \
  -H "Content-Type: application/json" \
  -d '{
    "from":"1800",
    "message":"KHANBANK: 19,900₮ орлого. Гүйлгээ: TEST123456. Үлдэгдэл: 150,000₮",
    "timestamp":"2025-01-15T14:30:00Z",
    "phone":"80119900"
  }'
```

---

## ✅ Амжилттай Test-ийн Checklist

### Frontend:
- [ ] Plan үнэ зөв харагдаж байна (1,990₮ / 19,900₮ / 39,900₮)
- [ ] "Шууд эхлэх" товч дарахад Payment modal нээгдэж байна
- [ ] Банкны мэдээлэл зөв харагдаж байна (5073073107)
- [ ] "Хуулах" товч ажиллаж байна
- [ ] Modal хаагдаж байна

### Backend:
- [ ] Server ажиллаж байна (PORT 5000)
- [ ] MongoDB холбогдсон
- [ ] `/api/payment/create-pending` endpoint ажиллаж байна
- [ ] `/api/payment/webhook-sms` endpoint ажиллаж байна
- [ ] PendingPayment collection үүсч байна
- [ ] SmsLog collection үүсч байна

### SMS Automation:
- [ ] SMS Forwarder суусан
- [ ] Rule үүсгэсэн
- [ ] Forwarder тохируулсан (URL + API Key)
- [ ] Test амжилттай
- [ ] SMS автоматаар илгээгдэж байна

---

## 🐛 Асуудал шийдвэрлэх

### Server эхлэхгүй байна:
```bash
# MongoDB ажиллаж байгаа эсэхийг шалгах
mongosh

# Port ашиглагдаж байгаа эсэхийг шалгах
netstat -ano | findstr :5000

# Dependencies дахин суулгах
cd server
rm -rf node_modules
npm install
```

### SMS илгээгдэхгүй байна:
1. **Utасны settings**: Battery optimization OFF хийх
2. **Internet**: WiFi эсвэл mobile data идэвхтэй эсэх
3. **SMS Forwarder**: App background ажиллаж байгаа эсэх
4. **API Key**: Зөв байгаа эсэх (.env болон SMS Forwarder)
5. **URL**: ngrok URL эсвэл production URL зөв байгаа эсэх

### Webhook хүлээн авахгүй байна:
```bash
# Server logs шалгах
# Terminal дээр energy гарч байгаа эсэх

# Test curl илгээх
curl -X POST http://localhost:5000/api/payment/webhook-sms \
  -H "X-API-Key: your-secret" \
  -H "Content-Type: application/json" \
  -d '{"from":"test","message":"KHANBANK: 19,900₮ орлого. Гүйлгээ: ABC123"}'
```

### Database алдаа:
```bash
# MongoDB ажиллаж байгаа эсэх
mongosh

# Collections шалгах
use my-map-app
show collections

# Indexes шалгах
db.pendingpayments.getIndexes()
db.smslogs.getIndexes()
```

---

## 📚 Нэмэлт Документууд

- `SMS_AUTOMATION_GUIDE.md` - SMS automation дэлгэрэнгүй
- `PAYMENT_SYSTEM_SUMMARY.md` - Системийн бүтэн тайлбар
- `TRIAL_SYSTEM_SUMMARY.md` - Trial system тайлбар

---

## 🎉 Амжилттай Deployment!

Бүх зүйл ажиллаж байвал:
1. ✅ Production server руу deploy
2. ✅ Domain нэр тохируулах
3. ✅ HTTPS certificate авах (Let's Encrypt)
4. ✅ SMS Forwarder дээр production URL шинэчлэх
5. ✅ Бодит шилжүүлэг хийж test

**Амжилт хүсье!** 🚀

---

## Холбоо барих

Асуулт байвал:
- Email: support@playzone.mn
- Phone: 80119900
- GitHub Issues: https://github.com/Saihna0731/my-map-app/issues
