# WSL2 Workaround

**Status:** Documented workaround. Full WSL2 / legacy-CPU support is tracked for the v0.1.3 platform-fixes chain.

## Symptom

Running Wayland on WSL2 currently exhibits two distinct failure modes:

1. **Electron deadlock under WSL2.** Launching the bundled Electron app inside a WSL2 distro hangs during startup - typically before the main window appears - and never recovers. The root cause is a combination of WSLg's Wayland/X11 compositor behavior and Electron's sandbox + `xdg-settings` probing.
2. **SIGILL on non-AVX CPUs.** The bundled `bun` binary shipped with Wayland is compiled with AVX instructions. On older or virtualized CPUs that do not expose AVX (some WSL2 hosts, older bare-metal Linux boxes, certain cloud micro-VMs), invoking the bundled runtime crashes immediately with `SIGILL: illegal instruction`.

## Workaround

Run Wayland in **WebUI mode** with the sandbox disabled and provide a no-op `xdg-settings` so Electron's startup probe completes:

```bash
# 1. Provide a mock xdg-settings on PATH (no-op, exits 0)
sudo tee /usr/local/bin/xdg-settings >/dev/null <<'EOF'
#!/bin/sh
exit 0
EOF
sudo chmod +x /usr/local/bin/xdg-settings

# 2. Launch the app with --webui and --no-sandbox
wayland --webui --no-sandbox
```

This bypasses the Electron deadlock by routing the UI through the WebUI server, and avoids the `xdg-settings` probe that hangs under WSLg.

For the SIGILL case, use a system-installed `bun` (built without AVX requirements) on `PATH` ahead of the bundled binary, or run Wayland on a host that exposes AVX.

## Status

This is a documented workaround only - no automatic detection or fallback ships in v0.1.2-safety. Full WSL2 and legacy-CPU support (sandbox-mode autodetection, non-AVX runtime fallback, native WSLg integration) is tracked for the **v0.1.3 platform-fixes** chain.
