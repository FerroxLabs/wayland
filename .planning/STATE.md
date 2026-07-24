---
gsd_state_version: '1.0'
status: in_progress
progress:
  model: milestones
  total_milestones: 3
  completed_milestones: 0
  active_milestone: 'A — Cockpit Preview Ship'
  phase1_construction: accepted-by-live-test
  percent: 78
---

# Project State

> **2026-07-21 RECONCILIATION.** This file was rewritten to match reality after the
> 2026-07-20 pivot. The prior state (3%, "Phase 1 / cohort authority successor",
> "signed M0B pending") described a cohort/M0B acceptance ceremony that Sean **killed**.
> Cohort backend deleted (`9b661a948`, −11.4k LOC). Acceptance model is now
> **Sean + Claude live-test together; a green Playwright sweep IS acceptance.**
> The old 7-phase / 40-packet model is recast into three milestones (A/B/C) below.
> The `execution/` packet adapter + `wayland-gsd-gate` are **dormant** (part of the
> killed ceremony); STATE.md + ROADMAP.md are the source of truth.

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** A provider-agnostic get-shit-done copilot that keeps chat immediately usable and progressively reveals all existing power.
**Current focus:** Milestone A — Cockpit Preview Ship (Wave A: package + matched-engine smoke).

## Current Position

**Milestone A — Cockpit Preview Ship** (ACTIVE) — the only live build work.
Wave A (package + matched-engine smoke) **landed** (A-02: packaged app proven working over CDP); Wave B (trust/a11y floor) largely landed; Wave C (hygiene) partially landed.

Last activity: 2026-07-23 overnight — 9 local commits (nothing pushed):
- **A-02 packaged smoke harness** `scripts/packaged-cockpit-smoke.mjs` — drives the PACKAGED hardened app over CDP (no fuse weakened); 12/12 surfaces + bridge + Flux connect + chat all pass. Hardened against 5 false-green paths found by an independent adversarial audit.
- **B-02 a11y burn-down** — 87% of gated violation nodes cleared (374 → 49); a11y gate green 6/6, baseline tightened.
- **Wave C i18n hygiene** — 22 orphaned cohort keys removed across 12 locales; 814 i18n tests pass.
- **Milestone B decision dossier** — all 7 scope items researched + recommended (`.planning/phases/WLD-B-scope/B-DECISIONS.md`), awaiting Sean's calls.
- **B-01 consent test hooks** added (unblocks the packaged consent E2E).
- Findings filed: onboarding-restarts-from-step-1 root cause; a stale-bundled-artifact test fragility (3 unit tests fail locally, pass clean — cleared).

Progress: [████████░░] ~78% (packaged smoke proven; a11y floor largely done; scope decisions armed)

### Reconciled Phase-1 truth (the old 40-packet safety foundation)
- **Accepted-by-live-test (construction complete):** the 20 non-cohort safety packets — all ship in Desktop v0.11.18, code present + wired + tested, exercised by the live sweep + full green suite. (01-06/07/08/09/10/11/12/13/15/16/19/20/21/22/24/35/36/37/38/40.)
- **SUPERSEDED — pivot 2026-07-20 (do not build):** the 20 cohort/M0B packets. 14 acceptance/ceremony (01-03/04/05/14/17/18/25/26/27/28/29/30/31/39) + 6 construction whose code was deleted (01-01/02/23/32/33/34).

## Milestones

| Milestone | Scope | Status |
| --------- | ----- | ------ |
| **A — Cockpit Preview Ship** | Wave A package + matched-engine smoke · Wave B trust/a11y floor · Wave C hygiene | **ACTIVE** |
| **B — Scope Decisions** | COW-04/05/06, SBX-02, IMG-01, VOC-04, CMP-01 — **Sean's call 2026-07-23: BUILD ALL, no deferments. All 7 landed locally** (see B-DECISIONS.md capture table). SBX-02/COW-04/VOC-04 carry documented Core-hook / UI follow-ons. | **Built** |
| **C — Secure Portability** | Encrypted full-instance Wayland Transfer engine (old Phase 7) | Deferred |
| **D — Desktop Inbox Repairs** | GitHub-issue repairs confirmed desktop-side + Core-independent by a 3-agent research council. Phases D1 Bridge reliability (#890, #537) · D2 Skills trust (#885) · D3 Honest diagnostics (#891, #853) · D5 UI clarity (#909, #910, #508, #882) · D4 Token efficiency (#723, gated). Build order D1→D2→D3→D5→D4. Each via full Factory loop. See `HANDOFF-2026-07-23-milestone-D-inbox-repairs.md`. | **D1 (#890) DONE + live-verified; #537 draft-close pending Sean. D2 (#885) NEXT** (D3–D5 unplanned) |

## Accumulated Context

### Decisions (current)

- **Pivot (2026-07-20):** killed the cohort/M0B external-cohort acceptance ceremony. Acceptance = Sean + Claude live-test together; green Playwright sweep IS acceptance. No external test group.
- **Phase 1 closed as accepted-by-live-test (2026-07-21):** 0 remaining construction; the per-packet SUMMARY/independent-audit ceremony is superseded by the same pivot. Basis of acceptance = live-test sweep + full green suite, recorded at phase level.
- **Cohort backend deleted** (`9b661a948`). Cockpit eligibility preserved as the standalone always-eligible `cockpitPreviewBridge` stub.
- `execution/` packet adapter + `wayland-gsd-gate` marked dormant/superseded; STATE.md + ROADMAP.md are the source of truth.
- Milestone A (Preview) is the sole active build; Milestone B (scope decisions) is a parallel decisions ledger; Milestone C (portability) is deferred.

### Pending Todos

- **Milestone A / Wave A (SEALED build — owner/CI only):** stage the matched signed Core (`scripts/stage-wcore-bump.mjs vX.Y.Z --write`), build the sealed preview, run packaged smoke on the ARTIFACT, declare Voice/MCP/sandbox each IN or physically-absent. NOTE: the *functional* risk is already retired — `node scripts/packaged-cockpit-smoke.mjs` proves the unsealed packaged app + matched engine works (A-02-SUMMARY). Only the sealed/attested distributable remains, which needs Sean's CI trust root.
- **Milestone A / Wave B (mostly done):** a11y burn-down landed; `902afd147` cleared 8 more gated rule-IDs (`aria-prohibited-attr` ×5 settings surfaces + `aria-allowed-attr` on chat home via Sider toggle role=button fixes; `label` on general via PreferenceRow aria-labelledby). Gate green 6/6, baseline tightened. Remaining a11y debt (documented, non-blocking): per-switch `button-name` on Arco Switches OUTSIDE the local PreferenceRow (voice/models/general — proven aria-label / aria-labelledby pattern); Arco-internal nodes (`aria-required-parent` Tabs, `nested-interactive` Collapse, `aria-valid-attr-value` InputNumber's aria-valuemin=-Infinity, Slider `aria-input-field-name`); one `color-contrast` `.arco-empty-description` on chat home (`--text-muted` insufficient there); expand a11y spec to Cockpit Home/nav (needs shell activation). Brand primary-button contrast already fixed earlier (dark-on-orange 6.14:1).
- **Milestone A / Wave C (i18n done):** cohort i18n keys removed + types regenerated (814 tests pass). Remaining: drop dead `stateAuthorityInventory` cohort registry entries (verify not load-bearing first — `cohortEligible` in authorityAdapters.ts IS a load-bearing invariant, do NOT remove).
- **Wave 2 (B-01 consent E2E): DONE** (`3c11691b4`) — `tests/e2e/specs/voice-consent.e2e.ts`, 2 tests pass: switch to hosted provider → disclosure → cancel fails closed (provider unchanged) / accept persists across remount. Added `tts/stt-provider-select` hooks.
- **Milestone B:** make the 7 scope calls using `.planning/phases/WLD-B-scope/B-DECISIONS.md`. Recommended: BUILD COW-06 + IMG-01, prompt-back COW-04/05, defer VOC-04/CMP-01/SBX-02.
- **Follow-up bugs:** (1) onboarding restarts from step 1 on any remount — **FIXED** `fd1ad049e` (persist `onboarding.progress` to localStorage, resume-not-restart; 3 DOM tests; `A-02-FINDINGS-onboarding.md`); (2) 3 unit tests fail against stale bundled build output — strengthen the exists-guard (`A-02-FINDINGS-test-fragility.md`); (3) cold-start model resolver can pick a non-conversational model when the catalog has no marquee provider. NOTE: `constitutionFsService.test.ts` observed as a full-suite-only flake (passes isolated 14/14 + on re-run) — parallel resource contention, like the WorkflowDetailModal flake.

### Blockers/Concerns

- Milestone A Wave A packaging is release-adjacent — do it deliberately with Sean; the packaged artifact (not dev) is the acceptance surface.
- No push / merge / release / deploy without Sean.

## Deferred Items

| Category       | Item                                                         | Status                                                 |
| -------------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| Milestone C    | Encrypted full-instance Wayland Transfer (old Phase 7)       | Deferred. Real build gaps: live Desktop+Core cross-store quiescence (hardcoded off); transactional import apply (+recovery-point +quarantine); un-deny the export/import/publish surface (owner go/no-go); full-instance round-trip acceptance under fault/replay/restart. |
| Milestone B    | Broad Cowork/native-format + outcome expansion               | Queued, non-blocking                                    |
| Milestone B    | Managed workspace quarantine/restore/keep/delete (`WSLX-01`) | Queued after trusted output/receipt ledger              |
| Milestone B    | Community Cloud, Hosted Pro, cross-surface distribution      | Queued, separately gated                                |
| SUPERSEDED     | cohort/M0B 14-day observation + signed `M0B.json` ceremony   | Killed by 2026-07-20 pivot — do not build               |

## Session Continuity

Last session: 2026-07-23 (post-build-all continuation — a11y burn-down + B-01 E2E)
Stopped at: two more verified local commits on top of the Milestone-B handoff
(`80072f7f5`), nothing pushed:
- `902afd147` **a11y trust-floor increment** — 3 structural fixes clearing 8 gated axe
  rule-IDs (Sider theme/memory toggles → role=button+keyboard clears `aria-prohibited-attr`
  ×5 surfaces + `aria-allowed-attr` on chat home; local `PreferenceRow` `aria-labelledby`
  clears general-settings `label`). Gate green 6/6, baseline re-recorded, full suite 15,612/0.
- `3c11691b4` **B-01 hosted-voice consent E2E** (Sean's pick) — `tests/e2e/specs/voice-consent.e2e.ts`,
  2 tests pass: disclosure fail-closed on cancel + accept-persists-across-remount. Added
  `tts/stt-provider-select` test hooks.
- `fd1ad049e` **onboarding resume fix** (Sean-reported "reloads on multi-agent mode") — persist
  `onboarding.progress` to localStorage → any remount resumes instead of restarting at step 1;
  3 DOM tests. Chosen as the recommended action: real, desktop-only (Core-independent), improves
  the live-test loop — vs Core-gated/ship-adjacent work Sean flagged as premature with Core in motion.
- **GH-issue knock-out batch** (via `ferrox-inbox` triage → `.planning/INBOX-TRIAGE.md`; Sean's call
  = Tier-1 desktop-side Core-independent): `25a69fd3d` **#836** darken light-mode `--success`
  emerald-400→700 (1.9→5.48:1 as text; a11y gate green); `730230eaf` **#842** notify when a workflow
  parks on `awaiting_input` (distinct "needs your input" copy; +2 tests); `59a9c879a` triage doc.
  **#780 already resolved** on this branch (`9c622b082`/PR #784) — GH issue just stale, close on ship.
  Inbox: 63 Core/Flux-gated SKIP (incl. #911 = the SBX-02 Core hook), ~10 vague stubs, rest desktop
  Tier 2/3 in INBOX-TRIAGE.md (#838, #882, #891, #890, #885). Recurring constitution flake
  (`ConstitutionClassicRecovery`/`constitutionFsService`) under full-suite parallelism — pass isolated.
Process lesson locked: **always `bun run package`, never raw `npx electron-vite build`** —
the latter skips the prepackage hook that generates launch-required artifacts, so the
packaged app crashes on launch (cost a debug loop this session).
SBX-02 wiring reviewed + deliberately NOT built: it is **Core-gated** (bundled Core ships
no localhost exception), so an inert grant UI would be the security theater the SecurityPane
exists to prevent — a hard external dependency, not a descope.
### ACTIVE RESUME (2026-07-23, latest) — Milestone D
After the inbox triage + council, **Milestone D (Desktop Inbox Repairs) is APPROVED**. The GitHub
inbox comms are DONE (11 closed, 7 need-info, 2 relabeled — live on FerroxLabs/wayland). Next work
= BUILD the confirmed desktop repairs through Ferrox Factory, order **D1→D2→D3→D5→D4**.
Resume file: **`.planning/HANDOFF-2026-07-23-milestone-D-inbox-repairs.md`** (full root-cause map +
per-issue files + guardrails). Sean's gating calls already made: #723 = in-place per-step reset (reconfirm
at D4), #853 scope = exec/process failures only, #882 kept lowest. Local only.

**WORKTREE RELOCATED (2026-07-23, Sean's call).** All Milestone A/B/D work (branch
`worktree-agent-desktop-integration`, 510 commits) was living in a stray `~/gsd-workspaces/`
clone-of-a-clone. Sean flagged it: work belongs in **canonical Ferrox Desktop (`~/dev/wayland/app`,
remote `ferrox` → FerroxLabs/wayland)**. The branch was 509 ahead / 0 behind canonical `main`
(`b3694a18f`) — a clean linear extension, no divergence. Pushed the branch into canonical (main +
its live WIP untouched) and checked it out as a proper worktree at
**`~/dev/wayland-worktrees/desktop-integration`** — WORK HERE NOW, not gsd-workspaces. The old
gsd worktree is abandoned (physical cleanup of the gsd sprawl is a separate pass). NOTE: active
worktrees actually live in `~/dev/app-worktrees/wt-*`; this one is under `wayland-worktrees/` per
Sean's menu pick (movable).

**D1 (#890) DONE — live-verified 2026-07-24. #537 draft-close pending. D2 (#885) is NEXT.**
Latest commit `6a33e21ce`, local only.

- **Root cause (research OVERTURNED the council's pino theory):** the **RunAsNode fuse**. Packaged
  builds disable it (`afterPack.js`), so `WhatsAppPlugin.forkBridge`'s `child_process.fork` booted a
  2nd Electron instance that `app.quit()`d (code=0) → 12× reconnect → `error`; baileys/QR never ran.
  `forkBridge` was the one spawn site never migrated to the shipped #706 `resolveJsRuntime()` pattern
  (`safeSpawn.ts:151-156`). Pino→stderr alone would have done nothing (baileys never runs).
- **Fix (shipped, local):** `forkBridge` fork→spawn via `resolveJsRuntime()` + new pure
  `bridgeSpawnConfig.ts` (drops ipc slot, `WAYLAND_BRIDGE_UNDER_PARENT` env flag); baileys pino→fd2
  via new `bridgeLogger.js`; `handleFrame` object-guard. 4 src + 11 test files.
- **Ferrox loop:** plan (`ferrox-plan-phase`; checker caught a false-green — acceptance must be FUSED,
  not `bun run package`) → build → cross-audit (`ferrox-code-reviewer`: GO, 0 Crit/High) → verify
  (`ferrox-verifier`: GOAL MET static). Full suite **15,625/0**, tsc clean.
- **LIVE verify (by hand through the harness):** ran the real `bridge.js` under system Bun 1.3.11
  (= bundled) with a `connect` RPC → baileys reached **qr.update** (the exact #890 symptom "never
  reaches QR"), stdout 6 frames / **0 pollution** (pino→fd2 works live), clean lifecycle, no code=0
  death. baileys-under-Bun risk RETIRED. 2 benign Bun `ws`-shim warnings on stderr (QR reached).
  Docs: `D-01-SUMMARY.md`, `D-01-REVIEW.md`, `D-01-VERIFICATION.md`.
- **Residual (parked, low-risk):** the full FUSED packaged smoke needs the capability-seal receipts
  ceremony (`WAYLAND_CAPABILITY_RECEIPTS_DIR`, owner/CI-adjacent). The fix spawns bundled Bun directly
  (sidesteps the fuse by construction) and the runtime path is proven live, so residual is low.
  Watch-item: message send/receive under Bun's `ws` shim (QR proven).
- **#537 (D-02): static-confirmed closeable** (desktop hook armed in-tree; Core v0.12.25 carries the
  host-send symbols). Sean's call (2026-07-24): **draft-and-close on his nod, skip the live-email
  setup.** Draft comment prepared this session (in `D-02-CLOSE-COMMENT.md`) — post as FerroxLabs on approval.
- **Cross-audit follow-ups (pre-existing, NOT D1 regressions):** WR-01 bridge child inherits full
  `process.env` vs `safeSpawn`'s allowlist; WR-02 dead `--session` per-instance isolation.
- **Cleanup (2026-07-24):** reclaimed ~60 GB — removed 135 stale worktrees (gsd-workspaces 231G→6.9G)
  + Docker unused images; all 92 gsd-clone branches + active app-worktrees preserved.

**NEXT: D2 (#885 Skill Guard builtin exemption)** — `ferrox-plan-phase` → build via `ferrox-executor`
→ `ferrox-code-reviewer` → `ferrox-verifier` + live-verify by hand. Root-cause map in the handoff.
Then D3 (#891/#853) → D5 (#909/#910/#508/#882) → D4 (#723, gated). No push without Sean.

Prior handoff (Milestone A/B, still valid context): `.planning/HANDOFF-2026-07-23-milestone-b-built.md`.
Core-gated follow-ons (do NOT build against the moving Core): SBX-02 wiring, COW-04 live citations.
