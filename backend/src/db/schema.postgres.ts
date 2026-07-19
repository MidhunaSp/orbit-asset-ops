import { pgTable, text, integer, timestamp, pgEnum, uuid } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["EMPLOYEE", "MANAGER", "L2_SUPPORT", "EXECUTIVE", "ADMIN"]);
export const assetStatusEnum = pgEnum("asset_status", ["IN_USE", "AVAILABLE", "MAINTENANCE", "RETIRED"]);
export const approvalStatusEnum = pgEnum("approval_status", ["PENDING", "APPROVED", "REJECTED"]);
export const severityEnum = pgEnum("severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const anomalyStatusEnum = pgEnum("anomaly_status", ["ACTIVE", "RESOLVED", "IGNORED"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  department: text("department"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stockItems = pgTable("stock_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  serialNumber: text("serial_number").notNull().unique(),
  status: assetStatusEnum("status").notNull().default("AVAILABLE"),
  assignedToId: uuid("assigned_to_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const distributions = pgTable("distributions", {
  id: uuid("id").defaultRandom().primaryKey(),
  stockItemId: uuid("stock_item_id")
    .notNull()
    .references(() => stockItems.id),
  quantity: integer("quantity").notNull(),
  distributedTo: text("distributed_to").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const approvals = pgTable("approvals", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  status: approvalStatusEnum("status").notNull().default("PENDING"),
  requesterId: uuid("requester_id")
    .notNull()
    .references(() => users.id),
  approverId: uuid("approver_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  decidedAt: timestamp("decided_at"),
});

export const anomalies = pgTable("anomalies", {
  id: uuid("id").defaultRandom().primaryKey(),
  assetId: uuid("asset_id").references(() => assets.id),
  description: text("description").notNull(),
  severity: severityEnum("severity").notNull().default("MEDIUM"),
  status: anomalyStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});
