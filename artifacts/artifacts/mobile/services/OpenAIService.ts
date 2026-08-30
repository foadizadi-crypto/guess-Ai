import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Category, Difficulty, Question } from '@/types';
import { generateId } from '@/utils';
import { API_BASE_URL, getApiUrl, safeApiTarget } from '@/services/apiConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface GenerateQuestionsResult {
  questions: Question[];
  fromCache: boolean;
}

export const MAINTENANCE_MESSAGE =
  'The quiz service is temporarily unavailable. Please try again.';

// ─── Cache helpers ─────────────────────────────────────────────────────────────

const CACHE_REFRESH_THRESHOLD_MS = 12 * 60 * 60 * 1000;

/** AsyncStorage key that holds the list of recently played category+difficulty pairs. */
const RECENT_PLAYS_KEY = 'question_cache_recent_plays';
/** Maximum number of recent play entries to track. */
const MAX_RECENT_PLAYS = 10;

interface CacheEntry {
  questions: Question[];
  savedAt: number; // epoch ms
}

interface RecentPlay {
  category: Category;
  difficulty: Difficulty;
}

function cacheKey(category: Category, difficulty: Difficulty): string {
  // v2: one-image-per-round format — old multi-image cached rounds are ignored.
  return `question_cache_v2_${category}_${difficulty}`;
}

async function writeCache(
  category: Category,
  difficulty: Difficulty,
  questions: Question[],
): Promise<void> {
  try {
    const entry: CacheEntry = { questions, savedAt: Date.now() };
    await AsyncStorage.setItem(cacheKey(category, difficulty), JSON.stringify(entry));
  } catch {
    // Best-effort — never crash the game because of a cache write failure
  }
}

/**
 * Read the list of recently played category+difficulty pairs from AsyncStorage.
 * Returns an empty array on any error.
 */
async function readRecentPlays(): Promise<RecentPlay[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_PLAYS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentPlay[];
  } catch {
    return [];
  }
}

/**
 * Persist a recently played pair.  Moves the entry to the front of the list
 * (most-recently-played first) and caps the list at MAX_RECENT_PLAYS.
 */
async function persistRecentPlay(category: Category, difficulty: Difficulty): Promise<void> {
  try {
    const plays = await readRecentPlays();
    // Remove any existing entry for this combination so it rises to the front.
    const filtered = plays.filter(
      (p) => !(p.category === category && p.difficulty === difficulty),
    );
    const updated: RecentPlay[] = [{ category, difficulty }, ...filtered].slice(
      0,
      MAX_RECENT_PLAYS,
    );
    await AsyncStorage.setItem(RECENT_PLAYS_KEY, JSON.stringify(updated));
  } catch {
    // Best-effort
  }
}

// ─── API base URL ─────────────────────────────────────────────────────────────
// Always the live Render origin (see apiConfig). No localhost fallback.

const REQUEST_TIMEOUT_MS = 120_000;

async function fetchWithTimeout(input: string, init: RequestInit): Promise<Response> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = setTimeout(() => controller?.abort(), REQUEST_TIMEOUT_MS);
  try {
    if (__DEV__) console.log('[API] request', { target: safeApiTarget(), path: new URL(input).pathname });
    return await fetch(input, controller ? { ...init, signal: controller.signal } : init);
  } catch (error) {
    if (controller?.signal.aborted) {
      throw new Error(`API request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Service class ────────────────────────────────────────────────────────────

class OpenAIService {
  private static instance: OpenAIService;

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Generate an image from a text prompt via the API server (DALL-E 3).
   * Throws if the server returns an error — no picsum fallback.
   */
  async generateImage(prompt: string): Promise<GeneratedImage> {
    const response = await fetchWithTimeout(getApiUrl('/api/images'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error ?? `Image API responded with ${response.status}`);
    }

    const data = (await response.json()) as { url: string };
    return { url: data.url, prompt };
  }

  /**
   * Generate a set of quiz questions via the live OpenAI API.
   * Never substitutes cache, mock, or placeholder content.
   */
  async generateQuestions(
    category: Category,
    difficulty: Difficulty,
    count = 20,
  ): Promise<GenerateQuestionsResult> {
    if (!API_BASE_URL) {
      throw new Error('API is not configured');
    }
    const response = await fetchWithTimeout(getApiUrl('/api/questions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, difficulty, count }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error ?? `Questions API responded with ${response.status}`);
    }

    const data = (await response.json()) as { questions: Question[] };

    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error('API returned no questions');
    }

    const questions = data.questions.map((q) => ({
      ...q,
      id: q.id ?? generateId(),
    }));

    if (questions.some((q) => !q.imageUrl)) {
      throw new Error('API returned questions without a live image');
    }

    void writeCache(category, difficulty, questions);
    void persistRecentPlay(category, difficulty);

    return { questions, fromCache: false };
  }

  /**
   * Silently refresh cached questions for recently played category+difficulty
   * pairs whose cache is older than CACHE_REFRESH_THRESHOLD_MS (12 h).
   *
   * Designed to be called fire-and-forget on app foreground — it never throws
   * and never blocks the UI.  If the network is unavailable the fetch simply
   * fails silently and the existing (possibly expired) cache remains intact.
   */
  async warmCache(): Promise<void> {
    try {
      const plays = await readRecentPlays();
      if (plays.length === 0) return;

      for (const { category, difficulty } of plays) {
        try {
          // Check how old the current cache entry is without running the full
          // readCache() path (which returns null for expired entries).
          const raw = await AsyncStorage.getItem(cacheKey(category, difficulty));
          const age = raw
            ? Date.now() - (JSON.parse(raw) as CacheEntry).savedAt
            : Infinity;

          // Skip if the cache is still fresh enough.
          if (age < CACHE_REFRESH_THRESHOLD_MS) continue;

          if (__DEV__) {
            console.log(
              `[CacheWarm] refreshing ${category}/${difficulty} (age ${Math.round(age / 3_600_000)}h)`,
            );
          }

          // Re-fetch questions — on success writeCache is called inside
          // generateQuestions, so the cache gets updated automatically.
          await this.generateQuestions(category, difficulty);
        } catch {
          // Per-entry failure is silent; move on to the next entry.
        }
      }
    } catch {
      // Top-level failure is also silent.
    }
  }
}

export const openAIService = OpenAIService.getInstance();
export default OpenAIService;
