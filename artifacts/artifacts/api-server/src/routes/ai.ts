import { Router } from "express";
import { HttpError } from "../services/ai/errors";
import { editImageWithFallback, generateImageWithFallback, generateQuestionsWithFallback, getProviderStatus } from "../services/ai/manager";
import { generateSpeedCardRound, parseSpeedCardDifficulty } from "../services/ai/speedCardRound";
import type { Difficulty, ImageStyle } from "../services/ai/types";

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
    const { prompt, style, editPrompt, optionPrompts } = req.body as {
      prompt?: string;
      style?: ImageStyle;
      editPrompt?: string;
      optionPrompts?: string[];
    };

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      res.status(400).json({ error: "prompt is required and must be a non-empty string" });
      return;
    }

    const imageStyle: ImageStyle = style === "cartoon" ? "cartoon" : "default";
    const options = { style: imageStyle };

    const { url, providerUsed } = await generateImageWithFallback(prompt.trim(), options);
    if (!url) {
      throw new HttpError(502, "OpenAI returned no image");
    }

    const shouldEdit = typeof editPrompt === "string" && editPrompt.trim().length > 0;
    const thumbPrompts = Array.isArray(optionPrompts)
      ? optionPrompts
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .slice(0, 4)
      : [];

    const [edited, optionUrls] = await Promise.all([
      shouldEdit
        ? editImageWithFallback(url, editPrompt.trim(), options).then((result) => {
            if (!result.url) throw new HttpError(502, "OpenAI returned no edited image");
            return result.url;
          })
        : Promise.resolve(undefined),
      thumbPrompts.length > 0
        ? Promise.all(
            thumbPrompts.map(async (item) => {
              const generated = await generateImageWithFallback(item.trim(), options);
              if (!generated.url) {
                throw new HttpError(502, "OpenAI returned no option image");
              }
              return generated.url;
            }),
          )
        : Promise.resolve(undefined),
    ]);

    res.json({ url, provider: providerUsed, editedUrl: edited, optionUrls });
  } catch (err) {
    next(err);
  }
});

router.get("/ai-status", (_req, res) => {
  res.json(getProviderStatus());
});

router.post("/speed-card/round", async (req, res, next) => {
  try {
    const difficulty = parseSpeedCardDifficulty((req.body as { difficulty?: unknown } | undefined)?.difficulty);
    const round = await generateSpeedCardRound(difficulty);
    res.json(round);
  } catch (err) {
    next(err);
  }
});

export default router;
