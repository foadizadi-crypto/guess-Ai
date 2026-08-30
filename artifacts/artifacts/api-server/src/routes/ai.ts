import { Router } from "express";
import { HttpError } from "../services/ai/errors";
import { generateImageWithFallback, generateQuestionsWithFallback, getProviderStatus } from "../services/ai/manager";
import { generateSpeedCardRound } from "../services/ai/speedCardRound";
import type { Difficulty } from "../services/ai/types";

const router: Router = Router();

const BLUR_LEVEL: Record<string, number> = {
  easy: 8,
  medium: 14,
  hard: 20,
};

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

router.post("/questions", async (req, res, next) => {
  try {
    const { category = "nature", difficulty = "medium", count = 10 } = req.body as {
      category?: string;
      difficulty?: string;
      count?: number;
    };

    const safeCount = Math.min(Math.max(1, Number(count) || 10), 20);
    const blurLevel = BLUR_LEVEL[difficulty] ?? 14;
    const subjectCount = 8;

    const { questions: aiQuestions, providerUsed: textProvider } = await generateQuestionsWithFallback({
      category,
      difficulty: difficulty as Difficulty,
      count: subjectCount,
    });

    const subject = aiQuestions[0];
    if (!subject) {
      throw new HttpError(502, "OpenAI returned no questions");
    }

    const decoySet = new Set<string>();
    subject.options.forEach((o) => { if (o !== subject.answer) decoySet.add(o); });
    aiQuestions.slice(1).forEach((q) => {
      if (q.answer !== subject.answer) decoySet.add(q.answer);
      q.options.forEach((o) => { if (o !== subject.answer) decoySet.add(o); });
    });
    const decoys = shuffleArray([...decoySet]);

    const { url: imageUrl, providerUsed: imageProvider } = await generateImageWithFallback(subject.imagePrompt);
    if (!imageUrl) {
      throw new HttpError(502, "OpenAI returned no image");
    }

    const questions = Array.from({ length: safeCount }, (_, index) => {
      const picked: string[] = [];
      for (let k = 0; picked.length < 3 && k < decoys.length * 2; k += 1) {
        const candidate = decoys[(index * 3 + k) % decoys.length];
        if (candidate && !picked.includes(candidate)) picked.push(candidate);
      }
      const options = shuffleArray([subject.answer, ...picked]);
      return {
        id: `q_${Date.now()}_${index}`,
        imageUrl,
        answer: subject.answer,
        options,
        correctIndex: Math.max(0, options.indexOf(subject.answer)),
        funFact: subject.funFact,
        hints: subject.hints,
        category,
        difficulty,
        blurLevel,
      };
    });

    res.json({
      questions,
      meta: { textProvider, imageProvider, roundSubject: subject.answer },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/images", async (req, res, next) => {
  try {
    const { prompt } = req.body as { prompt?: string };

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      res.status(400).json({ error: "prompt is required and must be a non-empty string" });
      return;
    }

    const { url, providerUsed } = await generateImageWithFallback(prompt.trim());
    if (!url) {
      throw new HttpError(502, "OpenAI returned no image");
    }

    res.json({ url, provider: providerUsed });
  } catch (err) {
    next(err);
  }
});

router.get("/ai-status", (_req, res) => {
  res.json(getProviderStatus());
});

router.post("/speed-card/round", async (_req, res, next) => {
  try {
    const round = await generateSpeedCardRound();
    res.json(round);
  } catch (err) {
    next(err);
  }
});

export default router;
