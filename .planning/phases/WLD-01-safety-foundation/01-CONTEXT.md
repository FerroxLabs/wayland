# Phase 1: Safety Foundation - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Protect existing work, authority, recovery, and producer truth before any
Cockpit capability is promoted. Phase 1 may build bounded engineering packets
in parallel when their exact gates are open, but the phase remains in progress
until the real 14-calendar-day observation and every named exact-package proof
close the aggregate acceptance sentinel.

</domain>

<decisions>
## Implementation Decisions

### Baseline and evidence authority

- **D-01:** Plan against exact product baseline `6d41c34087b5f40a368c83ca18d2d8e5a7fdb894`; current source and current proof outrank stale execution prose. Preserve accepted implementation and repair only disproven or incomplete behavior.
- **D-02:** Keep implementation, fixture acceptance, packaging, deployment, canary, release, and cohort acceptance separate. Source presence or a focused green test cannot mint a later state.
- **D-03:** Phase 1 stays open until authenticated `PHASE1-AGGREGATE-ACCEPTANCE` closes. Dependency-safe cross-phase construction may start only through the exact externally verified packet gate; this does not complete Phase 1.

### Observation and recovery

- **D-04:** Replace the hard-coded `knowledge-work` cohort with one versioned closed assignment owned, validated, and persisted by the main process. Renderer requests are untrusted; missing, malformed, unknown, forged, or mid-window relabel attempts fail closed.
- **D-05:** Treat Classic observation instrumentation as a separate acceptance slice after cohort authority. Process-owned evidence must cover session terminals, crashes, five primary journeys, support, accessibility, and every zero-tolerance category with stable identity and complete denominators before Day 0.
- **D-06:** The 14-calendar-day four-cohort observation is real elapsed evidence, never simulated or backfilled. Observation start, observation completion, and signed `M0B.json` are distinct plans/receipts.
- **D-07:** M0A recovery remains independent of M0B. It must preserve representative work through inspect, recovery, conservative downgrade, delta-safe re-upgrade, and the signed target matrix. Phase 1 may inventory/classify managed workspaces but has no quarantine, prune, or delete authority.

### Producer and capability truth

- **D-08:** Pin the published Core producer identity and replay its full corpus through the real Desktop decoder, normalizer, reducer, and presentation seam. Malformed, critical-field, version/digest, ordering, duplicate, gap, post-terminal, and trust failures fail closed.
- **D-09:** Pin and replay the Flux producer corpus separately from live-delivery acceptance. If trusted Flux delivery is absent, route/cost/reconciliation surfaces and claims must be physically absent; degraded source behavior alone cannot authorize release claims.
- **D-10:** Seal bounded Phase 1 truth for MCP declaration/authentication/probe/publication, Core sandbox requested-versus-effective policy, and Cowork C0-A executable/skill lockstep plus current-host-only authority with no reachable hosted fallback. Any future fallback requires a separately accepted explicit-consent contract; Phase 1 does not implement or claim that consent flow. Do not claim later lifecycle, developer-grant, C0-B, C1, or six-target package closure.

### Execution discipline

- **D-11:** Use GSD plan files as executable prompts. Generic Codex subagents are allowed only through the installed role-prompt fallback, explicitly bound to manually created clean worktrees. Same-wave work must have disjoint files, state, schemas, authority, and sequential seams; integration is serial.
- **D-12:** Acceptance receipts live in the externally pinned shared evidence CAS and must match the external accepted-packet registry, exact landed commit/tree, gate revision, contract, signer, environment, and evidence digests. No repository-local receipt or unprovisioned key can open a dependency.
- **D-13:** Do not merge to main, push, release, deploy, close coordination issues, or begin a real cohort observation without Sean's separate explicit authorization.

### the agent's Discretion

- Exact subdivision of the bounded packets into two-to-three-task GSD plans,
  provided each plan has one falsifiable terminal claim and the gate graph is
  preserved.
- Choice of existing test seams, fixture organization, and small internal
  helper names when not fixed by producer contracts or established code.
- Ordering among genuinely independent Phase 1 plans after file and authority
  ownership has been proven disjoint.

</decisions>

<specifics>
## Specific Ideas

- Preserve the familiar Project/chat mental model and Classic escape hatch;
  Phase 1 is safety work, not the visual overhaul.
- Make cohort identity and its observation consequence understandable beside
  the existing consent/window surface without rebuilding that surface.
- Security/adversarial proof should report sanitized pass/fail receipts and
  digests; raw unsafe payloads do not belong in user-facing progress reports.

</specifics>

<canonical_refs>

## Canonical References

### Product and requirement authority

- `.planning/PROJECT.md` — locked milestone boundary and product decisions.
- `.planning/REQUIREMENTS.md` — atomic requirement text and Phase 1 mapping.
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and downstream boundaries.
- `docs/desktop-overhaul-source/MASTER-BUILD-PLAN.md` — normative seven-wave dependency architecture and acceptance contracts.

### Current implementation and execution truth

- `.planning/intel/PHASE-1-IMPLEMENTATION-RECON.md` — current baseline correction, first executable M0B slice, instrumentation gap, C0-A boundary, and workspace preservation boundary.
- `.planning/execution/PACKET-GATES.json` — exact packet dependency and alternative-capability graph.
- `.planning/execution/PACKET-CONTRACTS.json` — sealed terminal claim for every packet or physical-absence alternative.
- `.planning/execution/README.md` — external acceptance authority, shared evidence CAS, worktree, and integration rules.
- `.planning/onboarding/SUMMARY.md` — completed brownfield onboarding and source-plan reconciliation.

### Codebase maps

- `.planning/codebase/ARCHITECTURE.md` — process/renderer/shared boundaries.
- `.planning/codebase/STRUCTURE.md` — file and subsystem locations.
- `.planning/codebase/TESTING.md` — existing test commands and conventions.
- `.planning/codebase/CONVENTIONS.md` — implementation conventions.
- `.planning/codebase/INTEGRATIONS.md` — Core, Flux, MCP, and Office integration seams.
- `.planning/codebase/CONCERNS.md` — known fragility and risk areas.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/process/services/cohort/ProductionCohortController.ts`: existing process-owned consent, window, local evidence, and runtime-replacement controller; extend rather than replace it.
- `src/process/bridge/index.ts`: production registration seam for cohort authority and hostile IPC proof.
- `src/renderer/pages/settings/NavigationSettings/CohortEvidenceConsent.tsx`: existing consent/window visibility surface for effective-cohort explanation.
- Existing Core, Flux, MCP, sandbox, and Cowork contract tests and source ledgers: reconcile and re-prove bounded claims before adding new mechanisms.

### Established Patterns

- Main process owns persisted authority; renderer input is untrusted and closed-category only.
- Shared schemas/types define IPC boundaries; critical unknowns and evidence drift fail closed.
- Renderer surfaces project canonical state; it does not create a second source of truth.
- Vitest focused suites and target-exact package proof are separate evidence levels.

### Integration Points

- Cohort selection request: renderer -> bridge -> main-process controller -> persisted effective assignment -> event/runtime authorization.
- Producer truth: Core/Flux contract fixtures -> Desktop adapter/decoder -> normalizer/reducer -> visible state and receipts.
- Capability truth: settings and chat surfaces consume correlated producer/session evidence, never saved configuration alone.
- GSD dependency authority: clean plan worktree -> serial integration HEAD -> external accepted-packet registry/shared evidence CAS -> successor gate.

</code_context>

<deferred>
## Deferred Ideas

- Reversible Classic/Cockpit shell, shared kernel, authority vocabulary migration, and C0-B — Phase 2.
- Daily Cockpit navigation/Home/Projects, MCP lifecycle, bounded developer grants, image/vision journey — Phase 3.
- Workbench, outcomes, first C1 DOCX/PDF vertical, power surfaces, and functional Voice — Phase 4.
- Six-target package, updater/recovery, accessibility/security/performance, live capability and final C0 closure — Phase 5.
- Preview cohort expansion/default/retirement decisions — Phase 6.
- Encrypted full-instance Wayland Transfer — Phase 7.
- Broad Cowork formats/outcomes, managed workspace quarantine/restore/delete, Community Cloud, Hosted Pro, Composio, and distribution loops — next milestone.

</deferred>

---

_Phase: WLD-01-safety-foundation_
_Context gathered: 2026-07-19_
