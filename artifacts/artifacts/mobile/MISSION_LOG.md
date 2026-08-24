# GUESSAi — Mission Log

Track completed missions here. Resume from the next incomplete mission if the session is interrupted.

---

## Mission 1 — Overall Objective ✅
**Status:** Complete (context only, no code changes)
**Summary:** GUESSAi is a 500-level mobile quiz game where players guess blurred images. No Pay-to-Win mechanics. All rewards are cosmetic, social, or progression-based. Every tunable number lives in a single config file.

---

## Mission 2 — Core Configuration File ✅
**Status:** Complete
**Files changed:**
- `constants/gameConfig.ts` — **NEW** — central config file with all tunable values
- `constants/economy.ts` — updated to import from `gameConfig.ts`; all existing exports preserved for backward compatibility

**What was done:**
- Created `constants/gameConfig.ts` exporting `GAME_CONFIG` object with every required config variable (XP values, blur/clarity mechanics, combo tiers, super-combo, max_level, session settings)
- Added derived helper functions: `xpThresholdForLevel`, `xpToAdvanceLevel`, `levelFromXP`, `getComboBonus`, `computeAnswerXP`, `initialBlur`, `blurAfterCorrect`, `blurAfterWrong`
- Rewired `economy.ts` to re-export its named constants from `gameConfig.ts` — zero import changes needed in the rest of the codebase
- TypeScript: ✅ no errors

**⚠️ Conflict flagged — max_level:**
- Final Implementation Prompt sets `max_level: 500`
- Economy Patch 1.1.1 sets `max_level: 100`
- Currently set to **500** as per the more recent prompt. Change `GAME_CONFIG.max_level` to `100` if you want to cap at 100.

**⚠️ XP curve simulation results (formula: 1.2 × (L−1)^1.4 × 100):**

| Player | 7 days | 30 days | 6 months | 12 months |
|---|---|---|---|---|
| Casual (5/day) | Lv 29 | Lv 82 | Lv 293 | Lv 485 |
| Active (10/day) | Lv 48 | Lv 134 | Lv 480 | Lv 500 |
| Hardcore (20/day) | Lv 78 | Lv 219 | Lv 500 | Lv 500 |

The formula as specified produces fast progression. If future missions specify target timelines, the `xp_base_formula_coefficient` and `xp_base_formula_exponent` values in `gameConfig.ts` can be adjusted without touching any other file.

---

## Mission 3 — XP & Leveling System ✅
**Status:** Complete
**Files changed:**
- `constants/gameConfig.ts` — fixed XP formula (was wrong); added `xpToAdvanceLevel`, `xpThresholdForLevel`, `levelFromXP`, `computeAnswerXP`
- `utils/index.ts` — replaced `xpAtStartOfLevel` / `calculateLevel` to use new formula via gameConfig
- `store/gameStore.ts` — added `superComboActive` state field; updated `recordAnswer` to use `computeAnswerXP` (applies super combo 2.5× multiplier at streak ≥ 15)

**Formula (per spec):** `RequiredXP(N) = Round(1.2 × N^1.4)`
- L1→2: 1 XP | L50→51: 287 XP | L500→501: 7,207 XP
- Total L1→500: 1,505,005 XP (spec: ~1,510,000) ✓

**XP simulation (avg session ~378 XP):**
| Player | 30 days | 6 months | 12 months |
|---|---|---|---|
| Casual (5/day) | L128 | L269 | L362 |
| Active (10/day) | L170 | L360 | L483 |
| Hardcore (20/day) | L227 | L480 | L500 |

**Super Combo (Mission 3 §3.4):**
- Activates at streak ≥ 15 (was incorrectly ≥ 10 before)
- Multiplies total XP × 2.5 while active
- State tracked in `superComboActive` on the store
- Wrong answer ends super combo + resets streak

---

## Mission 4 — Image Clarity / Blur Mechanic ✅
**Status:** Complete
**Files changed:**
- `store/gameStore.ts` — Super Combo clarity protection: when a wrong answer breaks an active super combo, the blur penalty is suppressed (clarity unchanged for that answer, per spec §3.4)
- `app/game.tsx` — HUD: super combo badge now reads `superComboActive` from store (not `streak ≥ 10`); announcement overlay fires once on activation showing "⚡ SUPER COMBO! ×2.5 XP"; no erroneous +10s timer bonus

**Blur/clarity formula (already correct, confirmed):**
- `+clarity_correct_increment` (5%) per correct answer
- `-clarity_wrong_penalty_*` per wrong answer (easy 3%, medium 5%, hard 7%)
- Suppressed on wrong answers that break super combo
- Initial clarity: easy 50%, medium 20%, hard 0%

**TypeScript:** ✅ no errors

---

## Mission 5 — Level Reward Packages ✅
**Status:** Complete
**Files changed:**
- `constants/levelRewards.ts` — fully rewritten for 500 levels

**Reward schedule (per spec §5.1):**
| Range | Minor (every 5 levels) | Major (every 10 levels) |
|---|---|---|
| 1–100 | 100 coins + 1 Error Nullifier | 1 Simple Frame + 1 Avatar |
| 101–250 | 250 coins + 1 Rare Sticker | 1 Game Theme + 1 Silver Badge |
| 251–400 | 400 coins + 1 Title | 1 Category Unlock + Entrance Effect |
| 401–500 | 600 coins + 1 Legendary Skin Piece | 1 Legendary Skin + 1 Animated Frame |

- Levels that are multiples of 10 receive **both** minor and major rewards
- New `RewardItemType` values added: `error_nullifier`, `rare_sticker`, `game_theme`, `silver_badge`, `entrance_effect`, `skin_piece`, `legendary_skin`
- `claimLevelReward` in userStore updated to automatically credit `error_nullifier` consumables from level rewards

---

## Mission 6 — Shop System ✅
**Status:** Complete
**Files changed:**
- `constants/shopData.ts` — **NEW** — full shop inventory (consumables, gems cosmetics, real-money offers, ad removal, coin/gem packs)
- `store/userStore.ts` — added `gems` currency, `ConsumableInventory`, and actions: `addGems`, `spendGems`, `buyConsumable`, `useConsumable`, `addConsumable`, `decrementMultiplierSession`
- `store/gameStore.ts` — consumable mechanics wired into sessions and `recordAnswer`

**Shop inventory (per spec §6.2):**
- Consumables (coins): Clarity Bomb 200¢, Combo Shield 150¢, Time Boost 100¢, 2× Multiplier 300¢, Error Nullifier 120¢
- Utility: Early Category Unlock — 1,000¢ or 50 gems
- Gem cosmetics: Rare Frames (20–150 gems), Environment Themes (80 gems), Entrance Effects (40 gems), Sticker Packs (30 gems)
- Real-money: Starter Pack $2.00, Season Pass $5.00 (future), Ad-Free Lifetime $4.99, Ad-Free 7-day $0.99

**In-session consumable mechanics:**
- **Error Nullifier** — next wrong answer won't reduce clarity; consumed on use
- **Combo Shield** — wrong answer drops streak to start of previous tier instead of resetting to 0; consumed on use
- **Time Boost** — +20s added to session timer at session start; consumed on session start
- **2× Multiplier** — doubles coins & XP for 3 complete sessions; `multiplierSessionsLeft` countdown in userStore
- **Clarity Bomb** — usable mid-session (UI integration pending when shop screen is updated)

**TypeScript:** ✅ no errors

---

## Missions 7–13 — Pending
_Awaiting next batch from user._
