# Changelog

All notable changes to the Wayland Electron app are documented in this file. Format follows [Keep a Changelog](https://keepachangelog.com/). Versions track the `v0.1.x-wayland-*` tag series on FerroxLabs/wayland.

## [Unreleased]

## [0.11.5] - 2026-06-28

### Highlights

- **Local models connect with zero setup.** Ollama (Local) and other self-hosted models now run with no API key at all — the engine recognizes loopback and private-network endpoints and connects cleanly, and the desktop connect form drops the key field for local providers entirely. No more "OpenAI API key is required" when you're running a model that lives entirely on your own machine (#398, wayland-core keyless self-hosted support).

### Wayland Core engine

- Bundled engine updated to **v0.12.15**. Keyless self-hosted endpoints are now first-class: when no API key is set and the endpoint is local (loopback, 0.0.0.0, `*.local`, private RFC1918, or Tailscale-CGNAT), the engine connects with a benign placeholder instead of failing — so local Ollama and other OpenAI-compatible local servers work out of the box. Public endpoints still require a key, as they should.

### Fixed

- **Ollama (Local) connects keyless.** The Browse provider tile for Ollama (Local) no longer demands an API key — the key field is hidden and Connect works with nothing entered, matching how local models actually run.
- **Cloud credential form padding.** The AWS Bedrock / Vertex / Azure credential form in the Browse modal now has proper inset and spacing instead of sitting flush against the window edges.

## [0.11.4] - 2026-06-28

### Highlights

- **Greatly improved chat streaming.** A ground-up rework of how responses stream and render: a real-time JSON progress stream drives a smooth, live activity view — an inline "orbit" indicator that animates while the assistant works and settles when it's done, a unified step-by-step timeline with plain-English labels for every backend, live reasoning summaries in the thinking block, and a per-message action toolbar that appears the moment a turn completes. Chat finally feels alive, legible, and fast (#337, #318, #288, and the observability rework series).
- **Real tool-use on Windows — safely sandboxed.** Wayland now runs real shell commands and tools on Windows inside a locked-down AppContainer sandbox — so the assistant doesn't just talk, it does the work, even on a clean non-developer machine. Live-verified on Windows. (wayland-core v0.12.14)
- **Your local models just work with tools.** Wayland detects tool support up front and transparently retries without tools for any backend that rejects them — so Ollama and llama.cpp models answer instead of erroring.

### Wayland Core engine

- Bundled engine updated to **v0.12.14**. Windows AppContainer shell tools now work end to end: absent developer-cache paths are skipped when applying the sandbox filesystem grant (no more hard-fail before the command runs), and the sandbox reaps its full job tree before draining output so commands return promptly instead of timing out (wayland-core #99, #100).
- Local models that don't support function calling now just work: Wayland detects tool support up front (an Ollama capability probe) and, for any backend that still rejects a tools request, automatically retries without tools and remembers the result — so Ollama and llama.cpp models answer instead of erroring (#389).
- Billing errors are classified more accurately, so a transient or unrelated provider error is no longer reported as "out of credit" (#329).
- Tighter control over which environment variables and secrets reach sandboxed subprocesses, with a fail-closed sandbox toggle (#325–#327).
- xAI / Grok sign-in uses a single, engine-preferred OAuth refresher so Grok sessions stay authenticated without token races (#390, #391).

### Chat streaming & live activity (headline)

- Responses now stream over a real-time JSON progress channel and render through a reworked live activity view, so chat updates feel immediate and smooth (#337).
- An inline "orbit" indicator animates while the assistant is working and settles to a static state when the turn is done — a single, calm signal of what's happening (replaces the old flashing/duplicated indicators).
- A unified, step-by-step activity timeline projects every backend's events into clean, human-readable labels, so you can follow exactly what the assistant is doing regardless of which model or tool is in play.
- Reasoning models show a short, live summary of what they're working through as the heading of the thinking block, updated turn by turn (#318).
- A per-message action toolbar (copy, retry, and more) appears the moment a turn completes — consolidated into one clean row.
- The turn timer is anchored to the turn's real start, so elapsed time stays accurate even when you switch chats mid-response (#288).

### Models & providers

- The model picker shows a curated, accurate catalog for each connected provider, sourced live, and the Codex, Grok, and OpenCode pickers populate correctly instead of flashing "no models" (#374).
- Assistants now run on Wayland Core by default rather than defaulting to a specific cloud model (#380).
- Grok "Sign in with X" now bridges into the engine so Grok chats stop returning 403 after sign-in (#379).

### Assistants & workspace

- Each assistant shows a grid of suggested starting prompts so you can launch into a task in one click (#375).
- Assistant send, model selection, and team multi-model setup were tightened end to end so the assistant you pick is the one that responds.

### Reliability & fixes

- Model-picker catalog, assistant surface, and workflow-launcher model selection hardened against empty or "no models" states.

## [0.11.3] - 2026-06-24

### Wayland Core engine

- Bundled engine updated to v0.12.8: adds the Sakana AI (Fugu) provider and carries forward the full v0.12.7 fix batch — corrected context-window sizing (#255), Windows Bash reliability (#257), Windows MCP and path fixes (#262, #263, #267), an OpenAI image-generation model fix (#265), ChatGPT-subscription auth import (#293), and Core↔Flux routing improvements.

### Models & providers

- Fixed a routing bug where valid keys for OpenAI-compatible providers (Sakana, OpenRouter, and similar) were sent to api.openai.com and rejected — they now route to each provider's own endpoint, so connected keys work (the v2 registry bridge tag is resolved at spawn).
- Added Sakana AI as a first-class provider, with its Fugu models and brand logo.
- ChatGPT-subscription, MiniMax, and DashScope now pull their model lists live from each provider instead of a hardcoded catalog, so you see the current lineup.
- ChatGPT-subscription chats route correctly through the engine's native ChatGPT provider and are selectable without being bounced to Settings (#243).
- Local Ollama models now appear in the model picker and initialize without a key (#294, #268).
- A Claude Code chat with no model pinned now defaults to Opus (the Claude Opus default) instead of Sonnet.
- Models without tool support now show a clear, friendly message instead of a raw provider 404.

### Memory

- Your global Wayland Memory is injected into chat context, so the assistant can recall what you have saved (#256).

### Reliability & fixes

- Approval prompts are processed before the turn proceeds, and non-info approval requests are logged clearly (#264).
- File-preview crashes are contained so they no longer break the surrounding chat (#253).
- Back-after-error navigation and Windows npm resolution fixed (#254, #261).
- WSL-installed CLIs are detected on Windows (#258).
- MCP OAuth sign-in gained a timeout and a cancel (#242).
- Onboarding persona styling, workspace/history git-noise filtering, and Doctor per-server diagnostics refined (#249, #251, #274).
- Flux Voice speech-to-text has its own config block with provider-scoped error handling.
- Build and typecheck given more heap headroom (#260).

### Observability

- The inline observability panel is simplified to a lightweight processing indicator for this release while a redesigned activity view is in progress.

## [0.11.2] - 2026-06-22

### Wayland Core engine

- Bundled engine updated to v0.12.6: lower token spend on long sessions, ChatGPT-subscription model filtering so you only see models you can use, a MiniMax entry in the cost catalog, and FluxRouter spend caps (#174, #61, #158, #240).

### Models & providers

- MiniMax now routes through the engine's native MiniMax provider (Anthropic wire) instead of falling back to the OpenAI path, so MiniMax models work correctly (#135).
- Pasting a Google `AQ.` key or an OpenAI service-account / admin key is now recognized on the spot, and GitHub Models keys (`ghp_` / `github_pat_`) are recognized too (#224).

### Projects

- The New-Project AI wizard surfaces the real provider error when a draft can't be generated, instead of a generic failure (#221).
- Project chat transcripts show subtle date/time and gap markers so long conversations are easier to scan (#59).
- Pin frequently-used files to a favorites section in the project Files panel (#142).

### Migrate from another tool

- New "Migrate" settings pane imports your provider keys and MCP servers from Hermes and OpenClaw in a guided scan → preview → import flow (secrets never leave the host).

### Mission Control

- Pop Mission Control out into its own dedicated window (#157).

### Headless & reliability

- The Project AI wizard now generates drafts from a headless/remote WebUI session over an authenticated host-side route, instead of hanging (#234).
- The spawned engine now inherits `LD_LIBRARY_PATH`, fixing headless startup on ARM64 Linux where the engine needs it to resolve its OpenSSL dependency (#233).

## [0.11.1] - 2026-06-21

### Wayland Core engine

- Bundled engine updated to v0.12.5, fixing a critical bug where every chat reply errored (`finish_reason: error`, 0 tokens) on every model and provider on Windows, and correcting the Gemini egress allowlist (#200, #223).

### Models & providers

- Teams: a Claude member no longer reverts to "Flux Fast" after the first message, and a Gemini member's model now routes to its Gemini provider instead of OpenRouter (#207).
- A remote/WebUI session can now add a local OpenAI-compatible endpoint (#71).
- Wayland Core workflows bind to the selected provider instead of blocking prompts with "No model selected" (#198).
- Teams no longer fail to start with "No CLI path" on Wayland Core backends (#204).

### Channels, voice & import

- Obsidian import opens a folder picker and shows its results, and memory import now reads native Claude Code project memory (#133, #165).

### Onboarding

- "Get a free Gemini key" opens the browser, and the Gemini onboarding door points to a Google AI Studio key (#202).

### Reliability & fixes

- Installer resolves bun from `~/.bun/bin` so headless setup and systemd work (#201).
- Windows uninstaller reaps orphaned processes left behind on close/uninstall (#139).
- The GUI-spawned engine now inherits `WAYLAND_BASH_SHELL` (#197).
- `wayland_search_skills` returns metadata instead of full skill bodies, fixing a Claude Code 25k-token Read overflow (#199).

### Internal

- Added `scripts/stage-wcore-bump.mjs` to stage bundled-engine version bumps from the signed release checksums (#222).

## [0.11.0] - 2026-06-19

### Models & providers

- Redesigned provider picker: real brand logos, a bring-your-own-endpoint section up front, and full engine catalog coverage (104 providers).
- Engine-native providers (xAI/Grok, Perplexity, OpenRouter, Groq, DeepSeek, Cerebras, NVIDIA, and more) now route natively instead of being forced through the OpenAI path (#177).
- Sign in with Grok: xAI is spawned as the native `--provider xai`.
- Friendly model names everywhere — the chat header and send box show "Claude Opus 4.8", not a raw model id.
- Real brand logos in the connected-providers list (no more letter monograms).
- Claude model picker fixed end to end (#184): it populates from the live agent, holds your selection, and actually switches the running model — pick Opus and it runs on Opus.
- Fresh Flux connect defaults to Flux Auto instead of a local Ollama model.
- Your model pick is kept while the provider list loads or is transiently filtered.
- MiniMax inference uses the international host (#135); WCore/Gemini picks resolve via the registry bridge (#167, #168).
- Unusable local vision/VLM models are hidden from the Ollama catalog.

### Wayland Core engine

- In-app engine updater for Wayland Core; this build bundles engine 0.12.3.
- Egress firewall is now a user choice in the engine Security settings.
- Engine-update archive extraction hardened against tag injection.

### Channels, voice & import

- Flux Voice added as a speech-to-text provider, with actionable error messages.
- Test & Enable added to Twilio SMS settings (#185).
- Shared 3-step, type-aware import modal wired into Assistants and Workflows.

### Reliability & fixes

- Transient provider HTTP faults are retried automatically.
- ACP: a FIFO queue for pending slots, and mid-turn follow-up messages are queued instead of erroring.
- Updater: no more false "Update available" when only IJFW needs attention; IJFW reports healthy for directory/symlink installs (#178, #179).
- Headless/remote: file-key JWT secret is decrypted so WebSocket verification matches (#155), a headless Flux key registers as flux-router, a remote WebUI can resolve the chat-start model, the WebSocket reconnect storm on auth expiry is fixed, a fresh chat auto-picks a recommended model on cold start, and the installer ensures `libasound2` so the bundled engine starts on a fresh box.
- Skills import hardened: recursive mkdir, builtin-shadowing guard, and frontmatter validation.
- Standalone mode wires the missing project/team/skills bridge inits (#76).
- Assigned chats are hidden from global recents (#77); macOS detection improved (#97).
- Mobile WebUI: the Assistants filter rail stacks (#153) and library header actions wrap (#154).
- App data is removed on Windows uninstall (#138); the Effort submenu is opaque so it no longer overlaps the model list.

### IJFW v0.6.3 - system service + first-boot install (Wave 1)

- New `src/process/services/ijfwSystemService.ts` replaces the previous
  `ijfwAutoInstallService`. Detects a local IJFW install at
  `~/.ijfw/mcp-server` (lstat-safe - handles symlinks), falls back to a PATH
  probe for CLI-only installs, resolves the latest `@ijfw/install` version
  via `npm view` (cached for 24 h, semver-validated), and either installs on
  first boot (`installing` → `installed_current`) or stages an upgrade into
  `~/.ijfw/mcp-server.pending` (`upgrading` → `installed_pending_activation`).
- `applyPendingUpgrade()` activates a staged upgrade on the next boot:
  ownership check (refuses symlinks, world-writable trees, or non-uid roots
  on POSIX), MCP-client drain, EBUSY-retried staged swap (current →
  `.prev`, pending → current), full JSON-RPC envelope spawn-test against
  the new install, and rollback to `.prev` on failure.
- Wired into `src/index.ts` after the auto-updater, gated by the same
  `isCiRuntime` / `WAYLAND_E2E_TEST` / `WAYLAND_DISABLE_IJFW=1` env vars.
  `applyPendingUpgrade()` runs immediately; `bootstrap()` is deferred 5 s
  so first-paint is never blocked by an `npm view` round-trip.
- Two independent opt-out paths short-circuit `bootstrap()` before any
  spawn: `IJFW_AUTO_INSTALL=never` (env) and `ijfw.skipSetup=true`
  (ConfigStorage setting; Wave 6 will ship the Settings toggle).
- New `ipcBridge.ijfw.onStatusChanged` emitter with the
  `IjfwLifecycleStatus` union (`not_installed` | `installing` | `upgrading`
  | `installed_current` | `installed_pending_activation` | `install_failed`)
  carrying optional `version` / `reason` / `errorReason` / `stderr` /
  `offline` fields. Wave 2 wires a UI surface; Wave 1 emits-only.
- Trust boundary: Decision 1a - we trust npm's OIDC publish chain rather
  than verifying an on-the-wire fingerprint at the client. The trust
  decision lives at publish time, not at install time.

### Constitution wiring (`feat/constitution-wiring`)

- Wire the user Constitution (`~/.wayland/CONSTITUTION.md`) into every chat-send
  path across all backends. Composed at send time via a single `composePrompt()`
  helper (`src/process/services/constitution/composePrompt.ts`) so the
  Constitution is prepended, in a fixed order, to every backend's system prompt:
  - ACP backends (Claude Code, Codex, Qwen, Kimi, OpenCode, Gemini CLI) via
    `agentUtils` + `AcpAgentManager`.
  - Gemini in-process backend via `GeminiAgentManager`.
  - wcore subprocess via `WCoreManager` (`init_history` system-rules channel).
  - Team role prompts (leaders + teammates) via `buildRolePrompt`.
- Optional per-specialist overlay at `~/.wayland/specialists/<assistantId>.md`,
  opt-in by file existence - prepended after the Constitution, before the
  backend's base prompt. `assistantId` is restricted to `[A-Za-z0-9_-]` to
  prevent path traversal.
- Anthropic prompt caching: the full system prefix is wrapped in a single
  `cache_control: { type: 'ephemeral' }` block (`OpenAI2AnthropicConverter` +
  defensive `AnthropicRotatingClient.createMessage`). The system prefix bills
  at the cached rate (~0.1x base) from the second turn onward. OpenAI
  auto-caches at >=1,024 tokens; Gemini uses implicit `systemInstruction`
  caching - no extra wiring needed for those.
- The composed prefix is byte-identical turn-to-turn (no per-turn variables),
  which is what unlocks the provider prompt-cache discount.
- Settings -> Constitution: a token counter under the editor with
  adherence-ceiling warnings - muted under 2K tokens, yellow at 2K-3K
  (suggests splitting into specialist overlays), red at 3K+.
- Fresh installs with no Constitution file behave exactly as before - every
  injection site falls back to its original prompt when the composer returns
  an empty string.
- Tests: 18 unit tests (composer, bridge overlay loading incl. path-traversal,
  ACP system-prompt composition) plus a Playwright-Electron e2e spec
  (clean boot, Settings page render, `constitution:readWithOverlay` IPC
  roundtrip). A cross-audit pass verified 10/10 wiring invariants.
- Cross-CLI sync (writing the Constitution into `~/.claude/CLAUDE.md`,
  `~/.codex/AGENTS.md`, etc.) is intentionally out of scope for this change.

## [0.1.2] - unreleased

Audit-hardening release. Closes 80 of 81 findings from the W1–W4 multi-wave security audit plus the post-W4 production-audit Phase 1 follow-up. Tag candidate: `v0.1.2-wayland-base`.

Baseline: `v0.1.2-wayland-safety` (a74cb443a). 82 commits.

### Security - Critical (W1)

- C1: IPC bridge allowlist - block arbitrary method dispatch from the renderer; restrict to a vetted main-process API surface.
- C2: `wayland-asset://` protocol containment - real-path resolution against an allowlisted root set; rejects traversal and symlink escape.
- C3: `webui-direct-*` IPC family gated behind native dialog confirmation and rate limit (later extended in Phase 1 to cover `change-username` and `generate-qr-token`).
- C4: Electron 37.10.3 → 41.6.0 (18-CVE batch).
- C5: `node-forge` removed in favor of native `crypto`; remaining transitive pin overridden to ^1.4.0 to close 4 high-severity CVEs.
- C6: BrowserWindow hardening - explicit `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false` on main window (later extended in Phase 1 to ambient and WeChat windows).

### Security - High (W2)

- H1: Linux installer no longer ships `--no-sandbox`; runs as a non-root user.
- H2: `srcDoc` iframe sandbox tightened - dropped `allow-same-origin` from preview iframes (later extended in Phase 1 to ExtensionSettings iframes: `allow-scripts allow-same-origin` → `allow-scripts`).
- H3: DOMPurify wrapper applied at every raw-HTML React sink (later tightened in Phase 1 to `Omit` `USE_PROFILES` at the type level so callers cannot regress the policy).
- H4: CSP `unsafe-inline` removed in production; remaining inline scripts gated by nonce.
- H5: `/api/auth/refresh` bounded with a sliding-window expiry plus token-family revocation on replay.
- H6 + H7 + H17: dependency bumps - `axios >= 1.16`, `@xmldom/xmldom >= 0.8.13`, `ws >= 8.20.1`.
- H8: cherry-pick of upstream PR #2784 hardening across 3 sites.
- H9: ACP bootstrapping gated until `initAgent` resolves - eliminates resume duplication.
- H10: Gemini abort preserves history; ACP `stop` contract locked.
- H11: `uncaughtException` exits with logging; `unhandledRejection` is logged.
- H12: `Sentry.init` guarded on DSN presence; renderer init errors surfaced.
- H13: React error boundaries at the renderer root and on the chat surface (later refined in Phase 1 to dev-gate error message text in production builds).
- H14: bundled Bun runtime version pinned and verified by SHA-256.
- H15: sidebar brand + tagline routed through i18n.
- H16: Forge footer taglines ported to 7 non-English locales.

### Security - Medium (W3)

- M1 + M20: bcryptjs concurrency cap; QR-login i18n.
- M2 + M3: credential and token leaks to `electron-log` stopped.
- M4: remote CORS allowlist gated behind `WAYLAND_ALLOWED_ORIGINS`.
- M5: `WebviewHost` runs with `contextIsolation: true` and `sandbox: true`.
- M6 + M7: `readFileBuffer` size cap; HTML inliner path containment.
- M8: deep-link parameters expose an explicit `decoded` field.
- M9: native `SkillManager` disabled - `AcpSkillManager` is canonical.
- M10: workspace snapshots honor `workDir`.
- M11: HubInstaller integrity verification enabled; skill names sanitized.
- M12: ACP YOLO-mode `setSessionMode` no longer fatal.
- M13: `AgentRegistry` surfaces remote-agent load errors instead of swallowing them.
- M14: single shared exit handler; test listener cleanup.
- M15: silent `.catch(() => {})` blocks across the renderer replaced with explicit logging.
- M16: state-file writes are atomic (temp + rename).
- M17: pre-import cleanup modules and per-step timeouts in `before-quit`.
- M18: `ForkTask.kill()` awaits child termination.
- M19: login page raw HTML form controls replaced with Arco components.
- M21: `bcryptjs` 2.4.3 → 3.0.3; deprecated `@types/bcryptjs` dropped.
- M22: vendored `pptx2json` to replace the abandoned npm dep (858364569; later converted CJS → ESM in Phase 1 at a4b196a73 to unblock production build).
- M23: `officeparser` 5.2.2 → 7.0.2 (zero consumers - structural close).
- M24: split `jws` override collapsed to a single `^4.0.1`.
- M25: prefer prebuilt native modules; `7zip-bin` patch documented.

### Security - Low (W4)

- L4 + L7 + L8: webserver hardening - `getPublicIP`, zxcvbn password strength, persistent token blacklist.
- L5: `shellBridge` Windows terminal command injection closed.
- L6: hardcoded `cookie-parser` secret dropped.
- L9: CSRF wired into `uploadFileViaHttp`; `/api/upload` exemption removed (later patched in Phase 1 to restore the cookie-parser secret and switch upload to form-body transport).
- L10: zod-backed input validation on login, refresh, and change-password.
- L11: Sentry `beforeSend` scrubs PII (later extended in Phase 1 to apply the same scrub in renderer Sentry init).
- L12: dead `petConfirmManager` wiring dropped from `IpcAgentEventEmitter`.
- L13: stale pet/ambient comment references replaced.
- L14 + L15 + L16: boot and teardown failure ergonomics.
- L17 + L20: auto-updater and agent-load failures surfaced in Settings UI.
- L19: `WebSocketManager` buffer/handler race fixed.
- L21: `disposeAllTeamSessions` uses `Promise.allSettled`.
- L23: dead login background-circle JSX + CSS removed.
- L24: hardcoded `#ff6b35` replaced with `var(--brand)`.
- L25: Titlebar `SidebarIcon` comment anchored on Lucide.
- L26 + L27 + L28: 8-locale i18n sweep.
- L29 + L32: `LoginPage` CSS modularized; local brand var introduced.
- L31: Lucide TESTID stamping flipped from per-icon map to universal.
- L33: stopped invoking Node's experimental `localStorage` getter in test infra.
- L34 + L35 + L36: dependency bumps - `@sentry/electron`, MCP SDK 1.20 → 1.29, Anthropic SDK 0.71 → 0.96, esbuild.
- L37: audit verification paper trail (`test(e2e): security audit runtime verification spec` at 951a26903).

### Production-audit Phase 1 follow-up

Caught after W4 by a fresh pass against the shipped branch. All P0/P1 items closed pre-tag.

- CSRF: `cookie-parser` secret restored; upload switched to form-body transport.
- `webui-direct-change-username` and `webui-direct-generate-qr-token` brought under the C3 confirmation + rate-limit gate.
- H2 extended to ExtensionSettings iframes (`allow-scripts allow-same-origin` → `allow-scripts`).
- M22: vendored pptx2json converted CJS → ESM (a4b196a73) - unblocks production build.
- C1: `storage.buildStorage` wire keys registered in the IPC allowlist (missing namespaces fixed).
- `scrubPii` applied in renderer Sentry init (PII leak prevention).
- `atomicWrite`: tmp file cleanup on rename failure.
- `sanitize.ts`: `USE_PROFILES` omitted at the type level.
- BrowserWindow hardening extended to ambient + WeChat windows.
- `ErrorBoundary` dev-gated in production; allowlist anchored to an 8-hex match; markdown links emit `rel="noopener"`; README `bun run dev` corrected to `bun start`.

### Deferred to 0.1.3

Locked deferrals - not blockers for v0.1.2 tag.

- L1: i18next 23 → 26 migration.
- `uk-UA` `bugReportModule` locale gap.
- M27: deeper supply-chain review of `get-ripgrep`.
- `engine/AGENTS.md` branding (file is IJFW-managed).
- Cross-platform installer verification on native Windows and Linux hosts.
