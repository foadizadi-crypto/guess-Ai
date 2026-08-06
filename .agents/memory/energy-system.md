---
name: Energy system design
description: How the stamina/energy system works — store shape, refill logic, ad rewards, and lobby integration.
---

# Stamina / Energy system

## Constants (constants/economy.ts)
- `MAX_ENERGY = 50` — full stamina bar
- `STAMINA_PER_GAME = 10` — cost per game round
- `ENERGY_REFILL_INTERVAL_MIN = 10` — 1 stamina every 10 minutes (full refill in ~8.3 h)
- `STAMINA_AD_REWARD = 5` — stamina granted per rewarded-ad watch
- `STAMINA_ADS_PER_DAY = 5` — max ad watches for stamina per calendar day
- `ENERGY_REFILL_GEM_COST = 30` — gems to instantly refill to max

## Store shape (store/userStore.ts)
- `energy: number` — current stamina (defaults to MAX_ENERGY = 50)
- `lastEnergyRefillTime: number | null` — Unix ms; null means energy is full and no clock running

## Actions (userStore)
- `tickEnergy()` — lazy refill: computes elapsed time, adds floor(elapsed/interval) energy, saves remainder. Call on lobby focus and via a 60s setInterval.
- `spendEnergy(amount = STAMINA_PER_GAME)` — calls tickEnergy() first, then deducts 10 by default; returns false if insufficient.
- `addStamina(amount)` — adds stamina capped at MAX, keeps/clears refill clock correctly.
- `refillEnergyWithGems()` — costs ENERGY_REFILL_GEM_COST gems, sets energy = MAX, clears clock.

## Ad tracking (store/adStore.ts)
- `staminaAdsToday: number`, `lastStaminaAdDate: string | null`
- `canWatchStaminaAd()` — true when fewer than STAMINA_ADS_PER_DAY ads watched today
- `recordStaminaAdWatched()` — increments counter and records today's date

## Lobby integration (app/lobby.tsx)
- `tickEnergy()` called in useFocusEffect and via setInterval(60_000)
- PLAY button calls `spendEnergy()` (defaults to STAMINA_PER_GAME=10) → Alert if false
- Header ⚡ pill shows `${energy}/${MAX_ENERGY}`; red when < 10, orange when ≤ 20
- "Watch Ad +5⚡" button appears below PLAY when ads remain today; calls showRewarded() → addStamina(5) → recordStaminaAdWatched()
- Remaining ad count shown in button: "(3/5 left)"

**Why:** Lazy refill avoids background timers/workers. The store state is always correct after a tick call.
**How to apply:** Any screen that shows energy must call tickEnergy() on focus. Any action that costs energy must go through spendEnergy() (never mutate energy directly). Ad stamina flow: canWatchStaminaAd() check → showRewarded() → addStamina() + recordStaminaAdWatched().
