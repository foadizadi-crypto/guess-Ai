---
name: Dev servers must not die with their optional external dependencies
description: Why `expo start --tunnel` takes the whole workflow down, and the shape of a safe fallback wrapper.
---

## An optional convenience must not be a hard startup dependency

`expo start --tunnel` requires ngrok, a third-party service. When ngrok is unreachable (`failed to start tunnel` / `remote gone away`), Expo exits non-zero within a few seconds, Metro never starts, and the workflow reports FAILED — so the web preview dies too, even though nothing is wrong with the app. The tunnel only matters for reaching the dev server from Expo Go on a physical phone.

**Rule:** wrap the start command so a failure of the *optional* transport degrades instead of aborting. On Replit the fallback should advertise the public Repl domain, or the QR code points at a container LAN IP no phone can reach:

```bash
export EXPO_PACKAGER_PROXY_URL="https://${REPLIT_DEV_DOMAIN}:${EXTERNAL_PORT}"
export REACT_NATIVE_PACKAGER_HOSTNAME="${REPLIT_DEV_DOMAIN}"
```

`EXTERNAL_PORT` is the published port from `[[ports]]` in `.replit`, not the local one.

## Three things such a wrapper gets wrong by default

1. **Falling back on any early failure.** A time-based heuristic ("died within 90s → must be the tunnel") silently retries genuine config errors and crashes, hiding them behind a second start. Grep the captured output for tunnel/ngrok-specific markers and fall back only on those; re-raise every other exit status verbatim.
2. **Treating a signal as a failure.** Exit codes ≥ 128 mean the process was signalled (a workflow restart), not that anything broke. Propagate them.
3. **Leaking the process tree.** During the first attempt the server is a child of the shell, not `exec`'d, so the shell must trap TERM/INT/HUP and forward them — otherwise the supervisor reaps the shell and Metro plus ngrok keep running and squat the port, making the *next* start fail for an unrelated reason. Walk children recursively with `pgrep -P` and signal each; do **not** signal the process group (`kill -- -$pid`), which can reach siblings outside the script. Use `exec` on the final, non-fallback path so signals reach the server directly.

**How to apply:** verify the branches with a stub binary on `PATH` that simulates each case (tunnel failure, unrelated failure, long-running-then-signalled). Testing the classification logic costs seconds; testing it against a real outage costs a restart cycle each time.
