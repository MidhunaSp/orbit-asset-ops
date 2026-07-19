import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { assets, anomalies, approvals } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

export const aiRouter = Router();

// Natural-language asset insights. If Azure OpenAI isn't configured, this
// degrades gracefully to a rule-based summary instead of failing outright -
// the same "no collapse" principle the system is built around.
aiRouter.post("/insights", requireAuth, async (req, res) => {
  const { question } = req.body ?? {};
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const key = process.env.AZURE_OPENAI_KEY;

  const [[{ count: assetCount }], [{ count: anomalyCount }], [{ count: pendingApprovals }]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(assets),
    db.select({ count: sql<number>`count(*)` }).from(anomalies).where(eq(anomalies.status, "ACTIVE")),
    db.select({ count: sql<number>`count(*)` }).from(approvals).where(eq(approvals.status, "PENDING")),
  ]);

  if (!endpoint || !key) {
    return res.json({
      mode: "fallback",
      answer:
        `AI service isn't configured yet, so here's a direct summary: ` +
        `${assetCount} assets tracked, ${anomalyCount} active anomalies, ` +
        `${pendingApprovals} approvals pending. Set AZURE_OPENAI_ENDPOINT and ` +
        `AZURE_OPENAI_KEY in .env to enable natural-language queries like "${question ?? "..."}".`,
    });
  }

  try {
    const response = await fetch(
      `${endpoint}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-08-01-preview`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": key },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are an IT asset intelligence assistant. Answer briefly using the provided figures.",
            },
            {
              role: "user",
              content: `Assets: ${assetCount}, active anomalies: ${anomalyCount}, pending approvals: ${pendingApprovals}. Question: ${question}`,
            },
          ],
        }),
      }
    );
    const data = await response.json();
    res.json({ mode: "azure-openai", answer: data.choices?.[0]?.message?.content ?? "No answer returned." });
  } catch {
    res.json({
      mode: "fallback-error",
      answer: `AI call failed, degrading safely. Direct summary: ${assetCount} assets, ${anomalyCount} active anomalies, ${pendingApprovals} pending approvals.`,
    });
  }
});
