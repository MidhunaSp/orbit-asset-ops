import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { approvals, users, auditLogs } from "../db/schema.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";

export const approvalsRouter = Router();

approvalsRouter.get("/", requireAuth, async (_req, res) => {
  const requesterAlias = users;
  const rows = await db
    .select({
      id: approvals.id,
      type: approvals.type,
      description: approvals.description,
      status: approvals.status,
      createdAt: approvals.createdAt,
      decidedAt: approvals.decidedAt,
      requesterName: requesterAlias.name,
      requesterId: approvals.requesterId,
    })
    .from(approvals)
    .leftJoin(requesterAlias, eq(approvals.requesterId, requesterAlias.id));

  res.json(rows);
});

const createSchema = z.object({ type: z.string().min(1), description: z.string().min(1) });

approvalsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const [approval] = await db
    .insert(approvals)
    .values({ ...parsed.data, requesterId: req.user!.id })
    .returning();

  res.status(201).json(approval);
});

// Maker-checker: the approver must be Manager/Admin/Executive and can never
// be the same person who created the request (true segregation of duties).
approvalsRouter.post(
  "/:id/decision",
  requireAuth,
  requireRole("MANAGER", "ADMIN", "EXECUTIVE"),
  async (req: AuthedRequest, res) => {
    const { decision } = req.body ?? {}; // "APPROVED" | "REJECTED"
    if (!["APPROVED", "REJECTED"].includes(decision)) {
      return res.status(400).json({ error: "decision must be APPROVED or REJECTED" });
    }

    const [approval] = await db.select().from(approvals).where(eq(approvals.id, req.params.id));
    if (!approval) return res.status(404).json({ error: "Approval not found" });
    if (approval.status !== "PENDING") {
      return res.status(409).json({ error: "Approval already decided" });
    }
    if (approval.requesterId === req.user!.id) {
      return res.status(403).json({
        error: "Maker-checker violation: you cannot approve your own request",
      });
    }

    const [updated] = await db
      .update(approvals)
      .set({ status: decision, approverId: req.user!.id, decidedAt: new Date().toISOString() })
      .where(eq(approvals.id, approval.id))
      .returning();

    await db.insert(auditLogs).values({
      actorId: req.user!.id,
      action: `APPROVAL_${decision}`,
      details: `${decision} approval ${approval.id} (${approval.type})`,
    });

    res.json(updated);
  }
);
