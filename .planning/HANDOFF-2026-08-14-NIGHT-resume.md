# Handoff — 2026-08-14 night. START HERE.

**`packet/wl-integration` @ `94e2c8950`. 14 commits this session, ALL PUSHED to `ferrox`.
0 unpushed. Nothing tagged.**

Suite **17,774 total / 0 failed**. `tsc --noEmit` clean. Build in `out/` is from **17:07**
and matches HEAD.

**[V]** = established by executing it. Everything else says plainly what it is.

Supersedes `HANDOFF-2026-08-14-EVE-swarm.md` and the PM one before it.

---

## 0. IN FLIGHT RIGHT NOW — 3 background agents

Launched just before compaction, verifying the remaining product-defect candidates.
**Their results arrive as task notifications.** Do not re-run their work; wait for them.

| Agent | Verifying |
|---|---|
| verify-cta | team-import capability CTAs rendering `disabled` (4 specs) |
| verify-cron | cron delete surviving in `#/scheduled`; `webui.start` port 0; deleted assistant still listed |
| verify-a11y | `button-name` regression on guid-home |

Each was told the claim is UNPROVEN, given the harness traps, and required to quote real
output. **Three separate findings today were refuted by execution** — expect some of these
to be refuted too. That is a good outcome, not a wasted run.

---

## 1. ⚠️ THE TRAP THAT COST THE MOST TIME TODAY

**The Playwright fixture launches the COMPILED `out/` bundle** —
`electron.launch({ args: ['.'] })`, no build step [V].

- Changes to **`tests/`** (specs, helpers) take effect immediately.
- Changes to **`src/`** are INVISIBLE until `bun run package` runs.

I reported the 401 fix as "not working" purely because `out/main/index.js` was five hours
stale. Check its mtime before believing any e2e result about a `src/` change.

Also still true, all learned the hard way:
- **The conversation/teams UI is TABBED.** Setting `location.hash` changes the route
  WITHOUT activating the tab, so you inspect an empty pane. Drive real clicks.
- **Inbound `session/update` frames are NOT logged.** A working run and a broken run both
  show zero. The DB is the honest instrument.
- **Long runs need `nohup … &`**, not the tracked-background wrapper — it SIGTERM'd the
  e2e suite twice, once at 815/832.
- **`rtk` mangles output.** It swallowed the mode column from `ls -l` today, which was the
  exact column that mattered. Use `rtk proxy git …` and `/usr/bin/stat`.
- **Run the FULL suite before committing, not after.** A regression got in today because I
  committed on green targeted tests; the suite caught it one commit late.

---

## 2. What landed today — 14 commits

`29099ca48` npm pin made load-bearing · `0267ca86b` SDK budget-dispatch pinned ·
`5cb7b1a0d` OpenClaw config message · `7f9a8d07b` Flux Remove un-stranded ·
`f98b36979` two e2e helper bugs (30 specs) · `4a9c8531a` voice control-markup ·
`b4f41c257` settings-tab ids · `791f63d5e` **HIGH** write-queue drain ·
`50d9adb27` team ids · `7f9efdf6f` handoff · `5ab8eeacb` mock sync ·
`417048c72` **auth 401** · `1717278bc` **Ollama tool filtering** ·
`94e2c8950` auth-retry refutation guard.

Every fix was **mutation-verified**: revert → confirm RED → restore → confirm GREEN.

---

## 3. Where the e2e number actually stands

Baseline was **137 failures** out of 832 [V, full run 14:36].

**Fixed and verified:**
- auth: **16 → 0** [V, all four spec files re-run against a rebuilt app]
- `deleteConversation` helper: 15 specs (failed in *cleanup*, after their real assertions passed)
- settings-tab ids: 15 · team ids: 13

**Not yet re-measured as a whole.** A full e2e run takes ~1.4h. The next one should be
against the 17:07 build or later — and if any `src/` fix lands first, rebuild.

**Known remaining, already scoped:**
- ~14 product-defect candidates → 3 agents verifying now (§0)
- ~10 need real backends; will stay red on a machine without them
- 2 files need a REWRITE, not a rename:
  - `teams-library-load` — asserts `teams-action-bar`, a testid that exists nowhere in
    `src`; counts 24/5/19 against a live **60/7/53**; 48-item page window in the way
  - `quiet-money-smoke` — missing the `usr.launchAssistant` history seed. Its `ext-` ids
    are FINE (`stripIdPrefix` strips both prefixes [V]) — do not "fix" them

---

## 4. Still open, in order

1. **The 3 in-flight verifications** (§0). Fix only what survives verification.
2. **The two e2e rewrites** above.
3. **A full e2e re-run** to get an honest post-fix number.
4. **Nano's npm package** — NOT ours to fix, see §5.
5. `tests/**` is never typechecked (`tsconfig.json` `include` is `src/**`) and CI runs
   exactly ONE e2e spec (`pr-checks.yml:845`). That is how 13 stale tab ids and two
   permanently-dead sider assertions survived. Typechecking `tests/**` reports 2069
   errors, but ~1500 are mock-shape drift in `tests/unit`; the `tests/e2e` slice is small
   and real (7 × bad `Page` import, an `isOpaque` assertion against a non-existent
   Electron API, 5 × `.msg` read off types that lack it).

**Deliberately NOT doing** (decided, with reasons — do not re-open):
- **Nano error-table i18n.** The parity gate only compares renderer locale bundles; the
  table is a generated const in `src/common/types/`, so `localeKeyParity` **cannot fire on
  it** [V]. It also has ZERO consumers, 48 of 59 kinds collapse to the same `-32603`, and
  nothing verifies Nano even emits a `kind`. Confirm that before wiring anything.
- **`model_auth` auto-retry.** REFUTED [V] — `canRetryPrompt` ignores `acpErr.retryable`
  and requires a `TRANSIENT_DETAIL` match that no auth string produces. Pinned by test.

---

## 5. Blocked on other people

**Nano's RC cannot launch through Desktop.** `waylandnano@0.1.0-rc.0` ships its binary
`-rw-r--r--` and relies on a `postinstall` chmod that **bun deliberately does not run**;
`bun x` has no opt-in flag [V]. Control: plain `npx` works, exit 0 [V]. Their fix is one
line — ship the binary 0755 in the tarball. Also npm's `latest` still points at the older
alpha. Full write-up: `.planning/HANDOFF-TO-NANO-2026-08-14-npm-rc-blockers.md`.

Our side is correct and works the moment they republish (`29099ca48`).

---

## 6. Standing constraints (unchanged)

No merge, tag, release or PR without Sean — `build-and-release.yml` fires on **any** tag.
Branch pushes to `ferrox` are fine and are being done. Never touch `~/dev/wayland/app`.
gh writes must be **FerroxLabs** (it drifts to TradeCanyon). No AI signatures in commits or
PRs. No backticks in gh/wl comment bodies. **Never commit
`constitutionFsAuthority.generated.ts`** — and never `git add -A src` / `git add -u src`.
Never weaken the security shell. **Never relax, skip or delete an existing test to make
something pass** — updating a mock to match a module's new export is sync, not relaxation;
changing an assertion to a corrected value is fine when the change is the deliberate
product decision. Never run against Sean's real profile — `WAYLAND_DEV_PROFILE` is IGNORED
when packaged and a `HOME` override does NOT isolate Electron on macOS. Read-only agents
may run in parallel in this worktree; **all WRITES stay serial and by hand**.

**Uncommitted by design:** `AGENTS.md` (hook-modified) and
`constitutionFsAuthority.generated.ts`.
