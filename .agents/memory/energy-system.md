---
name: Energy system design
description: How the energy/stamina system works — store shape, refill logic, and lobby integration.
---

# Energy system

## Constants (constants/economy.ts)
- `MAX_ENERGY = 120` — full bar
- `ENERGY_REFILL_INTERVAL_MIN = 6` — 1 energy per 6 minutes (full refill in 12 h)
- `ENERGY_REFILL_GEM_COST = 30` — instant refill cost

## Store shape (store/userStore.ts)
- `energy: number` — current energy (defaults to MAX_ENERGY)
- `lastEnergyRefillTime: number | null` — Unix ms; null means energy is full and no clock running

## Actions
- `tickEnergy()` — lazy refill: computes elapsed time, adds floor(elapsed/interval) energy, saves remainder. Call on lobby focus and via a 60s setInterval.
- `spendEnergy(amount = 1)` — calls tickEnergy() first, then deducts; returns false if insufficient.
- `refillEnergyWithGems()` — costs ENERGY_REFILL_GEM_COST gems, sets energy = MAX, clears clock.

## Lobby integration (app/lobby.tsx)
- `tickEnergy()` called in useFocusEffect and via setInterval(60_000)
- PLAY button calls `spendEnergy(1)` → shows Alert if false (low energy)
- Header ⚡ pill shows `${energy}/${MAX_ENERGY}`; turns red when ≤10, orange when ≤40

**Why:** Lazy refill avoids background timers/workers. The store state is always correct after a tick call.
**How to apply:** Any screen that shows energy must call tickEnergy() on focus. Any action that costs energy must go through spendEnergy() (never mutate energy directly).
