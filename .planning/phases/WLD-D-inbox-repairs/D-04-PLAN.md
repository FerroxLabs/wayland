---
phase: WLD-D-inbox-repairs
plan: D-04
type: execute
wave: D3
depends_on: []
files_modified:
  - src/renderer/pages/settings/components/IjfwSetupStatus.tsx
  - tests/unit/renderer/settings/IjfwSetupStatus.dom.test.tsx (extend)
autonomous: false
blocking: true
github_issue: 891
---

> **Source of truth:** `D-04-RESEARCH.md` (root cause traced end-to-end at HEAD, this
> worktree, all file:line re-verified against live code before writing) and the locked
> guardrails in `D-CONTEXT.md`. Confidence HIGH on root cause and fix boundary. Do NOT
> re-derive the diagnosis — this is a renderer-side discard, not a missing capability.
>
> **Verified before planning (live code, this tree):**
>
> - `IjfwInvokeResult` (`common/types/ijfw.ts:53-55`) carries `error?` + `errorReason?` on
>   the `ok:false` arm — the reason is already on the wire.
> - `ijfwMcpClient` ALREADY returns the structured reason on every failure path
>   (`ijfwMcpClient.ts:118-119, 187, 194-198, 226, 417-418, 479-480`) and ALREADY logs each
>   one main-side (`:194, :352, :355, :358, :375, :387, :397, :406`, secret-redacted). No
>   main-side logging gap exists.
> - `ijfwBridge.ts` is a thin pass-through — the reason crosses the IPC bridge intact.
> - The producer contract is ALREADY pinned by existing tests: `ijfwMcpClient.test.ts:592-612`
>   asserts a `-32601` "method not found" reply → `{ ok:false, error:'method not found',
errorReason:'mcp_error' }` — the exact #891 vector (older MCP server missing `ijfw_state`).
>   So D-04 does NOT touch the client or its test; it fixes the ONE consumer that throws the
>   reason away.
> - `IjfwSetupStatus.tsx` reads only `r?.ok` and renders hard-coded strings in BOTH the mount
>   probe (`:83-88` → runtime-row `warn` detail `:132-135`, `'Degraded (not reachable)'`) and
>   the Test button (`:146-147` → fail text `:221-223`, `'Memory did not respond. Check the
install status above.'`). That discard is the whole bug.
> - No `127.0.0.1:37891` / HTTP health daemon exists in `src` (0 grep hits). The reporter's
>   "check the daemon on 37891" premise is WRONG — the stdio MCP probe already targets the
>   authoritative surface (what runtime memory actually uses). Do NOT add an HTTP probe.

<objective>
#891 — the Memory settings "Setup status" panel shows a hard-coded **"Degraded (not
reachable)"** on the runtime row, and a fixed **"Memory did not respond. Check the install
status above."** on the Test button, whenever the IJFW MCP probe fails — with **no reason**,
even though the failing probe already returned the exact reason. The reporter (correctly, from
their vantage) says the failure is unlogged with no cause surfaced; the cause is present in the
electron-log and on the IPC result, but the renderer discards it.

Root cause is a **renderer-side discard**, verified end-to-end (see the source-of-truth block):
`ipcBridge.ijfw.brainInvoke.invoke({ verb: 'state' })` returns a structured
`IjfwInvokeResult` whose `ok:false` arm carries `error` + `errorReason`. `IjfwSetupStatus.tsx`
reads only `r?.ok` in the mount probe (`:83-88`) and the Test handler (`:146-147`), then renders
two hard-coded strings — the `error`/`errorReason` are dropped on the floor in both places.

Deliver (LOCKED fix boundary — renderer-only, one component + its DOM test): thread
`error`/`errorReason` from the probe result into (a) the runtime-row `warn` detail (`:132-135`)
and (b) the Test-button fail text (`:221-223`), so each shows the REAL reason instead of the
bare label. Keep the probe transport, target verb (`state`), and probe timing **unchanged** — no
new detection, no second probe, no HTTP daemon, no main-side change. Main-side logging already
exists (grep-verified); confirm it, do not duplicate it. Tests are written FIRST (Task 1,
red→green). The exit bar is a green full unit suite + clean `tsc --noEmit`, with the packaged-app
live-verify surface handed to the orchestrator.

Purpose: a Degraded memory runtime becomes self-diagnosing — the user (and support) see WHY it
is degraded (e.g. `mcp_error: method not found: ijfw_state`, `timeout`, `spawn_error`), which is
exactly what turns the reporter's "it lies" false-negative into a truth on first live repro.
Output: a renderer-layer reason-surfacing change + extended DOM tests, proven green on the full
suite and confirmed by a packaged live-verify.

**Scope decision (explicit):** Threading the reason into the two surfaces fully closes #891 and
is the entire buildable scope of this packet. The research's optional **probe-verb alignment**
(switching the `state` probe to a `memory_*` read so "reachable" asserts the path runtime memory
actually uses, eliminating the `ijfw_state`-missing false negative) is a SEPARABLE follow-up: it
changes what "reachable" _means_, is MEDIUM-risk, and the research recommends deciding it only
after the honest reason confirms the live vector. Per Milestone D's minimal-surgical-fix
guardrail it is **DEFERRED** here (captured in `<deferred>` so the follow-up is actionable). Ship
the exact #891 fix — surface the reason — do not widen the blast radius.
</objective>

<context>
@.planning/phases/WLD-D-inbox-repairs/D-04-RESEARCH.md
@.planning/phases/WLD-D-inbox-repairs/D-CONTEXT.md
@src/renderer/pages/settings/components/IjfwSetupStatus.tsx
@src/common/types/ijfw.ts
@tests/unit/renderer/settings/IjfwSetupStatus.dom.test.tsx
</context>

<tasks>

**Task 1 — Wave 0: write the reason-surfacing DOM tests FIRST (commit `test(D-04): ...`).**
Author these before touching `IjfwSetupStatus.tsx`. They are the automated floor that pins "a
failing probe renders its real reason, not a bare label" and guard the no-reason fallback.

- **Extend `tests/unit/renderer/settings/IjfwSetupStatus.dom.test.tsx`** — reuse the existing
  harness exactly: the hoisted `brainInvoke` mock, the `react-i18next` mock (note: its `t`
  returns `opts.defaultValue` verbatim and does **not** interpolate `{{...}}`, so assert the
  reason via a substring/regex text match, never an interpolated key), and the `@/common` mock.
  Add:
  1. **Mount probe surfaces the real reason (the #891 fix).** `brainInvoke.mockResolvedValue({
ok: false, error: 'method not found: ijfw_state', errorReason: 'mcp_error' })`, render with
     `status='installed_current'`. After the probe settles, the runtime row
     (`ijfw-status-item-runtime`) has `data-status='pending'` (warn) AND its rendered text
     contains `method not found: ijfw_state`. RED on today's code (renders only the bare
     `Degraded (not reachable)`); GREEN after Task 2.
  2. **Reason falls back to the `errorReason` code when `error` is absent.**
     `mockResolvedValue({ ok: false, errorReason: 'timeout' })`, installed → runtime-row text
     contains `timeout`. RED today; GREEN after Task 2. (Locks that a code-only failure is still
     honest.)
  3. **No-reason fallback preserved (regression guard).** `mockResolvedValue({ ok: false })`
     (no `error`, no `errorReason`), installed → runtime row is still `data-status='pending'`
     and renders a sensible non-empty degraded label (the existing bare string is acceptable);
     no crash. GREEN before AND after (proves the change is additive).
  4. **Reject path unchanged (regression guard).** `mockRejectedValue(new Error('boom'))`,
     installed → runtime row `data-status='pending'`, no crash. GREEN before and after (mirrors
     the existing "marks the runtime row pending when the mount probe rejects" test).
  5. **Test button surfaces the real reason.** `mockResolvedValue({ ok: false, error: 'method
not found: ijfw_state', errorReason: 'mcp_error' })`, click `ijfw-settings-test-button` →
     `ijfw-settings-test-result` has `data-result='fail'` AND its text contains `method not
found: ijfw_state` (not the fixed "Memory did not respond" string). RED today; GREEN after.
  6. **Test-button no-reason fallback preserved (regression guard).**
     `mockResolvedValue({ ok: false })`, click → `data-result='fail'` and the existing fixed
     fail string still renders. GREEN before and after.
  - Keep every existing test green — the happy-path `ok:true` runtime='ok'/`Live` and Test
    `pass` assertions must not move (this change only enriches the failure branches).
- **Do NOT modify `ijfwMcpClient.ts` or `ijfwMcpClient.test.ts`.** The producer contract this
  fix consumes is already locked (`ijfwMcpClient.test.ts:592-612` → `-32601` yields
  `errorReason:'mcp_error'`; `:225` timeout; `:517` isError→mcp_error). Confirm it stays green as
  a no-regression check; add nothing.
  Verify: `bun run test:vitest tests/unit/renderer/settings/IjfwSetupStatus.dom.test.tsx` — the
  reason tests (1, 2, 5) RED, the fallback/regression tests (3, 4, 6) and all pre-existing tests
  GREEN.
  Done: the extended DOM test file is committed as `test(D-04): ...` before any production edit;
  the reason-surfacing assertions are RED.

**Task 2 — Renderer fix: thread `error`/`errorReason` into the runtime row + Test-fail text
(commit `fix(D-04): ...`).**
Renderer-only, in `src/renderer/pages/settings/components/IjfwSetupStatus.tsx`. Keep the probe
transport, verb (`state`), gating (`installOk`), and timing byte-for-byte unchanged.

- **Capture the reason, not just a boolean.** Where the mount probe currently sets
  `setRuntimeReachable(!!r?.ok)` (`:83-88`), also capture the failure reason: prefer `r.error`,
  else the `r.errorReason` code, else undefined. Store it alongside the existing tri-state — the
  minimal shape is a second state (e.g. a `runtimeReason: string | undefined`) set in the same
  `.then`, and cleared to `undefined` on the `ok:true` branch, on the `!installOk` reset
  (`:76-78`), and on the `.catch` (reject carries no structured reason — leave `runtimeReason`
  undefined so the fallback label shows). Do not change the `runtimeReachable`/`runtimeState`
  logic (`:59, :97-103`) — the row still turns amber via the existing `warn` path.
- **Render the reason in the runtime-row `warn` detail (`:132-135`).** Replace the hard-coded
  `'Degraded (not reachable)'` with: when `runtimeReason` is present, a translated human lead
  concatenated with the raw reason **outside `t()`** (e.g. `${t('memory.settings.status_runtime_degraded_lead', { defaultValue: 'Degraded' })}: ${runtimeReason}`);
  when absent, keep the existing bare `t('memory.settings.status_runtime_degraded', {
defaultValue: 'Degraded (not reachable)' })`. Concatenating the raw reason outside `t()` is
  required — the reason is a machine string received from the client (do not translate it), and
  the DOM-test i18n mock does not interpolate. Do NOT embed the reason via a `{{reason}}` i18n
  placeholder.
- **Render the reason in the Test-fail text (`:213-226`).** In `handleTest` (`:142-151`), on the
  `!result.ok` branch capture the same reason (`result.error ?? result.errorReason`) into a
  `testFailReason` state (reset it on `running`/`pass`, and leave undefined in the `catch`). In
  the `testState === 'fail'` span, when `testFailReason` is present render a translated lead +
  the raw reason outside `t()` (e.g. `'Memory did not respond'` + `: ${testFailReason}`); when
  absent, keep the existing fixed `t('memory.settings.test_fail', { defaultValue: 'Memory did
not respond. Check the install status above.' })`.
- **i18n:** add any new keys following the file's existing inline-`defaultValue` pattern
  (`memory.settings.status_runtime_degraded_lead`, `memory.settings.test_fail_lead` or similar);
  the raw reason is appended as data, never a translation key. Optionally humanize the bare
  `errorReason` code with a tiny inline lookup, but the raw code is acceptable and honest — do
  not build a code catalog.
- **Do NOT** change the probe target/verb, add a second probe or an HTTP/daemon check, touch
  `ijfwMcpClient`/`ijfwBridge`/main-side logging, or alter the happy-path/`checking`/`idle`
  rendering. This is a display-only enrichment of the two failure branches.
  Verify: `bun run test:vitest tests/unit/renderer/settings/IjfwSetupStatus.dom.test.tsx` GREEN
  (tests 1, 2, 5 flip to pass; 3, 4, 6 and all pre-existing tests stay green); `tsc --noEmit`
  clean; a review of the diff confirms the probe still calls `brainInvoke.invoke({ verb: 'state'
})` in both the mount `useEffect` and `handleTest` (transport/target unchanged) and that the
  only files touched are `IjfwSetupStatus.tsx` and its DOM test.
  Done: a failing probe (mount or Test) renders its real `error`/`errorReason` in the panel; a
  reasonless failure and a rejected probe fall back to the prior labels without crashing; no
  probe-target, main-side, or happy-path behavior changed.

**Task 3 — Exit bar + live-verify handoff (human checkpoint, no code commit).**

- Full automated floor: `bun run test:vitest` (full unit suite) green, and `tsc --noEmit` clean.
  Constitution tests may flake under full-suite parallelism (pass isolated) — not a regression,
  per `D-CONTEXT.md`.
- Confirm main-side logging is NOT missing (grep-verify the existing `ijfwMcpClient` failure logs
  at `:194, :352, :355, :358, :375, :387, :406` are present and untouched) — the reporter's
  "unlogged" is a UI-visibility gap, now fixed at the surface; no new log line is added.
- Diff-scope gate: the only files changed are
  `src/renderer/pages/settings/components/IjfwSetupStatus.tsx` and its DOM test; `ijfwMcpClient`,
  `ijfwBridge`, `ijfw.ts`, and every main-process file are byte-identical to HEAD; the probe verb
  stays `state`; no HTTP/daemon probe was introduced.
- **Live-verify surface (orchestrator runs this by hand — this is the Milestone D acceptance):**
  build the packaged app (`bun run package`; then revert
  `src/process/services/constitution/constitutionFsAuthority.generated.ts`, which the prepackage
  step regenerates). In the running app, point at an install whose MCP runtime is degraded — an
  older `~/.ijfw/mcp-server` missing `ijfw_state` (→ `mcp_error: method not found`), or the MCP
  server absent (→ `spawn_error`/`timeout`). Open Memory settings and confirm the runtime row
  and the Test button now show the **real reason** instead of a bare "Degraded (not reachable)" /
  "Memory did not respond", and that the same reason is present in the electron-log file.
  Separately confirm a healthy install still shows `Live` / Test `pass`. Broken build = bare
  "Degraded" with no cause; fixed build = the cause is on screen.
  Verify: full suite + `tsc --noEmit` green; diff limited to the one component + its test; probe
  transport unchanged; packaged degraded install surfaces the real reason on both surfaces while
  a healthy install stays green.
  Done: #891 symptom retired (a Degraded runtime shows WHY), the probe target/transport and main
  logging are unchanged, and the packaged live-verify is accepted by Sean + Claude. #891
  auto-closes on merge (`github_issue: 891`).

</tasks>

<threat_model>
Low security surface: this change only **displays** a string the app already computed and
already logs. No new input is parsed, no new transport is opened, no auth/access-control path is
touched. Trust boundary crossed: IJFW MCP child → main → IPC bridge → renderer; the renderer now
renders a field (`IjfwInvokeResult.error` / `errorReason`) that main composed.

| Threat ID | STRIDE                 | Component                                                                                                   | Severity | Disposition | Mitigation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-D04-01  | Information Disclosure | renderer now surfaces `IjfwInvokeResult.error`/`errorReason` in the settings panel and it lands in DOM/logs | low      | accept      | The surfaced string is an app-composed protocol/spawn message (`(err as Error).message` for `spawn_error`, the MCP reply's `error.message` for `mcp_error`, a fixed `timeout` string), NOT raw engine stderr or process env — the client already routes raw stderr through `redactCommandSecrets` (`ijfwMcpClient.ts:352`) on the logging path and does not fold it into the returned `error`. No secret-bearing field is newly exposed. Guard: if a future client change folds raw stderr into `error`, it must pass through the existing redaction before return. |
| T-D04-02  | Tampering / DoS        | a hostile/oversized `error` string from a compromised MCP child renders unbounded text in the panel         | low      | accept      | The `error` originates from the local, first-party stdio MCP the user installed (same trust as runtime memory itself); it is rendered as inert text in an existing `Typography.Text`, not HTML/markup (React escapes it), so no injection. Length is bounded in practice by the client's own message construction. No new mitigation warranted for a first-party local string.                                                                                                                                                                                      |
| T-D04-SC  | Tampering              | supply-chain (new packages)                                                                                 | n/a      | accept      | No new packages — renderer-only edit reusing existing types (`IjfwInvokeResult`), the existing `ipcBridge`, and the existing i18n. Package Legitimacy Audit N/A.                                                                                                                                                                                                                                                                                                                                                                                                    |

</threat_model>

<verification>
- `bun run test:vitest` (full unit suite) green; `tsc --noEmit` clean.
- `IjfwSetupStatus.dom.test.tsx`: (1) mount probe `{ok:false, error:'method not found:
  ijfw_state', errorReason:'mcp_error'}` → runtime row is `pending` and its text contains the
  real reason; (2) `{ok:false, errorReason:'timeout'}` → text contains the code; (3) `{ok:false}`
  → bare degraded label, no crash; (4) rejected probe → `pending`, no crash; (5) Test-button
  `{ok:false, error:'...'}` → `data-result='fail'` with the real reason text; (6) Test-button
  `{ok:false}` → the existing fixed fail string. All pre-existing tests stay green.
- No-regression: `ijfwMcpClient.test.ts` (producer contract, incl. `:592-612` `-32601`→`mcp_error`)
  green and untouched; main-side logging (`ijfwMcpClient.ts:194/352/355/358/375/387/406`) present
  and unchanged.
- Diff scope: only `IjfwSetupStatus.tsx` + its DOM test change; probe still
  `brainInvoke.invoke({ verb: 'state' })` in both call sites; no HTTP/daemon probe added; main
  process byte-identical to HEAD.
- Packaged live-verify: a degraded MCP install (missing `ijfw_state` / absent server) surfaces the
  real reason on the runtime row AND the Test button, and the reason is in the electron-log; a
  healthy install stays `Live` / Test `pass`.
- Independent cross-audit of the diff before any merge; LOCAL only, no push/merge without Sean.

**Goal-backward check — each acceptance test maps to "the real reason is surfaced":**

| Must be TRUE (goal: a Degraded runtime shows WHY)                     | Renderer behavior that makes it true                                                  | Proven by                                                                           |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| A failed mount probe shows the real cause, not a bare "Degraded"      | probe threads `error`→ (fallback `errorReason`) into the runtime-row `warn` detail    | DOM test 1 (real `error` text) + test 2 (`errorReason` code fallback)               |
| A failed Test-button probe shows the real cause, not the fixed string | `handleTest` threads `error`/`errorReason` into the fail text                         | DOM test 5                                                                          |
| A reasonless failure never regresses or crashes                       | undefined reason → existing bare labels retained                                      | DOM test 3 (runtime) + test 6 (Test button) + test 4 (reject path)                  |
| The reason the UI shows is the one the client actually produces       | consumer reads the already-structured `IjfwInvokeResult`; producer contract unchanged | existing `ijfwMcpClient.test.ts:592-612` (`-32601`→`error`+`mcp_error`) stays green |
| The cause is discoverable in the log, as the reporter asked           | main-side failure logging already exists and is untouched                             | grep-verify `ijfwMcpClient.ts` log lines present at exit bar (Task 3)               |
| Nothing but the display changed (no probe-target / main-side drift)   | renderer-only, verb `state` unchanged, no HTTP probe                                  | diff-scope gate (Task 3)                                                            |

</verification>

<success_criteria>
When the IJFW MCP probe fails, the Memory settings panel shows the REAL reason —
`mcp_error: method not found: ijfw_state`, `timeout`, `spawn_error`, etc. — on both the runtime
row and the Test button, instead of a hard-coded "Degraded (not reachable)" / "Memory did not
respond". A reasonless or rejected probe falls back to the prior labels without crashing. The fix
is a single renderer-layer change (one component + its DOM test); the probe transport/verb, the
`ijfwMcpClient` producer contract, and all main-side logging are untouched. Full unit suite +
`tsc --noEmit` green. #891 auto-closes on merge (`github_issue: 891`).
</success_criteria>

<deferred>
**Probe-verb alignment (`state` → a `memory_*` read) — DEFERRED, not built in this packet.**
Tracked for a follow-up; #891 is fully closed without it.

Design (from `D-04-RESEARCH.md` "Recommended Minimal Fixes / Open Questions"):

- Today the mount probe and Test button both call `brainInvoke.invoke({ verb: 'state' })`, which
  maps to `ijfw_state` in the client's `DIRECT_TOOL_MAP`. On an older `~/.ijfw/mcp-server` that
  lacks `ijfw_state`, the server replies `-32601` → `errorReason:'mcp_error'` → the row goes
  Degraded even though `ijfw_memory_recall` / `memory_store` work fine — a genuine false negative.
- The follow-up would align "reachable" to the surface runtime memory actually uses (a lightweight
  `memory_*` liveness read) so a working memory is never shown as Degraded, keeping `state` (or
  switching both) for the Test button.
- Why deferred: it changes what "reachable" _asserts_ (MEDIUM-risk, semantic change), and the
  research recommends deciding it only **after** the honest reason (shipped by this packet)
  confirms the live vector on first reproduction. Surfacing the reason is the low-risk correct
  fix and makes the vector self-evident; the verb change is a separate call for Sean. Milestone D
  mandates minimal surgical fixes, so it stays out of the #891 packet.
  </deferred>

<output>
Write `D-04-SUMMARY.md` when the packet is live-test-accepted, recording: the renderer change
(the two failure-branch reason-threading edits + any new i18n lead keys in `IjfwSetupStatus.tsx`);
the DOM tests added to `IjfwSetupStatus.dom.test.tsx`; confirmation that `ijfwMcpClient` /
`ijfwBridge` / main-side logging and the probe verb are unchanged; full-suite + `tsc` results; the
packaged live-verify evidence (which degraded-install reason now appears on the runtime row and
Test button, and that a healthy install still shows Live/pass); the cross-audit result; and the
explicit note that the probe-verb alignment is deferred.
</output>
