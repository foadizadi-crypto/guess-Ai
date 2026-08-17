---
name: Web preview is not the device (Expo)
description: Two traps that make browser-based verification of an Expo app lie about what the device does.
---

Verifying an Expo app in the browser preview is fast and usually representative — except for two things that silently invert the result.

## Reloading the page is not a cold start

Expo Router keeps the current URL across a reload. Reloading while on an inner route re-mounts *that* route; the entry route and its splash/boot gate never run. So "I reloaded and it went straight to the right screen" proves nothing about startup.

**How to apply:** to exercise the real boot path, navigate explicitly to `/` and wait out the splash. Say so in the e2e instructions — a tester told to "reload" will reload the inner route and report a false pass.

## expo-secure-store has no web implementation

Every call throws `ExpoSecureStore.default.getValueWithKeyAsync is not a function`. If the storage wrapper catches and returns a default (a sensible native design), the failure is invisible: anything kept in secure storage — a username, a token — simply never reads back in the browser, and the app behaves as if the player were new on every visit. On device it works fine, so this looks like a real bug that will not reproduce for the user.

**Why:** the wrapper's `catch` turns a missing platform implementation into a legitimate-looking "no value stored".

**How to apply:** give secure storage an explicit web branch backed by AsyncStorage/localStorage, keyed with a prefix, and leave the native path untouched. It is not a secure store, but the browser build is a development preview. Without it, no browser-based test of a returning-player flow can pass.
