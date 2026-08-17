#!/usr/bin/env bash
#
# Starts the Expo dev server.
#
# The tunnel (ngrok) is what lets a physical phone running Expo Go reach this
# dev server, so it is tried first. But ngrok is a third-party service: when it
# is down, `expo start --tunnel` exits immediately and the whole workflow dies,
# taking the web preview with it even though nothing is wrong with the app.
#
# So: if — and only if — the tunnel itself is what failed, fall back to a plain
# dev server and advertise the Repl's public domain instead of the LAN IP that
# no phone can reach. Any other failure is reported verbatim, because masking
# it behind a retry would hide real bugs.
#
# Set EXPO_NO_TUNNEL=1 to skip the tunnel attempt entirely.
set -u

PORT="${PORT:-18115}"
# Local $PORT is published on this external port (see [[ports]] in .replit).
EXTERNAL_PORT="${EXPO_EXTERNAL_PORT:-3000}"

child_pid=""
got_signal=0

# Expo runs as a child rather than via exec during the tunnel attempt, so
# signals sent to this shell must be forwarded by hand. Without this, the
# workflow manager can reap the shell and leave Metro and ngrok running, which
# then squat the port and break the next start.
# `pnpm exec expo` spawns Metro and ngrok beneath itself, and killing only the
# top process leaves those grandchildren alive holding the port. Walk the tree
# instead of signalling a process group — a group kill can reach siblings
# outside this script.
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
trap 'forward_signal INT' INT
trap 'forward_signal HUP' HUP

start_direct() {
  if [ -n "${REPLIT_DEV_DOMAIN:-}" ]; then
    # Make the manifest/QR advertise the public Repl domain rather than the
    # container's LAN address, which no phone can reach.
    export EXPO_PACKAGER_PROXY_URL="https://${REPLIT_DEV_DOMAIN}:${EXTERNAL_PORT}"
    export REACT_NATIVE_PACKAGER_HOSTNAME="${REPLIT_DEV_DOMAIN}"
  fi
  # Drop the traps: exec replaces this shell, so the workflow manager's signals
  # reach Expo directly from here on.
  trap - TERM INT HUP
  exec pnpm exec expo start --port "$PORT"
}

if [ "${EXPO_NO_TUNNEL:-0}" = "1" ]; then
  start_direct
fi

tunnel_log="$(mktemp)"
trap 'rm -f "$tunnel_log"' EXIT

# Tee so the output still streams to the workflow console while we keep a copy
# to classify the failure with.
pnpm exec expo start --tunnel --port "$PORT" > >(tee "$tunnel_log") 2>&1 &
child_pid=$!

# A trapped signal interrupts `wait`, so wait again for the real exit status.
wait "$child_pid"; exit_code=$?
if [ "$got_signal" -eq 1 ]; then
  wait "$child_pid" 2>/dev/null; exit_code=$?
  exit "$exit_code"
fi

if [ "$exit_code" -eq 0 ]; then
  exit 0
fi

# Exit codes >= 128 mean the process was signalled — not a tunnel problem.
if [ "$exit_code" -ge 128 ]; then
  exit "$exit_code"
fi

if grep -qiE "failed to start tunnel|remote gone away|ngrok" "$tunnel_log"; then
  echo ""
  echo "[dev] The ngrok tunnel failed to start (exit ${exit_code})."
  echo "[dev] Starting a normal dev server instead, so the web preview keeps"
  echo "[dev] working."
  echo ""
  echo "[dev] NOTE: Expo Go on a phone will NOT be able to connect while the"
  echo "[dev] tunnel is down. Expo Go speaks plain http over exp://, but this"
  echo "[dev] Repl's public ports are HTTPS-only, so the printed QR code"
  echo "[dev] cannot be reached from a device. Use the web preview until"
  echo "[dev] ngrok recovers (https://status.ngrok.com), then restart this"
  echo "[dev] workflow to get a working QR code."
  echo ""
  start_direct
fi

# Anything else is a genuine failure: report it as-is rather than retrying.
echo ""
echo "[dev] Expo exited with status ${exit_code} for a reason unrelated to the"
echo "[dev] tunnel. Not retrying — see the error above."
exit "$exit_code"
