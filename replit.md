# BlurQuiz

BlurQuiz is an Expo mobile game where players identify images through increasing levels of blur.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — start the Expo development server
- `pnpm --filter @workspace/mobile run build` — create the static Expo Go deployment bundle
- `pnpm --filter @workspace/api-server run dev` — run the API server (uses `$PORT`)
- `pnpm --filter @workspace/mobile run typecheck` — typecheck the mobile app
- `pnpm --filter @workspace/api-server run typecheck` — typecheck the API server
- `pnpm run typecheck` — typecheck the full workspace
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env for database-backed API features: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9, Expo SDK 54
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mobile` — Expo Router mobile app and game screens
- `artifacts/mobile/store` — Zustand game, user, audio, and ad stores
- `artifacts/mobile/services` — app services, including storage and image generation
- `artifacts/api-server` — Express API server and health route
- `lib` — shared API, database, and generated client packages
- `attached_assets` — imported Phase 0/Phase 2 notes and prompts

## Multi-provider AI architecture

The API server uses a provider router in `artifacts/artifacts/api-server/src/services/ai/`:

| Layer | File | Purpose |
|---|---|---|
| Manager | `manager.ts` | Orchestrates fallback chains for text and image generation |
| Health | `health.ts` | Tracks per-provider cooldowns after failures |
| Errors | `errors.ts` | Classifies SDK/HTTP errors into typed kinds |
| Text providers | `providers/text/` | Gemini, Groq, OpenAI, Anthropic, Zhipu |
| Image providers | `providers/image/` | OpenAI DALL-E, Stable Diffusion (Hugging Face) |

**Text chain (priority order):** Gemini Flash → Groq (Llama 3.3) → OpenAI GPT-4o → Claude (Haiku) → Zhipu GLM-4

**Image chain (priority order):** OpenAI DALL-E 2 → Stable Diffusion XL (Hugging Face) → picsum.photos placeholder

**To activate a provider:** add its key as a Replit Secret. Keys are never hardcoded.

| Provider | Secret name |
|---|---|
| Gemini | `GEMINI_API_KEY` |
| Groq | `GROQ_API_KEY` |
| OpenAI (text + image) | `OPENAI_API_KEY` |
| Anthropic | `ANTHROPIC_API_KEY` |
| Zhipu / GLM | `ZHIPU_API_KEY` |
| Stable Diffusion (HF) | `HUGGINGFACE_API_KEY` |

**To pin a provider for testing:** set `AI_MODE=<provider-id>` (e.g. `AI_MODE=groq`). Valid ids: `gemini`, `groq`, `openai`, `anthropic`, `zhipu`, `openai-image`, `stable-diffusion`.

**To inspect live provider status:** `GET /api/ai-status` — shows which providers are configured, on cooldown, and the active AI_MODE.

**Fallback guarantee:** if every provider fails (or none are configured), both endpoints fall back gracefully — `/api/questions` uses a built-in local mock generator, `/api/images` uses picsum.photos seeds. The game never hard-fails.

## Architecture decisions

- The imported pnpm workspace and Expo stack are kept intact; no migration or restructure was performed.
- Expo Router uses the file-based routes under `artifacts/mobile/app`.
- Replit's mobile artifact metadata runs the Expo development service on local port `18115`.

## Product

The current imported project contains the BlurQuiz foundation and Phase 2 core gameplay flows, including onboarding, lobby, difficulty and category selection, game, results, profile, settings, shop, and leaderboard screens.

## Game Economy Bible

`GAME_ECONOMY_BIBLE.md` in the repo root is the authoritative design document for all economy, progression, monetization, and retention systems. Implement features against this document. Key decisions:

- XP per correct answer: Easy 10 / Medium 15 / Hard 25; wrong answers always give 2 XP.
- Combo bonuses: +5/+10/+20/+30 XP per question at 3/5/8/12-streak; resets on wrong answer.
- Level formula: `floor(100 × L^1.5)` (L ≤ 50), `L^1.8` (51–200), `L^2.1` (201–500).
- Level 500 is a multi-year prestige ceiling; daily XP cap is 10,000.
- Coins from gameplay (1 per correct answer) + daily missions + rewarded ads.
- BlurPass subscription: $3.99/mo — ad-free, 2× daily coins, exclusive cosmetics.
- Interstitials: minimum 3-game gap, 3-min cooldown, max 5/session; never mid-game.

## User preferences

- The user plans to provide the five project phases one at a time and wants the Expo game built incrementally.

## Gotchas

- Use `pnpm`, not npm or yarn; the root preinstall script rejects other package managers.
- Expo's compatibility check reports version warnings for `@react-native-community/slider`, `expo-file-system`, and `expo-secure-store`; the current bundle still builds successfully.
- The mockup sandbox uses a separate React type version from the Expo app; the two affected UI refs are explicitly bridged in the component wrappers so package and workspace checks pass.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
