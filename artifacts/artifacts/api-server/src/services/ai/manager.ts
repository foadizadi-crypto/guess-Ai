import { logger } from "../../lib/logger";
import { classifyError, HttpError, type ProviderError } from "./errors";
import { getHealthSnapshot, isOnCooldown, recordFailure, recordSuccess } from "./health";
import { buildQuestionUserPrompt, extractJson, QUESTION_SYSTEM_PROMPT, QuestionsResponseSchema } from "./prompts";
import { createOpenAiTextProvider } from "./providers/text/openai";
import { createOpenAiImageProvider } from "./providers/image/openai-image";
import type { ImageProvider, QuestionGenParams, RawQuestion, TextProvider } from "./types";

const AI_MODE = process.env["AI_MODE"]?.trim().toLowerCase() || "openai";

const TEXT_PROVIDERS: TextProvider[] = [createOpenAiTextProvider()];
const IMAGE_PROVIDERS: ImageProvider[] = [createOpenAiImageProvider()];

function orderedProviders<T extends { id: string }>(providers: T[]): T[] {
  if (AI_MODE === "auto" || AI_MODE === "openai") return providers;
  const forced = providers.find((p) => p.id === AI_MODE);
  return forced ? [forced] : providers;
}

function availableProviders<T extends { id: string; isConfigured(): boolean }>(providers: T[]): T[] {
  return providers.filter((p) => p.isConfigured());
}

export interface QuestionGenResult {
  questions: RawQuestion[];
  providerUsed: string | null;
}

export async function generateQuestionsWithFallback(params: QuestionGenParams): Promise<QuestionGenResult> {
  const candidates = availableProviders(orderedProviders(TEXT_PROVIDERS));

  if (candidates.length === 0) {
    throw new HttpError(503, "OPENAI_API_KEY is not configured on the API server");
  }

  const user = buildQuestionUserPrompt(params);
  let lastError: ProviderError | null = null;

  for (const provider of candidates) {
    if (isOnCooldown(provider.id)) {
      logger.info({ provider: provider.id }, `Question generation: skipping "${provider.label}" (on cooldown)`);
      continue;
    }

    logger.info({ provider: provider.id }, `Question generation: trying "${provider.label}"`);

    try {
      const raw = await provider.complete({ system: QUESTION_SYSTEM_PROMPT, user });
      const json = extractJson(raw);
      const validated = QuestionsResponseSchema.parse(json);

      if (validated.questions.length === 0) {
        throw new Error("Provider returned zero questions");
      }

      recordSuccess(provider.id);
      logger.info(
        { provider: provider.id, count: validated.questions.length },
        `Question generation: using "${provider.label}"`,
      );
      return { questions: validated.questions, providerUsed: provider.id };
    } catch (err) {
      const classified = classifyError(provider.id, err);
      lastError = classified;
      recordFailure(provider.id, classified.kind, classified.message);
      logger.warn(
        { provider: provider.id, kind: classified.kind },
        `Question generation: "${provider.label}" failed (${classified.kind})`,
      );
    }
  }

  throw new HttpError(
    502,
    lastError?.message ?? "OpenAI question generation failed",
  );
}

export interface ImageGenResult {
  url: string | null;
  providerUsed: string | null;
}

export async function generateImageWithFallback(prompt: string): Promise<ImageGenResult> {
  const candidates = availableProviders(orderedProviders(IMAGE_PROVIDERS));

  if (candidates.length === 0) {
    throw new HttpError(503, "OPENAI_API_KEY is not configured on the API server");
  }

  let lastMessage: string | null = null;

  for (const provider of candidates) {
    if (isOnCooldown(provider.id)) {
      logger.info({ provider: provider.id }, `Image generation: skipping "${provider.label}" (on cooldown)`);
      continue;
    }

    logger.info({ provider: provider.id }, `Image generation: trying "${provider.label}"`);

    try {
      const url = await provider.generateImage(prompt);
      recordSuccess(provider.id);
      logger.info({ provider: provider.id }, `Image generation: using "${provider.label}"`);
      return { url, providerUsed: provider.id };
    } catch (err) {
      const classified = classifyError(provider.id, err);
      lastMessage = classified.message;
      recordFailure(provider.id, classified.kind, classified.message);
      logger.warn(
        { provider: provider.id, kind: classified.kind },
        `Image generation: "${provider.label}" failed (${classified.kind})`,
      );
    }
  }

  throw new HttpError(502, lastMessage ?? "OpenAI image generation failed");
}

export function getProviderStatus() {
  return {
    aiMode: AI_MODE,
    openaiConfigured: Boolean(process.env["OPENAI_API_KEY"]),
    text: TEXT_PROVIDERS.map((p) => ({
      id: p.id,
      label: p.label,
      envKey: p.envKey,
      configured: p.isConfigured(),
      onCooldown: isOnCooldown(p.id),
    })),
    image: IMAGE_PROVIDERS.map((p) => ({
      id: p.id,
      label: p.label,
      envKey: p.envKey,
      configured: p.isConfigured(),
      onCooldown: isOnCooldown(p.id),
    })),
    cooldowns: getHealthSnapshot(),
  };
}
