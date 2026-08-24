/**
 * NotificationService.ts — Web / non-native stub
 *
 * expo-notifications is a native-only module. Metro resolves
 * NotificationService.native.ts on iOS/Android and falls back here on web.
 * Every method is a no-op so importing screens never need to guard.
 */

export const notificationService = {
  /** Register Android channels and configure foreground handler. */
  setup: async (): Promise<void> => {},

  /** Request OS permission. Returns true if granted. */
  requestPermission: async (): Promise<boolean> => false,

  // ── Stamina (notification #1) ────────────────────────────────────────────
  /** Schedule "stamina full" local notification in `minutesUntilFull` minutes. */
  scheduleStaminaFull: async (_minutesUntilFull: number): Promise<void> => {},
  /** Cancel any pending "stamina full" notification. */
  cancelStaminaFull: async (): Promise<void> => {},

  // ── Achievement (notification #2) ────────────────────────────────────────
  /** Fire an immediate notification for a newly unlocked achievement. */
  fireAchievementCompleted: async (_achievementName: string): Promise<void> => {},

  // ── Reward reminders (#3 daily · #5 weekly) ───────────────────────────────
  /** Schedule/reschedule the recurring daily-reward reminder (10:00 AM). */
  scheduleDailyReward: async (): Promise<void> => {},
  /** Schedule/reschedule the recurring weekly-challenge reminder (Mon 10 AM). */
  scheduleWeeklyReward: async (): Promise<void> => {},

  // ── Spin wheel (#11) ──────────────────────────────────────────────────────
  /** Schedule "free spin ready" notification after the cooldown expires. */
  scheduleSpinReady: async (_cooldownHours: number): Promise<void> => {},
  /** Cancel any pending "spin ready" notification. */
  cancelSpinReady: async (): Promise<void> => {},

  // ── Re-engagement (#13) ───────────────────────────────────────────────────
  /**
   * Schedule a 3-day inactive-player reminder.
   * Call when the app goes to background; cancel when it returns to foreground.
   */
  scheduleInactiveReminder: async (): Promise<void> => {},
  cancelInactiveReminder: async (): Promise<void> => {},
  /** Cancel all locally scheduled notifications when the preference is off. */
  cancelAllScheduledNotifications: async (): Promise<void> => {},

  // ── Remote push token (notifications #6-10, #12) ─────────────────────────
  /**
   * Return the Expo push token for this device.
   * Send to your backend to enable server-side push (events, shop offers,
   * leaderboard updates, new categories/cosmetics).
   */
  getExpoPushToken: async (): Promise<string | null> => null,

  // ── Notification tap navigation ───────────────────────────────────────────
  /**
   * Register a listener that fires when the user taps a notification.
   * `callback` receives the target route (e.g. '/lobby', '/spin').
   * Returns an unsubscribe function.  No-op on web.
   */
  addResponseListener: (_callback: (screen: string) => void): (() => void) => () => {},

  // ── Generic local notification (fallback stub) ────────────────────────────
  /** No-op on web. Native version schedules an immediate local notification. */
  scheduleLocalNotification: async (_opts: { title: string; body: string; trigger: null }): Promise<void> => {},
};
