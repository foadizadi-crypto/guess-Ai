import type { Category, Difficulty, Question } from '@/types';
import { generateId } from '@/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedImage {
  url: string;
  prompt: string;
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
   * Throws if the server is unavailable or all AI providers fail — no local mock fallback.
   */
  async generateQuestions(
    category: Category,
    difficulty: Difficulty,
    count = 20,
  ): Promise<Question[]> {
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
    return data.questions.map((q) => ({
      ...q,
      id: q.id ?? generateId(),
    }));
  }
}

export const openAIService = OpenAIService.getInstance();
export default OpenAIService;
