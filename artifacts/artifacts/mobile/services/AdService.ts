/**
 * services/AdService.ts — WEB fallback for the AdMob advertising service.
 *
 * Metro resolves AdService.native.ts on iOS/Android; this file is what the web
 * bundle gets. react-native-google-mobile-ads has no web implementation, so
 * every call here is an explicit no-op that reports "no ad was shown" rather
 * than pretending a reward was earned.
 */

// ─── Shared Ad Unit Configurations ──────────────────────────────────────────
export const AD_UNIT_IDS = {
  banner: process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? '',
  interstitial: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ?? '',
  rewarded: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID ?? '',
};

class AdService {
  readonly isSupported = false;

  async initialize(): Promise<void> {}

  get bannerAdUnitId(): string {
    return AD_UNIT_IDS.banner;
  }

  async showInterstitial(): Promise<void> {
    if (__DEV__) console.log('[AdService/web] showInterstitial() skipped — ads are native-only.');
  }

  /** Always false on web production. In __DEV__, mock a successful watch so lobby/revive can be tested. */
  async showRewarded(): Promise<boolean> {
    if (__DEV__) {
      console.log('[AdService/web] showRewarded() mocked in development.');
      await new Promise((r) => setTimeout(r, 400));
      return true;
    }
    return false;
  }
}

export const adService = new AdService();
export default AdService;
