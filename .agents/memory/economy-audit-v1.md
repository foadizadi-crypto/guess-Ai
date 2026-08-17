---
name: Economy audit v1.0.0
description: What changed and what to check when the spec diverges from the implementation
---

## Changes applied (spec v1.0.0)

**Why:** The pre-implementation codebase had wrong values across energy, XP, session rewards, level rewards, and wings — all compared against the uploaded spec document.

**How to apply:** Use these as the authoritative numbers when building new features that touch economy.

### Energy
- `MAX_ENERGY` = 100 (was 50)
- `STAMINA_PER_GAME` = 5 (was 10)
- `STAMINA_ADS_PER_DAY` = 3 (was 5)
- `REWARDED_ADS_DAILY_FREE/PREMIUM` = 3 (was 5/10)
- `ENERGY_DAILY_REWARD` = 10 (new constant — daily reward now also grants +10 energy)

### XP Per Answer
- `xp_correct_medium` = 13 (was 15)
- `xp_correct_hard` = 15 (was 25)

### Session/Perfect Rewards
- Now per-difficulty in `constants/gameConfig.ts`
- Helper functions: `sessionCompleteCoins(d)`, `sessionCompleteXP(d)`, `perfectGameCoins(d)`, `perfectGameXP(d)`
- `app/result.tsx` uses these helpers — do NOT use flat XP_COMPLETION_BONUS / COINS_PERFECT_GAME_BONUS there

### Level Rewards
- `constants/levelRewards.ts` fully rewritten — 5-level and 10-level recurring rewards + special milestones
- Gems removed from all level rewards (violates spec)
- `LEVEL_GEM_REWARDS` in economy.ts emptied and marked @deprecated

### Wings
- `constants/wings.ts` created: 5 free (level-unlocked) + 30 premium (15 common@50g, 10 rare@80g, 5 legendary@150g)
- Weekly discount: deterministic via `getWeeklyDiscountWing()` — ISO week number, NOT random
- Wings state in userStore: `ownedWings: string[]`, `equippedWing: string | null`
- Actions: `purchaseWing(wingId, gemCost)`, `equipWing(wingId | null)`

### IAP Gem Packs
- Spec: 100 gems/$1.99 | 500 gems/$4.99 | 1200 gems/$9.99
- Both `IAPService.ts` (web) and `IAPService.native.ts` now match
- `IAP_GEM_PACKS` in economy.ts also aligned

### grantStarterPack
- Was: +500 coins +100 gems (wrong — gems via IAP only)
- Now: +500 coins +5 combo_shield +3 clarity_bomb +silver frame (spec: "5 Combo Shields + 3 Clarity Bombs + Silver Frame")
