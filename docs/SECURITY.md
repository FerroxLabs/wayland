# Security

Wayland is a local-first agent that can read files, run tools, call model
providers, expose a Web UI, and load extensions. Treat it like other developer
tools that can operate on your machine: powerful by design, but only safe when
the trust boundaries are clear.

## Supported Release Trust Model

- `v0.9.6-rc.1` is a release candidate.
- macOS builds are not notarized yet.
- Windows builds are not Authenticode-signed yet, and Windows update signature
  verification remains disabled until signing is available.
- Linux `.deb` verification currently relies on GitHub Releases over HTTPS.
  GPG-signed `.deb.sig` artifacts are planned but not yet active.
- If you need a stronger supply-chain posture today, build from source and
  review the release workflow and bundled artifacts before installing.

## Local Data And Keys

- Desktop provider keys should use OS keychain storage where supported.
- Headless/server mode may store provider keys in environment files because
  OS keychains are usually unavailable.
- Conversations, settings, and memory live in local SQLite-backed storage.
- Do not run Wayland against repositories or directories you would not give a
  local developer tool permission to read or modify.

## Network Egress

Wayland does not require a Wayland-hosted account for local use, but configured
features can send data over the network:

- model-provider calls such as OpenAI, Anthropic, Gemini, Vertex, Bedrock, or
  OpenAI-compatible endpoints;
- optional Flux routing;
- update checks and release downloads;
- remote channels and connectors such as Slack, Discord, email, Matrix, and
  similar integrations;
- optional Sentry telemetry when `SENTRY_DSN` is configured;
- user-installed extensions or lifecycle hooks.

## Remote Web UI

The Web UI is designed to bind to `127.0.0.1` by default. Remote mode binds to
`0.0.0.0` and should be treated as an administrative interface.

Recommended deployments:

- localhost only;
- SSH forwarding;
- Tailscale or another private network;
- a TLS reverse proxy with explicit allowed origins.

Avoid exposing the Web UI directly to the public internet. If remote mode is
enabled, configure allowed origins and rotate the initial admin password after
first login.

## Extensions And Channels

The current extension model is a trusted-code model, not a full security
sandbox. Some extension paths run with full Node.js or main-process privileges,
and declared permissions are not a complete runtime confinement boundary yet.

Install only extensions and channel plugins from sources you trust. Do not
describe third-party extensions as sandboxed marketplace apps until the signed
manifest and runtime permission model are complete.

## Electron And Renderer Boundaries

The application uses hardened Electron defaults such as context isolation,
disabled Node integration in the renderer, sandboxed windows/webviews where
applicable, CSP, external URL scheme allowlisting, and WebUI CSRF/CORS/session
controls. These controls reduce risk but do not remove the need to trust local
agent actions, configured model providers, and installed extensions.

## Reporting Security Issues

Please do not open public issues for exploitable security reports. Email
`support@getwayland.com` with a concise description, affected version, and
reproduction steps.
