const jwt = require("jsonwebtoken");
const prisma = require("../prisma/db");

const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Akses ditolak" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id, token },
    });

    if (!user) return res.status(401).json({ error: "Token tidak valid" });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token tidak valid" });
  }
};

module.exports = authenticate;
