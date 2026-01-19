const router = require("express").Router();
const { findUserByEmail } = require("../db/queries");

// Simple login: returns role if email exists (no password yet)
router.post("/login", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: "Email required" });

  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ message: "Invalid user" });

  res.json({ token: "TEMP_TOKEN", email: user.Email, role: user.Role });
});

module.exports = router;
