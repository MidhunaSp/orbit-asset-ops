import "dotenv/config";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { db } from "./client.js";
import { users, stockItems, assets, approvals, anomalies } from "./schema.js";

async function main() {
  console.log("Seeding database...");
  const passwordHash = await bcrypt.hash("password123", 10);

  const roleSeed = [
    { name: "Aisha Employee", email: "employee@demo.io", role: "EMPLOYEE" as const, department: "Sales" },
    { name: "Rahul Manager", email: "manager@demo.io", role: "MANAGER" as const, department: "IT" },
    { name: "Priya L2Support", email: "l2support@demo.io", role: "L2_SUPPORT" as const, department: "IT" },
    { name: "Vikram Executive", email: "executive@demo.io", role: "EXECUTIVE" as const, department: "Leadership" },
    { name: "Hanif M", email: "admin@demo.io", role: "ADMIN" as const, department: "IT" },
    { name: "Sara Ops", email: "ops@demo.io", role: "EMPLOYEE" as const, department: "Operations" },
  ];

  const insertedUsers = [];
  for (const r of roleSeed) {
    const [user] = await db.insert(users).values({ ...r, passwordHash }).returning();
    insertedUsers.push(user);
  }
  const [employee, manager, , exec] = insertedUsers;

  const stockData = [
    { name: "Laptop", category: "Compute", quantity: 132 },
    { name: "Monitor", category: "Peripherals", quantity: 44 },
    { name: "Keyboard", category: "Peripherals", quantity: 38 },
    { name: "Mouse", category: "Peripherals", quantity: 29 },
    { name: "Headset", category: "Peripherals", quantity: 22 },
    { name: "Dock", category: "Peripherals", quantity: 18 },
    { name: "Webcam", category: "Peripherals", quantity: 12 },
    { name: "Chair", category: "Furniture", quantity: 9 },
    { name: "Desk", category: "Furniture", quantity: 7 },
    { name: "Router", category: "Networking", quantity: 6 },
    { name: "Switch", category: "Networking", quantity: 5 },
    { name: "Projector", category: "AV", quantity: 3 },
    { name: "Printer", category: "Office", quantity: 2 },
  ];
  await db.insert(stockItems).values(stockData);

  const statuses = ["IN_USE", "AVAILABLE", "AVAILABLE", "MAINTENANCE", "IN_USE"] as const;
  const insertedAssets = [];
  for (let i = 0; i < 20; i++) {
    const [asset] = await db
      .insert(assets)
      .values({
        name: ["Laptop", "Monitor", "Router", "Chair"][i % 4],
        category: ["Compute", "Peripherals", "Networking", "Furniture"][i % 4],
        serialNumber: `SN-${1000 + i}`,
        status: statuses[i % statuses.length],
        assignedToId: i % 3 === 0 ? employee.id : null,
      })
      .returning();
    insertedAssets.push(asset);
  }

  const approvalTypes = [
    "New laptop request",
    "Asset transfer",
    "Stock write-off",
    "Vendor onboarding",
    "Retirement request",
  ];
  const requesterPool = [employee, manager, exec];
  for (let i = 0; i < 8; i++) {
    await db.insert(approvals).values({
      type: approvalTypes[i % approvalTypes.length],
      description: `${approvalTypes[i % approvalTypes.length]} #${i + 1}`,
      status: "PENDING",
      requesterId: requesterPool[i % requesterPool.length].id,
    });
  }

  const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
  for (let i = 0; i < 17; i++) {
    const asset = insertedAssets[i % insertedAssets.length];
    await db.insert(anomalies).values({
      assetId: asset.id,
      description: `Unusual activity detected on asset ${asset.serialNumber}`,
      severity: severities[i % severities.length],
      status: "ACTIVE",
    });
  }

  console.log("Seed complete. Demo logins (password: password123):");
  for (const r of roleSeed) console.log(`  ${r.role.padEnd(12)} ${r.email}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
