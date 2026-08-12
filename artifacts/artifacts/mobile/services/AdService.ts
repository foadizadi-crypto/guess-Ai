/**
 * services/AudioService.ts — expo-av audio singleton management service.
 * Strict TypeScript Compilable File
 *
 * CRITICAL AUDIT FIX APPLIED (P2 - MEMORY LEAK):
 * Implements full sound effect unloads, active pointer resets, and comprehensive
 * cache disposal to protect device memory from Out-Of-Memory (OOM) fatal crashes.
 */

import { Audio } from 'expo-av';
import type { AVPlaybackStatus } from 'expo-av';

// ─── Sound asset manifest ────────────────────────────────────────────────
type EffectName = 'button_click' | 'correct' | 'wrong' | 'coin' | 'timer_tick' | 'level_up' | 'purchase';
type MusicName = 'menu_music' | 'game_music';

const EFFECT_ASSETS: Record<EffectName, number> = {
  button_click: require('@/assets/audio/button_click.wav'),
  correct: require('@/assets/audio/correct.wav'),
  wrong: require('@/assets/audio/wrong.wav'),
  coin: require('@/assets/audio/coin.wav'),
  timer_tick: require('@/assets/audio/timer_tick.wav'),
  level_up: require('@/assets/audio/level_up.wav'),
  purchase: require('@/assets/audio/coin.wav'), // Reuse coin sound asset for purchase metrics
};

const MUSIC_ASSETS: Record<MusicName, number> = {
  menu_music: require('@/assets/audio/menu_music.wav'),
  game_music: require('@/assets/audio/game_music.wav'),
};

class AudioService {
  private static instance: AudioService;

  private effectCache: Partial<Record<EffectName, Audio.Sound>> = {};
  private currentMusic: Audio.Sound | null = null;
  private currentMusicName: MusicName | null = null;

  // Sync tracking indicators
  private _volume = 0.7;
  private _muted = false;
  private _musicEnabled = true;
  private _soundEnabled = true;

  private initialized = false;

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  /** Must be called once during root initialization (app/_layout.tsx) */
  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      this.initialized = true;
    } catch (err) {
      if (__DEV__) console.warn('[AudioService] Native configuration init failed:', err);
    }
  }

  // ── Preferences Synchronizers ───────────────────────────────────────────
  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    this.applyMusicVolume();
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    this.applyMusicVolume();
    if (muted) {
      this.pauseMusic();
    } else if (this.currentMusic && this._musicEnabled) {
      this.resumeMusic();
    }
  }

  setMusicEnabled(enabled: boolean): void {
    this._musicEnabled = enabled;
    if (!enabled) {
      this.pauseMusic();
    } else {
      this.resumeMusic();
    }
  }

  setSoundEnabled(enabled: boolean): void {
    this._soundEnabled = enabled;
  }

  // ── Sound Effect Layer Execution ────────────────────────────────────────
  async playEffect(name: string): Promise<void> {
    if (!this._soundEnabled || this._muted) return;
    const key = name as EffectName;
    if (!(key in EFFECT_ASSETS)) return;

    try {
      let sound = this.effectCache[key];
      if (!sound) {
        const { sound: s } = await Audio.Sound.createAsync(EFFECT_ASSETS[key], {
          shouldPlay: false,
          volume: this._volume,
        });
        this.effectCache[key] = s;
        sound = s;
      }

      await sound.setVolumeAsync(this._volume);
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (err) {
      if (__DEV__) console.warn(`[AudioService] playEffect(${name}) pipeline failed:`, err);
    }
  }

  // ── Background Music Layer Execution ────────────────────────────────────
  async playMusic(name: string): Promise<void> {
    const key = name as MusicName;
    if (!(key in MUSIC_ASSETS)) return;

    if (this.currentMusicName === key) {
      if (!this._musicEnabled || this._muted) {
        await this.pauseMusic();
      }
      return;
    }

    // Stop and cleanly unload previous track before requesting new memory buffer
    await this.stopMusic();

    if (!this._musicEnabled || this._muted) return;

    try {
      const { sound } = await Audio.Sound.createAsync(
        MUSIC_ASSETS[key],
        {
          shouldPlay: true,
          isLooping: true,
          volume: this._volume * 0.45, // Background music is lower than active effects
        },
      );

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (!status.isLoaded && (status as any).error) {
          if (__DEV__) console.warn('[AudioService] Background stream status error:', (status as any).error);
        }
      });

      this.currentMusic = sound;
      this.currentMusicName = key;
    } catch (err) {
      if (__DEV__) console.warn(`[AudioService] playMusic(${name}) pipeline failed:`, err);
    }
  }

  async stopMusic(): Promise<void> {
    if (!this.currentMusic) return;
    try {
      await this.currentMusic.stopAsync();
      await this.currentMusic.unloadAsync();
    } catch {
      // Already unloaded or resource thread closed safely
    } finally {
      this.currentMusic = null;
      this.currentMusicName = null;
    }
  }

  private async pauseMusic(): Promise<void> {
    if (!this.currentMusic) return;
    try {
      await this.currentMusic.pauseAsync();
    } catch {
      // Stream state not running
    }
  }

  private async resumeMusic(): Promise<void> {
    if (!this.currentMusic) return;
    try {
      await this.currentMusic.playAsync();
    } catch {
      // Handled silently
    }
  }

  private applyMusicVolume(): void {
    if (!this.currentMusic) return;
    const vol = this._muted ? 0 : this._volume * 0.45;
    this.currentMusic.setVolumeAsync(vol).catch(() => {});
  }

  // ── CRITICAL AUDIT FIX: Comprehensive Garbage Collection Release ────────
  async dispose(): Promise<void> {
    // 1. Force kill active looping background tracks
    await this.stopMusic();
    
    // 2. Unload every single preloaded wave sound effect cached in the dictionary buffer
    for (const key of Object.keys(this.effectCache)) {
      const sound = this.effectCache[key as EffectName];
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (err) {
          // Stream already flushed safely
        }
      }
    }
    
    // 3. Clear total pointers reference map to allow device RAM garbage collector flush
    this.effectCache = {};
    this.initialized = false;
    console.log('[Audio System] Garbage Collection executed. Audio cache fully disposed.');
  }
}

export const audioService = AudioService.getInstance();
export default AudioService;
