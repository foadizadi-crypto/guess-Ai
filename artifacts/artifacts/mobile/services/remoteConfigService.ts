/**
 * Remote config service — Task 9.
 *
 * Fetches live economy values from GET /api/config on app startup and merges
 * them into GAME_CONFIG.  Local gameConfig.ts values remain as the offline
 * fallback if the fetch fails or times out.
 *
 * Call fetchAndApplyRemoteConfig() once from useFirestoreSync after auth init.
 */

import { applyRemoteConfig } from '@/constants/gameConfig';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
const FETCH_TIMEOUT_MS = 5000;

/**
 * Fetch /api/config and merge values into the live GAME_CONFIG.
 * Errors are swallowed — the game always runs with local defaults as backup.
 */
export async function fetchAndApplyRemoteConfig(): Promise<void> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(`${API_URL}/api/config`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[RemoteConfig] GET /api/config returned ${res.status} — using local defaults`);
      return;
    }

    const data = (await res.json()) as Record<string, string>;
    applyRemoteConfig(data);
    console.log(`[RemoteConfig] Applied ${Object.keys(data).length} remote config values`);
  } catch (err) {
    // Network error, timeout, or parse failure — game continues with local defaults
    console.warn('[RemoteConfig] Fetch failed — using local defaults:', err);
  }
}
