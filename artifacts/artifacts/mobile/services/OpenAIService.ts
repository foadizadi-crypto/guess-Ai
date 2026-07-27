import type { Category, Difficulty, Question } from '@/types';
import { generateId } from '@/utils';

// ─── Types ────────────────────────────────────────────────────────────────

export interface GeneratedImage {
  url: string;
  prompt: string;
}

// ─── Mock answer data per category ────────────────────────────────────────

const MOCK_ANSWERS: Record<Category, string[]> = {
  nature: ['Mountain', 'Ocean', 'Forest', 'Desert', 'Waterfall', 'Canyon', 'Lake', 'Volcano'],
  animals: ['Lion', 'Elephant', 'Dolphin', 'Eagle', 'Tiger', 'Giraffe', 'Penguin', 'Wolf'],
  food: ['Pizza', 'Sushi', 'Burger', 'Tacos', 'Pasta', 'Cake', 'Ice Cream', 'Ramen'],
  landmarks: ['Eiffel Tower', 'Pyramids', 'Colosseum', 'Taj Mahal', 'Big Ben', 'Machu Picchu', 'Sphinx', 'Stonehenge'],
  technology: ['Laptop', 'Smartphone', 'Robot', 'Drone', 'Keyboard', 'Camera', 'Console', 'Satellite'],
  art: ['Mona Lisa', 'The Starry Night', 'Sculpture', 'Watercolor', 'Palette', 'Portrait', 'Mural', 'Sculpture'],
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

const getBlurLevel = (difficulty: Difficulty): number => {
  if (difficulty === 'easy') return 8;
  if (difficulty === 'medium') return 14;
  return 20;
};

// ─── Service class ────────────────────────────────────────────────────────

class OpenAIService {
  private static instance: OpenAIService;

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Generate an image from a text prompt.
   * Currently returns mocked data — no API key required.
   */
  async generateImage(prompt: string): Promise<GeneratedImage> {
    await this.simulateDelay(400);
    return {
      url: `https://picsum.photos/seed/${encodeURIComponent(prompt)}/400/400`,
      prompt,
    };
  }

  /**
   * Generate a set of quiz questions for a category and difficulty.
   * Currently returns mocked data — no API key required.
   */
  async generateQuestions(
    category: Category,
    difficulty: Difficulty,
    count = 20,
  ): Promise<Question[]> {
    await this.simulateDelay(300);

    const answers = MOCK_ANSWERS[category];
    const blurLevel = getBlurLevel(difficulty);

    return Array.from({ length: count }, (_, i) => {
      const answer = answers[i % answers.length] ?? 'Unknown';
      const seed = `${category}-${difficulty}-${i}`;
      const distractors = answers
        .filter((option) => option !== answer)
        .slice(0, 3);
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

  private simulateDelay(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}

export const openAIService = OpenAIService.getInstance();
export default OpenAIService;
