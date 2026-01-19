const express = require("express");
const cors = require("cors");

const healthRoutes = require("./src/routes/health");
const authRoutes = require("./src/routes/auth");
const applicantRoutes = require("./src/routes/applicants");
const applicationRoutes = require("./src/routes/applications");
const licenseRoutes = require("./src/routes/licenses");
const renewalRoutes = require("./src/routes/renewals");
const dbtestRoutes = require("./src/routes/dbtest");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/applicants", applicantRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/licenses", licenseRoutes);
app.use("/api/renewals", renewalRoutes);
app.use("/api/dbtest", dbtestRoutes);

app.get("/", (req, res) => res.send("RCMS backend running"));

app.use((err, req, res, next) => {
  console.error("UNHANDLED_ERROR:", err);
  res.status(500).json({ message: "Internal server error", detail: String(err.message || err) });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));
