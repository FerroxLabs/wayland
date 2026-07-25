# HANDOFF — 2026-07-25 overnight — CI driven to green, two packets need Sean

**Read this, then `.planning/phases/WLD-F-ci-truth/F-STATE.md`** (gates now G1–G18).
Supersedes `HANDOFF-2026-07-25-F-windows-and-truth.md` for status.

Work location `~/dev/wayland-worktrees/desktop-integration`, branch
`worktree-agent-desktop-integration`, HEAD `59dc5504e`, pushed, tree clean.
PR #925 → `main`. **Nothing merged. Nothing tagged. No trust root created.**

---

## 1. Headline

**Failing CI tests went 62 → 0 locally, and the last CI red was fixed and proven on the real Windows box.**

| runner       | session start            | now                                                  |
| ------------ | ------------------------ | ---------------------------------------------------- |
| ubuntu       | 1/4 green (only shard 3) | **4/4 green**                                        |
| Windows      | 0/4 green                | **3/4, and shard 1's cause is fixed in `db3edfcc0`** |
| Code Quality | red                      | **green**                                            |

Full local unit suite **15,779 passed / 1 failed** — the 1 is `WorkflowDetailModal.dom` timing out under
parallel load; it passes 12/12 alone and passes on CI. Full bun-native suite **254 pass / 0 fail**.

**Do not read this as "green".** macOS shards were still queued on GitHub's runner pool at handoff, so the
three required `Unit Tests (<os>)` checks had not yet stamped a verdict on `59dc5504e`. Check that first.

## 2. Two real product bugs found, both Windows-only

**A Windows security bug in transfer signing (`aa88dc37c`).**
`FileSourceSigningAuthorityStateBackend.read()` relied solely on `O_NOFOLLOW`.
`fs.constants.O_NOFOLLOW` is **undefined on Windows** and collapses to 0, so `open()` followed a link and
every check through the handle inspected the _target_ — `fstat` structurally cannot report a symlink. A state
file swapped for a link to attacker-chosen content read clean and redirected signing authority to the
attacker's `vaultRef`/`publicKeyDer`. **The test asserting this already existed and was failing on the
Windows shard because production was wrong.**

An adversarial review then refuted my first fix twice over, and both are fixed:

- The comment claimed the existing dev/ino comparison caught a mid-read swap. It cannot — that comparison is
  two `handle.stat()` calls on the **same descriptor**, invariant by construction. The fix now binds the
  opened descriptor to the entry `lstat` admitted and re-`lstat`s the path after the read, mirroring
  `readProjectConfigNoFollow` in `projectConfigTransaction.ts`, which already did it correctly.
- The guard checked only `isSymbolicLink()`. `open(O_RDONLY)` on a **FIFO blocks until a writer appears**, and
  the `!isFile()` check that refuses one ran only _after_ the open — an unkillable hang of
  `createTransferPublication` pinning a libuv threadpool thread. Now `assertSafeStateStat` runs pre-open.
- Coverage: on POSIX the real `O_NOFOLLOW` throws ELOOP by itself, so the sibling suite passed with or
  without the guard. `sourceSigningAuthorityNoFollow.test.ts` mocks `fs.constants` to force the Windows
  condition on every host; **proven to bind** (neutralise the guard → symlink + FIFO cases fail).
- Residual, stated in the code: `nlink` and `st_uid` are unchecked and the POSIX mode check is skipped on
  win32, so a same-uid process that can write the 0700 authority dir is not excluded.

**A shipped-breaking Linux capture bug (`81d287709`).** `recoveryFilesystemSafetyModeForPlatform` returns
`descriptor-relative` **only on linux**, so ubuntu is the only runner that exercises production capture — and
there it could not pass. The builder passes `/proc/self/fd/<fd>` (a symlink by construction) and
`verifyRecoverySnapshot` `lstat`ed it as segment −1 of its own no-symlink walk. All 20 failures across two
suites were that one cause. Root now resolves with follow semantics; segments below keep `lstat`.

## 3. What I got wrong, and what caught it

- **I relaxed a production check on a wrong diagnosis (`59dc5504e` reverts it).** `retainedRecordRoots`'s
  `realpath(candidate) === candidate` failed on Windows because the **test fixture** canonicalized with
  `fs.realpathSync` (JS walker, keeps the caller's spelling) while production uses `fsPromises.realpath`
  (libuv, returns the filesystem's spelling). Production was already canonical. My relaxation also killed the
  only thing that check uniquely enforced — **ancestor** symlink-freeness — leaving dead code that read like a
  boundary. Fixture now uses `fs.realpathSync.native`. A cross-audit found this; I did not.
- **I told Sean `13695e0fe` was "not a proven fix", then that it was, then reverted it.** The middle claim was
  right about the mechanism and wrong about the location. Sequence matters less than the lesson: I had only
  probed `fs.realpathSync`, not the API production actually calls.
- **My F-06 recommendation was wrong** — see §5.
- **Code Quality went red on my own push** because oxfmt on darwin _accepts_ bytes linux _rejects_. No local
  prek run could have caught it. G12.
- **`prek run --all-files` rewrote 3,368 files**, including digest-pinned artifacts. Reverted, nothing
  committed. The repo already documented why (`_build-reusable.yml`'s own comment). G13.

## 4. Open, needs Sean

### P0-1 pin ACP bridges — STOPPED DELIBERATELY, needs a decision

Worktree `~/dev/wayland-worktrees/packet-p0-1`, branch `packet/p0-1-pin-acp-bridges`, **no commits**.

There is no drop-in fail-closed pin, because enforcing one changes which bridge version every user runs:

| backend                                        | committed pin | registry latest |
| ---------------------------------------------- | ------------- | --------------- |
| claude `@agentclientprotocol/claude-agent-acp` | 0.44.0        | **0.62.0**      |
| codex `@agentclientprotocol/codex-acp`         | 1.1.2         | 1.1.7           |
| codebuddy `@tencent-ai/codebuddy-code`         | 2.73.0        | **2.127.0**     |
| qwen `@qwen-code/qwen-code`                    | **none**      | 0.21.0          |

Pin to the committed fallbacks → Claude drops 18 minors, CodeBuddy 54; `bridgeVersionResolver.ts`'s own
header records that a stale pin version-gates newer models out entirely. Pin to today's latest → a 4-bridge
upgrade smuggled inside a security commit, unverified against this app's ACP handshake.

Also found: the cited line (`acpConnectors.ts:248`) is the symptom; run-time resolution is
`bridgeVersionResolver.ts:51` fetching `latest`. **`bunx ` is not gated at all** — a `npx `-only gate is
bypassed by one character. `envOverride` injects any version. And the plan's proposed
`resources/acp-bridges.json` is the **wrong home**: `resources/` is `extraResources`, written loose outside
app.asar and writable post-install — an allowlist an attacker can edit.

Recommended split: **P0-1a** close the escape hatches (no version movement), **P0-1b** the pin proper once
you answer "latest or fallbacks?" and "are bridge upgrades now a repo commit + release?", **P0-1c**
custom-agent/extension policy (touches 14 locales of docs). Recommendation: land P0-1a, pin at **latest**
with a live-verify gate, because a pin that costs users a model will be reverted.

### F-06 sealed build — BLOCKED ON THE MERGE, not on your review

See F-STATE §3 for the full corrected entry. Short version: **my earlier advice to create
`release-trust-v1` from `main` tip `1b1c1e911` was wrong** — all four trust-root files are absent from
`main` (authored on this branch 2026-07-19, never merged), so that branch would carry no workflow and every
dispatch would 404. Verified twice, each with a positive control.

Nothing is broken on `main` today (0 references there; 9 on this branch). Correct order: **merge → create
`release-trust-v1` from the post-merge `main` tip → set `WAYLAND_RELEASE_TRUST_ROOT_SHA` to that exact SHA →
protect → only then tag.** ⚠️ `build-and-release.yml` fires on `tags: ['*']`, so a tag landing between merge
and the variable being set breaks the release build.

### P1-1 `eval('require')` sandbox — not started, by the doc's own advice

`F-04-F-05-RECONCILIATION.md` says it "wants its own milestone, not a packet". Left alone.

### P0-4 SHA256SUMS — held

It means editing `build-and-release.yml`, which fires on any tag. Not something to change unattended.

### P1-4 — do NOT do as written

Would reverse the deliberate per-machine UPD-04 decision.

## 5. Watch items

- **Coverage Test went red** on `aa88dc37c` after three green runs. `COVERAGE_OUTCOME: success` — the tests
  passed; the **Codecov upload** failed with `Unable to get ACTIONS_ID_TOKEN_REQUEST_URL`, an OIDC
  permission problem. Not a required check. Check whether it reproduced on `59dc5504e`.
- **`Build Pipeline (Reusable)` is red on every push** and still unexplained: `on: workflow_call` only, zero
  jobs, no log. **Not a required check** — required are exactly `Code Quality` + the three
  `Unit Tests (<os>)`. My earlier claim that this was pending Sean was wrong.
  Ruled out so nobody retraces it: repo rulesets (none configured) and org rulesets (404), so it is not a
  required-workflow rule; both callers cannot fire on a feature-branch push (`build-and-release.yml` is
  `push: branches: [dev]` + `tags: ['*']`, `build-manual.yml` is `workflow_dispatch` only); and **`main`'s own
  copy of `_build-reusable.yml` is also `workflow_call`-only**, so it is not the default-branch definition
  carrying a stray `push:` trigger. Next thing to try is the Actions UI for one of those run IDs, since the
  API returns no jobs and no log for them.
- **All three per-OS required checks share ONE matrix job**, so any shard on any OS turns all three red.
  macOS reported `SHARDS_RESULT: failure` with its own 4/4 green.
- **~35 `verifyPackagedResources` assertions pass for the wrong reason on Windows**: 41
  `expect(...).toThrow(/CRITICAL/)` sites are satisfied by the shim exec-bit failure regardless of the tamper
  they mean to detect. Pre-existing; fixing it needs a win32-target fixture or a `REQUIRED`-override seam.
- **`tsconfig.json` excludes `tests/**`**, so unit tests are never typechecked. That is how
`reason: 'hostile-publication-race'` — a flat violation of a strict union — compiled clean and silently
  neutered a security race test. Three siblings still carry invented reasons. G18; not fixed.
- Windows box `C:\wl-verify` is at `d30782b8` with **342** pre-existing dirty files; I removed my three probe
  scripts. Two agents used throwaway worktrees there and tore them down.
