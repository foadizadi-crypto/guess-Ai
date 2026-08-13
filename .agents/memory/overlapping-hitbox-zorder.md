---
name: Overlapping absolute hitboxes need area-based z-order
description: Percentage-positioned tap targets over a background image silently steal each other's taps based on declaration order.
---

Screens built as a background image plus a list of absolutely positioned,
percentage-sized pressables (a "hitbox map") have no layout engine to stop the
boxes from overlapping. Whichever is declared **last** renders on top and wins
every tap in the overlap — so a large decorative region declared after a small
control makes that control completely dead, with no error anywhere.

**Why:** the failure is invisible in code review and in a static screenshot; it
only shows up when a tester reports "this button goes to the wrong screen".

**How to apply:** assign each box a z-index derived from its area (smaller area
= higher z) rather than relying on declaration order. To audit, compute
pairwise rectangle intersections over the hitbox list and confirm the smaller
box wins each one — far faster than clicking every target.
