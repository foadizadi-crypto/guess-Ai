import { Router } from "express";
import OpenAI from "openai";
import { logger } from "../lib/logger";

const router: Router = Router();

function getOpenAI(): OpenAI {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey });
}

const BLUR_LEVEL: Record<string, number> = {
  easy: 8,
  medium: 14,
  hard: 20,
};

// ─── POST /api/questions ──────────────────────────────────────────────────────
// Generates quiz questions via GPT-4o, then generates images via DALL-E 3.
// Falls back to a picsum placeholder if a DALL-E call fails (rate limit, etc.)
router.post("/questions", async (req, res, next) => {
  try {
    const { category = "nature", difficulty = "medium", count = 10 } = req.body as {
      category?: string;
      difficulty?: string;
      count?: number;
    };

    const safeCount = Math.min(Math.max(1, Number(count) || 10), 20);
    const blurLevel = BLUR_LEVEL[difficulty] ?? 14;

    const openai = getOpenAI();

    // ── Step 1: GPT-4o question metadata ─────────────────────────────────────
    logger.info({ category, difficulty, count: safeCount }, "Generating questions with GPT-4o");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a quiz generator for BlurQuiz, a mobile image-guessing game where players identify progressively un-blurred images. Return only valid JSON.",
        },
        {
          role: "user",
          content: `Generate exactly ${safeCount} unique quiz questions for the "${category}" category at "${difficulty}" difficulty.

Return a JSON object with a "questions" array. Each item must have:
- "answer": string — the thing shown in the image (e.g. "Eiffel Tower", "Lion", "Sushi Bowl")
- "options": string[] — exactly 4 options including the correct answer, shuffled randomly
- "correctIndex": number — 0-based index of the correct answer in "options"
- "funFact": string — one interesting sentence about the answer
- "hints": string[] — exactly 3 hints ordered vague→specific; do NOT reveal the answer
- "imagePrompt": string — a concise DALL-E 3 prompt for a clear, photorealistic image of the answer with plain background

All answers must be distinct and suitable for ${difficulty} difficulty.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
    });

    type RawQuestion = {
      answer: string;
      options: string[];
      correctIndex: number;
      funFact: string;
      hints: string[];
      imagePrompt: string;
    };

    const parsed = JSON.parse(completion.choices[0]?.message.content ?? "{}") as {
      questions?: RawQuestion[];
    };
    const rawQuestions: RawQuestion[] = Array.isArray(parsed.questions)
      ? parsed.questions
      : [];

    logger.info({ count: rawQuestions.length }, "GPT-4o questions generated");

    // ── Step 2: DALL-E 3 images (concurrent, graceful fallback) ──────────────
    const questions = await Promise.all(
      rawQuestions.map(async (q, index) => {
        const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(q.answer)}/400/400`;
        let imageUrl = fallbackUrl;

        try {
          const imgResponse = await openai.images.generate({
            model: "dall-e-2",
            prompt: `${q.imagePrompt}. Photorealistic, vivid colors, centered subject, clean background, no text.`,
            n: 1,
            size: "512x512",
          });
          imageUrl = imgResponse.data[0]?.url ?? fallbackUrl;
          logger.info({ answer: q.answer }, "DALL-E 3 image generated");
        } catch (imgErr) {
          logger.warn(
            { err: imgErr, answer: q.answer },
            "DALL-E 3 image generation failed — using picsum fallback",
          );
        }

        return {
          id: `q_${Date.now()}_${index}`,
          imageUrl,
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

    res.json({ questions });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/images ─────────────────────────────────────────────────────────
// Generates a single image from a text prompt using DALL-E 3.
router.post("/images", async (req, res, next) => {
  try {
    const { prompt } = req.body as { prompt?: string };

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      res.status(400).json({ error: "prompt is required and must be a non-empty string" });
      return;
    }

    const openai = getOpenAI();

    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: `${prompt.trim()}. Photorealistic, vivid colors, centered subject, clean background, no text.`,
      n: 1,
      size: "512x512",
    });

    const url = response.data[0]?.url ?? null;
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

export default router;
