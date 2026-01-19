const router = require("express").Router();

router.get("/", (req, res) => {
  res.json({ ok: true, service: "rcms-backend" });
});

module.exports = router;
