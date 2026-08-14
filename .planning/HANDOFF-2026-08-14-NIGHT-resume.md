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

---

## 8. Full e2e result + cross-research (2026-08-14 late)

**85 failed / 535 passed / 180 skipped / 32 did not run** (832), build 18:41.
Baseline was 137. **"32 did not run" means 85 is not a clean floor** — Playwright
discards the worker after every failure, so a failure-heavy run stops short.

Four read-only agents cross-researched 46 of the 85. **~90% are STALE TESTS**, not
product defects. Verified verdicts:

| Lane | Fails | Real | Stale | Env |
|---|---|---|---|---|
| hub-backend-install | 10 | 0 | 10 | 0 |
| extension family | 8 | 0 | 8 | 0 |
| ACP feature suite | 11 | 0 | 11 | 0 |
| renderer/cron/misc | 17 | 3 | 13 | 1 |

### Fixed this stretch [all V by execution]
- **15 failures, one cause** — 4 specs clicked `team-card-builtin-cold-outbound`,
  which pagination (48-card window over 60 teams) never renders. Probe: 0 cards
  before search, 1 after. Fixed via the search box (`bfc6f2ad9`).
- **Group D REFUTED** (`96c866e92`). The claim "user who stops a turn mid
  permission-request can never type again" is FALSE. The Stop locator included
  `[aria-label*="stop" i]`, which matches the sider button **"Remote (stopped)"**.
  Probe proved it was the ONLY match: the click navigated to `#/settings/webui`,
  and the textarea assertion then found Arco's hidden measurement node. No
  confirmation card, no hidden wrapper. Use `.sendbox-stop-button`.

### Highest-value unfixed finding
`waitForAiReply` (`tests/e2e/helpers/conversation.ts:204-206`) returns the
**shadow-DOM stylesheet**, because `shadowRoot.textContent` concatenates the
injected `<style>`. Its `expect.poll(...).toBeTruthy()` is satisfied the instant
the shadow root exists, so it NEVER waits for reply text. This silently weakens
every ACP test — **fixing it will likely expose tests currently passing for the
wrong reason.** Read `.markdown-shadow-body` and gate on a minimum length.

### Other confirmed, unfixed
- **3 real defects, one cause**: `.guidContainer` intercepts pointer events on
  `/guid`, so with ~10 detected agents some agent pills are unclickable and
  dropdowns clip. Playwright names the container as interceptor.
- `hub-backend-install.e2e.ts` (10) tests an "Install from Market" modal **no
  route reaches**; its components are dead code kept green by unit tests that
  render them directly. Replacement (`AvailableToInstall`) has NO e2e coverage.
- ACP group A (5): `playwright.config.ts:6` caps at 60s; specs pass 120s to
  helpers. The six `test.setTimeout()` escape hatches sit **inside `beforeAll`**,
  where Playwright applies them to the hook only. Use
  `test.describe.configure({ timeout })` at describe scope.
- `isVisible({ timeout })` is a **no-op** (`@deprecated ... option is ignored`),
  so two tests stop the turn ~0s in and then assert partial text exists.

### Method note that keeps paying
Three agent claims were wrong where it mattered: a diff that would not compile
(`t` out of scope), a "shared root cause" that was five, and the Group D product
defect. **Verify every agent claim by execution before applying it.**
