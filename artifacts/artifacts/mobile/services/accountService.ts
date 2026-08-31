import { getIdToken } from './authService';
import { getApiUrl } from './apiConfig';

const REQUEST_TIMEOUT_MS = 15_000;

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; reason: 'unauthenticated' | 'network' | 'server' };

/** Deletes gameplay progress only. Dollar purchase ledger records are retained. */
export async function deleteApplicationAccount(): Promise<DeleteAccountResult> {
  const token = await getIdToken();
  if (!token) return { ok: false, reason: 'unauthenticated' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(getApiUrl('/api/account'), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    if (response.ok) return { ok: true };
    if (response.status === 401 || response.status === 403) {
      return { ok: false, reason: 'unauthenticated' };
    }
    return { ok: false, reason: 'server' };
  } catch (err) {
    console.warn('[Account] deletion request failed:', err);
    return { ok: false, reason: 'network' };
  } finally {
    clearTimeout(timeout);
  }
}
