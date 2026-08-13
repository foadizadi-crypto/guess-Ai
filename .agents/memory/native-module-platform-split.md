---
name: Native module platform split pattern
description: How to safely bundle native-only packages (AdMob, IAP) in an Expo monorepo without breaking web builds.
---

## Rule
Any service that requires a native-only package (react-native-google-mobile-ads, react-native-iap, etc.) MUST use the Metro platform-extension pattern:
- `ServiceName.ts` — pure mock, no native `require()` calls → used on web and as fallback
- `ServiceName.native.ts` — real implementation with `require('native-package')` → used on iOS/Android

The same applies to React components that import native modules (e.g. `AdBanner.native.tsx` / `AdBanner.tsx`).

**Why:** Metro bundles all `require()` calls at build time, even those inside `if (Platform.OS !== 'web')` runtime guards. A runtime check prevents execution but does not prevent bundling. On web, bundling a package that declares native-only code causes a 500 from the Metro dev server.

## Circular import trap
In `ServiceName.native.ts`, do NOT re-export from `./ServiceName` (e.g. `export { IAP_SKUS } from './IAPService'`). On native Metro resolves `./IAPService` → `./IAPService.native.ts` → circular dependency.
**Fix:** Duplicate shared constants directly in the `.native.ts` file, or extract them to a separate `ServiceName.types.ts` that neither platform file imports the other through.

**How to apply:** Whenever a new native package is added that does not have a web build, create a `.native.ts` override and keep `.ts` as a mock. Confirm via `npx tsc --noEmit` (EXIT:0) and a web screenshot.

## Web-variant files can silently rot

The `.native.ts` twin is the one that gets exercised on device, so a broken or
copy-pasted web variant can sit unnoticed for a long time: the web bundle then
imports a module that does not export the symbol the store expects, and the
failure only appears when someone finally calls it in the browser. When touching
a platform-split service, open BOTH files and confirm they export the same names.

**Web stubs must fail closed.** A rewarded-ad stub that returns `true` grants
real currency for an ad that never played. Return the "nothing happened" value.

## Alert.alert does nothing on web

react-native-web ships `class Alert { static alert() {} }` — a silent no-op.
Any user feedback delivered only through `Alert.alert` is invisible in the web
preview and cannot be verified there. **How to apply:** when e2e-testing a flow
on Expo web, assert on `console.log` output or state changes instead of the
dialog, and never conclude the handler failed just because no dialog appeared.
