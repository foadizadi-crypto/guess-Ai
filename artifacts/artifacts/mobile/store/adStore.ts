import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── State shape ──────────────────────────────────────────────────────────

interface AdState {
  adsRemoved: boolean;
  isBannerVisible: boolean;

  // ─── Placeholder ad methods ──────────────────────────────────────────────
  // These will be replaced with real ad SDK calls in a later phase.

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
        // TODO: integrate ad SDK in later phase
      },

      hideBanner: () => set({ isBannerVisible: false }),

      showInterstitial: async () => {
        if (get().adsRemoved) return;
        // TODO: integrate ad SDK in later phase
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
      },

      showRewarded: async (): Promise<boolean> => {
        // TODO: integrate ad SDK in later phase
        // Returns true when user watched the full ad and earned reward
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
        return true;
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
