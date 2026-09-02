/**
 * Native AdMob service. Never throws at import time — a missing production
 * ad unit must disable ads, not crash the Play Store build.
 */
import { NativeModules } from 'react-native';

const TEST_PUBLISHER = '3940256099942544';

export const AD_UNIT_IDS = {
  banner: process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? '',
  interstitial: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ?? '',
  rewarded: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID ?? '',
};

const isTestId = (id: string) => !id || id.includes(TEST_PUBLISHER);

const ADMOB_LINKED = !!NativeModules.RNGoogleMobileAds;

let _Inter: any = null;
let _Rewarded: any = null;
let _AdEventType: any = null;
let _RewardedEventType: any = null;
let _mobileAds: any = null;
let _AdsConsent: any = null;

if (ADMOB_LINKED) {
  try {
    const m = require('react-native-google-mobile-ads');
    _Inter = m.InterstitialAd;
    _Rewarded = m.RewardedAd;
    _AdEventType = m.AdEventType;
    _RewardedEventType = m.RewardedAdEventType;
    _mobileAds = m.default;
    _AdsConsent = m.AdsConsent;
  } catch {
    // Expo Go / missing native module
  }
}

const INTERSTITIAL_COOLDOWN_MS = 3 * 60 * 1000;
/** If AdMob never LOADED/CLOSED/ERROR, fail so lobby can release the reserved slot. */
const REWARDED_LOAD_TIMEOUT_MS = 25_000;

class AdService {
  private lastInterstitialAt = 0;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized || !ADMOB_LINKED || !_mobileAds) return;
    try {
      if (_AdsConsent) {
        await _AdsConsent.requestInfoUpdate();
        await _AdsConsent.loadAndShowConsentFormIfRequired();
      }
      await _mobileAds().initialize();
      this.initialized = true;
    } catch (err) {
      if (__DEV__) console.warn('[AdService] initialize failed:', err);
    }
  }

  get bannerAdUnitId(): string {
    return isTestId(AD_UNIT_IDS.banner) ? '' : AD_UNIT_IDS.banner;
  }

  async showInterstitial(): Promise<void> {
    const now = Date.now();
    if (now - this.lastInterstitialAt < INTERSTITIAL_COOLDOWN_MS) return;

    if (!ADMOB_LINKED || !_Inter || !_AdEventType || isTestId(AD_UNIT_IDS.interstitial)) {
      if (__DEV__) {
        await new Promise((r) => setTimeout(r, 400));
        this.lastInterstitialAt = Date.now();
      }
      return;
    }

    try {
      await this.initialize();
      const ad = _Inter.createForAdRequest(AD_UNIT_IDS.interstitial);
      await new Promise<void>((resolve, reject) => {
        ad.addAdEventListener(_AdEventType.LOADED, () => {
          ad.show();
          resolve();
        });
        ad.addAdEventListener(_AdEventType.ERROR, reject);
        ad.load();
      });
      this.lastInterstitialAt = Date.now();
    } catch (err) {
      if (__DEV__) console.warn('[AdService] interstitial failed:', err);
      this.lastInterstitialAt = Date.now();
    }
  }

  async showRewarded(): Promise<boolean> {
    if (!ADMOB_LINKED || !_Rewarded || !_RewardedEventType || !_AdEventType) {
      await new Promise((r) => setTimeout(r, 500));
      if (__DEV__) {
        console.warn('[AdService] AdMob not linked — mock reward (development only).');
        return true;
      }
      return false;
    }

    if (isTestId(AD_UNIT_IDS.rewarded) && !__DEV__) {
      return false;
    }

    try {
      await this.initialize();
      return await new Promise<boolean>((resolve) => {
        const ad = _Rewarded.createForAdRequest(AD_UNIT_IDS.rewarded);
        let rewarded = false;
        let settled = false;
        const finish = (value: boolean) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(value);
        };
        const timer = setTimeout(() => finish(false), REWARDED_LOAD_TIMEOUT_MS);
        ad.addAdEventListener(_RewardedEventType.EARNED_REWARD, () => {
          rewarded = true;
        });
        ad.addAdEventListener(_AdEventType.CLOSED, () => finish(rewarded));
        ad.addAdEventListener(_AdEventType.ERROR, () => finish(false));
        ad.addAdEventListener(_AdEventType.LOADED, () => ad.show());
        ad.load();
      });
    } catch (err) {
      if (__DEV__) console.warn('[AdService] rewarded failed:', err);
      return false;
    }
  }
}

export const adService = new AdService();
export default AdService;
