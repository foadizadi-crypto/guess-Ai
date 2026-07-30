# BlurQuiz — Game Economy Bible

> **Version 1.0 — July 2026**
> This document is the single source of truth for all economy, progression, monetization, and retention systems in BlurQuiz. Every numeric value includes a rationale. Balance this document before implementing features.

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
| Perfect game (20/20 correct) | 100 XP additional | Rewards mastery; stacks with per-question XP. |

### 1.2 Combo System

A "combo" is a consecutive correct-answer streak **within a single game session**.

| Streak | Bonus XP per question | Trigger |
|---|---|---|
| 3 in a row | +5 XP/question | Mini-combo |
| 5 in a row | +10 XP/question | Combo |
| 8 in a row | +20 XP/question | Super Combo |
| 12+ in a row | +30 XP/question | Ultra Combo |

**Balance reasoning:** Combo bonuses cap at +30 XP per question on Hard (i.e., 55 XP total). This is meaningful but never more than 3× the base Hard reward — it rewards skill without making the gap between casual and skilled play absurd.

**Anti-farming rule:** Combo bonus resets to zero on a wrong answer. Playing slowly to ensure all correct answers is fine — this is skill play, not farming. No artificial time penalties.

### 1.3 Anti-XP Farming Rules

| Rule | Mechanism |
|---|---|
| Wrong answer still earns XP | Prevents deliberate wrong-answer retries for XP loops |
| No XP for replaying the exact same image set within 1 hour | Server-side cooldown per category×difficulty slot |
| XP per session capped at 3× the average session XP | Detects bot-like sessions; excess is silently withheld |
| Daily XP cap: 10,000 XP | Effectively ~30 full Hard games/day — only a hardcore player hits this naturally |

### 1.4 Sample XP per Game

| Game Type | XP (no combos) | XP (full Super Combo) |
|---|---|---|
| 20× Easy, all correct | 200 + 50 = 250 XP | 200 + (20×20) + 50 = 650 XP |
| 20× Medium, all correct | 300 + 50 = 350 XP | 300 + (20×20) + 50 = 750 XP |
| 20× Hard, all correct | 500 + 50 = 550 XP | 500 + (20×30) + 50 = 1,150 XP |
| Mixed difficulty, 14/20 correct | ~240 + 50 = 290 XP | — |

---

## 2. Level System

### 2.1 Formula

The XP required to reach level **L** from level **(L-1)** follows a **piecewise polynomial curve**:

```
XP_to_next(L) =
  L ≤ 50:   floor(100 × L^1.5)
  51–200:   floor(100 × L^1.8)
  201–500:  floor(100 × L^2.1)
```

**Total cumulative XP to reach level L** = sum of XP_to_next(1) through XP_to_next(L-1).

**Rationale:**
- Early levels (1–50) use a gentle 1.5 exponent — players level up quickly and feel rewarded.
- Mid levels (51–200) shift to 1.8 — progression slows but remains satisfying.
- Late levels (201–500) use 2.1 — serious long-term investment is required.
- Using a formula instead of a table ensures consistency, allows easy rebalancing, and scales without gaps or spikes.

### 2.2 Milestone Examples

| Level | XP to reach this level (from L-1) | Cumulative XP from L1 | Approx. hours (casual, 250 XP/hr) |
|---|---|---|---|
| 1 | 0 (start) | 0 | 0 hrs |
| 10 | 3,162 XP | ~18,000 XP | ~72 hrs (3 days casual) |
| 50 | 35,355 XP | ~610,000 XP | ~2,440 hrs |
| 100 | 199,526 XP | ~4,800,000 XP | ~19,200 hrs |
| 300 | 4,800,000 XP | ~290,000,000 XP | ~very long-term |
| 500 | 35,000,000 XP | ~2,200,000,000 XP | Prestige achievement |

> **Note:** Level 500 is intentionally a multi-year achievement for even the most dedicated players. This keeps the level ceiling meaningful and gives the leaderboard long-term health. The daily XP cap (10,000 XP) means even a player maxing every day needs years.

### 2.3 Level Bands (Named Tiers)

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

**Daily coin earning estimate by player type:**

| Player | Games/day | Coins from gameplay | + Daily/mission | Total/day |
|---|---|---|---|---|
| Casual (5 games) | ~70 correct answers | 70 coins | +75 | ~145 coins |
| Normal (15 games) | ~210 correct answers | 210 coins | +120 | ~330 coins |
| Hardcore (30 games) | ~420 correct answers | 420 coins | +150 | ~570 coins |

### 4.2 Coin Earning Principles

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
| Seasonal Cosmetics | Event exclusive | — | Limited-time; never re-sold |

### 5.3 Category C — Premium Content

| Item | Description | Price |
|---|---|---|
| Coin Packs (see §IAP) | Direct coin purchases | $0.99–$39.99 |
| Remove Ads | Permanent ad removal | $2.99 one-time |
| BlurPass (subscription) | See §6 | $3.99/mo or $29.99/yr |
| Category Packs | Unlock curated question bundles | $0.99–$1.99 each |
| AI Question Pack | GPT-generated custom category | $1.99/pack |

### 5.4 IAP Coin Bundles

| Product ID | Coins | Price | Value |
|---|---|---|---|
| `coins_100` | 100 coins | $0.99 | 101 coins/$ |
| `coins_500` | 550 coins | $4.99 | 110 coins/$ (+10% bonus) |
| `coins_1200` | 1,400 coins | $9.99 | 140 coins/$ (+38% bonus) |
| `coins_2500` | 3,000 coins | $19.99 | 150 coins/$ (+20% bonus) |
| `coins_5000` | 7,000 coins | $39.99 | 175 coins/$ (+40% bonus) |

**Pricing rationale:** Larger bundles offer meaningful bonuses (not just proportional) to incentivize higher-value purchases. A "best value" label on the $9.99 pack converts well.

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

**XP boost justification:** The 10% XP boost is cosmetic progression, not gameplay advantage. A premium player will reach Level 50 ~10% faster but will never answer questions "better" than a free player.

### 6.3 Remove Ads (One-Time)

**Price:** $2.99

- Removes all interstitial ads permanently.
- Does **not** include subscription benefits.
- Ideal for price-sensitive players who hate ads but won't subscribe.
- Cross-promotes BlurPass ("Get Remove Ads + all BlurPass benefits for $3.99/mo").

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

**Total max rewarded ad revenue exposure:** 11 ads/day free, 16/day BlurPass — well within "non-annoying" threshold.

### 7.4 Revenue vs. Retention Balance

Interstitials at 3-game intervals generate ~3–4 ad impressions per casual session (5 games). eCPM for mobile quiz games typically $3–8. At 10,000 DAU, this yields ~$3,000–8,000/month before subscriptions and IAP. The conservative frequency is intentional — sustainable engagement beats short-term impression maximization.

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
- BlurPass gives a 2× coin multiplier on all daily rewards.
- A "streak shield" (earned at Day 7, usable once every 14 days) protects against breaking the streak once.

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

**Design rule:** At least 2 of 3 daily missions should be achievable by a casual player in a normal session.

### 8.3 Achievements

Achievements are permanent, one-time unlocks. They signal mastery and provide a long-term goal layer.

| Category | Example Achievements |
|---|---|
| **Games Played** | First game, 10 games, 50, 100, 500, 1000 |
| **Perfect Games** | First perfect, 10 perfect, 50 perfect |
| **Streak** | 3-combo, 5-combo, 10-combo, 20-combo |
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
- Reach next level
- Save up for a specific shop item
- Beat personal best score

These are "always in progress" hooks that create a reason to open the app every day.

### 9.2 Medium-Term Goals (Weekly, 1–2 months)

- Complete weekly challenge
- Unlock next level-milestone reward
- Reach the next tier (e.g., Explorer → Challenger)
- Collect full cosmetic set from current season

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
- **Seasonal Leaderboard**: top players earn exclusive badge

**Why 8-week seasons?** Short enough to feel fresh; long enough that casual players can participate meaningfully. Seasonal exclusivity creates FOMO-driven engagement without Pay-to-Win.

### 9.6 Social Features (Phase 2 suggestion)

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
| Avg. difficulty | Easy/Med mix | Med | Hard |
| Combo frequency | Rare (2-streak) | Occasional (4-streak) | Regular (7-streak) |

### 10.1 Daily XP

| | Casual | Normal | Hardcore |
|---|---|---|---|
| XP per game (avg.) | ~230 XP | ~380 XP | ~650 XP |
| Games/day | 5 | 15 | 30 |
| Daily XP (before cap) | ~1,150 XP | ~5,700 XP | ~19,500 XP |
| Daily XP (after cap) | 1,150 XP | 5,700 XP | **10,000 XP** (capped) |

### 10.2 Leveling Speed

| Level | Casual time | Normal time | Hardcore time |
|---|---|---|---|
| 10 | ~16 days | ~3 days | ~2 days |
| 50 | ~18 months | ~4 months | ~2 months |
| 100 | ~11 years | ~2.5 years | ~1.5 years |
| 300 | Prestige | Prestige | ~30 years |
| 500 | Effectively infinite | ~200 years | ~80 years |

**Verdict:** Level 50 is achievable for a committed casual player within their first year — this is healthy. Level 100+ is reserved for truly dedicated players. Level 500 is a generational achievement. The daily cap ensures no one rushes to the ceiling.

### 10.3 Daily Coin Earning

| Source | Casual | Normal | Hardcore |
|---|---|---|---|
| Correct answers (1 coin each) | ~65 | ~225 | ~510 |
| Perfect game bonus (+25) | ~0 | ~25 | ~75 |
| Daily login | 15–50 | 15–50 | 15–50 |
| Missions (2–3 completed) | ~70 | ~130 | ~180 |
| Rewarded ads (opt-in) | 0–150 | 0–150 | 0–150 |
| **Total (no rewarded ads)** | **~150–200** | **~400–450** | **~780–815** |

### 10.4 Shop Affordability Check

| Item | Cost | Casual days | Normal days | Hardcore days |
|---|---|---|---|---|
| Hint (single) | 50 coins | 0.3 days | <1 day | <1 day |
| Reveal (single) | 80 coins | 0.5 days | <1 day | <1 day |
| Basic Frame | 500 coins | 3 days | 1.5 days | <1 day |
| Basic Avatar | 400 coins | 2.5 days | 1 day | <1 day |
| Basic Skin | 800 coins | 5 days | 2 days | 1 day |
| Premium Skin (coins alt) | — | IAP only | IAP only | IAP only |

**Verdict:** Shop economy is healthy. Casual players can afford consumable power-ups within a normal play session and cosmetics within a few days. Premium items require IAP — this is intentional, creating a clear but non-coercive upgrade path.

### 10.5 Level 500 Meaningfulness Check

- Hardcore player hitting daily XP cap every day needs **~80 years** to reach Level 500 at cap.
- Even with hypothetical unlimited XP (no cap), the cumulative XP requirement (~2.2 billion XP) is unreachable in a human lifetime through normal play.
- **Verdict: Level 500 remains a prestige boundary, not a practical goal.** This is correct design — its value is symbolic (the "Legend" title and crown) and social (leaderboard top), not a content gate.

---

## Appendix A — Key Formula Reference

```
XP to next level:
  L ≤ 50:   floor(100 × L^1.5)
  51–200:   floor(100 × L^1.8)
  201–500:  floor(100 × L^2.1)

Correct answer XP:
  Easy:   10 XP
  Medium: 15 XP
  Hard:   25 XP

Combo bonus XP (added to base, resets on wrong answer):
  3-streak:  +5/q
  5-streak:  +10/q
  8-streak:  +20/q
  12-streak: +30/q

Wrong answer XP: 2 XP (always)
Stage completion: +50 XP (flat)
Perfect game:     +100 XP (bonus)
Daily XP cap:     10,000 XP
```

---

## Appendix B — Open Questions Before Implementation

1. **Timed mode:** Is "Extra Time" power-up needed at launch or Phase 2? Recommend Phase 2.
2. **Versus/social:** Leaderboard scope — global only at launch, friends via Phase 2.
3. **IAP product IDs:** Confirm Google Play product IDs match `IAPService.ts` SKU list exactly before submission.
4. **OpenAI cost per AI category:** GPT-4o cost per pack should be modeled before pricing AI packs at $1.99. Consider caching generated questions per prompt.
5. **Streak shield:** Decide whether streak shield is earnable (recommended) or IAP purchasable.
6. **Seasonal Pass pricing:** $1.99 is a soft price; validate against competitor seasonal passes (typical range $1.99–$4.99).

---

*Document maintained by: Development Team*
*Next review: Before Phase 2 development kick-off*
