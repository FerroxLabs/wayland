# External Integrations

**Analysis Date:** 2026-07-19

## APIs & External Services

**Model and Inference Providers:**

- OpenAI APIs support keyed chat/model access, embeddings, speech-to-text, and text-to-speech through SDK and HTTP clients under `src/process/providers/`, `src/process/providers/oneShot.ts`, and `src/process/voice/`.
  - SDK/Client: `openai` from `package.json`, plus OpenAI-compatible HTTP handling in `src/process/providers/`.
  - Auth: API keys are configured through the provider registry and encrypted by `src/process/providers/ProviderRepository.ts`; selected child runtimes can also consume standard process environment variables.
- Anthropic Claude APIs are integrated through the official SDK and provider adapters under `src/process/providers/` and `src/process/providers/oneShot.ts`.
  - SDK/Client: `@anthropic-ai/sdk` from `package.json`.
  - Auth: API key stored through the encrypted provider registry in `src/process/providers/ProviderRepository.ts`.
- Google Gemini and Google Code Assist are integrated through keyed and OAuth-backed paths under `src/process/providers/`, `src/process/providers/oneShot.ts`, and `src/process/onboarding/geminiOAuth.ts`.
  - SDK/Client: `@google/genai` and `google-auth-library` from `package.json`.
  - Auth: encrypted provider credentials or CLI-owned OAuth credentials reused from the Gemini CLI profile by `src/process/onboarding/geminiOAuth.ts`.
- Amazon Bedrock is integrated through OfficeCLI/Aion and AWS SDK components in `src/process/providers/bedrockBridge.ts`.
  - SDK/Client: `@aws-sdk/client-bedrock-runtime` and `@office-ai/aioncli-core` from `package.json`.
  - Auth: the normal AWS credential chain, profiles, or process environment consumed by `src/process/providers/bedrockBridge.ts`.
- OpenAI-compatible and specialist providers are cataloged in `src/process/providers/detection/providerEndpoints.ts`, including OpenRouter, Groq, xAI, Mistral, Cohere, DeepSeek, Qwen, Moonshot, Together, Fireworks, Cerebras, Perplexity, Replicate, Hugging Face, NVIDIA, and local/custom endpoints.
  - SDK/Client: shared OpenAI-compatible clients and provider-specific HTTP paths under `src/process/providers/`.
  - Auth: encrypted API-key records in `src/process/providers/ProviderRepository.ts`, with base URLs and model metadata stored alongside provider configuration.
- Flux Router is integrated as a hosted OAuth/API provider and as a locally probed daemon through `src/process/onboarding/connectFlux.ts` and `src/process/flux/FluxDesktopService.ts`.
  - SDK/Client: OAuth2 PKCE over HTTP to `fluxrouter.ai`, plus local HTTP status/tool requests to `127.0.0.1:7878` from `src/process/flux/FluxDesktopService.ts`.
  - Auth: exchanged Flux API key encrypted by the provider registry; local daemon token and manifest are read from the Flux-owned profile by `src/process/flux/FluxDesktopService.ts`.
- Ollama is auto-detected as a local OpenAI-compatible service at `127.0.0.1:11434/v1` by `src/process/onboarding/autoRegisterOllama.ts`.
  - SDK/Client: shared OpenAI-compatible provider client under `src/process/providers/`.
  - Auth: local endpoint configuration; no remote credential is required by the auto-registration path in `src/process/onboarding/autoRegisterOllama.ts`.

**Agent Runtimes:**

- Wayland Core is the primary bundled execution engine, launched from the user override, packaged resource, development resource, or system path resolved by `src/process/agent/wcore/binaryResolver.ts`.
  - SDK/Client: process protocol and adapters under `src/process/agent/wcore/`.
  - Auth: local process boundary; model/provider credentials are passed through the engine configuration path rather than a hosted Core account.
- ACP-capable engines are connected through `@agentclientprotocol/sdk` and spawned CLI adapters in `src/process/agent/acp/`.
  - SDK/Client: `@agentclientprotocol/sdk` from `package.json` and connector definitions in `src/process/agent/acp/acpConnectors.ts`.
  - Auth: engine-native CLI sessions or encrypted provider configuration, depending on the selected connector.
- Claude, Codex, Gemini, OpenCode, and related local engines can be launched as external CLI processes through connectors under `src/process/agent/`.
  - SDK/Client: child-process, ACP, or engine-specific adapters under `src/process/agent/`.
  - Auth: CLI-owned login state remains in each CLI's profile; onboarding helpers can reuse supported profiles without moving plaintext secrets into renderer state.
- OpenAI ChatGPT subscription OAuth and xAI OAuth use loopback PKCE onboarding in `src/process/onboarding/chatgptOAuth.ts` and `src/process/onboarding/xaiOAuth.ts`.
  - SDK/Client: OAuth discovery/token HTTP clients in the onboarding modules.
  - Auth: encrypted persisted tokens plus optional reuse of the respective CLI-owned auth profile; `src/process/onboarding/chatgptOAuth.ts` identifies the subscription inference route as an incomplete seam.
- OpenClaw-compatible remote agents connect over WebSocket through `src/process/agent/remote/RemoteAgentCore.ts`.
  - SDK/Client: WebSocket gateway client in `src/process/agent/remote/`.
  - Auth: bearer token, password, and device-identity mechanisms supported by `src/process/agent/remote/RemoteAgentCore.ts`.

**Model Context Protocol:**

- MCP server discovery, connection, health probing, tool listing, and invocation are implemented by `src/process/services/mcpServices/McpProtocol.ts`.
  - SDK/Client: `@modelcontextprotocol/sdk` from `package.json`.
  - Auth: server-specific environment, headers, or OAuth configuration managed by services under `src/process/services/mcpServices/`.
- Stdio, SSE, HTTP, and Streamable HTTP transports are supported by `src/process/services/mcpServices/McpProtocol.ts` and server writers such as `src/process/services/mcpServices/WCoreMcpAgent.ts`.
  - SDK/Client: MCP SDK transport implementations plus spawned stdio processes.
  - Auth: per-server launch environment, request headers, or OAuth tokens handled through `src/process/services/mcpServices/McpOAuthService.ts`.
- MCP configuration can be published for Claude, Codex, Gemini, OpenCode, Wayland Aion, and Wayland Core by adapters registered in `src/process/services/mcpServices/McpService.ts`.
  - SDK/Client: agent-specific writers under `src/process/services/mcpServices/`, including `src/process/services/mcpServices/CodexMcpAgent.ts` and `src/process/services/mcpServices/WCoreMcpAgent.ts`.
  - Auth: delegated to the target CLI/runtime and MCP server configuration.
- Built-in MCP resources are shipped from `src/process/resources/builtinMcp/`, while catalog metadata is rendered from `src/renderer/mcp-catalog/`.
  - SDK/Client: local process resources and catalog UI.
  - Auth: capability-specific; local built-ins do not require a hosted MCP account.
- The production declaration/probe path does not by itself prove active-session tool readiness; that distinction is specified in `docs/desktop-overhaul-source/MCP-DEEP-DIVE.md`.

**Messaging and Collaboration Services:**

- Built-in channel types include Telegram, Slack, Discord, WhatsApp, Twilio SMS, Lark, DingTalk, Weixin/WeCom, Matrix, AgentMail, and IMAP email in `src/process/channels/types.ts`.
  - SDK/Client: platform SDKs and HTTP clients declared in `package.json`, with adapters under `src/process/channels/`.
  - Auth: bot tokens, signing secrets, account credentials, and OAuth material are encrypted through channel and safe-storage services under `src/process/channels/` and `src/process/secrets/`.
- Additional adapters for Signal, LINE, Microsoft Teams, Nostr, Twitch, Mattermost, Synology Chat, BlueBubbles, Nextcloud Talk, IRC, Google Chat, and iMessage are present under `src/process/channels/`.
  - SDK/Client: platform-specific HTTP, WebSocket, local bridge, or webhook implementations in each adapter directory.
  - Auth: platform tokens or local bridge identity stored through channel configuration; adapter presence does not imply release-level operability for every platform.
- WhatsApp uses a separately packaged bridge under `src/process/channels/whatsapp-bridge/`, with Baileys, WhatsApp Web, and Meta Cloud API paths represented by its package and channel adapters.
  - SDK/Client: dependencies in `src/process/channels/whatsapp-bridge/package.json` and parent adapters under `src/process/channels/`.
  - Auth: QR/session state or Meta application credentials stored outside renderer state and protected by channel storage.
- Email integrates AgentMail HTTP/webhooks plus IMAP/SMTP through adapters under `src/process/channels/` and the worker entry `src/process/worker/emailImap.ts`.
  - SDK/Client: IMAP, Nodemailer, and HTTP clients declared in `package.json`.
  - Auth: encrypted mailbox or service credentials managed by channel configuration.
- Public webhook exposure can use Cloudflare Tunnel, ngrok, or Tailscale Funnel through the explicit opt-in manager in `src/process/channels/tunnel/TunnelManager.ts`.
  - SDK/Client: spawned tunnel clients and local process monitoring.
  - Auth: provider-native tunnel login state or tokens; tunnel exposure is not automatic.

**Voice Services:**

- Speech-to-text supports OpenAI Whisper, Deepgram Nova, Flux Voice, and a local Whisper endpoint in `src/process/voice/SpeechToTextService.ts`.
  - SDK/Client: provider HTTP APIs and local endpoint calls from `src/process/voice/SpeechToTextService.ts`.
  - Auth: encrypted provider keys for hosted services; local endpoint configuration for local Whisper.
- Text-to-speech supports OpenAI speech and macOS system-native speech in `src/process/voice/TextToSpeechService.ts`.
  - SDK/Client: OpenAI HTTP API and the macOS `say` process.
  - Auth: encrypted OpenAI key; no hosted credential for system-native speech.
- Kokoro is represented as unavailable without its runtime in `src/process/voice/TextToSpeechService.ts`, and the overall interaction model is turn-based rather than full duplex according to `docs/desktop-overhaul-source/VOICE-CONVERSATION-MODE.md`.

**Distribution Services:**

- GitHub Releases hosts auto-update metadata and packaged artifacts configured by `electron-builder.yml` and consumed by `src/process/services/autoUpdaterService.ts`.
  - SDK/Client: Electron Updater and Electron Builder from `package.json`.
  - Auth: publication uses GitHub workflow/release credentials; update checks consume public release metadata for normal distribution.
- Sentry receives optional desktop errors and source maps from `src/index.ts` and `electron.vite.config.ts`.
  - SDK/Client: `@sentry/electron` and `@sentry/vite-plugin` from `package.json`.
  - Auth: runtime DSN plus build-time organization, project, and auth token settings.

## Data Storage

**Databases:**

- SQLite is the authoritative local application database, opened by `src/process/services/database/index.ts` at the application data path as `wayland.db`.
  - Connection: local filesystem database through the driver factory in `src/process/services/database/drivers/createDriver.ts`.
  - Client: `better-sqlite3` in Electron and `bun:sqlite` in standalone Bun runtime.
- SQLite stores application configuration, chats/projects, providers, channels, WebUI auth state, and related repositories under `src/process/services/database/`.
  - Connection: single local database with WAL and recovery/quarantine behavior in `src/process/services/database/index.ts`.
  - Client: repository and migration layers under `src/process/services/database/`.

**File Storage:**

- Application-managed files, project/workspace data, extensions, skills, downloaded models, and engine state use local user-data and profile paths through utilities and services under `src/process/`.
- Packaged immutable assets are delivered from `resources/` and the `extraResources` map in `electron-builder.yml`.
- Sync is a beta encrypted local-file backend in `src/process/sync/SyncManager.ts`, writing `wayland-sync.enc` and sync metadata; `src/process/sync/CloudRelayBackend.ts` does not implement a cloud relay.
- Standalone container persistence is mounted at `/data` through `DATA_DIR` and `VOLUME /data` in `Dockerfile`.

**Caching:**

- Runtime caches are local filesystem or database caches implemented under `src/process/`; no external Redis or managed cache dependency is part of the application runtime configuration.
- Build and automation caches are provided by Bun, Playwright, and GitHub Actions through `package.json`, `playwright.config.ts`, and `.github/workflows/`.

## Authentication & Identity

**Desktop Secrets:**

- Electron safe storage delegates encryption to macOS Keychain, Windows DPAPI, or Linux libsecret in `src/process/secrets/safeStorage.ts`.
- Standalone/headless mode uses a local file-key fallback with AES-256-GCM and restricted key-file permissions in `src/process/secrets/fileKeyStore.ts`.
- Provider repositories encrypt credentials before persistence and do not return plaintext to renderer callers in `src/process/providers/ProviderRepository.ts`.

**OAuth Providers:**

- Flux Router uses browser-based OAuth2 PKCE with loopback callback and token exchange in `src/process/onboarding/connectFlux.ts`.
- xAI uses discovery-backed OAuth2 PKCE and optional Grok CLI credential reuse in `src/process/onboarding/xaiOAuth.ts`.
- ChatGPT/OpenAI subscription onboarding uses OAuth2 PKCE and optional Codex CLI credential reuse in `src/process/onboarding/chatgptOAuth.ts`.
- Gemini Code Assist reuses supported Gemini CLI OAuth state through `src/process/onboarding/geminiOAuth.ts`.
- MCP-host OAuth is coordinated by `src/process/services/mcpServices/McpOAuthService.ts`.

**WebUI Authentication:**

- The remote WebUI uses application-managed administrator credentials, bcrypt password hashing, JWT session cookies, CSRF protection, rate limiting, and durable token invalidation under `src/process/webserver/`.
- JWT signing uses an encrypted persisted secret or a deployment override consumed under `src/process/webserver/`; remote bind, allowed origins, trusted proxy, and operator CIDR controls are configured in the same subsystem.
- Incoming webhook endpoints are mounted before the general JSON parser so platform-specific handlers can verify raw signed bodies in `src/process/webserver/index.ts` and `src/process/channels/webhook/verifiers/`.

## Monitoring & Observability

**Error Tracking:**

- Sentry is disabled unless `SENTRY_DSN` is present and is initialized with PII scrubbing and conservative tracing in `src/index.ts`.
- Build-time Sentry source-map upload is conditionally enabled by `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` in `electron.vite.config.ts`.

**Logs:**

- Electron Log writes daily local files with a 10 MB size cap and info-level default in `src/process/services/configureConsoleLog.ts`.
- Platform log roots are selected by `src/process/services/configureConsoleLog.ts`: macOS uses `~/Library/Logs/Wayland`, Windows uses the Wayland roaming profile logs directory, and Linux uses the Wayland configuration logs directory.
- Process and connector diagnostics stay local unless an explicitly configured integration, such as Sentry, transmits them.

## CI/CD & Deployment

**Hosting:**

- Desktop release artifacts are published to the `FerroxLabs/wayland` GitHub release target configured in `electron-builder.yml`.
- The standalone WebUI/server is containerized by `Dockerfile`; the current image and install strategy are classified as not release-ready for the cloud/pro bar in `docs/desktop-overhaul-source/CLOUD-PRO.md`.
- The installer package and Homebrew update path are maintained under `installer/` and `.github/workflows/bump-homebrew.yml`.

**CI Pipeline:**

- GitHub Actions runs reusable cross-platform builds through `.github/workflows/_build-reusable.yml` and orchestrates releases through `.github/workflows/build-and-release.yml`.
- Pull-request checks and Electron evidence run through `.github/workflows/pr-checks.yml` and `.github/workflows/pr-e2e-artifacts.yml`.
- Release trust, gates, and acceptance are defined by `.github/workflows/release-gates.yml`, `.github/workflows/release-acceptance.yml`, and `.github/workflows/release-acceptance-trust-root.yml`.
- npm installer publication runs through `.github/workflows/publish-npm.yml`.
- Platform signing and notarization are wired through `electron-builder.yml`, build hooks under `scripts/`, and protected CI credentials referenced by `.github/workflows/`.

## Environment Configuration

**Required Environment Variables:**

- Default desktop startup has no mandatory hosted-provider environment variable; provider and channel credentials are configured through encrypted application repositories under `src/process/providers/` and `src/process/channels/`.
- Standalone container deployment supplies `PORT=3000`, `NODE_ENV=production`, and `DATA_DIR=/data` as image defaults in `Dockerfile`.
- Remote WebUI deployments can set bind, port, origin, HTTPS, proxy, CIDR, base-URL, and JWT overrides consumed under `src/process/webserver/`; local-only desktop operation does not require them.
- Optional observability settings are consumed by `src/index.ts` and `electron.vite.config.ts`; release/signing settings are consumed by `electron-builder.yml`, `scripts/`, and `.github/workflows/`.
- Optional Flux daemon/provider overrides are consumed by `src/process/flux/FluxDesktopService.ts`; standard provider credentials can be passed to specific provider and child-runtime paths under `src/process/providers/` and `src/process/agent/`.

**Secrets Location:**

- Provider and channel secrets persist encrypted in the local SQLite-backed repositories under `src/process/providers/`, `src/process/channels/`, and `src/process/services/database/`.
- Encryption roots use OS-backed Electron safe storage or the restricted standalone file-key store under `src/process/secrets/`.
- CLI-native OAuth profiles remain owned by their respective CLIs and are read only by supported reuse paths in `src/process/onboarding/`.
- CI publication, notarization, signing, and Sentry upload secrets are supplied by GitHub Actions and referenced from `.github/workflows/`, `electron-builder.yml`, and `electron.vite.config.ts`.

## Webhooks & Callbacks

**Incoming:**

- Channel webhook routes enter through `src/process/webserver/index.ts` and channel-specific handlers under `src/process/channels/`.
- Raw-body signature verification implementations live under `src/process/channels/webhook/verifiers/` for supported platforms.
- OAuth loopback callbacks for Flux, xAI, ChatGPT, Gemini, and MCP are handled by the onboarding and MCP OAuth modules under `src/process/onboarding/` and `src/process/services/mcpServices/`.
- Remote WebUI WebSocket sessions are accepted by the manager under `src/process/webserver/`.

**Outgoing:**

- Channel adapters send messages, status changes, media, and platform API callbacks through clients under `src/process/channels/`.
- Provider requests and streaming responses leave through adapters under `src/process/providers/`, with routed Flux requests handled under `src/process/flux/`.
- MCP clients launch stdio servers or connect to remote SSE/HTTP endpoints through `src/process/services/mcpServices/McpProtocol.ts`.
- Auto-update checks query GitHub release metadata through `src/process/services/autoUpdaterService.ts`.
- Optional telemetry and source-map uploads go to Sentry through `src/index.ts` and `electron.vite.config.ts`.

---

_Integration audit: 2026-07-19_
