---
phase: WLD-D-inbox-repairs
plan: D-05
type: execute
wave: D3
depends_on: []
files_modified:
  - src/process/agent/wcore/execFailureReason.ts (new pure module)
  - src/process/agent/wcore/index.ts
  - src/process/task/WCoreManager.ts
  - tests/unit/wcoreExecFailureReason.test.ts (new unit)
  - tests/unit/WCoreManagerStartFailure.test.ts (extended)
  - tests/unit/WCoreManagerProcessExit.test.ts (extended)
autonomous: false
blocking: true
github_issue: 853
---

> **Source of truth:** `D-04-RESEARCH.md` (this single RESEARCH.md seeds both D-04/#891
> and D-05/#853; take the #853 sections — "Confirmed Root Cause — #853", "The three real
> gaps", "#853 → D-05", "Common Pitfalls", "Validation Architecture") and the locked
> guardrails in `D-CONTEXT.md`. Confidence HIGH on root cause and fix boundary; every
> file:line below was re-verified against live code at this worktree's HEAD before writing
> this plan (line numbers drift — anchor on the identifiers, not the digits). Do not
> re-derive the diagnosis; build the three narrow exec-specific captures at the sites named.

<objective>
#853 — Core/exec-level launch and process failures (AV quarantine, firewall block, missing
or unsigned binary, OS code-signature block, a mid-turn SIGKILL) surface to the user as
generic text that hides the real reason, with no way to reach the log that holds it. The
failure surface **already computes** the real reason one layer down and throws it away.

Root cause is three narrow, exec-specific gaps in `WCoreAgent` (`src/process/agent/wcore/index.ts`)
and its manager surface (`src/process/task/WCoreManager.ts`) — verified in `D-04-RESEARCH.md`
and re-confirmed live:

1. **No `childProcess.on('error')` handler exists at all.** The only `.on('error')` listeners
   in `index.ts` are `fdStream` (~:610) and `stdin` (~:694) — never on the child itself. On a
   spawn `ENOENT` (binary missing / AV-quarantined) or `EACCES`/`EPERM` (macOS signature/exec
   block), Node emits an async `'error'` event on the ChildProcess; with no listener it becomes
   an **unhandled error event** (main-process crash, or at best a bare 30s "ready timeout" with
   empty stderr). The errno is available on the event and discarded.
2. **`signal` is dropped on exit.** `spawnedChild.on('exit', (code) => …)` (~:696) ignores the
   second `signal` arg, so an AV `SIGKILL` yields `code=null` → "exited with code null" and
   hides that it was signal-killed — the single most telling AV/OS-block signal. This is dropped
   in both the exit-during-init reject (~:735) and the mid-turn `handleProcessExit` (~:1175).
3. **No discoverable log link.** Neither `emitStartFailure` (~:1205) nor `handleProcessExit`
   (~:1175) references the log file that holds the captured stderr/errno.

**Deliver (LOCKED scope — exec/process failures ONLY; Sean's call):**
- A `spawnedChild.on('error', …)` handler that captures the errno (`ENOENT`/`EACCES`/`EPERM`/…)
  and surfaces it as the real launch reason (reject `readyReject` when not yet ready; emit a
  stream `type:'error'` if already ready), routed through the existing local `redactSecrets`.
  This is also the fix that stops the unhandled 'error' event from crashing main (Pitfall 3).
- Capture `signal` in the exit path and surface it — an AV `SIGKILL` reads "killed by SIGKILL
  (likely antivirus, firewall, or OS code-signature block)", not "code null" — in the init
  reject and in `handleProcessExit`.
- Append a **discoverable logs path** to the failure surface via
  `getPlatformServices().paths.getLogsDir()` (which resolves to `app.getPath('logs')`), on both
  `emitStartFailure` and `handleProcessExit`, routed through the shared `redactCommandSecrets`.
- The errno/signal wording is a single pure module (`execFailureReason.ts`) shared by the agent
  and the manager so the two surfaces never diverge and the composition is unit-testable without
  spawning a process.

**Explicitly OUT of scope (do NOT touch):**
- Provider / model API errors. They arrive as engine stream `type:'error'` events via
  `onStreamEvent → handleEvent → ipcBridge.conversation.responseStream.emit` and **already render
  verbatim**. The Desktop-contract fail-closed path (`index.ts:622-637`) already surfaces a real
  `detail`. Leave every one of these paths byte-identical.
- Any error-code taxonomy / catalog for wcore (Sean locked scope; Pitfall 4).
- Any Core-side change — the SURFACING is entirely desktop-side; do not depend on new wcore/Core
  behavior (Core is mid-rebuild).
- The #484 stderr-tail + exit-code enrichment (init reject / ready-timeout) already in place —
  extend it with the errno/signal/log-link, do not rewrite it.

**Log-link richness decision (LOCKED by the planner, resolving research A3/Open-Q2):** ship the
logs directory as **plain text appended to the error `data`** ("Logs: <dir>"). Research A3 rates a
clickable in-chat "Open logs" button MEDIUM and no logs-dir IPC is exposed to the renderer today;
the chat error-message renderer is not a cheap single-file touch (verified — no obvious
`type:'error'` render component). Path-as-text is the guaranteed-surgical, deterministically-
testable floor that satisfies "discoverable log link" with a main-process-only change. If, while
in `WCoreManager`, the executor finds the error `data` already flows to an existing renderer
affordance that turns a path into a `shell.openPath`/`showItemInFolder` click with a trivial reuse
(no new IPC, no new component), reuse it — but do NOT invent one, and do NOT block on it. The
clickable button is captured in the deferred-work section below.

Purpose: an exec/process failure names its real reason (errno or kill signal) and points the user
at the log that holds the detail, instead of a generic string and a dead end.
Output: one new pure module + three narrow production edits + one new pure-composition test and
two extended manager tests, proven green on the full unit suite with a clean `tsc --noEmit`, and
confirmed by a packaged live-verify (rename/block the wcore binary).
</objective>

<tasks>

**Task 1 — Wave 0: write the exec-failure-reason tests FIRST (commit `test(D-05): ...`).**
Author these before touching any production file. They are the automated floor and encode the
"real reason is surfaced + a reachable log link" acceptance. Each new behavior is RED on today's
code; the pre-existing assertions stay GREEN (all new surfacing is append-only / additive-optional).

- **New file `tests/unit/wcoreExecFailureReason.test.ts`** — pure unit tests for the composition
  module (no process spawn, no mocks). Import `describeSpawnError` and `describeExitReason` from
  `@process/agent/wcore/execFailureReason`. Assert:
  1. `describeSpawnError` given an errno-shaped object with `code: 'ENOENT'` (and `syscall: 'spawn'`)
     returns a string that contains the token `ENOENT` and a human lead stating the engine could not
     be launched because the binary is missing or was blocked (antivirus / firewall / code
     signature).
  2. `describeSpawnError` with `code: 'EACCES'` contains `EACCES` and a not-executable / blocked lead;
     with `code: 'EPERM'` contains `EPERM`.
  3. `describeSpawnError` with no `code` (only a `message`) falls back to a generic launch-failure
     lead that still includes the message text (never an empty or bare string).
  4. `describeExitReason(null, 'SIGKILL')` contains `SIGKILL` and a "killed by … (likely antivirus,
     firewall, or OS code-signature block)" lead, and does NOT contain the substring `code null`.
  5. `describeExitReason(1, null)` contains `code 1`; `describeExitReason(0, null)` contains `code 0`.
  RED: the module does not exist yet (import fails). This is the composition-layer proof that
  `err.code` → errno text and `code=null + signal` → signal text (not "code null").
- **Extend `tests/unit/WCoreManagerStartFailure.test.ts`** — the `vi.mock('@/common/platform', …)`
  block currently exposes `paths: { isPackaged, getAppPath }`; add `getLogsDir: () => '/test/logs'`
  to that `paths` object (WCoreManager will call it). Add tests (mirror the existing `it(...)` +
  `findEmissions('error')` harness):
  - Reject `agentStart` with an Error whose message is a real errno launch reason (e.g. begins
    "Wayland Core could not be launched: ENOENT …") → the single emitted `type:'error'` `data`
    contains `ENOENT` AND contains `/test/logs` (the discoverable log link).
  - **Redaction proof:** reject `agentStart` with a message that embeds a fake credential of a
    recognized secret shape (an `sk-ant-`-prefixed token) → the emitted `data` masks it (does NOT
    contain the raw token), proving `redactCommandSecrets` is applied to the surfaced string.
  - Keep the three existing tests unchanged and passing (they assert the `Agent failed to start:`
    prefix and the swallow-fix behavior; the appended logs path and redaction are additive and do
    not break `toContain('wcore binary not found')` / `startsWith('Agent failed to start')`).
  RED: the errno + `/test/logs` assertion and the redaction assertion fail today (no log link, no
  redaction at the manager surface). GREEN after Task 2.
- **Extend `tests/unit/WCoreManagerProcessExit.test.ts`** — add `getLogsDir: () => '/test/logs'` to
  the same `@/common/platform` `paths` mock. Add a test that calls the private
  `handleProcessExit(null, 'msg-active-1', 'SIGKILL')` (third `signal` arg) → the emitted
  `type:'error'` `data` contains `SIGKILL` AND `/test/logs`, and does NOT contain `code null`. Keep
  every existing test unchanged and passing — the existing `handleProcessExit(1, 'msg-active-1')` and
  `handleProcessExit(null, 'msg-active-1')` calls omit the new optional `signal` arg, still surface
  `code 1` / drive `handleTurnEnd`, and the `mainError` line still contains `code=1`.
  RED: the SIGKILL-surfacing test fails today (`handleProcessExit` takes only `(code, activeMsgId)`
  and emits "code null"). GREEN after Task 2.
  Verify: `bun run test:vitest wcoreExecFailureReason` (all RED — module absent);
  `bun run test:vitest WCoreManagerStartFailure` and `bun run test:vitest WCoreManagerProcessExit`
  (new assertions RED, all pre-existing assertions GREEN).
  Done: all three test files committed as `test(D-05): ...` before any production edit; the new
  errno / signal / log-link / redaction assertions are RED.

**Task 2 — The exec-failure capture + surfacing fix (commit `fix(D-05): ...`).**
One cohesive change for #853 across a new pure module and the two production files; flips every
Task-1 assertion GREEN while keeping all pre-existing tests green. Touch ONLY the sites named.

- **New `src/process/agent/wcore/execFailureReason.ts`** — a leaf module with no imports of
  `index.ts` / `WCoreManager` (so the manager tests that mock `@process/agent/wcore` do NOT mock
  this distinct specifier, and the real helpers run). Export two pure functions:
  - `describeSpawnError(err: NodeJS.ErrnoException): string` — map `err.code` to a human lead plus
    the raw errno: `ENOENT` → engine binary is missing or was blocked (antivirus / firewall / code
    signature); `EACCES`/`EPERM` → engine binary is not executable or was blocked (antivirus / OS
    code-signature); any other / absent code → a generic "Wayland Core could not be launched" lead
    that still appends `err.message`. Always include the raw `err.code` token when present.
  - `describeExitReason(code: number | null, signal: NodeJS.Signals | null): string` — when `signal`
    is set, return "killed by <signal> (likely antivirus, firewall, or OS code-signature block)";
    otherwise return "exited with code <code>". Never emit "code null" when a signal is present.
  Add a head comment stating this is exec/process-failure surfacing only (not a taxonomy) and that
  provider/API errors are handled elsewhere. Do NOT reference secrets or redaction here — errno
  codes and signal names carry no secrets; redaction happens at the string sinks below.
- **`src/process/agent/wcore/index.ts`:**
  - Import `describeSpawnError`, `describeExitReason` from `./execFailureReason`.
  - **Add the missing child `on('error')` handler**, installed synchronously right beside the
    existing `spawnedChild.stdin?.on(...)` / `spawnedChild.on('exit', ...)` listeners (~:694) so no
    spawn 'error' can arrive before it is attached. In the handler: build the reason via
    `redactSecrets(describeSpawnError(err))` (reuse the LOCAL `redactSecrets`, `index.ts:80`); if
    `!this.ready` call `this.readyReject(new Error(reason))`; else emit
    `this.onStreamEvent({ type: 'error', data: reason, msg_id: this.activeMsgId ?? '' })`. This both
    surfaces the errno and prevents the unhandled-'error' main-process crash (Pitfall 3). Add a
    short comment: Node delivers spawn `ENOENT`/`EACCES`/`EPERM` on this event and no `exit`/`ready`
    ever fires, so this listener is the only honest surface for a launch failure.
  - **Capture `signal`:** change `spawnedChild.on('exit', (code) => …)` (~:696) to
    `(code, signal) => …`. In the exit-during-init reject (~:729-742), compose with
    `describeExitReason(code, signal)` so `code === null && signal` reads "wcore killed by
    <signal> during init" instead of "exited with code null during init", preserving the existing
    stderr-tail append (`detail`) and the "during init" framing. Pass the signal onward:
    `this._onProcessExit(code, this.activeMsgId, signal)` (~:744).
  - **Widen the option type:** `WCoreAgentOptions.onProcessExit` (~:206) becomes
    `(code: number | null, activeMsgId: string, signal?: NodeJS.Signals | null) => void`. The other
    caller (`~:1606`, transport-closed) omits `signal` (optional) — leave it unchanged. Do NOT touch
    `onProcessTerminated`, the Desktop-contract path (~:622-637), the stdout/stderr consumers, or the
    ready-timeout wording beyond what the errno/signal change requires.
  - Commit boundary note: this whole agent-side capture is the first logical half; land it and the
    manager half together as one `fix(D-05)` commit so the suite is green at the commit (the manager
    must receive the new `signal` arg for the Task-1 SIGKILL test to pass).
- **`src/process/task/WCoreManager.ts`:**
  - Import `getPlatformServices` from `@/common/platform`, `redactCommandSecrets` from
    `@/common/utils/redactCommandSecrets`, and `describeExitReason` from
    `@process/agent/wcore/execFailureReason` (a distinct specifier from the mocked
    `@process/agent/wcore`, so the real helper runs under test).
  - Add a tiny private helper that returns the redacted log-link suffix, e.g. reads
    `getPlatformServices().paths.getLogsDir()` and returns `\n\nLogs: <dir>` (guard against a missing
    accessor defensively so a platform without a logs dir degrades to no suffix, never throws).
  - **`emitStartFailure` (~:1205):** append the log-link suffix to the composed `data` and wrap the
    final user-facing string in `redactCommandSecrets`. Keep the `Agent failed to start: ${detail}`
    lead (existing test asserts the prefix). `detail` already carries the errno/signal reason from
    the agent-side reject.
  - **`handleProcessExit` (~:1175):** widen the signature to
    `(code: number | null, activeMsgId: string, signal?: NodeJS.Signals | null)`. Compose the user
    `data` as `Agent process ${describeExitReason(code, signal ?? null)}` + the log-link suffix,
    wrapped in `redactCommandSecrets` (so `code=1` still yields "…exited with code 1…", and a
    SIGKILL yields "…killed by SIGKILL…", never "code null"). Keep the `mainError` diagnostic line
    including `code=${code}` (existing test asserts `code=1`); optionally add `signal=${signal ?? 'none'}`.
  - **Forward the signal:** the `onProcessExit` wiring (~:574) becomes
    `onProcessExit: (code, activeMsgId, signal) => { this.handleProcessExit(code, activeMsgId, signal); }`.
  - Do NOT touch the provider-key auth-invalidation path, the stream `type:'error'` handling, or any
    surface that renders provider/model API errors — those are out of scope and already correct.
  Verify: `bun run test:vitest wcoreExecFailureReason` GREEN; `bun run test:vitest WCoreManagerStartFailure`
  GREEN (errno + `/test/logs` + redaction pass, existing tests still pass);
  `bun run test:vitest WCoreManagerProcessExit` GREEN (SIGKILL + `/test/logs`, no "code null"; existing
  `code 1` / heartbeat / shutdown tests still pass); `bun run test:vitest` full suite green;
  `tsc --noEmit` clean.
  Done: a spawn errno is captured on `on('error')` and surfaced (no unhandled-'error' crash); an AV
  `SIGKILL` surfaces the signal, not "code null"; both failure surfaces carry a discoverable,
  redacted logs path; provider/API-error paths and the #484 enrichment are untouched.

**Task 3 — Exit bar + live-verify handoff (human checkpoint, no code commit).**
- Full automated floor: `bun run test:vitest` (full unit suite) green, and `tsc --noEmit` clean.
  Constitution tests may flake under full-suite parallelism (pass isolated) — not a regression, per
  `D-CONTEXT.md`. Build the packaged app with `bun run package` (NEVER raw `electron-vite build`),
  then revert `src/process/services/constitution/constitutionFsAuthority.generated.ts` (the
  prepackage step regenerates it).
- Grep gate (surgical-scope proof): the only production diffs are the new `execFailureReason.ts`,
  the `on('error')` handler + `signal` capture + widened `onProcessExit` type in `index.ts`, and the
  logs-link + `describeExitReason` + `redactCommandSecrets` + signal-forwarding edits in
  `WCoreManager.ts`. Confirm the provider stream `type:'error'` path, the Desktop-contract
  fail-closed path (`index.ts:622-637`), and the ready-timeout / #484 stderr enrichment are
  byte-identical apart from the errno/signal/log-link additions.
- **Live-verify surface (orchestrator runs this by hand — Milestone D acceptance):** on the packaged
  build, simulate an exec failure — rename or `chmod 000` the bundled `wayland-core` binary (or block
  it via Gatekeeper/AV) — and send a message. Confirm the chat error **names the real reason** (an
  `ENOENT`/`EACCES` errno, or a kill `signal` if the OS `SIGKILL`s it) and shows a working, reachable
  logs path (the reason is present in the electron-log file at that path). Separately confirm a normal
  provider/model API error still renders verbatim (unchanged) — the out-of-scope path is untouched.
  Broken build = generic text / dead end; fixed build = real errno or signal + a reachable log.
  Verify: full suite + `tsc --noEmit` green; out-of-scope paths unchanged; packaged exec-failure
  names the errno/signal and the logs path resolves to the log holding the detail.
  Done: #853 symptom retired (exec/process failures surface their real reason + a reachable log
  link), provider/API errors untouched, packaged live-verify accepted by Sean + Claude. #853
  auto-closes on merge (`github_issue: 853`).

</tasks>

<threat_model>
Low surface: both edits only *display* strings the app already produces (Node errno, kill signal,
already-captured wcore stderr, the OS logs path). No new external input is parsed and no new
crypto is introduced. Trust boundary: text crossing from the main process to the chat/log surface.

| Threat ID | STRIDE | Component | Severity | Disposition | Mitigation |
|-----------|--------|-----------|----------|-------------|------------|
| T-D05-01 | Information disclosure | newly-surfaced errno / stderr-tail / spawn context could carry a provider key | medium | mitigate | The agent-side reason is composed through the LOCAL `redactSecrets` (as the #484 stderr path already is); the manager-side `data` (reason + logs path) is wrapped in the shared `redactCommandSecrets`. The redaction proof in `WCoreManagerStartFailure.test.ts` (an `sk-ant-` token is masked) locks it. |
| T-D05-02 | Tampering / Elevation | new untrusted input path | low | accept | None added — errno/signal/stderr/logs-path are app-produced, not renderer- or network-controlled (ASVS V5). No auth/session/access-control change (V2/V3/V4 not applicable). |
| T-D05-03 | Denial of service | unhandled child `'error'` event crashes the main process | high | mitigate | The `on('error')` handler is itself the fix: with no listener a spawn `ENOENT`/`EACCES` is an unhandled error event that can crash main (Pitfall 3). Installing it synchronously beside the exit listener closes that path. |
| T-D05-SC | Tampering | supply-chain (new packages) | n/a | accept | No new packages — Node builtins + existing in-repo modules (`redactCommandSecrets`, `getPlatformServices`) only. Package Legitimacy Gate N/A. |
</threat_model>

<verification>
- `bun run test:vitest` (full unit suite) green; `tsc --noEmit` clean.
- `wcoreExecFailureReason.test.ts`: `describeSpawnError` maps `ENOENT`/`EACCES`/`EPERM` to their
  errno token + a blocked/missing lead and falls back with the message when no code; `describeExitReason`
  yields the signal wording for `(null,'SIGKILL')` (no "code null") and "code N" for a numeric exit.
- `WCoreManagerStartFailure.test.ts`: an errno-shaped start rejection surfaces `ENOENT` + `/test/logs`;
  a secret-shaped token in the message is masked; the three pre-existing bootstrap-failure tests still pass.
- `WCoreManagerProcessExit.test.ts`: `handleProcessExit(null, 'msg', 'SIGKILL')` surfaces `SIGKILL` +
  `/test/logs` and never "code null"; every pre-existing exit / heartbeat / shutdown-proof test still passes.
- Grep: production diff limited to `execFailureReason.ts` (new), the `index.ts` `on('error')` + signal
  capture + widened `onProcessExit` type, and the `WCoreManager.ts` logs-link + `describeExitReason` +
  `redactCommandSecrets` + signal-forwarding edits; provider stream `type:'error'`, the Desktop-contract
  path, and the #484 enrichment otherwise byte-identical.
- Packaged live-verify: a renamed/`chmod 000`/AV-blocked wcore binary produces a chat error that names
  the errno or kill signal and a reachable logs path; a normal provider/model API error still renders verbatim.
- Independent cross-audit of the diff before any merge; LOCAL only, no push/merge without Sean.

**Goal-backward check — each acceptance test maps to "the real exec failure reason is surfaced +
reachable log link":**

| Must be TRUE (goal) | Producer behavior that makes it true | Proven by |
|---------------------|--------------------------------------|-----------|
| A spawn `ENOENT`/`EACCES`/`EPERM` names its real errno (not generic text, not a crash) | new `spawnedChild.on('error')` composes `redactSecrets(describeSpawnError(err))` and rejects/surfaces it | `wcoreExecFailureReason` tests 1-3 (composition) + `WCoreManagerStartFailure` errno test (surfaced end-to-end) |
| An AV `SIGKILL` names the signal, not "code null" | `signal` captured in `on('exit')` and composed via `describeExitReason(code, signal)` in the init reject and `handleProcessExit` | `wcoreExecFailureReason` test 4 + `WCoreManagerProcessExit` SIGKILL test (no "code null") |
| The user can reach the log that holds the detail | `emitStartFailure` + `handleProcessExit` append the redacted `getLogsDir()` path | `WCoreManagerStartFailure` (`/test/logs` present) + `WCoreManagerProcessExit` (`/test/logs` present) + packaged live-verify (path resolves to the log) |
| Newly-surfaced text never leaks a secret | agent reason via `redactSecrets`; manager `data` via `redactCommandSecrets` | `WCoreManagerStartFailure` redaction test (`sk-ant-` token masked) |
| Provider/API errors and #484 enrichment are unchanged | edits confined to the three exec-specific sites; stream `type:'error'` / Desktop-contract paths untouched | grep gate + full-suite green + live-verify (provider error still verbatim) |
| A launch failure cannot crash the main process | the `on('error')` listener exists (was absent) | `on('error')` handler present (grep gate) + packaged live-verify (blocked binary yields an error, not a crash) |
</verification>

<success_criteria>
Exec/process failures — spawn errno (`ENOENT`/`EACCES`/`EPERM`), a nonzero/`null` exit during init,
and a mid-turn kill signal (`SIGKILL`/`SIGTERM`) — surface their **real reason** in the chat error,
accompanied by a discoverable, redacted logs path that reaches the log holding the detail. The fix is
three narrow captures (a new child `on('error')` handler, `signal` capture on exit, a log-link append)
plus one shared pure composition module; provider/model API errors, the Desktop-contract path, and the
#484 stderr enrichment are untouched. Full unit suite + `tsc --noEmit` green. #853 auto-closes on merge
(`github_issue: 853`).
</success_criteria>

<deferred>
**Clickable in-chat "Open logs" link (DEFERRED, not built in this packet).** #853 is fully closed by
the path-as-text log link; a one-click affordance is a separable renderer enhancement.

Design (ready to lift when scheduled, per `D-04-RESEARCH.md` A3 / Open-Q2):
- Expose a logs-dir target to the renderer (no such IPC exists today) or attach structured metadata to
  the `type:'error'` message that the chat error-message renderer turns into an "Open logs" control.
- Reuse the existing `shell.open-folder` / `show-item-in-folder` IPCs (`ipcBridge.ts:111`) +
  `getPlatformServices().paths.getLogsDir()`; do NOT invent a new dialog.
- Keep the plain-text path as the fallback for any surface that cannot host the control.

Why deferred: the chat `type:'error'` renderer is not a cheap single-file touch (research A3 = MEDIUM,
no obvious render component found), it needs a new renderer surface + likely a new IPC, and Milestone D
mandates minimal surgical fixes. The text link satisfies the reporter's "give me a link" ask; the button
is a follow-up.
</deferred>

<output>
Write `D-05-SUMMARY.md` when the packet is live-test-accepted, recording: the new
`execFailureReason.ts` module (`describeSpawnError` / `describeExitReason`); the three production
edits (the `index.ts` child `on('error')` handler + `signal` capture + widened `onProcessExit`; the
`WCoreManager.ts` log-link + `describeExitReason` + `redactCommandSecrets` + signal-forwarding); the
new `wcoreExecFailureReason.test.ts` and the extensions to `WCoreManagerStartFailure.test.ts` /
`WCoreManagerProcessExit.test.ts` (including the `getLogsDir` mock addition); confirmation that the
provider/API-error stream path, the Desktop-contract path, and the #484 enrichment are unchanged;
full-suite + `tsc` results; the packaged live-verify evidence (which exec failure was simulated, the
errno/signal it named, and that the logs path reached the real log); the cross-audit result; and the
explicit note that the clickable "Open logs" link is deferred.
</output>
