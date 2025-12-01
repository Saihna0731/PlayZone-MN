# PlayZone MN - Payment Code System Guide

## 🎯 Системийн Тойм

PlayZone MN нь **уникал төлбөрийн код системтэй** автомат төлбөрийн баталгаажуулалт ашигладаг. Хэрэглэгч төлбөр төлөхдөө **гүйлгээний утга дээр уникал код** оруулж, SMS автоматаар баталгаажих систем юм.

---

## 🔄 Төлбөрийн Урсгал

### 1️⃣ Хэрэглэгчийн Үйлдэл

```
User → Profile → Plan сонгох (Normal/Business Standard/Business Pro)
→ "Шууд эхлэх" товч дарах
→ Систем unique CODE үүсгэнэ (жишээ: PZ-A1B2C3)
→ Payment Modal гарч ирнэ:
   - Банкны мэдээлэл
   - Дансны дугаар: 5401345831
   - Дансны нэр: Б.Баярсайхан
   - Утас: 60643016
   - 🔑 PAYMENT CODE: PZ-A1B2C3 (24 цагийн хугацаатай)
```

### 2️⃣ Шилжүүлэг Хийх

```
User → Mobile Banking App нээх
→ Хаан банк руу шилжүүлэг хийх
→ Дансны дугаар: 5401345831
→ Дүн: 19,900₮ (сонгосон планаасаа хамааруулж)
→ ⚠️ ГҮЙЛГЭЭНИЙ УТГА: PZ-A1B2C3 (Энэ кодыг заавал бичнэ!)
→ Шилжүүлэг баталгаажуулах
```

### 3️⃣ SMS Автомат Баталгаажуулалт

```
Банк → SMS илгээх:
"KHANBANK: 19,900₮ орлого. Гүйлгээний утга: PZ-A1B2C3. Гүйлгээ: TXN123456. Үлдэгдэл: 150,000₮"

↓

SMS Forwarder App (утас дээр) → SMS уншина
→ Webhook руу илгээх: https://your-server.com/api/payment/webhook-sms

↓

Backend Server → SMS задалж parse хийх:
  - Дүн: 19,900₮ ✅
  - CODE: PZ-A1B2C3 ✅
  - Transaction ID: TXN123456 ✅

→ PaymentCode collection-с PZ-A1B2C3 код олох
→ Код идэвхтэй эсэх шалгах (status='pending', expiresAt > now)
→ Үнэ тохирч байгаа эсэх шалгах (19,900₮ === code.amount)
→ Хэрэглэгчийг кодоор олох (code.userId)
→ Subscription идэвхжүүлэх (plan='business_standard', endDate=+1 month)
→ Код 'used' болгох
→ SmsLog хадгалах

↓

User → Refresh хийхэд эрх идэвхжсэн байна! ✅
```

---

## 💻 Backend Implementation

### PaymentCode Model

**Файл:** `server/models/PaymentCode.js`

```javascript
{
  code: 'PZ-A1B2C3',           // Unique 8-char code
  userId: ObjectId,              // Хэн төлбөр төлж байгаа
  planId: 'business_standard',   // Ямар план авах
  amount: 19900,                 // Төлөх дүн
  status: 'pending',             // pending | used | expired
  expiresAt: Date,               // 24 цагийн дараа
  usedAt: Date,                  // Ашигласан цаг
  createdAt: Date
}
```

**Indexes:**
- `code`: unique
- `{ userId, status, createdAt }`
- `{ status, expiresAt }`
- TTL index: 7 хоногийн дараа устгах

---

### API Endpoints

#### 1. POST /api/payment/generate-code

**Тайлбар:** Уникал төлбөрийн код үүсгэх

**Request:**
```json
{
  "planId": "business_standard"
}
```

**Response:**
```json
{
  "code": "PZ-A1B2C3",
  "amount": 19900,
  "planId": "business_standard",
  "expiresAt": "2025-11-27T10:00:00Z",
  "message": "Код амжилттай үүсгэгдлээ"
}
```

**Логик:**
1. План үнэ шалгах (1990/19900/39900₮)
2. Хэрэглэгчийн идэвхтэй код байгаа эсэхийг шалгах
3. Хэрэв байгаа бол хуучин кодыг буцаах
4. Байхгүй бол шинэ 6 оронтой код үүсгэх (PZ-XXXXXX)
5. Unique байхыг баталгаажуулах
6. Database-д хадгалах

---

#### 2. POST /api/payment/webhook-sms

**Тайлбар:** SMS автоматаар боловсруулах, кодоор баталгаажуулах

**Headers:**
```
X-API-Key: your-secret-key-12345
Content-Type: application/json
```

**Request:**
```json
{
  "from": "1800",
  "message": "KHANBANK: 19,900₮ орлого. Гүйлгээний утга: PZ-A1B2C3. Гүйлгээ: TXN123. Үлдэгдэл: 150,000₮",
  "timestamp": "2025-11-26T14:30:00Z",
  "phone": "60643016"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription activated successfully",
  "userId": "507f1f77bcf86cd799439011",
  "plan": "business_standard"
}
```

**Логик:**
1. API Key баталгаажуулах
2. SMS задлах (parse):
   - Дүн: `/(\d{1,3}(?:,\d{3})*)\s*₮/`
   - Transaction ID: `/(?:Гүйлгээ|Transaction):\s*([A-Z0-9]+)/`
   - **🆕 CODE:** `/(?:утга|description):\s*(PZ-[A-Z0-9]{6})/i`
3. Давхар гүйлгээ шалгах (SmsLog-с transactionId)
4. **Code шалгах:**
   - PaymentCode collection-с код олох
   - Status='pending', expiresAt > now
   - Үнэ тохирч байгаа эсэх
5. Хэрэглэгчийг кодоор олох
6. Subscription идэвхжүүлэх
7. Код 'used' болгох
8. SmsLog хадгалах

---

## 📱 SMS Forwarder Setup (Android)

### App татах

Google Play Store → "SMS Forwarder" (pppscn/SmsForwarder)

### Rule үүсгэх

**Rule Name:** PlayZone Payment SMS

**Sender Filter:**
- Contains: `KHANBANK` эсвэл `1800`

**Content Filter:**
- Contains: `PZ-`

**Forward Method:** HTTP/HTTPS Request

**Configuration:**
```
URL: https://your-server.com/api/payment/webhook-sms
Method: POST
Headers:
  Content-Type: application/json
  X-API-Key: your-secret-key-12345

Body Template:
{
  "from": "{{from}}",
  "message": "{{message}}",
  "timestamp": "{{timestamp}}",
  "phone": "60643016"
}
```

### Battery Optimization

Settings → Apps → SMS Forwarder → Battery → "Don't optimize"

---

## 🧪 Testing

### 1. Local Testing (ngrok)

```bash
# Terminal 1: Server ажиллуулах
cd server
npm start

# Terminal 2: ngrok
ngrok http 5000

# Ngrok URL-ийг SMS Forwarder-д оруулах
https://abc123.ngrok.io/api/payment/webhook-sms
```

### 2. Code үүсгэх

```bash
curl -X POST http://localhost:5000/api/payment/generate-code \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId":"business_standard"}'
```

**Response:**
```json
{
  "code": "PZ-A1B2C3",
  "amount": 19900,
  "expiresAt": "2025-11-27T10:00:00Z"
}
```

### 3. Test SMS Webhook

```bash
curl -X POST http://localhost:5000/api/payment/webhook-sms \
  -H "X-API-Key: your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "from":"1800",
    "message":"KHANBANK: 19,900₮ орлого. Гүйлгээний утга: PZ-A1B2C3. Гүйлгээ: TEST123. Үлдэгдэл: 150,000₮",
    "timestamp":"2025-11-26T14:30:00Z",
    "phone":"60643016"
  }'
```

**Expected:**
```json
{
  "success": true,
  "message": "Subscription activated",
  "userId": "...",
  "plan": "business_standard"
}
```

---

## 🎨 Frontend UI

### Payment Modal Features

✅ PlayZone MN Logo харагдана  
✅ План нэр болон үнэ харагдана (19,900₮)  
✅ Банкны мэдээлэл: Хаан банк, 5401345831, Б.Баярсайхан, 60643016  
✅ **🆕 PAYMENT CODE: PZ-A1B2C3** (том, тод, өнгөлөг)  
✅ Бүх мэдээллийг хуулах товч ("📋 Хуулах")  
✅ Code-ийг автоматаар авах (loading state)  
✅ Дэлгэрэнгүй заавар (code оруулах анхааруулгатай)  

### UI Example:

```
┌─────────────────────────────────────┐
│  💳 Төлбөр төлөх                    │
│  Бизнес Стандарт План                │
├─────────────────────────────────────┤
│  Шилжүүлэх дүн: 19,900₮             │
├─────────────────────────────────────┤
│  🏦 Дансны мэдээлэл                 │
│  Банк: Хаан банк [📋 Хуулах]        │
│  Дугаар: 5401345831 [📋 Хуулах]     │
│  Нэр: Б.Баярсайхан [📋 Хуулах]      │
│  Утас: 60643016 [📋 Хуулах]         │
│                                      │
│  🔑 Гүйлгээний утга (CODE)          │
│  ┌──────────────────────────────┐   │
│  │    PZ-A1B2C3  [📋 Хуулах]   │   │
│  └──────────────────────────────┘   │
├─────────────────────────────────────┤
│  📌 Заавар:                          │
│  1. Дансанд шилжүүлэг хийх          │
│  2. ⚠️ ГҮЙЛГЭЭНИЙ УТГА дээр          │
│     PZ-A1B2C3 кодыг бичнэ үү!      │
│  3. SMS ирнэ                        │
│  4. Автомат баталгаажна ✅          │
│                                      │
│  💡 Кодыг заавал оруулна уу!        │
├─────────────────────────────────────┤
│         ✅ Ойлголоо                 │
└─────────────────────────────────────┘
```

---

## 🔒 Security

✅ **API Key:** Webhook SMS_WEBHOOK_SECRET шалгах  
✅ **Rate Limiting:** 10 SMS/minute  
✅ **Duplicate Prevention:** Transaction ID unique index  
✅ **Code Expiry:** 24 цагийн дараа автомат expire  
✅ **Amount Validation:** Зөвхөн 1990/19900/39900₮  
✅ **Code Format:** PZ-[6 char alphanumeric]  
✅ **Used Code Check:** Нэг удаа л ашиглаж болно  

---

## 📊 Database Schema Summary

### PaymentCode
```javascript
{
  _id: ObjectId,
  code: "PZ-A1B2C3",          // unique index
  userId: ObjectId,            // indexed
  planId: "business_standard",
  amount: 19900,
  status: "pending",           // indexed
  expiresAt: Date,             // TTL + indexed
  usedAt: Date,
  createdAt: Date              // indexed
}
```

### SmsLog
```javascript
{
  _id: ObjectId,
  from: "1800",
  message: "KHANBANK: 19,900₮...",
  amount: 19900,
  transactionId: "TXN123",     // unique index
  userId: ObjectId,
  planId: "business_standard",
  processed: true,
  createdAt: Date              // TTL: 90 days
}
```

---

## 🚀 Deployment Checklist

- [ ] `.env` файл тохируулах:
  ```env
  SMS_WEBHOOK_SECRET=random-secret-key-12345
  MONGO_URI=mongodb://localhost:27017/playzone
  JWT_SECRET=your-jwt-secret
  ```
- [ ] Server restart хийх
- [ ] Logo файл (`public/playzone-logo.svg`) байгаа эсэхийг шалгах
- [ ] SMS Forwarder app суулгах (Android утас)
- [ ] Webhook URL тохируулах (production эсвэл ngrok)
- [ ] Test payment хийж, SMS ирэхийг шалгах
- [ ] Database indexes үүссэн эсэхийг шалгах
- [ ] Frontend дээр code харагдаж байгаа эсэхийг шалгах

---

## ✅ Давуу Тал

1. **Unique Code:** Хэрэглэгч бүр өөрийн гэсэн кодтой, давхцаж тохиолдохгүй
2. **24h Expiry:** Код хуучирдаг, аюулгүй байдал сайжирна
3. **Автомат:** SMS ирэхэд шууд баталгаажна, manual шалгах шаардлаггүй
4. **Fallback:** Код ашиглаагүй бол PendingPayment (хуучин систем) ажиллана
5. **Logging:** Бүх SMS хадгалагдана, audit trail бүрэн
6. **User-Friendly:** Code хуулах товчтой, алдаа гаргахгүй

---

## 🎉 Амжилт хүсье!

Танай PlayZone MN систем одоо **code-based payment system**-тэй боллоо! 🚀

**Асуулт байвал:** Та миний утсанд (60643016) холбогдоорой эсвэл email-ээр (admin@playzonemn.com) илгээгээрэй.
