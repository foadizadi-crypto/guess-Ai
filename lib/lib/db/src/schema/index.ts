// ─── BlurQuiz database schema ────────────────────────────────────────────────
// All server-side economy tracking lives here.
// Client (mobile) uses local Zustand state; DB is the authoritative source
// for anti-farming, leaderboards, and cross-device sync.

import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── Players ─────────────────────────────────────────────────────────────────

export const playersTable = pgTable("players", {
  id:             text("id").primaryKey(),             // client-generated UUID
  username:       text("username").notNull(),
  coins:          integer("coins").notNull().default(500),
  xp:             integer("xp").notNull().default(0),
  level:          integer("level").notNull().default(1),
  isPremium:      boolean("is_premium").notNull().default(false),
  // Anti-farming: tracks XP earned today (UTC)
  dailyXpEarned:  integer("daily_xp_earned").notNull().default(0),
  dailyXpDate:    text("daily_xp_date"),               // YYYY-MM-DD UTC
  // Login streak
  loginStreak:    integer("login_streak").notNull().default(0),
  lastLoginDate:  text("last_login_date"),             // YYYY-MM-DD UTC
  avatarId:       text("avatar_id").notNull().default("avatar_1"),
  createdAt:      timestamp("created_at").defaultNow(),
  updatedAt:      timestamp("updated_at").defaultNow(),
});

export const insertPlayerSchema = createInsertSchema(playersTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;

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
