# Security

Wayland is a local-first agent that can read files, run tools, call model providers, expose a
Web UI, and load extensions. Treat it like other developer tools that operate on your machine:
powerful by design, but only safe when the trust boundaries are clear.

## Reporting a vulnerability

Use GitHub's **private vulnerability reporting** — the "Report a vulnerability" button under
the repository's **Security** tab. Please do **not** open a public issue for an exploitable
report. There is no security email; all reports route through GitHub.

Include a concise description, the affected version, and reproduction steps. We triage on a
best-effort basis (this is a self-managed open-source project).

## Release trust model

- `v0.9.6-rc.1` is a release candidate.
- macOS builds are not notarized yet.
- Windows builds are not Authenticode-signed yet, and Windows update signature verification
  stays disabled until signing is available.
- Linux `.deb` verification currently relies on GitHub Releases over HTTPS. GPG-signed
  `.deb.sig` artifacts are planned but not yet active.
- For a stronger supply-chain posture today, build from source and review the release workflow
  and bundled artifacts before installing.

## Local data and keys

- Desktop provider keys use OS keychain storage where supported (macOS Keychain, Windows DPAPI,
  Linux libsecret).
- Headless/server mode may store provider keys in environment files because OS keychains are
  usually unavailable there.
- Conversations, settings, and memory live in local SQLite-backed storage.
- Don't run Wayland against repositories or directories you wouldn't give a local developer
  tool permission to read or modify.

## Network egress

Wayland needs no Wayland-hosted account for local use, but configured features can send data
over the network: model-provider calls (OpenAI, Anthropic, Gemini, Vertex, Bedrock, or
OpenAI-compatible endpoints); optional Flux routing; update checks and release downloads;
remote channels/connectors (Slack, Discord, email, Matrix, and similar); optional Sentry
telemetry when `SENTRY_DSN` is configured; and any user-installed extensions or lifecycle hooks.

## Remote Web UI

The Web UI binds to `127.0.0.1` by default. Remote mode binds to `0.0.0.0` and should be
treated as an administrative interface. Recommended deployments: localhost only, SSH
forwarding, a private network (e.g. Tailscale), or a TLS reverse proxy with explicit allowed
origins. Avoid exposing the Web UI directly to the public internet; if remote mode is enabled,
configure allowed origins and rotate the initial admin password after first login.

## Extensions and channels

The extension model is a **trusted-code model, not a full sandbox**. Some extension paths run
with full Node.js / main-process privileges, and declared permissions are not yet a complete
runtime confinement boundary. Install only extensions and channel plugins from sources you
trust.

## Electron and renderer boundaries

The app uses hardened Electron defaults: context isolation, disabled Node integration in the
renderer, sandboxed windows/webviews where applicable, CSP, external-URL-scheme allowlisting,
and Web UI CSRF/CORS/session controls. These reduce risk but do not remove the need to trust
local agent actions, configured model providers, and installed extensions.

## Auto-update integrity

Auto-update `.deb` verification currently relies on GitHub release authentication + HTTPS
download integrity. GPG-signed `.deb.sig` artifacts are tracked for a future release-infra
chain (requires a long-lived signing key plus a CI signing job). See
`src/process/services/autoUpdaterService.ts` for the download site where the GPG verification
hook will be installed.
