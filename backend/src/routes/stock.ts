import { Router } from "express";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import { stockItems, distributions, auditLogs } from "../db/schema.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";

export const stockRouter = Router();

// Stock Master: the current catalog of stock items and quantities.
stockRouter.get("/", requireAuth, async (_req, res) => {
  const rows = await db.select().from(stockItems).orderBy(desc(stockItems.quantity));
  res.json(rows);
});

const createStockSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().int().min(0).default(0),
});

stockRouter.post("/", requireAuth, requireRole("ADMIN", "MANAGER"), async (req: AuthedRequest, res) => {
  const parsed = createStockSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const [item] = await db.insert(stockItems).values(parsed.data).returning();
  await db.insert(auditLogs).values({
    actorId: req.user!.id,
    action: "STOCK_ITEM_CREATED",
    details: `Created stock item ${item.name} (qty ${item.quantity})`,
  });
  res.status(201).json(item);
});

// Stock Ledger: the transaction history (every distribution) for a given
// stock item - this is the "ledger" view, distinct from the current-state
// "master" view above.
stockRouter.get("/:id/ledger", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(distributions)
    .where(eq(distributions.stockItemId, req.params.id))
    .orderBy(desc(distributions.createdAt));
  res.json(rows);
});
