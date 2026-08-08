import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Category, Difficulty, Question } from '@/types';
import { generateId } from '@/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface GenerateQuestionsResult {
  questions: Question[];
  fromCache: boolean;
}

// ─── Cache helpers ─────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  questions: Question[];
  savedAt: number; // epoch ms
}

function cacheKey(category: Category, difficulty: Difficulty): string {
  return `question_cache_${category}_${difficulty}`;
}

async function readCache(
  category: Category,
  difficulty: Difficulty,
): Promise<Question[] | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(category, difficulty));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.savedAt > CACHE_TTL_MS) return null; // expired
    if (!Array.isArray(entry.questions) || entry.questions.length === 0) return null;
    return entry.questions;
  } catch {
    return null;
  }
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

// ─── API base URL ─────────────────────────────────────────────────────────────
// On Replit: EXPO_PUBLIC_API_URL is injected by the dev script as
//   https://$REPLIT_DEV_DOMAIN:8080
// For local development outside Replit: falls back to localhost:8080.

const API_BASE: string =
  (typeof process !== 'undefined' && process.env['EXPO_PUBLIC_API_URL']) ||
  'http://localhost:8080';

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
    const response = await fetch(`${API_BASE}/api/images`, {
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
   * Generate a set of quiz questions via the API server.
   *
   * On success: persists the result to AsyncStorage (keyed by category+difficulty)
   * and returns { questions, fromCache: false }.
   *
   * On API failure: loads the cached set if one exists and returns
   * { questions, fromCache: true }. Throws only when the cache is also empty.
   */
  async generateQuestions(
    category: Category,
    difficulty: Difficulty,
    count = 20,
  ): Promise<GenerateQuestionsResult> {
    try {
      const response = await fetch(`${API_BASE}/api/questions`, {
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

      // Ensure every question has a local ID (server already sets one, but be defensive)
      const questions = data.questions.map((q) => ({
        ...q,
        id: q.id ?? generateId(),
      }));

      // Persist to cache for offline use
      void writeCache(category, difficulty, questions);

      return { questions, fromCache: false };
    } catch (networkErr) {
      // API unreachable or returned an error — try the local cache
      const cached = await readCache(category, difficulty);
      if (cached && cached.length > 0) {
        return { questions: cached, fromCache: true };
      }
      // No cache available — re-throw so the UI can show an error
      throw networkErr;
    }
  }
}

export const openAIService = OpenAIService.getInstance();
export default OpenAIService;
