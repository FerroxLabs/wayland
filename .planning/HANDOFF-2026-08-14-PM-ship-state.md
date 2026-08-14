# Handoff — 2026-08-14 PM, ship state

**Start here.** `packet/wl-integration` @ `1dfb78be7`. **75 unpushed, nothing tagged.**
Vitest **17,741 total / 0 failed** (17,593 passed, 148 skipped). `tsc --noEmit` clean.
Playwright **completed for the first time**: 832/832 — 480 passed, **137 failed**, 183 skipped,
32 did not run, 1.4h.

**[V]** = established by executing it. Everything else says plainly what it is.

Supersedes `HANDOFF-2026-08-14-SHIP-VERIFY.md` (this morning). That document's four gates are
all now either closed or reduced to a named remainder.

---

## 1. THE DECISION WAITING ON YOU — Nano's npm dist-tags

`waylandnano@0.1.0-rc.0` is published. **But npm's `latest` still points at `0.1.0-alpha.0`;
the release sits on `next`** [V, queried the registry]. So a bare `npx waylandnano` — or any
user doing `npm i -g waylandnano` — silently gets the OLDER alpha.

Desktop is currently hard-pinned to `waylandnano@0.1.0-rc.0` (`WNANO_NPM_VERSION`,
`acpTypes.ts`). That is safe and verified [V]: `npx -y waylandnano@0.1.0-rc.0 --version` →
`wayland-nano 0.1.0`, and `bridgeVersionResolver` (which rewrites pins to the registry's
latest, and would therefore have dragged us back to the alpha) is applied only to
claude/codex/codebuddy — wnano is not routed through it [V].

**Recommendation: keep the hard pin, AND ask Nano to fix the tag.** They are not alternatives.

- **Keep the pin** because it is reproducible and matches house style — `CODEX_ACP_BRIDGE_VERSION`,
  `CLAUDE_ACP_BRIDGE_VERSION`, `CODEBUDDY_ACP_BRIDGE_VERSION` are all hard pins bumped by a
  Desktop commit. Tracking `next` instead would hand every Desktop user whatever Nano published
  five minutes ago, unreviewed.
- **Ask Nano to promote it** because this is a publishing bug that hurts everyone, not just us:
  `npm dist-tag add waylandnano@0.1.0-rc.0 latest`. One command. Until then their own install
  instructions ship the alpha.

**Rejected: `waylandnano@next`.** A moving tag removes the per-release Desktop commit, which is
the only review gate between a bad Nano publish and every Desktop user. And `next` stops meaning
"the release" the moment 0.1.0 final ships.

### 1a. The pin is currently INERT — this is the follow-up work

Stated plainly because it is easy to assume otherwise from the commit: **the pin declares the
distribution, it does not launch from it.** Traced [V]: `AcpAgentManager` resolves a builtin's
executable as `cliPath` → `backendConfig.cliCommand`. `defaultCliPath` is consulted for
extension rows and custom-agent rows only. So a machine with no `wayland-nano` on PATH still
cannot start Nano from npm.

Making the fallback reach `defaultCliPath` touches a spawn path shared by **every** builtin
backend, so it was deliberately not slipped into the pin commit. It is small, and it wants its
own test. **That is the first thing to pick up.**

---

## 2. What landed today — 15 commits

### Ship blockers found and fixed

- 🔴 **`a41e6a550` — Wayland Core could not start at all.** The Desktop contract was re-pinned to
  Core 0.13.0 (minor 14) in `799fbf087`, but `DEFAULT_WCORE_VERSION` stayed at `v0.12.26`
  (minor 12). Every turn died at bootstrap with `contract_minor_mismatch`. Completed the bump:
  version pin, six checksums, the installer's own pin, and a v0.13.0 publisher-attestation
  policy. **The attestation was verified BEFORE the policy was written** [V] — `gh attestation
  verify` reports sourceDigest `8f9c6684`, github-hosted, and its signed statement lists exactly
  the seven asset digests staged. Engine downloads, verifies, and completes turns.
- 🔴 **`047ebaeef` — the OpenClaw connector deleted a default model the user had set.** Setup
  decided whether `agents.defaults.model.primary` was ours by comparing it to the literal string
  we write. Sean's own config points a personal `flux` provider at `flux/flux-auto`, so on the
  FIRST install his default was recorded as "there was none" and removal deleted it. The receipt,
  not the string, is what makes a value ours. The provider-NAME collision was already guarded for
  exactly this user; the identical collision on the model ref was not.
- 🔴 **`b214101f8` — a cron turn's spinner ran forever.** `cron_propose` is emitted from the
  turn-end path AFTER `finish` and names the turn, so the renderer counted it as output and
  re-armed `streamRunning`. Nothing else was coming. Live: "Working… 254s" minutes after
  `stream_end`; navigating away and back cleared it, proving the durable state was already right
  and only the mounted view was wrong.
- 🔴 **`a775f838b` — a keyless local provider could not run a turn.** Ollama/LM Studio/llama.cpp
  are OpenAI-compatible but take no key, so they hit `AuthType.USE_OPENAI` carrying nothing and
  the fork Gemini core threw `OpenAI API key is required` before opening a socket. The
  spawn-secret design is not wrong — `apiKey: undefined` deliberately means "no credential" so a
  stale key is never reused — but that holds for the transport, not for the client library in
  between. Fails closed: only a clearly-local base URL unlocks the placeholder.

### Nano

- `a59f8404d` + `ffefd0eb2` — PR #955 merged, error table at **59 kinds** [V].
- `1b132de62` — wnano was the only agent of nineteen with **no Flux chip**; it is `env`.
- `41dc9bfb1` — **budget ext notifications consumed.** Nano moved metering off `session/update`
  (where the SDK's zod schema rejected every frame with `-32602`) onto three `_wayland/session/*`
  ext notifications. Desktop had no `extNotification` arm at all. Wired all three, flattened
  params. Frame shape confirmed by capture, not by reading the contract [V]:
  `{"method":"_wayland/session/budget","params":{"limit":null,"microcents":0,"observed":null,
  "priced":false,"sessionId":"…","session_tokens":5958}}` with zero `sessionUpdate: 'budget'`
  frames remaining. **Honesty rule enforced in code**: `priced:false` renders `unpriced`, never
  `$0.000` — mutation-verified.
- `1dfb78be7` — the npm pin (see §1).

### Tests / docs

- `8659f7e48` — **24 e2e call sites navigated to a settings tab that does not exist.**
  `goToSettings(page, 'agent')`; the id is `'agents'`. Root cause: `tsconfig.json` `include` is
  `src/**` only, so the whole `tests/` tree is **never typechecked** — tsc over `tests/e2e`
  reports all of them as TS2345. **13 stale ids remain, deliberately unfixed** because each needs
  a run to confirm intent rather than a guess: `capabilities` ×7, `display` ×3, `gemini` ×2,
  `system` ×1.
- `d2fd881b3` — discharged the v0.13.0 tag tripwire exactly as the test instructed.
- `831fa3b42` — parked invisible-character sanitisation (decisions recorded, not started).
- `43a737490` / `bb5b812d0` / `11dcd92c0` — the Nano builder handoff, its correction, and the
  bundled-bun gotcha.

---

## 3. Open, in the order I would take them

1. **Wire the npm fallback** so §1's pin is load-bearing. Small, shared spawn path, wants a test.
2. **Live-confirm the budget ext notifications through the app.** Unit-verified and capture-
   verified, but never observed arriving in a running Desktop. One Nano turn with the app up.
3. **Classify the 137 e2e failures.** The `ext-*` / `agent-settings-detection` clusters (~16) are
   the known stale-tab ids. **Unclassified:** auth ×16 across four files, team ×17 across three,
   `conversation-full-cycle` ×10, `hub-backend-install` ×10.
4. **The four follow-up defects** from the morning handoff, still open: the HIGH debounce race in
   `persistStrippedTurnText`; the dead Remove button on a corrupt config (all four connectors);
   voice auto-read speaking raw markup; the misleading "damaged config" message.
5. **Error-table i18n decision** — 59 kinds × `title`+`hint` are hardcoded English and
   `localeKeyParity` demands all 11 locales. Either 118 translated strings or a deliberate
   English shipment. **Nobody owns this slot yet.**
6. **Ollama capability filtering.** Ollama publishes per-model `capabilities` and we read it
   nowhere [V]. Completion-only models (gemma3, smollm2) 400 on the first turn because Core
   always sends tools. Two of the five models on this machine were in that state until removed.

---

## 4. ⚠️ METHOD — read this before trusting any UI observation

**I reported two product bugs today that were my own harness.** Both times I skipped the same
check: prove the method finds a KNOWN POSITIVE before believing a negative.

- **The conversation view is TABBED.** Setting `location.hash` changes the route WITHOUT
  activating the tab, so the pane you inspect is a different, empty tab. This produced a
  confident "reopening a conversation loses all assistant history" report that was completely
  false — clicking the tab renders prompt and reply fine [V]. **Drive the tab, never the hash.**
- **Inbound `session/update` notifications are NOT logged.** A working run and a broken run both
  show zero of them. Reasoning from their absence is worthless; I did it anyway and concluded
  Nano was emitting no text when it was.
- The DB is the honest instrument. `~/Library/Application Support/<profile>/wayland/wayland.db`,
  table `messages` — if the row is there, the turn worked and the question is rendering.

Carried from this morning and still true: **`rtk` mangles git output** (use `rtk proxy git …`);
**`hooks.ts` contains literal NUL bytes so git treats it BINARY** and its changes are invisible
in any diff or PR review; **freeze the target before auditing** — hand auditors a SHA.

⚠️ **Long-running commands: use `nohup … &`, NOT the tracked-background wrapper.** The e2e suite
was SIGTERM'd twice by the background-task harness — once at 98/832, once at **815/832**. Run
detached and it completes.

---

## 5. Live-verified today, so it need not be redone

OpenClaw Flux chip end to end including Remove restoring the user's own config · Wayland Nano
picker → session → streaming reply → file-write permission → Allow once → file on disk · Classic
↔ Cockpit chooser round-trip · cron `[CRON_PROPOSE]` markup replaced live by the card · Core
0.13.0 completing turns · Ollama answering keyless over its OpenAI-compatible endpoint ·
`qwen2.5:7b` completing a real turn in the app · Claude Code spawning after the bundled-bun
prepare · packaged `.app` building, signing, and carrying engine sha `75e88660…`.

---

## 6. Standing constraints (unchanged)

No merge, tag, release or PR without Sean — `build-and-release.yml` fires on **any** tag. Never
touch `~/dev/wayland/app`. gh writes must be **FerroxLabs**. No AI signatures in commits or PRs.
No backticks in gh/wl comment bodies. **Never commit
`src/process/services/constitution/constitutionFsAuthority.generated.ts`** — and never
`git add -A src` / `git add -u src`. Never weaken the security shell. **Never relax, skip or
delete an existing test to make something pass.** Never run against Sean's real profile —
⚠️ `WAYLAND_DEV_PROFILE` is IGNORED when packaged (`shouldApplyDevProfileFallback` returns false),
and a `HOME` override does NOT isolate Electron on macOS; both were learned the hard way today.
Never run multiple agents in one worktree. Never touch the four `flux-pool-r2` droplets,
`flux-router-lb`, `flux-redis`, or the `flux-router` registry.

**Uncommitted by design:** `AGENTS.md` (hook-modified) and `constitutionFsAuthority.generated.ts`.
