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
