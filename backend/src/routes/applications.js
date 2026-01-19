const router = require("express").Router();
const { auth, requireRole } = require("../middleware/auth");
const {
  getMyApplications,
  getAllApplications,
  createApplication,
  approveApplication,
  rejectApplication
} = require("../db/queries");

router.get("/me", auth, requireRole("APPLICANT"), async (req, res) => {
  const apps = await getMyApplications(req.user.userId);
  res.json(apps);
});

router.post("/", auth, requireRole("APPLICANT"), async (req, res) => {
  const { type, payload } = req.body || {};
  if (!type) return res.status(400).json({ message: "type required" });

  const created = await createApplication(req.user.userId, type, payload || {});
  res.status(201).json(created);
});

router.get("/", auth, requireRole("OFFICER"), async (req, res) => {
  const apps = await getAllApplications();
  res.json(apps);
});

router.put("/:id/approve", auth, requireRole("OFFICER"), async (req, res) => {
  await approveApplication(req.user.userId, parseInt(req.params.id, 10));
  res.json({ ok: true });
});

router.put("/:id/reject", auth, requireRole("OFFICER"), async (req, res) => {
  const { reason } = req.body || {};
  await rejectApplication(req.user.userId, parseInt(req.params.id, 10), reason);
  res.json({ ok: true });
});

module.exports = router;
