const { getPool, sql } = require("../config/db");
const { nextAppNumber } = require("../utils/id");

async function findUserByEmail(email) {
  const pool = await getPool();
  const r = await pool.request()
    .input("Email", sql.NVarChar(255), email)
    .query("SELECT TOP 1 * FROM dbo.Users WHERE Email=@Email AND IsActive=1");
  return r.recordset[0] || null;
}

async function getApplicantByUserId(userId) {
  const pool = await getPool();
  const r = await pool.request()
    .input("UserId", sql.Int, userId)
    .query("SELECT TOP 1 * FROM dbo.Applicants WHERE UserId=@UserId");
  return r.recordset[0] || null;
}

async function getMyApplications(userId) {
  const pool = await getPool();
  const r = await pool.request()
    .input("UserId", sql.Int, userId)
    .query(`
      SELECT a.ApplicationId AS id,
             a.ApplicationNumber AS applicationNumber,
             a.Type AS type,
             a.Status AS status,
             a.Notes AS notes,
             a.SubmittedAt AS submittedAt
      FROM dbo.Applications a
      JOIN dbo.Applicants ap ON ap.ApplicantId = a.ApplicantId
      WHERE ap.UserId = @UserId
      ORDER BY a.SubmittedAt DESC
    `);
  return r.recordset;
}

async function getAllApplications() {
  const pool = await getPool();
  const r = await pool.request()
    .query(`
      SELECT a.ApplicationId AS id,
             a.ApplicationNumber AS applicationNumber,
             a.Type AS type,
             a.Status AS status,
             a.SubmittedAt AS submittedAt,
             ap.FullName AS applicantName,
             u.Email AS email
      FROM dbo.Applications a
      JOIN dbo.Applicants ap ON ap.ApplicantId = a.ApplicantId
      JOIN dbo.Users u ON u.UserId = ap.UserId
      ORDER BY a.SubmittedAt DESC
    `);
  return r.recordset;
}

async function createApplication(userId, type, payload) {
  const pool = await getPool();

  const applicant = await getApplicantByUserId(userId);
  if (!applicant) throw new Error("Applicant profile not found.");

  // generate next APP-xxxxxx using MAX from table
  const maxRes = await pool.request().query(`
    SELECT MAX(ApplicationNumber) AS MaxNo FROM dbo.Applications
  `);
  const maxNo = maxRes.recordset[0]?.MaxNo || null;
  const appNo = nextAppNumber(maxNo);

  const payloadJson = JSON.stringify(payload || {});
  const notes = payload?.notes || null;

  const r = await pool.request()
    .input("ApplicantId", sql.Int, applicant.ApplicantId)
    .input("ApplicationNumber", sql.NVarChar(30), appNo)
    .input("Type", sql.NVarChar(30), type)
    .input("Status", sql.NVarChar(30), "SUBMITTED")
    .input("PayloadJson", sql.NVarChar(sql.MAX), payloadJson)
    .input("Notes", sql.NVarChar(500), notes)
    .query(`
      INSERT INTO dbo.Applications
        (ApplicantId, ApplicationNumber, Type, Status, PayloadJson, Notes)
      OUTPUT INSERTED.ApplicationId AS id, INSERTED.ApplicationNumber AS applicationNumber
      VALUES (@ApplicantId, @ApplicationNumber, @Type, @Status, @PayloadJson, @Notes)
    `);

  return r.recordset[0];
}

async function approveApplication(officerUserId, applicationId) {
  const pool = await getPool();

  // get application + applicant
  const appRes = await pool.request()
    .input("ApplicationId", sql.Int, applicationId)
    .query(`
      SELECT TOP 1 a.*, ap.ApplicantId, ap.FullName, u.Email
      FROM dbo.Applications a
      JOIN dbo.Applicants ap ON ap.ApplicantId = a.ApplicantId
      JOIN dbo.Users u ON u.UserId = ap.UserId
      WHERE a.ApplicationId=@ApplicationId
    `);

  const app = appRes.recordset[0];
  if (!app) throw new Error("Application not found.");
  if (app.Status === "APPROVED") return { ok: true };

  // mark approved
  await pool.request()
    .input("ApplicationId", sql.Int, applicationId)
    .input("ReviewedByUserId", sql.Int, officerUserId)
    .query(`
      UPDATE dbo.Applications
      SET Status='APPROVED',
          ReviewedAt=SYSUTCDATETIME(),
          ReviewedByUserId=@ReviewedByUserId,
          DecisionReason=NULL
      WHERE ApplicationId=@ApplicationId
    `);

  // create license if not exists
  const licRes = await pool.request()
    .input("ApplicantId", sql.Int, app.ApplicantId)
    .query(`SELECT TOP 1 * FROM dbo.Licenses WHERE ApplicantId=@ApplicantId`);

  if (!licRes.recordset[0]) {
    // generate license number
    const maxL = await pool.request().query(`SELECT MAX(LicenseNumber) AS MaxNo FROM dbo.Licenses`);
    const maxLic = maxL.recordset[0]?.MaxNo || null;
    const nextLic = nextLicNumber(maxLic);

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await pool.request()
      .input("ApplicantId", sql.Int, app.ApplicantId)
      .input("LicenseNumber", sql.NVarChar(30), nextLic)
      .input("Status", sql.NVarChar(20), "ACTIVE")
      .input("ExpiresAt", sql.DateTime2, expiresAt)
      .query(`
        INSERT INTO dbo.Licenses (ApplicantId, LicenseNumber, Status, ExpiresAt)
        VALUES (@ApplicantId, @LicenseNumber, @Status, @ExpiresAt)
      `);
  }

  await pool.request()
    .input("ActorUserId", sql.Int, officerUserId)
    .input("Action", sql.NVarChar(60), "APPLICATION_APPROVED")
    .input("Entity", sql.NVarChar(60), "Applications")
    .input("EntityId", sql.NVarChar(60), String(app.ApplicationNumber))
    .input("Detail", sql.NVarChar(500), "Approved and issued license if missing")
    .query(`
      INSERT INTO dbo.AuditLog (ActorUserId, Action, Entity, EntityId, Detail)
      VALUES (@ActorUserId, @Action, @Entity, @EntityId, @Detail)
    `);

  return { ok: true };
}

function nextLicNumber(maxNo) {
  // LIC-000001 format
  const prefix = "LIC-";
  if (!maxNo || !maxNo.startsWith(prefix)) return "LIC-000001";
  const n = parseInt(maxNo.substring(prefix.length), 10);
  const next = (Number.isFinite(n) ? n + 1 : 1);
  return prefix + String(next).padStart(6, "0");
}

async function rejectApplication(officerUserId, applicationId, reason) {
  const pool = await getPool();

  const appRes = await pool.request()
    .input("ApplicationId", sql.Int, applicationId)
    .query(`SELECT TOP 1 * FROM dbo.Applications WHERE ApplicationId=@ApplicationId`);
  const app = appRes.recordset[0];
  if (!app) throw new Error("Application not found.");

  await pool.request()
    .input("ApplicationId", sql.Int, applicationId)
    .input("ReviewedByUserId", sql.Int, officerUserId)
    .input("Reason", sql.NVarChar(300), reason || null)
    .query(`
      UPDATE dbo.Applications
      SET Status='REJECTED',
          ReviewedAt=SYSUTCDATETIME(),
          ReviewedByUserId=@ReviewedByUserId,
          DecisionReason=@Reason
      WHERE ApplicationId=@ApplicationId
    `);

  return { ok: true };
}

async function getMyLicense(userId) {
  const pool = await getPool();
  const r = await pool.request()
    .input("UserId", sql.Int, userId)
    .query(`
      SELECT TOP 1
        l.LicenseId AS id,
        l.LicenseNumber AS licenseNumber,
        l.Status AS status,
        l.IssuedAt AS issuedAt,
        l.ExpiresAt AS expiresAt,
        ap.FullName AS holderName,
        u.Email AS email
      FROM dbo.Licenses l
      JOIN dbo.Applicants ap ON ap.ApplicantId = l.ApplicantId
      JOIN dbo.Users u ON u.UserId = ap.UserId
      WHERE u.UserId=@UserId
      ORDER BY l.IssuedAt DESC
    `);
  return r.recordset[0] || null;
}

async function submitRenewal(userId, payload) {
  const pool = await getPool();

  // get license
  const lic = await getMyLicense(userId);
  if (!lic) throw new Error("No license found to renew.");

  // create an application row of type RENEWAL
  const appRec = await createApplication(userId, "RENEWAL", payload);

  // add renewal record linked to license + application
  await pool.request()
    .input("LicenseId", sql.Int, lic.id)
    .input("ApplicationId", sql.Int, appRec.id)
    .input("PayloadJson", sql.NVarChar(sql.MAX), JSON.stringify(payload || {}))
    .input("Status", sql.NVarChar(30), "SUBMITTED")
    .query(`
      INSERT INTO dbo.Renewals (LicenseId, ApplicationId, PayloadJson, Status)
      VALUES (@LicenseId, @ApplicationId, @PayloadJson, @Status)
    `);

  return { ok: true, applicationNumber: appRec.applicationNumber };
}

module.exports = {
  findUserByEmail,
  getApplicantByUserId,
  getMyApplications,
  getAllApplications,
  createApplication,
  approveApplication,
  rejectApplication,
  getMyLicense,
  submitRenewal
};
