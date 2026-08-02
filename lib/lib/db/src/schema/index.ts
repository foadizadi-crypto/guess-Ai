// ─── BlurQuiz database schema ────────────────────────────────────────────────
// All server-side economy tracking lives here.
// Client (mobile) uses local Zustand state; DB is the authoritative source
// for anti-farming, leaderboards, and cross-device sync.
//
// Schema version: 2 — added spec §9 tables:
//   • players      — extended with gems, total_xp, session_counter, ad columns
//   • inventory    — stackable consumable items per player
//   • game_history — per-session record for stats & anti-cheat
//   • config       — live-balancing key-value store

import {
  bigint,
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);

// ─── Players ─────────────────────────────────────────────────────────────────

export const playersTable = pgTable("players", {
  id:             text("id").primaryKey(),             // client-generated UUID

  // Identity
  username:       text("username").notNull(),
  avatarId:       text("avatar_id").notNull().default("avatar_1"),

  // Economy
  coins:          integer("coins").notNull().default(500),
  gems:           integer("gems").notNull().default(0),          // §9: premium currency

  // Progression
  level:          integer("level").notNull().default(1),
  currentXp:      integer("current_xp").notNull().default(0),    // §9: XP toward next level
  xp:             integer("xp").notNull().default(0),            // legacy total (kept for compat)
  totalXp:        bigint("total_xp", { mode: "number" })         // §9: lifetime XP (BIGINT)
                    .notNull().default(0),

  // Premium
  isPremium:      boolean("is_premium").notNull().default(false),

  // Ad system (spec §7 / §9)
  sessionCounter:       integer("session_counter").notNull().default(0),
  lastDailyAdTimestamp: timestamp("last_daily_ad_timestamp"),           // nullable
  adFreePassExpiry:     timestamp("ad_free_pass_expiry"),               // null = no pass

  // Anti-farming: tracks XP earned today (UTC)
  dailyXpEarned:  integer("daily_xp_earned").notNull().default(0),
  dailyXpDate:    text("daily_xp_date"),               // YYYY-MM-DD UTC

  // Login streak
  loginStreak:    integer("login_streak").notNull().default(0),
  lastLoginDate:  text("last_login_date"),             // YYYY-MM-DD UTC

  createdAt:      timestamp("created_at").defaultNow(),
  updatedAt:      timestamp("updated_at").defaultNow(),
});

export const insertPlayerSchema = createInsertSchema(playersTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;

// ─── Inventory (spec §9) ──────────────────────────────────────────────────────
// One row per (player, item).  item_id is an opaque integer reference to the
// in-game item catalog (managed client-side); quantity is the current stack.

export const inventoryTable = pgTable("inventory", {
  id:       serial("id").primaryKey(),
  playerId: text("player_id").notNull().references(() => playersTable.id, { onDelete: "cascade" }),
  itemId:   integer("item_id").notNull(),               // references client-side shop catalog
  quantity: integer("quantity").notNull().default(0),
});

export const insertInventorySchema = createInsertSchema(inventoryTable).omit({ id: true });
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventoryTable.$inferSelect;

// ─── Game history (spec §9) ───────────────────────────────────────────────────
// One row per completed (or early-exited) game session.
// Used for leaderboards, anti-cheat analysis, and player stats.

export const gameHistoryTable = pgTable("game_history", {
  sessionId:      uuid("session_id").primaryKey().defaultRandom(),
  playerId:       text("player_id").notNull().references(() => playersTable.id, { onDelete: "cascade" }),

  difficulty:     difficultyEnum("difficulty").notNull(),
  category:       text("category").notNull(),           // e.g. "Animals"

  correctAnswers: integer("correct_answers").notNull().default(0),
  wrongAnswers:   integer("wrong_answers").notNull().default(0),
  maxCombo:       integer("max_combo").notNull().default(0),

  xpEarned:       integer("xp_earned").notNull().default(0),
  coinsEarned:    integer("coins_earned").notNull().default(0),

  startTime:      timestamp("start_time").notNull().defaultNow(),
  endTime:        timestamp("end_time"),                // null if session abandoned
});

export const insertGameHistorySchema = createInsertSchema(gameHistoryTable).omit({ sessionId: true });
export type InsertGameHistory = z.infer<typeof insertGameHistorySchema>;
export type GameHistory = typeof gameHistoryTable.$inferSelect;

// ─── Config — live balancing key-value store (spec §9) ───────────────────────
// All economy tunables can be overridden here without an app release.
// Seed values mirror GAME_CONFIG in the mobile app (constants/gameConfig.ts).
// See lib/lib/db/src/seeds.ts for the initial INSERT statements.

export const configTable = pgTable("config", {
  key:         text("key").primaryKey(),
  value:       text("value").notNull(),
  description: text("description"),
  updatedAt:   timestamp("updated_at").defaultNow(),
});

export const insertConfigSchema = createInsertSchema(configTable).omit({ updatedAt: true });
export type InsertConfig = z.infer<typeof insertConfigSchema>;
export type Config = typeof configTable.$inferSelect;

// ─── XP events (anti-farming: replay cooldown tracking) ──────────────────────

export const xpEventsTable = pgTable("xp_events", {
  id:              serial("id").primaryKey(),
  playerId:        text("player_id").notNull().references(() => playersTable.id),
  category:        varchar("category", { length: 64 }).notNull(),
  difficulty:      varchar("difficulty", { length: 16 }).notNull(),
  questionSetHash: text("question_set_hash"),           // SHA-256 of sorted question IDs
  xpAwarded:       integer("xp_awarded").notNull(),
  earnedAt:        timestamp("earned_at").defaultNow(),
});

export const insertXpEventSchema = createInsertSchema(xpEventsTable).omit({ id: true, earnedAt: true });
export type InsertXpEvent = z.infer<typeof insertXpEventSchema>;
export type XpEvent = typeof xpEventsTable.$inferSelect;

// ─── Daily missions ───────────────────────────────────────────────────────────

export const dailyMissionsTable = pgTable("daily_missions", {
  id:            serial("id").primaryKey(),
  playerId:      text("player_id").notNull().references(() => playersTable.id),
  missionId:     varchar("mission_id", { length: 64 }).notNull(),
  date:          text("date").notNull(),                // YYYY-MM-DD UTC
  progress:      integer("progress").notNull().default(0),
  completed:     boolean("completed").notNull().default(false),
  rewardClaimed: boolean("reward_claimed").notNull().default(false),
});

export const insertDailyMissionSchema = createInsertSchema(dailyMissionsTable).omit({ id: true });
export type InsertDailyMission = z.infer<typeof insertDailyMissionSchema>;
export type DailyMission = typeof dailyMissionsTable.$inferSelect;

// ─── Achievements ─────────────────────────────────────────────────────────────

export const achievementsTable = pgTable("achievements", {
  id:            serial("id").primaryKey(),
  playerId:      text("player_id").notNull().references(() => playersTable.id),
  achievementId: varchar("achievement_id", { length: 64 }).notNull(),
  unlockedAt:    timestamp("unlocked_at").defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievementsTable).omit({ id: true, unlockedAt: true });
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievementsTable.$inferSelect;

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export const leaderboardTable = pgTable("leaderboard", {
  id:        serial("id").primaryKey(),
  playerId:  text("player_id").notNull().references(() => playersTable.id),
  username:  text("username").notNull(),
  weeklyXp:  integer("weekly_xp").notNull().default(0),
  totalXp:   integer("total_xp").notNull().default(0),
  level:     integer("level").notNull().default(1),
  avatarId:  text("avatar_id").notNull().default("avatar_1"),
  weekKey:   varchar("week_key", { length: 16 }).notNull(), // e.g. "2026-W31"
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeaderboardSchema = createInsertSchema(leaderboardTable).omit({ id: true, updatedAt: true });
export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type LeaderboardRow = typeof leaderboardTable.$inferSelect;

// ─── Level rewards claimed ─────────────────────────────────────────────────────

export const levelRewardClaimsTable = pgTable("level_reward_claims", {
  id:        serial("id").primaryKey(),
  playerId:  text("player_id").notNull().references(() => playersTable.id),
  level:     integer("level").notNull(),
  claimedAt: timestamp("claimed_at").defaultNow(),
});

export const insertLevelRewardClaimSchema = createInsertSchema(levelRewardClaimsTable).omit({ id: true, claimedAt: true });
export type InsertLevelRewardClaim = z.infer<typeof insertLevelRewardClaimSchema>;
export type LevelRewardClaim = typeof levelRewardClaimsTable.$inferSelect;
