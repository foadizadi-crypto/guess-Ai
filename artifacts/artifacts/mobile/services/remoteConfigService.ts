/**
 * Remote config service — Task 9.
 *
 * Fetches live economy values from GET /api/config on app startup and merges
 * them into GAME_CONFIG. Local gameConfig.ts values remain as the offline
 * fallback if the fetch fails or times out.
 *
 * Call fetchAndApplyRemoteConfig() once from useFirestoreSync after auth init.
 */

import { applyRemoteConfig } from '@/constants/gameConfig';
import { getApiUrl, safeApiTarget } from '@/services/apiConfig';
const FETCH_TIMEOUT_MS = 5000;

/**
 * Fetch /api/config and merge values into the live GAME_CONFIG.
 * Errors are swallowed — the game always runs with local defaults as backup.
 */
export async function fetchAndApplyRemoteConfig(): Promise<void> {
  // Create AbortController only if available in runtime (some RN environments may not expose it)
  const controllerAvailable = typeof AbortController !== 'undefined';
  const controller = controllerAvailable ? new AbortController() : null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    if (controller) {
      timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    } else {
      // Non-supporting runtimes: still set a fallback timer to avoid hanging the call
      timer = setTimeout(() => {
        // no-op: we can't abort, but we will proceed once fetch resolves or errors
      }, FETCH_TIMEOUT_MS);
    }

    const fetchOptions = controller ? { signal: controller.signal } : undefined;
    console.log('[API] remote config request', { target: safeApiTarget(), path: '/api/config' });
    const res = await fetch(getApiUrl('/api/config'), fetchOptions as RequestInit | undefined);

    if (!res.ok) {
      console.warn(
        `[RemoteConfig] GET /api/config returned ${res.status} ${res.statusText} — using local defaults`
      );
      return;
    }

    // Try to parse JSON safely
    let data: unknown;
    try {
      data = await res.json();
    } catch (parseErr) {
      console.warn('[RemoteConfig] Failed to parse JSON from /api/config — using local defaults', parseErr);
      return;
    }

    // Validate that the response is an object (not array/null)
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      // Use a permissive type — accept string | number | boolean values commonly used for remote config
      applyRemoteConfig(data as Record<string, unknown>);
      const keysCount = Object.keys(data as Record<string, unknown>).length;
      console.log(`[RemoteConfig] Applied ${keysCount} remote config values`);
    } else {
      console.warn('[RemoteConfig] Unexpected /api/config response shape — using local defaults');
    }
  } catch (err: unknown) {
    // Could be network error, abort, or other
    console.warn('[RemoteConfig] Fetch failed — using local defaults:', err);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
