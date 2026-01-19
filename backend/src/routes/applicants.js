const router = require("express").Router();
const { auth, requireRole } = require("../middleware/auth");
const { getApplicantByUserId } = require("../db/queries");

router.get("/me", auth, requireRole("APPLICANT"), async (req, res) => {
  const ap = await getApplicantByUserId(req.user.userId);
  res.json(ap);
});

module.exports = router;
