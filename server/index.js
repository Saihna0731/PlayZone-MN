const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' })); // High quality + thumbnail зургуудад хангалттай
app.use(express.urlencoded({ limit: '25mb', extended: true }));

const centersRouter = require("./routes/centers");
app.use("/api/centers", centersRouter);

// Mount auth routes
const authRouter = require("./routes/auth");
app.use("/api/auth", authRouter);

const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/my-map-app';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error("MongoDB connection error:", err));