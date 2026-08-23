/**
 * Client for the server-side atomic nickname registration endpoints
 * (see api-server/src/routes/nickname.ts). This is the only path allowed
 * to confirm a nickname — never accept or display one locally without a
 * successful response from here.
 */

const apiBase = () => process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

export type RegisterNicknameResult =
  | { ok: true; nickname: string }
  | { ok: false; reason: 'taken' | 'already_registered' | 'invalid' | 'network' };

export async function registerNickname(
  playerId: string,
  nickname: string,
): Promise<RegisterNicknameResult> {
  try {
    const res = await fetch(`${apiBase()}/api/nickname/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, nickname }),
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
    return { ok: false, reason: 'network' };
  } catch (err) {
    console.warn('[Nickname] register failed:', err);
    return { ok: false, reason: 'network' };
  }
}

/** Returns the nickname already registered for this player, or null. */
export async function fetchRegisteredNickname(playerId: string): Promise<string | null> {
  try {
    const res = await fetch(`${apiBase()}/api/nickname/${encodeURIComponent(playerId)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { nickname: string | null };
    return data.nickname;
  } catch (err) {
    console.warn('[Nickname] lookup failed:', err);
    return null;
  }
}
