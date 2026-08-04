---
name: BlurQuiz component props & firestoreService edit pattern
description: Two durable gotchas discovered building Phase 2-3 of BlurQuiz.
---

## CoinDisplay prop name
`CoinDisplay` accepts `amount: number`, NOT `coins`. Passing the wrong name leaves `amount` as `undefined`, which crashes `formatCoins` with "Cannot read properties of undefined (reading 'toString')".

**Why:** The component was built before the store used `coins` as the field name; they diverged.

**How to apply:** Any time you add `<CoinDisplay .../>` to a new screen, use `amount={coins}`.

## firestoreService.ts edit injection site
When adding new top-level exports to `firestoreService.ts`, always place them AFTER the closing `}` of `recordGameSession` (the last function). The last `try/catch` block inside `recordGameSession` is the API server write — accidentally injecting an `export` statement before it embeds the export inside the function body, causing a Babel parse error ("'import' and 'export' may only appear at the top level").

**Why:** The edit tool matched the "API server write" comment which appears inside the function body.

**How to apply:** Read the tail of `firestoreService.ts` before inserting; confirm the target line is outside all braces.
