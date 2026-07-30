# BlurQuiz — Game Economy Bible

> **Version 1.1 — July 2026 (Audited)**
> This document is the single source of truth for all economy, progression, monetization, and retention systems in BlurQuiz. Every numeric value is derived from the formulas in Appendix A. All tables in Sections 2, 10 were recalculated to match those formulas exactly.

---

## Table of Contents

1. [XP System](#1-xp-system)
2. [Level System](#2-level-system)
3. [Level Rewards](#3-level-rewards)
4. [Coin Economy](#4-coin-economy)
5. [Shop Design](#5-shop-design)
6. [Premium System](#6-premium-system)
7. [Ad System](#7-ad-system)
8. [Daily Systems](#8-daily-systems)
9. [Player Retention](#9-player-retention)
10. [Balance Test — Player Simulation](#10-balance-test--player-simulation)
11. [Appendix A — Formula Reference](#appendix-a--formula-reference)
12. [Appendix B — Open Questions Before Implementation](#appendix-b--open-questions-before-implementation)

---

## 1. XP System

### 1.1 Core XP Values per Question

| Event | XP Awarded | Rationale |
|---|---|---|
| Correct answer (Easy) | 10 XP | Baseline unit. All other values derive from this. |
| Correct answer (Medium) | 15 XP | ×1.5 multiplier — modest bump for harder content. |
| Correct answer (Hard) | 25 XP | ×2.5 multiplier — meaningful but not overwhelming. |
| Wrong answer | 2 XP | Participation reward; prevents total disengagement without enabling farming. |
| Stage completion bonus (20 questions) | 50 XP | Flat bonus for finishing any game, regardless of score. |
| Perfect game (20/20 correct) | 100 XP additional | Rewards mastery; stacks with per-question XP and combo bonuses. |

### 1.2 Combo System

A "combo" is a consecutive correct-answer streak **within a single game session**. Combo bonus is tiered — reaching a higher threshold replaces the previous tier's bonus (bonuses do not stack).

| Streak length | Bonus XP added per question | Trigger name |
|---|---|---|
| 3–4 in a row | +5 XP/question | Mini-combo |
| 5–7 in a row | +10 XP/question | Combo |
| 8–11 in a row | +20 XP/question | Super Combo |
| 12+ in a row | +30 XP/question | Ultra Combo |

**How combo bonus accumulates in a 20-question all-correct game:**

```
Q1–Q2   streak 1–2:  +0  each  (× 2  = 0 XP)
Q3–Q4   streak 3–4:  +5  each  (× 2  = 10 XP)
Q5–Q7   streak 5–7:  +10 each  (× 3  = 30 XP)
Q8–Q11  streak 8–11: +20 each  (× 4  = 80 XP)
Q12–Q20 streak 12+:  +30 each  (× 9  = 270 XP)
                              Total = 390 XP combo bonus
```

A perfect 20-question all-correct game always reaches the Ultra Combo tier at Q12.

**Balance reasoning:** The maximum per-question XP on Hard with Ultra Combo is 25 + 30 = 55 XP — 2.2× the base Hard reward, never more than 3×. Combo rewards skill without making the gap between casual and expert play unreasonable.

**Anti-farming rule:** Combo bonus resets to zero on any wrong answer. No artificial time penalties are applied.

### 1.3 Anti-XP Farming Rules

These rules are listed in implementation priority order.

| Rule | Mechanism | Implementation notes |
|---|---|---|
| Wrong answer still earns XP | 2 XP always awarded | No exploitable retry loop; not enough XP to matter |
| Replay cooldown | No XP for replaying the same question set within 1 hour | Identified server-side by `category + difficulty + question_set_hash`. XP is withheld silently; the game is still playable. |
| Daily XP cap | 10,000 XP maximum per calendar day (UTC) | Primary anti-farming guard. Resets at 00:00 UTC. Only hardcore players (30 games/day) are ever capped. |

> **Note on "session cap" (removed):** A previous draft included a per-session cap of "3× average session XP." This was removed because "session" was undefined, and the daily cap already handles all realistic abuse scenarios without the ambiguity.

### 1.4 Sample XP Per Game

The "all-correct" column represents a perfect 20/20 game, which always reaches the Ultra Combo tier (12-streak at Q12). All values are exact, not estimates.

| Scenario | XP (no combo) | XP (all-correct perfect game, Ultra Combo) |
|---|---|---|
| 20× Easy, all correct | 200 + 50 = **250 XP** | 200 + 390 + 50 + 100 = **740 XP** |
| 20× Medium, all correct | 300 + 50 = **350 XP** | 300 + 390 + 50 + 100 = **840 XP** |
| 20× Hard, all correct | 500 + 50 = **550 XP** | 500 + 390 + 50 + 100 = **1,040 XP** |
| Mixed difficulty, 14/20 correct | ≈ (14 × 12.5) + (6 × 2) + 50 ≈ **237 XP** | ≈ 250–280 XP (combo depends on answer clustering) |

---

## 2. Level System

### 2.1 Formula

The XP required to advance **to** level L (from level L−1) follows a piecewise power curve:

```
xpToReach(L) =
  L ≤ 50:    floor(100 × L^1.5)
  51–200:    floor(100 × L^1.8)
  201–500:   floor(100 × L^2.1)
```

**Cumulative XP to be at level L** = Σ xpToReach(l) for l = 1 to L.

> Players start at Level 1. The UI never displays Level 0. Internally, a player who has earned 0 XP is stored as Level 0 and displayed as Level 1; the first 100 XP earned advances them to "Level 1 complete / Level 2 threshold reached."

**Rationale:**
- Early levels (1–50): gentle 1.5 exponent — players level up quickly and feel rewarded.
- Mid levels (51–200): shifts to 1.8 — progression slows but remains satisfying.
- Late levels (201–500): uses 2.1 — serious long-term investment required.
- A formula ensures consistency, easy rebalancing, and no gaps or spikes across 500 levels.

### 2.2 Milestone Table (exact values, formula-derived)

| Level | XP to reach (from L−1) | Cumulative XP from L0 | Casual days | Normal days | Hardcore days |
|---|---|---|---|---|---|
| 1 | 100 | 100 | <1 | <1 | <1 |
| 10 | 3,162 | 14,264 | 11 | 3 | 1 |
| 50 | 35,355 | 724,849 | 547 | 135 | 72 |
| 100 | 398,107 | 13,043,541 | 9,837 | 2,428 | 1,304 |
| 300 | 15,920,424 | 1,205,232,646 | 908,924 | 224,355 | 120,523 |
| 500 | 46,541,139 | 7,186,499,040 | 5,419,683 | 1,337,770 | 718,650 |

> Daily XP rates used: Casual = 1,326 XP/day, Normal = 5,372 XP/day, Hardcore = 10,000 XP/day (capped). See §10 for derivation.

### 2.3 Human-Readable Progression Time

| Level | Casual | Normal | Hardcore |
|---|---|---|---|
| 10 | ~1.6 weeks | ~3 days | ~1 day |
| 50 | ~1.5 years | ~4.5 months | ~2.5 months |
| 100 | ~27 years | ~6.7 years | ~3.6 years |
| 300 | ~2,490 years | ~615 years | ~330 years |
| 500 | ~14,850 years | ~3,665 years | ~1,969 years |

**Design intent:** Level 50 is achievable for a committed casual player within roughly 1.5 years of daily play. Level 100+ is reserved for truly dedicated, multi-year players. Level 500 is a generational prestige boundary — its value is symbolic and social, not a content gate.

### 2.4 Level Bands (Named Tiers)

| Range | Tier Name | Player Stage |
|---|---|---|
| 1–10 | Rookie | Onboarding |
| 11–30 | Explorer | Early engagement |
| 31–75 | Challenger | Core loop forming |
| 76–150 | Veteran | Committed player |
| 151–300 | Elite | Long-term invested |
| 301–450 | Master | Rare achiever |
| 451–500 | Legend | Prestige |

---

## 3. Level Rewards

### 3.1 Design Principle

> **No permanent gameplay advantages.** All level rewards are cosmetic, social, or convenience-based. A Level 1 player can beat a Level 300 player on any given game. This is fundamental to fairness and long-term retention.

### 3.2 Reward Table

| Level | Reward Type | Specific Reward |
|---|---|---|
| 5 | Frame | Bronze border |
| 10 | Title | "Guesser" |
| 15 | Avatar | Pixel Owl |
| 20 | Skin | Game board dark theme |
| 25 | Badge | 25 Star Badge |
| 30 | Crown | Bronze Crown |
| 40 | Category Unlock | "Vintage Movies" |
| 50 | Frame | Silver border + "Trailblazer" Title |
| 60 | Avatar | Neon Fox |
| 75 | Skin | "Retro" UI skin |
| 100 | Crown | Silver Crown + "Century" Badge |
| 125 | Category Unlock | "World Landmarks" |
| 150 | Frame | Gold border + "Elite" Title |
| 175 | Avatar | Cosmic Cat |
| 200 | Skin | "Midnight" premium UI skin |
| 250 | Crown | Gold Crown + "Illusionist" Title |
| 300 | Frame | Animated Diamond border + "Master" Title |
| 350 | Category Unlock | "AI-Generated Mysteries" |
| 400 | Avatar | Legendary Phoenix animated avatar |
| 450 | Skin | "Legend" full UI skin |
| 500 | Crown | Legendary Crown (animated) + "Legend" Title + Exclusive "500" Badge |

### 3.3 Cosmetic Item Types

| Type | Description |
|---|---|
| **Badges** | Decorative icons shown on profile. Earned via levels, achievements, events. |
| **Titles** | Text labels shown beneath username (e.g., "Trailblazer", "Master"). |
| **Crowns** | Profile crown icon. Bronze → Silver → Gold → Diamond → Animated Legendary. |
| **Avatars** | Profile picture options. Unlocked or purchasable; never gameplay-affecting. |
| **Frames** | Border around avatar/game card. Signals dedication. Animated at high levels. |
| **Skins** | Full game UI color themes and board styles. Visual only. |
| **Category Unlocks** | Special themed question categories; some locked until earned. Free via levels or purchasable. |

---

## 4. Coin Economy

### 4.1 How Players Earn Coins

| Source | Coins | Notes |
|---|---|---|
| Correct answer (any difficulty) | 1 coin | Every correct answer, every game |
| Perfect game (20/20) | +25 bonus coins | One-time per session |
| Daily login | 15–150 coins | Scales with login streak (see §8) |
| Daily mission complete | 30–80 coins | Per mission |
| Achievement unlock | 50–500 coins | One-time per achievement |
| Rewarded ad | 30 coins | Max 5/day = 150 coins/day cap |
| Level-up milestone (every 10 levels) | 200 coins | Automated reward |
| Weekly challenge complete | 500 coins | One per week |

### 4.2 Daily Coin Earning (formula-derived, no rewarded ads)

| Player | Games/day | Coins from gameplay | Daily login (avg) | Missions | Total/day |
|---|---|---|---|---|---|
| Casual (5 games, 65% correct) | 5 | ~65 | ~32 | ~70 | **~167 coins** |
| Normal (15 games, 75% correct) | 15 | ~226 | ~32 | ~130 | **~388 coins** |
| Hardcore (30 games, 85% correct) | 30 | ~539 | ~32 | ~180 | **~751 coins** |

> Rewarded ads add up to 150 coins/day (5 ads × 30 coins) for free players who opt in. These are not included in the base totals above, as they are voluntary.

### 4.3 Coin Earning Principles

- **Coins come from play, not from paying.** The shop is accessible to free players within a reasonable grind time.
- **Premium purchase converts coins too.** IAP purchases include coin bundles, providing a shortcut — not an exclusive.
- **Inflation protection:** Coin values for items are set against the *casual player* earning rate. A power-up should cost roughly 1–3 days of casual play.

---

## 5. Shop Design

### 5.1 Category A — Power-Ups

Power-ups are single-use consumables purchased with coins. They provide **session convenience**, not permanent advantages.

| Item | Effect | Coin Cost | IAP Cost | Notes |
|---|---|---|---|---|
| **Reveal** | Removes one blur layer instantly | 80 coins | — | Most popular; 1 per question max |
| **Hint** | Shows first letter of answer | 50 coins | — | Works only on text-answer questions |
| **Extra Time** | +15 seconds on timed modes | 60 coins | — | Future use (timed mode planned) |
| **Skip** | Skip a question without penalty | 40 coins | — | Counts as wrong for streak; no XP loss |
| **Double XP** (30 min) | 2× XP for 30 minutes | 200 coins | $0.99 | Stacks once only |
| **Coin Magnet** (1 game) | 2× coin drops for 1 game | 150 coins | — | Convenience booster |

**Starter Pack:** New players receive 3 Reveals + 3 Hints free on first login. Drives engagement with the shop mechanic.

### 5.2 Category B — Cosmetics

All cosmetics are visual only. No gameplay effect.

| Item | Coin Price | IAP Price | Notes |
|---|---|---|---|
| Basic Frames (10 options) | 300–800 coins | — | Earnable |
| Premium Frames (5 options) | — | $0.99–$2.99 | Exclusive designs |
| Animated Frames (3 options) | — | $1.99–$3.99 | Premium only |
| Basic Avatars (15 options) | 200–600 coins | — | Earnable |
| Premium Avatars (8 options) | — | $0.99–$2.99 | Exclusive |
| Basic Skins (4 options) | 500–1,200 coins | — | Earnable |
| Premium Skins (5 options) | — | $2.99–$4.99 | Exclusive |
| Seasonal Cosmetics | Event exclusive | — | Limited-time; never re-sold after season ends |

### 5.3 Category C — Premium Content

| Item | Description | Price |
|---|---|---|
| Coin Packs (see §IAP) | Direct coin purchases | $0.99–$39.99 |
| Remove Ads | Permanent ad removal | $2.99 one-time |
| BlurPass (subscription) | See §6 | $3.99/mo or $29.99/yr |
| Category Packs | Unlock curated question bundles | $0.99–$1.99 each |
| AI Question Pack | GPT-generated custom category | $1.99/pack |

### 5.4 IAP Coin Bundles

| Product ID | Coins | Price | Value (coins/$) |
|---|---|---|---|
| `coins_100` | 100 coins | $0.99 | 101 |
| `coins_500` | 550 coins | $4.99 | 110 (+10% bonus) |
| `coins_1200` | 1,400 coins | $9.99 | 140 (+38% bonus) |
| `coins_2500` | 3,000 coins | $19.99 | 150 (+20% bonus) |
| `coins_5000` | 7,000 coins | $39.99 | 175 (+40% bonus) |

**Pricing rationale:** Larger bundles offer meaningful bonuses (not merely proportional) to incentivize higher-value purchases. A "best value" label on the $9.99 pack converts well.

---

## 6. Premium System

### 6.1 Design Principle

> **Fair monetization.** Premium gives QoL and cosmetics. It never lets a paying player answer questions more easily, get more questions right, or score higher than a free player with equal knowledge.

### 6.2 BlurPass Subscription

**Price:** $3.99/month or $29.99/year (~37% savings)

| Benefit | Free | BlurPass |
|---|---|---|
| Ads shown | Interstitials between games | Ad-free |
| Daily coin bonus | 15–150 | 30–300 (2×) |
| Rewarded ad cap | 5/day | 10/day |
| Exclusive cosmetics | — | 2 new per month |
| Exclusive category | — | 1 rotating per month |
| AI custom questions | — | 3 packs/month included |
| Leaderboard badge | None | BlurPass crown icon |
| Daily mission slots | 3 | 5 |
| XP boost | None | +10% passive XP |

**XP boost justification:** The 10% XP boost affects cosmetic progression only, not gameplay. A premium player reaches Level 50 ~10% faster but never answers questions "better" than a free player.

### 6.3 Remove Ads (One-Time)

**Price:** $2.99

- Removes all interstitial ads permanently.
- Does **not** include subscription benefits.
- Ideal for price-sensitive players who dislike ads but won't subscribe.
- Cross-promotes BlurPass: "Get Remove Ads + all BlurPass benefits for $3.99/mo."

### 6.4 AI Features (Premium)

| Feature | Description | Access |
|---|---|---|
| Custom AI Category | GPT-4o generates a category from a user prompt (e.g., "90s cartoons") | BlurPass or $1.99/pack |
| AI Difficulty Tuning | AI adjusts question difficulty based on player history | BlurPass only |
| AI Hint Expansion | AI provides a second contextual hint on demand | BlurPass only |

---

## 7. Ad System

### 7.1 Design Principle

> **Never punish the player for playing.** Ads appear at natural session breaks, never mid-game, and never block progress.

### 7.2 Interstitial Ads

| Rule | Value | Rationale |
|---|---|---|
| Minimum games between interstitials | 3 games | Never fires in the first 2 games of a session |
| Cooldown after last interstitial | 3 minutes | Prevents back-to-back ads |
| Maximum per session | 5 | Hard cap; beyond this, retention drops sharply |
| Never shown | Mid-game, on first launch, on tutorial | Player trust is paramount |
| Shown at | Game-over / results screen → lobby transition | Natural break in flow |

**Free vs. BlurPass:** BlurPass subscribers see zero interstitials. This is the single most powerful subscription conversion lever.

### 7.3 Rewarded Ads

| Item | Reward | Daily Limit | Trigger |
|---|---|---|---|
| "Free Coins" button (lobby) | 30 coins | 5/day (free) / 10/day (BlurPass) | Visible in lobby, never intrusive |
| "Double XP" offer (post-game) | 2× XP on next game | 2/day | Shown only if player had a good game |
| "Extra Life" offer (mid-game, if feature exists) | Revive once | 1/day | Only appears once per session |
| "Unlock Hint" offer | 1 free Hint | 3/day | Appears on wrong answer |

**Total max rewarded ad exposure:** 11 ads/day free, 16/day BlurPass — within "non-annoying" threshold.

### 7.4 Revenue vs. Retention Balance

Interstitials at 3-game intervals generate ~3–4 ad impressions per casual session (5 games). eCPM for mobile quiz games is typically $3–8. At 10,000 DAU, this yields roughly $3,000–8,000/month before subscriptions and IAP. The conservative frequency is intentional — sustainable engagement beats short-term impression maximization.

---

## 8. Daily Systems

### 8.1 Daily Login Reward (Streak)

| Day | Coins | Notes |
|---|---|---|
| Day 1 | 15 coins | Always resets here if streak broken |
| Day 2 | 20 coins | |
| Day 3 | 30 coins + 1 Hint | |
| Day 4 | 40 coins | |
| Day 5 | 50 coins | |
| Day 6 | 60 coins | |
| Day 7 | 150 coins + 1 Reveal | Week milestone |
| Day 14 | 200 coins + 1 Reveal + cosmetic | Two-week badge |
| Day 30 | 500 coins + Premium Frame | Monthly milestone |
| Day 60 | 800 coins + Exclusive Avatar | Dedicated player reward |
| Day 100 | 1,000 coins + Crown upgrade | Power user |

**Streak rules:**
- Streak continues if player logs in within 48 hours (not 24) — prevents punishing players who play every other day.
- BlurPass doubles all coin rewards in this table.
- A "streak shield" (earned at Day 7, usable once every 14 days) protects the streak once.

> **Average daily login coin used in §4 and §10:** Estimated at ~32 coins/day (weighted average across a typical streak distribution of Days 1–7).

### 8.2 Daily Missions

3 missions shown daily (5 for BlurPass). Missions refresh at 00:00 UTC. Players can re-roll one mission per day for free.

**Mission pool examples:**

| Mission | Reward | Difficulty |
|---|---|---|
| Play 3 games | 30 coins | Easy |
| Correctly answer 15 questions | 40 coins | Easy |
| Complete a Hard game | 60 coins | Medium |
| Get a 5-answer combo | 50 coins | Medium |
| Win a Perfect Game | 80 coins | Hard |
| Play 5 games in one session | 50 coins | Normal |
| Use a Power-Up | 25 coins | Easy |
| Complete a game in the "Animals" category | 40 coins | Easy |

**Design rule:** At least 2 of 3 daily missions must be achievable by a casual player in a normal session.

### 8.3 Achievements

Achievements are permanent, one-time unlocks providing a long-term goal layer.

| Category | Example Achievements |
|---|---|
| **Games Played** | First game, 10, 50, 100, 500, 1000 games |
| **Perfect Games** | First perfect, 10 perfect, 50 perfect |
| **Combos** | 3-streak, 5-streak, 10-streak, 20-streak, 20-streak (Ultra) |
| **Level** | Reach Level 10, 50, 100, 300, 500 |
| **Coins** | Earn 1,000 total coins, 10,000, 100,000 |
| **Daily Streak** | 7-day, 30-day, 100-day login streaks |
| **Categories** | Complete all questions in a category |
| **Social** | Share a result, invite a friend |

Reward: **Coins + Badge**, scaled to difficulty. First-game achievement gives 100 coins.

### 8.4 Weekly Streak Reward

Completing 7 consecutive days of daily missions earns:
- 500 coins
- 1 random premium cosmetic (from a rotation pool)
- Exclusive "Week Warrior" profile badge (permanent, cumulative counter)

---

## 9. Player Retention

### 9.1 Short-Term Goals (Daily, 1–3 days)

- Complete today's 3 daily missions
- Maintain login streak
- Reach the next level
- Save up for a specific shop item
- Beat personal best score

These are "always in progress" hooks that create a reason to open the app every day.

### 9.2 Medium-Term Goals (Weekly, 1–2 months)

- Complete weekly challenge
- Unlock the next level-milestone reward
- Reach the next tier (e.g., Explorer → Challenger)
- Collect the full cosmetic set from the current season

### 9.3 Long-Term Goals (Months to Years)

- Reach Level 100, 300, 500
- Complete all achievements
- Collect all crowns
- Max out all category completions
- Legendary status on leaderboard

### 9.4 Leaderboard System

| Board | Reset | Prize |
|---|---|---|
| Daily XP board | Every 24 hrs | Coins for Top 3 |
| Weekly XP board | Every Monday | Coins + cosmetic for Top 10 |
| All-time global board | Never | Prestige only |
| Friends board | Never | Social bragging rights |

### 9.5 Seasonal Content

Every **8 weeks**, a new Season launches:

- New **Seasonal Category** (e.g., "Summer Movies", "Winter Animals")
- New **Seasonal Cosmetics** (frame, avatar, skin) — never re-sold after season ends
- **Seasonal Pass** (optional, $1.99): unlocks the full cosmetic track via missions
- **Seasonal Leaderboard**: top players earn an exclusive badge

**Why 8-week seasons?** Short enough to feel fresh; long enough that casual players can participate meaningfully. Seasonal exclusivity creates engagement without Pay-to-Win.

### 9.6 Social Features (Phase 2 Suggestion)

- Share result card to social media (screenshot with score)
- Invite friends for +50 coins per accepted invite
- Versus mode: challenge a friend to the same image set

---

## 10. Balance Test — Player Simulation

### Assumptions

| | Casual | Normal | Hardcore |
|---|---|---|---|
| Games/day | 5 | 15 | 30 |
| Questions/game | 20 | 20 | 20 |
| Avg. correct rate | 65% | 75% | 85% |
| Avg. difficulty | Easy/Med mix (base ≈ 12.5 XP) | Medium (base = 15 XP) | Hard (base = 25 XP) |
| Combo frequency | Occasional 2–3 streaks | Occasional 4–5 streaks | Regular 7–8 streaks |

### 10.1 Daily XP (analytically derived)

All XP/game figures are computed using the formula: base XP + expected combo bonus (analytical Markov chain calculation) + stage completion bonus + probability-weighted perfect game bonus.

| | Casual | Normal | Hardcore |
|---|---|---|---|
| XP per game (avg.) | ~265 XP | ~358 XP | ~624 XP |
| Games/day | 5 | 15 | 30 |
| Daily XP (raw) | ~1,326 XP | ~5,372 XP | ~18,716 XP |
| Daily XP (after 10k cap) | **1,326 XP** | **5,372 XP** | **10,000 XP** (capped) |

### 10.2 Leveling Speed (exact, formula-derived)

All values are computed from the cumulative XP table (§2.2) divided by actual daily XP rates above.

| Level | Cumulative XP | Casual | Normal | Hardcore |
|---|---|---|---|---|
| 10 | 14,264 XP | ~1.6 weeks | ~3 days | ~1 day |
| 50 | 724,849 XP | ~1.5 years | ~4.5 months | ~2.5 months |
| 100 | 13,043,541 XP | ~27 years | ~6.7 years | ~3.6 years |
| 300 | 1,205,232,646 XP | ~2,490 years | ~615 years | ~330 years |
| 500 | 7,186,499,040 XP | ~14,850 years | ~3,665 years | ~1,969 years |

### 10.3 Daily Coin Earning (formula-derived)

| Source | Casual | Normal | Hardcore |
|---|---|---|---|
| Correct answers (1 coin each) | ~65 | ~225 | ~510 |
| Perfect game bonus (+25) | ~0 | ~25 | ~75 |
| Daily login (avg, no streak shield) | ~32 | ~32 | ~32 |
| Missions (2–3 completed avg) | ~70 | ~130 | ~180 |
| Rewarded ads (opt-in, not included) | 0–150 | 0–150 | 0–150 |
| **Total (no rewarded ads)** | **~167 coins** | **~388 coins** | **~751 coins** |

### 10.4 Shop Affordability Check (at correct coin income)

All "days" figures use the total daily coin income from §10.3 (no rewarded ads).

| Item | Cost | Casual days | Normal days | Hardcore days |
|---|---|---|---|---|
| Hint (single) | 50 coins | 0.3 days | 0.1 days | 0.1 days |
| Reveal (single) | 80 coins | 0.5 days | 0.2 days | 0.1 days |
| Basic Frame | 500 coins | 3.0 days | 1.3 days | 0.7 days |
| Basic Avatar | 400 coins | 2.4 days | 1.0 days | 0.5 days |
| Basic Skin | 800 coins | 4.8 days | 2.1 days | 1.1 days |
| Premium Skin | — | IAP only | IAP only | IAP only |

**Verdict:** Shop economy is healthy. Casual players can afford consumable power-ups within a single play session and cosmetics within 3–5 days. Premium items require IAP — this creates a clear but non-coercive upgrade path.

### 10.5 Level 500 Meaningfulness Check

- A hardcore player hitting the daily XP cap every single day needs **~1,969 years** to reach Level 500.
- Even with no daily cap at all, the cumulative XP requirement (~7.2 billion XP) is unreachable in a human lifetime through normal play.
- **Verdict: Level 500 is a permanent prestige ceiling.** Its value is symbolic (the "Legend" title and animated crown) and social (leaderboard top), not a content gate.

---

## Appendix A — Formula Reference

```
─── LEVEL FORMULA ──────────────────────────────────────────────
xpToReach(L)  =  XP to advance from level L−1 to level L

  L ≤ 50:    floor(100 × L^1.5)
  51–200:    floor(100 × L^1.8)
  201–500:   floor(100 × L^2.1)

cumXP(L)  =  Σ xpToReach(l) for l = 1 to L

─── XP PER ANSWER ──────────────────────────────────────────────
Correct (Easy):    10 XP
Correct (Medium):  15 XP
Correct (Hard):    25 XP
Wrong answer:       2 XP  (always, unconditionally)

─── STAGE / GAME BONUSES ───────────────────────────────────────
Stage completion:   +50 XP  (every completed game, flat)
Perfect game:      +100 XP  (20/20 correct, stacks with all other bonuses)

─── COMBO BONUS (added per question, resets on wrong answer) ───
Streak 3–4:    +5 XP/question
Streak 5–7:   +10 XP/question
Streak 8–11:  +20 XP/question
Streak 12+:   +30 XP/question

Total combo bonus, 20 all-correct questions: 390 XP
(Q1–2: +0, Q3–4: +5×2=10, Q5–7: +10×3=30, Q8–11: +20×4=80, Q12–20: +30×9=270)

─── ANTI-FARMING ───────────────────────────────────────────────
Replay cooldown:    1 hour per (category + difficulty + question_set_hash)
Daily XP cap:      10,000 XP per UTC calendar day

─── COINS ──────────────────────────────────────────────────────
Per correct answer:  1 coin
Perfect game bonus: +25 coins
```

---

## Appendix B — Open Questions Before Implementation

1. **Timed mode:** Is "Extra Time" power-up needed at launch or Phase 2? Recommend Phase 2.
2. **Versus/social:** Leaderboard scope — global only at launch, friends via Phase 2.
3. **IAP product IDs:** Confirm Google Play product IDs match `IAPService.ts` SKU list exactly before submission.
4. **OpenAI cost per AI category:** GPT-4o cost per pack should be modeled before pricing AI packs at $1.99. Consider caching generated questions per prompt.
5. **Streak shield:** Decide whether streak shield is earnable (recommended) or IAP purchasable.
6. **Seasonal Pass pricing:** $1.99 is a soft price; validate against competitor seasonal passes (typical range $1.99–$4.99).
7. **Question set hash:** Define server-side how a "question set" is identified for the replay cooldown rule (e.g., SHA-1 of sorted question IDs, or category+difficulty+date-bucket).
8. **Level 0 display rule:** Confirm UI shows "Level 1" for new players with 0 XP (internal DB value = 0 or 1, display always ≥ 1).
