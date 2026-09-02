

PASS 1–4 — FINAL SOURCE-LEVEL FIX ROUND

DO NOT START PASS 5.

PASS 5 IS STILL LOCKED.

I will personally handle the remaining real-device / APK / production-store verification later.

Your ONLY job in this round is to FIX AND VERIFY everything from PASS 1–4 that can be safely completed NOW using source code, configuration, local tests, mocks, and API tests.

DO NOT spend time pretending to verify things that require a real Android/iOS device or production store.

==================================================
GROUP A — FIX NOW

1. LEADERBOARD

Previous report:

GET /api/leaderboard returned HTTP 200 but some rows had xp=0.

Investigate the complete source-level path:

- XP write
- XP persistence
- authenticated user identity
- Firestore/API query
- sorting
- response mapping
- zero/default handling
- frontend consumption

Find the actual root cause.

If there is a source-level bug, FIX IT.

If deployment is required after the fix, prepare the source correctly and clearly report:

DEPLOYMENT REQUIRED

Do NOT claim production is fixed until it is actually deployed.

==================================================

2. SPEED CARD 502 / 503 FAILURE HANDLING

The live OpenAI environment did not reproduce 502/503.

Do NOT waste time trying to force a real upstream failure.

Instead, verify the source through deterministic mocks/tests.

Test:

- 400
- 502
- 503
- timeout
- malformed response
- failed generation
- no fake success
- no fake reward
- no DEV fallback converting failure to success
- no old 200-palette fallback
- correct max palette
- difficulty-specific rewards
- stamina refund only when appropriate
- genRef duplicate/restart protection

If source behavior is already correct, add or run the strongest available automated test.

Do NOT fabricate a live 502/503 result.

==================================================

3. COLD-START / HYDRATION

This can be tested at source/test level.

Create or run deterministic tests for:

- XP
- Coins
- Gems
- Level
- Stamina/Energy
- hasHydrated
- tickEnergy
- lastEnergyRefillTime

Verify:

- valid cloud values are not overwritten by zero/default values
- hydration does not reset valid state
- energy timestamp is preserved
- persistence happens after hydration
- local/cloud merge is safe
- reload does not destroy valid progress

A real Firestore account test will be done later by me if required.

==================================================

4. PERFECT / MISSION TEXT CONSISTENCY

Search the ENTIRE relevant project for:

- 20/20
- 20 questions
- hard-coded Perfect conditions
- outdated mission wording

Fix only actual PASS 1–4 inconsistencies.

Do NOT change gameplay question counts without an approved decision.

==================================================

5. STAMINA / ADS SOURCE CONSISTENCY

Verify source/config only.

Approved economy currently intended:

- capacity: 100 / 150 / 250 / 400
- regeneration: 1 stamina / 12 minutes
- game cost: 10 stamina
- lobby ads: 5
- lobby reward: +10 stamina
- loss ads: 5
- loss reward: +10 stamina
- retry: same round
- ad counter: GLOBAL
- no per-category counter

DO NOT change these values.

Verify:

- no hidden per-category counter
- no duplicate reward
- failed ad gives no reward
- retry does not create free/duplicate sessions
- daily reset is consistent

==================================================

6. DAILY / UTC / COOLDOWNS

Source-level audit and automated tests.

Verify:

- UTC daily reset
- daily reward
- ad counter reset
- wheel 24-hour cooldown
- extra UTC counter
- duplicate timer prevention
- duplicate reward prevention

Fix actual source bugs.

Do not invent new values.

==================================================

7. NICKNAME REGISTRATION

Source-level verification/fix:

- popup
- registration
- uniqueness
- authenticated identity
- duplicate nickname handling
- errors
- nickname gate outside lobby
- successful routing

Fix actual bugs.

==================================================

8. HINT / REVEAL

Verify source/test behavior:

- cost
- stamina interaction
- reveal
- reward
- failed request
- duplicate tap
- loading
- session state

DO NOT change approved prices.

==================================================

9. UPGRADE / RECHARGE

Verify:

- approved stamina capacity
- approved gemCost
- recharge mechanic
- recharge wording
- UI vs actual mechanic

IMPORTANT:

KEEP:

100 / 150 / 250 / 400

DO NOT restore the old:

100 / 150 / 200 / 350

unless an explicit project decision proves that is the approved value.

==================================================

10. LOCKED CATEGORY → SHOP → PLAY

Verify and fix source-level navigation.

Ensure there is no dead-end when a category is locked.

==================================================

11. SHOP / REWARD SOURCE

Verify/fix source/config only:

- Legendary → Gems
- Gem Pack → correct Gems tab
- wheel 24h cooldown
- Jackpot = 50 Gems
- wheel Gems only through Jackpot
- Starter Pack configuration
- 7-day Ad-Free configuration
- IAP_COIN_PACKS
- Upgrade tab
- empty/broken Shop state
- ShopHotspot source logic

DO NOT invent store product IDs or prices.

Friends MUST remain:

Coming Soon

DO NOT build Friends.

==================================================

12. AUTH / NOTIFICATION SOURCE AUDIT

Source-level only.

Verify:

- AuthGuard
- nickname gate
- Google web redirect
- 4-second timeout
- Continue as Guest
- TIME_INTERVAL
- Android channelId configuration
- daily notification tap configuration
- deep link after splash
- level-up notification failure isolation

Fix source/config bugs where possible.

DO NOT claim native-device verification.

==================================================

13. ECONOMY TESTS — IMPORTANT

The previous reports conflict:

One report said:

50 PASS / 1 FAIL

Another says:

49 PASS / 2 FAIL

DO NOT simply call them "old failures."

Run:

test:economy

Then report the EXACT failures:

- test name
- expected
- actual
- root cause
- PASS 1–4 relevance

If a failure is caused by a PASS 1–4 change, FIX IT.

If genuinely unrelated, leave it untouched and document it.

DO NOT change prices merely to make tests green.

In particular, do NOT automatically change:

- 10 Gems refill
- 20 Gems / 200 stamina Mega Pack

without an explicit product decision.

==================================================
GROUP B — LIVE VERIFICATION IS NOT REQUIRED IN THIS ROUND

I will test these later myself using the APK / real phone / production environment:

- native level-up notification
- native notification delivery
- Android channelId actual behavior
- notification tap
- deep-link behavior on real device
- native rewarded-ad dead-end
- production AdMob
- production debug switch in final APK
- real ShopHotspot tap
- PhoneStage pixel-perfect layout
- IAP purchase
- IAP restore
- Starter Pack real store listing
- 7-day Ad-Free real entitlement
- final production APK/AAB
- real Firestore cold-start account
- real production OpenAI 502/503 if necessary

You may fix source/config for these if you discover an obvious bug, but DO NOT claim them LIVE VERIFIED.

==================================================
NO SCOPE CREEP

DO NOT:

- start PASS 5
- modify PASS 5
- add Friends
- add new games
- add new rewards
- rebalance economy
- change locked numbers
- redesign gameplay
- modify unrelated routes
- modify Extra Hard/Max/Next unless an actual PASS 1–4 regression requires it

==================================================
REQUIRED FINAL REPORT

After completing this round, return:

1. FIXED NOW
2. VERIFIED BY AUTOMATED/SOURCE TESTS
3. DEPLOYMENT REQUIRED
4. MY APK/DEVICE VERIFICATION REQUIRED
5. PRODUCT DECISION REQUIRED
6. EXACT TEST RESULTS
7. EXACT ECONOMY TEST FAILURES
8. EXACT FILES CHANGED
9. REMAINING PASS 1–4 ITEMS

Most important:

DO NOT say PASS 1–4 = ALL FIX yet.

DO NOT say READY FOR PASS 5.

Final state must remain:

PASS 1–4 = NOT ALL FIX

until I personally perform the APK/live verification and explicitly declare:

PASS 1–4 = ALL FIX

PASS 5 = NOT STARTED.