---
phase: WLD-D-inbox-repairs / D-04
verified: 2026-07-24T11:00:00Z
status: human_needed
score: 6/6 must-haves verified (code-provable), 1 packaged live-verify pending
behavior_unverified: 1
overrides_applied: 0
github_issue: 891
behavior_unverified_items:
  - truth: "In the PACKAGED app, a genuinely-degraded Memory runtime (older ~/.ijfw/mcp-server missing ijfw_state → mcp_error, or absent server → spawn_error/timeout) surfaces the REAL reason on both the runtime row and the Test button, and the same reason is present in the electron-log; a healthy install still shows Live / Test pass."
    test: "bun run package (then revert src/process/services/constitution/constitutionFsAuthority.generated.ts, which prepackage regenerates). Point the running app at a degraded MCP install; open Memory settings; confirm the runtime row and Test button now show the real cause (e.g. 'Degraded (not reachable): method not found: ijfw_state', or a spawn_error/timeout reason) instead of a bare label, and that the reason is in the electron-log. Separately confirm a healthy install still renders Live / Test pass."
    expected: "Degraded install shows the real reason on BOTH surfaces + in the log; healthy install stays Live/pass."
    why_human: "The #891 symptom (unexplained 'Degraded') manifests in the shipped/packaged app against a REAL degraded MCP child (real spawn/timeout/mcp_error vector). Unit DOM tests prove the renderer no longer discards the reason end-to-end with the real component code path, but the packaged-artifact acceptance against a real degraded install is the Milestone D acceptance, run by hand by the orchestrator + Sean. Do NOT build the packaged app in this verification pass."
human_verification:
  - test: "Packaged live-verify — bun run package, point at a degraded MCP install (missing ijfw_state / absent server), confirm the runtime row AND Test button show the real reason and the reason is in the electron-log; confirm a healthy install stays Live / Test pass."
    expected: "Degraded → real reason on both surfaces + log; healthy → Live/pass."
    why_human: "Packaged-artifact acceptance against a real degraded MCP child — the single remaining Milestone D acceptance step."
---

# Phase D-04: Memory shows false "Degraded" (#891) — Verification Report

**Phase Goal:** The Memory status UI surfaces the REAL failure reason (`error`/`errorReason` from `ijfwMcpClient`, already on the wire) in BOTH the mount-probe runtime row AND the Test-button fail text — instead of a bare/hard-coded "Degraded" — without changing the probe transport/verb (`state`) or adding an HTTP/37891 probe, renderer-only, and never rendering literal "undefined"/"null"/"".
**Verified:** 2026-07-24T11:00:00Z (final state HEAD `2a1fec79f`, the cross-audit fold)
**Status:** human_needed
**Re-verification:** No — initial verification

## Verdict

**GOAL MET** at the level unit-verification + static analysis can prove, with the packaged live-verify as the single named remaining Milestone D acceptance (expected, not a gap).

Every one of the 6 goal-backward points is demonstrably true in the code and locked by a passing test. The fix is exactly the LOCKED renderer-only boundary the plan promised: the two files `IjfwSetupStatus.tsx` + its DOM test and NOTHING else — the `ijfwMcpClient` / `ijfwBridge` / `ijfw.ts` producer contract and every main-process file are byte-identical to base. Tests were authored first (commit `7cf75d746`, RED), the fix (`da25c88e5`) flips the reason-surfacing tests green, and the cross-audit fold (`2a1fec79f`) reuses the existing localized labels and adds the empty-string `||` fallthrough — all still green. DOM suite 15/15 pass, `tsc --noEmit` exit 0, both re-verified by me on this tree.

Scope integrity holds: the deferred `state → memory_*` probe-verb alignment is NOT required to close #891's reported symptom — the reporter's literal complaint is an unexplained, seemingly-unlogged "Degraded", and surfacing the real reason on both surfaces delivers exactly that. The honest caveat below is preserved.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | On a probe/Test failure carrying a reason, the UI shows the real reason (localized lead + raw reason), and the tests assert the RAW reason reaches the DOM (substring), not just a verdict flip | ✓ VERIFIED | Component: runtime row `IjfwSetupStatus.tsx:171-181` renders ``${t('...status_runtime_degraded'...)}: ${runtimeReason}`` when a reason is present; Test-fail span `:277-285` renders ``${t('...test_fail'...)}: ${testFailReason}``. Tests assert `textContent`.toContain the raw machine string: mount test `IjfwSetupStatus.dom.test.tsx:136-144` (`runtime.textContent` contains `'method not found: ijfw_state'`), Test-button test `:189-198` (`result.textContent` contains `'method not found: ijfw_state'`). Substrings on rendered text, not verdict-only. DOM suite ran: 15/15 PASS. |
| 2 | The lead REUSES existing localized keys (`status_runtime_degraded` / `test_fail`) — no English-only `_lead` keys remain, and every locale gets its translated label + the raw reason | ✓ VERIFIED | `grep '_lead' IjfwSetupStatus.tsx` → 0 matches. The reason path (`:176-178`) and the bare-fallback path (`:179-181`) call the SAME key `memory.settings.status_runtime_degraded`; the Test-fail reason path (`:280-282`) and fallback (`:283-285`) call the SAME `memory.settings.test_fail`. The raw reason is concatenated OUTSIDE `t()` as data. Any locale's translation of those two existing keys is preserved as the lead. (This was the `2a1fec79f` fold: "reuse localized labels".) |
| 3 | Fallbacks: no-reason failure → bare localized label (no "undefined"); empty-string `error` → falls through to `errorReason` (the `||` fix); success → Live; reject → sane pending state; all covered by tests | ✓ VERIFIED | `probeFailureReason` uses `fail.error \|\| fail.errorReason` (`:39`) — empty string falls through. Tests: empty-string `:156-164` (`{error:'', errorReason:'timeout'}` → contains `'timeout'`); no-reason `:166-176` (contains `'Degraded (not reachable)'`, `not.toContain('undefined')`); reject `:178-187` (`data-status='pending'`, `not.toContain('undefined')`); success `:49-59` (runtime `data-status='ok'` → 'Live'); Test-button no-reason `:200-211` (fixed string, `not.toContain('undefined')`). All GREEN. |
| 4 | Invariants: probe verb still `state` at BOTH call sites; no HTTP/37891/daemon; `ijfwMcpClient`/`ijfwBridge`/`ijfw.ts` + all main-process files byte-identical to base; main-side failure logging intact | ✓ VERIFIED | `verb: 'state'` at the mount `useEffect` (`:107`) and `handleTest` (`:193`). No `37891` / HTTP-daemon probe in the ijfw path (the only `http://127.0.0.1` hits are CDP DevSettings/Docker guides, unrelated). `git diff --name-only 8a4d3be96 HEAD -- src/` shows ONLY `IjfwSetupStatus.tsx` from D-04 (+ 3 wcore files that belong to D-05/#853, not this packet) — `src/process/services/ijfw/ijfwMcpClient.ts`, `src/process/bridge/ijfwBridge.ts`, `src/common/types/ijfw.ts` are NOT in the changed set = byte-identical. All three D-04 commits touch ONLY the two renderer/test files. Producer failure fields present + untouched in `ijfwMcpClient.ts` (`error`+`errorReason` at `:187/195/198/226/238`, `mcp_error`/`mcp_crashed`/`validation_failed`/`timeout`/`spawn_error` codes intact). |
| 5 | Exit bar: DOM test file + `tsc --noEmit` pass, re-verified by me | ✓ VERIFIED | `vitest run IjfwSetupStatus.dom.test.tsx --project dom` → **15 passed / 15** (1 file). `tsc --noEmit -p tsconfig.json` → **exit 0, zero diagnostics**. Both run by me on this tree. Full 15k suite: executor-reported 15,637/0 pre-fold — REPORTED, NOT RE-VERIFIED here (the DOM subset + tsc I confirmed myself, per directive); the fold commit `2a1fec79f` is renderer-display-only and does not touch any other suite's inputs. |
| 6 | Scope integrity: deferring the `state → memory_*` probe-verb alignment does NOT leave #891's reported symptom unresolved | ✓ VERIFIED | The reporter's literal complaint (`#891`) is an unexplained "Degraded" with no surfaced cause. Surfacing the reason on BOTH surfaces (truths 1–3) fully retires THAT symptom. The deferred alignment changes what "reachable" *asserts* (a MEDIUM-risk semantic change, `D-04-PLAN.md:264-281`) and is a separate call. HONEST CAVEAT preserved: a working memory on an OLDER MCP server that lacks `ijfw_state` will still show amber — but now WITH a reason (`Degraded (not reachable): method not found: ijfw_state`), which is precisely the self-diagnosing signal the deferred follow-up needs before it is decided. |
| 7 | PACKAGED app: a degraded install surfaces the real reason on both surfaces + in the log; a healthy install stays Live/pass | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Renderer path proven by 15/15 DOM tests against the real component. The packaged-artifact acceptance against a REAL degraded MCP child (real spawn/timeout/mcp_error) is the Milestone D acceptance, run by hand (orchestrator + Sean). Not attempted here by directive. See Human Verification. |

**Score:** 6/6 code-provable truths verified; 1 packaged live-verify present-but-behavior-unverified (the shipped-artifact acceptance, by construction run by hand).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/renderer/pages/settings/components/IjfwSetupStatus.tsx` | renderer-only reason-threading in both failure branches + `probeFailureReason` helper, reusing existing localized keys | ✓ VERIFIED | `probeFailureReason` (`:36-40`, `\|\|` fallthrough); `runtimeReason`/`testFailReason` state (`:82-83`), set in the mount `.then` (`:113-118`), cleared on success/`!installOk`/reject (`:101-102, :111-112, :123-125`); `handleTest` captures `testFailReason` on `!result.ok`, clears on running/pass, undefined on catch (`:188-207`). Runtime-row (`:171-181`) + Test-fail (`:277-285`) render lead+reason. Wired: the two failure branches of the live component. |
| `tests/unit/renderer/settings/IjfwSetupStatus.dom.test.tsx` (extend) | reason-surfacing + fallback/regression locks | ✓ VERIFIED | 213 lines, 15 tests. Reason tests 1/2/5 (mount `error`, mount `errorReason`, Test-button `error`) + empty-string fallthrough + no-reason/reject/Test-button-no-reason regression guards + all pre-existing happy-path tests. RED authored first (`7cf75d746`), GREEN after fix. 15/15 pass. |

### Key Link Verification

| From | To | Via | Status |
|------|----|----|--------|
| mount `useEffect` probe | `runtimeReason` | `.then` on `!r.ok` → `probeFailureReason(r)` stored, cleared on ok/reset/reject | ✓ WIRED |
| `runtimeReason` | runtime-row `warn` detail | `runtimeState==='warn'` + present reason → `` `${t(degraded)}: ${runtimeReason}` `` | ✓ WIRED |
| `handleTest` probe | `testFailReason` | `!result.ok` → `probeFailureReason(result)`; reset on running/pass; undefined on catch | ✓ WIRED |
| `testFailReason` | Test-fail span | `testState==='fail'` + present reason → `` `${t(test_fail)}: ${testFailReason}` `` | ✓ WIRED |
| `IjfwInvokeResult.error`/`errorReason` (producer, on the wire) | renderer | consumed unchanged; producer contract byte-identical to base | ✓ WIRED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| D-04 DOM test file | `vitest run IjfwSetupStatus.dom.test.tsx --project dom` | 15 pass / 0 fail | ✓ PASS |
| Typecheck | `tsc --noEmit -p tsconfig.json` | exit 0, 0 diagnostics | ✓ PASS |
| Probe verb unchanged | grep `verb: 'state'` (both call sites) | `:107`, `:193` | ✓ PASS |
| ijfw producer/bridge/types + main untouched | `git diff --name-only 8a4d3be96 HEAD -- src/` | only `IjfwSetupStatus.tsx` (D-04); ijfw core absent | ✓ PASS |
| Packaged degraded install shows real reason | `bun run package` + open Memory settings on a degraded install | not run (by directive) | ? SKIP → human |

### Anti-Patterns Found

None. No `TODO/FIXME/XXX` introduced. `probeFailureReason` deliberately uses `\|\|` (not `??`) so an empty-string `error` falls through to the code — a documented, tested design choice (`:38-39`, test `:156-164`), not a bug. No literal "undefined"/"null"/"" can render: the reason is only concatenated when truthy, and two regression tests assert `not.toContain('undefined')`. The reason is rendered as inert React-escaped text (Threat T-D04-02 accept), and the surfaced string is app-composed, not raw stderr (T-D04-01 accept, redaction on the logging path unchanged).

### Requirements Coverage

| Requirement | Source | Description | Status | Evidence |
|-------------|--------|-------------|--------|----------|
| #891 | github_issue | Memory shows false/unexplained "Degraded" | ✓ SATISFIED (code); packaged acceptance pending | Renderer now surfaces the real reason on both surfaces; auto-closes on merge (`github_issue: 891`) |

### Gaps Summary

No goal-blocking gaps. The fix is the exact LOCKED renderer-only boundary the plan promised — two files, verb `state` unchanged at both call sites, no HTTP/37891/daemon added, the `ijfwMcpClient`/`ijfwBridge`/`ijfw.ts` producer contract and all main-process code byte-identical to base, and main-side failure logging intact. Every goal-backward assertion is pinned by a passing test that checks the RAW reason substring in the DOM (not a verdict flip). The `||` empty-string fallthrough and the no-reason/reject fallbacks are tested to never render "undefined". Reason surfacing is honest and additive: happy-path Live/Test-pass assertions did not move.

The single outstanding item is the packaged live-verify — opening a genuinely-degraded MCP install in the shipped artifact and confirming both surfaces show the real cause (and it lands in the electron-log), while a healthy install stays Live/pass. This is the Milestone D acceptance, run by hand by the orchestrator + Sean; it is expected, not a defect. Status is therefore `human_needed`, not `passed`. Do NOT build the packaged app in this verification pass.

Honest caveat carried forward (truth 6): a working memory on an older MCP server missing `ijfw_state` will still show amber — but now WITH the reason on screen, which is exactly the signal the deferred `state → memory_*` probe-verb alignment needs before Sean decides it.

---

_Verified: 2026-07-24T11:00:00Z_
_Verifier: Claude (ferrox-verifier)_
