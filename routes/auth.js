const express = require("express");
const { sendVerificationEmail } = require("../utils/email");
const { v4: uuidv4 } = require("uuid");
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

    // Generate verification token
    const verificationToken = uuidv4();

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role,
        verificationToken,
      },
    });

    // Kirim email verifikasi
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ message: "Registrasi berhasil. Silakan cek email untuk verifikasi.", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Email
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    // Cari user berdasarkan token menggunakan findFirst
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Verifikasi Email</title>
            <style>
              /* General Styles */
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                  "Helvetica Neue", Arial, sans-serif;
                background: linear-gradient(to bottom right, #f9fafb, #f3f4f6);
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 3rem;
                padding: 1rem;
              }
                
              /* Card Container */
              .card {
                max-width: 28rem;
                width: 100%;
                background: white;
                border-radius: 0.5rem;
                box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
                padding: 2rem;
                text-align: center;
              }

              .card h1 {
                font-size: 2rem;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 1.5rem;
              }

              .card p {
                font-size: 1rem;
                color: #4b5563;
                margin-bottom: 2rem;
              }

              .card a {
                display: inline-block;
                width: 100%;
                background: #1f2937;
                color: white;
                font-weight: 600;
                padding: 0.75rem 0rem;
                border-radius: 0.5rem;
                text-decoration: none;
                transition: background 0.3s ease;
              }

              .card a:hover {
                background: #374151;
              }

              /* Animation */
              @keyframes fade-up {
                0% {
                  opacity: 0;
                  transform: translateY(20px);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            </style>
          </head>
          <body>
            <!-- Card -->
            <div class="card">
              <h1>Verifikasi Gagal</h1>
              <p>
                Token verifikasi tidak valid atau sudah kadaluarsa.
              <a href="${process.env.CLIENT_URL}">Kembali ke halaman utama</a>.
            </div>
          </body>
        </html>
      `);
    }

    // Update status verifikasi
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null },
    });

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Verifikasi Email</title>
          <style>
            /* General Styles */
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                "Helvetica Neue", Arial, sans-serif;
              background: linear-gradient(to bottom right, #f9fafb, #f3f4f6);
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 3rem;
              padding: 1rem;
            }

            /* Card Container */
            .card {
              max-width: 28rem;
              width: 100%;
              background: white;
              border-radius: 0.5rem;
              box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
              padding: 2rem;
              text-align: center;
            }

            .card h1 {
              font-size: 2rem;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 1.5rem;
            }

            .card p {
              font-size: 1rem;
              color: #4b5563;
              margin-bottom: 2rem;
            }

            .card a {
              display: inline-block;
              width: 100%;
              background: #1f2937;
              color: white;
              font-weight: 600;
              padding: 0.75rem 0rem;
              border-radius: 0.5rem;
              text-decoration: none;
              transition: background 0.3s ease;
            }

            .card a:hover {
              background: #374151;
            }

            /* Animation */
            @keyframes fade-up {
              0% {
                opacity: 0;
                transform: translateY(20px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }
          </style>
        </head>
        <body>
          <!-- Card -->
          <div class="card">
            <h1>Verifikasi Berhasil</h1>
            <p>
              Email Anda telah berhasil diverifikasi.
            </p>
            <a href="${process.env.CLIENT_URL}/login">login</a>.
          </div>
        </body>
      </html>
    `);
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

    // Cek apakah email sudah diverifikasi
    if (!user.isVerified) {
      return res.status(403).json({ error: "Email belum diverifikasi. Silakan cek email Anda." });
    }

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
