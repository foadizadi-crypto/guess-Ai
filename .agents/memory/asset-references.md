---
name: Asset reference pitfalls (Metro / React Native)
description: Why static asset require() calls break the whole bundle, and how to sweep for them correctly.
---

## An optional asset must be absent from the map, not a dead path

Metro resolves static `require()` calls while building the bundle, before any component executes. So a defensive render site — `{ICONS[id] ? <Image/> : <Icon/>}` or a `hasIcon` check — cannot rescue a `require()` pointing at a file that does not exist. The whole app fails to bundle.

**Rule:** type such maps as `Partial<Record<...>>` and omit keys that have no artwork. Keep the id in any hitbox/render list so behaviour is preserved; only the overlay disappears.

**Why:** a handful of missing icons took down the entire bundle even though every render site already handled the missing case correctly.

---

## Sweep all asset references at once, and expand the path alias first

Metro reports only the *first* unresolved module, so fixing one and re-bundling turns a batch problem into a long serial chase. Extract every `require('...')` asset path across the source tree and test each against the filesystem in a single pass.

**Critical:** expand the `@/` TypeScript path alias before resolving. Treating it as a relative path reports a false positive for nearly every aliased asset and wildly overstates the problem.

**Also:** filenames are case-sensitive on Linux and on Android devices, so casing mismatches survive on case-insensitive machines and only fail here. Suspect casing and on-disk typos before assuming a file is missing.

---

## Line-1 syntax errors are often literal placeholder text

A generated file write can leave scaffolding text above otherwise valid code, surfacing as a cluster of `TS1005` errors all on line 1. It looks like encoding corruption but is plain junk.

**How to apply:** on line-1 syntax errors, read line 1 verbatim first. After any large generated edit, grep the tree for placeholder phrases and conflict markers.
