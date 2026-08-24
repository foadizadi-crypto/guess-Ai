/**
 * DELETE /api/account
 *
 * Permanently removes the authenticated player's application data. This uses
 * the verified Firebase UID from requireAuth and never accepts an account ID
 * from the request body or query string. The Firebase/Google Auth user itself
 * is intentionally untouched so the same Google account can sign in again.
 */

import { Router, type Request, type Response } from "express";
import { getFirestore } from "../lib/firebaseAdmin";
import { requireAuth } from "../lib/verifyAuth";
import { logger } from "../lib/logger";
import type { DocumentReference } from "firebase-admin/firestore";

const router = Router();

async function deletePlayerTree(ref: DocumentReference): Promise<void> {
  for (const subcollection of await ref.listCollections()) {
    const snapshot = await subcollection.get();
    for (const document of snapshot.docs) {
      await deletePlayerTree(document.ref);
      await document.ref.delete();
    }
  }
  await ref.delete();
}

async function deleteMatchingDocuments(
  collectionName: string,
  field: string,
  value: string,
): Promise<void> {
  const db = getFirestore();
  const snapshot = await db.collection(collectionName).where(field, "==", value).get();
  let batch = db.batch();
  let count = 0;

  for (const document of snapshot.docs) {
    batch.delete(document.ref);
    count += 1;
    // Keep batches below Firestore's 500-operation limit.
    if (count === 400) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  if (count > 0) await batch.commit();
}

router.delete("/account", requireAuth, async (req: Request, res: Response) => {
  const uid = req.uid!;
  const db = getFirestore();

  try {
    // Delete every application-owned game session, regardless of which
    // device created it. Shared configuration and other players are untouched.
    await deleteMatchingDocuments("game_sessions", "playerId", uid);

    // Delete the player profile and every owned subcollection (purchases,
    // spin history, private push token, and any future player subcollections).
    await deletePlayerTree(db.collection("players").doc(uid));

    // Nickname reservations are server-owned and may outlive a profile if an
    // earlier operation was interrupted. Delete only reservations owned by uid.
    await deleteMatchingDocuments("nicknames", "playerId", uid);

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err, uid }, "Application account deletion failed");
    res.status(500).json({
      error: "account_deletion_failed",
      message: "Could not delete your game data. Please try again.",
    });
  }
});

export default router;
