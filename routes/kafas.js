const express = require("express");
const prisma = require("../prisma/db");
const { authenticate, adminMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", adminMiddleware, async (req, res) => {
  try {
    const { code, quota } = req.body;

    const kafas = await prisma.kafas.create({
      data: { code, quota },
    });

    res.status(201).json(kafas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/assign", adminMiddleware, async (req, res) => {
  try {
    const { userId, kafasId } = req.body;

    // Cek apakah Kafas tersedia
    const kafas = await prisma.kafas.findUnique({
      where: { id: kafasId },
      include: { KafasUsage: true },
    });

    if (!kafas) return res.status(404).json({ error: "Kafas tidak ditemukan" });

    // Hitung jumlah penggunaan kafas saat ini
    const usedQuota = kafas.KafasUsage.length;
    if (usedQuota >= kafas.quota)
      return res.status(400).json({ error: "Kuota Kafas sudah habis" });

    // Cek apakah user sudah memiliki Kafas
    const existingUsage = await prisma.kafasUsage.findFirst({
      where: { userId },
    });

    if (existingUsage)
      return res
        .status(400)
        .json({ error: "User sudah memiliki Kafas yang aktif" });

    // Assign Kafas ke user dan catat penggunaan
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { kafasId },
      }),
      prisma.kafasUsage.create({
        data: {
          kafasId,
          userId,
        },
      }),
    ]);

    res.json({ message: "Kafas berhasil diberikan kepada user" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", authenticate, async (req, res) => {
  try {
    const kafasList = await prisma.kafas.findMany({
      include: { KafasUsage: true },
    });

    const result = kafasList.map((kafas) => ({
      id: kafas.id,
      code: kafas.code,
      quota: kafas.quota,
      used: kafas.KafasUsage.length,
      remaining: kafas.quota - kafas.KafasUsage.length,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const kafas = await prisma.kafas.findUnique({
      where: { id: parseInt(id) },
      include: { KafasUsage: true, users: true },
    });

    if (!kafas) return res.status(404).json({ error: "Kafas tidak ditemukan" });

    res.json(kafas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
