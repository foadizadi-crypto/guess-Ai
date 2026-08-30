/**
 * AudioService — expo-av audio singleton.
 *
 * Manages two layers:
 *   • Background music (one looping track at a time)
 *   • One-shot sound effects (played from a preloaded cache)
 *
 * Designed to survive in Expo Go, web, and production builds:
 *   - All calls are guarded with try/catch; failures are logged in dev and silently ignored in prod.
 *   - expo-av is available across all platforms but web audio requires a user gesture first;
 *     we handle that by catching and ignoring the DOMException.
 */

import { Audio } from 'expo-av';
import type { AVPlaybackStatus } from 'expo-av';

// ─── Sound asset manifest ────────────────────────────────────────────────
// Keep in sync with assets/audio/*.wav files generated in Phase 4.

type EffectName = 'button_click' | 'correct' | 'wrong' | 'coin' | 'timer_tick' | 'level_up' | 'purchase';
type MusicName = 'menu_music' | 'game_music';

const EFFECT_ASSETS: Record<EffectName, number> = {
  button_click: require('@/assets/audio/button_click.wav'),
  correct: require('@/assets/audio/correct.wav'),
  wrong: require('@/assets/audio/wrong.wav'),
  coin: require('@/assets/audio/coin.wav'),
  timer_tick: require('@/assets/audio/timer_tick.wav'),
  level_up: require('@/assets/audio/level_up.wav'),
  purchase: require('@/assets/audio/coin.wav'), // reuse coin sound for purchases
};

const MUSIC_ASSETS: Record<MusicName, number> = {
  menu_music: require('@/assets/audio/menu_music.wav'),
  game_music: require('@/assets/audio/game_music.wav'),
};

// ─── Service ──────────────────────────────────────────────────────────────

class AudioService {
  private static instance: AudioService;

  private effectCache: Partial<Record<EffectName, Audio.Sound>> = {};
  private currentMusic: Audio.Sound | null = null;
  private currentMusicName: MusicName | null = null;
  private musicGeneration = 0;

  // Current playback configuration (synced from audio store via useAudio hook)
  private _volume = 0.7;
  private _muted = false;
  private _musicEnabled = true;
  private _soundEnabled = true;

  private initialized = false;

  static getInstance(): AudioService {
    if (!AudioService.instance) AudioService.instance = new AudioService();
    return AudioService.instance;
  }

  /** Must be called once (e.g. in _layout.tsx) to configure the audio session. */
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
      await this.stopMusic();
    } catch (err) {
      if (__DEV__) console.warn('[AudioService] init failed:', err);
    }
  }

  // ── Configuration setters (called by useAudio when store changes) ────────

  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    this.applyMusicVolume();
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    this.applyMusicVolume();
    if (muted) this.pauseMusic();
    else if (this.currentMusic && this._musicEnabled) this.resumeMusic();
  }

  setMusicEnabled(enabled: boolean): void {
    this._musicEnabled = enabled;
    if (!enabled) this.pauseMusic();
    else this.resumeMusic();
  }

  setSoundEnabled(enabled: boolean): void {
    this._soundEnabled = enabled;
  }

  // ── Effect playback ───────────────────────────────────────────────────────

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
      if (__DEV__) console.warn(`[AudioService] playEffect(${name}) failed:`, err);
    }
  }

  // ── Music playback ────────────────────────────────────────────────────────

  async playMusic(name: string): Promise<void> {
    const key = name as MusicName;
    if (!(key in MUSIC_ASSETS)) return;

    // Same track already playing — do nothing
    if (this.currentMusicName === key) {
      if (!this._musicEnabled || this._muted) {
        await this.pauseMusic();
      }
      return;
    }

    const generation = ++this.musicGeneration;
    await this.unloadCurrentMusic();
    if (generation !== this.musicGeneration) return;

    if (!this._musicEnabled || this._muted) return;

    try {
      const { sound } = await Audio.Sound.createAsync(
        MUSIC_ASSETS[key],
        {
          shouldPlay: true,
          isLooping: true,
          volume: this._volume * 0.45, // music quieter than effects
        },
      );

      if (generation !== this.musicGeneration) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch {
          // discarded in-flight player
        }
        return;
      }

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (!status.isLoaded && (status as any).error) {
          if (__DEV__) console.warn('[AudioService] music status error:', (status as any).error);
        }
      });

      this.currentMusic = sound;
      this.currentMusicName = key;
    } catch (err) {
      if (__DEV__) console.warn(`[AudioService] playMusic(${name}) failed:`, err);
    }
  }

  async stopMusic(): Promise<void> {
    this.musicGeneration += 1;
    await this.unloadCurrentMusic();
  }

  private async unloadCurrentMusic(): Promise<void> {
    if (!this.currentMusic) return;
    try {
      await this.currentMusic.stopAsync();
      await this.currentMusic.unloadAsync();
    } catch {
      // already unloaded
    }
    this.currentMusic = null;
    this.currentMusicName = null;
  }

  private async pauseMusic(): Promise<void> {
    if (!this.currentMusic) return;
    try {
      await this.currentMusic.pauseAsync();
    } catch {
      // not playing
    }
  }

  private async resumeMusic(): Promise<void> {
    if (!this.currentMusic) return;
    try {
      await this.currentMusic.playAsync();
    } catch {
      // failed silently
    }
  }

  private applyMusicVolume(): void {
    if (!this.currentMusic) return;
    const vol = this._muted ? 0 : this._volume * 0.45;
    this.currentMusic.setVolumeAsync(vol).catch(() => {});
  }

  // ── Cleanup (call on unmount / app background) ────────────────────────────

  async dispose(): Promise<void> {
    await this.stopMusic();
    for (const sound of Object.values(this.effectCache)) {
      try { await (sound as Audio.Sound).unloadAsync(); } catch { /* */ }
    }
    this.effectCache = {};
    this.initialized = false;
  }
}

export const audioService = AudioService.getInstance();
export default AudioService;
