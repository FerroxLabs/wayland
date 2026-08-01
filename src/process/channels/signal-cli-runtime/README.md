# signal-cli Runtime

This directory holds the signal-cli binary used by the Signal plugin daemon.

## Auto-install

The packaging helper requires an explicit target:

```bash
node scripts/install-signal-cli.mjs --platform linux --arch x64
```

It downloads exactly signal-cli **v0.14.6** from its pinned GitHub release, verifies
the release, asset, archive, executable architecture, and binary SHA-256, then
publishes the verified native binary into `signal-cli-runtime/bin/`.

The pinned upstream release proves a bundled native binary only for Linux x64.
Every other package target is reported as unavailable and stale bundled bytes are
removed. The helper does not fall back to a system executable or an unpinned asset.

## Manual install

```
# macOS (any arch)
brew install signal-cli

# Debian/Ubuntu
sudo apt-get install signal-cli

# Arch
sudo pacman -S signal-cli
```

Manual installation is a separate user-configured path. After installing, configure
the signal-cli path in Wayland's Signal settings; it is not treated as a bundled,
verified packaging artifact.

## Bundled distribution

When building with electron-builder, `electron-builder.yml` copies this entire directory
into `<resources>/signal-cli-runtime/` via the `extraResources` rule. The binary inside
`bin/` is therefore available at `process.resourcesPath/signal-cli-runtime/bin/signal-cli`
in packaged builds.

## Minimum version

The bundled packaging contract is pinned to signal-cli **v0.14.6**. A manually
configured runtime must remain compatible with Wayland's JSON-RPC daemon integration.
