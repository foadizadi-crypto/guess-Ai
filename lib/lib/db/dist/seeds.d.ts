/**
 * Config table seed — spec §9 "Key-Value store for live balancing".
 *
 * Run with:  pnpm --filter @workspace/db run seed
 * or call seedConfig(db) from any migration/setup script.
 *
 * Values mirror GAME_CONFIG in artifacts/artifacts/mobile/constants/gameConfig.ts.
 * Change here to override without a mobile release; the API server reads from
 * this table at startup (or per-request) to serve live-balancing values.
 */
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { type InsertConfig } from "./schema";
import * as schema from "./schema";
export declare const CONFIG_SEEDS: InsertConfig[];
/**
 * Upsert all CONFIG_SEEDS into the config table.
 * Safe to run multiple times — existing keys are updated only if the value changed.
 */
export declare function seedConfig(db: NodePgDatabase<typeof schema>): Promise<void>;
//# sourceMappingURL=seeds.d.ts.map