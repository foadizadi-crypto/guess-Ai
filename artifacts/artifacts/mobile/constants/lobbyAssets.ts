import { Image as ExpoImage, type ImageRef } from "expo-image";

/**
 * Bundled lobby chrome. These webps are large (many 500KB–900KB) and used to
 * decode *after* the background because the BG went through expo-image/Glide
 * while HUD icons used RN Image. Keep both on the same pipeline and warm them
 * during splash so the first lobby paint can show background + icons together.
 */
type BundledAsset = number | string | { uri: string };

export const LOBBY_BACKGROUND: BundledAsset = require("../assets/background/lobby_BG.webp");

export const LOBBY_ICONS: Record<string, BundledAsset> = {
  coin: require("../assets/icon/coin.webp"),
  gem: require("../assets/icon/gem.webp"),
  stamina: require("../assets/icon/stamina.webp"),
  spinwheel: require("../assets/icon/spinwheel.webp"),
  settings: require("../assets/icon/settings.webp"),
  play: require("../assets/icon/play.webp"),
  legendary_pack: require("../assets/icon/legendary_pack.webp"),
  gem_pack: require("../assets/icon/gem_pack.webp"),
  admob: require("../assets/icon/AdMob_BG.webp"),
  leaderboard: require("../assets/icon/leaderboard.webp"),
  dailyreward: require("../assets/icon/daily-reward.webp"),
  shop: require("../assets/icon/shop.webp"),
  friends: require("../assets/icon/friends.webp"),
  achievement: require("../assets/icon/achievement.webp"),
  stand_avatar: require("../assets/icon/avatar_pedestal.webp"),
};

export type LobbyChromeSource = BundledAsset | ImageRef;

const resolvedIcons: Record<string, LobbyChromeSource> = { ...LOBBY_ICONS };
let resolvedBackground: LobbyChromeSource = LOBBY_BACKGROUND;
let chromeReady = false;
let preloadPromise: Promise<void> | null = null;

export function isLobbyChromeReady(): boolean {
  return chromeReady;
}

export function getLobbyBackground(): LobbyChromeSource {
  return resolvedBackground;
}

export function getLobbyIcon(id: string): LobbyChromeSource | undefined {
  return resolvedIcons[id];
}

async function loadOne(
  source: BundledAsset,
  options?: { maxWidth?: number; maxHeight?: number },
): Promise<LobbyChromeSource> {
  try {
    return await ExpoImage.loadAsync(source as never, options);
  } catch {
    return source;
  }
}

/** Decode lobby BG + HUD icons into memory. Safe to call repeatedly. */
export function preloadLobbyChrome(): Promise<void> {
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    const iconEntries = Object.entries(LOBBY_ICONS);
    const [bg, ...icons] = await Promise.all([
      loadOne(LOBBY_BACKGROUND, { maxWidth: 1280, maxHeight: 1280 }),
      ...iconEntries.map(([, mod]) =>
        loadOne(mod, { maxWidth: 512, maxHeight: 512 }),
      ),
    ]);
    resolvedBackground = bg;
    iconEntries.forEach(([id], index) => {
      resolvedIcons[id] = icons[index];
    });
    chromeReady = true;
  })().catch(() => {
    chromeReady = true;
  });

  return preloadPromise;
}
