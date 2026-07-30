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
   */
  async generateImage(prompt: string): Promise<GeneratedImage> {
    try {
      const response = await fetch(`${API_BASE}/api/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Image API responded with ${response.status}`);
      }

      const data = (await response.json()) as { url: string | null };

      return {
        url: data.url ?? `https://picsum.photos/seed/${encodeURIComponent(prompt)}/400/400`,
        prompt,
      };
    } catch (err) {
      console.warn('[OpenAIService] generateImage failed, using picsum fallback:', err);
      return {
        url: `https://picsum.photos/seed/${encodeURIComponent(prompt)}/400/400`,
        prompt,
      };
    }
  }

  /**
   * Generate a set of quiz questions via the API server.
   * The server automatically selects the best available AI provider
   * (Gemini → Groq → OpenAI → Claude → Zhipu for text; OpenAI DALL-E →
   * Stable Diffusion for images) and falls back to picsum placeholders
   * when no image provider is configured.
   * Falls back to local mock data if the API server is unreachable.
   */
  async generateQuestions(
    category: Category,
    difficulty: Difficulty,
    count = 20,
  ): Promise<Question[]> {
    try {
      const response = await fetch(`${API_BASE}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, difficulty, count }),
      });

      if (!response.ok) {
        throw new Error(`Questions API responded with ${response.status}`);
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
    } catch (err) {
      console.warn('[OpenAIService] generateQuestions failed, using local fallback:', err);
      return this.generateFallbackQuestions(category, difficulty, count);
    }
  }

  // ─── Local fallback (used only when the API server is unreachable) ──────────

  private generateFallbackQuestions(
    category: Category,
    difficulty: Difficulty,
    count: number,
  ): Question[] {
    const MOCK_ANSWERS: Record<Category, string[]> = {
      nature: ['Mountain', 'Ocean', 'Forest', 'Desert', 'Waterfall', 'Canyon', 'Lake', 'Volcano'],
      animals: ['Lion', 'Elephant', 'Dolphin', 'Eagle', 'Tiger', 'Giraffe', 'Penguin', 'Wolf'],
      food: ['Pizza', 'Sushi', 'Burger', 'Tacos', 'Pasta', 'Cake', 'Ice Cream', 'Ramen'],
      landmarks: ['Eiffel Tower', 'Pyramids', 'Colosseum', 'Taj Mahal', 'Big Ben', 'Machu Picchu', 'Sphinx', 'Stonehenge'],
      technology: ['Laptop', 'Smartphone', 'Robot', 'Drone', 'Keyboard', 'Camera', 'Console', 'Satellite'],
      art: ['Mona Lisa', 'The Starry Night', 'Sculpture', 'Watercolor', 'Palette', 'Portrait', 'Mural', 'Tapestry'],
      vehicles: ['Bicycle', 'Airplane', 'Submarine', 'Motorcycle', 'Train', 'Rocket', 'Sailboat', 'Helicopter'],
      celebrities: ['Actor', 'Singer', 'Athlete', 'Director', 'Comedian', 'Dancer', 'Writer', 'Chef'],
      history: ['Castle', 'Crown', 'Ancient Coin', 'Scroll', 'Armor', 'Compass', 'Map', 'Torch'],
      space: ['Planet', 'Moon', 'Galaxy', 'Astronaut', 'Comet', 'Black Hole', 'Nebula', 'Telescope'],
      cities: ['Paris', 'Tokyo', 'New York', 'London', 'Dubai', 'Sydney', 'Rome', 'Singapore'],
      sports: ['Football', 'Basketball', 'Tennis', 'Swimming', 'Golf', 'Boxing', 'Baseball', 'Skiing'],
      movies: ['Star Wars', 'The Matrix', 'Inception', 'Titanic', 'Avatar', 'Jurassic Park', 'Frozen', 'Avengers'],
      music: ['Guitar', 'Piano', 'Drums', 'Violin', 'Microphone', 'Trumpet', 'Saxophone', 'Harp'],
      science: ['DNA', 'Atom', 'Telescope', 'Microscope', 'Robot', 'Rocket', 'Brain', 'Crystal'],
    };

    const blurLevel = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 14 : 20;
    const answers = MOCK_ANSWERS[category];

    return Array.from({ length: count }, (_, i) => {
      const answer = answers[i % answers.length] ?? 'Unknown';
      const seed = `${category}-${difficulty}-${i}`;
      const distractors = answers.filter((o) => o !== answer).slice(0, 3);
      const options = [answer, ...distractors].sort(() => (i % 2 === 0 ? 1 : -1));
      return {
        id: generateId(),
        imageUrl: `https://picsum.photos/seed/${seed}/400/400`,
        answer,
        options,
        correctIndex: options.indexOf(answer),
        funFact: `${answer} is a fascinating part of the ${category} world.`,
        hints: [
          `Starts with the letter "${answer[0] ?? '?'}"`,
          `It has ${answer.length} characters`,
          `It belongs to the ${category} category`,
        ],
        category,
        difficulty,
        blurLevel,
      };
    });
  }
}

export const openAIService = OpenAIService.getInstance();
export default OpenAIService;
