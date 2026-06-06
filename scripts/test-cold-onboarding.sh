#!/usr/bin/env bash
#
# Launch Wayland in a fully isolated, "brand new machine" environment so the
# first-run onboarding scan finds NOTHING - no provider keys, no CLIs, no
# dotfiles, no saved profile - leaving the cold Google-connect door as the only
# path. Your real keys / CLIs / ~/.wayland-dev profile are physically out of
# reach (separate HOME, empty env, minimal PATH).
#
# Prereq: a built app. Run once:  bun run package   (electron-vite build -> out/)
#
# Usage:  bash scripts/test-cold-onboarding.sh
#
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ELECTRON_BIN="$APP_DIR/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron"
CDP_PORT=9333

if [[ ! -x "$ELECTRON_BIN" ]]; then
  echo "ERROR: electron binary not found at $ELECTRON_BIN" >&2
  echo "Run 'bun install' first." >&2
  exit 1
fi
if [[ ! -d "$APP_DIR/out" ]]; then
  echo "ERROR: no build output at $APP_DIR/out - run 'bun run package' first." >&2
  exit 1
fi

# Throwaway HOME: hides ~/.codex, ~/.flux, ~/.claude and gives a fresh, empty
# Electron userData. Removed on exit.
TMP_HOME="$(mktemp -d /tmp/wayland-cold.XXXXXX)"
cleanup() { rm -rf "$TMP_HOME"; }
trap cleanup EXIT

# macOS safeStorage (Keychain) backs provider-credential encryption. It looks for
# the login keychain at $HOME/Library/Keychains - a bare temp HOME has none, so
# safeStorage.isEncryptionAvailable() returns false and EVERY provider connect
# silently fails (creds can't encrypt -> no row -> no models). Link the real
# Keychains in so connect/persist works, while dotfiles under HOME stay hidden.
mkdir -p "$TMP_HOME/Library"
ln -s "$HOME/Library/Keychains" "$TMP_HOME/Library/Keychains"

# Optional: restore a stashed ~/.gemini (oauth_creds.json) so a re-test doesn't
# need a fresh Google sign-in. Set WAYLAND_COLD_GEMINI_STASH=/path/to/.gemini
if [[ -n "${WAYLAND_COLD_GEMINI_STASH:-}" && -d "$WAYLAND_COLD_GEMINI_STASH" ]]; then
  cp -a "$WAYLAND_COLD_GEMINI_STASH" "$TMP_HOME/.gemini"
  echo "  restored Gemini OAuth from $WAYLAND_COLD_GEMINI_STASH"
fi

echo "Cold-onboarding sandbox"
echo "  HOME    = $TMP_HOME   (fresh, empty)"
echo "  PATH    = /usr/bin:/bin:/usr/sbin:/sbin   (no CLIs, no homebrew)"
echo "  env     = scrubbed (no provider API keys)"
echo "  CDP     = 127.0.0.1:$CDP_PORT"
echo "  profile = fresh (under temp HOME) - real ~/.wayland-dev untouched"
echo ""

# env -i starts from an EMPTY environment; we add back only what's needed to run
# the self-contained Electron binary. None of the shell's exported API keys carry
# over, and the minimal PATH contains none of the installed CLIs.
#
# WAYLAND_MULTI_INSTANCE=1 skips Electron's single-instance lock so this coexists
# with a real dev app already running (src/index.ts), and isolates onto the
# '-dev-2' profile. WAYLAND_CDP_PORT moves CDP off 9230 to avoid colliding with
# the real instance (the app force-enables CDP itself; a CLI flag won't move it).
exec env -i \
  HOME="$TMP_HOME" \
  PATH="/usr/bin:/bin:/usr/sbin:/sbin" \
  TERM="${TERM:-xterm-256color}" \
  LANG="${LANG:-en_US.UTF-8}" \
  WAYLAND_MULTI_INSTANCE=1 \
  WAYLAND_CDP_PORT="$CDP_PORT" \
  "$ELECTRON_BIN" \
  "$APP_DIR"
