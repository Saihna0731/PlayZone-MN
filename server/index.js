const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '.env') });

const app = express();

// CORS configuration
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: '50mb' })); // зургийн upload-д зориулж limit нэмэгдүүллээ
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const centersRouter = require("./routes/centers");
const authRouter = require("./routes/auth");

app.use("/api/centers", centersRouter);
app.use("/api/auth", authRouter);

const PORT = process.env.PORT || 8000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error("MongoDB connection error:", err));