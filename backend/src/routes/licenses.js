const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { getMyLicense } = require("../db/queries");

router.get("/me", auth, async (req, res) => {
  const lic = await getMyLicense(req.user.userId);
  res.json(lic);
});

module.exports = router;
