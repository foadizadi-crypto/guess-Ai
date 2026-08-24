/**
 * Player nickname registration — server-enforced, globally unique.
 *
 * POST /api/nickname/register — atomically reserve a nickname for a playerId.
 *   Uniqueness is case-insensitive ("foad", "FOAD", "FoAd" all collide) and
 *   enforced with a Firestore transaction keyed by the normalized nickname,
 *   so two concurrent requests for the same name can never both succeed.
 *
 * GET /api/nickname/:playerId — look up the nickname already registered for
 *   a player (used on sign-in to restore a returning player's nickname
 *   without ever showing them the nickname modal again).
 */

import { Router, type Request, type Response } from "express";
import { getFirestore } from "../lib/firebaseAdmin";
import { requireAuth } from "../lib/verifyAuth";
import { logger } from "../lib/logger";

const router = Router();

const MIN_LENGTH = 1;
const MAX_LENGTH = 20;

/** Case-insensitive uniqueness key. Trims whitespace and lowercases. */
function normalize(nickname: string): string {
  return nickname.trim().toLowerCase();
}

function isValidNickname(nickname: unknown): nickname is string {
  if (typeof nickname !== "string") return false;
  const trimmed = nickname.trim();
  return trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH;
}

// ─── POST /api/nickname/register ───────────────────────────────────────────
// Requires a verified Firebase ID token; the playerId is ALWAYS the verified
// uid from the token, never a client-supplied value — otherwise any caller
// could reserve or overwrite another player's nickname.
router.post("/nickname/register", requireAuth, async (req: Request, res: Response) => {
  const playerId = req.uid!;
  const body = req.body as { nickname?: unknown };
  const { nickname } = body;

  if (!isValidNickname(nickname)) {
    res.status(400).json({ error: "invalid_nickname", message: `Nickname must be ${MIN_LENGTH}-${MAX_LENGTH} characters.` });
    return;
  }

  const trimmedNickname = (nickname as string).trim();
  const normalized = normalize(trimmedNickname);
  const db = getFirestore();
  const nicknameRef = db.collection("nicknames").doc(normalized);
  const playerRef = db.collection("players").doc(playerId);

  try {
    const result = await db.runTransaction(async (tx) => {
      // Does this player already have a different registered nickname?
      const playerSnap = await tx.get(playerRef);
      const existingNormalized = (playerSnap.data() as { nicknameNormalized?: string } | undefined)?.nicknameNormalized;

      const nicknameSnap = await tx.get(nicknameRef);

      if (nicknameSnap.exists) {
        const owner = (nicknameSnap.data() as { playerId?: string }).playerId;
        if (owner === playerId) {
          // Idempotent: this player already owns this exact nickname.
          return { ok: true as const, nickname: trimmedNickname };
        }
        return { ok: false as const, reason: "taken" as const };
      }

      // Nicknames are permanent (out of scope: changes) — if this player
      // already owns a different nickname, reject rather than silently
      // reassign, so we never leave an orphaned reservation behind.
      if (existingNormalized && existingNormalized !== normalized) {
        return { ok: false as const, reason: "already_registered" as const };
      }

      tx.set(nicknameRef, {
        playerId,
        nickname: trimmedNickname,
        createdAt: new Date().toISOString(),
      });
      tx.set(
        playerRef,
        {
          nickname: trimmedNickname,
          nicknameNormalized: normalized,
          username: trimmedNickname, // back-compat field read by leaderboard etc.
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      return { ok: true as const, nickname: trimmedNickname };
    });

    if (!result.ok) {
      if (result.reason === "taken") {
        res.status(409).json({ error: "taken", message: "Already taken" });
        return;
      }
      // already_registered
      res.status(409).json({
        error: "already_registered",
        message: "This account already has a different nickname registered.",
      });
      return;
    }

    res.json({ ok: true, nickname: result.nickname });
  } catch (err) {
    logger.error({ err }, "Nickname registration transaction failed");
    res.status(503).json({ error: "unavailable", message: "Could not reach the server. Please try again." });
  }
});

// ─── GET /api/nickname/:playerId ────────────────────────────────────────────
// Only the signed-in player may look up their own nickname (used to restore
// it on returning sign-ins) — never anyone else's, so this also requires a
// verified token and the params.playerId must match the caller's own uid.
router.get("/nickname/:playerId", requireAuth, async (req: Request, res: Response) => {
  const playerId = req.params.playerId;
  if (!playerId || typeof playerId !== "string") {
    res.status(400).json({ error: "playerId is required" });
    return;
  }
  if (playerId !== req.uid) {
    res.status(403).json({ error: "forbidden", message: "Cannot look up another player's nickname." });
    return;
  }

  try {
    const db = getFirestore();
    const snap = await db.collection("players").doc(playerId).get();
    const nickname = (snap.data() as { nickname?: string } | undefined)?.nickname ?? null;
    res.json({ nickname });
  } catch (err) {
    logger.warn({ err }, "Nickname lookup failed");
    res.status(503).json({ error: "unavailable", nickname: null });
  }
});

export default router;
