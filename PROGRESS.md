# BlurQuiz — Work Progress Tracker

## ✅ ALL TASKS COMPLETE

---

### Ad System — Spec §7 (rewarded-only policy)
- **`store/adStore.ts`** — Full rewrite:
  - `sessionCounter` (persisted) — increments after every game session
  - `lastDailyAdTimestamp` (persisted) — 4-hour Daily Gift cooldown
  - `adFreePassExpiry` (persisted) — lifetime + timed Ad-Free Pass support
  - `isAdFreePassActive()`, `canShowDoubleReward()`, `isDailyAdAvailable()` helpers
  - All actions: `incrementSessionCounter`, `resetSessionCounter`, `setLastDailyAdClaimed`, `setAdFreePassExpiry`, `removeAds`
- **`app/game.tsx`** — Removed revive ad modal (timer → results directly). Session counter incremented on early `exitToLobby`.
- **`app/result.tsx`** — Removed forced interstitial. "Double Rewards" button doubles **both coins and XP**. Gated by `sessionCounter ≥ 3`. Ad-free pass skips ad but NOT counter. Counter resets only on successful watch; carries over on decline.
- **`app/lobby.tsx`** — Removed banner ad. New **"Free Lucky Spin"** FAB: 4-hour cooldown, 50–150 coins (random), 10% consumable bonus. Ad-free pass grants instantly. Shows remaining cooldown when unavailable.

### Task 1 — Let players buy the Ad-Free Pass from the shop ✅
- **`app/shop.tsx`** — Ad-Free Pass card added at top of Coins tab:
  - Purple shield icon, $2.99 price
  - Status: "Owned ✓ / Active · Lifetime / Active · expires [date]"
  - Calls `iapService.purchase(IAP_SKUS.REMOVE_ADS)` → `adStore.removeAds()`
  - **Restore Purchases** button at bottom (App Store compliance)

### Task 2 — App and API server running on Replit ✅
- `pnpm install` completed at workspace root
- **API Server** running on port 8080 (`artifacts/artifacts/api-server: API Server` workflow)
- **Expo app** running with QR code (`artifacts/artifacts/mobile: expo` workflow)
- Scan QR code in Expo Go app (Android) or Camera app (iOS) to test on device
- Web preview also available in Replit pane

### Task 3 — Wire Ad-Free Pass IAP to actually remove ads ✅
- **`services/IAPService.ts`** (web/mock) — `purchase(REMOVE_ADS)` now calls `useAdStore.getState().removeAds()` after mock delay
- **`services/IAPService.native.ts`** (native) — Same in mock-mode path + `setupListener` (via `grantAdFreePass()` helper) + `restoreAdsRemoved()` calls `grantAdFreePass()` on confirmed restore
- Full purchase → ad removal loop is now closed on both platforms

---

## Files Changed (complete list)
| File | Change |
|---|---|
| `store/adStore.ts` | Full rewrite — session counter, cooldown, pass expiry, all new actions |
| `app/game.tsx` | Removed revive ad; counter on early exit; removed Modal/showRewarded/adsRemoved |
| `app/result.tsx` | Removed interstitial; Double Rewards (coins+XP, counter-gated, ad-free aware) |
| `app/lobby.tsx` | Removed banner; Daily Gift FAB with 4h cooldown, random reward, consumable |
| `app/shop.tsx` | Ad-Free Pass card + Restore Purchases in Coins tab |
| `services/IAPService.ts` | REMOVE_ADS purchase → adStore.removeAds() |
| `services/IAPService.native.ts` | Same for native: purchase + restore both trigger removeAds() |
