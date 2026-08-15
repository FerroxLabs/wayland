# Handoff — ship verification sweep

**Start here.** `packet/wl-integration` @ `f8675b27d`. Suite **17,568 / 0**, `tsc --noEmit` clean.
**24 commits unpushed. Nothing tagged.** PR #954 merged.

Goal: get to a full push. Code is done; **verification is what is missing.** Everything below is
either a verification task or a known defect, not new feature work.

**[V]** = verified by execution this session. Everything else says plainly what it is.

---

## 1. The four things that gate the push

### 1.1 🔴 Live-verify AS A USER — never done for any of this work

The standing rule is a full user sweep before publishing, and none of this session's work has had
one. Everything was verified at the component level (functions driven directly, output fed to real
binaries). **The app itself was never opened.**

Run against a scratch profile — **never Sean's real profile, and never set `WAYLAND_MULTI_INSTANCE`.**
Recipe: `.planning/` → `cdp-live-verify-recipe-desktop`, or `WAYLAND_DEV_PROFILE` + a cloned
`Wayland-Dev-2`.

1. **OpenClaw Flux chip, end to end.** Settings → Agents → OpenClaw card → the chip must be
   CLICKABLE (it is now `fluxCompat: 'setup'`) → modal opens → confirm → badge goes routed. Then
   **Remove** → confirm the user's config is restored. This is the single biggest untested path:
   the connector writes a file the user owns.
2. **Classic/Cockpit chooser** — one-time prompt on an onboarded profile, and the layout step in
   first-run onboarding.
3. **Cron leak** — drive a `[CRON_PROPOSE]` turn and watch the bubble DURING streaming. The whole
   point of the fix is that the raw markup vanishes live, not on reload. ⚠️ See §3.1: it can
   legitimately no-op on a fast turn.
4. **Wayland Nano** — see §2.

### 1.2 🔴 Full Playwright e2e has NEVER completed green

135 specs. Killed mid-run last session; pre-kill failures in `features/conversations/acp/` are
**unclassified**. Not run since.

⚠️ **`bun run test` does NOT run Playwright** — separate runner. A change can be 17,568-green in
vitest and still break e2e.
⚠️ **Never leave an e2e run unattended** — it opens real Electron windows on Sean's screen and looks
like the live app misbehaving. It did exactly that.
⚠️ e2e runs single-worker (singleton app instance).

### 1.3 🔴 Nothing packaged or verified as an artifact

Dev-mode green is not the gate. Use `bun run package` (**never raw `electron-vite build`**), then
verify the PACKAGED app.

### 1.4 The follow-up defect packet (4 items, none individually blocking)

- 🔴 **HIGH — debounce race in `persistStrippedTurnText`** (`MessageMiddleware.ts`). Root-caused
  [V]: `flushAllBufferedStreamTexts()` looks synchronous but each iteration calls
  `addOrUpdateMessage` → `sync('accumulate', …)`, which schedules a **2000 ms** timer. Only an
  `'insert'` forces an immediate flush, and the only insert is the propose card's `addMessage` —
  which is **fire-and-forget** (`void`, and `flush()` early-returns if one is in flight). So on a
  fast turn the row may not exist when the strip runs → silent no-op, raw markup persists. A path
  that strips WITHOUT inserting a card has no forcing flush at all — deterministic failure.
  **Fix:** an awaitable drain (`flush()` needs a loop). Shared queue, every backend — needs a real
  concurrency test. **Pre-existing** (written for Concierge before this session); cron just hits it
  far more often.
- 🟡 **Dead Remove button.** `handleRemoveOpenClaw` has no try/catch (unlike `handleSetupOpenClaw`,
  which returns typed `ok:false`), `removeOpenClaw` throws on unparseable config, and
  `FluxSetupModal` has **no `catch` anywhere** — only `try/finally`. Corrupt config → Remove does
  nothing visible, forever. **Pre-existing across all four connectors** — `handleRemoveCodex` and
  `handleRemoveKimi` are identical. Fix once across the family.
- 🟡 **Voice auto-read speaks the raw markup.** `useAutoReadResponses` ignores `content_replace`, so
  with auto-read on the `[CRON_PROPOSE]` block is spoken and the correction is never re-read.
- 🟡 **Misleading blocker message.** The connector creates a config with no `gateway.mode`, so
  `describeGatewayStartBlocker` then reports "damaged/clobbered config" about a file we just wrote.

---

## 2. Wayland Nano — built and ACP-proven, NOT user-tested

**Built this session [V]:** `~/dev/wayland-nano` @ `40aaf8d`, rustup auto-selected the pinned
**1.95.0**, `cargo build --release` clean in 1m15s, 0 errors. Binary 10.5 MB,
sha256 `9905c05343be81617c6e03d142701bfcf1368c2a8183dd47dd4d4adbffc0d6f5`.

**Installed to `~/.local/bin/wayland-nano`, NOT `/usr/local/bin`** — deliberate. The handoff says
`sudo install …`, but `~/.local/bin` is **first** on the login-shell PATH (which is what
`AgentRegistry` reads) and needs no sudo. Verified resolvable in a real login shell [V].

**Smoke checks, all matching the handoff [V]:** `--version` → `wayland-nano 0.1.0`; bare run prints
usage and **exits 2**; `acp-host` present.

**Real ACP handshake [V]** — drove `initialize` over stdio against `wayland-nano acp-host` (exactly
what the preset spawns) and got back `agentInfo: wayland-nano 0.1.0`, `protocolVersion: 1`,
`loadSession: true`, extensions `_wayland/session/list` + `session/steer`.

### What to verify in the app (from `docs/MAC-HANDOFF.md`)

1. `wayland-nano --version` in a fresh terminal
2. Agent picker lists **Wayland Nano**; selecting it **starts a session**
3. A simple prompt streams a response (needs a Flux key in env or a connected Desktop provider)
4. A file-write request triggers a permission prompt; Allow-once writes
5. Cancel mid-turn leaves the session alive
6. Quit + relaunch → session/load resumes history

### ⚠️ Two traps for the Nano test

- **`promptCapabilities` is TEXT-ONLY** [V]: `image: false`, `embeddedContext: false`. Matches the
  deferred `F-P2B-1 view_image`. Do not chase image input as a bug.
- **Detection precedence is the known failure mode.** `AgentRegistry.createWNanoAgent()` returns a
  **stub** (`available: true`, no `cliPath`, no launch spec). The code carries a comment about a past
  bug where that stub beat a real PATH copy, leaving the agent unlaunchable. Now that a real binary
  is on PATH, **step 2 above is the load-bearing check** — "listed" is not "starts".

**Nano is otherwise already integrated:** `feature/wayland-nano` was already an ancestor of this
branch (its tip WAS our merge-base; we are 366 ahead). wnano is first-class in `AgentRegistry`,
`AcpAgentManager` (spawns `wayland-nano acp-host`), `acpTypes`, and i18n across all 12 locales.

### 🟡 The nano error table is present but UNWIRED

`nanoErrorCodes.ts` + `nano-error-codes.json` (57 kinds, incl. `review_parse_failed`) landed via
PR #954. **Nothing imports them** — verified with a control (27 files mention `wnano`, 0 import the
table). Wiring is a real packet, not an afternoon: `title`/`hint` are **hardcoded English** in
generator output, so rendering them directly ships untranslated strings past `localeKeyParity`,
which demands all 11 locales for new keys. Decide: i18n 57×2 strings, or deliberately show English.

---

## 3. What WAS verified this session — do not redo

- **OpenClaw gateway refusal reproduced live** [V] on a clean Ubuntu droplet: `openclaw gateway
--port 18789` on an un-onboarded box exits **78** with `Missing config. Run 'openclaw setup'`.
- **The connector's config is accepted by the real `openclaw` binary** [V]: `models list` showed
  `flux/flux-auto … default`, and the gateway started. `baseUrl` casing (NOT `baseURL` like
  opencode), provider shape, and the primary-model write are all correct against the real product.
- **Setup→remove round-trips byte-identically** [V] on a config shaped like Sean's own (he HAS a
  personal `models.providers.flux` pointing at `127.0.0.1:7878`). After setup his `flux/local-a`
  survived beside ours; after removal only his remained, default restored, gateway still starting.
- **Hermes install verified with a negative control** [V]: with `[acp]` → `Hermes ACP check OK`;
  without → `ACP dependencies not installed`.
- **Scoped `HERMES_HOME` still works on Hermes 0.19.0** [V] — redirects the config path and reads our
  Flux config. The routing proven at v0.14.0 has not drifted.
- Droplet **destroyed and verified gone**; only the four production `flux-pool-r2` workers remain.

---

## 4. Method traps that cost real time

- ⚠️ **`rtk` mangles git output.** Its `git diff` rewrote 111 KB into 27 KB and **dropped content**
  (zero `diff --git` headers). Its `grep`/`wc -l` also lie — a targeted grep MISSED a test file and
  the full suite caught it. **Use `rtk proxy git …` for anything that must be complete, and
  cross-check counts with `python3`.**
- ⚠️ **`hooks.ts` contains literal NUL bytes**, so git classifies it **BINARY**. Its changes are
  invisible in `git diff` and in any PR review. Review that file from disk, not the diff.
- ⚠️ **FREEZE THE TARGET BEFORE AUDITING.** I handed auditors a `/tmp` diff then kept editing;
  two of one leg's CRITICALs were already fixed on disk and three claims were false positives.
  Hand auditors a **commit SHA**.
- ⚠️ **Auditor agreement is not evidence.** Twice the scariest finding was false, both failing the
  same way — reasoning from NAMES not code (`acpConversation`/`geminiConversation`/`codexConversation`
  are all **aliases of one emitter**; hermes routing lives in `task/hermesConfig.ts`, not
  `connectors/`). Verify every critical yourself — the same panels also caught a path that would
  have overwritten the USER'S OWN PROMPT in the DB.
- ⚠️ A finding that is "pre-existing across all N siblings" changes the **disposition**, not the
  truth. Check siblings before rating severity.
- ⚠️ The `projectConfigLease` "SYMLINK ALIASES" test is a **flake under full-suite parallel load** —
  passes isolated and on re-run. Not a regression.

---

## 5. Standing constraints (unchanged)

No merge, tag, release or PR without Sean — `build-and-release.yml` fires on **any** tag. Never touch
`~/dev/wayland/app`. gh writes must be **FerroxLabs** (it drifts to TradeCanyon). No AI signatures in
commits or PRs. No backticks in gh/wl comment bodies. **Never commit
`src/process/services/constitution/constitutionFsAuthority.generated.ts`** — and never
`git add -A src` / `git add -u src`. Never weaken the security shell. **Never relax, skip or delete an
existing test to make something pass.** Never run multiple agents in one worktree. Never touch the
four `flux-pool-r2` droplets, `flux-router-lb`, `flux-redis`, or the `flux-router` registry.

**Uncommitted by design:** `AGENTS.md` (hook-modified) and `constitutionFsAuthority.generated.ts`
(never commit — note its pinned sha256 HAS moved in the tree; do not let it ride along by accident).
