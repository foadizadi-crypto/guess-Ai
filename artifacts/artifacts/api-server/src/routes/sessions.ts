/**
 * POST /api/sessions — record a completed (or abandoned) game session.
 *
 * Called by the mobile app from result.tsx after every game.
 * Writes to Firestore `game_sessions/{sessionId}` and atomically
 * updates the player's aggregate stats in `players/{playerId}`.
 *
 * `xp` (leaderboard field) is kept in lockstep with `totalXpEarned`
 * so global ranking cannot stay at 0 after games have been recorded.
 */

import { Router, type Request, type Response } from "express";
import { getFirestore } from "../lib/firebaseAdmin";
import { applySessionXp, finiteNumber } from "../lib/playerXp";
import { requireAuth } from "../lib/verifyAuth";

const router = Router();

interface SessionBody {
  sessionId?:     string;
  difficulty:     "easy" | "medium" | "hard";
  category:       string;
  correctAnswers: number;
  wrongAnswers:   number;
  maxCombo:       number;
  xpEarned:       number;
  coinsEarned:    number;
  score:          number;
  startTime:      number | null;
  endTime:        number | null;
  wasAbandoned:   boolean;
}

router.post("/sessions", requireAuth, async (req: Request, res: Response) => {
  const body = req.body as Partial<SessionBody>;

  // Identity comes only from the verified token — never a client-supplied
  // playerId — otherwise any caller could record sessions or inflate stats
  // for an arbitrary player.
  const playerId = req.uid!;
  const { difficulty, category } = body;
  if (!difficulty || !category) {
    res.status(400).json({ error: "difficulty and category are required" });
    return;
  }

  const db = getFirestore();

  const sessionRef = body.sessionId
    ? db.collection("game_sessions").doc(body.sessionId)
    : db.collection("game_sessions").doc();

  const playerRef = db.collection("players").doc(playerId);
  const sessionXp = finiteNumber(body.xpEarned);
  const sessionCoins = finiteNumber(body.coinsEarned);
  const sessionCorrect = finiteNumber(body.correctAnswers);

  await db.runTransaction(async (tx) => {
    const playerSnap = await tx.get(playerRef);
    const current = playerSnap.data() ?? {};
    const nextXp = applySessionXp(current, sessionXp);

    tx.set(sessionRef, {
      playerId,
      difficulty,
      category,
      correctAnswers: sessionCorrect,
      wrongAnswers:   finiteNumber(body.wrongAnswers),
      maxCombo:       finiteNumber(body.maxCombo),
      xpEarned:       sessionXp,
      coinsEarned:    sessionCoins,
      score:          finiteNumber(body.score),
      startTime:      body.startTime      ?? null,
      endTime:        body.endTime        ?? null,
      wasAbandoned:   body.wasAbandoned   ?? false,
      recordedAt:     new Date().toISOString(),
    });

    tx.set(playerRef, {
      totalGamesPlayed:    finiteNumber(current.totalGamesPlayed) + 1,
      totalCorrectAnswers: finiteNumber(current.totalCorrectAnswers) + sessionCorrect,
      totalXpEarned:       nextXp.totalXpEarned,
      totalCoinsEarned:    finiteNumber(current.totalCoinsEarned) + sessionCoins,
      xp:                  nextXp.xp,
      lastPlayedAt:        new Date().toISOString(),
    }, { merge: true });
  });

  res.json({ ok: true, sessionId: sessionRef.id });
});

export default router;
