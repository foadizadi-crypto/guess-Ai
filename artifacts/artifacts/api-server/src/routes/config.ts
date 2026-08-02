/**
 * GET  /api/config        — returns all live economy config values as { key: value }
 * POST /api/config/seed   — (re-)seeds the Firestore config collection from defaults
 *
 * The mobile app fetches GET /api/config on startup and merges remote values
 * over its local gameConfig.ts defaults.  If the collection is empty on the
 * first request, the endpoint auto-seeds it so the app always gets values.
 */

import { Router, type Request, type Response } from "express";
import type { Firestore } from "firebase-admin/firestore";
import { getFirestore } from "../lib/firebaseAdmin";
import { CONFIG_SEEDS } from "../lib/configSeeds";

const router = Router();

// ─── GET /api/config ──────────────────────────────────────────────────────────
router.get("/config", async (_req: Request, res: Response) => {
  const db = getFirestore();
  const snapshot = await db.collection("config").get();

  // Auto-seed on first access
  if (snapshot.empty) {
    await upsertSeeds(db);
    const seeded: Record<string, string> = {};
    CONFIG_SEEDS.forEach((s) => { seeded[s.key] = s.value; });
    res.json(seeded);
    return;
  }

  const config: Record<string, string> = {};
  snapshot.forEach((docSnap) => {
    config[docSnap.id] = (docSnap.data() as { value: string }).value;
  });
  res.json(config);
});

// ─── POST /api/config/seed ────────────────────────────────────────────────────
router.post("/config/seed", async (_req: Request, res: Response) => {
  const db = getFirestore();
  await upsertSeeds(db);
  res.json({ ok: true, seeded: CONFIG_SEEDS.length });
});

// ─── Helper ───────────────────────────────────────────────────────────────────
async function upsertSeeds(db: Firestore): Promise<void> {
  const batch = db.batch();
  for (const seed of CONFIG_SEEDS) {
    const ref = db.collection("config").doc(seed.key);
    batch.set(ref, {
      value:       seed.value,
      description: seed.description,
      updatedAt:   new Date().toISOString(),
    }, { merge: true });
  }
  await batch.commit();
}

export default router;
