import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { anomalies, assets, auditLogs } from "../db/schema.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";

export const anomaliesRouter = Router();

anomaliesRouter.get("/", requireAuth, async (_req, res) => {
  const rows = await db
    .select({
      id: anomalies.id,
      description: anomalies.description,
      severity: anomalies.severity,
      status: anomalies.status,
      createdAt: anomalies.createdAt,
      assetName: assets.name,
      assetSerial: assets.serialNumber,
    })
    .from(anomalies)
    .leftJoin(assets, eq(anomalies.assetId, assets.id));

  res.json(rows);
});

anomaliesRouter.post(
  "/:id/resolve",
  requireAuth,
  requireRole("L2_SUPPORT", "ADMIN", "MANAGER"),
  async (req: AuthedRequest, res) => {
    const [anomaly] = await db
      .update(anomalies)
      .set({ status: "RESOLVED" })
      .where(eq(anomalies.id, req.params.id))
      .returning();

    if (!anomaly) return res.status(404).json({ error: "Anomaly not found" });

    await db.insert(auditLogs).values({
      actorId: req.user!.id,
      action: "ANOMALY_RESOLVED",
      details: `Resolved anomaly ${anomaly.id}`,
    });

    res.json(anomaly);
  }
);
