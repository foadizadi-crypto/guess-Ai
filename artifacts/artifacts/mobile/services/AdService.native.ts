/**
 * AdService — NATIVE build (iOS / Android).
 *
 * Metro resolves this file instead of `AdService.ts` when bundling for native
 * platforms.  It safely requires `react-native-google-mobile-ads` (which is
 * only available when the native bridge is linked — EAS production/preview
 * builds).  In Expo Go the NativeModules check guards every call and falls
 * back to mock behaviour so the app still works without real ads.
 */

import { NativeModules } from 'react-native';

// ─── Re-export shared constants so importers need only one path ────────────
export const AD_UNIT_IDS = {
  banner:       process.env.EXPO_PUBLIC_ADMOB_BANNER_ID       ?? 'ca-app-pub-3940256099942544/6300978111',
  interstitial: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ?? 'ca-app-pub-3940256099942544/1033173712',
  rewarded:     process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID     ?? 'ca-app-pub-3940256099942544/5224354917',
};

// ─── Native availability (Expo Go lacks the linked native module) ─────────
const ADMOB_LINKED = !!NativeModules.RNGoogleMobileAds;

let _Inter: any = null;
let _Rewarded: any = null;
let _AdEventType: any = null;
let _RewardedEventType: any = null;
let _TestIds: any = null;

if (ADMOB_LINKED) {
  try {
    const m = require('react-native-google-mobile-ads');
    _Inter             = m.InterstitialAd;
    _Rewarded          = m.RewardedAd;
    _AdEventType       = m.AdEventType;
    _RewardedEventType = m.RewardedAdEventType;
    _TestIds           = m.TestIds;
  } catch { /* linked but errored — stay in mock mode */ }
}

// Use TestIds when the module is available and no custom ID is provided
if (_TestIds) {
  if (!process.env.EXPO_PUBLIC_ADMOB_BANNER_ID)       AD_UNIT_IDS.banner       = _TestIds.BANNER;
  if (!process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID) AD_UNIT_IDS.interstitial = _TestIds.INTERSTITIAL;
  if (!process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID)     AD_UNIT_IDS.rewarded     = _TestIds.REWARDED;
}

// ─── Throttle ─────────────────────────────────────────────────────────────
const INTERSTITIAL_COOLDOWN_MS = 3 * 60 * 1000;
let lastInterstitialAt = 0;
const mockDelay = (ms = 600) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Service ──────────────────────────────────────────────────────────────

class AdService {
  get bannerAdUnitId(): string { return AD_UNIT_IDS.banner; }

  async showInterstitial(): Promise<void> {
    const now = Date.now();
    if (now - lastInterstitialAt < INTERSTITIAL_COOLDOWN_MS) return;

    if (!ADMOB_LINKED || !_Inter || !_AdEventType) {
      await mockDelay(300);
      lastInterstitialAt = now;
      return;
    }

    try {
      const ad = _Inter.createForAdRequest(AD_UNIT_IDS.interstitial);
      await new Promise<void>((resolve, reject) => {
        ad.addAdEventListener(_AdEventType.LOADED, () => { ad.show(); resolve(); });
        ad.addAdEventListener(_AdEventType.ERROR, reject);
        ad.load();
      });
      lastInterstitialAt = now;
    } catch (err) {
      if (__DEV__) console.warn('[AdService] interstitial error', err);
      lastInterstitialAt = now;
    }
  }

  async showRewarded(): Promise<boolean> {
    if (!ADMOB_LINKED || !_Rewarded || !_RewardedEventType || !_AdEventType) {
      await mockDelay(600);
      return true;
    }

    try {
      return await new Promise<boolean>((resolve) => {
        const ad = _Rewarded.createForAdRequest(AD_UNIT_IDS.rewarded);
        let rewarded = false;
        ad.addAdEventListener(_RewardedEventType.EARNED_REWARD, () => { rewarded = true; });
        ad.addAdEventListener(_AdEventType.CLOSED, () => resolve(rewarded));
        ad.addAdEventListener(_AdEventType.ERROR, () => resolve(false));
        ad.addAdEventListener(_AdEventType.LOADED, () => ad.show());
        ad.load();
      });
    } catch (err) {
      if (__DEV__) console.warn('[AdService] rewarded error', err);
      return false;
    }
  }
}

export const adService = new AdService();
export default AdService;
