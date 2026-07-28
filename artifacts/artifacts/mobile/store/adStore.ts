/**
 * Ad store — persists adsRemoved state and exposes ad actions wired to AdService.
 *
 * Phase 4 wiring:
 *   • showInterstitial / showRewarded now delegate to adService which handles
 *     the real AdMob bridge (or mock mode in Expo Go).
 *   • removeAds is also called by IAPService after a successful purchase so the
 *     persisted flag survives app restarts.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adService } from '@/services/AdService';

// ─── State shape ──────────────────────────────────────────────────────────

interface AdState {
  adsRemoved: boolean;
  isBannerVisible: boolean;

  showBanner: () => void;
  hideBanner: () => void;
  showInterstitial: () => Promise<void>;
  showRewarded: () => Promise<boolean>;
  removeAds: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────

export const useAdStore = create<AdState>()(
  persist(
    (set, get) => ({
      adsRemoved: false,
      isBannerVisible: false,

      showBanner: () => {
        if (get().adsRemoved) return;
        set({ isBannerVisible: true });
      },

      hideBanner: () => set({ isBannerVisible: false }),

      showInterstitial: async () => {
        if (get().adsRemoved) return;
        await adService.showInterstitial();
      },

      showRewarded: async (): Promise<boolean> => {
        // Rewarded ads are available even if ads are "removed" (it's opt-in)
        return adService.showRewarded();
      },

      removeAds: () => set({ adsRemoved: true, isBannerVisible: false }),
    }),
    {
      name: 'blurquiz-ad-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ adsRemoved: state.adsRemoved }),
    },
  ),
);
