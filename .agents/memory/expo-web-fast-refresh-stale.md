---
name: Fast Refresh serves stale bundles on Expo web
description: A ReferenceError for a symbol that plainly exists in the source usually means Metro hot-reload staleness, not a real bug.
---

When a new **module-scope** binding is added to a screen (a `const`, a helper
function) Expo web Fast Refresh can keep serving the previous module body. The
browser then throws `ReferenceError: <NAME> is not defined` for a symbol that is
right there in the file, or keeps referencing a symbol that was just deleted.

**Why:** hot-reload patches the component, not the module's top-level scope;
with the React Compiler enabled this happens often enough to waste a whole
verification round.

**How to apply:** before debugging such a ReferenceError, `grep` the source
once. If the symbol is present (or the stale one is gone), restart the Metro
workflow and hard-reload a **fresh** browser context — a soft refresh is not
enough. Tell any e2e tester to do the same; otherwise they report a phantom
regression.
