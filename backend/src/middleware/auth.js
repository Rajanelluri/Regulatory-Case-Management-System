const { findUserByEmail } = require("../db/queries");

async function auth(req, res, next) {
  const email = req.headers["x-user-email"];
  if (!email) return res.status(401).json({ message: "Missing x-user-email header" });

  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ message: "User not found or inactive" });

  req.user = { userId: user.UserId, email: user.Email, role: user.Role };
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (req.user.role !== role) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

module.exports = { auth, requireRole };
