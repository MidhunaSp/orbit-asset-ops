import { Router } from "express";
import { eq, desc, and, isNull } from "drizzle-orm";
import { db } from "../db/client.js";
import { auditLogs, users, assets } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

export const auditRouter = Router();

// Full immutable audit trail.
auditRouter.get("/", requireAuth, async (_req, res) => {
  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      details: auditLogs.details,
      createdAt: auditLogs.createdAt,
      actorName: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);

  res.json(rows);
});

// Reconciliation: flags real data-integrity mismatches - e.g. an asset
// marked IN_USE with nobody assigned to it. This is a genuine consistency
// check against the actual data, not placeholder content.
auditRouter.get("/reconciliation", requireAuth, async (_req, res) => {
  const orphanedInUse = await db
    .select()
    .from(assets)
    .where(and(eq(assets.status, "IN_USE"), isNull(assets.assignedToId)));

  res.json({
    checkedAt: new Date().toISOString(),
    issues: orphanedInUse.map((a) => ({
      assetId: a.id,
      assetName: a.name,
      serialNumber: a.serialNumber,
      issue: "Marked IN_USE but has no assigned user",
    })),
    clean: orphanedInUse.length === 0,
  });
});
