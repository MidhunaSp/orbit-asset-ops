import { Router } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, stockItems, approvals, anomalies, assets } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();

dashboardRouter.get("/stats", requireAuth, async (_req, res) => {
  const [[{ count: userCount }], [{ count: stockCount }], [{ count: pendingApprovals }], [{ count: activeAnomalies }], statusGroups, topStock] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(stockItems),
      db.select({ count: sql<number>`count(*)` }).from(approvals).where(eq(approvals.status, "PENDING")),
      db.select({ count: sql<number>`count(*)` }).from(anomalies).where(eq(anomalies.status, "ACTIVE")),
      db
        .select({ status: assets.status, count: sql<number>`count(*)` })
        .from(assets)
        .groupBy(assets.status),
      db.select({ name: stockItems.name, value: stockItems.quantity }).from(stockItems).orderBy(desc(stockItems.quantity)).limit(8),
    ]);

  res.json({
    totalUsers: Number(userCount),
    totalStocks: Number(stockCount),
    pendingApprovals: Number(pendingApprovals),
    activeAnomalies: Number(activeAnomalies),
    distributionByStatus: statusGroups.map((s) => ({ name: s.status, value: Number(s.count) })),
    topDistributedItems: topStock,
  });
});
