import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { assetsRouter } from "./routes/assets.js";
import { approvalsRouter } from "./routes/approvals.js";
import { anomaliesRouter } from "./routes/anomalies.js";
import { aiRouter } from "./routes/ai.js";
import { stockRouter } from "./routes/stock.js";
import { distributionsRouter } from "./routes/distributions.js";
import { auditRouter } from "./routes/audit.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/assets", assetsRouter);
app.use("/api/approvals", approvalsRouter);
app.use("/api/anomalies", anomaliesRouter);
app.use("/api/ai", aiRouter);
app.use("/api/stock", stockRouter);
app.use("/api/distributions", distributionsRouter);
app.use("/api/audit", auditRouter);

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
