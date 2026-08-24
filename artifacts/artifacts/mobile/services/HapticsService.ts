import * as Haptics from 'expo-haptics';
import { useUserStore } from '@/store/userStore';

/**
 * Single gameplay haptics gateway. Every call checks the persisted preference
 * immediately, so changing Settings takes effect without restarting the app.
 */
export const hapticsService = {
  impact: async (style: Haptics.ImpactFeedbackStyle): Promise<void> => {
    if (!useUserStore.getState().settings.vibration) return;
    try { await Haptics.impactAsync(style); } catch { /* unsupported device */ }
  },
  notification: async (type: Haptics.NotificationFeedbackType): Promise<void> => {
    if (!useUserStore.getState().settings.vibration) return;
    try { await Haptics.notificationAsync(type); } catch { /* unsupported device */ }
  },
  selection: async (): Promise<void> => {
    if (!useUserStore.getState().settings.vibration) return;
    try { await Haptics.selectionAsync(); } catch { /* unsupported device */ }
  },
};
