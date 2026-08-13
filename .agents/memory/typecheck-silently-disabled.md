---
name: Typecheck silently disabled by project-reference error
description: Why a single TS6310 config error made the mobile typecheck useless, and how to tell a "clean" typecheck from an aborted one.
---

A `tsc --noEmit` run that reports only `TS6310: Referenced project ... may not disable emit`
has **not** typechecked the project. TypeScript bails on the referenced-project graph before
checking any source files, so the run looks clean while every real error is invisible.

**Why:** the workspace root tsconfig extends `expo/tsconfig.base`, which sets `noEmit: true`.
Composite library projects inherit that and then declare `composite`/`emitDeclarationOnly`,
which TypeScript rejects. Fix is `"noEmit": false` in each composite lib's own tsconfig.

**How to apply:** treat any TS6xxx config diagnostic as "typecheck did not run", never as
"pre-existing unrelated warning". Re-run after fixing the config and expect a burst of real
errors that were being masked. In this project that mask is how a required React prop was
left unpassed and only surfaced as a runtime crash on device.
