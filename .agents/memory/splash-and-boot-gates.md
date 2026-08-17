---
name: Diagnosing "stuck on the loading screen"
description: Why a timed splash looks like a hang under screenshot tooling, and the competing-redirect bug it hides.
---

## A fixed-delay splash makes every load-time screenshot look like a hang

A splash that navigates on `setTimeout(..., 3000)` is still on screen for the entire window in which screenshot tooling captures a freshly loaded page. Three consecutive captures all showing the splash is *not* evidence of a hang — the animation frames differing between captures only proves the page is alive.

**How to apply:** to judge a timed boot screen, drive it with the e2e tester and make the wait explicit ("wait 8 full seconds without interacting; the splash has a hardcoded 3s timer, anything less is not a valid observation"), then have it report the resulting URL path. Do this before reading any boot code — it is cheaper than tracing the gate and it decides whether there is a bug at all.

## Two redirect controllers with different sources of truth

A startup can have more than one thing calling `router.replace()`: a splash screen that decides from persisted storage, and a root layout effect that decides from hydrated store state. When they disagree about the same question — "has this player finished onboarding?" — the layout's effect re-runs on every store change and can overwrite the splash's decision, sending players back to onboarding forever.

**Why:** the two checks answer the same question from different places (a storage flag vs. a derived store field such as "has a missions date"), so they drift apart as soon as one is written without the other.

**How to apply:** when a boot flow has a splash *and* a layout redirect, check whether both can navigate. One of them should own routing; the other should read the same source of truth or defer entirely.

## The self-locking gate

Watch for the degenerate case: the gate's unlock condition is only satisfied by code that sits *behind* the gate. ("Forced to onboarding unless a daily-missions date exists" — where the only writer of that date runs in the already-past-the-gate branch.) The condition can then never flip, and the app pins every player to one screen forever. Trace who *writes* the flag a redirect reads, not just who reads it.

**Corollary:** the branch behind such a gate has never executed, so it is untested by construction. Expect it to fail the first time it runs — here it crashed immediately on swapped function arguments. Unblocking a gate and running the code behind it are two separate fixes; budget for both.
