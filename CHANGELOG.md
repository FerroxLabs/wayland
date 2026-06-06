# Changelog

All notable changes to the Wayland Electron app are documented in this file. Format follows [Keep a Changelog](https://keepachangelog.com/). Versions track the `v0.1.x-wayland-*` tag series on FerroxLabs/wayland.

## [Unreleased]

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
