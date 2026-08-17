import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { STORAGE_KEYS, SECURE_STORE_KEYS } from '@/constants';

// expo-secure-store has no web implementation — every call throws
// "ExpoSecureStore.default.getValueWithKeyAsync is not a function". Without a
// fallback the username never reads back in the browser preview, so a cold
// start always lands on the login screen there even though the device is fine.
// Web keeps the same keys in AsyncStorage (localStorage); it is not a secure
// store, but the browser build is a development preview, not a shipped target.
const SECURE_WEB_PREFIX = 'websecure:';
const useWebFallback = Platform.OS === 'web';

// ─── Service class ────────────────────────────────────────────────────────

class StorageService {
  private static instance: StorageService;

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // ──── SecureStore (sensitive data) ────────────────────────────────────────

  async saveSecure(key: string, value: string): Promise<void> {
    try {
      if (useWebFallback) {
        await AsyncStorage.setItem(SECURE_WEB_PREFIX + key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn(`[Storage] SecureStore.set failed — key="${key}"`, error);
    }
  }

  async loadSecure(key: string): Promise<string | null> {
    try {
      if (useWebFallback) {
        return await AsyncStorage.getItem(SECURE_WEB_PREFIX + key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`[Storage] SecureStore.get failed — key="${key}"`, error);
      return null;
    }
  }

  async deleteSecure(key: string): Promise<void> {
    try {
      if (useWebFallback) {
        await AsyncStorage.removeItem(SECURE_WEB_PREFIX + key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn(`[Storage] SecureStore.delete failed — key="${key}"`, error);
    }
  }

  // ──── AsyncStorage (game data) ────────────────────────────────────────────

  async save<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`[Storage] AsyncStorage.set failed — key="${key}"`, error);
    }
  }

  async load<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw === null) return defaultValue;
      const parsed: unknown = JSON.parse(raw);
      return this.mergeWithDefaults(parsed, defaultValue);
    } catch (error) {
      console.warn(`[Storage] AsyncStorage.get failed — key="${key}"`, error);
      return defaultValue;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn(`[Storage] AsyncStorage.delete failed — key="${key}"`, error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.warn('[Storage] AsyncStorage.clear failed', error);
    }
  }

  // ──── Data integrity ──────────────────────────────────────────────────────
  // Merges persisted data with defaults so missing keys don't crash the app.

  private mergeWithDefaults<T>(data: unknown, defaults: T): T {
    if (data === null || data === undefined) return defaults;
    if (typeof defaults === 'object' && defaults !== null && !Array.isArray(defaults)) {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) return defaults;
      return { ...defaults, ...(data as Partial<T>) };
    }
    if (typeof data !== typeof defaults) return defaults;
    return data as T;
  }

  // ──── Convenience helpers ─────────────────────────────────────────────────

  async saveUsername(username: string): Promise<void> {
    return this.saveSecure(SECURE_STORE_KEYS.USERNAME, username);
  }

  async loadUsername(): Promise<string | null> {
    return this.loadSecure(SECURE_STORE_KEYS.USERNAME);
  }

  async setOnboardingDone(): Promise<void> {
    return this.save(STORAGE_KEYS.ONBOARDING_DONE, true);
  }

  async isOnboardingDone(): Promise<boolean> {
    return this.load(STORAGE_KEYS.ONBOARDING_DONE, false);
  }
}

export const storageService = StorageService.getInstance();
export default StorageService;
