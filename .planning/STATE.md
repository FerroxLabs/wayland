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

## Accumulated Context

### Decisions (current)

- **Pivot (2026-07-20):** killed the cohort/M0B external-cohort acceptance ceremony. Acceptance = Sean + Claude live-test together; green Playwright sweep IS acceptance. No external test group.
- **Phase 1 closed as accepted-by-live-test (2026-07-21):** 0 remaining construction; the per-packet SUMMARY/independent-audit ceremony is superseded by the same pivot. Basis of acceptance = live-test sweep + full green suite, recorded at phase level.
- **Cohort backend deleted** (`9b661a948`). Cockpit eligibility preserved as the standalone always-eligible `cockpitPreviewBridge` stub.
- `execution/` packet adapter + `wayland-gsd-gate` marked dormant/superseded; STATE.md + ROADMAP.md are the source of truth.
- Milestone A (Preview) is the sole active build; Milestone B (scope decisions) is a parallel decisions ledger; Milestone C (portability) is deferred.

### Pending Todos

- **Milestone A / Wave A (SEALED build — owner/CI only):** stage the matched signed Core (`scripts/stage-wcore-bump.mjs vX.Y.Z --write`), build the sealed preview, run packaged smoke on the ARTIFACT, declare Voice/MCP/sandbox each IN or physically-absent. NOTE: the *functional* risk is already retired — `node scripts/packaged-cockpit-smoke.mjs` proves the unsealed packaged app + matched engine works (A-02-SUMMARY). Only the sealed/attested distributable remains, which needs Sean's CI trust root.
- **Milestone A / Wave B (mostly done):** a11y burn-down landed (87% of nodes cleared, gate green). Remaining a11y debt (documented, non-blocking): ~18 scattered settings-toggle labels (SystemModalContent/voice/models — proven aria-label pattern); ~24 Arco-internal ARIA nodes (aria-prohibited-attr / aria-required-parent / aria-valid-attr-value / label / nested-interactive); **brand primary-button contrast** (white-on-orange ~2.83:1 — needs Sean's brand call: dark-on-orange vs lighter orange); expand a11y spec to Cockpit Home/nav (needs shell activation in the spec).
- **Milestone A / Wave C (i18n done):** cohort i18n keys removed + types regenerated (814 tests pass). Remaining: drop dead `stateAuthorityInventory` cohort registry entries (verify not load-bearing first — `cohortEligible` in authorityAdapters.ts IS a load-bearing invariant, do NOT remove).
- **Wave 2 (B-01 consent E2E):** test hooks now in place (`tts/stt-consent-pending`, `*-consent-review`, `voice-consent-accept/cancel`). Write the packaged E2E: switch to a hosted provider → assert disclosure → accept → assert persistence → assert unconsented path fails closed.
- **Milestone B:** make the 7 scope calls using `.planning/phases/WLD-B-scope/B-DECISIONS.md`. Recommended: BUILD COW-06 + IMG-01, prompt-back COW-04/05, defer VOC-04/CMP-01/SBX-02.
- **Follow-up bugs filed this session:** (1) onboarding restarts from step 1 on any remount — persist progress (`A-02-FINDINGS-onboarding.md`); (2) 3 unit tests fail against stale bundled build output — strengthen the exists-guard (`A-02-FINDINGS-test-fragility.md`); (3) cold-start model resolver can pick a non-conversational model when the catalog has no marquee provider.

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

Last session: 2026-07-23 (overnight + build-all)
Stopped at: **All 7 Milestone B scope items BUILT + integrated + verified** (Sean's "build them all, no deferments"), plus Waves 1/3/4/5. 20 local commits (`9aa836c86..fc1e75d0c`), nothing pushed. Full suite 15,611 pass / 0 real failures.
Resume: read `.planning/HANDOFF-2026-07-23-milestone-b-built.md` FIRST. Next = (1) SBX-02 wiring + honest UI + Core hook; (2) COW-04 live citation population (Core event + whitelist); (3) VOC-04 renderer surfacing; (4) a11y residuals; (5) B-01 consent E2E; (6) Wave A sealed build (Sean/CI).
Resume file: `.planning/HANDOFF-2026-07-23-milestone-b-built.md` → then STATE/ROADMAP/B-DECISIONS.
