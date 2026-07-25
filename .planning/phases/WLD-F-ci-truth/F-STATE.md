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

| packet | state | evidence |
|---|---|---|
| **F-01** required-checks bypass | **DONE** | `3844b2e1e`. Proven live on throwaway PRs #926/#927: docs-only → 4/4 required green; mixed + failing test → all 3 required RED; draft → RED not green-by-skip. Both PRs closed, branches deleted. |
| **F-07** IJFW Memory dead end | **DONE** | 9 commits `b80ad8beb..d79558053`. Packaged smoke `bun run smoke:ijfw` OVERALL: PASS — one click recovers Memory with no restart, runtime row reaches **Live**, Test passes. |

F-01 is why CI can now be trusted at all. Before it, a green required check on this repo meant nothing.

## 3. Open packets, in execution order

### F-02 · CI-only unit failures (IN PROGRESS)

~38 failures that pass locally and fail only on CI runners. All evidence so far says ONE defect class:
tests inheriting ambient machine state. Three were already fixed earlier this session (OfficeCLI
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

### F-03 · Redo the formatting pass safely

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

### F-04 · Issue + decision hygiene
#910b "Chats" ratified (keep `8f713ea04`), record only. Confirm nothing is marked fixed while
unreleased — the correct label is **`state:fixed-pending-release`** (with the `state:` prefix).

### F-05 · Reconcile `~/Downloads/wayland-desktop-cleanup-plan.md`
Audited at `1b1c1e9`, which is exactly this branch's merge-base, so some findings may already be
fixed. Produce a per-packet already-fixed / still-open / superseded status BEFORE anyone starts work.
Its P0-1 (ACP bridges via `bunx @latest` at spawn = RCE) is the same supply-chain class as the pins
fixed this session.

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

- **30 stale worktrees.** 25 under `~/dev/app-worktrees/`, 5 under `~/gsd-workspaces/`. Canonical
  layout is `~/dev/wayland/app` on main plus in-flight trees under `~/dev/wayland-worktrees/`. Audit
  before removing anything — they may hold uncommitted work:
  `git worktree list | awk '{print $1}' | while read d; do echo "$d: $(git -C "$d" status --porcelain | wc -l) dirty"; done`
- **Gemini's recorded model ID is dead.** `gemini-3.1-pro` → 404 ModelNotFoundError, and the run
  still exits 0, so a failed audit leg looks like a clean pass. Use the CLI default until the memory
  entry is corrected.

## 6. Resume

1. `git -C ~/dev/wayland-worktrees/desktop-integration status --porcelain` → revert `AGENTS.md` if dirty (G1).
2. Read CI on PR #925 for the `0859c11a5` run. Did `wcore-profileStore` go green on ubuntu?
   - Yes → the ambient-state thesis holds; continue F-02 with the recovery symlink fixture.
   - No → re-diagnose from the shard log before writing more code.
3. Then F-03, then F-05, then F-04. F-06 whenever Sean sets the trust root.
