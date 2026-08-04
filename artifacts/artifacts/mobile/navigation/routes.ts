// ─── Route constants ──────────────────────────────────────────────────────
// Use these when calling router.push() / router.replace() to avoid typos.

export const ROUTES = {
  SPLASH: '/splash',
  ONBOARDING: '/onboarding',
  LOGIN: '/login',
  LOBBY: '/lobby',
  LEVEL_SELECT: '/level-select',
  CATEGORY_SELECT: '/category-select',
  GAME: '/game',
  RESULT: '/result',
  SHOP: '/shop',
  LEADERBOARD: '/leaderboard',
  PROFILE: '/profile',
  DAILY_REWARD: '/daily-reward',
  SETTINGS: '/settings',
  ACHIEVEMENTS: '/achievements',
  COLLECTIONS:  '/collections',
  COLLECTION_DETAIL: '/collection-detail',
  SPIN:         '/spin',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
