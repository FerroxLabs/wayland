# Technology Stack

**Analysis Date:** 2026-07-19

## Languages

**Primary:**
- TypeScript 5.8 is the application language across Electron main, preload, renderer, worker, and shared code under `src/`; compiler settings and path aliases are defined in `tsconfig.json`.
- TSX powers the React desktop and WebUI surfaces under `src/renderer/`, with JSX compilation configured in `tsconfig.json`.

**Secondary:**
- JavaScript is used for build, packaging, release, and native-preparation scripts under `scripts/`, including `scripts/build-server.mjs` and the hooks referenced by `electron-builder.yml`.
- Rust 2024 implements the bundled constitution filesystem helper in `native/constitution-fs/`; its crate metadata and release profile are in `native/constitution-fs/Cargo.toml`.
- CSS and HTML define renderer entry points and styling in `src/renderer/index.html`, `src/renderer/`, and `src/renderer/assets/`, with utility generation configured by `uno.config.ts`.
- Shell and PowerShell support packaging and platform automation under `scripts/` and `.github/workflows/`.

## Runtime

**Environment:**
- Electron 41 is the primary desktop runtime; the production main entry is `out/main/index.js`, declared in `package.json`, and source bootstrapping starts at `src/bootstrap.ts` through `electron.vite.config.ts`.
- Chromium-hosted React renderers run in isolated renderer processes with preload bridges from `src/preload/main.ts` and `src/preload/ambientPreload.ts`, configured in `electron.vite.config.ts`.
- Bun 1.3 is the declared package, script, test, and standalone-server runtime in `package.json`; the standalone server entry is built by `scripts/build-server.mjs` and launched from `dist-server/server.mjs`.
- Node.js `>=22 <25` is the declared compatible Node range in `package.json` and supports Electron tooling plus spawned JavaScript integrations.
- The container build uses Node 20 in its builder stage and `oven/bun:latest` at runtime in `Dockerfile`, which differs from the root engine range and package-manager pin in `package.json`.

**Package Manager:**
- Bun `1.3.11` is pinned by the `packageManager` field in `package.json`.
- The root dependency graph is locked by `bun.lock`.
- The separately packaged WhatsApp bridge has its own Node package boundary in `src/process/channels/whatsapp-bridge/package.json`.

## Frameworks

**Core:**
- Electron `^41.6.0` provides the desktop shell, native lifecycle, IPC, secure storage, auto-update, and packaging integration declared in `package.json`.
- React `^19.1.0` and React DOM `^19.1.0` render the user interface under `src/renderer/`, with application routing supplied by React Router DOM `^7.18.1` in `package.json`.
- Arco Design `^2.66.1` supplies component primitives and UnoCSS `^66.3.3` supplies generated utility styling; dependencies are declared in `package.json` and tokens/presets are configured in `uno.config.ts`.
- Express `^5.1.0` hosts the standalone/remote WebUI API in `src/process/webserver/index.ts`, while `ws` `^8.21.1` provides its WebSocket transport.
- Electron Vite `^5.0.0` composes the main, preload, worker, and renderer builds in `electron.vite.config.ts`; standalone renderer output is configured separately in `vite.renderer.config.ts`.

**Testing:**
- Vitest `^4.0.18` runs Node and jsdom project suites configured in `vitest.config.ts`.
- Bun's built-in test runner covers Bun-specific and standalone-runtime tests through scripts in `package.json`.
- Playwright `^1.58.2` drives single-worker Electron end-to-end tests configured in `playwright.config.ts`.
- Testing Library React `^16.3.2`, jest-dom, and user-event support renderer component tests through dependencies in `package.json`.

**Build/Dev:**
- Vite `^6.4.3`, Electron Vite, and TypeScript build the process bundles defined in `electron.vite.config.ts` and `vite.renderer.config.ts`.
- Electron Builder `^26.10.0` creates macOS, Windows, and Linux distributions according to `electron-builder.yml`.
- Oxlint and Oxfmt provide linting and formatting through scripts and dev dependencies in `package.json`.
- Esbuild packages the standalone server through `scripts/build-server.mjs` and build scripts in `package.json`.
- Sentry's Vite plugin `^5.1.1` optionally uploads source maps from the build defined in `electron.vite.config.ts`.

## Key Dependencies

**Critical:**
- `@agentclientprotocol/sdk` `^0.18.2` implements ACP client connectivity for spawned agent engines under `src/process/agent/acp/`.
- `@modelcontextprotocol/sdk` `^1.29.0` implements MCP transports, discovery, and tool calls in `src/process/services/mcpServices/McpProtocol.ts`.
- `better-sqlite3` `^12.4.1` is the Electron database driver, while Bun's built-in SQLite driver is selected for standalone runtime in `src/process/services/database/drivers/createDriver.ts`.
- `@office-ai/aioncli-core` `^0.30.6` supports OfficeCLI/Aion-backed agent and model integrations referenced from `src/process/`.
- Official Anthropic, OpenAI, Google GenAI, and AWS Bedrock SDKs declared in `package.json` support first-party provider paths implemented under `src/process/providers/` and `src/process/onboarding/`.
- Zod `^3.25.76` validates runtime contracts throughout `src/`, including process boundary and service payloads.
- The bundled Wayland Core executable is resolved through `src/process/agent/wcore/binaryResolver.ts` and packaged from `resources/bundled-wayland-core` via `electron-builder.yml`.

**Infrastructure:**
- Electron Log `^5.4.3` provides rotating local process logs configured in `src/process/services/configureConsoleLog.ts`.
- Sentry Electron `^7.13.0` provides optional crash/error reporting initialized in `src/index.ts`.
- Electron Updater `^6.6.2` consumes GitHub-hosted release metadata through `src/process/services/autoUpdaterService.ts` and `electron-builder.yml`.
- `ws` and Socket.IO Client provide WebSocket connectivity for WebUI, remote-agent, and connector paths under `src/process/webserver/`, `src/process/agent/remote/`, and `src/process/channels/`.
- Messaging SDKs for Slack, Discord, Telegram, Lark, Matrix, LINE, Twilio, email, and WhatsApp are declared in `package.json` and used by adapters under `src/process/channels/`.
- `@huggingface/transformers` `^4.2` and downloaded model assets support local inference and voice-related capabilities under `src/process/` and packaged resources in `electron-builder.yml`.

## Configuration

**Environment:**
- Desktop feature and provider configuration is primarily stored through process configuration and SQLite repositories under `src/process/services/database/` and `src/process/providers/`, rather than requiring cloud environment variables at application startup.
- Observability is opt-in through `SENTRY_DSN`; source-map publication additionally uses `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` in `src/index.ts` and `electron.vite.config.ts`.
- Standalone WebUI deployment uses `PORT`/`WAYLAND_PORT`, `DATA_DIR`, and optional remote-access, HTTPS, origin, proxy, and JWT settings consumed under `src/process/webserver/` and defined in `Dockerfile`.
- Build and release configuration consumes platform signing, notarization, GitHub publication, and release-track variables in `electron-builder.yml`, `scripts/`, and `.github/workflows/`.
- Provider keys can be supplied to selected process and child-runtime paths, but persistent credentials are encrypted by repositories under `src/process/providers/` and `src/process/secrets/`.

**Build:**
- Main, preload, worker, and desktop renderer entries are enumerated in `electron.vite.config.ts`.
- Standalone WebUI output is defined in `vite.renderer.config.ts`; standalone server output is assembled by `scripts/build-server.mjs`.
- Cross-platform application metadata, extra resources, protocol registration, signing, and release publication are defined in `electron-builder.yml`.
- TypeScript target, module resolution, strictness, JSX, and aliases are defined in `tsconfig.json`.
- UnoCSS semantic colors and presets are defined in `uno.config.ts`.
- Unit and end-to-end project topology is defined in `vitest.config.ts` and `playwright.config.ts`.
- The desktop-overhaul authority boundary assigns organization, cockpit, channel, governance, and OS surfaces to this repository in `docs/desktop-overhaul-source/MASTER-BUILD-PLAN.md`.

## Platform Requirements

**Development:**
- Bun `>=1.3.0 <2.0.0` and Node `>=22 <25` are declared prerequisites in `package.json`.
- Native dependency installation requires the platform toolchain needed by Electron native modules such as `better-sqlite3` and `node-pty`, both declared in `package.json`.
- Rust is required when rebuilding `native/constitution-fs/`; packaged builds consume the binary placed under `resources/bundled-constitution-fs` by scripts referenced from `package.json` and `electron-builder.yml`.
- Electron end-to-end validation uses the shared application lifecycle and platform browser dependencies configured in `playwright.config.ts`.

**Production:**
- macOS artifacts are DMG and ZIP, Windows artifacts are NSIS and ZIP, and Linux artifacts are AppImage, deb, and rpm as configured in `electron-builder.yml`.
- Production desktop packages carry Bun, Wayland Core, the constitution helper, OfficeCLI, selected skills/workflows, voice assets, WhatsApp bridge assets, and Signal runtime through `extraResources` in `electron-builder.yml`.
- The standalone server is containerized by `Dockerfile`, listens through the WebUI server under `src/process/webserver/`, and persists state below `/data` in the container.
- The current cloud packaging is present but does not satisfy the release-ready cloud/pro checklist documented in `docs/desktop-overhaul-source/CLOUD-PRO.md`.
- Desktop/Core compatibility and the packaged Core baseline are recorded in `docs/desktop-overhaul-source/CORE-INTEGRATION-MATRIX.md`.

---

*Stack analysis: 2026-07-19*
