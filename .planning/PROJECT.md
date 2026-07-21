# Wayland Desktop Adaptive Cockpit and Cowork

> ## ▶ 2026-07-21 RECONCILIATION — READ FIRST (supersedes conflicting detail below)
>
> The 2026-07-20 pivot **killed** the cohort/M0B acceptance ceremony. Acceptance is now
> **Sean + Claude live-test together; a green Playwright sweep IS acceptance.** Cohort backend deleted
> (`9b661a948`). Phase 1 is **CLOSED, accepted-by-live-test**. See `.planning/STATE.md` +
> `.planning/ROADMAP.md` (reconciliation header) for the live plan (Milestones A/B/C).
>
> **Everything below that describes M0B / cohort acceptance / the `wayland-gsd-gate` verifier / an
> "open" Phase 1 / "invited alpha requires M0A+M0B" is HISTORICAL and no longer governs** — in
> particular the "Current State" (reconciled inline), "Safety Evidence State Separation", and
> "Milestone Boundaries" sections. Retained as trail, not as directives.

## What This Is

Wayland Desktop is an Electron application for macOS, Windows, and Linux. This project evolves it into an adaptive, provider-agnostic cockpit that starts as immediately usable chat and progressively reveals the existing power needed for substantial work. Projects continue to group chats, shared context, and artifacts; contextual Workbench, Cowork, automation, developer, operator, and Voice experiences project over the same underlying work rather than becoming competing products or stores.

The work is an evidence-gated strangler migration over the current application, not a rewrite. Classic and Cockpit temporarily coexist as presentation shells over the same routes, services, IPC, databases, conversations, Projects, agents, settings, schedules, workflows, Teams, memory, and artifacts.

## Core Value

A provider-agnostic get-shit-done copilot that keeps chat immediately usable, progressively reveals all existing power, and makes AI work for novices, knowledge workers, developers, and operators.

## Requirements

The authoritative requirement inventory and traceability map live in
`.planning/REQUIREMENTS.md`. The active milestone contains 55 atomic current
requirements mapped exactly once across Phases 1-7; 13 explicitly deferred
requirements remain queued for a later milestone. Phase plans may refine how a
requirement is proven, but may not weaken, silently reclassify, or drop it.

## Product Model

- **Chat is the center:** users state the outcome before choosing providers, agents, tools, or modes.
- **Projects organize work:** a Project groups chats, shared context, and artifacts; a workspace is optional execution scope, not a replacement noun.
- **Power is contextual:** Workbench, Cowork, developer tools, Voice, Teams, automations, evidence, and expert controls appear when relevant and remain inspectable.
- **One universal work kernel:** identity, actor, scope, lifecycle, authority, capability, economics, outcomes, evidence, interruption, and recovery are normalized once.
- **Provider neutrality:** Core is the first-party primary agent, Flux owns route evidence, and other backends remain valid; Desktop does not force every journey through one provider.

## Runtime and Baselines

- Runtime: Electron desktop on macOS, Windows, and Linux.
- Historical audit baseline: Desktop `v0.11.18` at `1b1c1e91119e3352bec3958188254ee91f150492`.
- Current proven implementation baseline: `6d41c34087b5f40a368c83ca18d2d8e5a7fdb894`.
- Cloud/Pro: a separately gated later surface. Shared model changes must compile and contract-test through the Web/Cloud composition root, but Desktop preview readiness does not imply Cloud/Pro readiness.
- Planning authority: `docs/desktop-overhaul-source/MASTER-BUILD-PLAN.md`, with packet gates and receipts taking precedence over implementation momentum.

## Current State

> **RECONCILED 2026-07-21 (see `.planning/ROADMAP.md` header + `STATE.md`).** The 2026-07-20 pivot
> killed the cohort/M0B acceptance ceremony; acceptance is now Sean + Claude live-test (green sweep =
> acceptance). Cohort backend deleted (`9b661a948`).

Phase 1 safety construction is **CLOSED, accepted-by-live-test**: the 20 non-cohort safety packets ship in Desktop v0.11.18 (code present, wired, tested) and were exercised by the live sweep + full green suite (15,510 pass). The 20 cohort/M0B packets are **SUPERSEDED — do not build** (14 acceptance ceremony + 6 construction whose code was deleted).

Active work is **Milestone A — Cockpit Preview Ship** (Wave A package + matched-engine smoke → Wave B trust/a11y floor → Wave C hygiene). Milestone B (scope decisions) is parallel/non-blocking; Milestone C (secure portability) is deferred. No real-user enrollment, release promotion, merge, or deploy without Sean.

## Scope

### In Scope

- Reversible Classic/Cockpit shell migration over shared state.
- Chat-first Home, canonical navigation, Projects, conversation cockpit, execution spine, Workbench, Library, Automations, Activity, Settings, and Voice.
- Provider-neutral Cowork assembled from ordinary Project, Chat, Sources, Output, artifact, validation, and receipt machinery.
- Core and Flux producer-contract pinning, real reducer replay, and fail-closed evidence projection.
- MCP declaration-to-live-session truth, imported phase-specifically before connector implementation planning.
- Truthful requested/effective authority, provider-neutral capabilities, cost, receipts, and recovery.
- Cross-platform packaged proof, updater/recovery proof, preview cohorts, and evidence-based rollout.
- Follow-on secure full-instance portability after the preview schema and object authorities stabilize.

### Out of Scope for the Initial Desktop Preview

- A separate Cowork, coding, workflow, Voice, or Cloud mode that users must choose before stating an outcome.
- A second conversation, Project, Task, workflow, Team, schedule, memory, capability, connector, or settings store.
- Forced migration of all agents through Core.
- Classic retirement.
- Hosted Pro tenancy and broad Community Cloud product parity unless separately planned, built, and accepted.
- Main merge, release, deploy, cohort expansion, or issue closure without Sean's explicit action.

## Constraints

- The Electron main process owns privileged authority; the renderer is untrusted and receives bounded typed IPC only.
- Core Rust producer types and serialized fixtures are normative. Desktop pins identity and replays real fixtures through the actual decoder, normalizer, reducer, and presentation path.
- Flux route, attempt, retry, fallback, cost, and terminal evidence remains producer-owned and may not be inferred from UI state.
- Requested authority and producer-enforced authority are separate; only correlated producer evidence may be labeled effective or enforced.
- Progressive disclosure may hide noise but may not delete, fork, or permanently slow expert access to existing power.
- Classic rollback remains immediate, live, and state-preserving until a separate retirement decision.
- Every packet is proof-gated across the layers proportionate to its risk. Unit tests alone are never packaged journey evidence.
- Directories must remain within project structure rules; renderer, process, worker, and shared APIs may not cross their declared boundaries.

### Constraint Coverage

The 24 synthesized constraints are execution contracts, not optional context and not substitutes for the 33 source requirement families plus the user-reported image/vision parity gap normalized into 55 atomic v1 requirements. Each has a primary phase owner; later phases must replay its accepted evidence when they consume the seam.

| # | Synthesized constraint | Primary owner | Preservation rule |
|---|------------------------|---------------|-------------------|
| 1 | Incremental strangler migration | Phase 2 | Classic/Cockpit share canonical state; no rewrite or permanent second product |
| 2 | Shared domain and service layer | Phase 2 | No Cockpit-specific copies of repositories, services, managers, schedules, Teams, workflows, memory, or trust |
| 3 | Presentation shell boundary | Phase 2 | `ui.shell` selects presentation only and never owns product state |
| 4 | Unified execution view model | Phase 2 | Normalize once in shared/main-owned contracts; renderer does not reinterpret raw producer events |
| 5 | Classic migration policy | Phase 2 | Switching is immediate, reversible, state-preserving, and independently fault-isolated |
| 6 | Cockpit implementation go/no-go gate | Phase 1 | Broad work cannot promote before ownership, baseline, shared-state, parity, and privacy gates pass |
| 7 | Core and Desktop ownership boundary | Phase 1 | Core owns runtime reasoning/policy/evidence; Desktop owns organization/orchestration/host product concerns |
| 8 | Core normative schema authority | Phase 1 | Producer Rust schema/fixtures are pinned; Desktop validators/types and drift gates derive from them |
| 9 | Critical event compatibility behavior | Phase 1 | Unknown criticality, malformed frames, gaps, conflicts, and critical variants fail closed |
| 10 | Core and Desktop semantic collision rules | Phase 1 | Correlation never implicitly mints durable Desktop objects or widens authority |
| 11 | Core release compatibility matrix | Phase 1 | Bundled, oldest override, and candidate identities/fixtures are recorded and replayed |
| 12 | Core receipt and capability evidence gate | Phase 1 | Capability claims require correlated activation/runtime evidence; trusted receipt origin is mandatory |
| 13 | Wave 0 authorization boundary | Phase 1 | Only named recovery/contract/truth work may promote; MCP-0/SBX-0/C0-A remain non-promoting exceptions |
| 14 | Wave 0 global stop conditions | Phase 1 | Corruption, authority widening, leakage, forged verification, or failed recovery stops promotion |
| 15 | Receipt evidence rule | Phase 1 | Exact commands/artifacts only; absent or skipped proof remains absent |
| 16 | Real-user enrollment gate | Phase 1 | Enrollment waits for M0A, M0B, Core/Flux/MCP/policy, and release evidence |
| 17 | Universal work kernel | Phase 2 | Chat, Cowork, development, automation, Voice, and external effects remain projections over one kernel |
| 18 | Non-negotiable product invariants | Phase 1 | All 21 master-plan invariants remain release blockers and are replayed by Phase 5 |
| 19 | Requested and effective authority separation | Phase 2 | Requested ceiling is conservative; only correlated producer evidence may be effective/enforced |
| 20 | Backend-neutral execution schema | Phase 2 | One versioned schema covers identity, scope, lifecycle, activity, governance, economics, outcomes, and staleness |
| 21 | Application-consistent rollback and recovery | Phase 1 | Global quiescence/mutation epoch, copied-state restore, signed target, and six-target recovery are mandatory |
| 22 | Packet dependency and ownership gates | Phase 1 | No packet begins or promotes before named dependencies and entry receipts pass |
| 23 | Verification and evidence receipt contract | Phase 5 | Unit, component, fixture replay, real IPC, deterministic E2E, canary, package, recovery, security, usability, and state-machine layers remain distinct |
| 24 | Definition of done and pre-execution audit gate | Phase 1 | Requirement traceability, authority, proportional proof, Classic regression, limitations, exact identity, and converged adversarial review are mandatory |

### Safety Evidence State Separation

- **Implementation state:** code may be present at `6d41c34087b5f40a368c83ca18d2d8e5a7fdb894` without being accepted, packaged, observable, or promotable.
- **Fixture/contract state:** Core, Flux, MCP, policy, migration, and recovery contracts require pinned producer identity, immutable fixtures, schema/digest provenance, real decoder/reducer replay, and explicit degraded behavior.
- **Package state:** source-mode or local proof cannot become six-target packaged proof. Exact candidate/resource identity and signed artifacts are separate gates.
- **Observation state:** M0B's signed 14-calendar-day Classic baseline, usability protocol, thresholds, denominators, sample/soak minimums, and named decision owner are irreducible cohort authority.
- **M0A:** engineering safety only—inventory, application-consistent recovery, rollback/re-upgrade, historical transaction corpus, authority preservation, signed artifacts, and provenance using copied/disposable state.
- **M0B:** observation/cohort authority only. M0A does not satisfy M0B, M0B does not repair M0A, and neither is inferred from implementation volume.
- **Promotion state:** invited alpha requires both M0A and M0B plus every named dependent contract and release receipt. No merge, release, deploy, cohort expansion, or issue closure occurs without Sean.

## Locked Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| Chat remains the single center and starting point | Users state outcomes before internal implementation choices | Locked |
| Projects group chats, context, and artifacts | Workspace remains optional execution scope | Locked |
| Progressive disclosure never deletes power | Novice simplicity and expert inspectability must coexist | Locked |
| Classic rollback remains live | Cockpit is reversible presentation over shared state | Locked |
| Desktop remains provider-neutral | Core and Flux have explicit ownership without becoming mandatory for all journeys | Locked |
| Main/process owns authority; renderer is untrusted | Privileged state and effects remain behind typed, bounded IPC | Locked |
| Desktop and paid Cloud are separate gates | A Desktop release cannot silently claim Cloud/Pro readiness | Locked |
| Core/Flux evidence is pinned and replayed through real reducers | Source presence or locally plausible UI state is not operational proof | Locked |
| Phase 1 has no managed-workspace cleanup authority | Preservation and review classification remain separate from mutation; future quarantine/restore/keep/delete requires a complete trusted output/receipt ledger and separately accepted v2 planning | Locked |
| No main merge, release, deploy, or issue close without Sean | Final integration and external-state changes remain user-owned | Locked |

## Deferred Phase-Specific Imports

- Before planning Phase 3, import and reconcile `docs/desktop-overhaul-source/MCP-DEEP-DIVE.md` into that phase's context and plans. Phase 1 retains only the already-authorized non-promoting MCP truth corrections and contract constraints. The deep dive must not be dropped or treated as already implemented.
- Before planning Phase 4 Cowork work, re-import the detailed Cowork packet/receipt chain from `docs/desktop-overhaul-source/COWORK-DEEP-DIVE.md` and the source-to-native-artifact criteria in the master plan.
- Before planning Phase 7, import `docs/desktop-overhaul-source/INSTANCE-MIGRATION.md` as the normative security and acceptance contract.

## Milestone Boundaries

Phases 1-7 preserve the master plan's seven dependency waves exactly: Safety Foundation, Migration Skeleton, Daily Cockpit, Power and Outcomes, Release Hardening, Preview, and Secure Portability. The 33 synthesized source requirement families plus the user-reported image/vision parity gap are normalized into atomic acceptance slices. Each slice is classified exactly once as either an active Phase 1-7 requirement or a queued next-milestone requirement; future programs are not forced into the Desktop preview roadmap.

These waves are evidence gates, not a claim that all construction must wait for a whole prior phase to close. One canonical GSD milestone uses receipt-gated cross-phase plan execution; GSD's separately namespaced workstreams are not the packet dependency mechanism. Phase 1 remains open through signed M0B observation, while dependency-safe Phase 2-4 construction may proceed only after the separately installed `wayland-gsd-gate` verifier authenticates exact accepted upstream receipts and byte-exact control-plane files against an external anchor. Phase 5 separately replays exact-package aggregate closure. This is intentional and must not be converted into false sequential completion.

Phase dependencies in `ROADMAP.md` describe product/evidence order, not permission to start every plan in the later phase. Executable permission lives at the packet-plan gate. Standard full-phase execution is prohibited for Phase 1 until its intentionally open aggregate-acceptance sentinel has signed M0B plus every named closure. Parallel Codex builders require one manually created clean worktree per plan, disjoint file and sequential-seam ownership, and serial integration; automatic shared-worktree parallel execution remains disabled.

- **Queued Cowork Expansion:** broad page/sheet/slide/cell source parity, workbook/presentation/full native-format acceptance, complete artifact lifecycle, and public collaboration/remix loops beyond the first C1 cited DOCX/PDF vertical.
- **Queued Managed Workspace Lifecycle:** `WSLX-01` alone may later plan explicit human-reviewed quarantine, restore, keep-forever, and separately authorized permanent deletion, only after a complete trusted output/receipt ledger exists. Phase 1 remains preservation and review classification only.
- **Queued Cloud/Pro and Distribution:** Community Cloud release readiness, Hosted Pro tenancy/isolation, commercial tier closure, and cross-surface release-derived distribution. Shared composition tests do not imply this surface is ready.

## Success Standard

Completion means each requirement is proven by current source wiring, deterministic tests, real IPC/reducer replay where applicable, packaged platform evidence where required, and user-observable acceptance. A requirement is not complete because code exists, a test was skipped, or a source document describes the intended behavior.
