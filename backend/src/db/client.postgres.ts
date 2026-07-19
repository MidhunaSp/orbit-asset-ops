// PRODUCTION client (Neon / PostgreSQL). To deploy:
//   1. rename schema.postgres.ts -> schema.ts (or point imports at it)
//   2. rename this file -> client.ts
//   3. set DATABASE_URL to your Neon connection string in .env
//   4. npm run db:generate && npm run db:migrate
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.postgres.js";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { ssl: "require" });

export const db = drizzle(client, { schema });
