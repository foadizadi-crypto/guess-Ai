export type Difficulty = "easy" | "medium" | "hard";

export interface RawQuestion {
  answer: string;
  options: string[];
  correctIndex: number;
  funFact: string;
  hints: string[];
  imagePrompt: string;
}

export interface QuestionGenParams {
  category: string;
  difficulty: Difficulty;
  count: number;
}

/**
 * A text-generation provider. Providers only need to turn a system/user
 * prompt pair into a raw text (JSON) response — parsing, validation, prompt
 * construction, retries, and fallback are all handled centrally by the
 * AI Manager so every provider is held to the same contract.
 */
export interface TextProvider {
  /** Stable identifier, also usable as the AI_MODE override value. */
  id: string;
  /** Human-readable label for logs/status. */
  label: string;
  /** Env var name this provider reads its API key from (for status/debug). */
  envKey: string;
  isConfigured(): boolean;
  complete(params: { system: string; user: string }): Promise<string>;
}

export type ImageStyle = "default" | "cartoon";

export interface ImageGenerateOptions {
  style?: ImageStyle;
}

/**
 * An image-generation provider. Returns either an https URL or a base64
 * data URL — both render fine in the mobile app's <Image> component.
 */
export interface ImageProvider {
  id: string;
  label: string;
  envKey: string;
  isConfigured(): boolean;
  generateImage(prompt: string, options?: ImageGenerateOptions): Promise<string>;
  /** Same vendor/model as generate. Optional: not every provider can inpaint. */
  editImage?(image: string, prompt: string, options?: ImageGenerateOptions): Promise<string>;
}
