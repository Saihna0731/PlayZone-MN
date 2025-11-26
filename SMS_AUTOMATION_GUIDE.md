# SMS Автоматжуулалтын Зааварчилгаа - PlayZone MN

## Тойм

Хэрэглэгчид банкны шилжүүлэг хийсний дараа SMS баталгаажуулалт ирнэ. SMS-ийг автоматаар уншиж, мэдээллийг системд илгээхэд 3 арга байна:

1. **Android App (Зөвлөмж)** - Хамгийн найдвартай
2. **Tasker + AutoNotification** - Android дээр
3. **iOS Shortcuts** - iPhone дээр (хязгаарлагдмал)

---

## Арга 1: Android App - SMS Forwarder (Зөвлөмж)

### Шаардлагатай зүйлүүд:
- Android утас (5.0+)
- SMS уншиж, илгээх эрх

### Алхам 1: SMS Forwarder татаж авах

```
Google Play Store → "SMS Forwarder" хайх
Эсвэл: https://github.com/pppscn/SmsForwarder
```

### Алхам 2: Тохиргоо

1. **App нээх** → "Эрх олгох" дарж бүх эрх олгох
2. **Sender дүрэм үүсгэх**:
   - Rule name: "Bank SMS to PlayZone"
   - Sender filter: Банкны SMS дугаар (жишээ: "1800", "KHANBANK")
   - Content filter: "Орлого" эсвэл "Гүйлгээ" гэсэн үг агуулсан
   
3. **Forward тохиргоо**:
   - Forward Type: **HTTP/HTTPS**
   - URL: `https://your-server.com/api/payment/webhook-sms`
   - Method: **POST**
   - Headers:
     ```json
     {
       "Content-Type": "application/json",
       "X-API-Key": "your-secret-key-here"
     }
     ```
   - Body template:
     ```json
     {
       "from": "{{from}}",
       "message": "{{message}}",
       "timestamp": "{{timestamp}}",
       "phone": "80119900"
     }
     ```

4. **Test хийх** → Test SMS илгээж шалгах

### Backend Webhook Handler

Та энэ endpoint-ийг server дээр үүсгэх хэрэгтэй:

```javascript
// server/routes/payment.js нэмэх

router.post('/webhook-sms', async (req, res) => {
  try {
    // Security: API key шалгах
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.SMS_WEBHOOK_SECRET) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { from, message, timestamp, phone } = req.body;
    
    // SMS parse хийх (банкны format-аас хамаарна)
    // Жишээ SMS: "KHANBANK: 19,900₮ орлого. Гүйлгээ: ABC123456. Үлдэгдэл: 150,000₮"
    
    const amountMatch = message.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*₮/);
    const transactionMatch = message.match(/Гүйлгээ:\s*([A-Z0-9]+)/i);
    
    if (!amountMatch || !transactionMatch) {
      console.log('SMS format таарахгүй байна:', message);
      return res.status(400).json({ message: 'Invalid SMS format' });
    }

    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    const transactionId = transactionMatch[1];

    // План тодорхойлох (дүнгээс)
    let planId = null;
    if (amount === 1990) planId = 'normal';
    else if (amount === 19900) planId = 'business_standard';
    else if (amount === 39900) planId = 'business_pro';
    else {
      console.log('Тодорхойгүй төлбөрийн дүн:', amount);
      return res.status(400).json({ message: 'Unknown amount' });
    }

    // Pending payment олох (хэрэглэгч SMS хүлээж байгаа)
    // Та өмнө нь PendingPayment collection-д бичлэг үүсгэсэн байх ёстой
    const pendingPayment = await PendingPayment.findOne({
      amount: amount,
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // 30 минутын дотор
    }).sort({ createdAt: -1 });

    if (!pendingPayment) {
      console.log('Pending payment олдсонгүй:', { amount, transactionId });
      // SMS log-д хадгалах (хожим manual шалгахад)
      await SmsLog.create({ from, message, amount, transactionId, timestamp });
      return res.json({ message: 'Payment logged, no pending order found' });
    }

    // Subscription идэвхжүүлэх
    const user = await User.findById(pendingPayment.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    const planConfig = {
      normal: { maxCenters: 0, maxImages: 3, canUploadVideo: false },
      business_standard: { maxCenters: 1, maxImages: 3, canUploadVideo: false },
      business_pro: { maxCenters: 2, maxImages: -1, canUploadVideo: true }
    };

    user.subscription = {
      plan: planId,
      isActive: true,
      startDate: now,
      endDate: endDate,
      paymentMethod: 'bank_transfer',
      ...planConfig[planId]
    };

    if (user.trial && user.trial.isActive) {
      user.trial.isActive = false;
    }

    await user.save();

    // Pending payment баталгаажуулах
    pendingPayment.status = 'completed';
    pendingPayment.transactionId = transactionId;
    pendingPayment.completedAt = now;
    await pendingPayment.save();

    // SMS log хадгалах
    await SmsLog.create({ 
      from, message, amount, transactionId, timestamp,
      userId: user._id,
      planId: planId,
      processed: true
    });

    console.log('✅ Subscription автоматаар идэвхжлээ:', {
      userId: user._id,
      planId: planId,
      transactionId: transactionId
    });

    res.json({ 
      success: true, 
      message: 'Subscription activated',
      userId: user._id
    });

  } catch (error) {
    console.error('SMS webhook error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
```

---

## Арга 2: Tasker + AutoNotification (Android)

### Шаардлагатай:
- Tasker app (Төлбөртэй - $3.49)
- AutoNotification plugin (Төлбөртэй - $2.99)

### Тохиргоо:

1. **Tasker Profile үүсгэх**:
   ```
   Event → Plugin → AutoNotification → Intercept
   → App: Messages/SMS app
   → Text: "Гүйлгээ" эсвэл "орлого"
   ```

2. **Task үүсгэх**:
   ```javascript
   A1: Variable Set
       %SmsFrom to %anapp
       %SmsText to %antitle %antext
       
   A2: HTTP Request
       Method: POST
       URL: https://your-server.com/api/payment/webhook-sms
       Headers: Content-Type: application/json
                X-API-Key: your-secret-key
       Body: {"from":"%SmsFrom","message":"%SmsText","timestamp":"%TIMES"}
   
   A3: Flash (Optional)
       Text: SMS илгээгдлээ!
   ```

---

## Арга 3: iOS Shortcuts (iPhone - Хязгаарлагдмал)

**⚠️ Анхаар**: iOS дээр SMS автоматаар уншиж чадахгүй (security restrictions). Зөвхөн manual shortcut-аар хийж болно.

### Тохиргоо:

1. **Shortcuts app нээх**
2. **Automation үүсгэх**:
   - When: "Message received from [Bank Number]"
   - Do: Run Shortcut

3. **Shortcut бүтэц**:
   ```
   Get Variable: Shortcut Input
   → Get text from Input
   → Set Variable "SMS Text"
   
   → Get Contents of URL
      URL: https://your-server.com/api/payment/webhook-sms
      Method: POST
      Headers: {"X-API-Key": "your-key"}
      Request Body: JSON
      {
        "from": "Bank",
        "message": [SMS Text],
        "timestamp": [Current Date],
        "phone": "80119900"
      }
   
   → Show Notification "SMS илгээгдлээ"
   ```

**Сул тал**: Хэрэглэгч notification дээр manually дарах шаардлагатай.

---

## PendingPayment Model (Зөвлөмж)

SMS-ийг хэрэглэгчтэй холбохын тулд pending payment system үүсгэх:

```javascript
// server/models/PendingPayment.js
const mongoose = require('mongoose');

const pendingPaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: String,
    enum: ['normal', 'business_standard', 'business_pro'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'expired', 'cancelled'],
    default: 'pending'
  },
  transactionId: String,
  completedAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000) // 30 min
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for automatic expiry
pendingPaymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingPayment', pendingPaymentSchema);
```

### Frontend: Pending Payment үүсгэх

```javascript
// Хэрэглэгч "Ойлголоо" товч дарахад
const createPendingPayment = async (planId, amount) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_BASE}/api/payment/create-pending`,
    { planId, amount },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
```

### Backend: Pending Payment endpoint

```javascript
// server/routes/payment.js
router.post('/create-pending', auth, async (req, res) => {
  try {
    const { planId, amount } = req.body;
    
    const pendingPayment = await PendingPayment.create({
      userId: req.userId,
      planId: planId,
      amount: amount,
      status: 'pending'
    });

    res.json({
      success: true,
      paymentId: pendingPayment._id,
      expiresAt: pendingPayment.expiresAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating pending payment' });
  }
});
```

---

## SMS Format Examples

Банкнуудын SMS format өөр өөр байдаг:

### Хаан банк:
```
KHANBANK: 19,900₮ орлого. 
Гүйлгээ: ABC123456
Үлдэгдэл: 150,000₮
Огноо: 2025-01-15 14:30
```

### TDB:
```
TDB: Таны 5073***107 дансанд
19,900.00 MNT орлого.
Гүйлгээ #DEF789012
Үлдэгдэл: 150,000.00 MNT
```

### Regex Pattern (Universal):

```javascript
// Дүн олох
const amountPattern = /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:₮|MNT)/i;

// Гүйлгээний дугаар олох
const transactionPattern = /(?:Гүйлгээ|Transaction|Ref):\s*[#]?([A-Z0-9]+)/i;

// Огноо олох (optional)
const datePattern = /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/;
```

---

## Security Measures

### 1. API Key баталгаажуулалт
```javascript
// .env файл дээр
SMS_WEBHOOK_SECRET=your-random-secret-key-123456789

// Middleware
const verifySmsWebhook = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.SMS_WEBHOOK_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};
```

### 2. Rate Limiting
```javascript
const smsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // max 10 SMS per minute
  message: 'Too many SMS requests'
});

app.use('/api/payment/webhook-sms', smsLimiter);
```

### 3. Duplicate Prevention
```javascript
// Давхар гүйлгээ хориглох
const existingLog = await SmsLog.findOne({ transactionId });
if (existingLog) {
  return res.status(400).json({ message: 'Transaction already processed' });
}
```

### 4. Amount Validation
```javascript
// Зөвхөн зөвшөөрөгдсөн дүн
const validAmounts = [1990, 19900, 39900];
if (!validAmounts.includes(amount)) {
  return res.status(400).json({ message: 'Invalid amount' });
}
```

---

## Testing

### Local Testing (ngrok ашиглах):

1. **ngrok татах**: https://ngrok.com/download

2. **Server эхлүүлэх**:
```bash
cd server
npm start
```

3. **ngrok эхлүүлэх**:
```bash
ngrok http 5000
```

4. **Public URL авах**:
```
Forwarding: https://abc123.ngrok.io -> localhost:5000
```

5. **SMS Forwarder дээр URL шинэчлэх**:
```
https://abc123.ngrok.io/api/payment/webhook-sms
```

### Test SMS илгээх:

```bash
curl -X POST https://abc123.ngrok.io/api/payment/webhook-sms \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-key" \
  -d '{
    "from": "1800",
    "message": "KHANBANK: 19,900₮ орлого. Гүйлгээ: TEST123456. Үлдэгдэл: 150,000₮",
    "timestamp": "2025-01-15T14:30:00Z",
    "phone": "80119900"
  }'
```

---

## Санамж

- ✅ SMS Forwarder (Android) - **Хамгийн сайн**
- ✅ Tasker - **Илүү олон тохиргоо**
- ⚠️ iOS - **Хязгаарлагдмал, manual шаардлагатай**

Автоматжуулалт амжилттай ажиллахын тулд:
1. Утас үргэлж интернеттэй байх
2. SMS app background ажиллах эрхтэй
3. Battery optimization идэвхгүй болгох
4. Webhook URL олон нийтэд нээлттэй (https)

Асуулт байвал илгээнэ үү! 🚀
