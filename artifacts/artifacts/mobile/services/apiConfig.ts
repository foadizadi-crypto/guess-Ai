/**
 * All gameplay (quiz + Speed Card) talks to the live Render API.
 * Localhost is never used — pre-release testing is online-only.
 */
const PRODUCTION_API_URL = 'https://guess-ai-4sqt.onrender.com';
const environment =
  typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_ENV ?? 'development' : 'development';

const isLocalUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '0.0.0.0';
  } catch {
    return true;
  }
};

function resolveApiBase(): string {
  const raw = typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL?.trim() : undefined;
  if (raw && !isLocalUrl(raw)) {
    return raw.replace(/\/+$/, '');
  }
  return PRODUCTION_API_URL;
}

export const API_BASE_URL = resolveApiBase();
export const API_ENVIRONMENT = environment;

export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function safeApiTarget(): string {
  if (!API_BASE_URL) return 'unconfigured';
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'invalid';
  }
}