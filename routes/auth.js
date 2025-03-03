const express = require("express");
const prisma = require("../prisma/db");
const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../utils/auth");
const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: "Email sudah digunakan" });

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Buat user baru
    const user = await prisma.user.create({
      data: { fullName, email, password: hashedPassword, role },
    });

    res.status(201).json({ message: "Registrasi berhasil", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cek apakah user ada
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(400).json({ error: "Email atau password salah" });

    // Validasi password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Email atau password salah" });

    // Generate token
    const token = generateToken(user);

    // Simpan token di database
    await prisma.user.update({
      where: { email },
      data: { token },
    });

    res.json({ message: "Login berhasil", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout
router.post("/logout", authenticate, async (req, res) => {
  try {
    const userId = req.user.id; // Dapatkan user dari middleware autentikasi

    // Hapus token dari database
    await prisma.user.update({
      where: { id: userId },
      data: { token: null },
    });

    res.json({ message: "Logout berhasil" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/profile", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ message: "Profil ditemukan", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
