---
name: Notification service
description: Architecture of the push/local notification system — file split, 13 notification types, store hooks, AppState wiring.
---

# Notification Service Architecture

## File split (Metro platform resolution)
- `services/NotificationService.ts` — web stub, all no-ops
- `services/NotificationService.native.ts` — real expo-notifications implementation

Both export the same `notificationService` object with identical method signatures.

## Local notifications (scheduled by app)
| # | Name | Trigger site | ID constant |
|---|---|---|---|
| 1 | Stamina Full | `userStore.spendEnergy` (schedule) + `tickEnergy` (cancel when full) | `blurquiz-stamina-full` |
| 2 | Achievement Completed | `userStore.checkAndUnlockAchievements` (first of batch) | — (no stable ID; immediate) |
| 3+4 | Daily Reward Reminder | `userStore.claimDailyReward` + `_layout.tsx` mount | `blurquiz-daily-reward` |
| 5 | Weekly Reward Reminder | `_layout.tsx` mount | `blurquiz-weekly-reward` |
| 11 | Spin Wheel Ready | `userStore.performSpin` (free spin only) | `blurquiz-spin-ready` |
| 13 | Inactive Reminder | `_layout.tsx` AppState → background | `blurquiz-inactive` |

## Remote notifications (server-side via FCM/APNs — stubs only)
Types 6-10 and 12 (events, new content, leaderboard) require a push backend.
- `notificationService.getExpoPushToken()` returns the Expo push token.
- In `_layout.tsx` NotificationProvider: token is fetched on mount and logged in dev. Wire `firestoreService.savePushToken(playerId, token)` to activate.

## AppState wiring (_layout.tsx)
- App → `background`: `scheduleInactiveReminder()` (fires 3 days later)
- App → `active`: `cancelInactiveReminder()`
- On mount: `setup()` → `requestPermission()` → `scheduleDailyReward()` + `scheduleWeeklyReward()`

## Notification preference gate
All store-triggered notifications check `get().settings.notifications` before firing.
Android channel IDs: `gameplay`, `rewards`, `engagement`.

**Why:** expo-notifications is native-only — web stub prevents Metro from trying to bundle native APIs on web. All scheduling is lazy (called at point of event) to keep notifications relevant and cancellable.

**How to apply:**
- Any new notification type: add to both `.ts` (stub) and `.native.ts` (real).
- Always use `scheduleUnique(id, ...)` with a stable ID so it can be cancelled.
- Wrap store-side calls in `if (get().settings.notifications)`.
