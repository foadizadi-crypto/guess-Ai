import { z } from "zod";
import type { QuestionGenParams } from "./types";

export const QuestionSchema = z.object({
  answer: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  funFact: z.string().min(1),
  hints: z.array(z.string().min(1)).length(3),
  imagePrompt: z.string().min(1),
});

export const QuestionsResponseSchema = z.object({
  questions: z.array(QuestionSchema),
});

export const QUESTION_SYSTEM_PROMPT =
  "You are a quiz generator for BlurQuiz, a mobile image-guessing game where players identify progressively un-blurred images. Always respond with a single valid JSON object and nothing else — no markdown fences, no commentary.";

export function buildQuestionUserPrompt({ category, difficulty, count }: QuestionGenParams): string {
  return `Generate exactly ${count} unique quiz questions for the "${category}" category at "${difficulty}" difficulty.

Return a JSON object of the exact shape:
{"questions": [{"answer": string, "options": string[4], "correctIndex": number, "funFact": string, "hints": string[3], "imagePrompt": string}]}

Field rules:
- "answer": the thing shown in the image (e.g. "Eiffel Tower", "Lion", "Sushi Bowl")
- "options": exactly 4 options including the correct answer, shuffled randomly
- "correctIndex": 0-based index of the correct answer in "options"
- "funFact": one interesting sentence about the answer
- "hints": exactly 3 hints ordered vague to specific; do NOT reveal the answer
- "imagePrompt": a concise prompt for a clear, photorealistic image of the answer with a plain background

All answers must be distinct and suitable for ${difficulty} difficulty. Respond with JSON only.`;
}

/**
 * Extracts a JSON object from a raw LLM response, tolerating the common
 * case where a model wraps its JSON in markdown fences despite instructions.
 */
export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced && fenced[1] ? fenced[1] : trimmed;
  return JSON.parse(candidate);
}
