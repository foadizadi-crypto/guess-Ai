# BlurQuiz — Work Progress Tracker

## ✅ ALL TASKS COMPLETE

---

### Ad System — Spec §7 (rewarded-only policy)
- **`store/adStore.ts`** — Full rewrite: session counter, 4h Daily Gift cooldown, lifetime/timed Ad-Free Pass expiry, all helpers and actions
- **`app/game.tsx`** — Removed revive ad modal; session counter incremented on early `exitToLobby`
- **`app/result.tsx`** — Removed forced interstitial; "Double Rewards" button (coins+XP), gated by `sessionCounter ≥ 3`; ad-free pass skips ad only, not counter
- **`app/lobby.tsx`** — Removed banner ad; "Free Lucky Spin" FAB with 4h cooldown, 50–150 coins, 10% consumable, cooldown timer display

### Task 1 — Ad-Free Pass in Shop ✅
- **`app/shop.tsx`** — Ad-Free Pass card ($2.99, purple shield) at top of Coins tab; status display; Restore Purchases button at bottom

### Task 2 — App Running on Replit ✅
- Both workflows started: Expo (QR code + web) and API Server (port 8080)
- Scan QR code with Expo Go to test on device

### Task 3 — Wire IAP → adStore ✅
- **`services/IAPService.ts`** — REMOVE_ADS purchase calls `adStore.removeAds()`
- **`services/IAPService.native.ts`** — Same for native mock + purchase listener + restoreAdsRemoved

### Database Schema — Spec §9 ✅
- **`lib/lib/db/src/schema/index.ts`** — Extended/added:
  - `players` table: new columns `gems`, `current_xp`, `total_xp (BIGINT)`, `session_counter`, `last_daily_ad_timestamp`, `ad_free_pass_expiry`
  - `inventory` table (NEW): player_id, item_id, quantity — stackable consumables
  - `game_history` table (NEW): UUID PK, player_id, difficulty enum, category, correct/wrong answers, max_combo, xp_earned, coins_earned, start_time, end_time
  - `config` table (NEW): key-value store for live balancing (TEXT key PK, value, description, updated_at)
  - `difficultyEnum` pgEnum: `easy | medium | hard`
- **`lib/lib/db/src/seeds.ts`** (NEW): `seedConfig()` function — upserts all GAME_CONFIG values into config table (28 keys including XP formula, combo tiers, blur mechanics, ad cooldowns, coin rates)
- **`lib/lib/db/src/seed-runner.ts`** (NEW): standalone CLI runner — `pnpm --filter @workspace/db run seed`
- **`lib/lib/db/package.json`** — added `"seed"` script

---

## Next Steps (if more work requested)
- **Push schema to DB**: requires `DATABASE_URL` secret → `pnpm --filter @workspace/db run push`
- **Seed config**: `pnpm --filter @workspace/db run seed`
- **API routes** for game_history writes (POST /sessions) and config reads (GET /config)
- **Mobile sync** — write game sessions to DB after each game (currently local-only)

---

## All Changed Files
| File | Change |
|---|---|
| `store/adStore.ts` | Full rewrite |
| `app/game.tsx` | Removed revive ad; counter on exit |
| `app/result.tsx` | Removed interstitial; Double Rewards (counter-gated) |
| `app/lobby.tsx` | Removed banner; Daily Gift FAB (4h cooldown) |
| `app/shop.tsx` | Ad-Free Pass card + Restore Purchases |
| `services/IAPService.ts` | REMOVE_ADS → adStore.removeAds() |
| `services/IAPService.native.ts` | Same + restore wired |
| `lib/lib/db/src/schema/index.ts` | Extended players; added inventory, game_history, config, difficultyEnum |
| `lib/lib/db/src/seeds.ts` | NEW — seedConfig() with all 28 economy keys |
| `lib/lib/db/src/seed-runner.ts` | NEW — CLI seed runner |
| `lib/lib/db/package.json` | Added seed script |
