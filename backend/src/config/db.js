const sql = require("mssql");

const config = {
  server: "Raja_chowdary",
  database: "RCMS_Nurses",
  user: "rcms_app",
  password: "Rcms@12345",
  options: { trustServerCertificate: true }
};

let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(config).catch((err) => {
      // IMPORTANT: don't crash the app; allow retries
      console.error("DB_CONNECT_ERROR:", err.message || err);
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

module.exports = { sql, getPool, config };
