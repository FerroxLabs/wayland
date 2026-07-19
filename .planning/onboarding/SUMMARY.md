# Onboarding Summary

## Project State

- PROJECT.md: present
- REQUIREMENTS.md: present; 55 atomic v1 requirements and 13 future requirements normalized
- ROADMAP.md: present; seven phases independently cross-audited and converged
- STATE.md: present

## Codebase Context

- Brownfield repo: yes
- Map readiness: complete
- Codebase map: `.planning/codebase/` contains all seven required maps
- Fast map available: yes
- Historical audit baseline: Desktop `v0.11.18` at
  `1b1c1e91119e3352bec3958188254ee91f150492`
- Current implementation baseline:
  `6d41c34087b5f40a368c83ca18d2d8e5a7fdb894`

## Docs Context

- Automated ingest of fifteen authoritative ADR, PRD, SPEC, and audit sources
  reported zero conflicts; manual current-code reconciliation then found and
  corrected stale M0B implementation claims and conflicting workspace-cleanup
  authority in `.planning/intel/PHASE-1-IMPLEMENTATION-RECON.md` and
  `.planning/intel/REQUIREMENTS-NORMALIZATION-AUDIT.md`.
- The seven master-plan dependency waves remain the active GSD phases.
- Broad Cowork expansion and Cloud/Pro/distribution remain queued future
  milestones; they do not block the first Cockpit preview.
- `MCP-DEEP-DIVE.md` is a mandatory Phase 3 import before connector planning.

## Current Execution Position

- Phase 1: Safety Foundation — in progress.
- Substantial Wave 0 code is present and locally proven, but packet acceptance,
  packaging, observation, canary, release, and cohort states remain separate.
- Highest-priority build sequence: replace the hard-coded M0B `knowledge-work`
  cohort with a closed, main-process-owned, persisted cohort authority; add the
  missing Classic/journey/incident instrumentation; seal Day 0; then begin the
  real 14-calendar-day observation window.
- GSD execution stays in one canonical milestone and is receipt-gated rather
  than naively phase-serial: Phase 1 remains open for observation and
  exact-package closure while machine-validated accepted contracts may unlock
  safe Phase 2-4 construction. A Phase 1 aggregate-acceptance sentinel prevents
  false full-phase completion. No downstream capability may promote before its
  own Phase 1 and Phase 5 gates are accepted.
- Automatic GSD parallelization is disabled. Parallel Codex builders require
  manually created clean worktrees, disjoint ownership/seams, and serial
  integration.

## Recommended Next Step

- Generate and verify the Phase 1 PLAN.md packet set against the reconciled
  evidence state, beginning with cohort authority and Classic observation
  instrumentation. Do not rebuild accepted source or infer acceptance from
  code presence.
