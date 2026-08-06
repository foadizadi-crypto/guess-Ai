---
name: Coin economy
description: Level coin formula for 1-100, coin→gem exchange constants and state, shop section.
---

# Coin Economy

## Level coin formula (constants/levelRewards.ts)
Every level 1-100 grants coins (not just every-5 minor levels):
- Levels 1–10:  300 coins/level  →  3,000 total
- Levels 11–50: 700 coins/level  → 28,000 total
- Levels 51–100: 1,500 coins/level → 75,000 total
- **Total 1-100: 106,000 coins**

Levels 101-500: unchanged — coins only at minor (every 5) intervals via `minorCoins()`.

Items (error nullifiers, stickers, titles) still drop at every-5 minor levels for ALL ranges, including 1-100. The change only affects the coin amount.

## Coin → Gem exchange (constants/economy.ts)
```ts
export const COIN_GEM_EXCHANGES = [
  { id: 'coin_gem_30k',  coins: 30_000,  gems: 5,  maxPurchases: 2 },
  { id: 'coin_gem_100k', coins: 100_000, gems: 25, maxPurchases: 1 },
] as const;
```

## Store state (store/userStore.ts)
- `coinGemExchanges: Record<string, number>` — lifetime purchase count per tier ID
- `buyCoinGemExchange(id: CoinGemExchangeId) => boolean` — deducts coins, grants gems, increments counter; returns false if cap reached or insufficient coins
- Persisted in AsyncStorage, merged with `saved.coinGemExchanges ?? {}`

## Shop UI (app/shop.tsx)
A "Convert Coins → Gems" section appears in the Coin Shop tab (tab === 0) between the item grid and the "Buy More Coins" IAP section. Shows per-tier use count (x/maxPurchases) and disables when maxed.

**Why:** Gives high-coin players a meaningful sink and a path to gems without real money, while capping prevents the exchange from trivialising the gem economy.
