/**
 * Ad store — persists ad-related state and exposes ad actions wired to AdService.
 *
 * Policy (spec §7): No forced interstitials. All ads are opt-in rewarded videos.
 *
 *   • sessionCounter  — incremented after every completed game session.
 *     The "Double Rewards" button on the result screen appears when counter ≥ 3.
 *     Resets to 0 only when the player watches the double-reward ad; stays on
 *     decline so it carries over to the next session.
 *
 *   • lastDailyAdTimestamp — Unix ms of the last successful lobby "Daily Gift" ad.
 *     Enforces a 4-hour cooldown between claims.
 *
 *   • adFreePassExpiry — Unix ms expiry of the Ad-Free Pass IAP.  When active,
 *     both rewarded placements grant rewards instantly without showing an ad.
 *     NULL means no pass was ever purchased (or it has expired).
 *
 *   • adsRemoved — legacy flag kept for backward-compat; true when a lifetime
 *     Ad-Free Pass is active (no expiry).  New code should use isAdFreePassActive().
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adService } from '@/services/AdService';

// ─── Constants ────────────────────────────────────────────────────────────

/** Minimum sessions between double-reward offers (spec §7.2). */
export const SESSION_COUNTER_THRESHOLD = 3;

/** Lobby "Daily Gift" cooldown in ms — 4 hours (spec §7.1). */
export const DAILY_AD_COOLDOWN_MS = 4 * 60 * 60 * 1000;

// ─── State shape ──────────────────────────────────────────────────────────

interface AdState {
  /** True when a lifetime Ad-Free Pass has been purchased (no expiry). */
  adsRemoved: boolean;

  /**
   * Unix ms expiry of a time-limited Ad-Free Pass.
   * NULL = no pass / already expired.
   * When present and in the future, isAdFreePassActive() returns true.
   */
  adFreePassExpiry: number | null;

  /**
   * Number of completed game sessions since the last double-reward ad was
   * watched.  Button unlocks at SESSION_COUNTER_THRESHOLD (default 3).
   */
  sessionCounter: number;

  /**
   * Unix ms timestamp of the last successful lobby "Daily Gift" ad claim.
   * NULL = never claimed.
   */
  lastDailyAdTimestamp: number | null;

  // ── Derived helpers ──────────────────────────────────────────────────────
  /** True when either the lifetime flag or a non-expired timed pass is active. */
  isAdFreePassActive: () => boolean;
  /** True when the session counter has reached the threshold. */
  canShowDoubleReward: () => boolean;
  /** True when the 4-hour cooldown has elapsed since the last daily ad claim. */
  isDailyAdAvailable: () => boolean;

  // ── Actions ───────────────────────────────────────────────────────────────
  /** Show a rewarded ad (always opt-in; available even for ad-free users). */
  showRewarded: () => Promise<boolean>;

  /** Called at the end of every game session to advance the session counter. */
  incrementSessionCounter: () => void;
  /** Called after a successful double-reward ad watch to reset the counter. */
  resetSessionCounter: () => void;

  /** Record a successful lobby Daily Gift claim (starts the 4-hour cooldown). */
  setLastDailyAdClaimed: () => void;

  /** Set a timed Ad-Free Pass expiry (from IAP purchase). Pass 0 for lifetime. */
  setAdFreePassExpiry: (expiryMs: number) => void;

  /** Convenience: grant a lifetime ad-free pass (backward-compat with IAPService). */
  removeAds: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────

export const useAdStore = create<AdState>()(
  persist(
    (set, get) => ({
      adsRemoved: false,
      adFreePassExpiry: null,
      sessionCounter: 0,
      lastDailyAdTimestamp: null,

      // ── Derived helpers ──────────────────────────────────────────────────

      isAdFreePassActive: () => {
        const { adsRemoved, adFreePassExpiry } = get();
        if (adsRemoved) return true;
        if (adFreePassExpiry !== null && adFreePassExpiry > Date.now()) return true;
        return false;
      },

      canShowDoubleReward: () => get().sessionCounter >= SESSION_COUNTER_THRESHOLD,

      isDailyAdAvailable: () => {
        const { lastDailyAdTimestamp } = get();
        if (lastDailyAdTimestamp === null) return true;
        return Date.now() - lastDailyAdTimestamp >= DAILY_AD_COOLDOWN_MS;
      },

      // ── Actions ──────────────────────────────────────────────────────────

      showRewarded: (): Promise<boolean> => adService.showRewarded(),

      incrementSessionCounter: () =>
        set((s) => ({ sessionCounter: s.sessionCounter + 1 })),

      resetSessionCounter: () => set({ sessionCounter: 0 }),

      setLastDailyAdClaimed: () => set({ lastDailyAdTimestamp: Date.now() }),

      setAdFreePassExpiry: (expiryMs) => {
        if (expiryMs === 0) {
          // 0 means lifetime — set the legacy flag too
          set({ adsRemoved: true, adFreePassExpiry: null });
        } else {
          set({ adFreePassExpiry: expiryMs });
        }
      },

      removeAds: () => set({ adsRemoved: true, adFreePassExpiry: null }),
    }),
    {
      name: 'blurquiz-ad-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        adsRemoved: state.adsRemoved,
        adFreePassExpiry: state.adFreePassExpiry,
        sessionCounter: state.sessionCounter,
        lastDailyAdTimestamp: state.lastDailyAdTimestamp,
      }),
    },
  ),
);
