#!/usr/bin/env bash
#
# Starts the Expo dev server.
#
# Strategy (most-reliable-first):
#
#   1. Direct mode (default) — Expo Metro on port $PORT, with the Replit
#      public domain advertised in the QR so a phone running Expo Go can scan
#      and connect.  No third-party services involved → always works.
#
#   2. Tunnel mode (opt-in) — set EXPO_USE_TUNNEL=1 to try ngrok first.
#      If ngrok fails for any reason, falls back to direct mode automatically.
#      Useful when ngrok is available and you want a guaranteed-routable URL.
#
# Why not tunnel by default?
#   ngrok is a third-party service.  When it is down, `expo start --tunnel`
#   exits immediately, the whole workflow dies, the web preview breaks, and
#   every restart starts with a 30-second wait just to fail again.  The direct
#   Replit domain works fine and avoids that daily breakage.
#
# Expo Go on a phone:
#   Scan the QR that Metro prints.  It will show:
#     exp://<your-replit-domain>:3000
#   That URL is publicly routable from any device.  Tap it in Expo Go.
#
set -u

# The dev server never needs Expo account auth (no EAS build/update calls
# happen here). If EXPO_TOKEN is set but invalid/misconfigured, the Expo CLI
# still tries to use it and aborts the whole process with an ApiV2Error —
# even in plain direct mode. Unset it so `expo start` always runs anonymously.
unset EXPO_TOKEN

PORT="${PORT:-18115}"
EXTERNAL_PORT="${EXPO_EXTERNAL_PORT:-3000}"

# ── Signal forwarding ────────────────────────────────────────────────────────
# When running the tunnel attempt Expo is a child process.  Signals from the
# workflow manager must be forwarded manually; otherwise Metro/ngrok are left
# alive squatting the port after this script exits.
child_pid=""
got_signal=0

kill_tree() {
  local sig="$1" pid="$2" kid
  for kid in $(pgrep -P "$pid" 2>/dev/null); do
    kill_tree "$sig" "$kid"
  done
  kill -"$sig" "$pid" 2>/dev/null
}

forward_signal() {
  got_signal=1
  if [ -n "$child_pid" ] && kill -0 "$child_pid" 2>/dev/null; then
    kill_tree "$1" "$child_pid"
  fi
}
trap 'forward_signal TERM' TERM
trap 'forward_signal INT'  INT
trap 'forward_signal HUP'  HUP

# ── Direct-mode start ────────────────────────────────────────────────────────
start_direct() {
  if [ -n "${REPLIT_DEV_DOMAIN:-}" ]; then
    # Advertise the Replit public domain so the QR / manifest URL is reachable
    # from a physical device.  Without this, Metro prints a LAN IP that no
    # phone outside the container can reach.
    export EXPO_PACKAGER_PROXY_URL="https://${REPLIT_DEV_DOMAIN}:${EXTERNAL_PORT}"
    export REACT_NATIVE_PACKAGER_HOSTNAME="${REPLIT_DEV_DOMAIN}"
  fi
  # Drop the traps — exec replaces this shell, so the workflow manager's
  # signals reach Expo directly from here on.
  trap - TERM INT HUP
  echo "[dev] Starting Expo on port ${PORT}  (public: ${REPLIT_DEV_DOMAIN:-localhost}:${EXTERNAL_PORT})"
  echo "[dev] Scan the QR with Expo Go or open the web preview."
  echo ""
  exec pnpm exec expo start --port "$PORT"
}

# ── Tunnel mode (opt-in only) ────────────────────────────────────────────────
if [ "${EXPO_USE_TUNNEL:-0}" != "1" ]; then
  # Default path — no ngrok, no surprises.
  start_direct
fi

echo "[dev] EXPO_USE_TUNNEL=1 — trying ngrok tunnel first..."
tunnel_log="$(mktemp)"
trap 'rm -f "$tunnel_log"' EXIT

pnpm exec expo start --tunnel --port "$PORT" > >(tee "$tunnel_log") 2>&1 &
child_pid=$!

wait "$child_pid"; exit_code=$?

# A trapped signal during wait means WE were killed, not a tunnel problem.
if [ "$got_signal" -eq 1 ]; then
  wait "$child_pid" 2>/dev/null
  exit "$exit_code"
fi

# Clean tunnel exit.
if [ "$exit_code" -eq 0 ]; then exit 0; fi

# Signalled externally — not a tunnel problem.
if [ "$exit_code" -ge 128 ]; then exit "$exit_code"; fi

# Any tunnel/ngrok failure → fall back to direct.
echo ""
echo "[dev] Tunnel exited with status ${exit_code}."
echo "[dev] Falling back to direct mode (web preview unaffected)."
echo "[dev] For Expo Go on a phone: use the QR / URL printed below."
echo ""
start_direct
