# signal-cli Runtime

This directory holds the signal-cli binary used by the Signal plugin daemon.

## Auto-install

Run the postinstall script to download the latest signal-cli release for your platform:

```bash
node scripts/install-signal-cli.mjs
```

This downloads the native binary from https://github.com/AsamK/signal-cli/releases
into `signal-cli-runtime/bin/`. On macOS arm64 / Linux arm, no native GraalVM asset
exists - the script falls back to instructions to install via Homebrew or your system
package manager.

## Manual install

```
# macOS (any arch)
brew install signal-cli

# Debian/Ubuntu
sudo apt-get install signal-cli

# Arch
sudo pacman -S signal-cli
```

After installing, configure the signal-cli path in Wayland's Signal settings.

## Bundled distribution

When building with electron-builder, `electron-builder.yml` copies this entire directory
into `<resources>/signal-cli-runtime/` via the `extraResources` rule.  The binary inside
`bin/` is therefore available at `process.resourcesPath/signal-cli-runtime/bin/signal-cli`
in packaged builds.

## Minimum version

signal-cli **0.13.x** or newer is required (JSON-RPC daemon mode `--http`).
