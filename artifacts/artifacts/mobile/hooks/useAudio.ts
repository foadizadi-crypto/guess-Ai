/**
 * useAudio — React hook that wires the Zustand audio store to the AudioService
 * singleton.  Components call this hook to play sounds; the service does the
 * actual expo-av work behind the scenes.
 *
 * Sync rules:
 *   • The hook reads volume/mute/enabled flags from the persisted store and
 *     forwards any changes to AudioService so the service always has the
 *     current configuration.
 *   • playEffect / playMusic / stopMusic are stable references (defined once
 *     per mount) and are safe to pass to callbacks without re-renders.
 */

import { useEffect } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { audioService } from '@/services/AudioService';

// Initialise expo-av audio session once, the first time this hook is mounted.
let audioInitialised = false;

export const useAudio = () => {
  const store = useAudioStore();

  // ── Init audio session ───────────────────────────────────────────────────
  useEffect(() => {
    if (!audioInitialised) {
      audioInitialised = true;
      audioService.init();
    }
  }, []);

  // ── Keep AudioService in sync with store preferences ──────────────────────
  useEffect(() => {
    audioService.setVolume(store.volume);
  }, [store.volume]);

  useEffect(() => {
    audioService.setMuted(store.isMuted);
  }, [store.isMuted]);

  useEffect(() => {
    audioService.setMusicEnabled(store.isMusicEnabled);
  }, [store.isMusicEnabled]);

  useEffect(() => {
    audioService.setSoundEnabled(store.isSoundEnabled);
  }, [store.isSoundEnabled]);

  // ── Public API ────────────────────────────────────────────────────────────

  /** Play a one-shot sound effect (e.g. 'correct', 'wrong', 'coin', 'button_click'). */
  const playEffect = (effect: string): void => {
    audioService.playEffect(effect);
  };

  /** Start looping background music (e.g. 'menu_music', 'game_music'). */
  const playMusic = (track: string): void => {
    audioService.playMusic(track);
  };

  /** Stop background music. */
  const stopMusic = (): void => {
    audioService.stopMusic();
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
