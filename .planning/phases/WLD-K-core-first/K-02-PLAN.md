---
phase: WLD-K-core-first
plan: K-02
type: execute
wave: 2
depends_on: [K-01]
files_modified:
  - src/process/agent/wcore/startFailureReason.ts (new)
  - src/process/agent/wcore/index.ts
  - tests/unit/process/agent/wcore/startFailureReason.test.ts (new)
  - tests/unit/wcoreStderrSurfacing.test.ts (extended)
  - tests/unit/WCoreManagerStartFailure.test.ts (extended)
autonomous: true
requirements: [DIA-01, DIA-02]
---

> **Source of truth:** `ROADMAP.md` `### Phase K-02: Honest failure surfacing` and `REQUIREMENTS.md`
> `### Phase K-02` (DIA-01, DIA-02), both dated 2026-08-08. Every identifier, function name, and
> file cited below was read live at this worktree's HEAD (2026-08-08) before writing this plan.

> **ORDERING — read this before touching anything:** `src/process/agent/wcore/index.ts` (plus
> `projectConfigTransaction.ts`, `projectConfigLease.ts`, `envBuilder.ts`) is being concurrently
> edited by phase **K-01** in a sibling worktree. This plan's Task 2 edits `index.ts` too — the SAME
> method (`startWithProjectConfigLease`) K-01 also touches. **Do not start Task 2 until K-01 has
> landed on the branch this worktree builds from.** Because K-01 will have moved line numbers, every
> edit point below is anchored to a function/method name or an exact string literal already in the
> file, never a line number. Before editing, re-locate each anchor with:
> `grep -n "failDesktopContract\|during init:\|ready timeout (30s)\|private async startWithProjectConfigLease" src/process/agent/wcore/index.ts`
> — if any of those four strings is missing or the surrounding shape looks materially different from
> what Task 2 describes, STOP and re-read the current file before editing; do not guess.
> `ROADMAP.md`'s own K-02 entry says "Depends on: Nothing technically" — that is true at the
> requirements level (DIA-01/DIA-02 do not need anything K-01 _built_). The `depends_on: [K-01]` here
> is a narrower, purely mechanical constraint: two plans must not hand-edit the same method in the
> same file at the same time.

<objective>
Two dishonest failure surfaces, both hit live this week chasing the Core 0.12.26 workspace-trust
regression (see `.planning/HANDOFF-TO-CORE-2026-08-08-workspace-trust.md`):

1. **DIA-01.** When `WCoreAgent`'s Desktop-contract stdout parser rejects a line before the engine
   reaches `ready`, `start()` rejects with the literal string `wcore Desktop contract rejected ready:
{contract-parser detail}` — the JS-side parser's OWN complaint (e.g. "Core emitted malformed
   JSON"), never the engine's real stderr, even though the engine's real stderr is already captured
   in `this.stderrTail` at that exact moment. This is the message the user actually saw as "Agent
   failed to start: wcore Desktop contract rejected ready: ...".
2. **DIA-02.** Core's `Profile 'X' not found in config` bail (produced by BOTH a genuine missing
   profile AND — per the handoff doc — a workspace-trust strip of the exact profile Desktop just
   wrote) surfaces identically either way. Nothing in Desktop today tells these two apart, so the
   next 0.12.26-class incident costs another afternoon of chasing the wrong layer, exactly like this
   one did.

**Read live at this worktree's HEAD (grounds every task below):**

- `src/process/agent/wcore/index.ts`, method `startWithProjectConfigLease` — three, and ONLY three,
  places compose a start-failure `Error` from `this.stderrTail`:
  1. The `failDesktopContract` closure's `!this.ready` branch: `this.readyReject(new Error(\`wcore
     Desktop contract rejected ready: ${detail}\`))`where`detail`is the contract error's OWN`.message`— **this is the one that never looks at`stderrTail` at all\*\*, the DIA-01 gap.
  2. `spawnedChild.on('exit', ...)`: already does `const detail = redactSecrets(stripAnsi(
this.stderrTail).trim());` then `wcore ${describeExitReason(code, signal)} during init:
${detail}` when `detail` is non-empty (already correct for DIA-01 — nothing to fix here).
  3. The 30-second ready-timeout `Promise`: already does the identical `redactSecrets(stripAnsi(
this.stderrTail).trim())` composition, prefixed `wcore ready timeout (30s): ${detail}` (also
     already correct for DIA-01).
     Neither (2) nor (3) does ANY class-of-failure distinction today — that is DIA-02's gap, and it is
     present in all three sites, not just (1).
- `WCORE_STDERR_TAIL_MAX = 2048` and the module-local `SECRET_PATTERNS` / `redactSecrets` (top of
  `index.ts`, just below the imports) — five conservative regexes (OpenAI/Stripe `sk-`/`pk-`/`rk-`
  prefixes, `Bearer <token>`, GitHub `ghp_`/etc., Slack `xox*-`, AWS `AKIA...`). This IS "the
  existing `SECRET_PATTERNS`" DIA-01 names. Reused, never re-implemented, never duplicated.
- `tests/unit/wcoreStderrSurfacing.test.ts` (26 cases, all currently passing — **ran live**, see
  "Verified by execution" below) is the established test harness for exactly this surface: a
  `vi.mock('node:child_process')`-backed fake child (`makeChild()`), a `flushUntilSpawned()` helper
  that polls real wall-clock time until `start()` has attached its production listeners, and an
  existing case, `'redacts high-confidence secret tokens from the surfaced stderr (#484 audit)'`,
  that already proves `SECRET_PATTERNS` catches an `sk-...` token end-to-end through the exit path.
  Task 2 extends this SAME file/describe block rather than building a parallel harness.
- `src/process/agent/wcore/envBuilder.ts:407` — `WCORE_DESKTOP_MCP_PROFILE =
'__wayland_desktop_session'`. Confirmed by grep: this exact constant is the ONLY value ever passed
  to `--profile` anywhere in the non-vendored source tree (`index.ts` line ~502,
  `args.push('--profile', WCORE_DESKTOP_MCP_PROFILE)`, gated on `!rawEngineMode &&
mcpServerNames !== undefined`). Raw-engine mode never passes `--profile` at all. So today, a
  `Profile 'X' not found` bail can ONLY ever name this one reserved profile — Desktop's own, written
  moments before spawn — via the mainline flow. **Do not confuse this with `ProfileIsolationError`**
  (`profilePaths.ts`) — that is Desktop's unrelated multi-account "active profile" marker-file system
  and never touches engine stderr; nothing in this plan changes it.
- `src/process/agent/wcore/desktopProfileSplice.ts` (K-01, already landed in this worktree —
  confirmed by reading the file directly). `DesktopProfileSpliceError`'s constructor already composes
  a fully actionable message: `Cannot safely update the reserved [profiles.
${WCORE_DESKTOP_MCP_PROFILE}] table in the global Wayland Core config ({detail}). Fix the file by
hand before Desktop can launch against it.` `index.ts` line ~48-51 has an explicit comment: this
  error is deliberately NOT imported/narrowed in `index.ts` and propagates unmodified through
  `start()`'s generic reject path. K-01-PLAN.md's own STRIDE register (`T-K01-03`) says explicitly:
  _"rich in-UI surfacing of this failure is K-02's job, not reinvented here."_ This plan is that job
  — see "What this plan does NOT need to build" below for why the answer turned out to be
  verification, not new code.
- `src/process/task/WCoreManager.ts`, method `emitStartFailure` (search for `agent bootstrap failed;
turn`) — the ONLY place `Agent failed to start: {detail}` is composed, where `detail =
error.message`. It wraps the WHOLE composed string in `redactCommandSecrets` (a SEPARATE, broader
  scrubber, `src/common/utils/redactCommandSecrets.ts` — prefix shapes incl. `sk-ant-`, plus a
  key-NAME-aware `KEY_VALUE_REGEX` covering `api_key = "..."`/`token = "..."`/etc.) before emitting
  it as an `IResponseMessage` of `type: 'error'` on `ipcBridge.conversation.responseStream`. This is
  the ONE path every start-failure error (contract rejection, exit, timeout, `MissingApiKeyError`,
  `ProfileIsolationError`, `DesktopProfileSpliceError`) already flows through — confirmed by reading
  every call site of `readyReject`/`start()`'s rejection.
- `src/renderer/pages/conversation/platforms/wcore/useWCoreMessage.ts` — the `type === 'error'`
  branch unconditionally clears the running/thought state and calls `onError?.(message)`; there is no
  swallow.
- `src/renderer/pages/conversation/platforms/wcore/WCoreSendBox.tsx`, `handleTurnError` — checks
  `classifyAcpAuthFailure('wcore', text)` (routes to the credential-recovery card) then
  `isContextCeilingErrorMessage(text)` (routes to the context-ceiling card); anything matching
  neither falls through untouched. This IS "the renderer's auth-failure classifier" and "prior art
  for classifiable errors" — `src/renderer/pages/conversation/platforms/acp/acpAuthFailure.ts`'s
  `AUTH_FAILURE_SIGNATURES` array, and `MissingApiKeyError` (`envBuilder.ts:398`) is the example of a
  pre-spawn error whose message text alone (no new channel, no new IPC type) routes it correctly.

**What I verified by execution (not by reading source):**

1. `npx vitest run tests/unit/wcoreStderrSurfacing.test.ts` → **26 passed, 0 failed**, live, this
   worktree. This is the "known positive" proof that `SECRET_PATTERNS`/`redactSecrets`/`stderrTail`
   all work TODAY, before this plan touches anything — the existing `'redacts high-confidence secret
tokens...'` case is direct, already-passing proof `SECRET_PATTERNS` catches an `sk-...` token.
2. `smol-toml`'s `parse()` on a malformed multi-line TOML string echoes SURROUNDING source lines in
   its thrown `.message` — confirmed by running it directly against
   `'[providers.anthropic]\napi_key = "sk-ant-SUPERSECRETVALUE1234567890"\nbroken = [1, 2,'`: the
   error message contains the FULL unrelated `api_key = "sk-ant-SUPERSECRETVALUE..."` line verbatim,
   even though the actual syntax error is on the NEXT line. This means `DesktopProfileSpliceError`
   (K-01) CAN embed a raw provider key from the user's real global `config.toml` if that file happens
   to be malformed near a `[providers.*]` block.
3. Ran that exact leaked string through the REAL `redactCommandSecrets` (the one `WCoreManager`
   already applies to every `emitStartFailure` detail): the `api_key = "sk-ant-..."` line is masked to
   `api_key = "••••••"` — the secret does NOT survive. **Verified finding: `DesktopProfileSpliceError`
   needs no source change for secret safety** — the existing WCoreManager-level redaction already
   covers it. Task 2 adds a regression test that locks this in (so it cannot silently regress later),
   not a fix.
4. Read (not yet re-run after this plan's own additions) `AUTH_FAILURE_SIGNATURES` and
   `isContextCeilingErrorMessage`'s keyword lists against this plan's new wording (see Task 1) — no
   substring collision. Task 2 must re-confirm this holds for whatever exact hedge wording lands.

**What this plan does NOT need to build (verified, not assumed):**

- No new IPC message type, no new renderer error channel, no new UI card. DIA-01/DIA-02 both reach
  the user through the SAME existing `emitStartFailure` → `ipcBridge.conversation.responseStream` →
  chat-bubble path every other start failure already uses; the fix is entirely in what STRING that
  path carries.
- No renderer changes. The plain-text fallthrough in `WCoreSendBox.tsx`'s `handleTurnError` already
  renders unclassified error text to the user (point 3 of the assignment — verified above, not
  assumed).
- No production change to `desktopProfileSplice.ts` — its message is already actionable and already
  redacted by the existing `redactCommandSecrets`.
- No i18n. `MissingApiKeyError`, `describeSpawnError`, `describeExitReason`, and every other message
  on this exact surface are raw English strings, never `i18n.t(...)`-wrapped — i18n on this codebase
  is reserved for curated higher-level UI copy (e.g. `conversation.chat.toolUnsupported`), not
  low-level engine/process diagnostics. Matching the established pattern, not inventing a new one.

**Design decision this plan makes:** the new classification/hedge logic lives in a BRAND NEW file,
`src/process/agent/wcore/startFailureReason.ts` — deliberately NOT added to the existing sibling
`execFailureReason.ts`, even though that file's `describeSpawnError`/`describeExitReason` look like
the obvious home. `execFailureReason.ts`'s own head comment carries an explicit Sean-locked boundary:
_"This is NOT an error taxonomy/catalog... Provider / model API errors... must not pass through
here."_ This plan's classifier is narrowly scoped to the one 0.12.26 profile-strip shape DIA-02
names, not a general taxonomy, but growing that specific locked file was judged the wrong place to
test that boundary. A new, obviously narrow, single-purpose file keeps the diff (and the
concurrency-risk footprint against K-01) smaller too.

**Explicitly OUT of scope for this plan (do NOT touch):**

- `ProfileIsolationError`/`profilePaths.ts` — unrelated "active account profile" system, never
  touches engine stderr.
- Any renderer file — no UI/routing changes needed (verified above).
- `execFailureReason.ts` — read for pattern reference only, never edited.
- `desktopProfileSplice.ts` / K-01's project-config machinery — read-only reference; K-01 owns it.
- Core's own fix (the handoff doc's Ask 1/2/2b) — that is Core's side, tracked separately; this plan
  only makes Desktop's OWN surfacing honest with whatever Core emits today.
  </objective>

<tasks>

**Task 1 — Wave 0: write the new tests FIRST (commit `test(K-02): add RED coverage for honest wcore
start-failure surfacing`).** Author every test below against TODAY's code (before Task 2's production
edit). Can be done in parallel with / independently of K-01 landing, since it only adds test files and
one new pure, dependency-free module — nothing here touches `index.ts`.

- **New file `src/process/agent/wcore/startFailureReason.ts`.** A leaf pure module: no `fs`, no
  `child_process`, no import of `index.ts`. Head comment: states the Sean-locked-scope reasoning
  above for why this is its own file, not an extension of `execFailureReason.ts`. Exports:
  1. `export type StartFailureClass = 'stripped-config' | 'profile-resolution' | 'generic';`
  2. `PROFILE_NOT_FOUND_PATTERN` (module-private) — a regex matching Core's `Profile 'X' not found in
config` bail, case-insensitive, tolerant of either quote style (`'` or `"`), capturing the
     profile name: `/profile\s+['"]([^'"]+)['"]\s+not found in config/i`.
  3. `export function classifyStartFailureDetail(detail: string): StartFailureClass` — no match →
     `'generic'`; match where the captured name equals the REAL `WCORE_DESKTOP_MCP_PROFILE` (imported
     from `./envBuilder`, never hand-duplicated as a string literal) → `'stripped-config'`; match with
     any other captured name → `'profile-resolution'`.
  4. `export function profileStripHedge(detail: string): string` — returns `''` unless
     `classifyStartFailureDetail(detail) === 'stripped-config'`, in which case it returns a short
     parenthetical HEDGE, worded as an inference, never a certainty (per the assignment's explicit
     instruction) — e.g. something in the shape of ` (likely cause: this workspace was not trusted by
Wayland Core, so the launch profile Desktop just wrote was stripped before the engine read it
back — inferred from the profile name, not confirmed by the engine)`. Exact wording is the
     executor's call, but it MUST: (a) contain a hedge word making the inference explicit — "likely",
     "inferred", or "not confirmed" (Task 2's tests assert on this, not on the exact sentence), (b)
     contain NO word from `AUTH_FAILURE_SIGNATURES`
     (`src/renderer/pages/conversation/platforms/acp/acpAuthFailure.ts`) or from
     `isContextCeilingErrorMessage`'s two substrings (`src/renderer/utils/model/errorDetection.ts`) —
     grep both files and eyeball the new sentence against them before finalizing it, (c) contain no
     word from `redactCommandSecrets.ts`'s `KEY_VALUE_REGEX`/`CAMEL_KEY_VALUE_REGEX` keyword list
     (`api_key`, `token`, `secret`, `password`, etc.) immediately followed by `:`/`=` or a
     secret-shaped value — plain prose with no such adjacency is safe.
  5. `export function describeContractRejection(stderrDetail: string, fallbackDetail: string):
string` — this is the DIA-01 fix for the `failDesktopContract` site specifically: if
     `stderrDetail` (expected pre-redacted/pre-ANSI-stripped by the caller) is empty, return
     `` `wcore Desktop contract rejected ready: ${fallbackDetail}` `` UNCHANGED (there genuinely is no
     engine-side reason available — this is a Desktop-side contract-parsing bug, and losing that
     detail would be a regression); otherwise return `` `wcore refused to start: ${stderrDetail}
${profileStripHedge(stderrDetail)}` `` (note: this is the ONLY site that fully replaces the
     abstract phrase — the other two sites, fixed in Task 2, only ever APPEND `profileStripHedge`'s
     suffix to their existing, already-correct wording; they never call this function).
     Behavior (write these as failing/RED tests before the module exists, matching the RED-then-GREEN
     convention `desktopProfileSplice.test.ts` used for K-01):
  - `classifyStartFailureDetail`: `'generic'` for arbitrary text with no profile mention;
    `'stripped-config'` for `"Error: Profile '__wayland_desktop_session' not found in config"`;
    `'profile-resolution'` for `"Error: Profile 'my-custom-profile' not found in config"` (a
    DIFFERENT name — proves the classifier discriminates on identity, not just the phrase); double
    quote variant (`Profile "x" not found in config`) also classifies correctly.
  - `profileStripHedge`: `''` for `'generic'` and `'profile-resolution'` inputs (from the cases
    above); non-empty, hedge-worded text for the `'stripped-config'` input.
  - `describeContractRejection`: empty `stderrDetail` → exactly
    `` `wcore Desktop contract rejected ready: ${fallbackDetail}` `` (byte-exact, proves the fallback
    is untouched); non-empty generic `stderrDetail` → contains that detail AND does NOT contain the
    literal phrase `"Desktop contract rejected ready"`; non-empty `stderrDetail` naming the reserved
    profile → contains the detail AND the hedge wording.
    RED: the module does not exist; every import fails.
    Verify: `npx vitest run tests/unit/process/agent/wcore/startFailureReason.test.ts` — 0 passing (RED)
    until Task 2's module exists, matching the pattern `desktopProfileSplice.test.ts` used for K-01.
- **New file `tests/unit/process/agent/wcore/startFailureReason.test.ts`** — plain `describe`/`it`
  Vitest file, no mocks (mirror the shape of the sibling `desktopProfileSplice.test.ts` in the same
  directory: real imports only, `import { WCORE_DESKTOP_MCP_PROFILE } from
'@process/agent/wcore/envBuilder';` for the reserved-profile test case so it can never silently
  drift from the real constant). Encodes every behavior case listed above.
  Done: file committed, all assertions RED against today's code (the module does not exist yet).

**Task 2 — GREEN: wire the classifier into the three surfacing sites and prove it end to end (commit
`fix(K-02): surface engine stderr and hedge stripped-config profile failures`). Do not begin until
K-01 has landed — re-locate every anchor per the ORDERING note above before editing.**

- **Create `src/process/agent/wcore/startFailureReason.ts`** exactly as specified in Task 1, flipping
  its tests GREEN.
- **`src/process/agent/wcore/index.ts`** — add one import line near the existing
  `import { describeSpawnError, describeExitReason } from './execFailureReason';`:
  `import { describeContractRejection, profileStripHedge } from './startFailureReason';`. Then, inside
  `startWithProjectConfigLease`, three targeted edits (re-locate each by the grep in the ORDERING note
  — do not assume today's or K-01-PLAN.md's cited line numbers still apply):
  1. **`failDesktopContract`'s `!this.ready` branch.** Currently:
     `if (!this.ready) this.readyReject(new Error(\`wcore Desktop contract rejected ready:
     ${detail}\`));`. Change to compute `const stderrDetail = redactSecrets(stripAnsi(
     this.stderrTail).trim());`(same composition the exit/timeout branches already use —`stripAnsi`and`redactSecrets`are both already in scope, no new imports needed) immediately before the`if`, then reject with `describeContractRejection(stderrDetail, detail)`instead of the inline
template literal. Do NOT touch the`else` branch immediately below (the post-ready protocol-
     safety-check path) — that is a different, already-running-turn failure, out of scope for
     "an engine that refuses to START" (DIA-01's literal wording).
  2. **`spawnedChild.on('exit', ...)`.** Currently ends with:
     `this.readyReject(new Error(detail ? \`wcore ${reason} during init: ${detail}\` : \`wcore
     ${reason} during init\`));`. Append the hedge to the non-empty branch ONLY, changing it to
`` `wcore ${reason} during init: ${detail}${profileStripHedge(detail)}` `` — the empty-`detail`branch is untouched byte-for-byte (existing test`'falls back to the bare exit message when there is no stderr'` asserts an EXACT string match
     and must keep passing unmodified).
  3. **The 30-second ready-timeout `Promise`.** Currently:
     `reject(new Error(detail ? \`wcore ready timeout (30s): ${detail}\` : 'wcore ready timeout
     (30s)'));`. Same treatment: `` `wcore ready timeout (30s): ${detail}${profileStripHedge(detail)}`   `` for the non-empty branch; empty branch untouched.
Every existing`toContain(...)`assertion in`wcoreStderrSurfacing.test.ts` for these two sites
(`'wcore exited with code 1 during init'`, `'wcore ready timeout (30s)'`, etc.) must still pass
     unmodified — this plan only ever APPENDS to the exit/timeout wording, it never changes their prefix.
- **Extend `tests/unit/wcoreStderrSurfacing.test.ts`** (same `describe` block, same
  `makeChild()`/`flushUntilSpawned()` helpers already in the file) with new `it(...)` cases:
  1. **DIA-01, contract-rejection path.** Trigger `failDesktopContract` the same way
     `desktopContractV1.test.ts` line ~243 already proves triggers `malformed_json`: write a
     non-JSON-parseable first line to `child.stdout` (e.g. `'not json at all\n'`) instead of a valid
     `ready` event. Before that, write a distinctive line to `child.stderr` (e.g. `'Error: something
the engine explained\n'`). Assert the final rejection's `.message` contains
     `'something the engine explained'` and does NOT contain the literal phrase
     `'Desktop contract rejected ready'`.
  2. **DIA-01, no-regression case.** Same trigger, but write NOTHING to `child.stderr` first. Assert
     the message DOES still contain `'wcore Desktop contract rejected ready'` (the fallback path,
     proven unchanged) and contains the contract parser's own detail (`'Core emitted malformed
JSON'`, from `desktopContractV1.ts`'s `fail('malformed_json', 'Core emitted malformed JSON')`).
  3. **DIA-02, stripped-config hedge, via the exit path (the path most likely to fire for a real
     Core bail — see the objective's read-live notes).** Write
     `` `Error: Profile '${WCORE_DESKTOP_MCP_PROFILE}' not found in config\n` `` (import
     `WCORE_DESKTOP_MCP_PROFILE` — **this requires adding it to the file's existing
     `vi.mock('@process/agent/wcore/envBuilder', ...)` factory**, which today only stubs
     `buildEngineSpawnEnv`/`buildSpawnConfig`/`planVaultPassphraseDelivery`; without this addition the
     import resolves to `undefined` inside `startFailureReason.ts` too (same mocked specifier), the
     name comparison silently never matches, and this test would pass for the WRONG reason —
     **write this test, run it BEFORE adding the mock export, and confirm it fails RED (a "known
     positive" check per the milestone's verification standard) before adding
     `WCORE_DESKTOP_MCP_PROFILE: '__wayland_desktop_session'` to the mock factory to make it pass for
     the real reason**) to `child.stderr`, then `child.emit('exit', 1)`. Assert the message contains
     the profile-not-found text AND matches a hedge-word pattern (e.g. `/likely|inferred|not
confirmed/i`).
  4. **DIA-02, ordinary profile-resolution stays unhedged.** Same shape but with a different profile
     name (`Error: Profile 'some-other-profile' not found in config`). Assert the message contains
     that text and does NOT match the hedge-word pattern from case 3.
  5. **Secret redaction still holds through the new contract-rejection path.** Repeat the existing
     `'redacts high-confidence secret tokens...'` case's token (`sk-abcdef0123456789ABCDEF`) but via
     the `failDesktopContract` trigger from case 1 instead of the exit path, proving
     `describeContractRejection` receives an ALREADY-redacted `stderrDetail` (not a second redaction
     site to maintain).
- **Extend `tests/unit/WCoreManagerStartFailure.test.ts`** with one new case in the existing
  `describe('WCoreManager bootstrap failure surfaces error + finish (S2)', ...)` block, mirroring the
  existing `'masks a secret-shaped token in the surfaced start-failure reason (redaction proof)'`
  case's shape exactly: `agentStart.mockRejectedValue(new Error(...))` with a message reproducing
  `DesktopProfileSpliceError`'s REAL template (`Cannot safely update the reserved [profiles.
__wayland_desktop_session] table in the global Wayland Core config (...). Fix the file by hand
before Desktop can launch against it.`) with a `smol-toml`-style multi-line TOML-parse-context
  snippet embedding a realistic `api_key = "sk-ant-..."` line inside the `(...)` detail (mirror the
  exact shape verified by execution in the objective's item 2/3 above). Assert the leaked key
  substring does NOT appear in the emitted `error` message's `data`, and that
  `'Fix the file by hand'` DOES survive. This is a regression LOCK, not a RED case — it is expected to
  pass immediately (no production code changes this test) because `redactCommandSecrets` already
  covers this shape; say so in a comment so a future reader does not mistake it for dead/pointless
  coverage.
- **Full-suite regression check.** Run `npx vitest run` (baseline to beat: 16,231 tests, 0 failures)
  and `tsc --noEmit`. Both clean.
- **Manual UI spot-check (human, not automatable in this worktree — no live engine binary here).**
  With a real Core build reproducing the handoff doc's minimal repro
  (`.wayland-core.toml` with `[profiles.p]`, `wayland-core --profile p ...` inside an untrusted
  workspace), confirm the chat bubble shown for a Desktop-launched chat now reads the engine's own
  reason (or, if the exit path fires first, the hedged stripped-config wording) instead of "wcore
  Desktop contract rejected ready". This is a live-engine proof this worktree cannot execute; note the
  result in `K-02-SUMMARY.md` when run, or note explicitly that it was deferred and why.

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                                                                                         | Description                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wayland Core engine stderr → Desktop chat UI                                                     | untrusted-shaped process output (the engine can print anything, including a credential it read from the user's own config) now flows into a user-visible error bubble by design |
| Desktop's own composed error messages (`DesktopProfileSpliceError`, via K-01) → the same chat UI | derived from parsing the user's REAL global `config.toml`, which holds live provider API keys                                                                                   |

## STRIDE Threat Register

| Threat ID | Category                               | Component                                                                                                                | Severity | Disposition | Mitigation Plan                                                                                                                                                                                                                                                                                                                                                          |
| --------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T-K02-01  | Information disclosure                 | `failDesktopContract`'s new `stderrDetail`-based rejection                                                               | high     | mitigate    | reuses the EXISTING `redactSecrets`/`SECRET_PATTERNS` (never a new scrubber) at the exact same call shape the exit/timeout branches already prove works (`'redacts high-confidence secret tokens...'`, re-verified live in Task 1's "what I verified" section); Task 2 adds a dedicated test proving redaction survives through this specific new path (case 5).         |
| T-K02-02  | Information disclosure                 | `DesktopProfileSpliceError` (K-01) message, which can embed a raw provider key via `smol-toml`'s error-context line echo | medium   | mitigate    | verified by execution (objective, item 2/3) that the EXISTING `WCoreManager`-level `redactCommandSecrets` already masks the realistic `api_key = "..."` shape; Task 2 adds a regression-lock test so this protection cannot silently regress later. No production change needed — the risk was already mitigated, now it is proven and pinned.                           |
| T-K02-03  | Spoofing (of confidence, not identity) | `profileStripHedge`'s "stripped-config" wording                                                                          | low      | mitigate    | the hedge is REQUIRED to read as an inference ("likely", "inferred", "not confirmed"), never a certainty — Core has not confirmed the strip; Desktop is only reasoning from "this is the profile I just wrote, moments ago, and it's the only profile name that is ever passed". Task 1/2 tests assert the hedge language is present, not merely that SOME text differs. |
| T-K02-SC  | Tampering                              | supply chain (new dependency)                                                                                            | n/a      | accept      | zero new dependencies; `startFailureReason.ts` imports only `./envBuilder` (already a dependency of this module tree). Package Legitimacy Gate N/A.                                                                                                                                                                                                                      |

</threat_model>

<verification>
- `npx vitest run tests/unit/process/agent/wcore/startFailureReason.test.ts` — every case passes
  (classification, hedge, and contract-rejection composition, all three branches).
- `npx vitest run tests/unit/wcoreStderrSurfacing.test.ts` — all 26 pre-existing cases still pass
  unmodified, plus the 5 new cases from Task 2 (contract-rejection now honest; no-stderr fallback
  unchanged; stripped-config hedge present via a proven-RED-then-GREEN mock fix; ordinary
  profile-resolution stays unhedged; redaction holds through the new path).
- `npx vitest run tests/unit/WCoreManagerStartFailure.test.ts` — all pre-existing cases plus the new
  `DesktopProfileSpliceError`-shaped redaction regression lock.
- `npx vitest run` (full suite) — 0 failures against the 16,231-test baseline plus this plan's
  additions. `tsc --noEmit` clean.
- Grep gate: `src/process/agent/wcore/execFailureReason.ts` byte-identical to pre-plan HEAD (the
  Sean-locked "not a taxonomy" file is never touched); no renderer file under `src/renderer/` appears
  in `git diff --stat` for this plan.
- Manual/live: the handoff doc's minimal repro, run against a real Core binary inside an untrusted
  workspace, shows the engine's real reason (or the hedged stripped-config wording) in the Desktop
  chat bubble instead of "wcore Desktop contract rejected ready" — recorded in `K-02-SUMMARY.md` when
  performed, or explicitly flagged as deferred if this worktree has no live engine binary available.

**Goal-backward check — each acceptance maps to "the next 0.12.26-class bootstrap failure costs
minutes, from the UI alone, not an afternoon of log-diving":**

| Must be TRUE (goal)                                                                       | Producer behavior that makes it true                                                                                                                 | Proven by                                                                          |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| A contract-layer start failure shows the engine's own reason, not an abstraction (DIA-01) | `describeContractRejection` replaces the literal phrase whenever `stderrTail` is non-empty                                                           | `startFailureReason.test.ts` + `wcoreStderrSurfacing.test.ts` case 1               |
| Losing the abstraction never means losing information (DIA-01, no regression)             | `describeContractRejection` keeps the original wording when there truly is no stderr                                                                 | `startFailureReason.test.ts` + `wcoreStderrSurfacing.test.ts` case 2               |
| A stripped-config failure reads differently from an ordinary missing profile (DIA-02)     | `profileStripHedge` only fires when the captured profile name equals `WCORE_DESKTOP_MCP_PROFILE`                                                     | `startFailureReason.test.ts` + `wcoreStderrSurfacing.test.ts` cases 3 & 4          |
| The inference is never presented as fact                                                  | hedge wording is language-gated in the test assertions, not just presence-gated                                                                      | `startFailureReason.test.ts`                                                       |
| No credential ever reaches the chat bubble via any of these paths                         | dual redaction (`SECRET_PATTERNS` at the agent, `redactCommandSecrets` at the manager) proven, both by an existing pre-plan test and by two new ones | `wcoreStderrSurfacing.test.ts` case 5, `WCoreManagerStartFailure.test.ts` new case |
| No new UI surface was invented where the existing one already worked                      | zero renderer files touched                                                                                                                          | grep gate above                                                                    |

</verification>

<success_criteria>
An engine start failure that reaches `failDesktopContract` shows the engine's own (already-redacted)
stderr reason in the Desktop chat bubble in place of the literal "wcore Desktop contract rejected
ready" abstraction, with the pre-existing no-stderr fallback unchanged. Across all three
stderr-surfacing sites in `startWithProjectConfigLease`, a `Profile 'X' not found in config` bail
naming Desktop's own reserved `__wayland_desktop_session` profile is visibly hedged as a
workspace-trust-strip inference (never asserted as fact), while a bail naming any other profile
reads exactly as the engine reported it. `DesktopProfileSpliceError` (K-01) is confirmed, by an
executed regression test, to already redact embedded config secrets via the existing
`redactCommandSecrets` — no source change needed there. Zero new IPC channels, zero renderer changes,
zero new dependencies, zero regressions across the 16,231-test baseline plus this plan's additions,
`tsc --noEmit` clean. `execFailureReason.ts` untouched (Sean-locked scope respected).
</success_criteria>

<output>
Create `.planning/phases/WLD-K-core-first/K-02-SUMMARY.md` when done, recording: the new
`startFailureReason.ts` module and its three exports; the exact final wording chosen for
`profileStripHedge` (and the AUTH_FAILURE_SIGNATURES/context-ceiling/redaction-keyword collision
check performed against it); the three `index.ts` edit points and their re-located anchors (since
K-01 will have moved their line numbers); the new/extended test files and what each proves; the
full-suite result; and either the live manual-repro result or an explicit note that it was deferred
and why (no engine binary / no reproducible untrusted-workspace setup in this worktree).
</output>
