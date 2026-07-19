import { randomUUID } from "node:crypto";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// NOTE: written for SQLite (local dev, zero setup). A PostgreSQL variant of
// this same schema (for Neon in production) is in schema.postgres.ts -
// the shape is identical, only the column builders differ. See README.

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["EMPLOYEE", "MANAGER", "L2_SUPPORT", "EXECUTIVE", "ADMIN"] }).notNull(),
  department: text("department"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const stockItems = sqliteTable("stock_items", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  category: text("category").notNull(),
  serialNumber: text("serial_number").notNull().unique(),
  status: text("status", { enum: ["IN_USE", "AVAILABLE", "MAINTENANCE", "RETIRED"] })
    .notNull()
    .default("AVAILABLE"),
  assignedToId: text("assigned_to_id").references(() => users.id),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const distributions = sqliteTable("distributions", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  stockItemId: text("stock_item_id")
    .notNull()
    .references(() => stockItems.id),
  quantity: integer("quantity").notNull(),
  distributedTo: text("distributed_to").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const approvals = sqliteTable("approvals", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  type: text("type").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["PENDING", "APPROVED", "REJECTED"] })
    .notNull()
    .default("PENDING"),
  requesterId: text("requester_id")
    .notNull()
    .references(() => users.id),
  approverId: text("approver_id").references(() => users.id),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  decidedAt: text("decided_at"),
});

export const anomalies = sqliteTable("anomalies", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  assetId: text("asset_id").references(() => assets.id),
  description: text("description").notNull(),
  severity: text("severity", { enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] })
    .notNull()
    .default("MEDIUM"),
  status: text("status", { enum: ["ACTIVE", "RESOLVED", "IGNORED"] })
    .notNull()
    .default("ACTIVE"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  actorId: text("actor_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
