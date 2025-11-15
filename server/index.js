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

// Security: basic hardening
app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS: restrict if env provided
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('CORS not allowed'), false);
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Requested-With","X-API-Key"]
}));

// Body parsing + sanitization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(mongoSanitize());

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

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/my-map-app';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 15000 })
  .then(() => {
    console.log("MongoDB connected");
    // Explicitly bind to 0.0.0.0 so it's reachable from other devices on the LAN
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
  })
  .catch(err => console.error("MongoDB connection error:", err));