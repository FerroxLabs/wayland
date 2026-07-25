# HANDOFF — 2026-07-25 overnight — CI driven to green, two packets need Sean

**Read this, then `.planning/phases/WLD-F-ci-truth/F-STATE.md`** (gates now G1–G18).
Supersedes `HANDOFF-2026-07-25-F-windows-and-truth.md` for status.

Work location `~/dev/wayland-worktrees/desktop-integration`, branch
`worktree-agent-desktop-integration`. Latest pushed head is `f6dbebb1a`; this doc and the recommendations
below land on top of it. PR #925 → `main`.
**Nothing merged. Nothing tagged. No trust root created.**

⚠️ Every push cancels the previous run's in-flight shards (`cancel-in-progress`), and a cancelled shard turns
all three `Unit Tests (<os>)` aggregates red. Do not read that as failure, and avoid pushing while a run you
care about is mid-flight.

---

## 0. Recommendations, each verified before being written here

Ranked. Every factual claim below was checked in this session, not carried from an agent report.

1. **Do NOT merge #925 until the three required `Unit Tests (<os>)` checks are green.** Verified on run
   `30162197594`: ubuntu **4/4 success**, Code Quality **success**, Windows 4 shards in progress, macOS
   queued. Local + Windows-box evidence exists for every fix, but that is not the gate passing. I was
   confidently wrong three times in this arc, so wait for the green rather than the inference.
2. **Land P1-3 first — strongest recommendation.** `packet/p1-3-linux-notify-only` @ `c7be9abb6`. Verified by
   me: gate binds (13 fail without / 24 pass with), **9 updater suites, 105 tests pass**, `tsc` clean. It
   closes a root-level install of unverified content (`dpkg -i` / `rpm -Uvh --nodeps` via `pkexec`, package
   manager signature checks explicitly disabled, only a sha512-vs-feed-metadata check) plus a `postinst` hook
   that outlives the app. Small, fails closed, touches nothing else.
3. **P0-1: land P0-1a on its own now; pin at LATEST in P0-1b.** Verified live from the registry: pins are
   claude `0.44.0` / codex `1.1.2` / codebuddy `2.73.0`; latest is claude **0.62.0** / codebuddy **2.127.0**
   — 18 and 54 minors. `bridgeVersionResolver.ts`'s header records that a stale pin version-gates newer
   models out entirely, so a fallback pin gets reverted the first time a user loses a model. **P0-1a is
   independently worth landing**: verified by reading the code that `acpConnectors.ts:248` gates only
   `startsWith('npx ')`, there is **no `bunx` gate anywhere in that file**, and `AcpDetector.ts:316`
   documents `"bunx @augmentcode/auggie"` as a declarable path — one character bypasses the gate, with zero
   version movement needed to fix it.
4. **Bring the test tree into the typecheck surface, as its own packet.** Not cosmetic: it is precisely how an
   invalid strict-union literal compiled clean and silently neutered a security race test, and three siblings
   still carry invented values. Measure the error count before gating. (Avoid writing the glob inline here —
   `tests/` plus a double-star next to bold markers is what oxfmt mangled on the previous pass.)

**Explicitly NOT verified:** whether the ~1,600 lines of trust-root code are correct. F-06's preconditions
and ordering are verified twice with positive controls; the code holding `attestations: write` +
`id-token: write` is not. Different claims — do not blur them.

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

---

## 6. Continuation — the last red check, root-caused and fixed (`92d10cab8`)

Run `30162197594` completed and gave the first complete verdict of this arc:

| Runner        | Shards  | Verdict                    |
| ------------- | ------- | -------------------------- |
| ubuntu-latest | 4/4     | **success**                |
| macos-14      | 4/4     | **success**                |
| windows-2022  | 2, 3, 4 | success                    |
| windows-2022  | **1/4** | **failure** — the only red |

`Code Quality` success. So exactly one shard on one OS was red, and its Vitest half passed **367 files /
5 skipped / 0 failed**. The failure was the _separate_ `bun run test:bun` step: one test,
`constitutionClassicRecoveryLocatorService.bun.test.ts`, hit Bun's default **5000ms** per-test timeout.

### The reported error was the aftermath, not the cause

CI surfaced `Expected promise that resolves / Received promise that rejected` at line 228 alongside
`this test timed out after 5000ms`. The mechanism: on timeout Bun tears the test down, the suite's
`afterEach` (line 113) does `rm(root, { recursive: true, force: true })` on the temp roots, and the still
in-flight `decide()` then fails its file reads. Chasing the rejection would have chased a symptom.

### Root cause: two runners, two different timeout budgets

`vitest.config.ts:20` sets `testTimeout: 10000`. Bun defaults to 5000 and
`scripts/run-bun-native-tests.mjs` passed no `--timeout`, so the entire Bun-native corpus silently ran on
half the budget. The Constitution durability suites do not fit in it on Windows, where every `fsync` is a
real `FlushFileBuffers` rather than a cheap one.

### Measured, not inferred (Windows box, Bun 1.3.11 — the version CI resolves)

- Full corpus with the budget raised: **254 pass / 0 fail**. No production defect.
- Heaviest test in a full-corpus run: **4640ms = 93% of the default.** Everything else ≤ 1375ms.
- Its cost swings with I/O scheduling: **2406ms alone, 4031ms paired, 4640ms full-corpus.**
- A _different_ test measured **5016ms (fail) on the box** while passing at 2416ms on the CI runner.

That last line is the important one: the cliff is suite-wide and which test trips it is luck. A per-test
`}, 30_000)` patch on the one CI failure would have knowingly left a live flake in the runner-up.

### The fix

One line in `scripts/run-bun-native-tests.mjs`: pass `--timeout 30000`. Chose 30s over matching Vitest's
10s because 10s leaves only ~2x over the measured Windows ceiling and the CI runner is slower than the box;
the whole corpus finishes in ~26s, so a genuine hang is still reported promptly.

**Verification.** Through the real `bun run test:bun` script on the Windows box: **254 pass / 0 fail**.
macOS: **254 pass / 0 fail**. Linux oxfmt 0.41.0 clean; `prek --files` all pass. The flag is proven to
_bind_ rather than be silently ignored by re-running with the budget set to `1` → **62 failures**.

### Two Bun-version traps found while doing this (worth keeping)

1. **The box's global Bun is 1.3.7; CI resolves `latest` = 1.3.11.** Under 1.3.7 on Windows,
   `fs.promises.open(path, O_WRONLY|O_CREAT|O_EXCL, mode)` fails **ENOENT** — the numeric-flag form is
   broken, the string form `'wx'` works, and Node is fine. Fixed in 1.3.11. My first "reproduction" was
   entirely this bug and had nothing to do with the CI failure.
2. **`bun run test:bun` re-resolves `bun` from PATH** for the nested script, so running it with a
   side-installed Bun still executed the _global_ one and produced 14 phantom EBUSY/ENOENT failures.
   Put the intended Bun first on PATH, do not just invoke its absolute path.

---

## 7. Two packets built while CI ran — both LOCAL, both need Sean

I audited the diffs, not the reports (G15). Findings below are mine.

### P0-1a — bridge escape hatches — `packet/p0-1a-bridge-escape-hatches` @ `9828662022208d`

Off `ferrox/main`. 7 files, +552/−28. **Not pushed.**

New `src/process/agent/acp/packageRunner.ts` owns the npx/bunx gate for **both** launch paths
(`createGenericSpawnConfig` and `AcpAgent.ensureBackendAuth`), which had already drifted from each other.
It normalizes the leading token (unquote, strip `.cmd/.exe/.bat/.ps1`, lowercase, any-whitespace split), so
closing `bunx ` does not just relocate the one-character bypass. The gate **re-routes, never refuses** —
`goose acp`, `/usr/local/bin/qwen` and quoted Windows paths still take the generic path.
`bridgeVersionResolver` now requires exact semver and no longer emits `version || 'latest'`.
Red-before-green: **22 fail → 0 fail of 64**; `acp|bridge` suites 1543 pass; full suite 13270 / 0.

**I independently checked the one risky behavior change.** `resolveBridgePackage` now _throws_ instead of
falling back to `@latest`. All three call sites pass exact-pinned constants
(`acpTypes.ts:16-23` → codex `1.1.2`, claude `0.44.0`, codebuddy `2.73.0`), so the throw is unreachable for
shipped bridges — no availability regression. `qwen`'s unpinned `npx @qwen-code/qwen-code` is a
`defaultCliPath` and never goes through this resolver, so it is unaffected.

Two things Sean should know:

- **An absolute path to a package runner still bypasses the gate** (`/usr/local/bin/bunx @pkg`): matching is
  on the leading token, not its basename. This is not a regression — the old `startsWith('npx ')` gate had
  the same hole — and an explicit absolute path is a deliberate user choice rather than the accidental
  PATH case the gate exists for. It belongs in the **P0-1c** custom-agent policy decision, not here.
- **No live or packaged verification.** All of it is unit-level; `resolveNpxPath` is mocked, the registry is
  stubbed, and Windows is simulated via a `process.platform` override. Per the standing rule this needs a
  packaged sweep before it ships.
- `envOverride` was **kept** (Sean's own documented break-glass from `f9ae6dee8`), only tightened to exact
  semver, and a bad value warns and falls through rather than throwing — a typo cannot brick agent launch.

### Test typecheck gap — measured — `packet/f-tests-typecheck` @ `f821b0ab5`

Off `ferrox/main`. Config only: new `tsconfig.tests.json` + one additive `package.json` script.
**Nothing is wired into CI, so it is inert.** **Not pushed.**

- Baseline `bun run typecheck`: **0 errors.** The test tree is the entire gap.
- `tsc -p tsconfig.tests.json`: **1,750 diagnostics across 421 files**, 54s. But **976 of 1,395 spec files
  (70%) are already typeclean.**
- Split: **848 mechanical** (implicit-any on untyped mocks; 215 of them are missing `vitest` imports in just
  **16 files**, against 1,265 files that already import explicitly) vs **902 semantic**.
- **The class that matters is 57 errors in 41 files**: 27 tests asserting a string literal its union forbids,
  30 dead-by-construction (6 unresolvable imports, 5 dead `@ts-expect-error`, 4 `currentMode` →
  `currentModeId` misspellings the code never reads, 2 comparisons that can never be true, 7 e2e files
  importing a non-exported type). Six of those files were run: **5 passed, 1 skipped, 0 failed** — green
  while asserting impossible values.
- **The original bug is provably catchable.** Setting `reason: 'hostile-publication-race'` back on the
  integration branch's copy produces exactly
  `TS2322: Type '"hostile-publication-race"' is not assignable to type '"manual" | "pre-migration" | "pre-update" | "recovery-test"'`.
  In 54 seconds, from a config file.
- Note the config does carry a 22-entry exclude list — Bun-native files importing `bun:sqlite`, which has no
  node types. That is not the same thing as excluding the 419 dirty spec files.
- Spin-off found: 3 latent `src` `TS2612` errors (`AcpAgentManager.ts:142`, `GeminiAgentManager.ts:98`,
  `WCoreManager.ts:215`) that appear the moment `target` moves past ES6. Invisible today only because the
  base config is pinned at ES6.

**Recommendation, and it is a decision for Sean:** gate on a **checked-in diagnostic baseline** keyed on
`file + code + normalized message` (dropping line/column so it does not churn), failing CI only on _new_
diagnostics. It would have caught the recovery bug on the first run because that file was new, it costs
~40s of CI, it requires **zero** test edits, and it shrinks monotonically. A file-exclude list would also
have caught that one bug but gives permanent zero protection to the 419 already-dirty files. Then fix the
57 as its own packet — each is a judgment call (is `status: 'open'` a wrong test value or a union missing a
member?), roughly half a day to a day.
