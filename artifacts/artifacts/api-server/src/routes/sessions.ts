/**
 * POST /api/sessions — record a completed (or abandoned) game session.
 *
 * Called by the mobile app from result.tsx after every game.
 * Writes to Firestore `game_sessions/{sessionId}` and atomically
 * updates the player's aggregate stats in `players/{playerId}`.
 */

import { Router, type Request, type Response } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "../lib/firebaseAdmin";
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

  const batch = db.batch();

  batch.set(sessionRef, {
    playerId,
    difficulty,
    category,
    correctAnswers: body.correctAnswers ?? 0,
    wrongAnswers:   body.wrongAnswers   ?? 0,
    maxCombo:       body.maxCombo       ?? 0,
    xpEarned:       body.xpEarned       ?? 0,
    coinsEarned:    body.coinsEarned    ?? 0,
    score:          body.score          ?? 0,
    startTime:      body.startTime      ?? null,
    endTime:        body.endTime        ?? null,
    wasAbandoned:   body.wasAbandoned   ?? false,
    recordedAt:     new Date().toISOString(),
  });

  // Atomically update player aggregate stats
  const playerRef = db.collection("players").doc(playerId);
  batch.set(playerRef, {
    totalGamesPlayed:    FieldValue.increment(1),
    totalCorrectAnswers: FieldValue.increment(body.correctAnswers ?? 0),
    totalXpEarned:       FieldValue.increment(body.xpEarned       ?? 0),
    totalCoinsEarned:    FieldValue.increment(body.coinsEarned    ?? 0),
    lastPlayedAt:        new Date().toISOString(),
  }, { merge: true });

  await batch.commit();

  res.json({ ok: true, sessionId: sessionRef.id });
});

export default router;
