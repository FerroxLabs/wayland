# K-02 SUMMARY — Honest wcore start-failure surfacing (DIA-01, DIA-02)

**Status:** BUILT + full-suite-verified, LOCAL then pushed to `ferrox/packet/attribution-audit`.
2 commits `75d25e066..436806fa2`. Full unit suite **16,285 / 0 failed** (149 pending/skipped),
`tsc --noEmit` clean. Baseline was 16,268 tests — this plan added exactly 17 (11 in Task 1,
6 in Task 2), matching the plan's own accounting.

## What shipped

- **`src/process/agent/wcore/startFailureReason.ts`** (new, leaf pure module — no `fs`, no
  `child_process`, no import of `index.ts`). Deliberately its own file, not an extension of the
  sibling `execFailureReason.ts` (that file's head comment carries an explicit Sean-locked
  "not an error taxonomy" boundary). Exports:
  - `StartFailureClass = 'stripped-config' | 'profile-resolution' | 'generic'`
  - `classifyStartFailureDetail(detail)` — matches Core's `Profile 'X' not found in config` bail
    (case-insensitive, either quote style); `'stripped-config'` only when the captured name equals
    the real `WCORE_DESKTOP_MCP_PROFILE` (imported from `./envBuilder`, never hand-duplicated);
    any other captured name → `'profile-resolution'`; no match → `'generic'`.
  - `profileStripHedge(detail)` — `''` unless `'stripped-config'`, in which case a hedge-worded
    parenthetical (exact wording below).
  - `describeContractRejection(stderrDetail, fallbackDetail)` — the DIA-01 fix for the
    `failDesktopContract` site: empty `stderrDetail` → the original abstract wording, byte-exact
    (no regression); non-empty → fully replaces the abstraction with `wcore refused to start:
${stderrDetail}${profileStripHedge(stderrDetail)}`. This is the ONLY site that replaces the
    phrase; the other two sites only ever append the hedge suffix.

- **`src/process/agent/wcore/index.ts`** — one new import
  (`describeContractRejection, profileStripHedge` from `./startFailureReason`) plus three edits
  inside `startWithProjectConfigLease`, re-located live by grep (not by any line number from the
  plan, per the ORDERING note — K-01 had already moved them):
  1. `failDesktopContract`'s `!this.ready` branch — now computes
     `redactSecrets(stripAnsi(this.stderrTail).trim())` and rejects with
     `describeContractRejection(stderrDetail, detail)` instead of the inline template literal.
     The `else` branch (post-ready protocol-safety-check) is untouched.
  2. `spawnedChild.on('exit', ...)` — the non-empty-`detail` branch now appends
     `${profileStripHedge(detail)}`; the empty-`detail` branch (`'wcore ${reason} during init'`,
     no colon) is untouched byte-for-byte.
  3. The 30-second ready-timeout `Promise` — same treatment, non-empty branch appends the hedge,
     empty branch (`'wcore ready timeout (30s)'`) untouched byte-for-byte.

- **`tests/unit/process/agent/wcore/startFailureReason.test.ts`** (new, 11 cases) — plain
  `describe`/`it`, no mocks, imports `WCORE_DESKTOP_MCP_PROFILE` from the real `envBuilder.ts`.
  Committed FIRST against a module that did not exist yet — confirmed RED live
  (`Cannot find package '@process/agent/wcore/startFailureReason'`, 0 tests run) before the
  GREEN commit added the module.

- **`tests/unit/wcoreStderrSurfacing.test.ts`** (extended, +5 cases, 26→31): DIA-01
  contract-rejection with stderr present (engine reason surfaces, abstraction gone); DIA-01
  no-stderr fallback (original wording + contract detail both preserved, no regression); DIA-02
  stripped-config hedge via the exit path; DIA-02 ordinary profile-resolution stays unhedged;
  secret redaction proven through the new contract-rejection path. The DIA-02 mock addition
  (`WCORE_DESKTOP_MCP_PROFILE: '__wayland_desktop_session'` on the existing
  `vi.mock('@process/agent/wcore/envBuilder', ...)` factory) was proven RED live first — both
  hedge cases threw `No "WCORE_DESKTOP_MCP_PROFILE" export is defined on the ... mock` before the
  mock export was added.

- **`tests/unit/WCoreManagerStartFailure.test.ts`** (extended, +1 case, 5→6) — regression LOCK
  (not RED — passes immediately, no production change): reproduces `DesktopProfileSpliceError`'s
  (K-01) real message template with a `smol-toml`-style multi-line TOML-parse-context snippet
  embedding a realistic `api_key = "sk-ant-..."` line, and asserts the key never survives
  `WCoreManager`'s existing `redactCommandSecrets` while `'Fix the file by hand'` does. Pins the
  protection verified by execution during planning (item 2/3 in the plan's objective) so it cannot
  silently regress.

## Exact hedge wording chosen (`profileStripHedge`)

```
 (likely cause: this workspace was not trusted by Wayland Core, so the launch profile Desktop just
wrote was stripped before the engine read it back - inferred from the profile name, not confirmed
by the engine)
```

Checked live (Node script, not by eyeball) against:

- `AUTH_FAILURE_SIGNATURES` (`acpAuthFailure.ts`) + the `\b401\b` pattern — no substring match.
- `isContextCeilingErrorMessage`'s two substrings (`errorDetection.ts`) — no match.
- `redactCommandSecrets.ts`'s `KEY_VALUE_REGEX`/`CAMEL_KEY_VALUE_REGEX` keyword adjacency
  (`api_key`/`token`/`secret`/`password`/... immediately followed by `:`/`=`/a secret-shaped
  value) — plain prose, no such adjacency, safe.

## Full-suite result

```
npx tsc --noEmit          → No errors found
npx vitest run             → 4725/4725 suites, 16285 tests, 0 failed, 149 pending (skipped —
                              live-CLI smoke tests gated behind env vars, unrelated to this plan)
```

Baseline to beat was 16,268/0. This plan added exactly 17 tests (11 + 5 + 1), landing at
16,285/0 — matches the plan's own math.

## Verification gates

- `execFailureReason.ts` byte-identical to pre-plan HEAD — confirmed via `git status --short`
  (file does not appear in the diff at all).
- No file under `src/renderer/` appears in either commit's diff — confirmed by `git status
--short` after staging; zero renderer changes were needed (the plain-text fallthrough in
  `WCoreSendBox.tsx`'s `handleTurnError` already renders unclassified error text).
- Zero new IPC channels, zero new dependencies.

## Deviations from plan

None. All edit points, exports, and test cases match the plan's specification. The only executor
judgment call was the exact hedge sentence (plan left this to the executor's discretion,
constrained by the hedge-word and collision requirements — both satisfied, checked live above).

## Outstanding — live-engine manual UI spot-check (deferred)

**Deferred, not fabricated.** This worktree has no usable live `wayland-core` engine binary (per
the task's explicit instruction) — `resolveWCoreBinary` in the real environment resolves a bundled
binary this worktree does not have staged for execution, and there is no reproducible
untrusted-workspace Core setup available here. The plan's manual repro
(`.wayland-core.toml` with `[profiles.p]`, `wayland-core --profile p ...` inside an untrusted
workspace, confirming the chat bubble now reads the engine's own reason or the hedged
stripped-config wording) was **not run**. All code-level behavior it would confirm is covered by
the unit tests above (`wcoreStderrSurfacing.test.ts` cases exercise the exact same code paths with
a mocked child process). This is the one item from the plan's `<verification>` section not
executed in this session.
