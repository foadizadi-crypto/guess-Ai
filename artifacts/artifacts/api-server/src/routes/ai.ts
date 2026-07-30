import { Router } from "express";
import { logger } from "../lib/logger";
import { generateImageWithFallback, generateQuestionsWithFallback, getProviderStatus } from "../services/ai/manager";
import type { Difficulty, RawQuestion } from "../services/ai/types";

const router: Router = Router();

const BLUR_LEVEL: Record<string, number> = {
  easy: 8,
  medium: 14,
  hard: 20,
};

// Built-in, dependency-free mock question generator. This is the absolute
// last line of defense: even with zero AI providers configured (or all of
// them failing), the endpoint still returns a valid, playable question set.
const MOCK_ANSWERS: Record<string, string[]> = {
  nature: ["Mountain Peak", "Ocean Wave", "Rainforest", "Sand Dune"],
  animals: ["Lion", "Elephant", "Dolphin", "Eagle"],
  food: ["Sushi Bowl", "Margherita Pizza", "Tacos", "Croissant"],
  landmarks: ["Eiffel Tower", "Great Wall", "Pyramids of Giza", "Statue of Liberty"],
};

function generateMockQuestions(category: string, difficulty: string, count: number): RawQuestion[] {
  const pool = MOCK_ANSWERS[category] ?? ["Mystery Object", "Hidden Item", "Unknown Subject", "Secret Thing"];
  return Array.from({ length: count }, (_, i) => {
    const answer = pool[i % pool.length] ?? "Unknown";
    const distractors = pool.filter((a) => a !== answer).slice(0, 3);
    const options = [answer, ...distractors];
    while (options.length < 4) options.push(`Option ${options.length + 1}`);
    return {
      answer,
      options,
      correctIndex: 0,
      funFact: `${answer} is a fascinating part of the ${category} category.`,
      hints: [
        `It belongs to the ${category} category`,
        `This is a ${difficulty}-difficulty question`,
        `Starts with "${answer.charAt(0)}"`,
      ],
      imagePrompt: answer,
    };
  });
}

// ─── POST /api/questions ────────────────────────────────────────────────────
// Generates quiz questions via the AI Manager, which tries every configured
// text provider in priority order (Gemini → Groq → OpenAI → Claude → Zhipu,
// unless AI_MODE pins one) before falling back to the local mock generator.
// Images are generated the same way (OpenAI → Stable Diffusion → picsum).
router.post("/questions", async (req, res, next) => {
  try {
    const { category = "nature", difficulty = "medium", count = 10 } = req.body as {
      category?: string;
      difficulty?: string;
      count?: number;
    };

    const safeCount = Math.min(Math.max(1, Number(count) || 10), 20);
    const blurLevel = BLUR_LEVEL[difficulty] ?? 14;

    const { questions: aiQuestions, providerUsed: textProvider } = await generateQuestionsWithFallback({
      category,
      difficulty: difficulty as Difficulty,
      count: safeCount,
    });

    const usingMock = aiQuestions.length === 0;
    const source = usingMock ? generateMockQuestions(category, difficulty, safeCount) : aiQuestions;

    if (usingMock) {
      logger.warn({ category, difficulty }, "Question generation: serving built-in mock questions");
    }

    const questions = await Promise.all(
      source.map(async (q, index) => {
        const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(q.answer)}/400/400`;
        const { url } = await generateImageWithFallback(q.imagePrompt);
        return {
          id: `q_${Date.now()}_${index}`,
          imageUrl: url ?? fallbackUrl,
          answer: q.answer,
          options: q.options,
          correctIndex: q.correctIndex,
          funFact: q.funFact,
          hints: q.hints,
          category,
          difficulty,
          blurLevel,
        };
      }),
    );

    res.json({ questions, meta: { textProvider: textProvider ?? "mock" } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/images ───────────────────────────────────────────────────────
// Generates a single image from a text prompt via the AI Manager.
router.post("/images", async (req, res, next) => {
  try {
    const { prompt } = req.body as { prompt?: string };

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      res.status(400).json({ error: "prompt is required and must be a non-empty string" });
      return;
    }

    const trimmedPrompt = prompt.trim();
    const { url, providerUsed } = await generateImageWithFallback(trimmedPrompt);
    const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(trimmedPrompt)}/400/400`;

    res.json({ url: url ?? fallbackUrl, provider: providerUsed ?? "mock" });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/ai-status ─────────────────────────────────────────────────────
// Read-only introspection of which providers are configured, which are on
// cooldown, and the active AI_MODE — useful for confirming a newly-added key
// is picked up without spending a real generation call.
router.get("/ai-status", (_req, res) => {
  res.json(getProviderStatus());
});

export default router;
