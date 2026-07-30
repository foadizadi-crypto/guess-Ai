export type ProviderErrorKind =
  | "invalid_key"
  | "quota_exceeded"
  | "billing_issue"
  | "rate_limited"
  | "timeout"
  | "unavailable"
  | "unknown";

export class ProviderError extends Error {
  readonly provider: string;
  readonly kind: ProviderErrorKind;
  override readonly cause?: unknown;

  constructor(provider: string, kind: ProviderErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name = "ProviderError";
    this.provider = provider;
    this.kind = kind;
    this.cause = cause;
  }
}

/**
 * Normalizes errors thrown by very different AI SDKs (OpenAI-compatible
 * clients used for OpenAI/Groq/Zhipu, the Gemini SDK, the Anthropic SDK, and
 * raw fetch calls for Hugging Face) into one shared classification. The AI
 * Manager uses this to decide whether to cool a provider down, skip it for
 * just this request, or leave it alone.
 */
export function classifyError(provider: string, err: unknown): ProviderError {
  if (err instanceof ProviderError) return err;

  const status: number | undefined =
    err && typeof err === "object" && "status" in err && typeof (err as { status: unknown }).status === "number"
      ? (err as { status: number }).status
      : undefined;

  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (err instanceof Error && (err.name === "AbortError" || lower.includes("timeout") || lower.includes("timed out"))) {
    return new ProviderError(provider, "timeout", message, err);
  }

  if (
    status === 401 ||
    status === 403 ||
    lower.includes("invalid api key") ||
    lower.includes("incorrect api key") ||
    lower.includes("api key not valid") ||
    lower.includes("unauthorized")
  ) {
    return new ProviderError(provider, "invalid_key", message, err);
  }

  if (status === 429 || lower.includes("rate limit")) {
    if (
      lower.includes("quota") ||
      lower.includes("billing") ||
      lower.includes("insufficient_quota") ||
      lower.includes("exceeded your current quota")
    ) {
      return new ProviderError(provider, "billing_issue", message, err);
    }
    return new ProviderError(provider, "rate_limited", message, err);
  }

  if (lower.includes("quota")) {
    return new ProviderError(provider, "quota_exceeded", message, err);
  }

  if (status !== undefined && status >= 500) {
    return new ProviderError(provider, "unavailable", message, err);
  }

  return new ProviderError(provider, "unknown", message, err);
}
