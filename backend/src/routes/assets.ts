import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { assets, users, auditLogs } from "../db/schema.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";

export const assetsRouter = Router();

assetsRouter.get("/", requireAuth, async (_req, res) => {
  const rows = await db
    .select({
      id: assets.id,
      name: assets.name,
      category: assets.category,
      serialNumber: assets.serialNumber,
      status: assets.status,
      createdAt: assets.createdAt,
      assignedToName: users.name,
    })
    .from(assets)
    .leftJoin(users, eq(assets.assignedToId, users.id));

  res.json(rows);
});

const createAssetSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  serialNumber: z.string().min(1),
  status: z.enum(["IN_USE", "AVAILABLE", "MAINTENANCE", "RETIRED"]).optional(),
});

assetsRouter.post("/", requireAuth, requireRole("ADMIN", "MANAGER"), async (req: AuthedRequest, res) => {
  const parsed = createAssetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const [asset] = await db.insert(assets).values(parsed.data).returning();

  await db.insert(auditLogs).values({
    actorId: req.user!.id,
    action: "ASSET_CREATED",
    details: `Created asset ${asset.name}`,
  });

  res.status(201).json(asset);
});
