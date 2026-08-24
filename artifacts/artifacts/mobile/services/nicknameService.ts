/**
 * Client for the server-side atomic nickname registration endpoints
 * (see api-server/src/routes/nickname.ts). This is the only path allowed
 * to confirm a nickname — never accept or display one locally without a
 * successful response from here.
 *
 * Both endpoints require a signed-in player: we send the current Firebase
 * ID token as `Authorization: Bearer <token>` and the server verifies it
 * and derives the acting uid from the token itself, never from anything
 * the client sends — a client can only ever register/read its own nickname.
 */

import { getIdToken, getPlayerId } from './authService';
import { getApiUrl } from './apiConfig';
const REQUEST_TIMEOUT_MS = 10_000;

async function fetchNickname(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export type RegisterNicknameResult =
  | { ok: true; nickname: string }
  | { ok: false; reason: 'taken' | 'already_registered' | 'invalid' | 'network' | 'unauthenticated' };

export async function registerNickname(nickname: string): Promise<RegisterNicknameResult> {
  const idToken = await getIdToken();
  if (!idToken) return { ok: false, reason: 'unauthenticated' };

  try {
    const res = await fetchNickname(getApiUrl('/api/nickname/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ nickname }),
    });

    if (res.ok) {
      const data = (await res.json()) as { ok: true; nickname: string };
      return { ok: true, nickname: data.nickname };
    }

    if (res.status === 409) {
      const data = (await res.json()) as { error: 'taken' | 'already_registered' };
      return { ok: false, reason: data.error };
    }
    if (res.status === 400) {
      return { ok: false, reason: 'invalid' };
    }
    if (res.status === 401) {
      return { ok: false, reason: 'unauthenticated' };
    }
    return { ok: false, reason: 'network' };
  } catch (err) {
    console.warn('[Nickname] register failed:', err);
    return { ok: false, reason: 'network' };
  }
}

/** Returns the nickname already registered for the *current* signed-in player, or null. */
export async function fetchRegisteredNickname(): Promise<string | null> {
  const uid = getPlayerId();
  const idToken = await getIdToken();
  if (!uid || !idToken) return null;

  try {
    const res = await fetchNickname(getApiUrl(`/api/nickname/${encodeURIComponent(uid)}`), {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { nickname: string | null };
    return data.nickname;
  } catch (err) {
    console.warn('[Nickname] lookup failed:', err);
    return null;
  }
}
