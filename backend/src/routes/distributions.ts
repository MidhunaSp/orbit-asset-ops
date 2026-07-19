import { Router } from "express";
import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { distributions, stockItems, auditLogs } from "../db/schema.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";

export const distributionsRouter = Router();

distributionsRouter.get("/", requireAuth, async (_req, res) => {
  const rows = await db
    .select({
      id: distributions.id,
      quantity: distributions.quantity,
      distributedTo: distributions.distributedTo,
      createdAt: distributions.createdAt,
      stockItemId: distributions.stockItemId,
      stockItemName: stockItems.name,
    })
    .from(distributions)
    .leftJoin(stockItems, eq(distributions.stockItemId, stockItems.id))
    .orderBy(desc(distributions.createdAt));

  res.json(rows);
});

const createSchema = z.object({
  stockItemId: z.string().min(1),
  quantity: z.number().int().min(1),
  distributedTo: z.string().min(1),
});

distributionsRouter.post("/", requireAuth, requireRole("ADMIN", "MANAGER"), async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const [item] = await db.select().from(stockItems).where(eq(stockItems.id, parsed.data.stockItemId));
  if (!item) return res.status(404).json({ error: "Stock item not found" });
  if (item.quantity < parsed.data.quantity) {
    return res.status(409).json({ error: `Only ${item.quantity} in stock, cannot distribute ${parsed.data.quantity}` });
  }

  const [distribution] = await db.insert(distributions).values(parsed.data).returning();
  await db
    .update(stockItems)
    .set({ quantity: sql`${stockItems.quantity} - ${parsed.data.quantity}` })
    .where(eq(stockItems.id, item.id));

  await db.insert(auditLogs).values({
    actorId: req.user!.id,
    action: "STOCK_DISTRIBUTED",
    details: `Distributed ${parsed.data.quantity}x ${item.name} to ${parsed.data.distributedTo}`,
  });

  res.status(201).json(distribution);
});
