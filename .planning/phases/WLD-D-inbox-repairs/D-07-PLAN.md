---
phase: WLD-D-inbox-repairs
plan: D-07
type: execute
wave: D4
depends_on: []
files_modified:
  - src/process/services/workflow/workflowAdvanceReset.ts (new — extracted, testable reset-aware send + carry-forward bound constant)
  - src/process/utils/initBridge.ts (rewire sendWorkflowDirective to delegate to the reset module)
  - src/process/task/agentTypes.ts (add workflowResetSeed to BuildConversationOptions)
  - src/process/task/workerTaskManagerSingleton.ts (thread workflowResetSeed into the wcore creator)
  - src/process/task/WCoreManager.ts (WCoreManagerData field + bounded seed in start())
  - tests/unit/process/services/workflow/workflowAdvanceReset.test.ts (new unit)
  - tests/unit/resumeSeedTranscript.test.ts (extended — carry-forward bound contract)
autonomous: false
blocking: true
github_issue: 723
---

> **Source of truth:** `D-07-RESEARCH.md` (Confidence HIGH; root cause + intervention point
> re-verified against live code at this worktree's HEAD `57d8dcee6`) and the locked guardrails in
> `D-CONTEXT.md`. Every file:line below was re-anchored on its identifier before this plan was
> written — line numbers drift, so the executor anchors on the named symbol, not the digit. Do NOT
> re-derive the diagnosis; build the single-seam in-place reset at the sites named. Sean RECONFIRMED
> the architecture: **IN-PLACE PER-STEP CONTEXT RESET** — a hard reset of the model-input context per
> step, **NOT a rolling summary, NOT compaction**.

<objective>
#723 — an in-conversation multi-step workflow re-sends the whole transcript to the model on every
step. Each advance directive lands in the **same live backend agent session**, which replays turns
`1..N-1` to the model on step `N`, so per-step model input grows `O(N)` and the whole run costs
`O(N²)` input tokens (a money bug on the default wcore/Flux path). The autonomous path does not have
this problem because `dispatchAutonomousStep.ts` spawns a fresh child conversation (fresh backend
session) per step, so each step is `O(1)`.

Root cause (verified end-to-end in `D-07-RESEARCH.md`, re-confirmed live): the advance HAND
`sendWorkflowDirective` (`initBridge.ts:287-295`) reuses the CACHED live backend session via
`workerTaskManager.getOrBuildTask(conversationId, { yoloMode: true })` with **no `skipCache`**, then
`task.sendMessage({ … hidden: true })`. The chain is `turnCompleted` (`initBridge.ts:407`) →
`handleParentWorkflowTurn` advance (`parentTurnDriver.ts:142-144`) → `continueRun` directive
(`WorkflowSessionService.ts:782-783`) → this HAND. `composeStepContext.ts` only PREPENDS an ≤8 KB
control block (`conversationBridge` send path); it never resets anything.

The fix is **desktop-side and Core-independent** — every seam already exists and is already used in
production:
- **Reset lever:** `getOrBuildTask(conversationId, { skipCache: true })` kills the accumulated
  backend session and respawns a fresh one (`WorkerTaskManager.getOrBuildTask` at `:95`; `skipCache`
  → `_buildAndCache` → `addTask` kills the old process at `:152-161`). Precedent:
  `TeamSessionService.ts:1624` already rebuilds a task this way.
- **Bounded seed:** on respawn, `WCoreManager.start()` takes its `--resume` branch and re-seeds the
  fresh engine from the DB via `buildResumeSeedTranscript((history.data ?? []) …)` (`WCoreManager.ts`
  seed block, ~`:615-626`), which already accepts `{ maxChars, maxMessages, perEntryChars }`
  (`resumeSeed.ts:136-159`). A **tight** bound makes the seed carry only the immediately-prior step's
  output — the minimal carry-forward — instead of the full replay.
- **Timing:** the fresh `WCoreManager` constructor kicks off `this.agentReady = this.start()`
  (`~:339`) and the send path awaits `this.agentReady` before sending (`~:736`), so the fresh session
  is seeded before the directive lands (research Pitfall 5 — handled by the existing gate; the
  executor must PRESERVE it, not bypass it).
- **Separability (no blocker):** the visible transcript is desktop SQLite (`getConversationMessages`;
  advance directives sent `hidden: true` so the control prompt never enters the chat tape); the model
  input is the backend session, re-seeded from the DB on spawn. Respawning the session changes only
  what the model sees next step; it does not touch the visible thread. `[VERIFIED: codebase read]`

**Deliver (LOCKED scope):**
- Reroute the single advance HAND so a **workflow-advance send on a wcore conversation** respawns the
  backend session (`skipCache: true`) with a **carry-forward-bounded seed**, then sends the directive
  `hidden: true` exactly as today. Extract the reset-aware send into one small **testable module**
  (`workflowAdvanceReset.ts`) that `sendWorkflowDirective` delegates to, so the reset is unit-provable
  without spawning a process. Template = `dispatchAutonomousStep`'s directive-only `composeDirective`,
  applied **in-place on the same `conversation_id`** (not a new conversation).
- Thread a `workflowResetSeed` bound through `BuildConversationOptions` → the wcore creator →
  `WCoreManagerData` → `WCoreManager.start()`, where it tightens `buildResumeSeedTranscript` to the
  prior step's output. Absent the flag, seeding is byte-identical to today.
- **Minimal carry-forward contract (Sean's hard-reset envelope):** step `N`'s reset seed =
  [the immediately-prior step's final assistant output, bounded from the DB] + [the
  `Proceed to step N…` directive, already built at `WorkflowSessionService.ts:782-783`] + [the
  `composeStepContext` block, already prepended in the send path — current step body + transitions
  tape]. NOT the full `1..N-1` transcript, NOT a rolling summary.

**LOCKED scope decision — v1 is wcore/Flux only; ACP is a tracked follow-on (research Pitfall 2 /
A2, option b):** the reset (`skipCache` + `workflowResetSeed`) fires **only when the conversation's
agent type is `wcore`** — the money-critical default path. For any non-wcore (ACP: codex/claude/qwen)
conversation the HAND keeps today's exact behavior (`getOrBuildTask(convId, { yoloMode: true })`, no
respawn). Rationale: the money bug is worst on wcore/Flux; ACP respawn resumes the CLI's own session
(re-accumulation on `session/load` is unverified — a wcore DB-seed bound does not apply to it) and a
cold ACP restart per step costs latency with no proven token win. Widen to ACP only after the live
sweep shows workflows running on ACP agents. The wcore gate is explicit and unit-tested.

**Explicitly OUT of scope (do NOT touch):**
- The directive builder (`WorkflowSessionService.ts:782-783` and the sibling `:909-910`),
  `composeStepContext.ts`, and the whole autonomous-dispatch path (already `O(1)` — it is the
  template, not the target). Leave every one byte-identical.
- Any rolling-summary / compaction approach (Sean explicitly rejected — hard reset only).
- The Core-side tail-cap (separate Core issue; defense-in-depth). Nothing here depends on new Core
  behavior — Core is mid-rebuild.
- ACP reset behavior (deferred per the scope decision above).

Purpose: an in-conversation multi-step workflow's per-step model input stops climbing with step
index — `O(N²)` → `O(N)` run input tokens, `O(1)` per step — while dependent steps still see the
prior deliverable and the user still sees the full visible thread.
Output: one new pure/injectable module + one carry-forward bound constant + four narrow production
edits + one new unit test and one extended seed-bound test, proven green on the full unit suite with a
clean `tsc --noEmit`, and confirmed by a packaged live-verify measuring `session_cost` per step.
</objective>

<tasks>

**Task 1 — Wave 0: write the reset tests FIRST (commit `test(D-07): ...`).**
Author these before touching any production file. They are the automated floor and encode the
three-part acceptance: **step-`N` input is bounded (reset happened + seed carry-forward only) AND the
visible transcript is intact AND dependent steps still work (the prior deliverable is carried
forward).** The `hidden: true` directive and the fact that the reset path only READS the message
store (never writes/deletes it) are the automated proxies for "visible transcript intact"; the
`getOrBuildTask({ skipCache: true })` call plus the bounded seed are the automated proxy for the token
drop.

- **New file `tests/unit/process/services/workflow/workflowAdvanceReset.test.ts`** — pure unit tests
  for the extracted reset-aware send module (no process spawn). Import the reset-send function and the
  exported `WORKFLOW_RESET_SEED_BOUND` constant from
  `@process/services/workflow/workflowAdvanceReset`. Drive it with an injected fake dependency bag: a
  `getOrBuildTask` spy returning a task whose `sendMessage` is a spy, a `getConversationType` spy, and
  a message-store spy exposing a `deleteMessage`/`updateMessage`-shaped surface that MUST NOT be
  called. Assert:
  1. **wcore advance respawns with the bound:** when `getConversationType` returns `wcore`, the module
     calls `getOrBuildTask(convId, …)` with `skipCache: true` AND `workflowResetSeed` deep-equal to
     `WORKFLOW_RESET_SEED_BOUND`, and preserves `yoloMode: true`.
  2. **directive still sent hidden:** `task.sendMessage` is called once with the directive as
     `content`/`input` and `hidden: true` — the control prompt never enters the visible transcript.
  3. **scope gate (ACP untouched):** when `getConversationType` returns `acp` (or any non-`wcore`
     type), `getOrBuildTask` is called with NO `skipCache` and NO `workflowResetSeed` — today's exact
     behavior — and the directive is still sent `hidden: true`.
  4. **visible transcript untouched:** across both branches, no message-mutation surface
     (delete/update conversation message) is ever invoked — the reset only respawns + seeds + sends
     hidden.
  5. **type-lookup failure is safe:** when `getConversationType` throws/returns null, the module falls
     back to the non-reset send (no `skipCache`) rather than crashing the advance (a launch failure
     must not break the parent chat).
  RED: the module does not exist yet (import fails). This is the seam-level proof that a wcore advance
  respawns with a bounded carry-forward seed while the visible thread is left alone.
- **Extend `tests/unit/resumeSeedTranscript.test.ts`** — add a describe block locking the
  carry-forward contract. Build a fixture of `N=5` step deliverables as left/text messages
  (`step 1 output` … `step 5 output`) plus interleaved tool rows, then assert:
  - `buildResumeSeedTranscript(messages, WORKFLOW_RESET_SEED_BOUND)` (import the constant from
    `@process/services/workflow/workflowAdvanceReset`) yields a seed that CONTAINS the last step's
    output text and does NOT contain the step-1 or step-2 output text — the seed is the immediately
    prior deliverable, not the `1..N-2` history. (Char/count-bounded assertion, the automated proxy
    for the per-step token drop.)
  - The existing default-bound behavior (`buildResumeSeedTranscript(messages)` with no opts) is
    unchanged — the tighter bound is opt-in and does not regress the #457 default seed.
  GREEN immediately for the mechanism (`buildResumeSeedTranscript` already accepts opts) once the
  constant exists; it is the regression guard that pins the carry-forward envelope. Keep every
  pre-existing #457 assertion unchanged and passing.
  Verify: `bun run test:vitest workflowAdvanceReset` (all RED — module absent);
  `bun run test:vitest resumeSeedTranscript` (new carry-forward block RED only on the missing
  constant import, existing #457 assertions GREEN).
  Done: both test files committed as `test(D-07): ...` before any production edit; the new reset +
  carry-forward assertions are RED (module/constant absent), all pre-existing assertions GREEN.

**Task 2 — The in-place per-step reset (commit `fix(D-07): ...`).**
One cohesive change for #723 across a new module and four production files; flips every Task-1
assertion GREEN while keeping all pre-existing tests green. Two logical halves (the send-seam reset
and the WCoreManager bounded-seed threading) land as ONE commit so the suite is green at the commit.
Touch ONLY the sites named.

- **New `src/process/services/workflow/workflowAdvanceReset.ts`** — a leaf module with no imports of
  `initBridge` (so it is unit-testable in isolation). Export:
  - `WORKFLOW_RESET_SEED_BOUND` — the carry-forward bound constant `{ maxMessages: 4, maxChars: 4000 }`
    (Claude's discretion per research Open-Q1: 4 tail messages + a 4 KB cap reliably captures the
    immediately-prior step's assistant deliverable plus any trailing tool rows; this is the STARTING
    value, tunable in the live sweep — widen only if a dependent step starves).
  - `sendWorkflowAdvanceDirective(conversationId, directive, deps)` — the reset-aware HAND. `deps` is
    an injected bag: `getOrBuildTask(id, opts)`, `getConversationType(id) => Promise<string | null>`.
    Behavior: resolve the conversation type (guarded — on throw/null, treat as non-wcore); if the type
    is `wcore`, call `getOrBuildTask(conversationId, { yoloMode: true, skipCache: true, workflowResetSeed: WORKFLOW_RESET_SEED_BOUND })`
    (respawn + bounded seed); otherwise call `getOrBuildTask(conversationId, { yoloMode: true })`
    (today's behavior — ACP untouched). Then `await task.sendMessage({ content: directive, input: directive, msg_id: \`workflow-advance-${conversationId}-${Date.now()}\`, hidden: true })` in BOTH
    branches. Add a head comment: this is the in-place per-step reset — it respawns the wcore backend
    session to drop accumulated `1..N-1` context and re-seeds only the immediately-prior deliverable;
    it is not a rolling summary; the visible SQLite transcript is untouched because the directive is
    sent hidden and the reset only reads the message store. Do NOT reference the autonomous path here.
- **`src/process/utils/initBridge.ts` (`sendWorkflowDirective`, `:287-295`):** replace the inline
  `getOrBuildTask` + `sendMessage` body with a thin delegation to
  `sendWorkflowAdvanceDirective(conversationId, directive, deps)`, injecting the real
  `workerTaskManager.getOrBuildTask` bound to `workerTaskManager`, and a `getConversationType` backed
  by `conversationServiceImpl.getConversation(id)` returning `conv?.type ?? null` (the same
  `conversationServiceImpl` already in scope at `isAutonomousChild` `:381`). Keep the surrounding
  comment that the send is `hidden` so the control prompt never appears in the chat tape. The three
  callers of this HAND — `parentTurnDriver` (`:411`), `acceptStep` via `initWorkflowBridge` (`:301`),
  and boot-resume `resumeInterruptedParentRuns` (`:422`) — are all step advances and all inherit the
  reset with no change to their call sites.
- **`src/process/task/agentTypes.ts` (`BuildConversationOptions`, `:13-18`):** add an optional
  `workflowResetSeed?: { maxMessages: number; maxChars: number }` field with a doc line: when present,
  the wcore spawn seeds only this tail bound (per-step hard reset for #723) instead of the default
  resume seed. Leave `yoloMode` / `skipCache` unchanged.
- **`src/process/task/workerTaskManagerSingleton.ts` (wcore creator, `:74-81`):** thread the new
  option into `WCoreManagerData` exactly as `yoloMode` is threaded — add
  `workflowResetSeed: opts?.workflowResetSeed` to the object passed to `new WCoreManager({ ...c.extra, conversation_id: c.id, yoloMode: opts?.yoloMode, … }, c.model)`. Do NOT alter the gemini/acp creators.
- **`src/process/task/WCoreManager.ts`:**
  - Add `workflowResetSeed?: { maxMessages: number; maxChars: number }` to the `WCoreManagerData` type
    (`~:139`) beside `yoloMode`/`effort`.
  - In the resume-seed block (`~:615-626`), when `mergedData.workflowResetSeed` is set, call
    `buildResumeSeedTranscript((history.data ?? []) as TMessage[], mergedData.workflowResetSeed)` so
    the fresh session is seeded with only the bounded carry-forward; when absent, keep the current
    `buildResumeSeedTranscript((history.data ?? []) as TMessage[])` default call byte-for-byte (the
    #457 seed for normal resumes). Do NOT change the `sessionArgs` new-vs-resume decision (`~:405-416`),
    the `injectConversationHistory` channel, or the `this.agentReady = this.start()` /
    `await this.agentReady` readiness gate (`~:339` / `~:736`) — that gate is what guarantees the fresh
    session is seeded before the directive lands (Pitfall 5). Leave `session_cost` (`~:1584-1587`)
    untouched; it is the live-sweep measurement hook.
  Verify: `bun run test:vitest workflowAdvanceReset` GREEN (wcore respawns with the bound + hidden
  send; ACP branch has no skipCache; no message mutation; type-failure falls back safely);
  `bun run test:vitest resumeSeedTranscript` GREEN (carry-forward block passes, #457 defaults
  unchanged); `bun run test:vitest parentTurnDriver` and `bun run test:vitest workflowContinueRunAdvance`
  and `bun run test:vitest WorkflowSessionService` GREEN unchanged (the directive builder and the
  advance decision are untouched); `bun run test:vitest` full suite green; `tsc --noEmit` clean.
  Done: a wcore workflow advance respawns the backend session (`skipCache`) and re-seeds only the
  immediately-prior deliverable (bounded); the directive is still sent hidden so the visible transcript
  is untouched; ACP is untouched (scope gate); the directive builder, `composeStepContext`, and the
  autonomous path are byte-identical.

**Task 3 — Exit bar + live-verify handoff (human checkpoint, no code commit).**
- Full automated floor: `bun run test:vitest` (full unit suite) green and `tsc --noEmit` clean; the
  a11y gate `bun run test:e2e:a11y` green at the wave merge. Constitution tests may flake under
  full-suite parallelism (pass isolated) — not a regression, per `D-CONTEXT.md`. Build the packaged app
  with `bun run package` (NEVER raw `electron-vite build` — it skips the prepackage hook and the
  packaged app crashes on launch), then revert
  `src/process/services/constitution/constitutionFsAuthority.generated.ts` (the prepackage step
  regenerates it).
- Grep gate (surgical-scope proof): the only production diffs are the new `workflowAdvanceReset.ts`,
  the `sendWorkflowDirective` delegation in `initBridge.ts`, the `workflowResetSeed` field in
  `agentTypes.ts`, the one-line thread in the wcore creator in `workerTaskManagerSingleton.ts`, and the
  `WCoreManagerData` field + the conditional bounded-seed call in `WCoreManager.ts`. Confirm the
  directive builder (`WorkflowSessionService.ts:782-783` / `:909-910`), `composeStepContext.ts`, the
  autonomous-dispatch path, and the gemini/acp creators are byte-identical.
- **Live-verify surface (orchestrator runs this by hand — Milestone D acceptance, MONEY):** on the
  packaged build, run a real ≥4-step in-conversation workflow on the default wcore/Flux agent where a
  later step depends on an earlier step's output (e.g. "draft X" then "now refine the draft you just
  wrote"). Confirm all three properties:
  1. **step input is bounded** — via `session_cost` (or the provider dashboard), per-step input tokens
     stay flat/bounded (`O(1)` per step) instead of climbing with step index (`O(N)`); the run total
     stops being `O(N²)`.
  2. **dependent steps still work** — the refine step correctly references the prior deliverable, so
     the carry-forward is intact (not starved).
  3. **visible transcript intact** — the chat still shows every step's output, full thread, in order.
  A regressed build would either keep climbing (no reset), break the dependent step (carry-forward
  too tight), or drop visible steps (touched the wrong store). Note respawn-per-step latency during the
  sweep (research Pitfall 3 — precedent shows it is acceptable; a blocker only if a step visibly
  stalls).
  Verify: full suite + `tsc --noEmit` + a11y green; out-of-scope paths byte-identical; packaged
  live-verify shows bounded per-step `session_cost`, a working dependent step, and the full visible
  thread.
  Done: #723 symptom retired (in-conversation multi-step per-step input is `O(1)`, run `O(N)`), the
  carry-forward contract holds, the visible transcript is intact, and the packet is live-test-accepted
  by Sean + Claude. #723 auto-closes on merge (`github_issue: 723`). LOCAL only — no push/merge
  without Sean.

</tasks>

<threat_model>
Low surface: no new I/O, no new packages, no new external inputs. The reset re-injects the
conversation's own prior model/agent output as the fresh session's seed and respawns an existing
backend session via an already-prod-used lever. Trust boundary: the carry-forward text crossing from
the desktop DB back into the fresh backend session context.

| Threat ID | STRIDE | Component | Severity | Disposition | Mitigation |
|-----------|--------|-----------|----------|-------------|------------|
| T-D07-01 | Information disclosure | carry-forward seed re-injects prior agent/model output as the fresh session context | low | accept | Same content the model already produced in the SAME conversation — no new trust boundary crossed. `buildResumeSeedTranscript` already clips/guards each entry (`resumeSeed.ts:40-42, 146-156`). No new mitigation; keep the seed sourced from the conversation's own persisted output only. |
| T-D07-02 | Tampering | seed sourced from the wrong conversation could inject cross-conversation context | low | mitigate | `WCoreManager.start()` reads history strictly from `this.conversation_id` (`~:618`); the reset never seeds from another conversation. The unit test drives a single `conversationId` end to end. |
| T-D07-03 | Denial of service | respawn-per-step cold start could stall a run | low | mitigate | Reset gated to wcore only; the `this.agentReady`/`await this.agentReady` gate (`~:339`/`~:736`) is preserved so a directive never lands before the fresh session is ready; precedent (`TeamSessionService.ts:1624`, the autonomous per-step spawn) proves the pattern acceptable; the live sweep flags any visible stall (Pitfall 3). A type-lookup failure falls back to the non-reset send, never crashing the advance. |
| T-D07-SC | Tampering | supply-chain (new packages) | n/a | accept | No new packages — Node builtins + existing in-repo modules (`getOrBuildTask`, `buildResumeSeedTranscript`, `conversationService`) only. Package Legitimacy Gate N/A. |
</threat_model>

<verification>
- `bun run test:vitest` (full unit suite) green; `tsc --noEmit` clean; `bun run test:e2e:a11y` green at wave merge.
- `workflowAdvanceReset.test.ts`: a wcore advance calls `getOrBuildTask` with `skipCache: true` +
  `workflowResetSeed === WORKFLOW_RESET_SEED_BOUND` and sends the directive `hidden: true`; a non-wcore
  advance has no `skipCache`/`workflowResetSeed` and still sends hidden; no message-store mutation in
  either branch; a type-lookup failure falls back to the non-reset send.
- `resumeSeedTranscript.test.ts`: `buildResumeSeedTranscript(steps1..5, WORKFLOW_RESET_SEED_BOUND)`
  contains the last step's output and excludes step-1/step-2 output; the default-bound seed is unchanged.
- `parentTurnDriver` / `workflowContinueRunAdvance` / `WorkflowSessionService` tests pass unchanged
  (the advance decision and directive builder are untouched).
- Grep: production diff limited to the new `workflowAdvanceReset.ts`, the `sendWorkflowDirective`
  delegation, the `BuildConversationOptions.workflowResetSeed` field, the wcore-creator thread, and the
  `WCoreManager` field + conditional bounded-seed call; directive builder, `composeStepContext`, the
  autonomous path, and gemini/acp creators byte-identical.
- Packaged live-verify: a ≥4-step wcore workflow shows bounded per-step `session_cost`, a working
  dependent step, and the full visible thread.
- Independent cross-audit of the diff before any merge; LOCAL only, no push/merge without Sean.

**Goal-backward check — each acceptance test maps to "step N input is bounded AND the visible
transcript is intact AND dependent steps still work":**

| Must be TRUE (goal) | Producer behavior that makes it true | Proven by |
|---------------------|--------------------------------------|-----------|
| Step `N` model input is bounded (`O(1)` per step, not `1..N-1` replay) | wcore advance respawns the session (`getOrBuildTask({ skipCache: true })`) dropping accumulated context, and seeds only the bounded carry-forward | `workflowAdvanceReset` test 1 (skipCache + bound on wcore) + `resumeSeedTranscript` carry-forward block (seed excludes `1..N-2`) + packaged live-verify (`session_cost` flat per step) |
| Dependent steps still work (carry-forward intact) | the reset seed carries the immediately-prior step's final assistant output via `buildResumeSeedTranscript(…, WORKFLOW_RESET_SEED_BOUND)` | `resumeSeedTranscript` carry-forward block (last step's output present) + packaged live-verify (refine step references the prior deliverable) |
| The visible transcript is intact after N resets | the directive is sent `hidden: true` and the reset path only READS the message store (respawn + seed), never writes/deletes it | `workflowAdvanceReset` tests 2 + 4 (hidden send, no message mutation) + packaged live-verify (full thread shown) |
| ACP is not disturbed (scope boundary) | the reset fires only when the conversation type is `wcore`; every other type keeps today's send | `workflowAdvanceReset` test 3 (non-wcore has no skipCache/bound) |
| A launch/type-lookup failure cannot break the parent chat | a type-lookup throw/null falls back to the non-reset send; `parentTurnDriver` still parks a failed send | `workflowAdvanceReset` test 5 (safe fallback) + existing `parentTurnDriver` park-on-send-failure test (unchanged) |
| The directive builder, `composeStepContext`, and the autonomous path are unchanged | edits confined to the send seam + the seed threading | grep gate + full-suite green + `WorkflowSessionService`/`workflowContinueRunAdvance` tests unchanged |
</verification>

<success_criteria>
An in-conversation multi-step workflow on the default wcore/Flux path advances with an **in-place
per-step context reset**: each advance respawns the backend session to drop the accumulated `1..N-1`
context and re-seeds only the immediately-prior step's output (the minimal carry-forward), so per-step
model input is `O(1)` and the run is `O(N)` instead of `O(N²)`. Dependent steps still see the prior
deliverable; the user-visible SQLite transcript still shows every step (directives sent hidden, the
reset only reads the store). ACP backends are untouched in v1 (tracked follow-on). No rolling summary,
no compaction, no Core dependency. Full unit suite + `tsc --noEmit` + a11y gate green, and a packaged
live-verify confirms bounded per-step `session_cost` with an intact thread and working dependent steps.
#723 auto-closes on merge (`github_issue: 723`).
</success_criteria>

<deferred>
**ACP-backend per-step reset (DEFERRED, tracked follow-on).** v1 scopes the reset to wcore/Flux (the
money-critical default). ACP agents (codex/claude/qwen) respawn resumes the CLI's own session, so the
wcore DB-seed bound does not apply and a `skipCache` respawn may re-accumulate via the CLI's session
reload (research Pitfall 2 / A2 — unverified). To extend later: at the reset boundary force a genuinely
NEW ACP session (not a resume/`session/load`) rather than a bounded DB seed, and confirm against
`AcpAgentManager` session-id persistence. File as a fast follow if the live sweep shows workflows
running on ACP agents.

**Carry-forward widening (tunable, not a code change).** `WORKFLOW_RESET_SEED_BOUND` starts at the
immediately-prior deliverable (`{ maxMessages: 4, maxChars: 4000 }`). If the live sweep shows a
dependent step starving (needs the last TWO deliverables), widen the bound — a constant tweak, no
structural change (research Open-Q1).

**Explicit `workflow.step_context_reset` telemetry event (DEFERRED, optional).** The reset is already
observable via the existing `session_cost` event (`WCoreManager.ts:1587`). A dedicated telemetry event
carrying the seed size would make the token win first-class in the usage log; not required to close
#723.
</deferred>

<output>
Write `D-07-SUMMARY.md` when the packet is live-test-accepted, recording: the new
`workflowAdvanceReset.ts` module (`sendWorkflowAdvanceDirective` + `WORKFLOW_RESET_SEED_BOUND`); the
four production edits (the `sendWorkflowDirective` delegation in `initBridge.ts`; the
`BuildConversationOptions.workflowResetSeed` field; the wcore-creator thread in
`workerTaskManagerSingleton.ts`; the `WCoreManagerData` field + conditional bounded-seed call in
`WCoreManager.ts`); the new `workflowAdvanceReset.test.ts` and the extended `resumeSeedTranscript.test.ts`;
confirmation that the directive builder, `composeStepContext`, the autonomous path, and the gemini/acp
creators are unchanged; the explicit wcore-only scope decision and the ACP deferral; full-suite + `tsc`
+ a11y results; the packaged live-verify evidence (the workflow run, the per-step `session_cost` shape
proving `O(1)` per step, that the dependent step saw the prior deliverable, and that the full visible
thread rendered); and the cross-audit result. LOCAL only — no push/merge without Sean.
</output>
