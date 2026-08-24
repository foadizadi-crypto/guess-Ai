---
name: Settings feedback preferences
description: How global sound, haptic, and notification preferences are enforced
---

The Settings toggles are persisted preferences, not screen-local UI state. Sound effects must flow through the singleton audio service, haptics must check the user preference at call time, and notification scheduling must cancel future local notifications when disabled.

**Why:** Several screens had their own tap feedback implementations, so toggling Settings did not mute all interactions and notification reminders continued after the user turned them off.

**How to apply:** When adding a new interaction, use the shared audio/haptics services. When adding a scheduled notification, make it part of the existing notification provider’s enabled/disabled synchronization rather than creating a second scheduler.