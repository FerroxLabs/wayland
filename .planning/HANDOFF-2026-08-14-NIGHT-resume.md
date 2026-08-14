# Handoff — 2026-08-14 night. START HERE.

**`packet/wl-integration` @ `e47873196`. 21 commits this session, ALL PUSHED to `ferrox`.
0 unpushed. Nothing tagged.**

Unit suite **17,629 passed / 0 failed** (17,778 total, 149 skipped). `tsc --noEmit` clean.
Build in `out/` is from **18:41** and matches HEAD.

**[V]** = established by executing it. Everything else says plainly what it is.

Supersedes the EVE and PM handoffs before it.

---

## 0. IN FLIGHT — full e2e run

Started against the **18:41** build, HEAD `e47873196`. Log:
`<scratchpad>/e2e-full.log`. Takes ~1.4h. This is the first honest post-fix
number; every earlier total was measured against a stale build.

Baseline to beat: **137 failures / 832** [V, 14:36 run].

---

## 1. What the three verification agents found

All three landed. **One claim was wrong in its diagnosis, two "defects" were stale
tests, and the biggest find was worse than reported.**

| Claim | Verdict |
|---|---|
| team-import CTAs disabled | **REAL — and it blocked ALL imports.** Cool-off was innocent |
| cron delete leaks | **STALE TEST.** Archive keeps the run's chat by contract |
| deleted assistant still listed | **STALE TEST.** Delete *is* a non-destructive archive |
| `webui.start` port 0 | **REAL** but latent — no shipping path passes 0 |
| a11y `button-name` on guid-home | **REAL regression.** 2 unnamed buttons |

**Do not paste agent diffs verbatim.** Two were wrong where it mattered:
- The a11y agent said `t` was already in scope in `ComposerAddMenu`. It is not — line 67
  belongs to `ComposerAddMenuPanel` (57-256); the button is in `ComposerAddMenu` (257+).
  Its diff would not have compiled. [V]
- The cron agent's "delete works" was right, but only proved for the *scheduled card*.

---

## 2. What landed — 7 commits since the last handoff

`a6e36b845` **teams: built-in specialists in the import catalog (SHIP BLOCKER)** ·
`2dee11a00` a11y button names · `a170b97b1` webui bound port ·
`4af4a7abe` archive-semantics assertions · `0323478fa` two e2e rewrites ·
`2c6737a50` assistant section-order test · `e47873196` **teams: imported roster ids**

### The ship blocker, in plain terms
`makeSpecialistCatalog` read only `ExtensionRegistry`, but the waylandteams
specialists stopped being extensions and now ship as native built-ins under
`builtin-`. So **every import — including a file this same app exported — reported
its own roster as missing and hard-disabled both CTAs, leaving Cancel as the only
exit.** A user could not import any team at all. [V: probe dumped the modal state and
the catalog it reads]

`e47873196` is the same bug one layer down: import wrote `ext-${id}` for every roster
member, so even once unblocked, imported native specialists resolved to no persona.
Found by pulling the thread, not by a spec — no test asserts it yet.

---

## 3. Verification done [all V]

- Unit suite **17,629 / 0** on final merged state, run BEFORE each commit.
- `tests/e2e/specs/assistant-settings-crud.e2e.ts` — **14 passed, 0 failed** (was 2 failed).
- team-import trusted + sandbox + robustness — **12 passed, 0 failed** (was 4 failed).
- `teams-library-load`, `quiet-money-smoke` (both rewritten) — **4 passed**.
- `webui-protocol` — 5 passed.
- **a11y gate run 5×: 5/5 green.** It was 1-pass-in-6 before, so one green run proves
  nothing here — always repeat this one.

### A trap that cost real time
The `sort order` test failed and looked like my regression. It was **pre-existing**:
restoring the pre-change spec and re-running showed it failing there too. Do not
attribute a failure without running the old version.

---

## 4. Still open, in order

1. **The full e2e run** (§0) — read the number, do not estimate it.
2. **Nano's npm package** — NOT ours, see §6.
3. `tests/**` is never typechecked (`tsconfig.json` `include` is `src/**`) and CI runs
   exactly ONE e2e spec (`pr-checks.yml:845`). **This is the root cause of the whole
   class**: 13 stale tab ids, two dead sider assertions, a testid that exists nowhere,
   and counts of 24/5/19 against a live 60/7/53 all survived because nothing ran them.
   Fixing individual specs treats symptoms.
4. The a11y gate's readiness wait is `body.textContent.length > 50`, which the
   pre-composer frame already satisfies — it scans before the composer mounts and
   under-reports. Flaky in the safe direction, but it hid this bug.

**Deliberately NOT doing** (decided, with reasons — do not re-open):
- **Nano error-table i18n.** `localeKeyParity` compares only renderer locale bundles;
  the table is a generated const in `src/common/types/`, so the gate **cannot fire on
  it** [V]. Zero consumers, 48 of 59 kinds collapse to `-32603`.
- **`model_auth` auto-retry.** REFUTED [V] — `canRetryPrompt` ignores `acpErr.retryable`
  and needs a `TRANSIENT_DETAIL` match no auth string produces. Pinned by test.

---

## 5. Harness traps (all learned the hard way)

- **The Playwright fixture launches the COMPILED `out/` bundle** — `electron.launch({
  args: ['.'] })`, no build step [V]. `tests/` edits are live; **`src/` edits are
  invisible until `bun run package`**. Check `out/main/index.js` mtime before believing
  any e2e result about a `src/` change.
- **The teams/conversation UI is TABBED.** Setting `location.hash` routes without
  activating the tab, so you inspect an empty pane. Drive real clicks.
- **Inbound `session/update` frames are NOT logged.** Working and broken runs both show
  zero. The DB is the honest instrument.
- **Long runs need `nohup … &`**, not the tracked-background wrapper — it SIGTERM'd the
  e2e suite twice, once at 815/832.
- **`rtk` mangles output.** It broke `wc -l` (reported 1 unpushed when in sync), ate the
  mode column from `ls -l`, and choked on a `grep -E` alternation. Use `/usr/bin/…`.
- **Run the FULL suite before committing, not after.**

---

## 6. Blocked on other people

**Nano's RC cannot launch through Desktop.** `waylandnano@0.1.0-rc.0` ships its binary
`-rw-r--r--` and relies on a `postinstall` chmod that **bun deliberately does not run**;
`bun x` has no opt-in flag [V]. Control: plain `npx` works, exit 0 [V]. Their fix is one
line — ship the binary 0755. npm's `latest` also still points at the older alpha.
Write-up: `.planning/HANDOFF-TO-NANO-2026-08-14-npm-rc-blockers.md`.

Our side is correct and works the moment they republish (`29099ca48`).

---

## 7. Standing constraints (unchanged)

No merge, tag, release or PR without Sean — `build-and-release.yml` fires on **any** tag.
Branch pushes to `ferrox` are fine and are being done. Never touch `~/dev/wayland/app`.
gh writes must be **FerroxLabs** (it drifts to TradeCanyon). No AI signatures in commits
or PRs. No backticks in gh/wl comment bodies. **Never commit
`constitutionFsAuthority.generated.ts`** — and never `git add -A src` / `git add -u src`.
Never weaken the security shell. **Never relax, skip or delete an existing test to make
something pass** — updating a mock to match a module's real API is fidelity, not
relaxation; changing an assertion to a corrected value is fine when the change is the
deliberate product decision. Never run against Sean's real profile —
`WAYLAND_DEV_PROFILE` is IGNORED when packaged and a `HOME` override does NOT isolate
Electron on macOS. Read-only agents may run in parallel; **all WRITES stay serial**.

**Uncommitted by design:** `AGENTS.md` (hook-modified) and
`constitutionFsAuthority.generated.ts`.
