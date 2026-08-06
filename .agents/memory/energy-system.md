---
name: Energy system design
description: How the two-tier stamina system works — active + reserve, store shape, refill logic, consumption priority, UI display.
---

# Two-Tier Stamina System

## Constants (constants/economy.ts)
- `MAX_ENERGY = 50` — active stamina cap
- `STAMINA_PER_GAME = 10` — cost per game round
- `ENERGY_REFILL_INTERVAL_MIN = 10` — passive refill: 1 active stamina every 10 min
- `STAMINA_AD_REWARD = 5` — stamina added to reserve per rewarded ad
- `STAMINA_ADS_PER_DAY = 5` — max ad watches for stamina per calendar day
- `ENERGY_REFILL_GEM_COST = 30` — gems to instantly refill active to max

## Store fields (store/userStore.ts)
- `energy: number` — active stamina (0–MAX_ENERGY). Passively refills.
- `staminaReserve: number` — uncapped reserve. Holds purchased / rewarded / ad stamina.
- `lastEnergyRefillTime: number | null` — Unix ms; null = active is full (no tick running)

## Consumption priority
1. `spendEnergy(amount = STAMINA_PER_GAME)`:
   - Calls `tickEnergy()` first (lazy refill)
   - If `energy + staminaReserve < amount` → returns `false`
   - If `energy >= amount` → deducts from active only
   - If `energy < amount` → uses all active, deducts remainder from reserve
2. Active reaches 0 before reserve is touched.

## Incoming stamina routing
- `addStamina(amount)` — ALWAYS goes to reserve; never directly to active.
- Ad rewards, gem pack stamina, event rewards, spin rewards → all call `addStamina` → reserve.
- Passive time refill only fills active; reserve is untouched by time.

## UI (app/lobby.tsx)
- Header: `⚡ {energy}/{MAX_ENERGY}` pill + optional `📦 {staminaReserve}` pill (hidden when 0)
- PLAY button subtitle: `{energy}/{MAX_ENERGY} + 📦{reserve} · 10/round`
- Alert on no stamina shows both active and reserve values
- Ad button below PLAY: "+5⚡ Watch Ad (n/5 left)" → adds to reserve

**Why:** Reserve prevents purchased/earned stamina from being silently capped at MAX_ENERGY. Active stays balanced (time-gated). Reserve preserves real-money and reward value.

**How to apply:**
- Any feature that grants stamina must call `addStamina()` → goes to reserve.
- Never add stamina directly to `energy` field except in `tickEnergy` (passive) and `refillEnergyWithGems` (gem purchase fills active to MAX).
- `spendEnergy()` handles the two-tier drain automatically — callers don't need to know about reserve.
