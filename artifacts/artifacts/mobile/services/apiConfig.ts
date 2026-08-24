/**
 * API endpoint used by release and development clients.
 *
 * A release APK must receive EXPO_PUBLIC_API_URL from the EAS environment.
 * Falling back to localhost on a physical device creates an unreachable
 * request and is especially dangerous because it can look like a spinner.
 */
const configuredUrl =
  typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL?.trim() : undefined;
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

if (!configuredUrl && environment !== 'development') {
  console.error('[API] Missing EXPO_PUBLIC_API_URL in release configuration');
}
if (configuredUrl && environment !== 'development' && isLocalUrl(configuredUrl)) {
  console.error('[API] Release configuration points to a local URL');
}

export const API_BASE_URL =
  configuredUrl && !(environment !== 'development' && isLocalUrl(configuredUrl))
    ? configuredUrl.replace(/\/+$/, '')
    : '';

export const API_ENVIRONMENT = environment;

export function getApiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error('API is not configured for this build. Set EXPO_PUBLIC_API_URL and rebuild.');
  }
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