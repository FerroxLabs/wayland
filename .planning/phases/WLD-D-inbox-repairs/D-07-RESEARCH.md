# Phase D-07 (#723): In-conversation multi-step token efficiency — Research

**Researched:** 2026-07-24
**Domain:** Workflow auto-advance context assembly (Electron main-process, TypeScript), agent-backend session lifecycle
**Confidence:** HIGH (root cause + intervention point re-verified against live code at HEAD `57d8dcee6`)
**Issue:** #723 — in-conversation multi-step workflows re-send the whole transcript every step (money bug)

## Summary

The in-conversation workflow auto-advance path sends each next-step directive into the **same live
backend agent session**. The backend (wcore engine / ACP CLI) holds every turn of that session and
replays turns `1..N-1` to the model on step `N`, so per-step model input grows `O(N)` and the whole
run costs `O(N²)` input tokens. `composeStepContext.ts` only *prepends* an ≤8 KB control block — it
never resets anything. The autonomous path does not have this problem because
`dispatchAutonomousStep.ts` spawns a **fresh child conversation (and therefore a fresh backend
session) per step**, so each step's model input is `O(1)`.

Sean's confirmed architecture — **in-place per-step context reset** (a hard reset of the model
input per step, not a rolling summary) — is implementable **entirely desktop-side and
Core-independent** using seams that already exist and are already used in production:
`workerTaskManager.getOrBuildTask(id, { skipCache: true })` kills the accumulated backend session
and respawns a fresh one, and `buildResumeSeedTranscript(...)` (already bounded) controls what that
fresh session is seeded with. The **visible transcript** (desktop SQLite, `getConversationMessages`,
rendered by the renderer) is a **separate store** from the **model input** (backend session context,
re-seeded from the DB on spawn). Resetting the backend session does **not** touch the visible thread
— confirmed by `WCoreManager.start()` seeding the engine from the DB as an explicit, separable step,
and by the ACP replay-suppression gate. **There is no blocker: model input and visible transcript
are separable desktop-side.**

**Primary recommendation:** In the single advance HAND — `sendWorkflowDirective`
(`initBridge.ts:287`) — for workflow-advance sends only: (1) respawn the conversation's backend
session with `getOrBuildTask(conversationId, { skipCache: true })` to drop accumulated context, (2)
seed the fresh session with only the **minimal carry-forward** (the immediately-prior step's final
output), not the full `1..N` history, then (3) send the step directive. Mirror the autonomous path's
directive-only composition (`composeDirective`), but keep it on the **same `conversation_id`** so the
user-visible thread is untouched.

<user_constraints>
## User Constraints (from D-CONTEXT.md + Sean's reconfirmed architecture)

### Locked Decisions
- **Architecture (RECONFIRMED by Sean):** IN-PLACE PER-STEP CONTEXT RESET — a hard reset of the
  model input context per step. **NOT a rolling summary.** The reset applies to what is **sent to
  the model** (the context-window input), and must **not** destroy the visible conversation the user
  sees.
- **Desktop-only, Core-independent.** wayland-core is mid-rebuild; nothing in this packet may depend
  on new/changed Core behavior. The Core-side tail-cap Sean mentioned is **defense-in-depth on the
  Core side and out of scope for this desktop packet** (#723 is the desktop fix).
- **LOCAL only** — no push/merge/release without Sean. Never touch `/Users/seandonahoe/dev/wayland/app`.
- Stamp `github_issue: 723` in the PLAN.md frontmatter so it auto-closes on merge.
- Full Factory loop: research → plan → build → independent cross-audit → full unit suite
  (`bun run test:vitest`) + a11y gate → live-verify → ship.
- Build discipline: always `bun run package`, never raw `npx electron-vite build`; revert
  `src/process/services/constitution/constitutionFsAuthority.generated.ts` after any package build.
  American spelling. No AI signatures in commits/PRs.

### Claude's Discretion
- The exact granularity of the carry-forward seed (last assistant turn vs. a step-scoped DB slice)
  and the exact seam for threading a "bounded-reset spawn" flag into `WCoreManager.start()`.
- Whether to scope v1 to the wcore/Flux backend (the money-critical default) or also force a
  new-session reset for ACP backends in the same packet (see Continuity Safety / Pitfalls).

### Deferred Ideas (OUT OF SCOPE)
- Core-side tail-cap (separate Core issue).
- Any rolling-summary / compaction approach (explicitly rejected by Sean — hard reset only).
- Changing the autonomous-dispatch path (already `O(1)`; it is the template, not the target).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| #723 | In-conversation multi-step workflows re-send the whole transcript every step; per-step cost grows unboundedly | Confirmed accumulation chain (below); reset intervention point at `sendWorkflowDirective`; Core-independent lever via `skipCache` respawn + bounded seed; separability proof; test plan |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Deciding when to advance a step | Main-process workflow service (`continueRun`) | — | Already owns the run state machine |
| Sending the next-step directive | Main-process HAND (`sendWorkflowDirective`) | — | Single choke point for advance sends |
| Holding/replaying model context | Agent backend (wcore engine / ACP CLI) | — | Backend owns the session context window |
| Seeding a fresh backend session | Main-process (`WCoreManager.start` → `buildResumeSeedTranscript`) | Desktop SQLite (source of seed) | Desktop controls what the fresh engine sees |
| Storing/rendering the visible transcript | Desktop SQLite + renderer | — | Separate store from model context |

**Key tier fact:** the model-input context is owned by the **backend agent process**, and the
desktop's only Core-independent levers over it are (a) respawn the session (drop it) and (b) control
the seed the fresh session is rebuilt from. Both are main-process, desktop-only seams.

## Confirmed Accumulation Call-Chain (Q1) — file:line

The in-conversation auto-advance path, end to end:

1. **`initBridge.ts:407-414`** — registers the parent driver on `turnCompleted`:
   ```
   ipcBridge.conversation?.turnCompleted?.on?.((event) => {
     void handleParentWorkflowTurn(event, { service, isAutonomousChild, sendDirective: sendWorkflowDirective, getLastAgentText });
   });
   ```
2. **`parentTurnDriver.ts:102-158` `handleParentWorkflowTurn`** — on a terminal turn, calls the brain
   `deps.service.continueRun(session.id, …)` (`:136`); on `decision === 'advance' && directive`, calls
   `deps.sendDirective(conversationId, directive)` (`:144`) into the **same conversation**.
3. **`WorkflowSessionService.continueRun` (`WorkflowSessionService.ts:624`)** — the brain. On advance
   it flips the next step `todo→now` and builds the directive at **`:782-783`**:
   ```
   const directive = shouldSend && target
     ? `Proceed to step ${target.n}: ${target.title}\n\n${target.body_excerpt}`.trim() : null;
   ```
   This directive is small and bounded. **It is not the problem.**
4. **`sendWorkflowDirective` (`initBridge.ts:287-295`)** — the HAND. It reuses the **cached live
   backend session** (no `skipCache`) and sends the directive `hidden`:
   ```
   const task = await workerTaskManager.getOrBuildTask(conversationId, { yoloMode: true });
   await task.sendMessage({ content: directive, input: directive, msg_id: `workflow-advance-…`, hidden: true });
   ```
5. **`conversationBridge.ts:715-731`** — before send, `composeStepContext(session)`
   (`composeStepContext.ts:63`) is **prepended** to `other.input`. That block is capped at 8 KB
   (`MAX_BODY_BYTES`, `composeStepContext.ts:22`) and carries the current step body + a transitions
   tape. **It only prepends; it never resets.**
6. **The backend replays `1..N-1`.** `task.sendMessage` targets the *existing live* backend session:
   - **wcore** (`WCoreManager.ts`): the engine session is keyed by `conversation_id`
     (`WCoreManager.ts:412`) and keeps its running turn history in-process; each directive appends a
     turn and the whole session is re-sent to the model. Comment at `WCoreManager.ts:1057` confirms
     turns accumulate in "engine session history."
   - **ACP** (`AcpAgentManager.ts`): the CLI process holds the session; resumed via `session/load`
     replay (`:161-163`).

**Quantified.** Step `N` sends today: full accumulated backend session (turns `1..N-1`) + the
≤8 KB step-context block + the directive ≈ **`O(N)`**. Across the whole run: `Σ_{k=1..N} O(k)` =
**`O(N²)`** input tokens. What step `N` *needs* is: the directive + the current step body (already in
`composeStepContext`) + the immediately-prior step's output = **`O(1)`** per step, **`O(N)`** run
total. `[VERIFIED: codebase read of the listed files at HEAD 57d8dcee6]`

## Model-Input vs Visible-Transcript Separation (Q2) — NOT a blocker

These are two distinct stores, and the fix operates on the first while leaving the second intact:

- **Visible transcript = desktop SQLite.** Rendered by the renderer via
  `db.getConversationMessages(conversationId, …)` (e.g. `initBridge.ts:395`, `WCoreManager.ts:410,618`).
  Advance directives are sent **`hidden: true`** (`initBridge.ts:293`), so the control prompt never
  appears in the chat tape — only the agent's actual step output is persisted and shown.
- **Model input = backend session context.** For wcore it is (re)built from the DB **only on
  (re)spawn** via an explicit, separable injection:
  ```
  // WCoreManager.ts:609-626 (on resume)
  const history = historyDb.getConversationMessages(this.conversation_id, 0, 10000);
  const text = buildResumeSeedTranscript((history.data ?? []) as TMessage[]);
  if (text) await agent.injectConversationHistory(text);
  ```
- **Proof they are decoupled:** the DB→engine seed is a discrete step the desktop fully controls, and
  ACP explicitly **suppresses re-inserting replayed turns as new SQLite rows** during `session/load`
  replay (`AcpAgentManager.ts:1207-1214`). The backend's model context and the desktop's DB transcript
  are independent by construction.

**Conclusion:** resetting/respawning the backend session changes only what the model sees on the
next step; the SQLite transcript (and therefore the user-visible thread) is untouched.
`[VERIFIED: codebase read]`

## The Reset Design (Q3) — Core-independent intervention point

**Lever (already exists, already used in prod):**
`workerTaskManager.getOrBuildTask(id, { skipCache: true })` (`WorkerTaskManager.ts:95-131`). With
`skipCache`, `addTask` (`:152-161`) **kills the old agent process** before publishing the fresh one
— dropping the accumulated live context. Precedent: `TeamSessionService.ts:1624` already rebuilds an
agent task this way (`getOrBuildTask(agent.conversationId, { skipCache: true })`).

**Why respawn alone is not enough — you must also bound the seed.** On respawn,
`WCoreManager.start()` (`:405-416`) sees the conversation has DB messages → takes the `--resume`
branch → re-seeds the fresh engine from the DB via `buildResumeSeedTranscript`. That seed is
**already bounded** (last 60 messages / 8 KB — `resumeSeed.ts:27-28`), so a bare respawn already
caps context to ~8 KB (a large win over an unbounded live session). For a **true per-step hard
reset**, seed only the immediately-prior step's output by passing tighter opts:
`buildResumeSeedTranscript(msgs, { maxMessages, maxChars })` (`resumeSeed.ts:136-159`), threaded via
a build/conversation flag understood by `WCoreManager.start()`.

**Intervention point (single, surgical): `sendWorkflowDirective` (`initBridge.ts:287`).** It is the
one HAND for advance sends — shared by `parentTurnDriver` (`initBridge.ts:411`), by `acceptStep`
(`workflowBridge.ts:209-222`), and by boot-resume (`resumeRuns.ts:132`). For a **workflow-advance**
send, change it to:
1. `getOrBuildTask(conversationId, { skipCache: true })` — respawn a fresh backend session.
2. Ensure `WCoreManager.start()` seeds that session with the **carry-forward only** (bounded
   `buildResumeSeedTranscript`), not the full replay.
3. `task.sendMessage({ … directive …, hidden: true })` as today.

**Template to mirror:** `dispatchAutonomousStep.ts` — `composeDirective` (`:79-90`) sends a fresh
child agent **only** the step directive (`stepN`, `title`, `bodyExcerpt`); the child conversation is
brand new so its backend session is `O(1)`. The in-conversation fix reproduces that isolation on the
**same `conversation_id`** (in-place) via `skipCache` respawn + bounded seed, instead of a new
conversation. `[VERIFIED: codebase read]`

## Continuity Safety — the minimal carry-forward contract (Q4)

**What the autonomous template carries forward today: nothing but the directive.** `composeDirective`
(`dispatchAutonomousStep.ts:79-90`) passes only `stepN`, `title`, `bodyExcerpt`. There is **no
prior-step output, no handoff, no summary.** This works for the autonomous path because each
autonomous step is a self-contained deliverable ("Produce concrete deliverables… report your output
as Markdown"), with no assumed dependency on a prior step's result. `[VERIFIED: codebase read]`

**Why the in-conversation path needs more than the autonomous path carries.** In an in-conversation
workflow, step `N` legitimately references step `N-1`'s result (e.g. "now refine the draft you just
wrote"). A pure directive-only reset (matching autonomous) would break those dependent steps.

**Minimal carry-forward contract (recommended):** the reset seed for step `N` =
- the **immediately-prior step's final assistant output** (the deliverable) — bounded, retrieved
  from the DB. The existing `getLastAgentText(conversationId)` helper (`initBridge.ts:392-406`) already
  pulls "the agent's most recent non-user text reply," and `buildResumeSeedTranscript` bounded to the
  tail is the general form; **plus**
- the step directive (`Proceed to step N…`, already built at `WorkflowSessionService.ts:782-783`); **plus**
- the `composeStepContext` block (already prepended in `conversationBridge.ts:721`), which carries
  the current step body **and** the whole transitions tape (`composeStepContext.ts:78-81`) — i.e. the
  model still sees *which* steps ran and their status, just not their full text.

That is **not** a rolling summary (Sean's hard-reset constraint holds) and **not** the full
`1..N-1` transcript — it is exactly the last handoff plus the step control block. Anything a step
needs beyond the prior deliverable is out of the hard-reset envelope by design; the visible transcript
still shows the user everything.

## Token Savings Shape (Q5)

- **Today:** step `k` input ≈ `O(k)` (turns `1..k-1` replayed) → run total `Σ_{k=1..N} k` = **`O(N²)`**.
- **After reset:** step `k` input ≈ `O(1)` (carry-forward + directive + ≤8 KB step block) → run
  total **`O(N)`**.
- **Even the bare-respawn floor** (no carry-forward tightening) caps per-step context at the
  `buildResumeSeedTranscript` bound (≤8 KB / 60 msgs), i.e. `O(1)` per step, `O(N)` run — the tighter
  carry-forward seed just makes the constant smaller.
- **Prompt-caching note:** a growing prefix does not make growth free — cache *reads* still scale with
  context size and accumulate across steps (`O(N²)` cache-read tokens over the run), and provider
  hopping can defeat caching entirely (see memory: `token-burn-flux-auto-cache-defeat`). The reset
  removes the accumulation regardless of cache behavior.

**Measurement hook to prove it:** the usage layer already records per-turn cost — wcore emits a
`session_cost` event (`WCoreManager.ts:1587`) and `UsageEventLogger` (`dispatchAutonomousStep.ts:266`
pattern) records workflow telemetry. Assert bounded `input_tokens`/context size per advance in a
unit/integration test and/or emit a `workflow.step_context_reset` telemetry event carrying the seed
size, so the money win is observable in the live sweep.

## Core Tail-Cap Confirmation (Q6)

- The Core-side tail-cap Sean referenced is **Core-side and out of scope for this desktop packet**.
  #723's desktop fix stands alone.
- **The desktop reset does not depend on any new Core behavior.** Every seam it uses already exists in
  the desktop codebase: `getOrBuildTask(..., { skipCache: true })` (`WorkerTaskManager.ts`),
  `buildResumeSeedTranscript` (`resumeSeed.ts`), `injectConversationHistory`
  (`WCoreManager.ts:622`, `src/process/agent/wcore/index.ts:1564`). It works against the **currently
  bundled** engine (new-session-vs-resume + `init_history` seeding are existing engine features, not
  new APIs). **Core-independent — confirmed.** `[VERIFIED: codebase read]`

## Test / Acceptance Plan (Q7)

**What is unit-testable (the core assertion):** after `N` advances, the composed **model-input seed**
for step `N` does **not** contain step `1..N-2` content (message-count / char-count bound), while the
**visible transcript** (`getConversationMessages`) still returns all `N` steps unchanged.

Existing workflow test files to extend (all under `tests/unit/process/services/workflow/` unless noted):

| File | Role in this packet |
|------|---------------------|
| `parentTurnDriver.test.ts` | Extend: on `decision === 'advance'`, assert the HAND respawns with `{ skipCache: true }` before send (mock `workerTaskManager`). Existing harness at `:23-59` builds `turn()`/`session()` fixtures. |
| `workflowContinueRunAdvance.test.ts` | Extend: brain still advances correctly; directive unchanged. Uses the in-memory mock-repo harness (no native sqlite). |
| `WorkflowSessionService.test.ts` | Directive composition regression (`:782-783`). |
| `dispatchAutonomousStep.test.ts` | Reference the `O(1)` template; assert the in-conversation reset reaches parity. |
| `tests/unit/process/task/` (resumeSeed) | Add: `buildResumeSeedTranscript(msgs, { maxMessages, maxChars })` bounded to the last step's output yields a seed with no earlier-step text. |
| `workflowBridge.test.ts` | `acceptStep` (step-mode) advance also routes through the reset HAND. |

**Assertion shapes:**
- Seam test at `sendWorkflowDirective` / `handleParentWorkflowTurn`: with a mock `workerTaskManager`,
  assert `getOrBuildTask(convId, { skipCache: true })` is called on advance, and that the seed passed
  to the fresh session excludes earlier-step content (message/char bound).
- Purity/separation test: after simulating `N` advances, `getConversationMessages(convId)` returns all
  `N` steps (visible transcript intact) while the model-input seed is bounded.

**Acceptance (Sean + Claude live-test):** run a real ≥4-step in-conversation workflow on the packaged
build; confirm (a) each step still produces correct, continuous output (dependent steps see the prior
deliverable), (b) the visible chat shows the full thread, and (c) per-step token/cost stops climbing
with step index (telemetry or provider dashboard). Full suite `bun run test:vitest` + a11y gate green.

## Recommended Change Surface (for the planner)

| File | Change |
|------|--------|
| `src/process/utils/initBridge.ts` (`sendWorkflowDirective`, `:287`) | For workflow-advance sends: `skipCache: true` respawn + request a carry-forward-bounded seed, then send. |
| `src/process/task/WCoreManager.ts` (`start`, `:405-626`) | Honor a "bounded-reset spawn" flag: seed via `buildResumeSeedTranscript` bounded to the prior step's output instead of the full replay. |
| `src/process/task/resumeSeed.ts` | (Likely no change — already accepts `{ maxChars, maxMessages }`; may add a helper to slice to the last step.) |
| `src/process/task/agentTypes.ts` (`BuildConversationOptions`) | Possibly thread the reset/seed-bound flag through build options. |
| Tests | Extend the files in the table above. |

Keep it minimal and surgical (AGENTS.md §3). The directive builder, `composeStepContext`, and the
autonomous path stay unchanged.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dropping accumulated backend context | A custom "context trimmer" or message-window manager | `getOrBuildTask(id, { skipCache: true })` | Existing, prod-used respawn that kills+rebuilds the session cleanly |
| Rebuilding the fresh session's context | A new seed serializer | `buildResumeSeedTranscript(..., { maxChars, maxMessages })` | Already handles text + tool/file-edit history, per-entry caps, malformed-row guards |
| Injecting the seed into the engine | A new IPC/protocol call | `agent.injectConversationHistory(text)` (`WCoreManager.ts:622`) | Existing `init_history` channel |
| Getting the prior deliverable | A new query | `getLastAgentText` (`initBridge.ts:392`) / DB slice | Already used by the #123 prose-question guard |

## Common Pitfalls

### Pitfall 1: Respawn without bounding the seed
**What goes wrong:** `skipCache` respawn alone still hits `WCoreManager.start()`'s `--resume` branch,
which re-seeds from the DB. The default bound is 60 msgs / 8 KB — better than unbounded, but if the
last several steps' text fits in that window you have not achieved a true per-step hard reset.
**Avoid:** thread a tighter, step-scoped seed bound for workflow auto-run.

### Pitfall 2: ACP backends re-accumulate on respawn via `session/load`
**What goes wrong:** for ACP agents (codex/claude), a respawn resumes the CLI's own session
(`AcpAgentManager.ts:161-163`) and re-loads its full history — the wcore DB-seed bounding does not
apply. **Avoid:** for ACP, force a **new** session (not `session/load`) at the reset boundary, or
scope v1 to the wcore/Flux default (the money-critical path) and file ACP as a follow-on. Decide
explicitly in the plan.

### Pitfall 3: Respawn latency per step
**What goes wrong:** cold-starting the engine every step adds latency. **Context:** the autonomous
path already spawns a fresh session per step, and `TeamSessionService` already `skipCache`-rebuilds,
so the pattern is proven acceptable — but flag it for the live sweep and consider whether the fresh
session can be warmed before the directive lands.

### Pitfall 4: Breaking a dependent step by carrying nothing
**What goes wrong:** copying the autonomous path literally (directive-only, zero carry-forward)
breaks steps that reference the prior result. **Avoid:** carry the immediately-prior step's output
(the minimal contract above).

### Pitfall 5: Timing — respawn must complete before the directive send
**What goes wrong:** `getOrBuildTask` returns the task synchronously after `factory.create`, but the
backend `start()`/bootstrap is async. Sending the directive before the fresh session is ready can
drop or misorder it. **Avoid:** ensure the fresh session is ready (awaited/handshaked) before
`task.sendMessage`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The wcore engine replays its full running session to the model each turn (standard chat-completion semantics), so a live multi-step session grows `O(N)` | Q1 / Q5 | If the engine already caps its own context server-side, the desktop win is smaller — but the desktop reset is still correct and Core-independent. Verify in the live sweep via token telemetry. |
| A2 | For ACP backends, a `skipCache` respawn resumes the prior CLI session (re-accumulates) unless a new session is forced | Pitfall 2 | If ACP respawn already starts fresh, no extra ACP work is needed. Confirm against `AcpAgentManager` session-id persistence during planning. |

*All other claims in this document are `[VERIFIED: codebase read at HEAD 57d8dcee6]`.*

## Open Questions

1. **Carry-forward granularity** — last assistant turn vs. a step-boundary DB slice?
   - Known: `getLastAgentText` and a tail-bounded `buildResumeSeedTranscript` both work.
   - Unclear: whether some workflows need the last *two* deliverables.
   - Recommendation: start with the immediately-prior step's output; widen only if the live sweep
     shows a dependent step starving.
2. **v1 backend scope** — wcore-only or wcore + ACP?
   - Recommendation: wcore/Flux first (the money-critical default), ACP as a fast follow if the live
     sweep shows workflows running on ACP agents.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest |
| Config file | `vitest.config.ts` (repo root) |
| Quick run command | `bun run test:vitest tests/unit/process/services/workflow/parentTurnDriver.test.ts` |
| Full suite command | `bun run test:vitest` (a.k.a. `npm test`, ~2 min; expect the known constitution-flake under parallelism) |

### Phase Requirements → Test Map
| Req | Behavior | Test Type | Automated Command | File |
|-----|----------|-----------|-------------------|------|
| #723 | Advance path respawns backend session (`skipCache`) before send | unit | `bun run test:vitest tests/unit/process/services/workflow/parentTurnDriver.test.ts` | extend `parentTurnDriver.test.ts` |
| #723 | Step-`N` model-input seed excludes step `1..N-2` content | unit | `bun run test:vitest tests/unit/process/task/` | new/extend resumeSeed test |
| #723 | Visible transcript unchanged after N resets | unit | same as above | assert `getConversationMessages` returns all steps |
| #723 | Directive composition unchanged | unit | `bun run test:vitest tests/unit/process/services/workflow/workflowContinueRunAdvance.test.ts` | extend |

### Sampling Rate
- **Per task commit:** the single extended workflow test file.
- **Per wave merge:** full `bun run test:vitest` + `bun run test:e2e:a11y`.
- **Phase gate:** full suite green + Sean+Claude live-test on the packaged build.

### Wave 0 Gaps
- None — existing workflow test infrastructure (`tests/unit/process/services/workflow/*`) and the
  in-memory mock-repo harness cover this phase. New assertions extend existing files.

## Security Domain

Low surface — no new I/O, no new packages, no new external inputs. One relevant note:
- **V5 Input Validation / prompt-injection:** the carry-forward seed is prior model/agent output
  re-injected as the fresh session's context. This is the *same* content the model already produced
  in the same conversation (no new trust boundary crossed), and `buildResumeSeedTranscript` already
  clips/guards each entry (`resumeSeed.ts:40-42, 146-156`). No new mitigation required, but keep the
  carry-forward sourced from the conversation's own persisted output, never from an unrelated
  conversation.

## Sources

### Primary (HIGH confidence)
- Live code at HEAD `57d8dcee6`, worktree `~/dev/wayland-worktrees/desktop-integration`:
  `parentTurnDriver.ts`, `WorkflowSessionService.ts`, `composeStepContext.ts`,
  `dispatchAutonomousStep.ts`, `runDriver.ts`, `conversationBridge.ts`, `initBridge.ts`,
  `WCoreManager.ts`, `AcpAgentManager.ts`, `WorkerTaskManager.ts`, `resumeSeed.ts`,
  `TeamSessionService.ts`, and the `tests/unit/process/services/workflow/*` suite.
- `D-CONTEXT.md`, `HANDOFF-2026-07-23-milestone-D-inbox-repairs.md` (D4 section), `D-05-PLAN.md`
  (plan-format reference).

## Metadata

**Confidence breakdown:**
- Accumulation root cause: HIGH — traced end-to-end with file:line.
- Reset intervention + Core-independence: HIGH — every seam exists and is prod-used (`skipCache`
  respawn at `TeamSessionService.ts:1624`; DB seed at `WCoreManager.ts:609-626`).
- Model-input vs visible-transcript separability: HIGH — confirmed by the explicit DB→engine seed and
  the ACP replay-suppression gate. **No blocker.**
- Carry-forward contract: MEDIUM — the mechanism is verified; the exact granularity is a design call
  best confirmed in the live sweep.
- ACP re-accumulation on respawn: MEDIUM (A2) — verify during planning.

**Research date:** 2026-07-24
**Valid until:** ~2026-08-23 (stable desktop area; re-anchor line numbers to identifiers, they drift)

## RESEARCH COMPLETE

- **Confirmed accumulation call-chain:** `turnCompleted` (`initBridge.ts:407`) →
  `handleParentWorkflowTurn` (`parentTurnDriver.ts:102`, advance send `:144`) →
  `continueRun` directive (`WorkflowSessionService.ts:782-783`) → `sendWorkflowDirective`
  (`initBridge.ts:287`, **reuses cached live session, no `skipCache`**) → `task.sendMessage` into the
  **same backend session**, which replays turns `1..N-1` to the model. `composeStepContext.ts` only
  prepends an ≤8 KB block, never resets. Step `N` = `O(N)`; run = `O(N²)`.
- **Exact reset intervention point:** `sendWorkflowDirective` (`initBridge.ts:287`) — the single HAND
  for advance sends. For workflow advances: `getOrBuildTask(convId, { skipCache: true })` (respawn,
  drop accumulated context) + a carry-forward-bounded `buildResumeSeedTranscript` seed in
  `WCoreManager.start()`, then send. Template = `dispatchAutonomousStep`'s directive-only
  `composeDirective`, applied **in-place on the same `conversation_id`**.
- **Minimal carry-forward contract:** step `N` keeps only [immediately-prior step's final output]
  + [the `Proceed to step N…` directive] + [the `composeStepContext` block: current step body +
  transitions tape]. Not the full `1..N` history, not a rolling summary.
- **Model-input vs visible-transcript separation:** visible = desktop SQLite
  (`getConversationMessages`, directives sent `hidden:true`); model input = backend session re-seeded
  from the DB on spawn (`WCoreManager.ts:609-626`), with ACP replay-suppression (`:1207-1214`)
  proving the two stores are decoupled. Resetting the session does not touch the visible thread.
- **Token-savings shape:** `O(N²)` → `O(N)` input tokens over the run; `O(1)` per step. Measurable
  via `session_cost` (`WCoreManager.ts:1587`) / a `workflow.step_context_reset` telemetry event.
- **Test plan:** extend `parentTurnDriver.test.ts` (assert `skipCache` respawn on advance),
  `workflowContinueRunAdvance.test.ts`, `WorkflowSessionService.test.ts`, `resumeSeed` bound test,
  `workflowBridge.test.ts`; core assertion = after N advances the step-`N` seed excludes step
  `1..N-2` content while `getConversationMessages` returns all N steps.
- **BLOCKER:** none. Model input and visible transcript **are** separable desktop-side, and the reset
  is **Core-independent** (all seams already exist and are prod-used). Two flagged risks with options:
  (1) ACP backends may re-accumulate on respawn via `session/load` → force a new session for ACP or
  scope v1 to wcore/Flux; (2) respawn-per-step latency → precedent (`TeamSessionService`, autonomous
  path) shows it is acceptable, confirm in the live sweep.
