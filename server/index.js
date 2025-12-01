const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '.env') });

const app = express();

// Trust proxy for Railway/Vercel deployment
app.set('trust proxy', 1);

// Security: basic hardening
app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS: restrict if env provided
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
// Default allowed origins for development and production
const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3012',
  'https://playzone-mn.vercel.app',
  'https://playzonemn.vercel.app'
];
const ALL_ORIGINS = [...new Set([...ALLOWED_ORIGINS, ...DEFAULT_ORIGINS])];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return cb(null, true);
    if (ALL_ORIGINS.includes(origin)) return cb(null, true);
    console.log('CORS blocked origin:', origin);
    return cb(null, true); // Allow all for now, log blocked
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Requested-With","X-API-Key"]
}));

// Body parsing + sanitization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// express-mongo-sanitize tries to reassign req.query (getter in Express 5) → sanitize body/params only
app.use((req, res, next) => {
  try {
    if (req.body) req.body = mongoSanitize.sanitize(req.body);
    if (req.params) req.params = mongoSanitize.sanitize(req.params);
    // Skip req.query assignment to avoid TypeError on getter-only property
  } catch (e) {
    // continue without blocking
  }
  next();
});

// Compression for faster responses on slow networks
app.use(compression());

// Basic rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

const centersRouter = require("./routes/centers");
app.use("/api/centers", centersRouter);

// Mount auth routes
const authRouter = require("./routes/auth");
app.use("/api/auth", authRouter);

// Mount subscription routes
const subscriptionRouter = require("./routes/subscription");
app.use("/api/subscription", subscriptionRouter);

// Mount booking routes
const bookingsRouter = require("./routes/bookings");
app.use("/api/bookings", bookingsRouter);

// Mount payment routes (SMS verification)
const paymentRouter = require("./routes/payment");
app.use("/api/payment", paymentRouter);

// Mount password reset routes
const passwordResetRouter = require("./routes/passwordReset");
app.use("/api/auth", passwordResetRouter);

// Mount QPay routes
const qpayRouter = require("./routes/qpay");
app.use("/api/qpay", qpayRouter);

// Simple root and health endpoints to verify backend from phone/browser
app.get('/', (req, res) => {
  res.send(
    'my-map-app API is running. Try /health or /api/centers'
  );
});

app.get('/health', (req, res) => {
  res.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=30');
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    time: new Date().toISOString()
  });
});

// Import cleanup job
const { startCleanupJob } = require('./jobs/cleanupBookings');

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/my-map-app';
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 })
  .then(() => {
    console.log("MongoDB connected");
    
    // Start automatic cleanup job for old bookings
    startCleanupJob();
    
    // Explicitly bind to 0.0.0.0 so it's reachable from other devices on the LAN
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
  })
  .catch(err => console.error("MongoDB connection error:", err));