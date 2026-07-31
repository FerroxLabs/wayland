# #838 — turn completion on Gemini / NanoBot / OpenClaw / Remote

**Status: NOT BUILT. Deliberately.** The defect is real and confirmed, but the obvious fix is
actively harmful and two of the decisions it forces are Sean's, not an agent's. This is the design,
the evidence, and the two questions — so it is one sitting's work once answered.

## The defect, confirmed by count

`ConversationTurnCompletionService.getInstance().notifyPotentialCompletion` appears:

| manager | calls |
|---|---|
| `AcpAgentManager` | 2 |
| `WCoreManager` | 1 |
| `GeminiAgentManager` | **0** |
| `NanoBotAgentManager` | **0** |
| `OpenClawAgentManager` | **0** |
| `RemoteAgentManager` | **0** |

Those four call `getCostRecorder().recordTurnFinish` for accounting but never emit
`conversation.turn.completed` (the emit is `ConversationTurnCompletionService.ts:106`). So on four
of six backends the OS completion notification never fires — and, because `parentTurnDriver`,
`autonomousWatchdog` and `dispatchAutonomousStep` all advance workflow runs off that same event,
autonomous workflows cannot self-advance either.

## Why the obvious fix is worse than the bug

Adding the call the two working managers already make would, on these four backends:

**1. Mark FAILED steps done and advance AUTO workflows.** The error path emits a bare `finish` with
no error marker, so a completion notify carries the default `state: 'ai_waiting_input'`.
`WorkflowSessionService.ts:700-716` Rule 3 then applies `{status:'done', source:'worker'}` and
advances. Evidence: `openclaw/index.ts:491-494` — `case 'error': this.emitErrorMessage(...);
this.handleEndTurn(); break;` → `handleEndTurn` (`:748-760`) fires `finish`. NanoBot's catch path and
`RemoteAgentCore` do the same.

**Today those runs stall and are force-errored by the 30-minute watchdog — the safe outcome.**
The fix as drafted trades a slow correct outcome for a fast wrong one.

**2. Advance a workflow on events that are not turns at all.** `finish` is emitted outside any
active turn by transport disconnect (`RemoteAgentCore.handleClose:534-535` → `handleDisconnect:607`,
the gateway `shutdown` frame at `:248`, `openclaw/index.ts:771-778`) and by user-abort
(`openclaw/index.ts:487-489`, `case 'aborted'`). An idle websocket drop, an app quit, or the user
pressing Stop would each advance an AUTO run one step with zero work done. WCore's analogue is
turn-gated; the drafted edits are not.

## The design that is actually safe

Emit **only** on a genuine, turn-gated, successful end of turn. Do **not** emit on error, abort or
disconnect — leave those to the existing watchdog, which already parks them correctly. That keeps
today's safe behaviour on every failure path while delivering exactly what the issue asks for on the
success path.

Concretely: give the end-of-turn seam an outcome (`'ok' | 'aborted' | 'error'`) and notify only on
`'ok'`, and only when a turn was actually in flight.

## What blocks it

**Only OpenClaw has the gate.** `openclaw/index.ts` already carries `turnActive`, reset in
`handleEndTurn`, and its three call sites are cleanly separable (normal / `aborted` / `error`). The
seam there is a small change.

`NanoBotAgentManager`, `RemoteAgentCore` and `GeminiAgentManager` have **no turn-state flag** — a
grep for `turnActive` finds nothing. Introducing per-turn state into three managers is not a small
change, and getting it wrong reintroduces exactly the failure above. That is the work, and it should
be done deliberately rather than at the end of a long session.

## Two questions for Sean

**1. On a failed, aborted or disconnected turn, should an AUTO workflow park or advance?**
Today: parks (via watchdog). My recommendation: keep parking, and emit nothing on those paths. The
alternative — thread `state: 'error'` so the run parks *immediately* rather than after 30 minutes —
is better UX but a behaviour change on the workflow path, so it wants your sign-off.

**2. This turns on a new OS notification stream on four backends.** The issue asks for exactly this
("starves the notifier"), so I read it as the filed intent rather than an invention — but a plain
desktop Gemini or NanoBot chat will start ringing a banner it never rang before. Worth knowing
before it ships, not after.

## Verification this needs

Tests must assert what the event carries on the damaging paths, not merely that notify was called —
a suite that only checks the success path would pass while objection 1 is live. Required cases:
success emits; error does **not**; abort does **not**; disconnect with no turn in flight does **not**.

Regression sweep is wider than the four managers: `openClawAgentDuplicate`,
`geminiAbortHistoryRepair`, `geminiAbortRecovery`, `geminiBootstrapRejection`, `geminiMcpInjection`,
`geminiToolNameCompat`, `geminiWorkspaceEacces`, `geminiWorkspaceRecovery`,
`RemoteAgentManagement.dom` all import a changed manager, and the managers gain a transitive
`@process/services/database` + `CronBusyGuard` import.
