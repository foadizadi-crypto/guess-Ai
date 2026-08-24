/**
 * NotificationService.native.ts — iOS & Android implementation
 *
 * Covers 13 notification types:
 *  Local (scheduled by the app):
 *   1  Stamina Full
 *   2  Achievement Completed     (immediate)
 *   3  Free Reward Available     (daily 10 AM recurring)
 *   4  Daily Reward Reminder     (daily 10 AM recurring — same slot as #3)
 *   5  Weekly Reward Reminder    (Mon 10 AM recurring)
 *  11  Spin Wheel Ready
 *  13  Inactive Player Return    (3-day delayed)
 *
 *  Remote (server-side via FCM / APNs — infrastructure provided):
 *   6  New Event Started
 *   7  Event Ending Soon
 *   8  New Image Category Added
 *   9  New Cosmetic Items Available
 *  10  Shop Special Offer
 *  12  Leaderboard Rank Update
 *
 * Metro selects this file on iOS/Android; NotificationService.ts is the web stub.
 *
 * NOTE: expo-notifications throws a hard error at import time when running inside
 * Expo Go on SDK 53+ (remote push was removed from Expo Go). We use a lazy require()
 * guarded by Constants.appOwnership so Expo Go never attempts to load the module.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
// Import only the TypeScript types — this never executes at runtime.
import type * as NotifModule from 'expo-notifications';

// ── Expo Go guard ──────────────────────────────────────────────────────────────
// Constants.appOwnership === 'expo' means we are running inside Expo Go.
// In that case we skip the require() so the module never throws.
const isExpoGo = (Constants.appOwnership as string) === 'expo';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const N: typeof NotifModule | null = isExpoGo ? null : (() => {
  try { return require('expo-notifications') as typeof NotifModule; } catch { return null; }
})();

// ── Foreground behaviour ───────────────────────────────────────────────────────
// Only set when module loaded; skipped silently in Expo Go.
if (N) {
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert:  true,
      shouldPlaySound:  true,
      shouldSetBadge:   false,
      shouldShowBanner: true,
      shouldShowList:   true,
    }),
  });
}

// ── Fixed identifiers (allow cancellation by ID) ──────────────────────────────
const IDS = {
  // Keep these channel IDs stable so existing installs retain their
  // notification settings; only the user-facing app name is standardized.
  STAMINA_FULL:  'blurquiz-stamina-full',
  SPIN_READY:    'blurquiz-spin-ready',
  DAILY_REWARD:  'blurquiz-daily-reward',
  WEEKLY_REWARD: 'blurquiz-weekly-reward',
  INACTIVE:      'blurquiz-inactive',
} as const;

// ── Android notification channels ─────────────────────────────────────────────
async function createChannels(): Promise<void> {
  if (!N || Platform.OS !== 'android') return;
  await Promise.all([
    N.setNotificationChannelAsync('gameplay', {
      name: 'Gameplay',
      description: 'Stamina and in-game alerts',
      importance: N.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    }),
    N.setNotificationChannelAsync('rewards', {
      name: 'Rewards & Achievements',
      description: 'Daily rewards, achievements, spin wheel',
      importance: N.AndroidImportance.DEFAULT,
      sound: 'default',
    }),
    N.setNotificationChannelAsync('engagement', {
      name: 'Reminders',
      description: 'Come-back nudges',
      importance: N.AndroidImportance.LOW,
    }),
  ]);
}

// ── Setup & permissions ───────────────────────────────────────────────────────
async function setup(): Promise<void> {
  if (!N) return; // Expo Go — skip silently
  try {
    await createChannels();
  } catch { /* simulator / web — ignore */ }
}

async function requestPermission(): Promise<boolean> {
  if (!N) return false;
  try {
    const { status: existing } = await N.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await N.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Cancel existing then schedule with a stable identifier. */
async function scheduleUnique(
  id: string,
  content: NotifModule.NotificationContentInput,
  trigger: NotifModule.NotificationTriggerInput,
): Promise<void> {
  if (!N) return;
  try {
    await N.cancelScheduledNotificationAsync(id);
    await N.scheduleNotificationAsync({ identifier: id, content, trigger });
  } catch { /* no permission or simulator */ }
}

async function cancel(id: string): Promise<void> {
  if (!N) return;
  try { await N.cancelScheduledNotificationAsync(id); } catch { /* ignore */ }
}

async function cancelAllScheduledNotifications(): Promise<void> {
  if (!N) return;
  try { await N.cancelAllScheduledNotificationsAsync(); } catch { /* no permission or simulator */ }
}

// ── 1. Stamina Full ───────────────────────────────────────────────────────────
async function scheduleStaminaFull(minutesUntilFull: number): Promise<void> {
  if (!N || minutesUntilFull <= 0) return;
  await scheduleUnique(
    IDS.STAMINA_FULL,
    {
      title: '⚡ Stamina fully restored!',
      body: 'Your energy is at 50/50 — come back and play GUESSAi!',
      data: { screen: 'lobby' },
      ...(Platform.OS === 'android' ? { android: { channelId: 'gameplay' } } : {}),
    },
    {
      type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutesUntilFull * 60,
    },
  );
}

async function cancelStaminaFull(): Promise<void> {
  await cancel(IDS.STAMINA_FULL);
}

// ── 2. Achievement Completed (immediate) ──────────────────────────────────────
async function fireAchievementCompleted(achievementName: string): Promise<void> {
  if (!N) return;
  try {
    await N.scheduleNotificationAsync({
      content: {
        title: '🏆 Achievement Unlocked!',
        body: `You earned: ${achievementName}`,
        data: { screen: 'achievements' },
        ...(Platform.OS === 'android' ? { android: { channelId: 'rewards' } } : {}),
      },
      trigger: null, // immediate
    });
  } catch { /* ignore */ }
}

// ── 3 + 4. Daily Reward Reminder (recurring — 10:00 AM local) ────────────────
async function scheduleDailyReward(): Promise<void> {
  if (!N) return;
  await scheduleUnique(
    IDS.DAILY_REWARD,
    {
      title: '🎁 Daily reward ready!',
      body: 'Your free daily reward is waiting. Claim it now!',
      data: { screen: 'daily-reward' },
      ...(Platform.OS === 'android' ? { android: { channelId: 'rewards' } } : {}),
    },
    {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour: 10,
      minute: 0,
    },
  );
}

// ── 5. Weekly Reward Reminder (recurring — Monday 10:00 AM) ──────────────────
async function scheduleWeeklyReward(): Promise<void> {
  if (!N) return;
  await scheduleUnique(
    IDS.WEEKLY_REWARD,
    {
      title: '📅 Weekly challenge reset!',
      body: 'New weekly challenges are live — play now and earn bonus rewards!',
      data: { screen: 'lobby' },
      ...(Platform.OS === 'android' ? { android: { channelId: 'rewards' } } : {}),
    },
    {
      type: N.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 2, // 1=Sun … 7=Sat; 2=Monday
      hour: 10,
      minute: 0,
    },
  );
}

// ── 11. Spin Wheel Ready ──────────────────────────────────────────────────────
async function scheduleSpinReady(cooldownHours: number): Promise<void> {
  if (!N || cooldownHours <= 0) return;
  await scheduleUnique(
    IDS.SPIN_READY,
    {
      title: '🎰 Your free spin is ready!',
      body: 'Come back and spin the wheel — you could win big!',
      data: { screen: 'spin' },
      ...(Platform.OS === 'android' ? { android: { channelId: 'rewards' } } : {}),
    },
    {
      type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.round(cooldownHours * 3_600),
    },
  );
}

async function cancelSpinReady(): Promise<void> {
  await cancel(IDS.SPIN_READY);
}

// ── 13. Inactive Player Return Reminder (3-day delay) ────────────────────────
async function scheduleInactiveReminder(): Promise<void> {
  if (!N) return;
  await scheduleUnique(
    IDS.INACTIVE,
    {
      title: "👋 We miss you, quiz master!",
      body: "Your stamina has been refilling — come back and show off your skills!",
      data: { screen: 'lobby' },
      ...(Platform.OS === 'android' ? { android: { channelId: 'engagement' } } : {}),
    },
    {
      type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3 * 24 * 60 * 60, // 3 days
    },
  );
}

async function cancelInactiveReminder(): Promise<void> {
  await cancel(IDS.INACTIVE);
}

// ── Remote push token (#6-10, #12) ───────────────────────────────────────────
/**
 * Returns the Expo push token for this device.
 * Returns null in Expo Go (not supported since SDK 53).
 */
async function getExpoPushToken(): Promise<string | null> {
  if (!N) return null;
  try {
    const token = await N.getExpoPushTokenAsync();
    return token.data;
  } catch {
    // Fails on simulators and in Expo Go without a project ID configured
    return null;
  }
}

/**
 * Register a listener for when the user taps a notification.
 * Maps notification identifiers to Expo Router screen paths.
 * Returns an unsubscribe function.
 */
function addResponseListener(callback: (screen: string) => void): () => void {
  if (!N) return () => {};
  const sub = N.addNotificationResponseReceivedListener((response) => {
    const id = response.notification.request.identifier;
    let screen = '/lobby';
    if (id === IDS.SPIN_READY)                         screen = '/spin';
    else if (id === IDS.DAILY_REWARD ||
             id === IDS.WEEKLY_REWARD)                 screen = '/lobby';
    else if (id === IDS.STAMINA_FULL ||
             id === IDS.INACTIVE)                      screen = '/lobby';
    else if (id.includes('achievement'))               screen = '/achievements';
    callback(screen);
  });
  return () => sub.remove();
}

export const notificationService = {
  setup,
  requestPermission,
  scheduleStaminaFull,
  cancelStaminaFull,
  fireAchievementCompleted,
  scheduleDailyReward,
  scheduleWeeklyReward,
  scheduleSpinReady,
  cancelSpinReady,
  scheduleInactiveReminder,
  cancelInactiveReminder,
  cancelAllScheduledNotifications,
  getExpoPushToken,
  addResponseListener,
};
