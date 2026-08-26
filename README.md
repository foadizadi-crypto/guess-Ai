# BlurQuiz 🎮

A mobile guessing game built with **Expo (React Native)** where players identify progressively un-blurred images, earn coins, power-ups, and compete on leaderboards.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Installation & Development](#installation--development)
4. [EAS Build Commands](#eas-build-commands)
5. [Android Release Checklist](#android-release-checklist)
6. [Environment Variables](#environment-variables)
7. [API Server](#api-server)
8. [AdMob Setup](#admob-setup)
9. [In-App Purchases (IAP) Setup](#in-app-purchases-iap-setup)
10. [Audio Assets](#audio-assets)

---

## Project Overview

| Feature | Details |
|---|---|
| Framework | Expo SDK 54 + React Native 0.81 |
| Navigation | Expo Router (file-based) |
| State | Zustand with AsyncStorage persistence |
| AI Questions |
| AI Images |
|Multi-Provider|
| Ads | react-native-google-mobile-ads (AdMob) |
| IAP | react-native-iap v15 (Nitro bridge) |
| Audio | expo-av |
| Animations | React Native Reanimated 4 |
| Package Manager | pnpm (workspace monorepo) |

---

## Architecture

```
/
├── artifacts/
│   ├── artifacts/mobile/          # Expo app (this README describes this)
│   │   ├── app/                   # Expo Router screens
│   │   ├── components/            # Shared UI components
│   │   ├── hooks/                 # React hooks
│   │   ├── services/              # AdService, AudioService, IAPService, etc.
│   │   ├── store/                 # Zustand stores
│   │   ├── assets/audio/          # WAV sound effects and music loops
│   │   └── theme/                 # Colors, typography
│   ├── artifacts/api-server/      # Fastify API (question generation, health)
│   └── artifacts/mockup-sandbox/  # Vite component preview server
├── lib/                           # Shared TypeScript libraries
└── pnpm-workspace.yaml
```

### Service Layer (Phase 4)

| Service | Purpose | Fallback |
|---|---|---|
| `AdService` | AdMob banner / interstitial / rewarded | Mock in Expo Go & web |
| `AudioService` | expo-av music + sound effects | Silent fail on web |
| `IAPService` | react-native-iap coin packs + Remove Ads | Mock purchases in Expo Go |

---

## Installation & Development

### Prerequisites

- Node.js 20+ and pnpm
- Expo CLI (`npm i -g @expo/cli`)
- EAS CLI for builds (`npm i -g eas-cli`)

### Install

```bash
pnpm install
```

### Start API server

```bash
pnpm --filter @workspace/api-server run dev
```

### Start Expo dev server (Expo Go compatible)

```bash
pnpm --filter @workspace/mobile run dev
```

Open the Expo Go app on your phone and scan the QR code, or press `a` for Android emulator / `i` for iOS simulator.

### Environment variables

Copy the example file and fill in your keys:

```bash
cp artifacts/artifacts/mobile/.env.example artifacts/artifacts/mobile/.env
```

---

## EAS Build Commands

All commands should be run from the repo root or with `pnpm --filter @workspace/mobile exec`.

### Configure EAS (first time)

```bash
eas login
eas build:configure
```

### Development build (Expo Dev Client, internal)

```bash
eas build --profile development --platform android
```

### Preview APK (internal testing, side-loadable)

```bash
eas build --profile preview --platform android
```

The preview APK is **not stored in git**. It is ~157MB, which is over GitHub's 100MB file limit, so a Git LFS pointer was previously committed instead of the real binary. Cursor then reported that file as “not on GitHub.” Rebuild the APK with the command above whenever you need a side-loadable build.

### Production build (Google Play)

```bash
eas build --profile production --platform android
```

### Submit to Google Play

```bash
eas submit --platform android
```

> **Note**: `google-services-key.json` (Play Store service account key) must be present for submission. Do **not** commit it to version control — add it to `.gitignore`.

---

## Android Release Checklist

- [ ] Set real AdMob App ID in `app.json` → `plugins["react-native-google-mobile-ads"].androidAppId`
- [ ] Set real AdMob ad unit IDs via `EXPO_PUBLIC_ADMOB_BANNER_ID`, `EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID`, `EXPO_PUBLIC_ADMOB_REWARDED_ID`
- [ ] Create products in Google Play Console matching `IAP_SKUS` in `services/IAPService.ts`
- [ ] Set `EXPO_PUBLIC_OPENAI_API_KEY` (server-side) or configure the API server URL
- [ ] Increment `versionCode` in `app.json` for each release
- [ ] Confirm `artifacts/artifacts/mobile/google-services.json` (Firebase) is present for Analytics/Auth
- [ ] Test interstitial throttle (3-minute cooldown) on a real device

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `EXPO_PUBLIC_ADMOB_BANNER_ID` | Mobile | AdMob banner ad unit ID |
| `EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID` | Mobile | AdMob interstitial ad unit ID |
| `EXPO_PUBLIC_ADMOB_REWARDED_ID` | Mobile | AdMob rewarded ad unit ID |
| `EXPO_PUBLIC_DOMAIN` | Mobile | Replit dev domain (set by dev script) |
| `EXPO_PUBLIC_REPL_ID` | Mobile | Replit REPL ID (set by dev script) |
| `OPENAI_API_KEY` | API server | OpenAI API key for question generation |
| `SESSION_SECRET` | API server | Session signing secret |
| `DATABASE_URL` | API server | PostgreSQL connection string |

---

## API Server

The API server (`artifacts/artifacts/api-server`) is a **Fastify** server that:

- Generates quiz questions via OpenAI GPT-4o
- Provides a `/api/healthz` endpoint
- Handles authentication sessions

### Local development

```bash
pnpm --filter @workspace/api-server run dev
# → http://localhost:3000
```

### Health check

```bash
curl http://localhost:3000/api/healthz
# {"status":"ok"}
```

---

## AdMob Setup

### Test mode (default)

In Expo Go and development builds without real AdMob configuration, `AdService` automatically falls back to **mock mode** — all ad calls return immediately without showing real ads.

### Production setup

1. Create an AdMob account at [admob.google.com](https://admob.google.com).
2. Create a new Android app in the AdMob console.
3. Note your **App ID** (format: `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`).
4. Create three ad units:
   - **Banner** (Adaptive Banner)
   - **Interstitial** (Full screen)
   - **Rewarded** (Rewarded video)
5. Add the App ID to `app.json`:
   ```json
   "react-native-google-mobile-ads": {
     "androidAppId": "ca-app-pub-YOUR_ID~YOUR_APP_ID"
   }
   ```
6. Set ad unit IDs as environment variables (see table above).

### Interstitial throttle

Interstitials are throttled to **at most one per 3 minutes** via `AdService.INTERSTITIAL_COOLDOWN_MS`. Adjust in `services/AdService.ts`.

---

## In-App Purchases (IAP) Setup

### Development (Expo Go)

`IAPService` detects that the Nitro native module is unavailable and enters **mock mode**: all purchases succeed after a short delay with no real billing.

### Production setup

1. Create an app in **Google Play Console**.
2. Create **in-app products** with these Product IDs (matching `IAP_SKUS` in `services/IAPService.ts`):

   | Product ID | Amount | Price (suggested) |
   |---|---|---|
   | `com.aiblur.quiz.coins_100` | 100 coins | $0.99 |
   | `com.aiblur.quiz.coins_500` | 500 coins | $4.99 |
   | `com.aiblur.quiz.coins_1200` | 1 200 coins | $9.99 |
   | `com.aiblur.quiz.coins_2500` | 2 500 coins | $19.99 |
   | `com.aiblur.quiz.coins_5000` | 5 000 coins | $39.99 |
   | `com.aiblur.quiz.remove_ads` | Remove Ads | $2.99 |

3. Upload at least one signed APK or AAB before products become visible.
4. Install `react-native-nitro-modules` (already listed as peer dep in package.json).
5. Build an EAS production build — IAP is **not** testable in Expo Go.

---

## Audio Assets

Game audio lives in `assets/audio/`. All files are lightweight synthesised WAV clips generated at build time (Phase 4):

| File | Usage |
|---|---|
| `button_click.wav` | Button press feedback |
| `correct.wav` | Correct answer chime |
| `wrong.wav` | Wrong answer buzz |
| `coin.wav` | Coin reward pop |
| `timer_tick.wav` | Countdown tick (< 30 s) |
| `level_up.wav` | Victory / level-up fanfare |
| `menu_music.wav` | Lobby background loop |
| `game_music.wav` | In-game background loop |

Replace these files with higher-quality assets before release — the app only requires that filenames stay the same. Files are referenced via `require('@/assets/audio/<name>.wav')` in `services/AudioService.ts`.
# guess-Ai
