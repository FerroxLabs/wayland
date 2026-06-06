# Wayland Desktop - ROADMAP

First authoritative roadmap for the Wayland Desktop app (this repo). Mirrors the
`roadmap-v2-locked` pattern from the engine, applied here to the app's own
release chain. Five milestones from current state through ~v0.6.0.

This doc is for the **app** repo only (`~/dev/wayland/app`,
FerroxLabs/wayland). The engine has its own roadmap in
`~/dev/wayland/engine/docs/specs/roadmap-v2.md`; see the "Out of scope" section
at the bottom for the boundary.

---

## Status

- **Date:** 2026-05-17 (updated post-audit)
- **Current package.json version:** `0.3.1` (wayland-native; abandoned upstream
  AionUi 1.9.x chain in v0.2.0)
- **Latest mainline tag:** `v0.3.1-wayland-base` (points to `main`)
- **Latest feature-branch tag:** `v0.3.0-wayland-channels-tier2` (granular
  Phase 2 history on `feat/channels-phase2`)
- **`main` HEAD:** `v0.3.1-wayland-base` - closes 14 cross-audit findings on
  top of the v0.3.0 Phase 2 squash-merge; further v0.3.2 commit cleans up
  3 codex re-audit residuals (channelBridge allowlist, ChannelsIndex status
  flags, Matrix whoami fail-fast, ROADMAP detail polish)
- **Repo:** FerroxLabs/wayland

Tag chain to date: `v0.1.0-wayland-base`, `v0.1.1-wayland-base`, `v0.1.2-wayland-safety`
(yanked), `v0.1.3-wayland-base`, `v0.2.0-wayland-channels-tier1` (branch),
`v0.2.0-wayland-base` (main), `v0.3.0-wayland-channels-tier2` (branch),
`v0.3.0-wayland-base` (main). Branches preserved for bisection.

---

## What just shipped (v0.2.0-channels-tier1)

The squash-merge to `main` at `f7df052d2` bundled 68 commits across three
parallel branches that converged on 2026-05-17:

- **Channels Phase 0** - `WebhookReceiver`, capability flags on `BasePlugin`,
  Electron `safeStorage` for credentials, OpenClaw secrets lift, per-plugin
  streaming mode in `ActionExecutor` (the B1 fix), tabbed Tier 1/2/3 channel
  list UI. Foundation for everything that follows.
- **Channels Phase 1 - Tier 1 platforms** - Discord (discord.js 14, Gateway),
  Slack (`@slack/bolt` 4, Events API + Socket Mode), SMS via Twilio (webhook +
  rotate-token IPC), WhatsApp via subprocess bridge (Baileys default,
  whatsapp-web.js alternate, Meta Cloud API). +54 tests; per-commit tsc clean.
- **Settings redesign W2/W3** - auto-detect for 24+ providers, sync foundation,
  model nicknames, Storage page, real DingTalk/WeChat/WeCom forms, theme
  contrast fixes, 28 placeholder pages for the new IA.
- **TipTap Notion-style MD editor** (earlier in the chain at `39399a3c5`) -
  toolbar, bubble menu, slash menu, drag handles, auto-save, frontmatter
  preservation.

Pre-existing minor work in the same arc: Gemini retry-noise fix (`d0f2fad1d`),
ACP wrapper-version self-healing replay (`2af06c844` + `43c03ecf1`), DB
migrations v30-v32 for legacy `aionrs` → `wcore` rows + stale ACP state + Gemini
retry-noise tip purge.

---

## Companion docs

Every milestone below references locked details captured in the project memory.
Paths are real files; read them before extending any milestone scope.

- Channels Phase 0 foundation:
  `~/.claude/projects/-Users-seandonahoe-dev-wayland/memory/channels-phase0-shipped.md`
- Channels Phase 1 Tier 1:
  `~/.claude/projects/-Users-seandonahoe-dev-wayland/memory/channels-phase1-shipped.md`
- Channels full expansion plan (Phase 2-5 source-of-truth):
  `~/.claude/projects/-Users-seandonahoe-dev-wayland/memory/channels-expansion-planned.md`
  → `~/dev/wayland/.blackboard/CHANNELS-EXPANSION-PLAN.md`
- Gemini A2A architecture target:
  `~/.claude/projects/-Users-seandonahoe-dev-wayland/memory/wayland-gemini-a2a-plan.md`
- Teams Library design (PAUSED awaiting content):
  `~/.claude/projects/-Users-seandonahoe-dev-wayland/memory/teams-library-design-paused.md`
- Settings redesign locked decisions:
  `~/.claude/projects/-Users-seandonahoe-dev-wayland/memory/settings-redesign-locked.md`
- TipTap editor shipped notes:
  `~/.claude/projects/-Users-seandonahoe-dev-wayland/memory/tiptap-md-editor-plan.md`
- Sub-agent dispatch methodology (relevant to every "parallel sub-agent" line
  item below):
  `~/.claude/projects/-Users-seandonahoe-dev-wayland/memory/methodology-17-subagent-bailout-pattern.md`

In-flight Wave A dispatch artifacts (M1 closeout):

- WhatsApp bridge bundling fix: see Wave A sub-agent A1's dispatch in
  `.blackboard/` (filename set at dispatch time)
- audit-credentials coverage: see Wave A sub-agent A2's dispatch
- This roadmap: Wave A sub-agent A3 (current artifact)

---

## Milestone overview

| ID | Tag | Theme | Status |
|----|-----|-------|--------|
| M1 | `v0.2.0-wayland-base` | Phase 1 channels closeout - packaged builds work | SHIPPED 2026-05-17 |
| M2 | `v0.3.0-wayland-base` | Phase 2 channels - Email + Matrix (+ Signal if scope) | SHIPPED 2026-05-17 (Signal deferred to M2.5) |
| M3 | `v0.4.0-wayland-base` | Gemini A2A migration + Teams Library Phase 1b/1c | PLANNED |
| M4 | `v0.5.0-wayland-base` | Phase 3 channels (tier-3) + packaging hardening | PLANNED |
| M5 | `v0.6.0-wayland-base` | Productization - sync, multi-device, plugin marketplace MVP | VISION |

No calendar dates. Dependencies and dispatch graph order, per the
`feedback-no-week-months-pacing` principle in project memory.

---

## M1 - v0.2.0-wayland-base - Phase 1 channels closeout

### Goal

Every Tier-1 channel that shipped in `v0.2.0-wayland-channels-tier1` works
identically in a packaged production build, not just dev. Cut the mainline
`v0.2.0-wayland-base` tag once that is verified.

### Scope

- **WhatsApp bridge production bundling fix.** The subprocess bridge in
  `src/process/channels/whatsapp-bridge/` is an ESM Node child process outside
  the main tsconfig. In dev it forks from source. In a packaged build the file
  layout and resolution differ; electron-builder needs explicit asar-unpack +
  the bridge needs to resolve its three backend modules (Baileys,
  whatsapp-web.js, Meta) at the packaged path. Without this fix WhatsApp ships
  broken in production. (Wave A sub-agent A1.)
- **audit-credentials.mjs coverage extension.** The current script asserts no
  plaintext leak for the Tier-0 channels. Extend to cover the four Phase 1
  credential schemas (Discord token, Slack bot+app+signing, Twilio
  account+auth+messaging, WhatsApp per-backend creds). The Phase 1 ship notes
  flagged this as not-yet-run because the dev tree has no live
  `wayland-config.txt`. M1 requires a fixture-based run so CI can guard the
  invariant. (Wave A sub-agent A2.)
- **`package.json` version bump + main `v0.2.0-wayland-base` tag.** Today the
  field reads `1.9.25` (legacy AionUi); the wayland-tag chain is what we
  actually ship under. Reconcile by bumping to `0.2.0` (or whatever scheme Sean
  locks) and tagging `main` HEAD after A1+A2 land green.
- **First authoritative ROADMAP.md** (this doc).
- **Release smoke for the new tag.** Per methodology #13 (CI ≠ release.yml in
  the engine roadmap), verify `gh release view v0.2.0-wayland-base` asset count
  matches the release matrix before declaring shipped. The app's release flow
  is electron-builder for macOS / Windows / Linux; smoke = each artifact opens
  + the four Tier 1 channels round-trip a test message.

### Dependencies

- None upstream. M1 is unblocking work the channels-tier1 squash created.
- Wave A1 + A2 + A3 (this doc) dispatched in parallel; A1 and A2 must merge
  before the M1 tag fires.

### Success criteria - STATUS at v0.3.1

- ✅ `tsc` 0 errors on the bundling-fix commit (verified post-merge).
- ✅ `bun run vitest run tests/unit/process/channels` shows 29 files / 234 tests
  pass in <1s - well above the post-Phase-1 155/155 baseline.
- ⚠️ audit-credentials script: extended to cover Phase 1+2 fields and
  documented via synthetic negative fixture; intentionally flags plaintext
  in the test fixture as designed.
- ❌ Packaged-build smoke (dist:mac/win/linux WhatsApp QR → echo flow) -
  NOT executed in the v0.2.0/0.3.x shipping window. Reserved for the next
  hand-run iteration. The bundling fix + path-resolution candidates ship
  the code paths needed; only the human smoke remains.
- ✅ `v0.2.0-wayland-base` + `v0.3.0-wayland-base` + `v0.3.1-wayland-base`
  tags pushed to FerroxLabs/wayland.

### Open questions / risks

- Bundling-fix scope is one CLI session's worth of `electron-builder.yml` +
  `unpackDir` work in the best case; in the worst case it forces a refactor of
  how the bridge resolves its backends (e.g., bundle backends into the bridge
  rather than dynamic import). Wave A1 will scope before estimating.
- The `package.json` version bump is technically a semver downgrade from
  `1.9.25`. electron-updater channels keyed on the legacy version need a one-off
  migration or pinning so existing installs see the new chain as an upgrade.
  Decision item for M1 before the tag.

---

## M2 - v0.3.0-wayland-base - Channels Phase 2 (Email + Matrix)

### Goal

Ship Phase 2 of the channels expansion plan: the top-leverage Tier-2 platforms
where Wayland is missing the largest reachable user base. Concretely: Email
(both AgentMail-hosted and self-host IMAP/SMTP) plus Matrix. Plus Signal if M1
freed enough scope.

### Scope

Per `CHANNELS-EXPANSION-PLAN.md` §4 Phase 2 + Phase 3 ordering:

- **Email × 2 channels.**
  - **AgentMail wrapper.** Net-new code; AgentMail provides hosted inbox APIs
    (free 3 inboxes / 3k msgs per month, paid $20/mo). One `EmailAgentMail`
    plugin with API-key credential + standard ConfigForm.
  - **IMAP/SMTP self-host.** Net-new; uses `imapflow` + `nodemailer`. Plugin
    handles INBOX polling on configurable interval + outbound via SMTP.
    Credentials: server + port + user + password (or app-password). Both must
    integrate with the per-plugin streaming mode introduced in Phase 0 - email
    is the canonical non-edit, buffered-only channel and is what `ActionExecutor`
    refactor was designed for.
- **Matrix.** Lift from OpenClaw `extensions/matrix/`
  (`channels-expansion-planned` memory confirms it's MIT and on the lift list).
  Uses `matrix-js-sdk`. Single-account, single-room model at v1; multi-room is
  v2. Webhook-less; long-poll sync via the SDK.
- **Signal (stretch).** Subprocess bridge pattern from WhatsApp, against
  `signal-cli` JSON-RPC daemon. Only included in M2 if Email + Matrix
  shipped under-budget and Sean greenlights extending the milestone. Otherwise
  bumps to M4.

### Dependencies

- M1 closed and tagged (we need the packaging story stable before adding three
  more plugins).
- Phase 0 `WebhookReceiver` + per-plugin streaming mode already in place (they
  shipped in v0.2.0-channels-tier1).
- For self-host IMAP/SMTP: a UX decision on whether to surface OAuth (Google,
  Microsoft) at this milestone or only basic-auth/app-password. OAuth flow needs
  the Phase 4 hosted-tunnel/OAuth-proxy infra which is M4 territory. Default
  for M2: basic-auth only; flag OAuth as "coming with M4".
- For Matrix: license scan per Phase 0 B5 before lifting.

### Success criteria - STATUS at v0.3.1

- ✅ Three new plugins registered in `ChannelManager`: `email-agentmail`,
  `email-imap`, `matrix` (verified at `core/ChannelManager.ts:64-68`).
- ✅ ConfigForms shipped: `EmailAgentMailConfigForm`, `EmailImapConfigForm`,
  `MatrixConfigForm` - full credential surfaces (Phase 2 commit
  `7569e6e62`).
- ✅ +70 tests vs M1 baseline (well above the +30 estimate): Phase 2 adds
  21 + 22 + 25 = 68 new tests across the three plugins, plus v0.3.1
  post-audit hardening adds 8 more (IMAP reconnect 3, Matrix audit 5).
- ❌ Packaged-build smoke not yet executed for the three new channels.
  Tracked into M1's deferred smoke window.
- ✅ audit-credentials covers the three new schemas (via
  `fieldClassification.ts` mirror + substring match for `apiKey`,
  `password`, `webhookSecret`).
- ✅ `v0.3.0-wayland-base` (+ v0.3.0-wayland-channels-tier2 granular) tags
  pushed; `v0.3.1-wayland-base` follow-up closes 14 cross-audit findings.

### Open questions / risks

- AgentMail's free-tier rate limits may bite during dogfooding; provision a
  paid sandbox before live-testing at scale.
- Matrix homeserver selection - default to matrix.org for first-run? Make the
  user provide one? `channels-expansion-planned` memory doesn't lock this;
  decide in dispatch.
- The Settings UI "Email (Coming soon)" placeholder from settings-redesign W2
  becomes real here; coordinate the UI swap so the placeholder doesn't ship in
  two releases simultaneously.

---

## M3 - v0.4.0-wayland-base - Gemini A2A migration + Teams Library Phase 1b/1c

### Goal

Eliminate the in-process `@office-ai/aioncli-core` dependency by routing Gemini
through Google's official `gemini` CLI via the A2A protocol - making Gemini a
symmetric backend with Claude (ACP) and Codex (codex-acp). In parallel, finish
the Teams Library page now that the assistant catalogue grows from 4 to 13
entries.

### Scope

- **Gemini A2A migration** per `wayland-gemini-a2a-plan` memory.
  - Step 1: verify A2A protocol maturity (read `@google/gemini-cli-a2a-server`
    README + `@a2a-js/sdk` types). Confirm stable protocol version,
    streaming format, tool-call permission flow, OAuth handoff.
  - Step 2: add `@google/gemini-cli@latest` as a regular dep (or bundle to
    `resources/` for zero-network first launch).
  - Step 3: build `GeminiA2aAgent` in `src/process/agent/gemini-a2a/` -
    structural clone of `AcpAgentV2.ts`.
  - Step 4: build `GeminiA2aAgentManager` in `src/process/task/` - structural
    clone of `AcpAgentManager.ts`. Reuse the `acpWrapperVersion` self-healing
    replay pattern (rename to `a2aWrapperVersion`).
  - Step 5: register `gemini` backend in `workerTaskManagerSingleton.ts`
    `agentFactory`. Old in-process path stays as deprecated for one release.
  - Step 6: live-test parity across model picker, tool calls, MCP, reasoning
    models, OAuth refresh, cancellation, resume.
  - Migration tag fires at this milestone. The **delete-old-code release**
    (rm `src/process/agent/gemini/`, drop `@office-ai/aioncli-core`, codemod
    the ~20 import sites) is M4 territory after a soak period.
- **Teams Library Phase 1b/1c** per `teams-library-design-paused` memory.
  - Gate: `wc -l ~/dev/waylandteams/contributes/assistants.json` shows ≥ 13
    entries (was 4 at pause). If still 4, Teams scope slips to M4.
  - Implement the `/teams` sidebar route + `teamPresets` contribution point
    + Connection Card pattern. v3 mockup at
    `~/dev/wayland/app/.planning/brainstorm/teams-library-mockup.html` is the
    visual spec. Build the v4 mockup against the full 13 entries first; ship
    code against v4.
  - First-class extension manifest schema for `teamPresets` so future
    third-party assistant bundles can register through the same path.

### Dependencies

- M2 closed (channels Phase 2 takes one full milestone of focus; we don't
  want to overlap with the Gemini migration's protocol verification phase).
- For Gemini A2A: `@google/gemini-cli` upstream stays at ≥ v0.42 with stable
  A2A. If Google reorganizes the package, scope slips to a "verify, defer"
  cycle.
- For Teams Library: the other CLI's `~/dev/waylandteams` repo must have ≥ 13
  assistant entries. This is an external dependency, not under app-CLI
  control.

### Success criteria

- Gemini conversations route through `GeminiA2aAgent` end-to-end. The
  in-process path remains compiled (for safety rollback) but unreachable.
- A side-by-side comparison transcript saved at `docs/audit/gemini-a2a-parity.md`
  showing the same prompts run through old and new paths produce equivalent
  output across at least: model picker, multi-turn tool call, MCP tool, reasoning
  model, cancellation mid-stream, OAuth-refresh-after-expiry, resume of an
  interrupted conversation.
- `/teams` route renders 13 assistant cards (or actual current count, ≥13)
  with `TEAM` vs `SOLO` chip differentiation, build-your-own CTA at the top,
  Lucide icons throughout, no hero treatment.
- `teamPresets` contribution point documented in
  `docs/contributing/extension-manifest.md`.
- Tag `v0.4.0-wayland-base` after both shipped + release matrix green.

### Open questions / risks

- A2A protocol may have rough edges Google hasn't documented; the verify step
  has to be honest about "this isn't ready yet" if it isn't. If A2A isn't
  production-stable, M3 ships Teams Library only and Gemini A2A bumps to M4.
- Wayland Gemini A2A plan estimates 4-7 days of focused engineering for the
  migration tag itself. The delete-old-code release (M4) is another half-day.
- 7.7 MB and ~3500 LOC of in-process Gemini code becomes deletable at M4 - but
  the actual delete is gated on a soak period (memory says "one release"). M4
  scope assumes M3 ships clean enough to soak.
- Teams Library is fully blocked on an external repo; if `waylandteams`
  doesn't progress, this milestone is half a milestone.

---

## M4 - v0.5.0-wayland-base - Channels Phase 3 (tier-3) + packaging hardening

### Goal

Ship the long tail of channel integrations (tier-3, mostly lift-and-adapt from
OpenClaw) and harden the packaging story for ongoing releases: signed installers
on all three platforms + auto-update flow + the `@office-ai/aioncli-core`
deletion that M3's Gemini A2A migration unblocked.

### Scope

- **Channels Phase 3 (tier-3) and Phase 5 lift-only adds** per
  `channels-expansion-planned` memory §B7. Codex's OpenClaw extension
  inventory pushed the roster to **33 channel detail entries**, of which ~25
  are lift-only. Phase 3 covers:
  - Net-new: Mastodon, Bluesky, Threema, BlueBubbles iMessage (4)
  - Lifted from OpenClaw extensions (each ~1 day): Mattermost, Google Chat,
    Nextcloud Talk, IRC, Nostr, Zalo, QQ, Twitch, Synology Chat, Xiaomi (10)
  - Reddit DMs (Gemini-flagged), Telegram Userbot, Viber (3)
  - Locked stub: X DMs (Premium $200/mo gate, ship as informational UI only)
- **Packaging hardening.**
  - macOS: Developer ID Application signature + notarization in CI; staple
    ticket; verify Gatekeeper opens with no prompt.
  - Windows: code-signing cert (org cert if available; EV signing for
    SmartScreen reputation if budget permits). Wire into electron-builder
    config.
  - Linux: AppImage + .deb signed via the existing project key; .AppImage
    update via electron-updater.
  - Auto-update: configure electron-updater for all three platforms against
    a single GitHub Releases channel. Background check on launch + manual
    "Check for updates" in the existing Settings → System page.
- **`@office-ai/aioncli-core` deletion.** M3 shipped the A2A migration tag
  with the old in-process Gemini path still compiled. After a one-release
  soak, M4 removes:
  - `src/process/agent/gemini/` (~3500 LOC)
  - `src/process/task/GeminiAgentManager.ts`
  - `@office-ai/aioncli-core` from `package.json`
  - Codemod ~20 import sites - most are `import { AuthType } from
    '@office-ai/aioncli-core'`. Replace with a local `AuthType` enum in
    `src/common/types/auth.ts`.
  - Bundle size verification confirms ~7.7 MB saved.

### Dependencies

- M3 closed, including a real soak period (at least one dot release in
  between, or measurable dogfooding logs showing zero Gemini regressions
  through the A2A path).
- Channels Phase 4 (hosted-tunnel + OAuth proxy) from
  `CHANNELS-EXPANSION-PLAN.md` §4 is a precondition for several Phase 3
  channels that need a stable public OAuth callback URL. Decision item: do
  Phase 4 in M2 (alongside Email's OAuth question) or pull it forward to M3
  or include in M4. Default in this roadmap: include Phase 4 in M4 ahead of
  Phase 3 plugin lifts.
- Code-signing certificates: Apple Developer Program enrolment + Windows
  cert procurement are ops items, not engineering. Start in M2 to land in
  time for M4.

### Success criteria

- All 33 channels visible in the Settings → Integrations tabs (Tier 1/2/3),
  with the X DMs entry showing a "Premium API required - $200/mo" gated
  state per memory.
- ≥ 28 of 33 actually round-trip a test message; the remaining ≤ 5 (X DMs
  + any that hit provider provisioning lead time) document the blocker in
  their ConfigForm.
- Packaged builds on all three platforms install with zero security prompts
  beyond the standard "first-run open from unknown developer" macOS dialog
  (which should NOT appear given notarization succeeded).
- Auto-update from `v0.4.0-wayland-base` → `v0.5.0-wayland-base` runs
  cleanly on at least one macOS test machine + one Windows + one Linux.
- `@office-ai/aioncli-core` no longer appears in `pnpm why` output.
  `du -sh node_modules` shows the expected ~7.7 MB reduction.
- `reasoning-token-bug` memory file can be closed.

### Open questions / risks

- Code-signing budget - EV Windows cert is ~$400/yr; do we pay for SmartScreen
  reputation or accept the warning on first run for new releases?
- Channels Phase 4 (hosted-tunnel + OAuth proxy) defaults to Cloudflare named
  tunnels per `CHANNELS-EXPANSION-PLAN.md` §4. If users push back on
  Cloudflare dependency, the OAuth UX for several Phase 3 channels regresses.
- The 33-channel roster is aspirational; some lift-only channels (Xiaomi,
  Zalo) may be regionally locked or require business verification we can't
  complete from outside-region. Honest M4 might ship 28 of 33 and document
  the rest as "available source-side, awaiting provider access".

---

## M5 - v0.6.0-wayland-base - Productization

### Goal

Cross the line from "powerful tool that requires hand-holding" to "product".
Three big bets: matured E2E sync across devices, a real multi-device pairing
flow, and a plugin/extension marketplace MVP that lets third parties ship
channels, assistant teams, and tools through the same surfaces Wayland uses
internally.

### Scope

This milestone is the most aspirational. Honest framing: the scope below is
the v1 direction, not a commitment. Some items may move to v0.7.

- **End-to-end sync, matured.** Settings sync (Beta) shipped in M0 era; this
  milestone takes it from Beta to default-on. Sync surface expands beyond
  settings to: conversations (opt-in), assistant teams, custom skills,
  installed extensions. E2EE per existing settings-redesign spec.
- **Multi-device pairing.** The Settings → Web UI page already has a paired
  devices section in the redesign mockup. M5 makes pairing first-class: QR
  pairing flow from desktop, paired-device activity log, per-device revoke,
  per-device named keys.
- **Plugin/extension marketplace MVP.** Wayland already has a `extensions/`
  layer (Phase 0 channels work formalized capability flags and contribution
  points). M5 ships:
  - A signed-manifest format for third-party extensions
  - A discovery surface (in-app browser) backed by a curated registry -
    initially a GitHub repo with a JSON index, not a hosted backend
  - Install/update/uninstall flow with permission prompts based on declared
    capabilities (read messages, send messages, access credentials, etc.)
  - Reference: the `extension-market` spec at
    `docs/specs/extension-market/` (existing scaffold in the repo).
- **Other productization items deferred from earlier milestones** (any items
  that didn't fit in M1-M4 land here or get explicitly cut).

### Dependencies

- M4 closed. Hardened packaging + auto-update are preconditions for shipping
  a marketplace (we have to be able to push security updates fast).
- Engine-side: the engine roadmap-v2 M3-M5 (smart memory layer, continuous
  learning, productization + multi-agent) provides the underlying primitives
  that the marketplace surfaces. App marketplace is a thin layer on engine
  capability; if engine roadmap is behind, app marketplace MVP narrows
  accordingly.
- A signed-manifest format requires deciding: are we signing with our own
  key (Wayland-as-CA), individual developer keys, or both? Decision needed
  before M5 plan dispatch.

### Success criteria

- A second Wayland install on a second device can pair via QR in under 60s
  and see settings + chosen-to-sync conversations within the next minute.
- The marketplace surface lists at least the channels Wayland ships natively
  (eating our own dog food) and accepts at least one external test
  extension contributed by Sean from a separate GitHub repo.
- Permission prompts for marketplace installs match the capability flag
  surface introduced in Phase 0 channels work.
- Auto-update remains green across the M5 cut.

### Open questions / risks

- This milestone is fuzzier than M1-M4 on purpose. Honest read: scope will
  contract as we get closer. The three bets are listed in priority order; if
  only one ships in M5, sync is the keeper.
- Marketplace registry hosting cost + abuse moderation are real ops
  questions, not engineering. The "GitHub repo + JSON index" first-cut sidesteps
  hosting; moderation goes to "Sean curates" until volume justifies more.
- Pairing flow security review (capabilities, key rotation, revocation
  semantics) is non-trivial and worth a dedicated audit pass before ship.

---

## Out of scope

Items explicitly NOT on this roadmap:

- **Engine work.** `~/dev/wayland/engine` (wayland-core, the Rust runtime)
  has its own roadmap at `docs/specs/roadmap-v2.md` in that repo (engine M1
  v0.3.0 shipped, M2 v0.3.1 shipped, M3 v0.4.0 shipped, M4 v0.5.0 shipped per
  memory's `v0.5.0-shipped` entry). Per `feedback-repo-boundary-app-only`:
  this CLI session works on `~/dev/wayland/app` only.
- **Engine memory substrate** (IJFW + dream cycle + skills prioritizer +
  embedder backends + sqlite-vec). Engine M3/M4 work; the app consumes via the
  wcore-protocol RPC surface, doesn't implement.
- **Engine permissions / ACL / token system.** Engine M1 (v0.3.0) work.
- **Skills lifecycle and learning loop.** Engine territory per
  `feedback-dont-overextend-locked-decisions` - IJFW substrate locks storage
  only; GEPA evolution and Honcho user modeling are peers, not subsets, and
  they live in the engine.
- **Wayland-Hermes, wayland-design, wayland-legacy, waylandllm, waylandskills,
  aion.** Abandoned per `feedback-wcore-scope-discipline`. Hermes-Agent
  remains reference-only.
- **`aionrs` brand work.** The rebrand chain (v0.1.0 → v0.1.3) closed that.
  No further aionrs touches.
- **Calendar dates.** Per `feedback-no-week-months-pacing`, milestone ordering
  is a dependency graph, not a Gantt chart. Each milestone ships when its
  success criteria pass.

---

## Maintenance protocol

- Update **Status** at the top whenever a milestone tag fires.
- Move milestones from VISION → PLANNED → IN FLIGHT → SHIPPED in the overview
  table.
- When a milestone ships, replace its body with a one-paragraph "What
  shipped" summary linking to the shipped-memory file
  (`~/.claude/projects/-Users-seandonahoe-dev-wayland/memory/<vX.Y.Z-shipped>.md`).
- Open questions that get answered move to either the next milestone's
  scope or to a "Decided" log at the bottom of this file (add the section
  when first needed).
- This file is owned by the orchestrator. Sub-agents don't touch it during
  execute-dispatches; they propose edits via the Wave dispatch handoff.

