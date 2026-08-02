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
import { sql } from "drizzle-orm";
import { configTable, type InsertConfig } from "./schema";
import * as schema from "./schema";

export const CONFIG_SEEDS: InsertConfig[] = [
  // ── XP Formula ──────────────────────────────────────────────────────────
  { key: "xp_formula_coefficient",    value: "1.2",  description: "Coefficient in level XP formula: coefficient × level ^ exponent" },
  { key: "xp_formula_exponent",       value: "1.4",  description: "Exponent in level XP formula" },

  // ── XP Per Answer ────────────────────────────────────────────────────────
  { key: "xp_correct_easy",           value: "10",   description: "XP awarded for a correct answer on Easy" },
  { key: "xp_correct_medium",         value: "15",   description: "XP awarded for a correct answer on Medium" },
  { key: "xp_correct_hard",           value: "25",   description: "XP awarded for a correct answer on Hard" },
  { key: "xp_wrong",                  value: "2",    description: "XP awarded for a wrong answer (prevents frustration)" },

  // ── Game Completion Bonuses ──────────────────────────────────────────────
  { key: "xp_session_complete_bonus", value: "50",   description: "XP bonus for finishing any 20-question session" },
  { key: "xp_perfect_game_bonus",     value: "100",  description: "XP bonus for 20/20 correct" },

  // ── Combo Tiers ──────────────────────────────────────────────────────────
  { key: "combo_tier_1_min",          value: "3",    description: "Min streak for Mini-combo bonus" },
  { key: "combo_tier_1_bonus",        value: "3",    description: "Bonus XP per correct answer at Mini-combo" },
  { key: "combo_tier_2_min",          value: "5",    description: "Min streak for Combo bonus" },
  { key: "combo_tier_2_bonus",        value: "5",    description: "Bonus XP per correct answer at Combo" },
  { key: "combo_tier_3_min",          value: "8",    description: "Min streak for Super Combo bonus" },
  { key: "combo_tier_3_bonus",        value: "8",    description: "Bonus XP per correct answer at Super Combo" },
  { key: "combo_tier_4_min",          value: "12",   description: "Min streak for Ultra Combo bonus" },
  { key: "combo_tier_4_bonus",        value: "12",   description: "Bonus XP per correct answer at Ultra Combo" },

  // ── Clarity / Blur Mechanics ─────────────────────────────────────────────
  { key: "clarity_correct_increment",     value: "5",  description: "Blur removed on a correct answer" },
  { key: "clarity_wrong_penalty_easy",    value: "3",  description: "Extra blur added on wrong answer (Easy)" },
  { key: "clarity_wrong_penalty_medium",  value: "5",  description: "Extra blur added on wrong answer (Medium)" },
  { key: "clarity_wrong_penalty_hard",    value: "7",  description: "Extra blur added on wrong answer (Hard)" },
  { key: "initial_blur_easy",             value: "50", description: "Starting blur amount on Easy (0=clear, 100=fully blurred)" },
  { key: "initial_blur_medium",           value: "80", description: "Starting blur amount on Medium" },
  { key: "initial_blur_hard",             value: "100", description: "Starting blur amount on Hard" },

  // ── Ad System ────────────────────────────────────────────────────────────
  { key: "daily_ad_cooldown_hours",    value: "4",   description: "Hours between Daily Gift lobby ad claims (spec §7.1)" },
  { key: "double_reward_session_threshold", value: "3", description: "Sessions before Double Rewards button appears (spec §7.2)" },

  // ── Coin Rewards ─────────────────────────────────────────────────────────
  { key: "coins_per_correct_answer",   value: "1",   description: "Coins awarded per correct answer" },
  { key: "coins_perfect_game_bonus",   value: "25",  description: "Bonus coins for a perfect game" },
  { key: "daily_gift_coins_min",       value: "50",  description: "Minimum coins from Daily Gift ad (spec §7.1)" },
  { key: "daily_gift_coins_max",       value: "150", description: "Maximum coins from Daily Gift ad (spec §7.1)" },
  { key: "daily_gift_consumable_chance", value: "0.1", description: "Probability of bonus consumable from Daily Gift (10%)" },

  // ── Level System ─────────────────────────────────────────────────────────
  { key: "max_level",                  value: "500", description: "Highest achievable player level" },
  { key: "daily_xp_cap",              value: "500", description: "Max XP earnable in one calendar day (anti-farming)" },
];

/**
 * Upsert all CONFIG_SEEDS into the config table.
 * Safe to run multiple times — existing keys are updated only if the value changed.
 */
export async function seedConfig(db: NodePgDatabase<typeof schema>): Promise<void> {
  if (CONFIG_SEEDS.length === 0) return;
  await db
    .insert(configTable)
    .values(CONFIG_SEEDS)
    .onConflictDoUpdate({
      target: configTable.key,
      set: {
        value:       sql`excluded.value`,
        description: sql`excluded.description`,
        updatedAt:   sql`now()`,
      },
    });
}
