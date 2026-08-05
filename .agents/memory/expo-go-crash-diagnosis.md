---
name: Expo Go crash diagnosis
description: How to map BlurQuiz/Expo Go device errors to root causes quickly
---

**Rule:** Map the on-device error message to the failure layer before touching code:
- Blue "Something went wrong" screen right at launch → a package with native modules not bundled in Expo Go (e.g. react-native-keyboard-controller, google-mobile-ads, iap). Fix by removing/guarding the import; runtime Platform guards don't help since the crash happens at module registration.
- `java.io.IOException: Failed to download remote update` → Metro failed to *bundle* (or device can't reach tunnel). Check the expo workflow logs for "Bundling failed" and unresolved imports first.

**Why:** Both errors look like "connection problems" but usually aren't; hours were spent on cache-clearing when the real causes were an un-bundleable native package and a missing `@/assets/icons` module.

**How to apply:** Verify from the shell: curl the manifest at `https://$REPLIT_EXPO_DEV_DOMAIN/` (expo-platform header) then curl the `launchAsset.url` — a 200 with ~15MB means bundling works and the problem is on-device (reload/clear Expo Go).
