---
gsd_state_version: '1.0'
status: in_progress
progress:
  model: milestones
  total_milestones: 3
  completed_milestones: 0
  active_milestone: 'A — Cockpit Preview Ship'
  phase1_construction: accepted-by-live-test
  percent: 70
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
Wave A (package + matched-engine smoke) not started; Wave B (trust/a11y floor) partially landed this session; Wave C (hygiene) pending.

Last activity: 2026-07-21 — planning reconciliation; VOC-03 hosted-voice consent gate, QA-01 a11y regression gate, cohort backend deletion, and the MCP fixture fix landed as local commits (nothing pushed); full suite 15,510 pass / 0 fail; Cockpit live-swept clean across all 13 surfaces + real Flux chat.

Progress: [███████░░░] ~70% (construction accepted; preview packaging + trust floor remain)

### Reconciled Phase-1 truth (the old 40-packet safety foundation)
- **Accepted-by-live-test (construction complete):** the 20 non-cohort safety packets — all ship in Desktop v0.11.18, code present + wired + tested, exercised by the live sweep + full green suite. (01-06/07/08/09/10/11/12/13/15/16/19/20/21/22/24/35/36/37/38/40.)
- **SUPERSEDED — pivot 2026-07-20 (do not build):** the 20 cohort/M0B packets. 14 acceptance/ceremony (01-03/04/05/14/17/18/25/26/27/28/29/30/31/39) + 6 construction whose code was deleted (01-01/02/23/32/33/34).

## Milestones

| Milestone | Scope | Status |
| --------- | ----- | ------ |
| **A — Cockpit Preview Ship** | Wave A package + matched-engine smoke · Wave B trust/a11y floor · Wave C hygiene | **ACTIVE** |
| **B — Scope Decisions** | COW-04/05/06, SBX-02, IMG-01, VOC-04, CMP-01 — decide prompt-vs-enforced / descope / in-out | Parallel, non-blocking |
| **C — Secure Portability** | Encrypted full-instance Wayland Transfer engine (old Phase 7) | Deferred |

## Accumulated Context

### Decisions (current)

- **Pivot (2026-07-20):** killed the cohort/M0B external-cohort acceptance ceremony. Acceptance = Sean + Claude live-test together; green Playwright sweep IS acceptance. No external test group.
- **Phase 1 closed as accepted-by-live-test (2026-07-21):** 0 remaining construction; the per-packet SUMMARY/independent-audit ceremony is superseded by the same pivot. Basis of acceptance = live-test sweep + full green suite, recorded at phase level.
- **Cohort backend deleted** (`9b661a948`). Cockpit eligibility preserved as the standalone always-eligible `cockpitPreviewBridge` stub.
- `execution/` packet adapter + `wayland-gsd-gate` marked dormant/superseded; STATE.md + ROADMAP.md are the source of truth.
- Milestone A (Preview) is the sole active build; Milestone B (scope decisions) is a parallel decisions ledger; Milestone C (portability) is deferred.

### Pending Todos

- **Milestone A / Wave A:** stage the matched signed Core (`scripts/stage-wcore-bump.mjs vX.Y.Z --write`), build the preview (`bun run dist:preview:mac`), run packaged smoke on the ARTIFACT (not dev), declare Voice/MCP/sandbox each IN or physically-absent.
- **Milestone A / Wave B:** VOC-03 follow-ups (inline re-consent affordance; friendlier `*_HOSTED_CONSENT_REQUIRED` copy + i18n; live-click the modal); a11y burn-down (color-contrast, aria-*, button-name; expand spec to Cockpit Home/nav + Voice settings).
- **Milestone A / Wave C:** remove orphaned i18n keys (`settings.navigationPage.{cohort*,evidenceConsent*}`) + regenerate `i18n-keys.d.ts`; drop dead `stateAuthorityInventory` cohort registry entries.
- **Milestone B:** run the five scope decisions.

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

Last session: 2026-07-21
Stopped at: planning reconciliation applied (STATE/ROADMAP/PROJECT rewritten to reality); Milestone A next.
Resume file: `.planning/ROADMAP.md` (reconciled milestone structure).
