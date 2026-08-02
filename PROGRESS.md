# BlurQuiz — Work Progress Tracker

---

## ✅ Completed Work

### Ad System — Spec §7 (rewarded-only policy)
- `store/adStore.ts` — Full rewrite: session counter, 4h Daily Gift cooldown, lifetime/timed Ad-Free Pass expiry
- `app/game.tsx` — Removed revive ad modal; session counter incremented on early exit
- `app/result.tsx` — Removed forced interstitial; "Double Rewards" (coins+XP), gated by sessionCounter ≥ 3
- `app/lobby.tsx` — Removed banner ad; "Free Lucky Spin" FAB with 4h cooldown, 50–150 coins, 10% consumable
- `app/shop.tsx` — Ad-Free Pass card ($2.99, purple shield); Restore Purchases button
- `services/IAPService.ts` / `IAPService.native.ts` — REMOVE_ADS purchase wired to adStore

### Database Schema — Spec §9
- `lib/lib/db/src/schema/index.ts` — players extended; inventory, game_history, config, difficultyEnum added
- `lib/lib/db/src/seeds.ts` — seedConfig() with all 28 economy keys
- `lib/lib/db/src/seed-runner.ts` — CLI seed runner

### Firebase / Database Integration (Tasks 5, 6, 7)
- `services/firebase.ts` — Firebase JS SDK (Auth + Firestore) initialized
- `services/authService.ts` — Anonymous sign-in on startup; stable UID per device
- `services/firestoreService.ts` — savePlayerProfile(), recordGameSession() client-side Firestore writes
- `hooks/useFirestoreSync.ts` — Debounced player profile sync; wired into app layout
- `app/_layout.tsx` — FirestoreSyncProvider added (runs auth init + config fetch + profile sync)
- `app/result.tsx` — recordGameSession() called after every completed game
- `artifacts/artifacts/api-server/src/lib/firebaseAdmin.ts` — Firebase Admin SDK (v14 modular)
- `artifacts/artifacts/api-server/src/lib/configSeeds.ts` — 32 economy config seed values
- `artifacts/artifacts/api-server/src/routes/config.ts` — GET /api/config (Firestore + fallback to seeds)
- `artifacts/artifacts/api-server/src/routes/sessions.ts` — POST /api/sessions (writes + player aggregate update)
- `artifacts/artifacts/api-server/src/routes/index.ts` — config + sessions routes registered

### Live Config Applied In-App (Task 9)
- `services/remoteConfigService.ts` — fetchAndApplyRemoteConfig() fetches GET /api/config on startup
- `constants/gameConfig.ts` — applyRemoteConfig() merges remote values into GAME_CONFIG in place
- `hooks/useFirestoreSync.ts` — calls fetchAndApplyRemoteConfig() in parallel with initAuth() on boot

### Firestore Security Rules (Task 10)
- `firestore.rules` — written at repo root; rules for players, game_sessions, config collections

---

## 🔲 Pending / Next Up

### To deploy Firestore security rules
1. Firebase Console → Firestore Database → **Rules** tab
2. Paste contents of `firestore.rules`
3. Click **Publish**

### Task #8 — Real leaderboard
- API server GET /api/leaderboard reading from Firestore players collection
- Mobile leaderboard screen wired to live data

---

## Firebase Setup Checklist
| Step | Status |
|---|---|
| Firestore database created (US region) | ✅ |
| Cloud Firestore API enabled (Google Cloud Console) | ✅ |
| Anonymous Authentication enabled | ✅ (user confirmed) |
| FIREBASE_SERVICE_ACCOUNT_JSON secret set | ✅ |
| Firestore security rules deployed | ⏳ Pending — see `firestore.rules` |

---

## All Changed Files
| File | Change |
|---|---|
| `store/adStore.ts` | Full rewrite |
| `app/game.tsx` | Removed revive ad; counter on exit |
| `app/result.tsx` | Double Rewards; recordGameSession() |
| `app/lobby.tsx` | Daily Gift FAB |
| `app/shop.tsx` | Ad-Free Pass card + Restore Purchases |
| `app/_layout.tsx` | FirestoreSyncProvider added |
| `services/IAPService.ts` | REMOVE_ADS → adStore |
| `services/IAPService.native.ts` | Same + restore |
| `services/firebase.ts` | Auth + Firestore init |
| `services/authService.ts` | NEW — anonymous auth |
| `services/firestoreService.ts` | NEW — Firestore client writes |
| `services/remoteConfigService.ts` | NEW — fetch + apply remote config |
| `hooks/useFirestoreSync.ts` | NEW — boot sync hook |
| `constants/gameConfig.ts` | applyRemoteConfig() added |
| `lib/lib/db/src/schema/index.ts` | Extended schema |
| `lib/lib/db/src/seeds.ts` | NEW — config seeds |
| `lib/lib/db/src/seed-runner.ts` | NEW — CLI runner |
| `api-server/src/lib/firebaseAdmin.ts` | NEW — Admin SDK |
| `api-server/src/lib/configSeeds.ts` | NEW — 32 economy seeds |
| `api-server/src/routes/config.ts` | NEW — GET /api/config |
| `api-server/src/routes/sessions.ts` | NEW — POST /api/sessions |
| `api-server/src/routes/index.ts` | Registered new routes |
| `firestore.rules` | NEW — security rules |
