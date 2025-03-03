require("dotenv").config(); // Load environment variables

const express = require("express");
const cors = require("cors"); // Tambahkan CORS
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const authRoutes = require("./routes/auth");

const app = express();

// Middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Konfigurasi CORS
const corsOptions = {
  origin: process.env.CLIENT_URL || "*", // Bisa disesuaikan dengan domain frontend
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Mengizinkan pengiriman cookie dengan request
};
app.use(cors(corsOptions));

// Routes dengan prefix "/api" untuk konsistensi
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRouter);
app.use("/", indexRouter);

// Middleware untuk menangani route yang tidak ditemukan
app.use((req, res, next) => {
  res.status(404).json({ error: "Route tidak ditemukan" });
});

// Middleware error handler untuk menangani semua error
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Terjadi kesalahan pada server" });
});

module.exports = app;
