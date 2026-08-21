/**
 * GET /api/leaderboard?type=global&limit=50
 * GET /api/leaderboard?type=weekly&limit=50
 * GET /api/leaderboard/rank?type=global&userId=...
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

// ── Helper: full (unsliced) weekly XP totals, sorted descending ────────────────
// Shared by the list endpoint (sliced to `limit`) and the rank endpoint (which
// needs the player's real position even when it falls outside the top N).
async function getWeeklySortedTotals(): Promise<[string, number][]> {
  const db = getFirestore();
  const weekStart = startOfWeekMs();
  const snap = await db.collection("game_sessions")
    .where("startTime", ">=", weekStart)
    .get();

  const totals = new Map<string, number>();
  snap.forEach((doc) => {
    const d = doc.data() as { playerId: string; xpEarned?: number };
    if (!d.playerId) return;
    totals.set(d.playerId, (totals.get(d.playerId) ?? 0) + (d.xpEarned ?? 0));
  });

  return [...totals.entries()].sort(([, a], [, b]) => b - a);
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
      const sortedTotals = await getWeeklySortedTotals();

      if (sortedTotals.length === 0) {
        res.json([]);
        return;
      }

      const sorted = sortedTotals.slice(0, limit);

      // Fetch player profiles for those who appeared in sessions
      // Firestore "in" queries support max 30 items; batch if needed
      const playerIds = sorted.map(([userId]) => userId);
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

// ─── GET /api/leaderboard/rank ─────────────────────────────────────────────────
// Real rank for one player, computed against the FULL player base — not just
// the top-N slice returned by /api/leaderboard. Lets the app show "You're
// #182" even when the player is nowhere near the top 10.
router.get("/leaderboard/rank", async (req: Request, res: Response) => {
  const type   = (req.query["type"]   as string | undefined) ?? "global";
  const userId = req.query["userId"] as string | undefined;

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  try {
    const db = getFirestore();

    if (type === "weekly") {
      const sortedTotals = await getWeeklySortedTotals();
      const index = sortedTotals.findIndex(([id]) => id === userId);
      if (index === -1) {
        res.json({ rank: null, xp: 0 });
        return;
      }
      res.json({ rank: index + 1, xp: sortedTotals[index]![1] });
      return;
    }

    // ── Global: exact rank via a count() aggregation query — real, and cheap
    // even with a large player base, since it never loads the full collection.
    const playerDoc = await db.collection("players").doc(userId).get();
    if (!playerDoc.exists) {
      res.json({ rank: null, xp: 0 });
      return;
    }

    const xp = (playerDoc.data() as { xp?: number }).xp ?? 0;
    const higherCount = await db.collection("players")
      .where("xp", ">", xp)
      .count()
      .get();

    res.json({ rank: higherCount.data().count + 1, xp });
  } catch (err) {
    logger.warn({ err }, "Firestore unavailable — returning unranked");
    res.json({ rank: null, xp: 0 });
  }
});

export default router;
