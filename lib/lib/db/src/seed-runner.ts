/**
 * Standalone seed runner — executes seedConfig against the live DB.
 * Run via: pnpm --filter @workspace/db run seed
 */
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { seedConfig } from "./seeds";

if (!process.env.DATABASE_URL) {
  console.error("❌  DATABASE_URL is not set — cannot seed.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

seedConfig(db)
  .then(() => {
    console.log("✅  Config table seeded successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌  Seed failed:", err);
    process.exit(1);
  });
