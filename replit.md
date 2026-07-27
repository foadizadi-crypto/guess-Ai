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

## Architecture decisions

- The imported pnpm workspace and Expo stack are kept intact; no migration or restructure was performed.
- Expo Router uses the file-based routes under `artifacts/mobile/app`.
- Replit's mobile artifact metadata runs the Expo development service on local port `18115`.

## Product

The current imported project contains the BlurQuiz foundation and Phase 2 core gameplay flows, including onboarding, lobby, difficulty and category selection, game, results, profile, settings, shop, and leaderboard screens.

## User preferences

- The user plans to provide the five project phases one at a time and wants the Expo game built incrementally.

## Gotchas

- Use `pnpm`, not npm or yarn; the root preinstall script rejects other package managers.
- Expo's compatibility check reports version warnings for `@react-native-community/slider`, `expo-file-system`, and `expo-secure-store`; the current bundle still builds successfully.
- The mockup sandbox uses a separate React type version from the Expo app; the two affected UI refs are explicitly bridged in the component wrappers so package and workspace checks pass.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
