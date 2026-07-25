# Phase WLD-D / D3 — Honest Diagnostics (#891 + #853) — Research

**Researched:** 2026-07-24
**Domain:** Electron desktop diagnostics — surfacing real failure reasons (IJFW MCP probe + wcore exec/process failures)
**Confidence:** HIGH (all claims verified against live code at HEAD, this worktree)

## Summary

Both issues are the same class of bug — a status/error surface that **already has the real
failure reason in hand and throws it away**, showing a generic label instead. Neither is a
missing-capability problem; both are "stop discarding the reason you already computed."

- **#891 (Memory false "Degraded"):** The memory probe (`IjfwSetupStatus.tsx`) calls the stdio
  MCP client, which **already returns a structured `{ok:false, error, errorReason}`**. The
  renderer reads only `r?.ok` and renders a hard-coded "Degraded (not reachable)" — the `error`
  and `errorReason` are dropped on the floor in both the mount probe and the Test button. The
  main-process client (`ijfwMcpClient.ts`) **already logs** spawn/crash/decode failures
  comprehensively. So the reporter's "unlogged, no reason" is a **renderer-side discard**, not a
  missing main-side log. The probe checks the **correct** surface (the stdio MCP is what runtime
  memory actually uses; there is **no** HTTP daemon on `127.0.0.1:37891` anywhere in `src` —
  verified 0 hits). The "probe lies" symptom is a genuine false-negative vector (most likely the
  narrow `ijfw_state` verb failing on an older MCP server while `ijfw_memory_*` still works), and
  surfacing the real reason is exactly what makes it diagnosable.

- **#853 (Surface real exec errors):** wcore start/exit failures are surfaced through
  `WCoreManager.emitStartFailure` (`Agent failed to start: ${detail}`) and `handleProcessExit`
  (`Agent process exited unexpectedly (code ${code})`). The ready-timeout and exit-during-init
  paths **already** enrich `detail` with the engine's stderr tail + exit code (#484). The real
  gaps are narrow and exec-specific: (1) **no `childProcess.on('error')` handler exists at all**
  → a spawn `ENOENT`/`EACCES`/`EPERM` (AV-quarantined binary, macOS signature/exec block) emits
  an **unhandled** error event instead of a clean errno message; (2) the exit handler captures
  `code` but **not `signal`**, so an AV `SIGKILL` shows "exited with code null" and hides that it
  was killed; (3) **no discoverable log link** accompanies any of these errors. Provider/model API
  errors are out of scope — they arrive as engine stream `type:'error'` events and already render
  verbatim.

**Primary recommendation:** Ship as **TWO packets** — **D-04 (#891, renderer-side, S)** and
**D-05 (#853, main-process + chat, M)**. The fixes touch disjoint files across different tiers,
are different sizes, and the milestone's `github_issue: NN` auto-close frontmatter is singular
(one issue per packet, matching D-01/#890 and D-03/#885). They share a *principle* (#656) but
almost no *code*.

## User Constraints (from D-CONTEXT.md + task brief)

### Locked Decisions
- **LOCAL only** — no push/merge/release without Sean. Never touch `/Users/seandonahoe/dev/wayland/app`.
- **#853 scope is LOCKED (Sean's call): exec/process failures ONLY.** In scope: spawn errno
  (`ENOENT`/`EACCES`/`EPERM`), nonzero/`null` exit during init, kill signals (`SIGKILL`/`SIGTERM`
  = AV/OS/signature kill), ready-timeout, unexpected mid-turn process exit. **NOT** a full
  error-taxonomy rebuild. Provider/model API errors are already handled — do not touch them.
- **Desktop-only, Core-independent** — the exec-error *surfacing* is desktop-side. Do not depend
  on any new wcore/Core behavior (Core is mid-rebuild).
- Both roll up to Sean's **#656** principle: honest diagnostics, surface the REAL reason.
- Minimal surgical fixes, match existing patterns, American spelling, vitest (`bun run test:vitest`).
- Every FIX runs the full Factory loop; always `bun run package` (never raw `electron-vite build`);
  revert `constitutionFsAuthority.generated.ts` after any package build.

### Claude's Discretion
- Whether #891 also **aligns the probe verb** to a memory-path verb (secondary hardening) vs.
  surface-reason-only (primary). Recommendation below.
- Exact "log link" affordance (append path text vs. reuse `shell.openPath`/`showItemInFolder`).
- Packet split (recommended TWO — see below).

### Deferred Ideas (OUT OF SCOPE)
- Full error-taxonomy / error-code catalog for wcore (Sean explicitly excluded).
- Any Core-side change (wcore signing #914, provider-routing errors, HTTP health daemon).
- Rewriting the memory probe to a new transport.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| #891 | Memory settings shows false "Degraded" with no reason; log the real MCP failure and surface it | Renderer discards `error`/`errorReason` already returned by `ijfwMcpClient`; main-side already logs. Fix is renderer-side surface + verify logging. |
| #853 | Core/exec-level failures (AV/firewall/signature/spawn) show generic text; surface real stderr/errno + a log link | Missing `on('error')` handler, missing `signal` capture, missing log link in `WCoreManager` surfaces. Provider API errors already verbatim. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Memory probe reason display (#891) | Renderer (settings component) | — | The structured reason already crosses the IPC bridge intact; only the renderer discards it. |
| Memory MCP failure logging (#891) | Main process (`ijfwMcpClient`) | — | Already logs; verify coverage, add reason to the returned result path if any gap. |
| wcore spawn/exit error capture (#853) | Main process (`WCoreAgent` / `index.ts`) | — | Errno/signal are only observable at the spawn site. |
| wcore error → user message + log link (#853) | Main process (`WCoreManager`) | Renderer (error message + link) | Manager composes the `type:'error'` stream message; renderer renders it and the log-open affordance. |
| Log-folder open affordance | Main process (shell bridge) | Renderer | `shell.openPath`/`showItemInFolder` already exist; a logs-dir target/IPC is the only possible new surface. |

## Confirmed Root Cause — #891 (Memory false "Degraded")

**Probe path, end to end (verified):**
1. `IjfwSetupStatus.tsx:75-92` (mount `useEffect`, gated on `installOk`) and `:142-151` (Test
   button) both call `ipcBridge.ijfw.brainInvoke.invoke({ verb: 'state' })`.
2. `ipcBridge.ts:2156` → provider `'ijfw.brain-invoke'`.
3. `ijfwBridge.ts:24-42` validates and **passes through** to
   `ijfwMcpClient.invoke(verb, args)` — a **thin pass-through** that returns the client's
   structured `IjfwInvokeResult` untouched.
4. `ijfwMcpClient.ts` `invoke()` spawns `~/.ijfw/mcp-server` over stdio (`spawnChild`, `:325-363`),
   maps `state → ijfw_state` (`DIRECT_TOOL_MAP`, `:65-78`), and returns:
   - `{ok:false, error, errorReason:'spawn_error'}` on spawn failure (`:194-198`),
   - `{ok:false, error, errorReason:'mcp_error'}` on a `-32601`/isError reply (`:414-419`, `:115-120`),
   - `{ok:false, error, errorReason:'timeout'}` on 30s timeout (`:224-227`),
   - `{ok:false, errorReason:'validation_failed'}` on unknown verb (`:186-188`).
5. `IjfwInvokeResult` (`common/types/ijfw.ts:52-55`) **carries `error` + `errorReason`** on failure.

**The bug:** the renderer reads **only `r?.ok`**:
- Mount probe: `.then((r) => setRuntimeReachable(!!r?.ok))` and `.catch(() => setRuntimeReachable(false))`
  (`IjfwSetupStatus.tsx:83-88`) — `r.error`/`r.errorReason` discarded.
- Runtime row renders a **hard-coded** `'Degraded (not reachable)'` when `runtimeReachable === false`
  (`:133-135`).
- Test button: `setTestState(result?.ok ? 'pass' : 'fail')` (`:147`); fail text is the fixed
  `'Memory did not respond. Check the install status above.'` (`:221-224`).

**Logging is NOT missing main-side:** `ijfwMcpClient.ts` logs spawn failures (`:194`), child errors
(`:355`), exits (`:358`), decode errors (`:375`), skipped/garbage stdout (`:387`, `:397`), and
invalid envelopes (`:406`) — all via `electron-log`, secret-redacted. What is missing is the reason
reaching the **UI**. (The reporter's "unlogged" is accurate from their vantage point — nothing
tells them a reason exists in the log file, and the UI hides it.)

**Is "Degraded" a genuine failure or a false negative?** The probe checks the **authoritative**
surface: the stdio MCP client is what runtime memory enrichment actually calls (the client's own
docstring: "memory enrichment hooks and future internal callers"). There is **no** HTTP daemon on
`127.0.0.1:37891` in `src/process` (grep: 0 hits; the only `/health` in code is `starOfficeBridge`,
unrelated). So the probe is not checking the wrong endpoint. The false-negative is **verb-level**:
`{verb:'state'} → ijfw_state`. If the installed `~/.ijfw/mcp-server` is older and lacks
`ijfw_state`, the MCP server replies `-32601` → `errorReason:'mcp_error'` → `ok:false` → "Degraded",
even though `ijfw_memory_recall`/`memory_store` work fine. Other vectors: the 30s cold-start timeout
racing a slow first Bun spawn, or the 5s `RESPAWN_BACKOFF` (`:37`, `:303-306`) tripping right after
a transient failure. **The exact vector cannot be pinned desktop-side without the reporter's log** —
but the fix does not require pinning it: surfacing `errorReason:'mcp_error: … ijfw_state …'` turns a
lie into the truth and makes the vector self-evident. `[VERIFIED: code — IjfwSetupStatus.tsx,
ijfwMcpClient.ts, ijfwBridge.ts, ijfw.ts]`

## Confirmed Root Cause — #853 (Generic exec errors)

**Surfacing chain (verified):**
- `WCoreManager` starts the agent (`:337` `this.start().catch(...)` → sets `this.startError`, `:355`).
- On the next `sendMessage`, if `startError || !agent`, it calls
  `emitStartFailure(msg_id, startError)` (`:741-742`).
- `emitStartFailure` (`:1205-1229`) emits `type:'error'`,
  `data: \`Agent failed to start: ${detail}\``, `detail = error.message` (`:1211,1216`).
- Mid-turn death → `handleProcessExit` (`:1175-1198`) emits
  `data: \`Agent process exited unexpectedly (code ${code})\`` (`:1185`).

**What already works (#484):** In `WCoreAgent` (`agent/wcore/index.ts`), the exit-during-init reject
(`:729-742`) and the ready-timeout reject (`:755-759`) both fold in
`redactSecrets(stripAnsi(this.stderrTail).trim())` + the exit code. So for an engine that *starts
then dies/hangs with stderr*, `detail` is already the real reason. `stderrTail` is captured at
`:663-665` (2048-byte tail, `WCORE_STDERR_TAIL_MAX`).

**The three real gaps (exec-specific, in scope):**
1. **No `childProcess.on('error')` handler.** Verified: the only `.on('error')` in `index.ts` are
   `fdStream` (`:610`) and `stdin` (`:694`) — **never on the child itself**. On spawn `ENOENT`
   (binary missing / AV-quarantined) or `EACCES`/`EPERM` (macOS signature/exec block), Node emits an
   async `'error'` event on the ChildProcess; with no listener it becomes an **unhandled error
   event** (main-process crash / uncaught), and no `exit`/`ready` ever fires, so the user gets
   nothing honest (worst case a crash; best case the bare 30s "ready timeout" with empty stderr).
2. **`signal` is dropped on exit.** `spawnedChild.on('exit', (code) => …)` (`:696`) ignores the
   second `signal` arg. An AV `SIGKILL` of a running engine yields `code=null` → "wcore exited with
   code null during init" with a likely-empty `stderrTail` (killed before it logged) — hiding that
   it was **signal-killed** (the single most telling AV/OS-block signal).
3. **No discoverable log link.** Neither `emitStartFailure` nor `handleProcessExit` references the
   log file. The reporter explicitly wants a link.

**Boundary — already handled, OUT of scope:** Provider/model API errors reach the UI as engine
**stream `type:'error'` events** via `onStreamEvent → handleEvent` (index.ts) →
`ipcBridge.conversation.responseStream.emit` — rendered verbatim. The Desktop-contract fail-closed
path (`:622-637`) also already surfaces a real `detail`. Do not touch these.
`[VERIFIED: code — WCoreManager.ts, agent/wcore/index.ts]`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Get the memory failure reason | A new health endpoint / second probe | The `error`/`errorReason` already on `IjfwInvokeResult` | It already crosses the bridge intact; only the renderer discards it. |
| Log the MCP failure | New logging in the component | The existing `electron-log` calls in `ijfwMcpClient` | Already logs spawn/crash/decode/timeout with secret redaction. |
| Capture spawn errno | A pre-spawn `fs.access` probe | `childProcess.on('error', err => err.code/errno/syscall)` | Node hands you the exact errno on the error event; a pre-check races and duplicates. |
| Redact secrets in surfaced stderr | New redaction | `redactSecrets` / `redactCommandSecrets` (already imported) | The #484 path and MCP stderr path already use them; reuse for consistency. |
| Open the logs folder | New file dialog | `ipcBridge.shell.openPath` / `showItemInFolder` + `app.getPath('logs')` | Both IPCs exist and are used across the app (UpdateModal, MemoryStatusBar, Workspace). |

**Key insight:** Every reason these bugs want is already computed one layer below the surface that
lies. The fix is *propagation and display*, not new detection.

## Architecture Patterns

### Pattern 1: Surface-the-reason (both issues)
**What:** A status/error UI must render the structured reason it received, never a hard-coded label.
**#891:** Thread `error`/`errorReason` into the runtime-row `detail` and the Test-fail text. Keep a
short, human lead ("Memory runtime not reachable") + the real reason ("mcp_error: method not found:
ijfw_state") + optionally the `errorReason` code for support.
**#853:** In `WCoreAgent`, add an `on('error')` reject and include `signal` in the exit reject; the
existing `emitStartFailure`/`handleProcessExit` already interpolate `detail` — just make `detail`
carry errno/signal, and append a log-link marker.

### Pattern 2: Discoverable log link (#853, optional reuse for #891)
**What:** On an exec failure, give the user a one-click way to reach the log file.
**How:** `app.getPath('logs')` is the electron-log dir (see `feedbackBridge.ts:57-61`,
`initStorage.ts:1632-1633` `getLogsDir()`). Reuse `ipcBridge.shell.openPath`/`showItemInFolder`.
If the chat error renderer can't host a button cheaply, the minimal version appends the logs path as
text to the error `data`; the richer version renders an "Open logs" link on `type:'error'` messages.
Recommend the richer version only if it's a small renderer touch; otherwise ship the path in text.

### Anti-Patterns to Avoid
- **Changing the probe transport** for #891 (rewriting to HTTP/37891). There is no such daemon;
  the stdio MCP is authoritative. Don't build one.
- **Building an error-code taxonomy** for #853. Sean locked scope to exec/process only.
- **Swallowing the spawn `error` event silently.** The whole point is to surface it.
- **Leaking secrets** in newly-surfaced stderr/errno text — always route through `redactSecrets`.

## Shared Surfacing Pattern

There **is** a shared *principle* (never show a bare status; carry reason + a log link) but the
**code overlap is minimal**: #891's surface is a settings checklist row consuming an
`IjfwInvokeResult`; #853's is a conversation `type:'error'` stream message from a spawn errno. They
live in different tiers and consume different shapes. A single shared helper would be over-abstraction
for two call sites. The one genuinely reusable primitive is the **"open logs" affordance**
(`app.getPath('logs')` + `shell.openPath`), which #853 needs and #891 *could* adopt for its Test-fail
row. Recommend building the log-open affordance in D-05 (#853) and, if trivial, reusing it in D-04
(#891); do not block D-04 on it.

## Packet-Split Recommendation

**Recommendation: TWO packets — D-04 (#891) and D-05 (#853).** (This single RESEARCH.md seeds both.)

| Factor | #891 | #853 |
|--------|------|------|
| Tier | Renderer (settings) | Main process (engine + manager) + chat renderer |
| Files | `IjfwSetupStatus.tsx` (+ maybe a probe-verb tweak) | `agent/wcore/index.ts`, `task/WCoreManager.ts`, shell/logs IPC, error-message renderer |
| Size | S | M |
| Auto-close | `github_issue: 891` | `github_issue: 853` |
| Shared code with the other | Almost none (different result shapes, different tiers) | Almost none |

The milestone convention is one issue per packet with a singular `github_issue` frontmatter that
auto-closes on merge (D-01=#890, D-03=#885). Two build-issues in one packet would either fail to
auto-close one of them or force a workaround. Disjoint files also mean the cross-audit and
live-verify surfaces are cleanly separable. **Split into D-04 and D-05.**

## Recommended Minimal Fixes (file:line targets)

### #891 → D-04 (renderer, S)
- **`src/renderer/pages/settings/components/IjfwSetupStatus.tsx`**
  - Store the failed result, not just a boolean: replace `runtimeReachable: boolean | null` with a
    small state holding `{reachable: boolean, reason?: string, code?: IjfwErrorReason}` populated
    from `r.error`/`r.errorReason` in the mount probe (`:81-88`) and the Test button (`:146-151`).
  - Render the real reason in the runtime-row `detail` (`:133-135`) and the Test-fail text
    (`:221-224`) instead of the hard-coded strings (keep a human lead + the reason; add i18n keys).
- **`src/process/services/ijfw/ijfwMcpClient.ts`** — verify the failure logging already covers the
  probe's path (it does: `:194`, `:355`, `:358`, `:375`, `:406`). Only add a log line if a gap is
  found; do not duplicate.
- **Optional (Claude's discretion / Sean call):** align the mount probe verb from `state` to a
  memory-path read (e.g. a lightweight `memory_facts`) so "reachable" means "the path memory uses
  works," eliminating the `ijfw_state`-missing false negative. Keep the Test button on `state` or
  switch both. Recommend surfacing-reason first (low risk); treat the verb change as a follow-up
  decision, since it changes what "reachable" asserts.

### #853 → D-05 (main + chat, M)
- **`src/process/agent/wcore/index.ts`**
  - Add `spawnedChild.on('error', (err) => …)` near the existing stdin/exit listeners (`:694-696`):
    reject `readyReject` (when `!this.ready`) with a structured message including
    `err.code`/`err.errno`/`err.syscall` (e.g. `wcore could not be launched: ENOENT (spawn) — the
    engine binary is missing or was blocked (antivirus / code signature)`), routed through
    `redactSecrets`. This is the primary new capture.
  - Capture `signal` in the exit handler (`:696` `on('exit', (code) => …)` → `(code, signal)`) and
    include it in the exit-during-init reject (`:729-742`): when `code === null && signal`, say
    "killed by <signal> (likely antivirus, firewall, or OS signature block)".
- **`src/process/task/WCoreManager.ts`**
  - In `emitStartFailure` (`:1205-1229`) and `handleProcessExit` (`:1175-1198`), append a
    discoverable log-link marker to the error `data` (path from `app.getPath('logs')` /
    `getPlatformServices().paths.getLogsDir()`), or attach structured metadata the renderer turns
    into an "Open logs" link.
- **Log-open affordance** — reuse `ipcBridge.shell.openPath` / `showItemInFolder`
  (`ipcBridge.ts:111`); add a logs-dir IPC/target only if none is exposed to the renderer (none
  found today). `feedbackBridge.ts` already computes the logs dir server-side.
- **Renderer** — render the "Open logs" link on `type:'error'` engine messages (small touch); if
  non-trivial, ship the path as text in `data` for D-05 and defer the clickable link.

## Runtime State Inventory

Not a rename/refactor/migration phase — no stored data, service config, OS-registered state,
secrets, or build artifacts carry a renamed string. **None — verified: this is a bug-fix phase
touching in-memory error/status propagation only.**

## Common Pitfalls

### Pitfall 1: Re-logging what's already logged (#891)
**What goes wrong:** Adding logging in the renderer or duplicating `ijfwMcpClient`'s logs.
**How to avoid:** The client already logs every failure path. The fix surfaces the reason to the
UI; verify the log exists, don't add a second one.

### Pitfall 2: Leaking secrets in surfaced stderr/errno (#853)
**What goes wrong:** Raw wcore stderr / spawn env can contain provider keys.
**How to avoid:** Route every newly-surfaced string through `redactSecrets` /
`redactCommandSecrets` — exactly as the #484 path (`index.ts:734,757`) and the MCP stderr path
(`ijfwMcpClient.ts:352`) already do.

### Pitfall 3: Unhandled 'error' event crashing main (#853)
**What goes wrong:** Adding the errno message but forgetting that until an `on('error')` listener
exists, the spawn failure is *unhandled* and can crash the process before any message is emitted.
**How to avoid:** The `on('error')` handler is the fix, not an add-on — install it before relying
on the reject reaching `emitStartFailure`.

### Pitfall 4: Over-scoping #853 into a taxonomy
**What goes wrong:** Building error-code enums / categorization for every wcore failure.
**How to avoid:** Sean locked scope to exec/process. Touch only the spawn-error, exit-signal, and
log-link paths. Leave provider/stream errors alone.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (`vitest run`) |
| Config | project vitest config; DOM tests use `// @vitest-environment jsdom` |
| Quick run | `bun run test:vitest` (single file: `bun run test:vitest <path>`) |
| Full suite | `npm test` (~2 min; expect the known constitution flake under parallelism) |
| a11y gate | `bun run test:e2e:a11y` |

### Phase Requirements → Test Map
| Req | Behavior | Type | Command | File Exists? |
|-----|----------|------|---------|-------------|
| #891 | A `{ok:false, error:'…', errorReason:'mcp_error'}` probe result renders the real reason (not a bare "Degraded") in the runtime row | unit (jsdom) | `bun run test:vitest tests/unit/renderer/settings/IjfwSetupStatus.dom.test.tsx` | ✅ extend (mock `brainInvoke` to return a structured failure; assert reason text) |
| #891 | Test-button fail shows the returned reason, not the fixed string | unit (jsdom) | same file | ✅ extend |
| #891 | Client returns structured reason on spawn/mcp/timeout failure | unit | `bun run test:vitest tests/unit/process/services/ijfw/ijfwMcpClient.test.ts` | ✅ already covers structured returns; assert no regression |
| #853 | A spawn `ENOENT`/`EACCES` errno surfaces "…ENOENT…" (not generic / not a crash) + a log link | unit | `bun run test:vitest tests/unit/WCoreManagerStartFailure.test.ts` | ✅ extend (reject `agentStart` with an errno-shaped Error; assert `data` contains the errno + log-link marker) |
| #853 | A `code=null` + `SIGKILL` exit surfaces the signal + log link | unit | `bun run test:vitest tests/unit/WCoreManagerProcessExit.test.ts` | ✅ extend |

### Live-verify surface
- **#891:** Point the app at an install where `ijfw_state` is missing / MCP server absent; open
  Memory settings; confirm the runtime row + Test button show the **real** reason, and the reason
  is present in the electron-log file.
- **#853:** Simulate an exec failure (rename/chmod-000 the bundled wcore binary, or gatekeeper/AV
  block) and send a message; confirm the chat error names the errno/signal and offers a working
  "Open logs" link. Packaged build (`bun run package`) is the acceptance artifact.

### Wave 0 Gaps
- None — `IjfwSetupStatus.dom.test.tsx`, `ijfwMcpClient.test.ts`, `WCoreManagerStartFailure.test.ts`,
  and `WCoreManagerProcessExit.test.ts` all exist with the exact mock harnesses needed. Extend them.

## Security Domain

Low surface, but two real controls:
- **V6/Logging — secret redaction.** Surfacing stderr/errno/spawn context to the UI and logs must
  keep the existing redaction (`redactSecrets`, `redactCommandSecrets`). Both fixes reuse it; no
  new crypto.
- **V5 — no new untrusted input.** Both fixes only *display* strings the app already produces
  (MCP result, wcore stderr, Node errno). No new parsing, no new external input.
- No auth/session/access-control changes. ASVS V2/V3/V4 not applicable.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The #891 false-negative is most likely the `ijfw_state` verb missing on an older MCP server (vs. timeout/backoff race) | Root Cause #891 | LOW — the fix (surface the reason) is correct regardless of which vector; A1 only informs the optional verb-alignment follow-up. Needs the reporter's log to confirm. |
| A2 | Adding `on('error')` is sufficient to capture AV/signature exec blocks as `EACCES`/`EPERM`/`ENOENT` | Root Cause #853 | LOW — Node surfaces these as error-event errnos; some AV kills instead let the process start then `SIGKILL` it, which the `signal` capture (gap 2) covers. Both paths are addressed. |
| A3 | The chat `type:'error'` renderer can host or link a logs affordance with a small touch | Fixes #853 | MEDIUM — if the renderer touch is non-trivial, fall back to appending the logs path as text in `data`. Planner should confirm the renderer cost during planning. |

## Open Questions

1. **Exact #891 false-negative vector** — What we know: probe hits the right surface; reason is
   discarded. What's unclear: whether the live failure is `ijfw_state`-missing, a cold-start
   timeout, or backoff. Recommendation: ship surface-the-reason (makes it self-diagnosing); decide
   the optional verb-alignment after the first live reproduction/log.
2. **Log-link richness (#853)** — clickable "Open logs" vs. path-as-text. Recommendation: reuse
   `shell.openPath` for a clickable link if the error-message renderer touch is small; else ship
   the path in `data` and defer the button. Planner to size the renderer change.

## Sources

### Primary (HIGH confidence — verified in this worktree, HEAD)
- `src/renderer/pages/settings/components/IjfwSetupStatus.tsx` — probe + render (#891)
- `src/process/services/ijfw/ijfwMcpClient.ts` — structured results + logging (#891)
- `src/process/bridge/ijfwBridge.ts` — thin pass-through (#891)
- `src/common/types/ijfw.ts` — `IjfwInvokeResult` / `IjfwErrorReason` (#891)
- `src/process/agent/wcore/index.ts` — spawn/exit/stderr/#484 (#853)
- `src/process/task/WCoreManager.ts` — `emitStartFailure` / `handleProcessExit` (#853)
- `src/process/bridge/feedbackBridge.ts`, `src/process/utils/initStorage.ts` — logs-dir source
- `src/common/adapter/ipcBridge.ts` — `shell.openPath` / `showItemInFolder` IPCs
- Existing tests: `IjfwSetupStatus.dom.test.tsx`, `ijfwMcpClient.test.ts`,
  `WCoreManagerStartFailure.test.ts`, `WCoreManagerProcessExit.test.ts`
- Negative-verified: grep `37891`/`api/health` in `src/process` = **0 hits** (no HTTP daemon)

## Metadata

**Confidence breakdown:**
- Root cause (both): HIGH — traced end-to-end in code, no inference gaps.
- Fix targets: HIGH — file:line confirmed; only the renderer log-link cost (A3) is unsized.
- #891 live-failure vector: MEDIUM — needs the reporter's log to pin (does not block the fix).

**Research date:** 2026-07-24
**Valid until:** stable (internal code; re-verify only if `IjfwSetupStatus.tsx`, `ijfwMcpClient.ts`,
`agent/wcore/index.ts`, or `WCoreManager.ts` change materially)

## RESEARCH COMPLETE

**Confirmed root cause:**
- **#891** — The memory probe already receives a structured `{ok:false, error, errorReason}` from
  `ijfwMcpClient` (via a thin `ijfwBridge` pass-through), and the main process already logs every
  failure. `IjfwSetupStatus.tsx` reads only `r?.ok` and renders a hard-coded "Degraded (not
  reachable)" / fixed Test-fail string — the reason is discarded in both the mount probe (`:83-88`)
  and the Test button (`:146-151`). The probe checks the **correct** surface (stdio MCP is what
  runtime memory uses; **no** 37891/HTTP daemon exists — 0 grep hits). The "lie" is a renderer
  discard; the likely false-negative is the narrow `ijfw_state` verb failing on older MCP servers.
- **#853** — wcore exec failures surface through `WCoreManager.emitStartFailure` (`:1216`) and
  `handleProcessExit` (`:1185`). The #484 stderr-tail+exit-code enrichment already covers
  start-then-die/hang. The real gaps: **no `childProcess.on('error')` handler** (`ENOENT`/`EACCES`
  from AV/signature block go unhandled → crash/generic), **`signal` dropped on exit** (AV `SIGKILL`
  → "code null"), and **no log link**. Provider API errors already render verbatim (stream
  `type:'error'`) — out of scope.

**Recommended minimal fix:**
- **#891 (D-04, renderer, S):** thread `error`/`errorReason` into the runtime-row detail
  (`IjfwSetupStatus.tsx:133-135`) and Test-fail text (`:221-224`); verify (don't duplicate) the
  existing client logging; optionally align the probe verb to a memory-path read (Sean/planner call).
- **#853 (D-05, main+chat, M):** add `spawnedChild.on('error')` capturing errno + reject
  (`index.ts:~694`); capture `signal` in `on('exit')` (`:696`) and include it in the init reject
  (`:729-742`); append a discoverable log link (via `app.getPath('logs')` + `shell.openPath`) in
  `WCoreManager` (`:1205-1229`, `:1175-1198`). Route all new strings through `redactSecrets`.

**Shared surfacing pattern:** Principle-only (#656), not code — the two surfaces consume different
shapes across different tiers. The one reusable primitive is the "Open logs" affordance
(`app.getPath('logs')` + existing `shell.openPath`/`showItemInFolder`); build it in D-05, optionally
reuse in D-04, don't couple them.

**Packet split:** **TWO — D-04 (#891) and D-05 (#853).** Disjoint files, different tiers, different
sizes, and the singular `github_issue: NN` auto-close frontmatter (matching D-01/#890, D-03/#885)
all argue against one packet. This one RESEARCH.md seeds both plans.

**Test plan:** Extend the four existing vitest files — `IjfwSetupStatus.dom.test.tsx` +
`ijfwMcpClient.test.ts` (#891, assert a structured failure surfaces its reason, not "Degraded"),
`WCoreManagerStartFailure.test.ts` + `WCoreManagerProcessExit.test.ts` (#853, assert an errno-shaped
reject and a `code=null`+`SIGKILL` exit surface the errno/signal + log-link marker, not generic
text). No Wave 0 gaps — all harnesses exist. Live-verify: MCP-absent install for #891; binary
rename/chmod-000 (or AV/signature block) for #853, on the packaged (`bun run package`) build.

**BLOCKER:** None. The one soft unknown (exact #891 false-negative vector, A1) does **not** block —
the surface-the-reason fix is correct regardless and makes the vector self-diagnosing. If a hard
answer is wanted before coding, the option is to obtain the reporter's electron-log excerpt; the
recommendation is to proceed and let the honest reason confirm the vector on first live reproduction.
