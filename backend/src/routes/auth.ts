import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { signToken } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken({ id: user.id, role: user.role, name: user.name });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
  });
});

// Demo-only: one-click login per role, matching the 5 role journeys.
authRouter.post("/demo-login", async (req, res) => {
  const { role } = req.body ?? {};
  const [user] = await db.select().from(users).where(eq(users.role, role));
  if (!user) return res.status(404).json({ error: `No demo user seeded for role ${role}` });

  const token = signToken({ id: user.id, role: user.role, name: user.name });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
  });
});
