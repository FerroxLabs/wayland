# Milestone F — authoritative state + build discipline

**This file is the single source of truth for F.** Read it before touching anything. If it disagrees
with `F-MILESTONE-PLAN.md`, this file wins (the plan is the original intent; this is what actually
happened).

**Deliberately NOT a new milestone.** The remaining work is already F-02/F-03; opening a Milestone G
for it would be the exact drift this file exists to prevent.

Work location `~/dev/wayland-worktrees/desktop-integration`, branch
`worktree-agent-desktop-integration`, PR #925 → `main`. Nothing merged. Nothing tagged.

---

## 1. Build discipline (the gates)

These are not suggestions. Every one of them exists because it was violated in this arc and cost real
time.

**G1 — Clean tree before and after every packet.** `git status --porcelain` must be empty. Known
generated churn: **`AGENTS.md`** frontmatter is rewritten by the IJFW hook on every session
(confidence score, timestamp, file counts). Revert it (`git checkout -- AGENTS.md`); never commit it
into this PR.

**G2 — One packet, one commit.** The commit message states the root cause, not the symptom. No
drive-by fixes; if you find something else, write it into section 4 instead of fixing it inline.

**G3 — Never let a formatter near a pinned artifact.** `bun run format` with no args rewrites the
whole repo. oxfmt reformatted `resources/modelsdev-snapshot.json` (SHA-256 + size pinned) from 1 line
to 103,798 and broke every packaged build — while tsc, 15,718 unit tests, and CI's own formatter all
approved it. Format ONLY the files in the packet, by explicit path, and re-run
`bun run verify:modelsdev-snapshot` after.

**G4 — Green unit tests are not the test.** The test is booting the PACKAGED artifact and using it as
a user. `bun run package` does NOT produce a launchable app; use `bun run dist:verify:mac`.

**G5 — A test that asserts the wrong contract is worse than no test.** Three separate times this arc a
green check encoded the bug: the CI docs-stub, `expect(brainInvoke).toHaveBeenCalledWith({verb:'state'})`
pinning a verb that could never succeed, and a lock-contention test asserting an `{ok:false}` shape the
bridge cannot produce. When a test covers a failure path, verify the failure shape is REAL.

**G6 — Isolate before you live-test.** Redirecting `HOME` alone does NOT isolate the profile —
Electron resolves userData independently of `$HOME` on macOS, and a run of the F-07 harness
consequently attached to Sean's real profile and rewrote a live config value. Use BOTH
`WAYLAND_E2E_USER_DATA_DIR` (profile) and a redirected `HOME` (`~/.ijfw`). `bun run smoke:ijfw` does
this correctly — copy its env block.

**G7 — State verification honestly.** If a check could not exercise the path (e.g. a Linux-only branch
verified on macOS), say so in the commit body. Do not let a passing local run imply coverage it does
not have.

**G8 — No merge, no tag, no release without Sean.** `build-and-release.yml` triggers on ANY tag
(`tags: ['*']`).

---

## 2. Done and verified

| packet                          | state    | evidence                                                                                                                                                                                          |
| ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F-01** required-checks bypass | **DONE** | `3844b2e1e`. Proven live on throwaway PRs #926/#927: docs-only → 4/4 required green; mixed + failing test → all 3 required RED; draft → RED not green-by-skip. Both PRs closed, branches deleted. |
| **F-07** IJFW Memory dead end   | **DONE** | 9 commits `b80ad8beb..d79558053`. Packaged smoke `bun run smoke:ijfw` OVERALL: PASS — one click recovers Memory with no restart, runtime row reaches **Live**, Test passes.                       |

F-01 is why CI can now be trusted at all. Before it, a green required check on this repo meant nothing.

## 3. Open packets, in execution order

### F-02 · CI-only unit failures (IN PROGRESS — thesis was wrong, corrected below)

**The "one ambient-state class" thesis did not survive contact with the shard logs.** Splitting the
failures by runner showed the real shape: **Windows 40 failing files, ubuntu 6, macOS 2.** It was
overwhelmingly a Windows problem, and the single largest cause was a real product bug this branch
introduced, not a test defect.

- **Windows durability — `0e980e4be` + `3b3918132`.** `f7dd56c86` ("fix(mcp): prevent split-brain
  mutations") added fsync-based durability that Windows cannot perform. `main` has no `fsyncSync` in
  `atomicWrite.ts` at all, so this branch introduced it. Proven empirically on the Windows box rather
  than reasoned about — `file O_RDONLY fsync → EPERM`, `file O_RDWR fsync → OK`,
  `dir fsync → EPERM`, `dir + '.' fsync → EPERM`. Consequence in the CI log:
  `[Storage] Failed to persist C:\Users\...\wayland-config.txt`, i.e. **config never persisted on
  Windows**. 286 of the log's error lines were this one bug.
  The first fix pass was incomplete and said so: it grepped the literal string `fsync` and missed every
  `await handle.sync()`, closing 9 sites but leaving 7 (EPERM fell 286 → 46). `3b3918132` enumerated
  both forms, found nine hand-rolled `syncDirectory` helpers, and routed all seven broken ones through
  `src/process/utils/durabilitySync.ts`. Five of them used the `path.join(dir, '.')` workaround that the
  probe proved never worked; two picked the right Windows fallback path and then opened it `'r'`.
- **`VerificationGate` was my own regression — `23f47688b`.** `f6c831883` swapped the gate's bare
  `process.env.CI` check for `shouldDisableIjfw()`, which also reads `GITHUB_ACTIONS`. The suite cleared
  `CI` and `WAYLAND_DISABLE_IJFW` by hand, so on GitHub Actions every gate call short-circuited to
  advisory. `ijfwGuard` now exports `IJFW_GUARD_ENV_VARS` + `clearIjfwGuardEnv()` so a test clears
  exactly what the guard reads and cannot drift again.
- **`constitutionFsTransaction` timed out, not failed — `23f47688b`.** Its real-helper case shells out
  to `cargo build` under the 10s default. Measured at 6s locally with a warm crates registry; a runner
  also downloads every crate, in a shard that already spends ~90s importing. Raised to 300s.
  Deliberately not skipped when the binary is absent.
- **`managedWorkspaceProvenance` depended on inode allocation — `5d801d1cb`.** Two cases asserted that
  recreating a directory changes its identity. Only true on APFS: measured `rm + mkdir` on ubuntu
  returning the SAME inode 3/3, APFS fresh 3/3. Now creates the successor while the original still
  exists and renames it in, which is distinct on every filesystem, and asserts the inode changed.
- **`wcoreStderrSurfacing` never waited — `2879f62c6`.** It flushed the microtask queue 100 times, which
  completes in microseconds, while `start()` awaits real fs/keystore work before `spawn()`. Each attempt
  now yields real wall-clock time via a timer captured before fake timers install.
- **`recoveryPointBuilder` errors were undiagnosable — `2879f62c6`.** It threw only verification CODES,
  discarding the path and reason each issue carries, reducing a real ubuntu failure to
  "SNAPSHOT_FILE_TYPE, SNAPSHOT_FILE_TYPE". Now includes code, path and reason so the next CI run names
  the offending entry. The ubuntu `SNAPSHOT_FILE_TYPE` cause itself is **still open**.
- **Still open on ubuntu:** `SNAPSHOT_FILE_TYPE` in `recoveryCapture`/`recoveryPointBuilder`, the
  `chmod ':memory:'` noise, "Services not registered", and the OfficeCLI runtime message.

Earlier notes below are kept for context; three fixes landed before this session (OfficeCLI
fail-closed, constitution git-history depth, key fixtures).

- **DONE, awaiting CI proof:** `wcore-profileStore` (27 of the ~38). `0859c11a5` — the suite mocked
  `homedir()` but never cleared `XDG_CONFIG_HOME`, which `profilePaths.platformConfigBase()` prefers on
  its Linux branch, so every profile was written to the runner's real
  `/home/runner/.config/wayland-core-profiles` and tests collided (`profile "work" already exists`,
  `EEXIST mkdir`). macOS never showed it — the darwin branch ignores XDG. **Verification is
  INCONCLUSIVE locally by construction; CI is the only proof.** Check it before assuming the rest of
  F-02 is the same class.
- **NEXT:** `recoveryCapture` + `recoveryPointBuilder`, both `SNAPSHOT_FILE_TYPE`.
  `recoveryManifest.ts:1129/1153` raises it when a snapshot inventory contains a symlink; bun installs
  create symlinks the macOS layout does not. `recoveryPointBuilder` is downstream — it expects
  "Recovery point already exists" and gets "Built recovery point failed verification", so one fix
  should take both. Make the capture tree an explicit fixture the test builds. **Do NOT relax the
  symlink assertion — it is a real integrity rule.**
- **THEN:** `constitutionFsTransaction`, `wcoreStderrSurfacing`, `installSignalCli`.
- Also seen in the logs, unexplained and possibly benign: `[BetterSqlite3Driver] Failed to chmod DB
file to 0o600: ENOENT chmod ':memory:'` (9×) — a chmod against an in-memory DB path.

**Acceptance:** all unit shards green on ubuntu, macos AND windows in CI. Not "green locally".

### F-03 · Redo the formatting pass safely — DONE (`e62a6401a`, `fc28a49b8`, `15569cd72`)

Landed, and it cost two extra rounds because the G3 trap has **more doors than oxfmt**. Running
`prek run --from-ref ferrox/main --to-ref HEAD` locally — which is exactly what Code Quality runs — is
the only honest check, and it showed FOUR failing hooks, not one:

1. **oxfmt** on the delta: 288 of 1,337 eligible files.
2. **end-of-file-fixer** wanted to append a newline to `resources/modelsdev-snapshot.json` (the same
   pinned artifact `aea1b4820` broke, reached through a different hook), to two encrypted
   `.constitution-keys.enc` fixtures, and to 24 captured evidence `.log` files.
3. **trailing-whitespace** wanted 23 docs (legitimate) plus a `.log`.
4. **UI Tokens Check** found one REAL defect: `StorageSettings/index.tsx:39` used
   `var(--text-tertiary)`, defined nowhere, so that line fell back to the browser default and was close
   to invisible in dark mode. Fixed to `var(--color-text-3)`, which the validator itself prescribes.

Then the full unit suite — not any hook — caught that the formatter had also corrupted **digest-pinned**
trees: `src/process/resources/skills/**` (SHA-256 pinned by `prepareOfficeCli.js`) and
`tests/fixtures/**` + `strike/**` (pinned by digest AND byte size, including a `.ts` generator whose own
hash is asserted). 8 tests in 4 suites failed. Restored 16 files to pre-format bytes and widened the
excludes.

**The lesson worth keeping: a formatter exclusion list is only as good as the last thing that broke.**
Every entry in `.pre-commit-config.yaml` now records WHY. Oxfmt's final holdout was the committed
`AGENTS.md`, which needed five blank lines — the IJFW hook's live rewrite of that file is oxfmt-clean,
which masked it.

**Acceptance met locally:** prek exits 0 with all 13 hooks Passed, `verify:modelsdev-snapshot` passes,
pinned trees byte-identical, full suite 15,760 passed / 0 failed. Code Quality on CI is the remaining
proof.

### F-03 (original plan text)

Reverted once in `aea1b4820` because it broke the build (see G3). Order matters:

1. Fix `.pre-commit-config.yaml` oxfmt `exclude:` first — it currently covers only
   `src/process/resources/(skills-library|bundled-workflows)/index.json`. It must also exclude
   `resources/modelsdev-snapshot.json` and `contracts/**`. Its `files:` regex also omits `.mjs`.
2. Then format only this branch's delta minus those exclusions (~358 files last measured).

Note the hook DOES receive changed filenames (`$ oxfmt readme.md` in CI logs) — an earlier claim that
it always formats the whole repo was wrong. But main carries ~3,368 unformatted files, so touching any
of them makes Oxfmt fail. That is why Code Quality is red on this PR.

**Acceptance:** `bun run verify:modelsdev-snapshot` passes, packaged build completes, packaged smoke
PASSES, Code Quality green.

### F-04 · Issue + decision hygiene — DONE

Recorded in `F-04-F-05-RECONCILIATION.md`. Nothing is closed while unreleased: of the 22 issues
referenced by branch-only commits, the three CLOSED ones (#484, #706, #746) each have a real fix commit
on `main`. #910b "Chats" is RATIFIED — keep `8f713ea04`; #910 itself stays open because the report is a
broader pin/star/Recents vocabulary problem than the label rename.

### F-05 · Reconcile `~/Downloads/wayland-desktop-cleanup-plan.md` — DONE

Full per-packet status in `F-04-F-05-RECONCILIATION.md`. Headlines:

- **P1-4 must NOT be done as written** — it proposes per-user NSIS, reversing the deliberate per-machine
  UPD-04 decision that stops an unprivileged process swapping the bundled engine.
- **P0-3 is a confirmed real error** — readme claims AGPL for "app and engine both"; Core's own LICENSE
  is Apache-2.0 (read from the file). Misleads embedders.
- **P0-2 is still false in the readme** while signing and notarization are in fact wired. Land quietly.
- **P0-4 is partly superseded** — provenance attestation already runs; only the SHA256SUMS asset is missing.
- The plan's own acceptance bar ("968 unit tests") and one cited path (`wcoreUpdater.ts`) are stale.

### F-06 · Sealed build — GATED ON SEAN

Needs a protected `release-trust-v1` branch and repo variable `WAYLAND_RELEASE_TRUST_ROOT_SHA`.
Neither exists. Deliberately not created by the agent: the agent that builds releases must not mint the
authority that validates them. Notarization is already fully wired (`afterSign.js` + `notarizeDmg.js`,
all six secrets present) — do not re-raise it as a gap.

## 4. Carried findings — fix in place, do not re-litigate

From the F-07 cross-audit panel (Codex 5.6 Sol, Gemini, Kimi K3, internal reviewer):

1. **`metrics` probe is policy-sensitive.** Maps to `metrics:read`, so an extension granting
   `memory:*` but not that denies the probe. Right fix: a policy-neutral transport ping (`tools/list`),
   which needs a new method on `ijfwMcpClient`. Still strictly better than the shipped `state`, which
   could never succeed for anyone.
2. **The bootstrap coalescing fix (`d79558053`) has no concurrency test.** Sequential paths are
   covered and prove no regression; the concurrent path is verified by reasoning only. A packaged smoke
   cannot exercise it.
3. **`triggerInstall` still returns `{ok:true}` for outcomes it cannot distinguish.** Lock contention
   now emits `install_failed`/`install_lock_held`, but the bridge's return shape is still coarse.
4. **Facade class not fully closed.** `ipcSchemas.ts` still declares `state` as passthrough, and
   `DIRECT_TOOL_MAP` still maps `update_apply` to a tool retired from the server (`-32601`). Both have
   zero live callers today — latent, not broken.
5. **Settings checklist has no `installing`/`upgrading` branch**, so it reads "Not installed yet" for
   the 30-60s of an install. Undercuts the F-07 fix for a first-time user.
6. **Opted-out status is untrue, not merely stale** — the `opt_out` branch returns before detection
   runs, so the page asserts "Not installed yet" about an install it never looked for. Fixing the copy
   needs new i18n keys across 10 locales.

## 5. Environment drift to resolve with Sean

- **GSD legacy — REMOVED 2026-07-25.** `~/gsd-workspaces/` was 111 dirs / 6.9 GB (not the 5 the first
  audit reported — that only counted worktree _registrations_), including an unrecorded second full
  clone with 92 branches, 26 of whose tips existed nowhere else. Plus 864 MB of GSD npx caches and 59
  GSD-only files under `~/.claude/`. Archived to `~/dev/_archive/gsd-legacy-2026-07-25/` (28 MB,
  restore tested end-to-end) then deleted. **14 files GSD installed are now owned by Ferrox at the
  same paths and were deliberately kept** — deleting them would have broken Ferrox. Ferrox verified
  intact after: 686/686 manifest files, 13/13 wired hook paths resolve. Full account in
  `.planning/HANDOFF-2026-07-25-F-discipline.md` §4.
- **24 clean worktrees still prunable.** 27 trees remain against a canonical layout of 2: 25 under
  `~/dev/app-worktrees/` (1 dirty, only ` M readme.md`), plus canonical and this in-flight tree.
  Clean trees are safe to remove — `git worktree remove` does not delete branch refs. Audit:
  `git worktree list --porcelain | grep '^worktree ' | sed 's/^worktree //' | while read -r d; do echo "$d: $(git -C "$d" status --porcelain | wc -l) dirty"; done`
- **Canonical tree `~/dev/wayland/app` has 16 uncommitted files** — an unfinished model-ordering /
  cowork feature, **including a modified `resources/modelsdev-snapshot.json`**. That is the G3 pinned
  artifact; while it is dirty, `verify:modelsdev-snapshot` fails and no packaged build from that tree
  can complete. Not touched (standing rule). Sean's call.
- **Gemini's recorded model ID is dead.** `gemini-3.1-pro` → 404 ModelNotFoundError, and the run
  still exits 0, so a failed audit leg looks like a clean pass. Use the CLI default until the memory
  entry is corrected.

## 6. Resume

1. `git -C ~/dev/wayland-worktrees/desktop-integration status --porcelain` → revert `AGENTS.md` if dirty (G1).
2. Read CI on PR #925 for the `0859c11a5` run. Did `wcore-profileStore` go green on ubuntu?
   - Yes → the ambient-state thesis holds; continue F-02 with the recovery symlink fixture.
   - No → re-diagnose from the shard log before writing more code.
3. Then F-03, then F-05, then F-04. F-06 whenever Sean sets the trust root.
