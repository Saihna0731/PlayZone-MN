# SMS API Setup Guide

## 📱 SMS API Сонголтууд

### Option 1: Twilio (Олон улсын, найдвартай)

**Давуу тал:**
- ✅ Дэлхийн хамгийн том SMS provider
- ✅ Монгол руу SMS илгээх боломжтой
- ✅ Баталгаат API, сайн документация
- ✅ Үнэгүй trial ($15 credit)

**Зөрүү тал:**
- ❌ Үнэтэй (SMS 1 бүр ~$0.05-0.10)
- ❌ Олон улсын дугаар шаардлагатай

**Setup:**

1. **Account үүсгэх:** https://www.twilio.com/try-twilio
2. **Phone Number авах:** Console → Phone Numbers → Buy a number
3. **API Credentials авах:** Console → Account → API keys

```bash
# Twilio суулгах
cd server
npm install twilio
```

```javascript
// server/services/smsService.js
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSMS = async (phone, message) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: `+976${phone}` // Монголын код +976
    });
    
    console.log('📱 SMS sent:', result.sid);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('❌ SMS error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendSMS };
```

**Environment Variables:**
```env
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE=+1234567890
```

---

### Option 2: Vonage (Nexmo)

**Давуу тал:**
- ✅ Олон улсын SMS
- ✅ Монгол дэмжинэ
- ✅ SMS дээр хямд ($0.02-0.05)

**Setup:**

```bash
npm install @vonage/server-sdk
```

```javascript
// server/services/smsService.js
const { Vonage } = require('@vonage/server-sdk');

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET
});

const sendSMS = async (phone, message) => {
  try {
    await vonage.sms.send({
      to: `976${phone}`,
      from: 'PlayZone',
      text: message
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { sendSMS };
```

---

### Option 3: MessageBird

**Давуу тал:**
- ✅ Европын provider
- ✅ Сайн API
- ✅ Монгол дэмжинэ

**Setup:**

```bash
npm install messagebird
```

```javascript
const messagebird = require('messagebird')(process.env.MESSAGEBIRD_API_KEY);

const sendSMS = async (phone, message) => {
  try {
    await messagebird.messages.create({
      originator: 'PlayZone',
      recipients: [`+976${phone}`],
      body: message
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

---

### Option 4: Монголын SMS Gateway (Зөвлөмж! 🇲🇳)

**Давуу тал:**
- ✅ Монголд зориулагдсан
- ✅ Дотоодын дугаартай илгээнэ
- ✅ Хямд үнэтэй
- ✅ Хурдан

**Providers:**
1. **Mobicom SMS Gateway** - http://sms.mobicom.mn
2. **Unitel SMS Gateway** - Unitel-тэй холбогдох
3. **Skytel SMS Gateway** - Skytel-тэй холбогдох
4. **G-Mobile SMS** - G-Mobile-тай холбогдох

**Ерөнхий setup (Provider-аас хамаарна):**

```javascript
// server/services/smsService.js
const axios = require('axios');

const sendSMS = async (phone, message) => {
  try {
    // Provider-аас өгсөн API endpoint
    const response = await axios.post('https://api.provider.mn/send-sms', {
      username: process.env.SMS_USERNAME,
      password: process.env.SMS_PASSWORD,
      phone: phone,
      message: message
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('📱 SMS sent:', response.data);
    return { success: true };
  } catch (error) {
    console.error('❌ SMS error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendSMS };
```

---

## 🔧 Backend Integration

### 1. SMS Service файл үүсгэх

Дээрх кодуудын аль нэгийг ашиглан `server/services/smsService.js` үүсгэнэ.

### 2. passwordReset.js-д холбох

```javascript
// server/routes/passwordReset.js
const { sendSMS } = require('../services/smsService');

// SMS илгээх хэсэгт:
if (isPhone) {
  const smsResult = await sendSMS(emailOrPhone, 
    `PlayZone MN: Таны нууц үг сэргээх код: ${code}. 10 минутын дотор ашиглана уу.`
  );

  if (!smsResult.success) {
    console.error('❌ SMS send failed:', smsResult.error);
    return res.status(500).json({ 
      message: 'SMS илгээхэд алдаа гарлаа. Дахин оролдоно уу.' 
    });
  }

  console.log('📱 SMS sent successfully');
  // ... response
}
```

---

## 💰 Үнийн харьцуулалт

| Provider | SMS үнэ | Trial | Монгол дэмжлэг |
|----------|---------|-------|----------------|
| Twilio | $0.05-0.10 | $15 | ✅ |
| Vonage | $0.02-0.05 | $2 | ✅ |
| MessageBird | $0.03-0.06 | €10 | ✅ |
| Mobicom/Unitel | ₮20-50 | ❌ | ✅ Сайн |

---

## 🎯 Зөвлөмж

### Development (Одоо):
- ✅ Console.log ашиглах (одоогийн систем)
- ✅ SMS Forwarder ашиглах (банкны SMS-д)

### Production (Ирээдүйд):
1. **Эхлээд:** Email ашиглах (аль хэдийн ажиллаж байна!)
2. **Хэрэв SMS шаардлагатай бол:**
   - 🇲🇳 Монголын provider холбогдох (Mobicom, Unitel)
   - 🌍 Эсвэл Twilio trial ашиглах

---

## 🧪 Test

### Twilio Test:

```bash
curl -X POST https://api.twilio.com/2010-04-01/Accounts/YOUR_SID/Messages.json \
  -u YOUR_SID:YOUR_AUTH_TOKEN \
  -d "Body=Test SMS" \
  -d "From=+1234567890" \
  -d "To=+97699123456"
```

### Local Test (Backend):

```bash
# Terminal 1: Server ажиллуулах
cd server
npm start

# Terminal 2: Test хийх
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"99123456"}'
```

---

## 📋 Checklist

- [ ] SMS provider сонгох
- [ ] Account үүсгэх, API key авах
- [ ] `npm install` хийх (twilio/vonage/messagebird)
- [ ] `server/services/smsService.js` үүсгэх
- [ ] Environment variables нэмэх
- [ ] `passwordReset.js`-д холбох
- [ ] Test хийх
- [ ] Railway дээр deploy хийх

---

## ⚠️ Анхаар

- **API keys-ийг Git-д оруулахгүй!** `.env` файлд хадгална
- **Rate limiting** нэмэх (SMS spam-аас хамгаалах)
- **Phone format** зөв шалгах (8 орон, +976)
- **Error handling** сайн хийх
- **SMS cost** хянах (production-д)

---

## 🎉 Одоогийн байдал

✅ **Email код** - Ажиллаж байна (Gmail)  
⏳ **SMS код** - Console.log (development)  
📱 **SMS Forwarder** - Банкны төлбөрт ашиглаж байна  

**Зөвлөмж:** Email код одоохондоо хангалттай! SMS нэмэх хэрэгтэй болвол Монголын provider-тай холбогдоорой! 🚀
