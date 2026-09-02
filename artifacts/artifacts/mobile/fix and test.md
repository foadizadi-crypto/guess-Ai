Message

GUESSAi — MASTER ENGINE SAFETY + PROGRESSION FIX PASS

You are working on the GUESSAi mobile codebase.

This is a CONTROLLED FIX PASS, NOT a redesign.

Your job is to fix only the explicitly listed progression/economy consistency issues while preserving the existing game architecture.

---

🔒 HARD LOCK — DO NOT TOUCH

Before making ANY change, understand these are LOCKED:

Category order

1–15 = existing 15 Blur games
16 = Speed Card
17 = Count Quick
18 = Lost Item
19–25 = reserved for future games

DO NOT move, reorder, renumber, or replace any of these.

Existing 15 Blur games

DO NOT modify their gameplay.

Master Engine

DO NOT rewrite or refactor:

"game.tsx → recordAnswer → gameIdForCategory → guess-ai → calculateReward"

This architecture is already considered connected correctly.

New games

Do NOT modify gameplay implementation of:

- Speed Card
- Count Quick
- Lost Item

Do NOT reconnect them to the Master Engine.

Do NOT create Games 19–25.

---

1. XP — CREATE ONE SOURCE OF TRUTH

Current code contains two XP curves:

Curve A

"1.2 × N^1.4"

used by live "userStore.addXP"

Curve B

"100 × N^1.25"

used by shared/progression

This duplication must be resolved.

Required action

Inspect the project and identify which system is actually authoritative in the live player progression flow.

Then:

- Select ONE authoritative XP curve.
- Make all progression calculations use that source.
- Remove duplicate calculation if safe.
- If removal is unsafe, mark the duplicate explicitly as deprecated.
- Do NOT create another XP formula.
- Do NOT arbitrarily rebalance XP.

IMPORTANT

Do not choose a curve based on personal preference.

Base the choice on the existing production architecture and actual usage.

If the intended production curve cannot be determined confidently:

STOP before changing the formula and report the ambiguity.

---

2. getProgressionMultiplier()

Current problem:

"getProgressionMultiplier()" returns "1".

Inspect:

- calculateReward
- progression code
- userStore
- level calculation
- reward settlement

Determine whether Level is intended to affect rewards.

Required action

If an existing intended Level → Reward rule is already present elsewhere:

centralize it and make calculateReward use it.

If NO explicit Level → Reward rule exists:

DO NOT invent one.

Keep multiplier = 1, but make it a centralized configurable source so the system is ready for the final economy decision.

Do NOT create arbitrary multipliers such as:

1.05
1.10
1.25
etc.

unless such values already exist as the intended product configuration.

---

3. LEGACY XP / COIN CONSTANTS

Search the entire relevant mobile codebase for:

"XP_CORRECT_"

"COINS_PER_CORRECT_ANSWER"

"XP_PER_"

"COINS_PER_"

and similar old economy constants.

For every match determine:

- actively used in production settlement
- unused
- legacy
- configuration/documentation

Required action

If unused:

- remove safely, OR
- mark clearly "DEPRECATED / LEGACY — NOT USED BY MASTER ENGINE"

Do NOT change the real reward calculation.

The existing Master Engine settlement path remains authoritative.

---

4. STAMINA UPGRADE GEM PRICES

Existing capacity progression:

"100 → 150 → 200 → 350"

These capacities are LOCKED.

Current Gem prices are null.

Required action

DO NOT invent prices.

Keep prices undefined/null until product pricing is explicitly decided.

However, make sure:

"null price ≠ free purchase"

If purchase logic encounters a null price:

- reject/disable the purchase safely
- do not charge 0 Gems
- do not grant the upgrade for free
- do not crash

Add a clear configuration comment:

"TODO: Final Gem prices to be defined by product/economy pass."

Do not alter stamina capacities.

---

5. GAMEPLAY GEM REWARDS

Inspect the weekly leaderboard Gem rewards.

Determine whether gameplay settlement currently awards Gems.

Do NOT invent any Gem rewards.

Do NOT change the existing leaderboard table.

Final report must explicitly say:

- Where leaderboard Gem rewards are defined
- Whether gameplay settlement awards Gems
- Where an actual Gem transaction/payout occurs, if any

If no gameplay Gem reward exists:

leave it that way.

---

6. SCORE FLOOR

Current code uses:

"Math.max(0, ...)"

Verify the Score floor.

Unless an explicit product rule requires negative scores:

KEEP Score minimum at 0.

Do not redesign scoring.

---

7. LEVEL CAP

Search the codebase for:

"levelCap"

"MAX_LEVEL"

"maxLevel"

"LEVEL_CAP"

and equivalent progression limits.

There must be ONE authoritative Level Cap source.

Required action

If an explicit final cap already exists:

centralize usage around it.

If the final product cap is NOT decided:

DO NOT invent a number.

Keep it explicitly configurable/unset and prevent conflicting cap values from silently controlling progression.

Do NOT reset or modify existing player levels.

---

8. CATEGORY UNLOCK LEVELS

Games 16, 17, 18 currently use Level 1.

DO NOT CHANGE THEM.

The purpose of this task is only to separate:

"Category Unlock Level"

from:

"Player Level → Reward Multiplier"

They must not accidentally share the same configuration.

Verify that future Games 19–25 can have their own independent unlock configuration.

Do NOT invent unlock levels for 19–25.

---

9. GAMES 19–25

DO NOT IMPLEMENT.

Only verify their current status.

They must remain reserved for:

19
20
21
22
23
24
25

They must NOT:

- appear inside 1–15
- replace 16–18
- become playable automatically
- receive invented gameplay
- receive invented unlock levels

If only config.ts/stubs exist, leave them untouched unless they accidentally make the games playable.

---

10. LOST ITEM — SAFETY CHECK ONLY

Do NOT redesign Lost Item.

Inspect its:

Generate → Edit → Render

pipeline.

Identify:

- API dependency
- timeout
- error handling
- loading state
- failure state
- possibility of infinite loading
- possibility of missing/invalid image response

If there is an obvious isolated hang/crash caused by missing timeout/error handling:

fix ONLY that safety issue.

Do NOT change the gameplay mechanic.

Do NOT create a new image generation architecture.

---

11. AUTH ERROR

There is a TypeScript error reported around:

"authService.ts"

approximately lines 79 and 85:

"isAnonymous" on type "never"

This is NOT caused by Games 16–18.

Fix this only if the fix is straightforward and isolated.

Do NOT rewrite authentication architecture.

Do NOT change Google authentication behavior.

Do NOT change anonymous-auth product behavior.

If the correct fix cannot be established confidently, report it instead of guessing.

---

12. VALIDATION

After modifications, run the available project validation.

At minimum:

TypeScript

Run the project's actual typecheck command.

Lint

Run if configured.

Tests

Run relevant existing tests if available.

Searches

Verify:

- only ONE active XP curve
- only ONE authoritative Level Cap
- only ONE reward progression multiplier path
- no duplicate active reward systems
- Category 1–15 unchanged
- Category 16 = Speed Card
- Category 17 = Count Quick
- Category 18 = Lost Item
- Games 19–25 are not accidentally playable

---

🚨 IMPORTANT AGENT RULES

Do NOT make unrelated improvements.

Do NOT perform broad refactoring.

Do NOT rename files merely for cleanliness.

Do NOT change UI.

Do NOT change gameplay.

Do NOT change game balance.

Do NOT invent XP values.

Do NOT invent Gem prices.

Do NOT invent Level Caps.

Do NOT invent unlock levels.

Do NOT modify the 15 existing Blur games.

Do NOT modify Speed Card, Count Quick, or Lost Item gameplay.

Do NOT implement Games 19–25.

If something is ambiguous, STOP and report it rather than guessing.

---

REQUIRED FINAL REPORT

Return a concise report with exactly these sections:

1. Changed Files

Every changed file.

2. XP

- Old formulas
- Authoritative formula
- What was removed/deprecated

3. Reward Progression

- getProgressionMultiplier behavior
- Whether Level affects calculateReward
- Exact source/config used

4. Economy

- Legacy constants
- Stamina prices
- Gameplay Gem rewards
- Leaderboard Gem rewards

5. Level / Unlocks

- Level Cap source
- Unlock source
- 16/17/18 status
- 19–25 status

6. Auth

- Whether authService.ts was fixed
- Exact reason for the TypeScript error

7. Validation

Report the ACTUAL output/status of:

- typecheck
- lint
- tests

Do NOT say something passed unless you actually executed it.

8. Scope Confirmation

Explicitly confirm:

15 Blur games unchanged.

Speed Card unchanged.

Count Quick unchanged.

Lost Item gameplay unchanged.

Master Engine architecture unchanged.

Games 19–25 NOT implemented.