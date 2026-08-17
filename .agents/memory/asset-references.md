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

**Cover every extension.** A sweep regex that lists `png|jpg|json` and omits `webp` (or `gif`, `avif`, `m4a`, `mp4`) reports "all resolve OK" and then the very next bundle fails on the extension you forgot. Enumerate generously — a false positive costs one `ls`, a miss costs a whole restart-and-rebundle cycle.

---

## Deleted artwork looks like a code bug, so check the working tree before reading code

A bundle that suddenly 500s on `Unable to resolve module ../assets/...` is usually not a code change at all: someone replaced or pruned artwork and left the references behind. `git status --porcelain <artifact>` answers this in one command — ` D` lines are tracked files deleted from the working tree, and `git checkout --` on *only those paths* restores them without touching modified files or new untracked ones.

Two variants that show up together with a deletion sweep:

- **A reference to a file that never existed.** Code updated to a new format (e.g. `lobby_BG.webp`) while only the old `lobby_BG.png` is on disk. Converting the restored original (`ffmpeg -i in.png -c:v libwebp -quality 90 out.webp`) honours the newer intent and matches the rest of the pipeline; repointing the reference at the old file is the alternative.
- **Casing drift in newly added assets.** Hand-added files (`Particles.json` vs a `particles.json` reference) fail only on case-sensitive filesystems.

**Why:** an app "failing to run" was four independent breakages stacked — a dead tunnel, 14 deleted PNGs, a casing mismatch, and a reference to a never-created `.webp`. Each one masked the next, because Metro only ever reports the first unresolved module.

---

## Line-1 syntax errors are often literal placeholder text

A generated file write can leave scaffolding text above otherwise valid code, surfacing as a cluster of `TS1005` errors all on line 1. It looks like encoding corruption but is plain junk.

**How to apply:** on line-1 syntax errors, read line 1 verbatim first. After any large generated edit, grep the tree for placeholder phrases and conflict markers.
