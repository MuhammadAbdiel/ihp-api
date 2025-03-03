const express = require("express");
const router = express.Router();
const prisma = require("../prisma/db");
const authenticate = require("../middleware/authMiddleware");

// Get all users
router.get("/", authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
