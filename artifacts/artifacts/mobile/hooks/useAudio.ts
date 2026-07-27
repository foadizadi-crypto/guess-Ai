import { useAudioStore } from '@/store/audioStore';

// ─── Audio hook ───────────────────────────────────────────────────────────
// Provides a clean API for playing sounds and music.
// Actual audio playback via expo-av will be wired up in a later phase.

export const useAudio = () => {
  const store = useAudioStore();

  const playEffect = (effect: string): void => {
    if (!store.isSoundEnabled || store.isMuted) return;
    // TODO: implement with expo-av in audio phase
    if (__DEV__) console.log(`[Audio] playEffect: ${effect}`);
  };

  const playMusic = (track: string): void => {
    if (!store.isMusicEnabled || store.isMuted) return;
    // TODO: implement with expo-av in audio phase
    if (__DEV__) console.log(`[Audio] playMusic: ${track}`);
  };

  const stopMusic = (): void => {
    // TODO: implement with expo-av in audio phase
  };

  return {
    isMusicEnabled: store.isMusicEnabled,
    isSoundEnabled: store.isSoundEnabled,
    volume: store.volume,
    isMuted: store.isMuted,
    toggleMusic: store.toggleMusic,
    toggleSound: store.toggleSound,
    setVolume: store.setVolume,
    toggleMute: store.toggleMute,
    playEffect,
    playMusic,
    stopMusic,
  };
};
