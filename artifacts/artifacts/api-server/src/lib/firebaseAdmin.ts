/**
 * Firebase Admin SDK — lazy singleton (firebase-admin v14 modular API).
 * Reads FIREBASE_SERVICE_ACCOUNT_JSON from the environment (Replit secret).
 * Call getFirestore() anywhere in the API; it initializes on first use.
 */

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore as _getFirestore, type Firestore } from "firebase-admin/firestore";
import { logger } from "./logger";

let _app: App | null = null;
let _db: Firestore | null = null;

function getApp(): App {
  if (_app) return _app;

  const raw = process.env["FIREBASE_SERVICE_ACCOUNT_JSON"];
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON secret is not set.");

  const existing = getApps();
  if (existing.length > 0) {
    _app = existing[0]!;
  } else {
    _app = initializeApp({ credential: cert(JSON.parse(raw)) });
    logger.info("Firebase Admin SDK initialized");
  }
  return _app;
}

export function getFirestore(): Firestore {
  if (_db) return _db;
  _db = _getFirestore(getApp());
  return _db;
}
