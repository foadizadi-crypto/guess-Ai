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
  SPEED_CARD: '/speed-card',
  RESULT: '/result',
  SHOP: '/shop',
  LEADERBOARD: '/leaderboard',
  PROFILE: '/profile',
  CUSTOMIZATION: '/customization',
  DAILY_REWARD: '/daily-reward',
  SETTINGS: '/settings',
  LEGAL: '/legal',
  ACHIEVEMENTS: '/achievements',
  COLLECTIONS:  '/collections',
  COLLECTION_DETAIL: '/collection-detail',
  SPIN:         '/spin',
  FRIENDS:      '/friends',
  STAMINA:      '/stamina',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
