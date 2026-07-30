import { logger } from "../../lib/logger";
import { classifyError, type ProviderError } from "./errors";
import { getHealthSnapshot, isOnCooldown, recordFailure, recordSuccess } from "./health";
import { buildQuestionUserPrompt, extractJson, QUESTION_SYSTEM_PROMPT, QuestionsResponseSchema } from "./prompts";
import { createAnthropicTextProvider } from "./providers/text/anthropic";
import { createGeminiTextProvider } from "./providers/text/gemini";
import { createGroqTextProvider } from "./providers/text/groq";
import { createOpenAiTextProvider } from "./providers/text/openai";
import { createZhipuTextProvider } from "./providers/text/zhipu";
import { createOpenAiImageProvider } from "./providers/image/openai-image";
import { createStableDiffusionImageProvider } from "./providers/image/stable-diffusion";
import type { ImageProvider, QuestionGenParams, RawQuestion, TextProvider } from "./types";

// ── AI_MODE ──────────────────────────────────────────────────────────────
// "auto" (default): try providers in priority order below, falling back
// automatically when one is unavailable, out of quota, or errors out.
// Set AI_MODE to a specific provider id (e.g. "gemini", "groq", "openai",
// "anthropic", "zhipu", "openai-image", "stable-diffusion") to pin
// generation to that single provider — useful for testing one provider in
// isolation. It still falls back to the built-in mock generator if the
// pinned provider fails, since the game must never hard-fail.
const AI_MODE = process.env["AI_MODE"]?.trim().toLowerCase() || "auto";

// Priority order: prefer free/fast providers first, OpenAI as the proven
// reliable middle option, Claude last (highest quality, priciest). Zhipu
// (GLM) is appended as an extra low-cost option beyond the requested chain.
const TEXT_PROVIDERS: TextProvider[] = [
  createGeminiTextProvider(),
  createGroqTextProvider(),
  createOpenAiTextProvider(),
  createAnthropicTextProvider(),
  createZhipuTextProvider(),
];

// Highest quality first; Stable Diffusion (Hugging Face) is the free/open
// fallback when OpenAI Image is unavailable or out of quota.
const IMAGE_PROVIDERS: ImageProvider[] = [
  createOpenAiImageProvider(),
  createStableDiffusionImageProvider(),
];

function orderedProviders<T extends { id: string }>(providers: T[]): T[] {
  if (AI_MODE === "auto") return providers;
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

/**
 * Tries each configured text provider in priority order until one returns a
 * valid question set. Returns an empty result (providerUsed: null) if every
 * provider is unconfigured, on cooldown, or fails — callers are expected to
 * fall back to a local mock at that point so the game never hard-fails.
 */
export async function generateQuestionsWithFallback(params: QuestionGenParams): Promise<QuestionGenResult> {
  const candidates = availableProviders(orderedProviders(TEXT_PROVIDERS));

  if (candidates.length === 0) {
    logger.warn({ aiMode: AI_MODE }, "Question generation: no text providers configured — using mock fallback");
    return { questions: [], providerUsed: null };
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
        `Question generation: "${provider.label}" failed (${classified.kind}) — trying next provider`,
      );
    }
  }

  logger.error(
    { lastError: lastError?.message },
    "Question generation: all configured text providers failed — using mock fallback",
  );
  return { questions: [], providerUsed: null };
}

export interface ImageGenResult {
  url: string | null;
  providerUsed: string | null;
}

/**
 * Tries each configured image provider in priority order. Returns
 * (url: null, providerUsed: null) if none succeed — callers fall back to a
 * picsum.photos placeholder so a question never ships without an image.
 */
export async function generateImageWithFallback(prompt: string): Promise<ImageGenResult> {
  const candidates = availableProviders(orderedProviders(IMAGE_PROVIDERS));

  if (candidates.length === 0) {
    logger.warn({ aiMode: AI_MODE }, "Image generation: no image providers configured — using mock fallback");
    return { url: null, providerUsed: null };
  }

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
      recordFailure(provider.id, classified.kind, classified.message);
      logger.warn(
        { provider: provider.id, kind: classified.kind },
        `Image generation: "${provider.label}" failed (${classified.kind}) — trying next provider`,
      );
    }
  }

  logger.warn("Image generation: all configured image providers failed — using mock fallback");
  return { url: null, providerUsed: null };
}

/** Snapshot of provider configuration + cooldown state, used by GET /api/ai-status. */
export function getProviderStatus() {
  return {
    aiMode: AI_MODE,
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
