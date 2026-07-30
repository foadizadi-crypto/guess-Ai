import { logger } from "../../lib/logger";
import type { ProviderErrorKind } from "./errors";

interface HealthEntry {
  disabledUntil: number;
  reason: string;
}

// How long a provider is skipped after a given failure kind. Kinds not
// listed here (timeout, unavailable, unknown) are treated as transient —
// the next request tries the provider again immediately.
const COOLDOWN_MS: Partial<Record<ProviderErrorKind, number>> = {
  invalid_key: 60 * 60 * 1000, // 1 hour — a bad key won't fix itself quickly
  billing_issue: 15 * 60 * 1000,
  quota_exceeded: 15 * 60 * 1000,
  rate_limited: 60 * 1000,
};

const health = new Map<string, HealthEntry>();

export function isOnCooldown(providerId: string): boolean {
  const entry = health.get(providerId);
  if (!entry) return false;
  if (Date.now() >= entry.disabledUntil) {
    health.delete(providerId);
    return false;
  }
  return true;
}

export function recordFailure(providerId: string, kind: ProviderErrorKind, message: string): void {
  const cooldown = COOLDOWN_MS[kind];
  if (!cooldown) return;
  const disabledUntil = Date.now() + cooldown;
  health.set(providerId, { disabledUntil, reason: `${kind}: ${message}` });
  logger.warn(
    { provider: providerId, kind, cooldownMs: cooldown },
    `Provider "${providerId}" put on cooldown for ${Math.round(cooldown / 1000)}s`,
  );
}

export function recordSuccess(providerId: string): void {
  health.delete(providerId);
}

export function getHealthSnapshot(): Record<
  string,
  { reason: string; secondsRemaining: number }
> {
  const snapshot: Record<string, { reason: string; secondsRemaining: number }> = {};
  for (const [id, entry] of health.entries()) {
    snapshot[id] = {
      reason: entry.reason,
      secondsRemaining: Math.max(0, Math.round((entry.disabledUntil - Date.now()) / 1000)),
    };
  }
  return snapshot;
}
