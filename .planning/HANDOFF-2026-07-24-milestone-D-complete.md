# HANDOFF — 2026-07-24 — Milestone D BUILD-COMPLETE + desktop inbox triage

**Read this first on resume.** All code is LOCAL on branch `worktree-agent-desktop-integration` in
the canonical worktree **`~/dev/wayland-worktrees/desktop-integration`** (worktree of `~/dev/wayland/app`,
remote `ferrox` → FerroxLabs/wayland). Nothing pushed. Full detail: `.planning/STATE.md` (the "ALL
Milestone-D packets BUILT" block is the source of truth).

## State: Milestone D build queue is COMPLETE (local, unshipped)
Built this session, each through the full Ferrox loop (research → plan → plan-check → build →
cross-audit → verify). 35 commits (`0188de8f6..4d1197f20` + inbox docs). Full suite 15,688/0, tsc clean.

| Packet | Issue(s) | Notes |
|--------|----------|-------|
| D-03 | #885 Skill Guard builtin exemption | real-bundle harness verified (2106/2106 exempted, anti-spoof) |
| D-04 | #891 memory false "Degraded" | reason surfaced; reuses localized keys |
| D-05 | #853 exec/process errors | real Node ENOENT/SIGKILL harness verified |
| D-06 | #909/#910/#508/#882 UI clarity | first packet through the CORRECTED 4-model panel; #910b "Chats" needs Sean ratify |
| D-07 | #723 in-place per-step context reset | reset+seed GO (harness-proven live shape); **FIX-5 over-engineering removed** |

**D-07 lesson (important):** the 4-model panel + my own harness caught a REAL production blocker (the
seed was inert on the live message shape, tests false-green). Fixed. Then I over-engineered "FIX 5" (a
turn-settle serialization guard) and burned 2 audit rounds on my own addition. RESOLVED by verifying the
race was unreachable (`acceptStep` only fires from a settled `awaiting_input` checkpoint) and DELETING
FIX 5. Standing rule now: audits gate PLANNED scope; verify a threat is reachable before guarding it;
calibrate audit depth to blast radius. Memory: `feedback-audit-intensity-and-self-invented-scope`.

## Cross-audit method (Sean corrected mid-session, ×2)
The Cross Audit step = **4-model panel on the same diff: Codex 5.6 Sol + Gemini 3.1 Pro + Kimi K3 +
internal Claude adversarial**, all native subscription CLIs (Kimi = `~/.kimi-code/bin/kimi -p … --output-format text`,
NOT Flux). Exact invocations: memory `cross-audit-panel-invocations`. Panel harness (panel.sh drivers) in
scratchpad `xaudit-d0{6,7}/` — reusable.

## PENDING — batched by-hand pre-publish pass (Sean + me; waiting on Core a while)
1. **Packaged-GUI live-verify** of every packet (`bun run package`, revert `constitutionFsAuthority.generated.ts`
   after) + a11y gate. Desktop fixes are Core-independent → runs against the current bundled Core.
2. **D-07 token-cost sweep (money):** ≥4-step wcore workflow, tool-heavy/long dependent step → confirm
   per-step `session_cost` input stays FLAT (O(1)), dependent step works, visible transcript intact.
3. **#910b "Chats"** ratify (or `git revert 8f713ea04`).
4. **#537** close comment on Sean's nod (draft `D-02-CLOSE-COMMENT.md`; confirm release-status gate).
5. Recommended solo de-risk first (no Sean): package once, confirm clean launch + smoke + a11y across the
   batch, draft release notes, park ship-ready pending the new Core bundle.

## DESKTOP INBOX TRIAGE (2026-07-24) — desktop-only per Sean; Core routed separately
**Sean's call:** Core team is already on the Windows-exec cluster; Sean routes all Core-side items. We
handle DESKTOP ONLY. **Core-routed, NOT ours:** PR `wayland-core#254` (@frankforges `fix(sandbox/windows):
DACL cost storm + DLL-init`; linked to ~13 issues #921/#892/#912/#918/#908/#756/#552/#711/#737/#744/#453/
#324/#267 + #520/#618/#743; security-sensitive sandbox relaxation, maintainer decision); #923/#924
(`tool_call_id` 400 / lossy `.ijfw` handoff); #914 (Microsoft/AV block — Core exe signing); #907 (OpenClaw
gateway protocol 3-vs-4 — engine); #916 (team-coordination tools — likely engine); #902/#507/#552 (provider/Core).

**Desktop reports = mostly ALREADY FIXED this session (close on the release that bundles this branch):**
| Issue | Report | Fixed by |
|-------|--------|----------|
| #909 | "Backend/Runtime Not Visible" | D-06 runtime pill ✅ |
| #910 | pinned chat not under Recents / Conversations-vs-Chats confusion (title "Syntax Error" is misleading) | D-06 vocab align (Pin/Chats) — **PARTIAL: verify the discoverability behavior; our fix was labels, not Recents surfacing** |
| #885 | Skill Guard blocks builtin skills | D-03 ✅ |
| #891 | memory false "Degraded" | D-04 ✅ |
| #853 | generic exec errors | D-05 ✅ |
| #508 / #882 | spend indicator / project-on-tabs | D-06 ✅ |
| #890 / #537 | whatsapp bridge / send email | D-01 ✅ |

None can be `fixed-pending-release` yet (nothing pushed/shipped). They close on release. **Do NOT post to
GH until shipped.**

**New desktop items needing Sean:**
- **#910 discoverability follow-up** — at live-verify, confirm a pinned chat now surfaces where the user
  expects. If not, small D-06 follow-on (our fix was Pin/Chats vocab, not Recents surfacing).
- **#905** (@mikecaffrey212) — enhancement: Concierge-style agent that auto-reports bugs + collects
  diagnostics (version/OS). Desktop feature request; Sean's north-star call (aligns with the concierge concept).
- Reporter responses landed on desktop-adjacent need-info issues — read + act next desktop inbox pass.
- When ready: `/ferrox-inbox --issues --repo FerroxLabs/wayland` scoped to desktop (last full council 2026-07-23).

## Guardrails (unchanged)
LOCAL only — no push/merge/release without Sean. gh writes = FerroxLabs (re-assert — drifts to TradeCanyon;
FerroxLabs IS currently active). Sean Writer voice, zero em dashes, no backticks in comment bodies, signed
"All the best, The Wayland Team". No AI signatures in commits/PRs. Every FIX through the Ferrox Factory loop.
Source of truth: this file → `.planning/STATE.md`.
