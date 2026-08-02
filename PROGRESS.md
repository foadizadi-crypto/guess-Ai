# BlurQuiz — Work Progress Tracker

## ✅ COMPLETED

### Ad System — Spec §7 (rewarded-only policy)
- **`store/adStore.ts`** — Rebuilt from scratch:
  - `sessionCounter` (persisted) — increments after every game session
  - `lastDailyAdTimestamp` (persisted) — enforces 4-hour Daily Gift cooldown
  - `adFreePassExpiry` (persisted) — supports lifetime + timed Ad-Free Pass
  - `isAdFreePassActive()`, `canShowDoubleReward()`, `isDailyAdAvailable()` helpers
  - `incrementSessionCounter()`, `resetSessionCounter()`, `setLastDailyAdClaimed()`, `setAdFreePassExpiry()`, `removeAds()`
- **`app/game.tsx`** — Removed forced revive ad (timer → results directly). Session counter incremented on early exit via `exitToLobby`.
- **`app/result.tsx`** — Removed forced interstitial. Added "Double Rewards" button (doubles **both coins and XP**). Gated by `sessionCounter ≥ 3`. Ad-free pass skips ad but NOT counter. Counter resets only on successful watch; carries over on decline.
- **`app/lobby.tsx`** — Removed banner ad. Replaced "Watch Ad +50" FAB with **"Free Lucky Spin"** button: 4-hour cooldown, 50–150 coins (random), 10% chance for consumable (time_boost or error_nullifier). Ad-free pass grants instantly. Cooldown timer shown when on cooldown.

### Shop — Ad-Free Pass (Task 1 of 3)
- **`app/shop.tsx`** — Added to Coins tab:
  - **Ad-Free Pass card** ($2.99, purple shield icon) above coin packages
  - Shows "Owned ✓" / "Active · Lifetime" / expiry date when active
  - Calls `iapService.purchase(IAP_SKUS.REMOVE_ADS)` → `adStore.removeAds()` on success
  - **Restore Purchases** button at bottom (App Store compliance)

---

## 🔲 TODO (remaining tasks)

### Task 2 — Get the app and API server running on Replit
- Install dependencies (`pnpm install` — already done once)
- Configure API key secrets: at least one of `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- Optional: `DATABASE_URL` for leaderboard/profile persistence
- Start workflows: `artifacts/artifacts/mobile: expo` and `artifacts/artifacts/api-server: API Server`
- Verify Expo web preview is visible in Replit pane

### Task 3 — Wire Ad-Free Pass IAP to actually remove ads
- **`services/IAPService.ts`** (web/mock) — call `useAdStore.getState().removeAds()` after REMOVE_ADS purchase resolves true
- **`services/IAPService.native.ts`** — same in the native purchase listener + `restoreAdsRemoved()`
- Both files currently resolve the purchase but never update `adStore`

---

## Files Changed (summary)
| File | Change |
|---|---|
| `store/adStore.ts` | Full rewrite — new session counter, cooldown, pass expiry |
| `app/game.tsx` | Removed revive ad; counter on early exit |
| `app/result.tsx` | Removed interstitial; Double Rewards (coins+XP, counter-gated) |
| `app/lobby.tsx` | Removed banner; new Daily Gift FAB with 4h cooldown |
| `app/shop.tsx` | Ad-Free Pass card + Restore Purchases in Coins tab |
