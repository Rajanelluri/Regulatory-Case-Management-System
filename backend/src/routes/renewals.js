const router = require("express").Router();
const { auth, requireRole } = require("../middleware/auth");
const { submitRenewal } = require("../db/queries");

router.post("/", auth, requireRole("APPLICANT"), async (req, res) => {
  const { payload } = req.body || {};
  const result = await submitRenewal(req.user.userId, payload || {});
  res.status(201).json(result);
});

module.exports = router;
