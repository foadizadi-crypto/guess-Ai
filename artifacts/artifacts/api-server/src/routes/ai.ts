import { Router } from "express";
import { logger } from "../lib/logger";
import { generateImageWithFallback, generateQuestionsWithFallback, getProviderStatus } from "../services/ai/manager";
import type { Difficulty } from "../services/ai/types";

const router: Router = Router();

const BLUR_LEVEL: Record<string, number> = {
  easy: 8,
  medium: 14,
  hard: 20,
};

// ─── POST /api/questions ────────────────────────────────────────────────────
// Generates quiz questions via the AI Manager (Gemini → Groq → OpenAI → …).
// Returns 503 if every configured text provider fails — no mock fallback.
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

    if (aiQuestions.length === 0) {
      logger.error({ category, difficulty }, "Question generation: all providers failed — no questions generated");
      res.status(503).json({ error: "AI question generation is currently unavailable. Please check your API keys and try again." });
      return;
    }

    const questions = await Promise.all(
      aiQuestions.map(async (q, index) => {
        const { url } = await generateImageWithFallback(q.imagePrompt);
        return {
          id: `q_${Date.now()}_${index}`,
          imageUrl: url ?? null,
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

    res.json({ questions, meta: { textProvider } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/images ───────────────────────────────────────────────────────
// Generates a single image from a text prompt via the AI Manager.
// Returns 503 if every configured image provider fails — no picsum fallback.
router.post("/images", async (req, res, next) => {
  try {
    const { prompt } = req.body as { prompt?: string };

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      res.status(400).json({ error: "prompt is required and must be a non-empty string" });
      return;
    }

    const trimmedPrompt = prompt.trim();
    const { url, providerUsed } = await generateImageWithFallback(trimmedPrompt);

    if (!url) {
      logger.warn({ prompt: trimmedPrompt }, "Image generation: all providers failed — no image generated");
      res.status(503).json({ error: "AI image generation is currently unavailable. Please check your API keys and try again." });
      return;
    }

    res.json({ url, provider: providerUsed });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/ai-status ─────────────────────────────────────────────────────
router.get("/ai-status", (_req, res) => {
  res.json(getProviderStatus());
});

export default router;
