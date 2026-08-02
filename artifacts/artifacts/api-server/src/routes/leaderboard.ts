/**
 * GET /api/leaderboard?type=global&limit=50
 * GET /api/leaderboard?type=weekly&limit=50
 *
 * global — top players ranked by total XP (players collection)
 * weekly — top players by XP earned in game sessions since Monday 00:00 UTC
 *
 * Falls back to an empty array if Firestore is unavailable so the
 * mobile screen can still render gracefully.
 */

import { Router, type Request, type Response } from "express";
import { getFirestore } from "../lib/firebaseAdmin";
import { logger } from "../lib/logger";

const router = Router();

export interface LeaderboardEntry {
  rank:      number;
  userId:    string;
  username:  string;
  xp:        number;
  level:     number;
  avatarId:  string;
}

// ── Helper: start of the current week (Monday 00:00:00 UTC in ms) ──────────────
function startOfWeekMs(): number {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun … 6=Sat
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMonday));
  return monday.getTime();
}

// ─── GET /api/leaderboard ─────────────────────────────────────────────────────
router.get("/leaderboard", async (req: Request, res: Response) => {
  const type  = (req.query["type"]  as string | undefined) ?? "global";
  const limit = Math.min(Number(req.query["limit"] ?? 50), 100);

  try {
    const db = getFirestore();
    let entries: LeaderboardEntry[] = [];

    if (type === "weekly") {
      // ── Weekly: aggregate XP from game_sessions since Monday ────────────────
      const weekStart = startOfWeekMs();
      const snap = await db.collection("game_sessions")
        .where("startTime", ">=", weekStart)
        .get();

      // Accumulate xpEarned per player
      const totals = new Map<string, number>();
      snap.forEach((doc) => {
        const d = doc.data() as { playerId: string; xpEarned?: number };
        if (!d.playerId) return;
        totals.set(d.playerId, (totals.get(d.playerId) ?? 0) + (d.xpEarned ?? 0));
      });

      if (totals.size === 0) {
        res.json([]);
        return;
      }

      // Fetch player profiles for those who appeared in sessions
      // Firestore "in" queries support max 30 items; batch if needed
      const playerIds = [...totals.keys()];
      const batches: string[][] = [];
      for (let i = 0; i < playerIds.length; i += 30) {
        batches.push(playerIds.slice(i, i + 30));
      }

      const playerMap = new Map<string, { username: string; level: number; avatarId: string }>();
      for (const batch of batches) {
        const playerSnap = await db.collection("players").where("__name__", "in", batch).get();
        playerSnap.forEach((doc) => {
          const d = doc.data() as { username?: string; level?: number; selectedAvatarId?: string };
          playerMap.set(doc.id, {
            username: d.username ?? "Player",
            level:    d.level    ?? 1,
            avatarId: d.selectedAvatarId ?? "avatar_1",
          });
        });
      }

      // Sort by weekly XP and assign ranks
      const sorted = [...totals.entries()]
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit);

      entries = sorted.map(([userId, xp], i) => ({
        rank:     i + 1,
        userId,
        username: playerMap.get(userId)?.username  ?? "Player",
        level:    playerMap.get(userId)?.level     ?? 1,
        avatarId: playerMap.get(userId)?.avatarId  ?? "avatar_1",
        xp,
      }));

    } else {
      // ── Global: top players by total XP from players collection ─────────────
      const snap = await db.collection("players")
        .orderBy("xp", "desc")
        .limit(limit)
        .get();

      entries = snap.docs.map((doc, i) => {
        const d = doc.data() as {
          username?: string; xp?: number; level?: number; selectedAvatarId?: string;
        };
        return {
          rank:     i + 1,
          userId:   doc.id,
          username: d.username         ?? "Player",
          xp:       d.xp               ?? 0,
          level:    d.level             ?? 1,
          avatarId: d.selectedAvatarId  ?? "avatar_1",
        };
      });
    }

    res.json(entries);
  } catch (err) {
    logger.warn({ err }, "Firestore unavailable — returning empty leaderboard");
    res.json([]); // graceful empty list; mobile shows "No players yet" state
  }
});

export default router;
