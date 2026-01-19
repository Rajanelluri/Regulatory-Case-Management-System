const router = require("express").Router();
const { getPool } = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query("SELECT TOP 3 UserId, Email, Role FROM dbo.Users ORDER BY UserId");
    res.json({ ok: true, rows: r.recordset });
  } catch (err) {
    console.error("DBTEST_ERROR:", err);
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

module.exports = router;
