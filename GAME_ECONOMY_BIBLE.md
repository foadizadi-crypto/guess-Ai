Here is the final, exhaustive, and fully detailed implementation prompt in English. It covers every single mechanic, formula, reward, shop item, ad logic, and monetization stream.

Every key number is placed in a configurable section so you can rebalance the entire game by changing a single value.

---

FINAL IMPLEMENTATION PROMPT: BLURQUIZ GAME SYSTEM

1. OVERALL OBJECTIVE

Build a complete mobile casual quiz game (BlurQuiz) where players guess blurred images. The system must deliver a satisfying long-term progression (500 levels) with no Pay-to-Win mechanics. All rewards, shop items, and ad placements are designed to maximize retention and monetization while keeping the game fair and fun for F2P players.

---

2. CORE CONFIGURATION FILE (EASY BALANCING)

All tunable numbers must be stored in a single configuration file (JSON or DB table) so you can adjust difficulty, economy, or speed by modifying these values without touching core logic.

Required Config Variables:

```json
{
  "xp_base_formula_coefficient": 1.2,
  "xp_base_formula_exponent": 1.4,
  "xp_correct_easy": 10,
  "xp_correct_medium": 15,
  "xp_correct_hard": 25,
  "xp_wrong": 2,
  "xp_session_complete_bonus": 50,
  "xp_perfect_game_bonus": 100,
  "clarity_correct_increment": 5,
  "clarity_wrong_penalty_easy": 3,
  "clarity_wrong_penalty_medium": 5,
  "clarity_wrong_penalty_hard": 7,
  "initial_blur_easy": 50,
  "initial_blur_medium": 80,
  "initial_blur_hard": 100,
  "combo_tier_1_min": 3,
  "combo_tier_1_max": 4,
  "combo_tier_1_bonus": 5,
  "combo_tier_2_min": 5,
  "combo_tier_2_max": 7,
  "combo_tier_2_bonus": 10,
  "combo_tier_3_min": 8,
  "combo_tier_3_max": 11,
  "combo_tier_3_bonus": 20,
  "combo_tier_4_min": 12,
  "combo_tier_4_bonus": 30,
  "super_combo_threshold": 15,
  "super_combo_multiplier": 2.5,
  "max_level": 500,
  "session_timer_seconds": 120,
  "questions_per_session": 20
}
```

---

3. LEVELING & XP SYSTEM (CORE PROGRESSION)

3.1. XP Formula (Per Level Requirement)

The XP required to advance from Level N to N+1 is calculated as:
RequiredXP(N) = Round( Config.xp_base_formula_coefficient × (N ^ Config.xp_base_formula_exponent) )

· Example: Level 1 → 2 XP, Level 50 → 286 XP, Level 500 → 7,200 XP.
· Total XP from Level 1 to 500 ≈ 1,510,000 XP (for reference).

3.2. XP Earning Sources (Per Question/Session)

Action XP Earned
Correct Answer (Easy) Config.xp_correct_easy
Correct Answer (Medium) Config.xp_correct_medium
Correct Answer (Hard) Config.xp_correct_hard
Wrong Answer (Any difficulty) Config.xp_wrong (always given)
Session Completion (20 questions) Config.xp_session_complete_bonus (added once)
Perfect Game (20/20 correct) Config.xp_perfect_game_bonus (stacked on top of session bonus)

3.3. Combo Bonus (Additive to Per-Question XP)

Based on consecutive correct answers within one session:

Consecutive Correct Answers Bonus XP per Question
combo_tier_1_min to combo_tier_1_max combo_tier_1_bonus
combo_tier_2_min to combo_tier_2_max combo_tier_2_bonus
combo_tier_3_min to combo_tier_3_max combo_tier_3_bonus
combo_tier_4_min and above combo_tier_4_bonus

Combo Rules:

· A wrong answer resets the combo counter to 0.
· The base XP for that wrong answer (Config.xp_wrong) is still awarded.
· The combo bonus is calculated and added per question at the moment of answering correctly.

3.4. Super Combo System

· Trigger: super_combo_threshold (15) consecutive correct answers.
· Effect: The final XP multiplier for all subsequent correct answers becomes super_combo_multiplier (2.5x) until the combo is broken.
· Protection: If a wrong answer occurs during Super Combo:
  · The combo counter resets to 0.
  · Super Combo state ends.
  · Image clarity does NOT decrease for that wrong answer (no penalty).
· The Super Combo state is visually indicated on the HUD.

---

4. IMAGE CLARITY / BLUR MECHANIC

4.1. Initial Blur Percentage

· Easy: initial_blur_easy (50% blurred, 50% visible).
· Medium: initial_blur_medium (80% blurred, 20% visible).
· Hard: initial_blur_hard (100% blurred, completely hidden).

4.2. Dynamic Clarity Formula (Per Session)

Current Clarity (%) = (Correct Answers × clarity_correct_increment) - (Wrong Answers × Difficulty Modifier)

· clarity_correct_increment = 5% per correct answer.
· Difficulty Modifiers:
  · Easy: clarity_wrong_penalty_easy (3%)
  · Medium: clarity_wrong_penalty_medium (5%)
  · Hard: clarity_wrong_penalty_hard (7%)

Example (Hard): 4 wrong answers = -28% clarity. The player must answer 6 questions correctly just to break even.

Clarity UI: Display as a progress bar or percentage number that updates in real-time after each answer.

---

5. LEVEL REWARD PACKAGES (FREE LOOT)

All players receive these rewards automatically upon leveling up. They are purely cosmetic or convenience-based, never giving gameplay advantages.

5.1. Reward Schedule (based on new level reached)

Level Range Minor Reward (Every 5 Levels) Major Reward (Every 10 Levels)
1 – 100 100 Coins + 1 "Error Nullifier" (consumable) 1 Simple Frame + 1 Avatar
101 – 250 250 Coins + 1 Rare Sticker 1 Game Theme + 1 Silver Badge
251 – 400 400 Coins + 1 Title (e.g., "Detective") Unlock 1 Category + Entrance Effect
401 – 500 600 Coins + 1 Legendary Skin Piece 1 Complete Legendary Skin + 1 Animated Frame

Logic: If a level qualifies for both (e.g., level 10, 20, 30...), grant both rewards.

5.2. Consumable Items Granted Free

· Error Nullifier: When used during a session, the next wrong answer will NOT reduce image clarity (single use).
· These are also sold in the shop (see section 6).

---

6. SHOP SYSTEM (CURRENCIES & ITEMS)

6.1. Currencies

Currency Type Earning Method
Coins Free Gameplay, level rewards, missions, events.
Gems Premium Purchased with real money. (Rarely given as event rewards).

6.2. Shop Inventory (Full List)

Category Item Name Effect Price (Coins / Gems)
Consumables Clarity Bomb Removes 15% of current blur instantly (one session). 200 Coins
 Combo Shield On wrong answer, combo drops by only 1 tier instead of resetting to 0. 150 Coins
 Time Boost Adds 20 seconds to the session timer (next session only). 100 Coins
 2x Multiplier Doubles Coins & XP for the next 3 complete sessions. 300 Coins
Utility Early Category Unlock Unlocks a locked category permanently (bypasses level requirement). 1000 Coins or 50 Gems
Cosmetics (Gems only) Rare Frame Dynamic or golden profile frame. 20 – 150 Gems
 Environment Theme Changes lobby and game board visual theme. 80 Gems
 Entrance Effect Special visual effect when starting a session. 40 Gems
 Sticker/Emoji Pack Emojis for chat or result reactions. 30 Gems
Special Offers (Real Money) Starter Pack (one-time) 5 Combo Shields + 3 Clarity Bombs + exclusive Silver Frame. $2.00 USD
 Season Pass (future) Seasonal reward track with exclusive cosmetics. $5.00 USD
Ad Removal Ad-Free Pass (Lifetime) Grants all rewarded ad bonuses instantly without watching videos (permanent). $4.99 USD
 Ad-Free Pass (7 days) Same as lifetime, but expires after 7 days. $0.99 USD

6.3. Purchase Logic

· When a consumable is bought, it is added to the player's inventory.
· Consumables are used before starting a session (except Clarity Bomb, which can be used mid-session).
· Cosmetics are applied immediately to the player's profile.

---

7. ADVERTISING SYSTEM (REWARDED ADS ONLY)

Policy: No forced interstitials. All ads are opt-in rewarded videos.

7.1. Ad Placement #1 – Lobby "Daily Reward" Button

· A button appears in the lobby labeled "Daily Gift" or "Free Lucky Spin".
· Cooldown: 4 hours (configurable).
· Reward: Watching a 30s ad grants a Gift Bag containing:
  · 50 to 150 Coins (random).
  · 10% chance for a bonus consumable (e.g., Time Boost or Error Nullifier).

7.2. Ad Placement #2 – Post-Game "Double Rewards" Button

· After finishing a session, if a Session Counter is ≥ 3, a button appears: "Watch Ad to Double Your Rewards!"
· Reward: All Coins and XP earned in that session are multiplied by 2.
· Session Counter Logic:
  · Start at 0.
  · After every completed session (even if exited early), add 1.
  · If counter reaches 3, enable the double-reward button.
  · If the player watches the ad: reward doubled, counter resets to 0.
  · If the player declines: counter stays at 3 (or 4) and carries over to the next session. It never resets on decline.

7.3. Ad-Free Pass Integration

· If a player owns the Ad-Free Pass (Lifetime or 7-day):
  · The "Daily Reward" button grants the reward instantly without showing an ad.
  · The "Double Rewards" button applies the 2x multiplier instantly without showing an ad.
  · The session counter still functions (to control frequency), but the ad skip is automatic.
· Expiry logic: Check timestamp on the pass; if expired, revert to normal ad-watching behavior.

---

8. ENDGAME – LEVEL 500 ULTIMATE REWARD

When a player reaches Level 500, the following prestige rewards are granted instantly and permanently:

· Legendary Crown (profile overlay).
· Exclusive Title: "The Clarity Legend".
· Golden Theme (main menu skin).
· Special Particle Effect on avatar (visible in lobby).

Post-500 Logic:

· The XP bar locks. Further XP is still tracked and stored in a buffer (for future Prestige or Seasons) but does not increase level.
· A visual indicator shows "MAX LEVEL" on the profile.

---

9. DATABASE SCHEMA SUGGESTION (MINIMAL VIABLE TABLES)

Table: players

Field Type Description
player_id UUID Primary key
level INT Current level (1-500)
current_xp INT XP accumulated towards next level
total_xp BIGINT Lifetime XP earned
coins INT Free currency
gems INT Premium currency
session_counter INT 0-10 (for ad double logic)
last_daily_ad_timestamp TIMESTAMP For 4-hour cooldown
ad_free_pass_expiry TIMESTAMP NULL if not owned, else expiry date

Table: inventory

Field Type Description
player_id UUID Foreign key
item_id INT Reference to shop items
quantity INT Stackable consumables

Table: game_history

Field Type Description
session_id UUID Primary key
player_id UUID Foreign key
difficulty ENUM('easy','medium','hard') 
category STRING e.g., "Animals"
correct_answers INT 0-20
wrong_answers INT 0-20
max_combo INT Highest combo achieved
xp_earned INT Total XP from session
coins_earned INT Total coins from session
start_time TIMESTAMP 
end_time TIMESTAMP 

Table: config (Key-Value store for live balancing)

Key Value
xp_formula_coefficient 1.2
xp_formula_exponent 1.4
... (all values from section 2) ...

---

10. ANTI-CHEAT & SECURITY NOTES

· All XP, level, and currency calculations must be performed server-side (or verified on server if offline).
· The client sends raw answers (correct/wrong) and the server computes the final rewards.
· Session timers (2 minutes) are enforced server-side to prevent time manipulation.

---

11. ERROR HANDLING & EDGE CASES

· Ad not loaded: If an ad fails to load, show a "Try Again" button. Do not grant rewards without ad unless Ad-Free Pass is active.
· Disconnection during session: If connection drops, the session results are saved locally and synced when reconnected. The player receives rewards only once to prevent duplication.
· Max Level Reached: XP earned at level 500 is still logged in total_xp but does not increase level.

---

12. MONETIZATION & REVENUE PROJECTION (FOR REFERENCE)

Based on 10,000 daily active players:

· Rewarded Ads: ~$55,000/year (5 ads/day/player at $3 eCPM).
· Gem Sales (Whales): ~$20,000/year.
· Ad-Free Pass: ~$10,000/year (if 5% of players buy lifetime).
· Season Pass: ~$20,000/year.
· Starter Packs: ~$2,400/year.
· Total Estimated Annual Revenue: ~$107,400+ (scalable with userbase).

---

13. FINAL REMINDER FOR THE AGENT

This document is the single source of truth. Implement all systems exactly as specified. If any number (e.g., XP rates, prices, cooldowns) needs adjustment, only modify the configuration file or database config table – do not change core logic unless the design itself requires a structural change.

All formulas, tables, and flows are self-contained and ready for production-level coding. No further clarification is needed from the project manager.

END OF PROMPT.
