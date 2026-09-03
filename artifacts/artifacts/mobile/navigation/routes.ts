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
  COUNT_QUICK: '/count-quick',
  LOST_ITEM: '/lost-item',
  FLIP_MIND: '/flip-mind',
  GOLD_RUSH: '/gold-rush',
  TICK_LOCK: '/tick-lock',
  TWIN_LINK: '/twin-link',
  NEON_FLASH: '/neon-flash',
  GLITCH_SPY: '/glitch-spy',
  COLOR_TRAP: '/color-trap',
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

const POST_AUTH_HOLD = new Set<string>([
  ROUTES.SPLASH,
  ROUTES.ONBOARDING,
  ROUTES.LOGIN,
  ROUTES.LEGAL,
  ROUTES.LOBBY,
  '/',
]);

/** After sign-in, honour a launch/deep-link URL if it is a known in-app route. */
export function routeFromLaunchUrl(url: string | null | undefined): AppRoute {
  if (!url) return ROUTES.LOBBY;
  try {
    let path = '';
    try {
      const parsed = new URL(url);
      path = parsed.pathname || '';
    } catch {
      path = url;
    }
    path = path.split('?')[0] ?? '';
    if (!path.startsWith('/')) path = `/${path}`;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    const known = new Set<string>(Object.values(ROUTES));
    if (known.has(path) && !POST_AUTH_HOLD.has(path)) {
      return path as AppRoute;
    }
  } catch {
    /* ignore malformed URLs */
  }
  return ROUTES.LOBBY;
}
