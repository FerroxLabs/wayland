# Handoff — next session

**Start here.** `packet/wl-integration` @ `9fa2198de`. Suite **17,523 / 0** (vitest),
`tsc --noEmit` clean. **Not pushed, not tagged.**

**The plan to execute is `.planning/PLAN-2026-08-13-AGENT-INSTALLERS-AND-FLUX-FANOUT.md`.**
Read it before anything else. This file is state + what not to repeat.

⚠️ **The plan is v2, rewritten after a 4-leg cross-audit. It carries a BLOCKING decision for Sean in
its §0 (vendor install scripts vs the shipped `officecliInstaller.ts` policy). Do not dispatch
Waves B–E until that is answered.** Wave A and Wave 0 are unblocked.

⚠️ **Audit method lesson:** three of four legs agreed that Hermes had no Flux routing. All three were
wrong — they each looked only in `src/process/connectors/`. It is built and proven in
`src/process/task/hermesConfig.ts`. **Agreement between auditors is not evidence.**

**[V]** = verified by execution this session. Everything else says what it is.

---

## 1. What landed this session

| commit | what |
|---|---|
| `d75822bf6` | `[CRON_PROPOSE]` markup no longer leaks into the chat bubble. **Half-fix** — see §4 |
| `9fa2198de` | Classic/Cockpit chooser: onboarding step + one-time prompt for existing installs |

**Uncommitted in the tree** (all verified, ready to commit): the e2e fixture fix, the new
`shell-choice-prompt.e2e.ts`, the overlay close-order fix, two `data-testid` hooks.
`constitutionFsAuthority.generated.ts` is modified and **must stay unstaged, always**.

**Deleted (approved):** `feat/nav-streamline`, `feat/frictionless-issue-filing` — local and remote.
Both were closed-as-duplicate PRs (#595, #598). Recoverable: `refs/pull/595/head` = `0707e123…`,
`refs/pull/598/head` = `572d7113…`, both confirmed intact on the remote after deletion.

---

## 2. Corrections to earlier handoffs — do not re-inherit these

1. **`HANDOFF-2026-08-14-NEXT.md` §3.1 is VOID.** #118 and #464 were already merged
   (`886cb4bb2`). Their branches were duplicates. Merging them would have regressed the app.
2. **The agent installer is NOT "built and final".** Every K-05 box in `REQUIREMENTS.md`
   (INS-01…INS-05) is still `[ ]`, including *"proven on a clean VM per OS"*. The catalogue holds
   **2 of Sean's 7 target agents**. "npm subset" was sequencing, not a cap.
3. **"Flux fan-out = unbuilt, zero code" is WRONG** (and it is K-07, not K-06). `fluxCompat`
   exists per backend; connectors are built for codex, kimi and opencode, **and Hermes routing is
   built and proven** via a scoped `HERMES_HOME` (`task/hermesConfig.ts`) that never touches the
   user's real config. See the plan §2.2 — and adopt scoped-home as the default connector pattern.
4. **`stream_end` did not reproduce on mcpfold.** Both occurrences predate that binary
   (mtime 14:50:47 on 08-13). Trigger identified: the **last MCP server connecting during turn
   startup**, ~10ms before the failure, both times.

---

## 3. Verified this session [V]

- **Beat 3 CLOSED** end-to-end in one conversation on Core 0.13.0 mcpfold: opener → ToolSearch
  finds `tv_health_check` unaided → report (74 names, 0 NO DATA, bar 2026-08-12) → unprompted offer
  → accept → real cron row `cron_7068affc`, `0 8 * * 1-5`, enabled, next run 2026-08-14 08:00.
- **Agent install machinery works on a genuinely clean box** — fresh Ubuntu droplet, no node/npm.
  Bundled bun 1.3.14 (checksum-matched), both catalogued agents installed and launched. Droplet
  destroyed and verified gone.
- **Shell chooser verified live**: prompt appears, switches the shell, does not return after
  relaunch, and does not return with the localStorage marker cleared (isolating the durable flag).
  10/10 e2e green across `cockpit-shell` + `shell-choice-prompt`.

---

## 4. Open defects

- 🟡 **`[CRON_PROPOSE]` half-fixed.** `updateMessage` writes to the DB without broadcasting, so the
  stored row is clean but the raw block is still visible **during the streaming window**. For a live
  audience that is the half that matters. Completing it needs care: the code deliberately bypasses
  the message queue because `addOrUpdateMessage` appends deltas and would double the text.
- 🔴 **Full Playwright e2e never completed green.** I killed the run mid-flight (it was driving
  Electron windows on Sean's screen). Before the kill there were failures in
  `features/conversations/acp/` — **unclassified**: they need live agent backends, so they are
  plausibly environmental, but that is unproven. **Run the full 135 and classify before trusting it.**
- 🟡 **Default-model resolution**: a profile with no model resolves to `gemma3:4b` (Ollama) on the
  `gemini` backend, which then demands an OpenAI key. Reproduces in e2e temp profiles. Unverified
  whether `078514ef9` / `3b9bf0ac5` covered this path.
- ✅ **NOT a defect — do not "fix" it.** `CLAUDE_ACP_BRIDGE_VERSION = '0.44.0'` looks stale but
  `bridgeVersionResolver` fetches npm `latest` at connect time; the constant is only the offline
  fallback, and its header says that staleness class was deliberately eliminated. **Open question
  instead:** spawning a moving `latest` bridge is itself an unaddressed supply-chain risk.

---

## 5. Method notes that cost real time

- **`bun run test` does NOT run Playwright.** Separate runner. A change can be 17,523-green in
  vitest and still break e2e — that is exactly what happened: `seedCompletedOnboarding` seeds
  `{ onboardingCompleted: true }`, which is precisely the new shell prompt's trigger, so the modal
  mask would have swallowed clicks across many of the 135 specs.
- **Read our own source before searching the web.** Claude Code's ACP bridge
  (`@agentclientprotocol/claude-agent-acp`) was already wired here; searching npm for a guessed name
  produced a 404 and a wrong conclusion.
- **Verify the publisher before pinning any package.** See plan §3 — a name match is not provenance.
- **`Page.captureScreenshot` hangs forever behind an Arco modal mask** (both `fromSurface` values).
  `Runtime.evaluate` still works. Verify by DOM + DB.
- **The message list is virtualized** — `innerText` sees only the viewport. Use the DB.
- **Pick the chat scroller by geometry** (`x > 290`), not by "first scrollable element" — that is
  the sidebar.
- **`rtk` grep reported 0 matches for a string that was present.** Cross-check with `python3`.
- **Screenshot assets:** `user.displayName` auto-derives to the OS account name even on a fresh
  profile. `scripts/capture-shell-choice-shots.mjs` handles this and refuses profiles with chat
  history.
- **Never leave a background e2e run unattended** — it opens real Electron windows on Sean's screen
  and looks like a live app misbehaving. It did. Kill it before saying "nothing is running."

---

## 6. Infrastructure

- **DigitalOcean**: authenticated, Ferrox Labs, 15-droplet limit. **Never touch the four
  `flux-pool-r2` droplets** — production k8s workers for `flux-router-shadow` — nor `flux-router-lb`,
  `flux-redis`, or the `flux-router` registry.
- **SSH key** `~/.ssh/wayland_cloud_test` matches DO key `wayland-cloud-test` (id 57186000).
- ⚠️ **Forgotten resources Sean has NOT yet decided on**: droplet `wayland-mobile-test`
  (id 576870384, created 2026-06-11, `s-2vcpu-4gb`, **$24/mo, ~$48 spent, idle**) and an orphaned
  1 GiB volume `dc870f84-…` with no droplet attached. Both flagged, neither touched.
- No reserved IPs, no snapshots, no CDN, no App Platform apps — that side is clean.
- **Windows box** `seandesktop` + the `wlclean` account for clean-machine Windows tests.
  Do not touch `C:\wl-verify`.

---

## 7. Standing constraints (unchanged)

No merge, tag, release or PR without Sean — `build-and-release.yml` fires on **any** tag. Never
touch `~/dev/wayland/app`. gh writes must be **FerroxLabs**. No AI signatures in commits or PRs. No
backticks in gh/wl comment bodies. Never commit
`src/process/services/constitution/constitutionFsAuthority.generated.ts`, and never
`git add -A src` / `git add -u src`. Never weaken the security shell. **Never relax, skip or delete
an existing test to make something pass** — including `--ignore-scripts`, which is a security
control, not a convenience. **Hard NO on Claude Pro/Max subscription OAuth (ToS).** Never run
multiple agents in one worktree.
