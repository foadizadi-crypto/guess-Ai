/**
 * DELETE /api/account
 *
 * Wipes gameplay progress for the authenticated player id (sessions,
 * nickname reservation, players/{uid} progress tree). The player then
 * signs in again as a new empty player.
 *
 * Dollar IAP records in `purchase_ledger` are NEVER deleted — they are
 * financial history required for store/tax/legal accountability.
 * Legacy `players/{uid}/purchases` docs are copied into the ledger first,
 * then the progress tree is removed.
 *
 * The Firebase Auth user is left in place so the same Google account still
 * maps to this player id (empty progress, retained purchases).
 */

import { Router, type Request, type Response } from "express";
import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { getFirestore } from "../lib/firebaseAdmin";
import { requireAuth } from "../lib/verifyAuth";
import { logger } from "../lib/logger";

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
    if (count === 400) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  if (count > 0) await batch.commit();
}

/** Copy legacy player purchase docs into purchase_ledger. Never overwrite an existing ledger row. */
async function retainPurchaseRecords(uid: string): Promise<void> {
  const db = getFirestore();
  const legacy = await db.collection("players").doc(uid).collection("purchases").get();
  for (const document of legacy.docs) {
    const ledgerRef = db.collection("purchase_ledger").doc(document.id);
    const existing = await ledgerRef.get();
    if (existing.exists) continue;
    const data = document.data();
    await ledgerRef.set({
      ...data,
      transactionId: data.transactionId ?? document.id,
      playerId: uid,
      retainedAt: FieldValue.serverTimestamp(),
      retainedReason: "account_deletion",
    });
  }
}

router.delete("/account", requireAuth, async (req: Request, res: Response) => {
  const uid = req.uid!;
  const db = getFirestore();

  try {
    await retainPurchaseRecords(uid);

    await deleteMatchingDocuments("game_sessions", "playerId", uid);

    // Progress only. purchase_ledger is intentionally not queried or deleted.
    await deletePlayerTree(db.collection("players").doc(uid));

    await deleteMatchingDocuments("nicknames", "playerId", uid);

    res.json({ ok: true, purchasesRetained: true });
  } catch (err) {
    logger.error({ err, uid }, "Application account deletion failed");
    res.status(500).json({
      error: "account_deletion_failed",
      message: "Could not delete your game data. Please try again.",
    });
  }
});

export default router;
