/**
 * Firebase ID-token verification middleware.
 *
 * Any route that acts on behalf of a specific player (nickname registration,
 * profile lookups, etc.) must never trust a client-supplied playerId/uid —
 * that lets one player read or overwrite another player's data. Instead we
 * verify the Firebase ID token sent in `Authorization: Bearer <idToken>` and
 * attach the *verified* uid to the request; every downstream handler must
 * derive identity from `req.uid`, never from the request body/params.
 */

import type { NextFunction, Request, Response } from "express";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "./firebaseAdmin";
import { logger } from "./logger";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      uid?: string;
    }
  }
}

// Ensures the Admin app is initialized (getFirestore() lazily calls initializeApp).
function auth() {
  getFirestore();
  return getAuth();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization ?? "";
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) {
    res.status(401).json({ error: "unauthenticated", message: "Missing Authorization header." });
    return;
  }

  try {
    const decoded = await auth().verifyIdToken(match[1]!);
    // Google Sign-In is the only supported sign-in method — reject tokens
    // issued by any other Firebase Auth provider (e.g. if one is ever
    // enabled in the console) so identity always maps to a real Google
    // account, matching the mandatory-Google-Sign-In product requirement.
    const provider = (decoded.firebase as { sign_in_provider?: string } | undefined)?.sign_in_provider;
    if (provider !== "google.com") {
      res.status(403).json({ error: "provider_not_allowed", message: "Only Google Sign-In is supported." });
      return;
    }
    req.uid = decoded.uid;
    next();
  } catch (err) {
    logger.warn({ err }, "ID token verification failed");
    res.status(401).json({ error: "unauthenticated", message: "Invalid or expired sign-in. Please sign in again." });
  }
}
