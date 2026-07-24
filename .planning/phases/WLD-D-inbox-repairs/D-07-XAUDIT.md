---
phase: WLD-D-inbox-repairs
plan: D-07
github_issue: 723
audit: cross-audit-panel
---

# D-07 CROSS-AUDIT PANEL — #723 in-place per-step context reset

4-model panel (Codex 5.6 Sol + Gemini 3.1 Pro + Kimi K3 + internal Claude) on
`git diff 57d8dcee6..1c0f72371`. Raw outputs in scratchpad `xaudit-d07/`. **All 4 legs: FIX-FIRST.**

## What all 4 legs CONFIRMED sound
- Reset genuinely drops accumulation: `getOrBuildTask({skipCache:true})` → `_buildAndCache` → `addTask`
  `beginTermination(existing)` kills the old engine process (internal leg traced live). The engine's
  `--resume` does NOT reliably restore history (`WCoreManager.ts:617-621`); context comes ONLY from the
  bounded `injectConversationHistory(seed)`. So the design intent (bounded context) is correct; the live
  `session_cost` sweep is the definitive money gate.
- #457 non-regression: the `preferLastAssistant` branch is flag-gated; default path byte-identical.
- wcore gate correct; visible transcript untouched (directive `hidden:true`, filtered at MessageList.tsx:325).

## BLOCKER (unanimous) — carry-forward selector is wrong for agentic steps
`findLastAssistantDeliverable` (resumeSeed.ts:154-167) returns a SINGLE last `left`+`text` row scanning
newest→oldest, with NO step-boundary stop and NO tool context. Failure modes (all real, all silent):
1. **Tool-heavy prior step** (Gemini + Codex CRITICAL): filters `type==='text'` only → drops the tool
   calls/results. A step whose deliverable was a file write leaves the seed empty or grabs an older step;
   "review the file you just wrote" has no file context.
2. **Boundary crossing** (internal HF-1): a tool-only prior step → scan walks PAST step N-1's tool+directive
   rows and returns step N-2's text → seeds the WRONG step.
3. **Trailing status text** ("Draft saved ✓") + **split deliverable** (Kimi/Codex/Gemini/internal): seeds
   the throwaway closer / last fragment, not the draft.

**Fix (locked):** seed the whole immediately-prior assistant TURN — accumulate all rows from the last
`right` (user/hidden-directive) boundary forward to the end (assistant text + its tool calls + tool
results, mirroring #457's retain-tool-history philosophy, bounded to that one turn), clip to maxChars.
Do NOT cross the previous `right` boundary into an older step. If the prior turn has no assistant text
(pure tool step), carry that turn's tool/file summary, NOT an older step.

## Also fix
- **16K head-clip** (Codex High, Gemini Med, Kimi Low): >16000-char deliverable loses its tail/closing
  structure. Add a >16K fixture asserting required content survives; decide clip strategy (accept + a
  telemetry counter is fine for v1, but TEST the boundary — the ~6K fixture never exercises it).
- **Serialization** (Kimi Med): the reset-send is now DESTRUCTIVE (respawn). Two concurrent advances
  (acceptStep IPC + driver/watchdog retry) could kill each other's fresh sessions → stall or double-exec.
  Add a minimal per-conversation guard around the reset-send, OR confirm+document a single-sender invariant.
- **Test coverage** (MF-2 / Lows): add fixtures for tool-only prior step, trailing status text, split
  deliverable, >16K. Add a thin test that the `workflowResetSeed` field threads to `buildResumeSeedTranscript`
  (W2 wiring). Drop/rewrite the vacuous reset-test #4.

## Live-verify gates (money, by hand — Sean + orchestrator)
- Per-step `session_cost` input tokens stay FLAT (O(1)) across a ≥4-step wcore workflow — the definitive
  answer to Codex's "inert?" concern.
- A tool-heavy dependent step ("refine the 2000-word draft / review the file you just wrote") works.
- Old engine processes do not leak (confirm process count bounded); no stale-session on a subsequent chat message.
- Visible transcript shows every step.
