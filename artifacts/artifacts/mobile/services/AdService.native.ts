/**
 * services/AdService.native.ts — NATIVE AdMob advertising integration service.
 * Strict Expo EAS Production Framework + TypeScript Compilable
 *
 * CRITICAL AUDIT FIXES APPLIED:
 * 1. APP STATE RESET (P2): Listens to background events to reset throttle timers properly.
 * 2. LEAK DETECTOR PROTECTION (P3): Enforces real ad unit configuration checks during production.
 */

import { NativeModules, AppState, AppStateStatus } from 'react-native';

// ─── Shared Ad Unit Configurations ──────────────────────────────────────────
export const AD_UNIT_IDS = {
  banner:       process.env.EXPO_PUBLIC_ADMOB_BANNER_ID       ?? 'ca-app-pub-3940256099942544/6300978111',
  interstitial: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ?? 'ca-app-pub-3940256099942544/1033173712',
  rewarded:     process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID     ?? 'ca-app-pub-3940256099942544/5224354917',
};

// --- CRITICAL AUDIT FIX (P3): Production Environment Safety Guard Block ---
if (process.env.NODE_ENV === 'production') {
  if (!process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || 
      AD_UNIT_IDS.banner.includes('3940256099942544')) {
    throw new Error('❌ FATAL: EXPO_PUBLIC_ADMOB_* real deployment unit IDs must be configured for official production releases.');
  }
}

// ─── Native Bridges Verification Module ──────────────────────────────────────
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
  } catch {
    // Linked but fallback needed for simulator threads
  }
}

// Populate official fallback IDs automatically when available outside production
if (_TestIds && process.env.NODE_ENV !== 'production') {
  if (!process.env.EXPO_PUBLIC_ADMOB_BANNER_ID)       AD_UNIT_IDS.banner       = _TestIds.BANNER;
  if (!process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID) AD_UNIT_IDS.interstitial = _TestIds.INTERSTITIAL;
  if (!process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID)     AD_UNIT_IDS.rewarded     = _TestIds.REWARDED;
}

const INTERSTITIAL_COOLDOWN_MS = 3 * 60 * 1000;
const mockDelay = (ms = 600) => new Promise<void>((r) => setTimeout(r, ms));

class AdService {
  private lastInterstitialAt = 0;
  private currentAppState: AppStateStatus = AppState.currentState;

  constructor() {
    // --- CRITICAL AUDIT FIX (P2): AppState Listener Pipeline to reset throttling loops ---
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    // Reset structural tracking loops when application goes out of active focus focus trees
    if (this.currentAppState === 'active' && nextAppState.match(/inactive|background/)) {
      console.log('[Ad System] App entered background state. Throttling loops cleared.');
      this.lastInterstitialAt = 0; 
    }
    this.currentAppState = nextAppState;
  };

  get bannerAdUnitId(): string { 
    return AD_UNIT_IDS.banner; 
  }

  async showInterstitial(): Promise<void> {
    const now = Date.now();
    if (now - this.lastInterstitialAt < INTERSTITIAL_COOLDOWN_MS) return;

    if (!ADMOB_LINKED || !_Inter || !_AdEventType) {
      await mockDelay(300);
      this.lastInterstitialAt = now;
      return;
    }

    try {
      const ad = _Inter.createForAdRequest(AD_UNIT_IDS.interstitial);
      await new Promise<void>((resolve, reject) => {
        ad.addAdEventListener(_AdEventType.LOADED, () => { 
          ad.show(); 
          resolve(); 
        });
        ad.addAdEventListener(_AdEventType.ERROR, reject);
        ad.load();
      });
      this.lastInterstitialAt = now;
    } catch (err) {
      if (__DEV__) console.warn('[AdService] interstitial pipeline failed:', err);
      this.lastInterstitialAt = now;
    }
  }

  async showRewarded(): Promise<boolean> {
    if (!ADMOB_LINKED || !_Rewarded || !_RewardedEventType || !_AdEventType) {
      // No ad can play (Expo Go, simulator, or a build missing the native
      // module). Fail closed in release builds — reporting a reward for an ad
      // that never ran would hand out real currency. In development the mock
      // stays so the reward flows can be exercised without AdMob linked.
      await mockDelay(600);
      if (__DEV__) {
        console.warn('[AdService] AdMob not linked — granting mock reward (development only).');
        return true;
      }
      return false;
    }

    try {
      return await new Promise<boolean>((resolve) => {
        const ad = _Rewarded.createForAdRequest(AD_UNIT_IDS.rewarded);
        let rewarded = false;
        ad.addAdEventListener(_RewardedEventType.EARNED_REWARD, () => { 
          rewarded = true; 
        });
        ad.addAdEventListener(_AdEventType.CLOSED, () => resolve(rewarded));
        ad.addAdEventListener(_AdEventType.ERROR, () => resolve(false));
        ad.addAdEventListener(_AdEventType.LOADED, () => ad.show());
        ad.load();
      });
    } catch (err) {
      if (__DEV__) console.warn('[AdService] rewarded pipeline failed:', err);
      return false;
    }
  }
}

export const adService = new AdService();
export default AdService;
