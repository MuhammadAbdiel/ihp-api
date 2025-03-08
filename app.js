require("dotenv").config(); // Load environment variables

const express = require("express");
const cors = require("cors"); // Tambahkan CORS
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const authRoutes = require("./routes/auth");
const kafasRoutes = require("./routes/kafas");
const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

// Middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Konfigurasi CORS
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173", // Sesuaikan dengan URL frontend
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};

app.use(cors(corsOptions));

// Tangani preflight request
app.options("*", cors(corsOptions));

// Routes dengan prefix "/api" untuk konsistensi
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRouter);
app.use("/api/kafas", kafasRoutes);
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
