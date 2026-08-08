---
phase: WLD-K-core-first
plan: K-03
milestone: WLD-K
type: execute
size: S/M
risk: low
wave: 1
depends_on: []
files_modified:
  - src/process/agent/wcore/desktopContractV1.ts
  - tests/unit/process/agent/wcore/desktopContractV1.test.ts (extended)
  - tests/integration/wcore/streamEndUnterminatedLine.test.ts (new)
  - tests/integration/wcore/fixtures/unterminatedLineHarness.ts (new)
  - tests/unit/renderer/wcoreRunningStateOnContentFreeFinish.dom.test.tsx (new)
autonomous: false
blocking: false
requirements: [TRN-01, TRN-02, TRN-03]
must_haves:
  truths:
    - A chat turn whose final frame (stream_end or error) is fully written to wcore's stdout is shown as finished in the Desktop UI the moment those bytes are received, independent of whether/when the frame's trailing newline delimiter arrives.
    - A turn with no assistant text at all (no tool calls, no content deltas) still clears the running state and the elapsed-time badge the instant its terminal frame is complete.
    - A turn that ends via an `error` frame is treated identically to `stream_end` for running-state purposes.
    - No existing wcore turn-completion, tool-reconciliation, or Desktop v1 contract-validation behavior regresses.
  artifacts:
    - src/process/agent/wcore/desktopContractV1.ts (new findCompleteObjectEnd scanner, awaitingOrphanDelimiter field, eager-recovery wiring in consumeChunk)
    - tests/unit/process/agent/wcore/desktopContractV1.test.ts (K-03 describe block: eager recovery + anti-regression cases)
    - tests/integration/wcore/streamEndUnterminatedLine.test.ts + fixtures/unterminatedLineHarness.ts (real OS-process proof)
    - tests/unit/renderer/wcoreRunningStateOnContentFreeFinish.dom.test.tsx (permanent UI-layer proof)
  key_links:
    - consumeChunk's eager-recovery path calls the SAME consumeLine validation every normal line uses (no bypass of schema/reducer checks)
    - DesktopCoreV1Consumer (fixed) -> WCoreAgent.handleEvent's existing 'stream_end'/'error' cases -> onStreamEvent('finish'/'error') -> WCoreManager 'wcore.message' handler -> ipcBridge.conversation.responseStream -> useWCoreMessage -> OrbitThinking (every link past the fixed layer is ALREADY correct, proven by execution, and is UNCHANGED by this plan)
---

<objective>
Fix the confirmed Desktop-side defect where a turn Wayland Core has already finished (a
`stream_end` with `finish_reason: 'stop'`, emitted around 40s) is still shown "running" in the
Desktop UI minutes later, with nothing further in the log — on the already-shipped 0.12.25 engine.

## Root cause — what was verified by execution vs. what remains hypothesis

**REFUTED by direct execution, not by reading source (per this milestone's proof standard).** The
task brief's working hypothesis was: "the running-state exit is gated on receiving assistant
content rather than on the terminal event itself, so a content-free `stream_end` never clears it."
This is FALSE for every Desktop-side layer that was actually run:

1. `WCoreAgent.handleEvent`'s `case 'stream_end':` (`src/process/agent/wcore/index.ts:1057-1066`)
   unconditionally emits `{type:'finish', ...}` and stops the stall watchdog regardless of payload
   content — read, not just executed, but corroborated by (2)-(4) below.
2. `WCoreManager`'s `wcore.message` handler (`src/process/task/WCoreManager.ts:1705-1730`) sets
   `this.status = 'finished'` and calls `notifyTurnCompletion()` on ANY `finish`, content or not —
   EXECUTED: `npx vitest run tests/unit/WCoreManagerTurnCompletion.test.ts` — 10/10 passed,
   including `'notifies when turn has empty content'` and `'AC-6: error-only turn marks status
   finished'`.
3. `DesktopCoreV1Consumer`'s `OrdinaryTurnToolReducer` (`src/process/agent/wcore/
   desktopContractV1.ts:208-273`) does not gate `stream_start -> stream_end` (no `text_delta` in
   between) on content — EXECUTED: `npx vitest run tests/unit/process/agent/wcore/
   desktopContractV1.test.ts` — 37/37 passed, including the exact `stream_start -> stream_end`
   (no text) sequence at line 327-329 of that file.
4. `useWCoreMessage`'s `case 'finish':` (`src/renderer/pages/conversation/platforms/wcore/
   useWCoreMessage.ts:177-244`) clears `streamRunning`/`waitingResponse`/`hasActiveTools`
   unconditionally. EXECUTED: a throwaway probe (`renderHook(() => useWCoreMessage(...))`, emit
   `start` then `finish` with `data:{finish_reason:'stop'}` and NO intervening content/tool_group
   frame) asserted `result.current.running === false` — PASSED, then the probe file was deleted
   (not part of this plan's deliverable; superseded by the permanent version in Task 1).
5. `OrbitThinking`'s elapsed-seconds badge (`src/renderer/components/chat/observability/
   OrbitThinking.tsx` — this is the literal "still running / 368s" UI) is driven by `isProcessing`,
   which is `running` from (4) via `WCoreChat.tsx`'s `onRunningChange={setIsProcessing}`. Traced,
   not independently executed beyond (4) since it is a pure prop pass-through.

**CONFIRMED by direct execution — the actual mechanism.** `DesktopCoreV1Consumer.consumeChunk()`
(`desktopContractV1.ts:739-778`) requires a literal LF byte (`0x0a`) to recognize a complete
protocol line (`cursor.indexOf(0x0a)`; if none is found, the partial bytes are stored in
`this.inputRemainder` and the loop breaks — `desktopContractV1.ts:748-756`). A throwaway probe
proved this directly: feeding the consumer a complete, valid `stream_end` JSON body with NO
trailing newline returns `[]` (zero results — nothing parsed, nothing logged, nothing forwarded to
`handleEvent`); feeding the missing `\n` byte in a second call THEN returns the event. The ONLY
place that ever inspects a non-empty `inputRemainder` again is `finishInput()`
(`desktopContractV1.ts:780-787`), called from exactly one site: `stdout.on('end', ...)`
(`index.ts:655-661`) — which fires only when the child closes its stdout (normally: process exit).
**If the engine process stays alive and simply goes idle after writing its last frame without a
trailing newline having arrived in that same `data` chunk, the frame is buffered forever with zero
observable effect** — no console output, no error, no forwarded event, nothing. This is an exact,
mechanical match for every reported symptom: "no further engine activity in the log" (genuinely
nothing more is written, so nothing flushes the buffer), the UI staying stuck (the byte-exact source
of the running-state signal never fires), and the fact that it is invisible to string-fed unit tests
(every existing test supplies a complete, `\n`-terminated line).

**What remains UNVERIFIED (no live wcore engine was available in this planning session):** whether
Core's real stdout writer actually produces a body/newline split in practice (e.g. Rust's
`LineWriter`-backed stdout flushing the JSON body and its `\n` in two separate underlying writes
under pipe backpressure). This plan's Task 1 proves the DESKTOP-SIDE consequence — that Desktop's
own parser has no recovery for this case — against a REAL, separately-spawned OS process (not a
string fixture), which is the strongest proof obtainable without Core's own source. Task 3's
checkpoint is where a human confirms this against the real engine, per the milestone's standing
rule that mechanism claims are established by execution against a real engine.

**#838 (`.planning/838-TURN-COMPLETION-DESIGN.md`) is UNRELATED — not a duplicate, not partial
coverage.** That design is about `ConversationTurnCompletionService.notifyPotentialCompletion` never
being called by four OTHER backends (`GeminiAgentManager`, `NanoBotAgentManager`,
`OpenClawAgentManager`, `RemoteAgentManager`), which starves the OS completion notification and
autonomous-workflow advancement on those four. `WCoreManager` already calls
`notifyPotentialCompletion` exactly once, correctly, from `handleTurnEnd()`
(`WCoreManager.ts:1028-1036, 1801`), unconditionally on every `finish` — proven by the executed
`WCoreManagerTurnCompletion.test.ts` suite above. This plan touches none of the four managers, none
of `WorkflowSessionService.ts`, and does not revisit #838's "keep parking on failure, notify on all
four backends" decision. TRN-01..03 are about the wcore UI's OWN local running-state clearing, which
is a strictly earlier, strictly lower-layer problem than #838's notification fan-out.

## The fix (Task 2) — cause-level, not a timeout

Per the explicit constraint, a wall-clock timeout that force-clears the running state is not
acceptable — it hides the bug rather than fixing it. The fix therefore makes recognition of a
complete frame depend only on the BYTES RECEIVED, never on a clock: `consumeChunk()` gains a small,
pure, byte-level scanner that detects when the bytes already buffered form one complete, structurally
valid JSON object (tracking `{`/`}` nesting depth and JSON string/escape state — every `WCoreEvent`
variant in `protocol.ts` is a JSON object, so the scanner short-circuits unless the buffer starts
with `{`), and forwards that object THE MOMENT it is complete, independent of whether its trailing
delimiter has arrived. A late-arriving delimiter for an already-recovered frame (the common, benign
case — a chunk boundary landing between the body and its `\n` by a few bytes, not a lost byte) is
reconciled so it is silently absorbed rather than misread as a new empty/malformed line.

## Design decisions this plan makes

1. **No index.ts change, no `finishInput()` signature change.** An earlier design draft added a
   defense-in-depth recovery path inside `finishInput()` (called from `index.ts`'s `stdout.on('end',
   ...)`). It is unnecessary: the per-chunk eager recovery in `consumeChunk()` runs on EVERY `data`
   event, including the very last one the engine ever writes, so by construction
   `this.inputRemainder` can only ever hold a genuinely INCOMPLETE fragment after this fix —
   `finishInput()`'s existing throw-on-nonempty-remainder path remains correct and reachable only for
   truly truncated/malformed trailing data (e.g. a mid-write crash), unchanged. This also avoids any
   file-conflict with the concurrently-in-flight K-01 packet, which also edits `index.ts`.
2. **Eager recovery reuses `consumeLine()` verbatim — no parallel validation path.** The scanner's
   ONLY job is finding the byte offset where a complete object ends; the object's actual grammar,
   schema (Ajv), known-event-type, and turn-sequencing (`OrdinaryTurnToolReducer`) validation all
   still run through the exact same `consumeLine()` call every normal, `\n`-terminated line goes
   through. A structurally-complete-but-semantically-invalid object (bad schema, wrong turn sequence)
   still fails closed exactly as it would have if it had arrived with its newline intact — this fix
   changes WHEN parsing is attempted, never WHAT is accepted.
3. **Orphan-delimiter reconciliation is mandatory, not optional.** Without it, this fix would
   regress the overwhelmingly common case: an ordinary, benign chunk-boundary split where the `\n`
   is merely delayed by microseconds into the next `data` event (not lost) would, post-fix, leave a
   lone `\n` at the front of the next chunk, which today's line-scanner would read as a zero-length
   line and fail closed as `malformed_json`. `awaitingOrphanDelimiter` tracks this exactly: set the
   moment an eager recovery consumes a frame without its own delimiter; on the next iteration of the
   scan loop (same chunk or a later one), a leading `\r\n` or `\n` is silently stripped and the flag
   cleared before normal scanning resumes. Task 1 includes an explicit anti-regression test for this.
4. **`DESKTOP_CORE_V1_PIN` / schema / manifest are untouched.** This fix changes byte-framing
   (when a line is considered "arrived"), never the wire contract (event shapes, schema, fixture
   digests). Grep-gated in Task 3.

## Explicitly out of scope for this plan

- `.planning/838-TURN-COMPLETION-DESIGN.md`'s four-backend `notifyPotentialCompletion` gap
  (Gemini/NanoBot/OpenClaw/Remote) and its two open questions for Sean — unrelated, untouched.
- `WorkflowSessionService.ts`, `parentTurnDriver`, `autonomousWatchdog`, `dispatchAutonomousStep` —
  autonomous-workflow advancement is downstream of #838, not of this defect.
- The `#746` idle turn-stall watchdog (`stallTimer`, `DEFAULT_TURN_STALL_TIMEOUT_MS`) — existing,
  already-accepted infrastructure for a DIFFERENT failure mode (the engine goes genuinely silent
  mid-turn with no terminal frame at all). This plan does not touch it, extend it, or rely on it; the
  fix here is orthogonal and strictly faster (bytes-driven, not a 10-minute ceiling).
- Renaming/relaxing the pre-existing test titled `'bounds raw JSONL frames, rejects invalid UTF-8,
  and requires a terminating newline'` (`desktopContractV1.test.ts:270`) beyond a documentation-only
  comment update if the executor judges its title now overstates what the assertions on lines
  271-274 actually require (they remain correct and green either way — see Task 1).
- K-02's DIA-01/DIA-02 error-surfacing work, K-04's engine asks — independent phases.
</objective>

<execution_context>
@$HOME/.claude/ferrox-core/workflows/execute-plan.md
@$HOME/.claude/ferrox-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/838-TURN-COMPLETION-DESIGN.md

@src/process/agent/wcore/desktopContractV1.ts
@src/process/agent/wcore/protocol.ts
@src/process/agent/wcore/index.ts
@src/process/task/WCoreManager.ts
@src/renderer/pages/conversation/platforms/wcore/useWCoreMessage.ts
@src/renderer/components/chat/observability/OrbitThinking.tsx
@tests/unit/process/agent/wcore/desktopContractV1.test.ts
@tests/unit/WCoreManagerTurnCompletion.test.ts
@tests/unit/wcoreTurnStallWatchdog.test.ts
</context>

<tasks>

**Task 1 — RED: write every regression test first (commit `test(K-03): add RED coverage for
unterminated stream_end/error recovery`).** No production edit in this task.

- **Extend `tests/unit/process/agent/wcore/desktopContractV1.test.ts`** with a new
  `describe('K-03: unterminated final line recovery', ...)` block, using the file's existing
  `negotiated()` helper to get a consumer past the `ready` handshake. Cases:
  1. `stream_start` (with `\n`) then a `stream_end` object (`finish_reason:'stop'`, no `usage`) fed
     as a single `consumeChunk` call WITHOUT its trailing `\n` — assert the SAME call already
     returns one `{kind:'event', event:{type:'stream_end', finish_reason:'stop', ...}}` (not `[]`,
     not a second call needed).
  2. Same shape but `type:'error'` with a non-null `msg_id` and a real `error:{code,message,
     retryable}` object, again with no trailing `\n` — recovered eagerly too (covers TRN-02's error
     path). Assert the reducer's turn-sequencing still applies: this must be preceded by a
     `stream_start` for the same `msg_id` in the test, exactly like every other ordinary-turn case
     in this file.
  3. The literal "no assistant text, no tools" repro: `stream_start` then IMMEDIATELY (no
     `text_delta`, no `tool_request` in between) a content-free `stream_end` with no trailing `\n` —
     recovered eagerly, `finish_reason` intact. This is the closest unit-level analog to TRN-03's
     required scenario.
  4. **Anti-regression (the orphan-delimiter case, mandatory):** feed the SAME `stream_end` body
     (no `\n`) in one `consumeChunk` call, assert it is recovered eagerly (one event, per case 1);
     THEN feed a SECOND `consumeChunk` call containing ONLY `\n` (the delayed, not-lost delimiter) —
     assert this second call returns `[]` (not a `malformed_json` error, not a second event) and
     `consumer`'s internal mode is still usable (a THIRD call with a fresh, complete,
     `\n`-terminated `stream_start`-shaped... actually any subsequent valid negotiated-mode event —
     e.g. a `config_changed` line — for a NEW exchange still parses normally, proving the consumer
     was not left in a poisoned state by the orphan `\n`).
  5. **Anti-regression (genuinely incomplete data is unaffected):** feed a deliberately truncated
     object body (e.g. `{"type":"stream_end","msg_id":"m1","finish_rea` — cut mid-field, no closing
     brace, no `\n`) — assert `[]` is returned, the consumer does NOT throw and does NOT flip into
     `'failed'` mode (a following complete, valid, `\n`-terminated line for the SAME or a fresh
     consumer state still parses normally afterward via a second `consumeChunk` call that supplies
     the rest of the body plus `\n`).
  6. **Anti-regression (non-object leftover falls back untouched):** feed a bare, non-`{`-leading
     byte sequence with no `\n` (e.g. a stray partial UTF-8 continuation or plain whitespace) —
     assert `[]`, no throw, unaffected by the new scanner's `{`-prefix short-circuit.
  Note directly above this new `describe` block: cases 1-4 are RED against today's code (case 1/2/3
  currently return `[]` where the assertion now expects the eager event; case 4's second call
  currently WOULD throw `malformed_json` on the orphan `\n` today, since nothing consumed the first
  object early) — cases 5-6 already pass unmodified today; call this out inline exactly as K-01's
  PRF-03 called out its own already-correct behavior, so the executor does not mistake "already
  green" for "test written wrong."
  Also add a one-line comment above the pre-existing test at line 270
  (`'bounds raw JSONL frames, rejects invalid UTF-8, and requires a terminating newline'`) noting
  that its own assertions (lines 271-274, a genuinely mid-object split at byte 17) remain accurate
  post-fix — the object is not yet complete at that split point, so it is correctly still buffered —
  and that the title describes the general case, not the new eager-completion exception added by
  this plan. Do not weaken or delete any existing assertion in that test.

- **New `tests/integration/wcore/fixtures/unterminatedLineHarness.ts`** — a small standalone script
  (no test-framework import, mirrors the house shape used for OS-level proofs elsewhere in this
  milestone's K-01 sibling packet): writes a `ready` line (with `\n`, minimal valid capabilities
  object), then a `stream_start` line for `msg_id:'m1'` (with `\n`), then writes the JSON body of a
  `stream_end` for `msg_id:'m1'` with `finish_reason:'stop'` and no `usage` field — the literal
  "no assistant text" case — via ONE `process.stdout.write(...)` call with NO trailing `\n`, then
  writes a marker file (path passed as a CLI arg) to signal the partial write is durably flushed to
  the OS pipe, then blocks forever (an unresolved `Promise` awaited at top level) so the parent test
  controls exactly when the process dies. The delimiter is never sent by this harness at all — this
  is the worst case from the report ("no further engine activity"), not merely a delayed delimiter.

- **New `tests/integration/wcore/streamEndUnterminatedLine.test.ts`** — `beforeEach`/`afterEach`
  around a fresh `mkdtemp` dir for the marker file (mirror the house pattern). Spawns the harness as
  a REAL, separate OS process (`child_process.spawn('bun', [harnessPath, markerPath], {stdio:
  [...]})`), wires the child's REAL `stdout` directly into a REAL `DesktopCoreV1Consumer` instance
  via `child.stdout.on('data', chunk => results.push(...consumer.consumeChunk(chunk)))` — the exact
  wiring `index.ts`'s `'data'` listener uses in production, reused here rather than reimplemented.
  Polls for the marker file to appear (proves the partial write physically landed in the OS pipe,
  not merely that the harness function returned), then asserts — with a bounded poll/wait, not a
  fixed `setTimeout` sleep — that `results` already contains one `{kind:'event', event:{type:
  'stream_end', finish_reason:'stop', msg_id:'m1'}}` entry BEFORE the child ever writes another byte
  or exits. Kills the child in `afterEach` regardless of outcome. This is the literal, unmocked,
  real-process proof: the exact reported defect, reproduced through a genuinely separate OS process
  whose delimiter genuinely never arrives, using the real production `DesktopCoreV1Consumer` class.
  RED: this assertion never becomes true against today's code (times out at the poll bound) — the
  real OS pipe delivers the partial write as a `data` event with no trailing `\n`, and today's code
  buffers it with zero observable effect, matching the report exactly.

- **New `tests/unit/renderer/wcoreRunningStateOnContentFreeFinish.dom.test.tsx`** — mirrors
  `wcoreFinishReconcile.dom.test.tsx`'s mocking shape (same `ipcBridge`/`useAddOrUpdateMessage`/
  `useTabResumeEffect`/i18n mocks) but drives the REAL `useWCoreMessage` hook and asserts on
  `result.current.running` directly (that file only asserts on `addOrUpdateMessage`'s tool_group
  calls, never on `running` itself — this is the gap). Emit `start` then `finish` with
  `data:{finish_reason:'stop'}` and NO intervening `content`/`tool_group`/`thought` frame at all —
  assert `result.current.running` transitions `true -> false`. This is ALREADY GREEN today (proven
  in this plan's own root-cause investigation above); include it as a permanent "preserve and prove"
  regression guard and as the literal UI-layer evidence for TRN-03, complementing Task 1's
  transport-layer RED cases (which are the actual defect).
  Verify: `npx vitest run tests/unit/process/agent/wcore/desktopContractV1.test.ts
  tests/integration/wcore/streamEndUnterminatedLine.test.ts
  tests/unit/renderer/wcoreRunningStateOnContentFreeFinish.dom.test.tsx` — new cases 1-4 in the
  contract test RED, cases 5-6 GREEN; the integration test RED (times out); the renderer test GREEN.
  Done: every assertion above is committed as `test(K-03): ...` before any production file changes.

**Task 2 — GREEN: eager, bytes-driven recovery of a complete-but-unterminated frame (commit
`fix(K-03): recover a complete stream_end/error frame without waiting for its newline`).** Touch
ONLY `src/process/agent/wcore/desktopContractV1.ts`.

- Add a private instance field `private awaitingOrphanDelimiter = false;` to `DesktopCoreV1Consumer`.
- Add a new pure, stateless function (module-level or `private static`) `findCompleteObjectEnd(buf:
  Buffer): number | null`. Contract: return `null` immediately if `buf` is empty or its first
  non-whitespace byte is not `{` (`0x7b`) — every `WCoreEvent` variant in `protocol.ts` is a JSON
  object, so this short-circuits everything else cheaply. Otherwise scan byte-by-byte tracking (a)
  `{`/`}` nesting depth, and (b) whether the scan position is currently inside a JSON string
  (toggled on an unescaped `"`, `0x22`) with escape-awareness (a `\` byte, `0x5c`, while inside a
  string causes the NEXT byte to be skipped from toggling/parsing, so an escaped quote or backslash
  inside a string value never mis-toggles nesting or string state). The moment depth returns to
  exactly zero after having gone positive, return the byte offset immediately AFTER that closing
  `}`. If the scan reaches the end of `buf` with depth still positive (or zero because it never
  opened), return `null` — genuinely incomplete. This function does no JSON-grammar validation
  beyond brace/string balance; `consumeLine()`'s own `JSON.parse` remains the real validator.
- In `consumeChunk()`'s `while (cursor.length > 0)` loop, at the TOP of each iteration, before the
  existing `cursor.indexOf(0x0a)` line: if `this.awaitingOrphanDelimiter` is true, check whether
  `cursor` begins with `\r\n` (`0x0d 0x0a`) or a bare `\n` (`0x0a`); if either matches, advance
  `cursor` past exactly that delimiter and clear the flag before proceeding with this same
  iteration's normal newline scan on the (now shorter) `cursor`. If `cursor` does not begin with a
  delimiter, leave the flag set (the delimiter may still be pending in a later chunk) and proceed
  normally — do not consume or alter `cursor` in this branch.
- In the existing `newline < 0` branch (today: caps size via `DESKTOP_CORE_MAX_LINE_BYTES`, stores
  `cursor` into `this.inputRemainder`, `break`) — AFTER the existing size cap check, BEFORE the
  existing buffer-and-break: call `findCompleteObjectEnd(cursor)`. If it returns a non-null offset
  `end`: decode `cursor.subarray(0, end)` via the SAME `UTF8_FATAL_DECODER.decode(...)` (try/catch,
  same `invalid_utf8` failure semantics as the normal path) used by the existing line-extraction
  code just above, and pass the decoded string to `this.consumeLine(line)` exactly as the normal
  path does — reuse, do not duplicate its parse/schema/reducer logic. Push the returned
  `DesktopCoreConsumeResult` onto `results`. If `consumeLine` throws (a genuine contract violation —
  bad schema, turn-sequence conflict, unknown critical type — completely independent of the missing
  delimiter), let it propagate exactly as it already does for the normal path (the surrounding
  `try {...} catch (error) { this.inputRemainder = Buffer.alloc(0); this.mode = 'failed'; throw
  error; }` around the whole loop already handles this — no new catch needed here). On success, set
  `this.awaitingOrphanDelimiter = true`, set `cursor = cursor.subarray(end)`, and `continue` the
  while-loop (NOT `break` — the remaining `cursor` may still contain a pending delimiter for THIS
  frame, and/or the start, or all, of a subsequent complete frame the engine already began writing
  in the same chunk; the next iteration's orphan-check and newline/eager-scan handle both correctly
  without special-casing). If `findCompleteObjectEnd` returns `null`, fall through to EXACTLY
  today's existing behavior (buffer `cursor` into `this.inputRemainder`, `break`) — zero change to
  this path for genuinely incomplete data.
- Head comment above the new logic: name it as the K-03 fix; state precisely what defect it closes
  (a complete `stream_end`/`error` object whose delimiter never arrives — engine stays alive and
  idle after writing it — left the running UI state stuck indefinitely with zero observable trace);
  state explicitly that recovery is triggered purely by having received enough bytes to form one
  complete, structurally valid JSON object, never by a timer, satisfying the "fix the cause, not a
  timeout" constraint.
- Do NOT touch `manifest.json`, `core-event.schema.json`, `host-command.schema.json`, any
  `DESKTOP_CORE_V1_PIN` field, `finishInput()`, or `index.ts` — see Design decision 1 above for why
  `finishInput()` needs no change (its throw path is provably unreachable for complete-but-
  unterminated data after this fix, by construction of where `inputRemainder` is ever assigned).
  Verify: re-run every Task 1 test file — all RED assertions now GREEN, all already-green assertions
  (cases 5-6, the pre-existing tests in this file, `WCoreManagerTurnCompletion.test.ts`,
  `wcoreTurnStallWatchdog.test.ts`) still GREEN, unchanged; full suite (`npx vitest run` /
  `bun run test:vitest`) green at baseline-plus-new-tests, 0 failures; `bun run typecheck`
  (`tsc --noEmit`) clean; grep gate — `manifest.json`, `core-event.schema.json`,
  `host-command.schema.json` byte-identical to pre-plan HEAD; `git diff --stat` shows exactly the
  five files listed in this plan's `files_modified`, nothing else.
  Done: a genuinely complete `stream_end`/`error` object is recognized and forwarded the instant its
  bytes are fully received, independent of when (or whether) its delimiter arrives; a delimiter that
  arrives late is silently reconciled with zero duplicate or spurious events; genuinely incomplete
  data is buffered exactly as before with zero behavior change; every existing test remains green.

**Task 3 — Exit bar: scope proof + live confirmation (human checkpoint, no code commit).**

- **Automated floor:** `npx vitest run` (or `bun run test:vitest`) green — record before/after test
  count against the stated baseline (**16,231 tests, 0 failures**; after should be baseline plus
  this plan's new assertions, still 0 failures). `bun run typecheck` clean.
- **Scope/grep gate:** confirm the ONLY files touched are the five listed in this plan's
  `files_modified` frontmatter. Confirm byte-identical-to-pre-plan-HEAD (`git diff` empty) for:
  `src/process/task/WCoreManager.ts`, `src/renderer/pages/conversation/platforms/wcore/
  useWCoreMessage.ts`, `src/renderer/pages/conversation/platforms/wcore/WCoreSendBox.tsx`,
  `src/renderer/components/chat/observability/OrbitThinking.tsx`,
  `src/process/task/ConversationTurnCompletionService.ts` (if that is its actual path — confirm via
  the import in `WCoreManager.ts`), `src/process/task/GeminiAgentManager.ts`,
  `src/process/task/NanoBotAgentManager.ts`, `src/process/agent/openclaw/index.ts`,
  `src/process/agent/remote/RemoteAgentCore.ts`, `src/process/agent/wcore/index.ts`. This is the
  literal proof that TRN-01/02/03 are closed entirely by fixing the shared transport-decode layer,
  with zero change to the layers already proven correct above it, and zero overlap with #838's
  unrelated four-backend gap.
- **checkpoint:human-verify** (no live wcore engine was available during planning; this is the
  execution-against-a-real-engine proof the milestone standard requires):
  1. Run a real Wayland Core chat turn end-to-end on 0.12.25 and confirm it still completes and
     shows correctly (no regression on the ordinary path).
  2. Reproduce the ORIGINAL reported repro as closely as possible (a prompt likely to end in a
     short, content-light `stream_end` quickly) and confirm the UI leaves the running state
     promptly — not after a multi-minute wait, not after an idle-watchdog halt message.
  3. Confirm a turn that ends via a real `error` frame (e.g., an invalid API key) also leaves the
     running state promptly.
  4. Spot-check a tool-heavy turn (multiple tool calls) completes and reconciles cleanly — the
     existing `#486`/`#746` suites already guard this; this is cheap live insurance, not new scope.
  5. If step 2 does not reproduce cleanly even pre-fix (i.e., the live engine's writer never
     actually splits the body from its delimiter in practice), say so explicitly rather than
     asserting the fix mattered — per this milestone's standard, a pass proves nothing about THIS
     fix unless the SAME repro is shown to fail without it (a negative control: temporarily revert
     Task 2's diff locally, confirm the same live repro still hangs, then re-apply and confirm it
     no longer does).
  Resume-signal: "approved" (all four legs of confirmation above hold, negative control performed)
  or a description of what was actually observed if the mechanism turns out to differ live.

</tasks>

## Do not do

- Do not add a NEW wall-clock timeout, polling interval, or "force-clear running after N seconds"
  anywhere. The fix must be triggered purely by bytes received, never by a clock.
- Do not touch, extend, or repurpose the `#746` idle turn-stall watchdog (`stallTimer`,
  `DEFAULT_TURN_STALL_TIMEOUT_MS`, `resolveTurnStallTimeoutMs`) — different failure mode, already
  has its own accepted mechanism, orthogonal to this fix.
- Do not touch `.planning/838-TURN-COMPLETION-DESIGN.md`'s subject matter: `GeminiAgentManager.ts`,
  `NanoBotAgentManager.ts`, `OpenClawAgentManager.ts` (agent/openclaw/index.ts),
  `RemoteAgentManager.ts`/`RemoteAgentCore.ts`, `WorkflowSessionService.ts`, or re-litigate the
  "park on failure, notify on all four" decision. Unrelated to TRN-01..03.
- Do not modify `manifest.json`, `core-event.schema.json`, `host-command.schema.json`, or any
  `DESKTOP_CORE_V1_PIN` field — the wire contract's event shapes are unchanged; only byte-framing
  changes.
- Do not touch `src/process/agent/wcore/index.ts` or change `finishInput()`'s signature — see
  Design decision 1; it is both unnecessary and would create a needless merge conflict with the
  concurrently in-flight K-01 packet, which also edits that file.
- Never relax, skip, or delete an existing test to make something pass.
- Never commit `src/process/services/constitution/constitutionFsAuthority.generated.ts`.
- No merge, no tag, no release, no PR. No `github_issue` frontmatter stamp — nothing is filed for
  this packet.
- Atomic commits per task (`test(K-03): ...`, `fix(K-03): ...`), subject under 72 chars, no AI
  attribution trailers.

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|--------------|
| wcore engine process (child, spawned by Desktop) -> Desktop main process | untrusted-by-default bytes on stdout; the Desktop v1 contract (schema + manifest + `OrdinaryTurnToolReducer`) is the validation boundary |
| the new eager-recovery scan window -> the same validation boundary | the scanner changes WHEN bytes are handed to `consumeLine`, not what `consumeLine` accepts |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|------------------|
| T-K03-01 | Tampering | `findCompleteObjectEnd` eager-recovery path in `consumeChunk` | low | mitigate | eagerly-recovered bytes are handed to the SAME `consumeLine()` call every normal, newline-terminated line goes through — identical Ajv schema validation, identical known-event-type check, identical `OrdinaryTurnToolReducer`/`WorkflowReducer`/`PolicyReducer`/`AnvilReducer` turn-sequencing enforcement. No new acceptance criteria are introduced; only the timing of when parsing is attempted changes. |
| T-K03-02 | Denial of service | `findCompleteObjectEnd`'s byte scan | low | mitigate | single linear O(n) pass, no recursion/backtracking, bounded by the pre-existing `DESKTOP_CORE_MAX_LINE_BYTES` cap which is checked before this scan runs; string/escape tracking is O(1) per byte. |
| T-K03-03 | Tampering | accidental weakening of the pinned Desktop v1 producer contract (`DESKTOP_CORE_V1_PIN`, schema/manifest files) | medium | mitigate | Task 3's grep gate asserts `manifest.json`, `core-event.schema.json`, `host-command.schema.json` are byte-identical to pre-plan HEAD; this fix touches only the transport line-framing strategy in `desktopContractV1.ts`, never the contract descriptor or schemas. |
| T-K03-04 | Repudiation / silent data loss | the pre-fix defect itself (a genuinely-received terminal frame vanishing with zero trace) | high | mitigate | this is the class of bug this entire plan closes; Task 1's real-OS-process integration test is the permanent regression guard against its reintroduction. |
| T-K03-SC | Tampering | supply chain (new dependency) | n/a | accept | zero new dependencies; the fix is pure TypeScript using only `Buffer`/`TextDecoder` already imported in this file. |

</threat_model>

<verification>
- `npx vitest run` (full unit + integration suite) green at baseline-plus-new-tests (baseline
  **16,231 tests, 0 failures**), 0 failures; `bun run typecheck` clean.
- `desktopContractV1.test.ts` new `describe('K-03: unterminated final line recovery', ...)`: a
  content-free `stream_end` and an `error` frame are each recovered the instant their bytes are
  complete, without their trailing `\n`; a subsequently-arriving orphan `\n` is silently absorbed
  (no spurious event, no `malformed_json`, consumer stays usable afterward); genuinely incomplete or
  non-object trailing data is unaffected (still buffered, still `[]`, no throw).
- `tests/integration/wcore/streamEndUnterminatedLine.test.ts`: a REAL, separately-spawned OS process
  whose `stream_end` delimiter is NEVER sent is still recovered by the real production
  `DesktopCoreV1Consumer`, proven against real OS pipe bytes, not a string fixture — the literal
  PRF-06-style "not simulated" proof standard applied to this defect.
- `wcoreRunningStateOnContentFreeFinish.dom.test.tsx`: the real `useWCoreMessage` hook's `running`
  state transitions to `false` on a content-free `finish` with no intervening content/tool frames —
  the literal TRN-03 UI-layer acceptance evidence.
- Pre-existing suites remain green, unchanged: `WCoreManagerTurnCompletion.test.ts`,
  `wcoreTurnStallWatchdog.test.ts`, `wcoreFinishReconcile.dom.test.tsx`, and every other test in
  `desktopContractV1.test.ts` (including the corpus replay and adversarial-vector tests).
- Grep/scope gate: `manifest.json`, `core-event.schema.json`, `host-command.schema.json` byte-
  identical to pre-plan HEAD; `git diff --stat` touches exactly the five files in `files_modified`.
- checkpoint:human-verify: a real wcore engine turn is confirmed live, with a negative control
  (Task 2's diff temporarily reverted) showing the SAME repro still hangs without the fix.

**Goal-backward check:**

| Must be TRUE (goal) | Producer behavior that makes it true | Proven by |
|----------------------|----------------------------------------|-----------|
| A turn Core ends is shown as ended, even with no assistant text (TRN-01, TRN-03) | `findCompleteObjectEnd` + eager `consumeLine` dispatch in `consumeChunk` recover a complete `stream_end` the instant its bytes arrive, independent of its delimiter | `desktopContractV1.test.ts` K-03 cases 1 & 3 + `streamEndUnterminatedLine.test.ts` (real process) + `wcoreRunningStateOnContentFreeFinish.dom.test.tsx` |
| The error path also terminates the running state (TRN-02) | Same eager-recovery path applies identically to `type:'error'` objects | `desktopContractV1.test.ts` K-03 case 2 |
| No unrelated behavior changes | `finishInput()`, `index.ts`, `WCoreManager.ts`, `useWCoreMessage.ts`, the four #838 backends untouched; contract schema/manifest untouched | Task 3 grep/scope gate |
| The fix is cause-level, not a hidden timeout | Recovery gates purely on byte-completeness (`findCompleteObjectEnd`'s brace/string scan), never on elapsed time | Task 2 code + Task 3 human review of the diff |

</verification>

<success_criteria>
A `stream_end` (or `error`) frame that Wayland Core has fully written to stdout is recognized and
forwarded by `DesktopCoreV1Consumer` the instant its bytes are complete, independent of whether or
when its trailing newline delimiter arrives — closing the exact, execution-proven gap where such a
frame could be buffered with zero observable trace if the engine went idle before flushing its
delimiter. This flows, unchanged, through the already-correct and already-proven layers above it
(`WCoreAgent.handleEvent`, `WCoreManager`, `useWCoreMessage`, `OrbitThinking`) to leave the Desktop
UI's running state and elapsed-time badge promptly and correctly. The error path (TRN-02) is covered
by the same mechanism. A permanent, real-OS-process regression test (not a string fixture) proves
this for the literal "no assistant text" repro (TRN-03) and stays green in the default suite forever
after. The fix introduces zero new timers, touches exactly one production file, and leaves
`.planning/838-TURN-COMPLETION-DESIGN.md`'s unrelated four-backend gap, the `#746` stall watchdog,
and the pinned Desktop v1 contract schema/manifest completely untouched. Full suite (baseline 16,231
tests plus this plan's additions) green, `tsc --noEmit` clean, and a live human checkpoint (with a
negative control) confirms the mechanism against a real wcore engine, since none was available during
planning.

## Acceptance gate

This plan is DONE when, and only when: (1) Task 1's tests exist and were RED against pre-fix code
for the eager-recovery assertions; (2) Task 2's fix makes them GREEN with zero regressions across
the full suite and `tsc --noEmit`; (3) Task 3's grep/scope gate shows exactly the five declared files
touched and nothing else; (4) the checkpoint:human-verify is resolved "approved" with an explicit
negative control against a real wcore engine — or, if the live mechanism is found to differ from
what this plan documents, that finding is recorded plainly rather than the checkpoint being rubber-
stamped.
</success_criteria>

<output>
Create `.planning/phases/WLD-K-core-first/K-03-SUMMARY.md` when done, recording: the refutation of
the content-gating hypothesis with the exact tests executed and their pass counts; the confirmed
unterminated-line buffering mechanism and how it was proven (both the string-fixture unit test and
the real-OS-process integration test); the `findCompleteObjectEnd`/`awaitingOrphanDelimiter`
implementation and the orphan-delimiter reconciliation rationale; explicit confirmation that
`.planning/838-TURN-COMPLETION-DESIGN.md` is unrelated and untouched; the grep/scope-gate result; and
the live checkpoint's outcome including the negative-control result.
</output>
