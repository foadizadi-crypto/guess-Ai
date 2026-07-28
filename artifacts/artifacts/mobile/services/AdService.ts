/**
 * AdService — WEB / FALLBACK build (no native requires).
 *
 * Metro will use this file on web and any platform that doesn't have a
 * matching `.native.ts` override.  All methods are mock implementations
 * that simulate the async contract but never show real ads.
 *
 * For iOS/Android builds Metro resolves `AdService.native.ts` instead,
 * which contains the real react-native-google-mobile-ads integration.
 */

const mockDelay = (ms = 600) => new Promise<void>((r) => setTimeout(r, ms));

const INTERSTITIAL_COOLDOWN_MS = 3 * 60 * 1000;
let lastInterstitialAt = 0;

// ─── Ad unit IDs (shared constants, safe to import on any platform) ────────
export const AD_UNIT_IDS = {
  banner: process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? 'ca-app-pub-3940256099942544/6300978111',
  interstitial: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ?? 'ca-app-pub-3940256099942544/1033173712',
  rewarded: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID ?? 'ca-app-pub-3940256099942544/5224354917',
};

class AdService {
  get bannerAdUnitId(): string { return AD_UNIT_IDS.banner; }

  async showInterstitial(): Promise<void> {
    const now = Date.now();
    if (now - lastInterstitialAt < INTERSTITIAL_COOLDOWN_MS) return;
    await mockDelay(300);
    lastInterstitialAt = now;
  }

  async showRewarded(): Promise<boolean> {
    await mockDelay(600);
    return true; // mock always grants reward
  }
}

export const adService = new AdService();
export default AdService;
