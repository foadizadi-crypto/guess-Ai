import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── State shape ──────────────────────────────────────────────────────────

interface AudioState {
  isMusicEnabled: boolean;
  isSoundEnabled: boolean;
  volume: number;          // 0.0 – 1.0
  isMuted: boolean;
  currentTrack: string | null;

  // ─── Actions ────────────────────────────────────────────────────────────
  toggleMusic: () => void;
  toggleSound: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setCurrentTrack: (track: string | null) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────

export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      isMusicEnabled: true,
      isSoundEnabled: true,
      volume: 0.7,
      isMuted: false,
      currentTrack: null,

      toggleMusic: () =>
        set((state) => ({ isMusicEnabled: !state.isMusicEnabled })),

      toggleSound: () =>
        set((state) => ({ isSoundEnabled: !state.isSoundEnabled })),

      setVolume: (volume) =>
        set({ volume: Math.min(1, Math.max(0, volume)) }),

      toggleMute: () =>
        set((state) => ({ isMuted: !state.isMuted })),

      setCurrentTrack: (track) => set({ currentTrack: track }),
    }),
    {
      name: 'blurquiz-audio-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isMusicEnabled: state.isMusicEnabled,
        isSoundEnabled: state.isSoundEnabled,
        volume: state.volume,
        isMuted: state.isMuted,
      }),
    },
  ),
);
