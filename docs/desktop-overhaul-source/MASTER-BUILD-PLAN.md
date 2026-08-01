# Wayland Desktop Master Build Plan

Plan state: **CYCLE 40 INDEPENDENT BLOCKER/HIGH GATE PASSED — ALL 136 PATHS HAVE STRICT FIELD SHAPES AND A PINNED OWNERSHIP/CONTENT IDENTITY; IMPLEMENTATION ACCEPTANCE, ROOT INTEGRATION, PRODUCTION STATE, PORTABILITY IMPLEMENTATION, RELEASE, AND COHORTS REMAIN SEPARATELY GATED**
Plan owner: Desktop lane (`area:desktop-ui`)
Prepared: 2026-07-15
Desktop source baseline: `v0.11.18` at `1b1c1e91119e3352bec3958188254ee91f150492`
Bundled Core baseline: `v0.12.25`
Requested emergency rollback baseline: Desktop `v0.11.8`, schema 52, bundled Core `v0.12.17`
Core frontier observed read-only: `frontier/m0` at committed `2b662fe`, workspace `0.12.25`, with extensive uncommitted refactor work

Audit precedence: the pre-execution gate in §14 overrides schedule language, prior implementation momentum, and any statement that a vertical “continues.” Until the current adversarial cycle has no unresolved HIGH finding—or Sean accepts named findings in writing—work is limited to plan-only corrections, read-only audits, and the exact named non-promoting MCP-0, SBX-0, C0-A, and Constitution v2/recovery remediation boundaries. Those lanes may alter copied/disposable test state and worktree code, but may not accept M0A, mutate a real profile or user state, use real credentials, enroll users, enter packaging or release artifacts, promote a capability, or expand M2/M5/M7 runtime state.

## 1. Executive decision

Build the adaptive Cockpit as a reversible, vertical-slice refactor of Wayland Desktop. Do not rewrite the product, fork the backend, or replace familiar Chat and Project concepts with an invented ontology.

The user-facing mental model is:

1. Chat — tell Wayland what you want, steer it, and review it.
2. Project — a named group of related chats with shared context.
3. Workbench — files, changes, terminal, preview, artifacts, activity, teams, and receipts when the work needs them.
4. Library — reusable assistants, Desktop workflows, Standing Teams, skills, and connections.
5. Automations — work that runs later or repeatedly.
6. Activity — work needing attention, running, upcoming, or recently completed.

Internally, a stable Task/Execution record may unify chat turns, scheduled work, Team runs, Core workflows, and receipts. “Task” is an implementation spine, not another required top-level noun for users.

The product uses one internal **universal work kernel** for identity, actor, scope, lifecycle, authority, capabilities, economics, outcomes, evidence, interruption, and recovery. Cowork, development, automation, and consequential external actions are contextual projections over that kernel. They are not separate engines, stores, or required modes.

The migration pattern is a strangler:

- Classic and Cockpit temporarily select presentation only.
- They share the same services, IPC, database, conversations, Projects, agents, models, settings, Core processes, Teams, workflows, schedules, memory, and artifacts.
- New Cockpit slices replace complete journeys one at a time.
- Classic receives security, compatibility, data-integrity, and severe-bug fixes during the preview; new product work targets Cockpit.
- Classic retirement is a separate evidence-based decision.

## 2. Non-negotiable product invariants

| ID     | Invariant                                                                                                                                                                                                                                                                          | Failure response                                             |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| INV-01 | A user can start a normal chat without understanding Core, Flux, Teams, workflows, MCP, or workspaces.                                                                                                                                                                             | Block release.                                               |
| INV-02 | An expert can inspect and override agent, model route, workspace scope, requested authority ceiling, producer-reported policy, enforcement class, budget, and relevant tools without leaving the task. Desktop never labels a requested or advisory posture as effective/enforced. | Block Cockpit default.                                       |
| INV-03 | A Project remains a group of chats with shared context. Workspace is optional execution scope, not a renamed Project.                                                                                                                                                              | Reject design/implementation.                                |
| INV-04 | Cockpit does not create a second conversation, Project, Team, workflow, schedule, memory, or settings store.                                                                                                                                                                       | Stop implementation and re-architect.                        |
| INV-05 | Switching Classic/Cockpit never migrates, copies, deletes, or re-identifies user data.                                                                                                                                                                                             | Block preview.                                               |
| INV-06 | Core policy, approval, budget, failure, cost, and receipt state is never silently presented as success or calm.                                                                                                                                                                    | Block release.                                               |
| INV-07 | Core sub-agents/workflows remain runtime execution; Desktop Teams/workflows remain durable heterogeneous product objects.                                                                                                                                                          | Reject semantic merge.                                       |
| INV-08 | Desktop remains provider- and agent-agnostic. Core is the first-party primary agent, not a requirement for every journey.                                                                                                                                                          | Block release.                                               |
| INV-09 | Consequential authority never increases when work moves to a schedule, Team, channel, Web, or Cloud host.                                                                                                                                                                          | Security stop-ship.                                          |
| INV-10 | A verified badge can originate only from a trusted top-level receipt event and must become stale when its bound artifact changes.                                                                                                                                                  | Security stop-ship.                                          |
| INV-11 | Every marketed capability is wired, journey-proven, release-gated, diagnosable, and documented from evidence.                                                                                                                                                                      | Remove/general-availability claim.                           |
| INV-12 | No release requires users to accept an irreversible data migration to try Cockpit.                                                                                                                                                                                                 | Block preview.                                               |
| INV-13 | Cockpit-only metadata is derived or preserve-unknown to Classic; Classic may not erase, reinterpret, or orphan it on read/write.                                                                                                                                                   | Block shell switching.                                       |
| INV-14 | A result crossing an extension, plugin, MCP, Web, or other untrusted path is never labeled verified unless origin and payload integrity are independently authenticated.                                                                                                           | Security stop-ship.                                          |
| INV-15 | Shared execution/domain code used by Desktop must compile and contract-test through the Web/Cloud composition root; a Desktop-only shell may not fork the product model.                                                                                                           | Block shared-model merge.                                    |
| INV-16 | Chat is the single starting point for quick questions and substantial work; no user must select Cowork, coding, workflow, or another internal mode before stating the outcome.                                                                                                     | Reject journey/UI.                                           |
| INV-17 | Readiness distinguishes an enforceable capability envelope from brokered or advisory capability evidence; it never promises prevention a backend cannot enforce.                                                                                                                   | Remove readiness claim or block affected journey.            |
| INV-18 | Structural validation, integrity checking, and trusted verification remain distinct states; third-party adapter output cannot promote itself to verified.                                                                                                                          | Security stop-ship.                                          |
| INV-19 | A connector is never labeled connected, ready, running, or available to chat unless the selected live session has produced a correlated per-server registration receipt; saved, authenticated, probe-reachable, published, and restart-required remain distinct states.            | Block affected backend and release claim.                    |
| INV-20 | A hosted or metered fallback is unreachable by default unless the user explicitly selects it after pre-call network, credential, price-basis, and spending-boundary disclosure; a missing local capability never silently crosses that boundary.                                   | Disable the fallback and block the affected claim.           |
| INV-21 | Desktop never presents a Core setting, permission, sandbox escape, or recovery action as active unless the pinned Core schema accepts it and the effective runtime policy confirms it; temporary/profile/Project inheritance is always inspectable.                                | Disable the control or claim and block the affected journey. |

## 3. Success criteria

The overhaul is successful only when all mandatory criteria have current evidence.

### Product and usability

- SC-01: A clean-install user reaches a useful first response without opening Settings or selecting an implementation component.
- SC-02: A returning Classic user can preview Cockpit, continue the same conversation, switch back, and continue again without state loss.
- SC-03: Novice, knowledge-worker, developer, and operator benchmark journeys meet their task-success thresholds with no critical confusion.
- SC-04: Every former top-level capability is reachable in two deliberate navigation steps or through universal search/command.
- SC-05: Expert agent/model/scope/policy access is no slower than Classic in measured click/keyboard steps.
- SC-06: The UI exposes one explanation for who is acting, where, under what authority, and what is happening now.
- SC-06A: The same composer handles quick answers and multi-step outcomes; substantial work becomes steerable without a mandatory mode switch or new top-level noun.
- SC-06B: The Workbench exposes only the contextual projection needed by the active journey while preserving one-click or keyboard access to relevant expert controls.
- SC-06C: Multi-step work exposes an adaptive, producer-labeled mission rail for plan/progress, outputs, context, and activity; quick chat stays uncluttered, replans remain auditable, and Desktop never fabricates backend progress or completion.
- SC-06D: The thread renders a sparse chronological activity spine and the rail renders current state from the same correlated event model; steps, outputs, blockers, approvals, validation, and completion cannot disagree between them.
- SC-06E: Chat and Voice are reversible presentations of the same canonical conversation and execution state; voice selection changes presentation only, interruption is deterministic, and the surface exposes honest listening/thinking/acting/approval/speaking/recovery state without widening authority.
- SC-06F: A local user can understand and recover from network/filesystem/toolchain denials at the point of failure; any exception is purpose-scoped, revocable, producer-enforced, and shown with its effective profile/Project/workspace source.

### Reliability and data

- SC-07: Conversation send/stream/stop/resume/reopen, tool approval, question answering, model/mode changes, Projects, workspace, schedules, Teams, and workflows match or beat the Classic baseline.
- SC-08: Cockpit adds no mandatory schema migration until the rollback harness is proven.
- SC-09: Database/config/Core-profile backup, restore, and requested `v0.11.8` rollback are rehearsed on representative state; any unsupported state is detected before launch and explained.
- SC-10: Crash recovery, interrupted streams, suspended approvals, and running jobs settle to an honest recoverable state.
- SC-10A: Provider replacement occurs only at a declared handoff boundary and enumerates preserved Desktop-owned state, lost backend-owned state, capability changes, and unresolved side effects.

### Core and Flux contracts

- SC-11: Desktop consumes a pinned, versioned Core fixture/schema corpus and detects contract drift in CI.
- SC-12: Bundled Core, the oldest supported override, and the next candidate Core pass the compatibility matrix.
- SC-13: Known safety-, policy-, lifecycle-, cost-, and receipt-relevant Core events have explicit normalize/persist/display/acknowledge behavior.
- SC-14: Flux route, attempt, fallback, cost, latency, and override evidence can be inspected without exposing raw engine noise by default.
- SC-14A: Every supported MCP entry path reaches one brokered publication lifecycle, and the exact active session can register, discover, invoke, revoke, and diagnose each claimed connector without a false-green intermediate state.
- SC-14B: Every hosted or metered fallback is either absent from the production execution path or requires explicit pre-call consent with a durable, inspectable cost/network receipt and a conservative cancellation/failure path.
- SC-14C: Every Flux-charged request preserves the authoritative producer cost and correlates it with the Desktop turn, backend session, route, model, provider attempt, retry/fallback, token/cache usage, and terminal outcome. Conversation and account-level totals reconcile or raise a visible mismatch; absent cost remains unknown, never zero; ACP current-context occupancy is never labeled or accumulated as processed/billable tokens in ordinary chat or Teams.

### Quality and release

- SC-15: Deterministic packaged journeys block release on macOS, Windows, and Linux; real-provider canaries are separate.
- SC-16: No new critical accessibility violations; keyboard, focus, zoom, reduced-motion, screen-reader name/role/state, and contrast gates pass.
- SC-17: Long chat, high-volume activity, and large Library data stay inside agreed CPU, memory, input-latency, and bundle budgets.
- SC-18: Cockpit crash-free rate, failed-turn rate, task success, support burden, and return-to-Classic reasons meet the rollout gates.
- SC-19: Every release has a signed rollback artifact, backup/restore instructions, and a tested downgrade decision tree.
- SC-20: Every supported platform/architecture can install the candidate, switch to Classic, restore a compatible bundle, boot the signed rollback artifact, and re-upgrade without losing supported user work. This aggregate criterion is staged: M0A owns the target-exact install/backup/restore/signed-rollback/re-upgrade engineering portion through the external recovery harness and copied/disposable state; M3 owns the Cockpit-to-Classic shell-switch portion; M8 replays and closes the complete sequence through the exact signed candidate.
- SC-21: Runtime-reachable Critical/High dependency, extension-isolation, updater, and packaging risks affecting a preview journey are either closed or force that journey/claim off.

## 4. Scope

### In this build program

- temporary Classic/Cockpit shell boundary;
- navigation, home/new chat, Projects, conversation chrome, execution spine, workbench, Library, Automations, Activity, and Settings recomposition;
- the universal work kernel, one capability manifest, contextual Workbench projections, and honest validation/receipt states required by both knowledge-work and developer verticals;
- shared execution view model across Core and non-Core agents;
- Core/Flux contract hardening and host-side support for the pinned integration set;
- MCP connection-truth remediation across catalog, URL, JSON, extension, Core, ACP, native-agent, ToolSearch, revoke, and diagnostics paths, specified in `MCP-DEEP-DIVE.md`;
- accessibility, performance, localization, diagnostics, migrations, packaged E2E, preview rollout, and rollback;
- documentation and support artifacts required to operate the preview.
- provider-neutral Voice Conversation Mode as packet M5V: a focused surface over the canonical chat/run with transcript continuity, interruption, explicit capability level, voice selection, privacy/cost disclosure, and adaptive plan/output/approval projection; see `VOICE-CONVERSATION-MODE.md`.
- the sandbox/developer-journey contract in `SANDBOX-DEVELOPER-JOURNEY.md`: truthful Core settings, effective-policy evidence, temporary/profile scope, purpose-scoped localhost recovery, and macOS/Xcode proof.

### Follow-on programs, not blockers for the first Cockpit preview

- Cowork excellence beyond the first flagship vertical: broad source/citation coverage, full native-artifact matrix, iterative region editing, specialist role packs, connectors, and recurring/remote work, specified in `COWORK-DEEP-DIVE.md`;
- full Community Cloud UI parity and hosted Pro tenancy;
- Composio-backed managed connectors;
- public template marketplace, creator monetization, and distribution loops;
- encrypted full-instance export/import through follow-on packet P1, Wayland
  Transfer, specified in `INSTANCE-MIGRATION.md`; current stores must preserve
  the existing M0 inventory/quiescence/restore registration seam even though P1
  does not gate the first Cockpit preview. A store added before P1 needs a
  stable authority ID, inventory hook, quiescence participation, backup/restore
  ownership, and an explicit `unsupported` portability placeholder; it does not
  need the future P1 serializer, conflict policy, or cryptographic envelope to
  pass M0–M9;
- Classic retirement.

The Cockpit architecture must enable these programs without pretending they are complete in the initial preview. Shared domain and execution-model changes must still compile and contract-test through the current Web/Cloud composition root. The existing Cloud OOM and missing-bundled-MCP findings remain explicit release risks; the Desktop preview cannot claim Cloud parity until they are closed.

Cowork packet C0 begins alongside Wave 0 only inside the §14 non-promoting correction boundary because it corrects misleading executable, skill, provider, cost, and authority contracts. It emits ordered receipts so C1 and M8 do not depend circularly on one another. **C0-A** is the Wave 0 producer/supply-chain truth receipt: hosted-credit fallback removal, managed executable pinning, skill/executable lockstep, authority isolation, and conservative current-host proof. **C0-B** follows M2's readiness-schema receipt and proves consumer conformance with `enforced` / `brokered` / `advisory` semantics, M0A's signed `ask` / `trusted-edits` downgrade/re-upgrade journey, and target-exact Office component/package evidence sufficient for the first vertical. C0-B—not final release closure—is the C1 entry receipt. M8 later replays C0-B and C1 through the fully signed six-target application and emits final C0 release closure. M2 is the sole readiness-schema authority; C0 owns only the Office producer adapter, supply-chain evidence, and consumer conformance. The mandatory order is `C0-A → M2 readiness-schema → C0-B conformance/entry → C1 → M8 final C0 release closure`. The universal C1 kernel integration may begin only after C0-B plus M0A, M1, M5, and M6 pin its shared-state, authority, recovery, conversation, and Workbench boundaries. C2 and later remain follow-on product slices. Adding the Cowork card to Cockpit is not knowledge-work parity: the card is an intent shortcut over the ordinary chat route and composer, never a mode or authority change. An unlabeled general-availability card is gated on the first packaged source-to-native-artifact vertical; before that it is explicitly early, capability-bounded, or absent.

### Explicit non-goals

- renaming Projects to Workspaces;
- forcing all agents through Core;
- replacing Desktop Teams with Core sub-agents;
- replacing Desktop workflows with Core runtime graphs;
- moving Desktop scheduling authority into Core;
- redesigning Core internals from the Desktop lane;
- a permanent beginner/power mode split;
- a permanent dual-shell product;
- changing user data merely to support visual layout.

## 5. Architecture

### 5.1 Authority boundaries

- Desktop owns product organization, durable chats/Projects, heterogeneous Teams, Desktop workflows, scheduling, navigation, local OS integrations, channel distribution, and user-facing governance.
- Core owns first-party agent reasoning/execution, internal sub-agents/workflows, Core-effective execution policy, Core memory/user model, and typed execution evidence.
- Flux owns model-route selection and route/fallback/cost/latency evidence.
- Cockpit renders normalized state; it does not become another authority.
- Desktop computes a conservative **requested ceiling** from user, workspace, host, channel, and scheduler constraints. The selected producer separately reports policy, and the adapter declares `enforced`, `brokered`, or `advisory`. Only a correlated producer receipt may be rendered as effective/enforced; absent that receipt Desktop shows requested/advisory state and never becomes a competing planner.

The detailed concept/event map is in `CORE-INTEGRATION-MATRIX.md`.

### 5.2 Presentation boundary

Add a typed device-local shell preference: `ui.shell: 'classic' | 'cockpit'`. A root shell selector composes navigation and layouts around the same canonical routes and data.

The preference must be safe when absent, corrupt, or read by an older app. It may not trigger a database migration.

Classic and Cockpit share domain services, not new view state. Cockpit presentation components live behind their own composition root and error boundary. A shared-service change needs Classic contract coverage and an explicit blast-radius review; R1 is not counted as protection from a service both shells share.

The composition roots must be independently lazy-loadable and fault-injectable.
Import, render, route, or state failure in Cockpit must not prevent Classic from
booting without loading Cockpit modules. A conditional wrapper around one shared
root is not isolation and cannot satisfy M3.

### 5.3 Normalized execution model

Introduce a backend-neutral, initially derived view model:

- identity: task/run/turn/correlation IDs;
- actor: backend, agent, model route, parent/child;
- scope: Project, workspace, host, trust posture;
- lifecycle: queued, running, waiting, blocked, completed, failed, cancelled;
- activity: thinking, tool, workflow node, sub-agent, browser/CUA, provider attempt/retry;
- plan: optional backend-reported steps, status, blockers, and steering checkpoints normalized once by the adapter;
- governance: requested mode, requested ceiling, producer-reported policy, enforcement class, correlated effective-policy receipt, approval, budget;
- economics: tokens, priced/unpriced cost, latency;
- outcome: domain-owned references such as artifacts, changes, external effects, and receipts, plus validation/verification/dependency-staleness state.

Each backend adapter translates to the model once. Renderer components do not reinterpret raw events independently. Raw events remain bounded and available to diagnostics.

For M2/M3 the model is projected from existing conversation/message/run records and in-memory event state; it does not create a new canonical Task table, identity, or mandatory schema. Any later persistence proposal must pass M0 rollback proof plus Classic preserve-unknown round trips before it is eligible to ship.

“Effective policy” is backend-specific evidence. For Core it is a correlated Core-reported receipt. For other backends it is a correlated receipt from the host/adapter policy actually enforced. Desktop may calculate and present a conservative requested ceiling, but it may not upgrade that ceiling into effective policy. When receipt correlation or enforcement proof is absent, the surface says `requested` or `advisory`, never active, safe, enforced, or blocked-by-policy.

Every normalized capability declares stable ID/version, operations, formats, dependencies, host availability (`desktop`, `web/community-cloud`, `hosted-pro`), backend support, execution mode, permission/network/cost/credential requirements, validation level, platform support, fixture digest, degraded behavior, and enforceability (`enforced`, `brokered`, or `advisory`) in one generated or validated capability manifest. Cowork and other domains extend this schema; they do not create a second manifest. Presentation code consumes it rather than maintaining separate hand-written Desktop and Web assumptions.

Provider replacement is a checkpointed handoff, not transparent hot-swap. Desktop-owned Project context, sources, artifacts, versions, and receipts may transfer. Backend-owned conversation/session state, plans, tool processes, ephemeral resources, and partially executed side effects transfer only when an explicit adapter contract proves it; otherwise the UI discloses loss and starts a fresh run.

### 5.4 Core wire contract

Core Rust types remain producer authority. Desktop pins a producer commit plus
serialized schema, fixture digest, and generator identity; semver alone is
insufficient because the active Core checkout currently contains unreleased
changes while still reporting `0.12.25`. Desktop must consume generated types
when the producer supplies them. Otherwise it must derive an exact runtime
validator from the pinned schema, publish an exhaustive schema-to-validator
coverage map, infer/generate TypeScript types from that validator, and fail CI
on drift. Canonical fixtures remain mandatory in either case. Desktop tests:

- `ready` and capability additions;
- `execution_policy` and capability activation;
- stream/tool lifecycle and run correlation;
- provider attempt/retry/failure/circuit;
- approvals, suspend/resume, budgets;
- nested sub-agents and Core workflow lifecycle;
- cost/usage, compaction, browser/CUA policy;
- top-level Anvil receipts and nested receipt forgery rejection;
- unknown type/field tolerance and critical-compatibility state.

A receipt has three distinct UI states: `reported`, `integrity checked`, and `verified`. `Verified` requires a trusted producer channel, supported receipt version, correlation to the run/artifact, digest validation, and no intervening mutation. Extension-originated or origin-ambiguous payloads cannot upgrade themselves to verified. If the extension/plugin boundary cannot enforce this, M6 may render provenance but not a verified badge.

Domain validation is separate. A format adapter may report structural, schema, formula, citation, semantic, or render checks, but third-party validation is capped at `integrity checked` unless the trusted-origin requirements above are independently satisfied. UI and schema use distinct names for receipt mutation staleness and upstream-source dependency staleness.

### 5.5 Workbench host

Reuse and consolidate the current chat workspace/preview split, ObservabilityPanel, activity normalizers, terminal, files, changes, preview, and artifact surfaces behind one contextual workbench host. Preserve pop-out and responsive behavior.

The host composes domain projections instead of exposing a fixed wall of tabs: knowledge work can show Sources/Outline/Citations/Output; development can show Changes/Terminal/Tests/Preview; automation can show Schedule/Runs/Approvals/Logs; external actions can show Draft/Destination/Effect/Receipt. Inactive projections stay hidden. All projections consume the same normalized run, policy, capability, and recovery state.

Its compact conversation projection is an adaptive mission rail with Plan/Progress, Outputs, Context, and Activity/Receipts sections. It is absent for ordinary chat and activates in-place when the run has durable multi-step or inspectable state. Producer plans are correlated and labeled; Desktop-local checklists remain explicitly local. Replans preserve step history and explain changes. Pin/close/reopen, steering, reorder, pause/stop, approvals, and checkpointed agent/model replacement do not require a route or product-mode change.

The conversation and rail consume the same selectors. The thread exposes a sparse chronological activity spine for meaningful plan/task/output/approval/validation/retry boundaries, while the rail summarizes current progress and deliverables. Low-level tool chatter is collapsed behind inspectable milestones. Cross-selection resolves to the same run, step, artifact, validation, and receipt identities; no renderer-local duplicate progress store is allowed.

### 5.6 Information architecture

Canonical Cockpit navigation:

- New chat
- Search
- Chats
- Projects
- Library
- Automations
- Activity
- Settings

Recent chats and pinned Projects may live directly in the rail. Library groups reusable capabilities. Activity groups human priority: Needs you, Running, Upcoming, Recent.

This supersedes older audit sketches proposing separate top-level Work, Workspaces, Artifacts, Connections, and Mission Control. Those remain internal views or grouped destinations, not additional required mental models.

## 6. Rollback and recovery contract

### 6.1 Rollback ladder

| Level                            | Trigger                                  | Action                                                                                                                                  | Data impact                                                                        |
| -------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| R0 — panel reset                 | Isolated layout/workbench fault          | Reset Cockpit layout preference and reopen same route                                                                                   | None                                                                               |
| R1 — shell rollback              | Cockpit UX/render regression             | Switch `ui.shell` to Classic; same binary/services/state                                                                                | None                                                                               |
| R2 — release rollback            | Shared-service regression in new release | Install last proven Desktop release after compatibility preflight                                                                       | Must be proven                                                                     |
| R3 — requested baseline rollback | Severe systemic failure                  | Preserve the current forensic bundle, restore a separately verified state copy compatible with `v0.11.8`, then install signed `v0.11.8` | None to supported user work; fail closed if preservation/export cannot be verified |
| R4 — disaster recovery           | Corruption/security incident             | Quarantine current state, restore last verified backup, preserve forensic copy                                                          | Restore point bounded                                                              |

R1 is the primary Cockpit safety mechanism. If a Cockpit-only UI issue requires R2/R3, the shell boundary failed.

### 6.2 `v0.11.8` facts and hard gate

- `v0.11.8` exists at an official tag.
- It expects database schema 52 and bundles Core `v0.12.17`.
- `v0.11.18` expects schema 53 and bundles Core `v0.12.25`.
- The known database 52→53 delta is one additive `model_registry_custom_models` table with a defined `down` migration; custom model IDs require explicit export/restore treatment. The candidate also rewrites persisted workspace-authority values from legacy `chat`/`cowork` to `ask`/`trusted-edits` on the next local write. That config delta is part of rollback authority and may not be omitted because it is outside SQLite.
- Production initialization only migrates upward; it does not automatically downgrade a higher schema.
- Therefore a direct binary reinstall is not accepted as rollback proof.

Current operational rule: until the isolated schema-52 transform, external
recovery launcher, and signed six-target journey pass, `v0.11.18` is the only
proven operational recovery floor. `v0.11.8` remains the requested target under
test; it must never be launched against live schema-53 state or presented as an
available recovery action.

Before any preview cohort:

1. Build a representative state corpus at `v0.11.8`.
2. Upgrade it through `v0.11.18` and the Cockpit candidate.
3. Exercise chats, Projects, Teams, workflows, schedules, settings, MCPs, credentials/profile metadata, and artifacts.
4. Switch shells repeatedly.
5. Create new work in Cockpit.
6. Run the rollback preflight against `v0.11.8`.
7. Export/preserve post-baseline user work and verify its manifest/checksums; abort before any destructive step on failure.
8. Restore or transform a copy of state to the supported rollback format.
9. Boot signed `v0.11.8`, validate the corpus, then re-upgrade and validate again.
10. Repeat on macOS, Windows, and Linux with encrypted/secrets handling appropriate to each OS.
11. Verify all six release targets: macOS arm64/x64, Windows arm64/x64, and Linux arm64/x64; document any unsupported rollback artifact before enrollment.
12. Verify updater/channel behavior cannot immediately replace the selected rollback build and that Windows per-machine elevation does not make recovery unusable.
13. Write representative `ask` and `trusted-edits` values with the candidate, boot signed `v0.11.8`, and prove unknown/legacy authority values fail conservatively without widening permissions; then re-upgrade and prove semantic preservation.

If this cannot be made lossless and supportable, the product must say so and use `v0.11.18` as the binary rollback floor while retaining R1 Classic as the UX rollback. Sean decides whether that is acceptable; the plan may not quietly redefine the requested target.

### 6.3 State-bundle requirements

- SQLite database plus WAL-consistent snapshot;
- app config and device-local UI preferences;
- Project/workspace metadata, excluding arbitrary user workspace contents unless selected;
- Core profiles/config references with secrets handled via platform vault rules;
- preview-supported non-Core adapter/profile/session references, with CLI-owned state recorded by authority and never copied or rewritten without that backend's contract;
- extension/skill/MCP manifests and versions;
- artifact index and receipt references;
- Constitution v2 revision-authority manifest: active and required retired key
  identities, authenticated history coverage, OS-vault reference, and encrypted
  same-device envelope. Plaintext key bytes are forbidden. Portable wrapping is
  outside M0A and remains unavailable until issue #903 defines and independently
  audits the Recovery/Transfer protocol;
- Constitution key loss/rotation/migration state and receipts. Missing or
  mismatched key authority quarantines the affected v2 state and aborts backup,
  downgrade, restore, or re-upgrade rather than minting a replacement key;
- Classic-session promotion authority defined normatively by
  `wave-0/NATIVE-CONSTITUTION-V2-ACCEPTANCE.md`: an external authenticated
  projection receipt binds the immutable source snapshot, exact preserved v2
  authority envelope, canonical Classic baseline/delta, and destination
  revisions. Re-upgrade authenticates/restores the preserved v2 authority, then
  imports supported changes through the persisted promotion/item identities
  and current destination CAS APIs. Partial replay is journaled and
  lookup-first. Concurrent change, unsupported input, missing binding, or
  failed validation retains both copies in authenticated-encrypted rescue; it
  never overwrites v2 state or silently discards Classic work. Classic never
  receives or returns v2 key material;
- manifest containing Desktop/Core/schema versions, checksums, timestamps, and restore compatibility;
- dry-run validation before destructive restore;
- forensic preservation of the failed current state.

Restore always targets a copy or empty destination first. The harness never mutates the only surviving state bundle, never treats a partial export as consent to lose work, and never launches an older binary against unclassified higher-version state.

A valid bundle is application-consistent, not merely SQLite-consistent. Backup enters a global quiescence barrier: reject new work, pause scheduler dispatch, settle or explicitly mark active turns/approvals, quiesce Core/agent/WebUI writes, checkpoint the database, snapshot every declared store under one mutation epoch, then seal the manifest. Any mutation or process that cannot acknowledge the barrier aborts the bundle. Failure injection covers every barrier transition and proves incomplete work resumes or is honestly terminalized after restore.

## 7. Work packets and dependency graph

No packet begins before its dependencies and entry gates are satisfied. Paths are targets, not permission to edit Core from the Desktop lane.

### 7.1 Requirement-to-packet ownership

| Packet | Primary invariant/success ownership                                | Mandatory cross-cutting proof                                                                                                                                                                                                                                     |
| ------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0     | INV-05/12/13; SC-02/08/09/19/20-engineering/21                     | lossless state, application-consistent backup, six-target recovery, Classic baseline                                                                                                                                                                              |
| M1     | INV-06/09/10/14; SC-11/12/13                                       | runtime wire validation, trusted origin, producer commit/schema digest                                                                                                                                                                                            |
| M1F    | INV-06/08/09/11; SC-12/14                                          | pinned Flux route/fallback/cost contract, fixtures, drift gate                                                                                                                                                                                                    |
| M1M    | INV-06/08/09/11/14/17/19; SC-07/10/11/12/13/14A/15/21              | one brokered lifecycle, live-session receipts, scoped discovery/invocation/revoke, transport/auth/backend corpus                                                                                                                                                  |
| M1S    | INV-06/09/11/17/21; SC-06F/07/10/11/12/13/15/21                    | schema-valid settings, effective-policy receipts, scoped local-target/toolchain grants, config/profile/workspace inheritance corpus                                                                                                                               |
| C0     | INV-08/09/11/17/18/20; SC-06A/14B/21                               | C0-A executable/skill lockstep, authority isolation, fallback consent and third-party ledger; C0-B M2-schema conformance, rollback authority and target-exact component proof; M8 final signed-app closure                                                        |
| C1     | INV-02/04/06/08/09/14/15/17/18; SC-05/06/07/10/10A/13/14B/15/16/17 | first target-exact cited DOCX/PDF component/integration vertical, native artifact preservation/validation, J17/J20/J23, immutable receipt                                                                                                                         |
| M2     | INV-04/06/08/09/15/17; SC-07/10/10A/11/12/13/14                    | derived state, policy intersection, provider-handoff contract, Desktop + Web/Cloud contracts                                                                                                                                                                      |
| M3     | INV-04/05/12/13; SC-02/08/20-shell-switch                          | preserve-unknown Classic round trip and isolated-shell failure                                                                                                                                                                                                    |
| M4     | INV-01/03/11; SC-01/03/04/16/17                                    | novice/returning findability and accessibility                                                                                                                                                                                                                    |
| M5     | INV-02/06/08/09; SC-05/06/07/10/10A/13/14/16/17                    | expert parity, real IPC, honest lifecycle, provider-transition disclosure                                                                                                                                                                                         |
| M5V    | INV-02/04/06/08/09/11/15/17/19; SC-05/06/07/10/13/14/15/16/17/21   | M5V-A provider-neutral Voice surface over the canonical chat/run, interruption and transcript continuity, honest capability level, privacy/cost disclosure, adaptive plan/output/approval projection; M5V-B packaged audio/accessibility proof produced inside M8 |
| M6     | INV-06/09/10/14; SC-10/13/14/16/17/21                              | receipt origin/integrity/staleness and consequential authority                                                                                                                                                                                                    |
| M7     | INV-07/09/11; SC-04/06/07/10/16/17                                 | no capability cul-de-sac and provenance                                                                                                                                                                                                                           |
| M8     | all invariants; SC-01 through SC-21                                | packaged, six-target, security, accessibility, performance, rollback                                                                                                                                                                                              |
| M9     | all invariants; SC-03/18/19/20/21                                  | cohort evidence and automatic stop decisions                                                                                                                                                                                                                      |

Packet receipts must cite this table and the exact test/evidence satisfying each owned item. An invariant is not “covered” by appearing only in the program-level prose.

### Packet M0 — Freeze baseline and build rollback harness

Dependencies: none.
Likely Desktop paths: `src/process/services/database/`, `src/process/utils/initStorage.ts`, `src/process/agent/wcore/profilePaths.ts`, new `src/process/services/backup/`, `tests/integration/`, `tests/e2e/`.
M0 emits two independent receipts: **M0A engineering safety** targets Days 1–3 and **M0B cohort authority** observes the rolling Classic baseline through calendar Day 14. M0A unlocks downstream flagged development; M0A plus M0B unlock invited alpha.

Outputs:

- reproducible v0.11.8/v0.11.18/Cockpit state corpus;
- backup/restore manifest and dry-run validator;
- higher-schema detection and explicit compatibility UI;
- R1 shell reset contract;
- signed-artifact rollback runbook and retained installers/checksums for all supported targets;
- exact schema/config/profile delta ledger from v0.11.8 to the candidate;
- explicit authority-vocabulary end state and one migration/rollback contract; no second persisted migration to a competing Observe/Draft/Act/Operate vocabulary without a new M0 gate;
- versioned state transformer owned by M0, including explicit 53→52 handling,
  per-object loss report, Core-profile compatibility rules, and receipt-bound
  export/re-import of supported post-baseline work. The re-upgrade side computes
  a delta from the exact projected Classic baseline, reacquires the declared
  profile/quiescence authorities, verifies that the preserved v2 source and
  destination expected revisions still match, and promotes each supported
  change through its current-version CAS/migration API. It retains a rescue
  bundle and fails closed on conflicts or unsupported mutations;
- the normative Classic bridge in
  `wave-0/NATIVE-CONSTITUTION-V2-ACCEPTANCE.md`: externally authenticated
  no-clobber projection receipts; canonical identity-derived delta/tombstone
  manifests; a durable multi-object promotion journal with one persisted
  promotion identity and per-item UUID/fingerprint; committed-lookup-first
  partial replay; explicit promote, keep-current-v2, or pre-dispatch
  confirmed-discard user decisions; and authenticated-encrypted rescue with
  authority binding, indefinite local retention, and resume. Stage C must also
  prove that Wave 0 registers no export/import/delete/GC entrypoint. Portable
  transfer and destructive rescue lifecycle belong to issue #903. Stage C and M0A cannot pass
  on restore-only behavior or an unauthenticated receipt inside the Classic
  writable tree;
- state-authority and rollback-compatibility ledger for every preview-supported backend, including external CLI/session handles and explicit safe read-only/degraded behavior when resume is unsupported;
- release-health ledger for runtime-reachable dependency advisories, extension isolation, updater recovery, Cloud packaging, and existing P0/P1 journey defects;
- preliminary third-party executable ledger entry for OfficeCLI: redistribution terms, publisher identity and signature availability, independently obtained pinned hashes, update owner, compromise/revocation response, and hosted-fallback reachability. Unknown or unverifiable fields disable the affected release path rather than becoming accepted blanks;
- bundled-Core provenance receipt for every package target. Packaging must force the verified-release path, bind the pinned release/tag and archive digest to the extracted binary digest, and reject `local-prebuilt`, `verified=false`, skipped, target-mismatched, missing, or self-asserted manifests. A directory-presence check is never Core provenance;
- cohort gate table with metric definitions, denominators, minimum sample/soak, thresholds, and decision owner.
- repaired deterministic Classic v0.11.18 baseline: current-route navigation suite, stable provider fixture, and focused journey suite green or every accepted baseline failure explicitly quarantined with an owner.
- authenticated OS-credential-store sealing plus an external recovery launcher/runbook that materializes only into a transient isolated tree, validates and side-effect-neutralizes the restored copy, requires a publisher-trusted v0.11.8 digest, rechecks that digest before spawn, pins the update channel, and treats direct v0.11.8 launch against unclassified future state as unsupported misuse;
- signed v0.11.8 artifact inventory for every target: retained URL/mirror, checksum, publisher certificate/notarization identity, cold-install result, updater behavior, and enrollment decision;
- frozen usability protocol: task scripts, novice/power-user segments, success/error/confusion rubric, sample/soak minimum, Classic comparison method, and decision rule.
- managed-workspace inventory and retention contract: every generated workspace is classified as referenced, scheduled, artifact-bearing, modified, user-promoted, empty-abandoned, or unknown; content-bearing and unknown state is preserved by default, pruning is dry-run/auditable/recoverable, and deleting a chat never silently deletes files, reports, schedules, receipts, or external effects.

Verify:

- byte/checksum validation, foreign-key/integrity checks, preserve-unknown round trips, upgrade/downgrade/re-upgrade journeys;
- quiescence/mutation-epoch proof across database, config, profiles, scheduler, artifacts, receipts, and WebUI;
- failure injection at every backup barrier, snapshot, restore, direct-old-binary misuse, and first boot;
- rollback/re-upgrade journeys with Core plus at least two representative
  non-Core adapters, covering no-change exact-v2 restoration, Classic create,
  update, delete/tombstone, concurrent-v2 conflict, unsupported Classic change,
  interrupted promotion, idempotent replay, and retained encrypted local rescue;
  unproven backends are excluded from the cohort or declared non-resumable
  before enrollment;
- an immutable migration corpus generated from the exact nominated pre-v2
  transaction implementation, including real pending crash states, is
  digest-pinned and reconciled by the candidate before read/mutation. Any
  harness-only patch that invokes an existing historical hook is stored and
  digest-bound separately and must source-trace to zero transaction/format/
  durability changes. Current-code synthetic fixtures are supporting tests
  only. The signed v0.11.8 journey uses the actual isolated Classic artifact
  and Stage B promote/rescue/pre-dispatch-discard plus partial-commit UI;
- candidate `ask`/`trusted-edits` config through signed v0.11.8 and re-upgrade, proving conservative old-version interpretation and no authority widening;
- platform vault/secrets never copied in plaintext.
- temp-workspace lifecycle fixtures prove that deleting or clearing chats preserves referenced/scheduled/artifact-bearing/modified/unknown work, surfaces recoverable inventory, and prunes only provably empty abandoned shells after the declared retention window.
- invoke the same bundled-Core manifest/digest verifier against the actual packaged Resources tree; a developer package command is not permitted to weaken this gate because it was launched outside an npm/CI lifecycle.

M0A acceptance: the inventory, transformer, external recovery launcher, exact-historical-transaction corpus and bound harness provenance, authenticated Classic projection, complete promotion journal/local-rescue protocol, deterministic Classic fixture, six-target signed-artifact/recovery proof, candidate authority-vocabulary downgrade/re-upgrade journey, preliminary OfficeCLI executable ledger, exact packaged-Core provenance receipts, SC-08/09/19/21, and the SC-20 target-exact install/backup/restore/signed-rollback/re-upgrade engineering portion pass through the external recovery harness using copied/disposable state. The Constitution Stage C receipt must prove the signed v0.11.8 no-change, promote, partial-replay, conflict, encrypted local-rescue preservation, pre-dispatch confirmed-discard, partial-commit disposition, and negative export/import/delete/GC surface journeys; Stage A/B code presence cannot substitute. The Cockpit-to-Classic UI switch is explicitly excluded from M0A and remains M3-owned. A failed proof is fail-closed; no user data migration or real-user build may proceed.

M0B acceptance: the 14-calendar-day Classic baseline completes and the cohort table, usability protocol, thresholds, denominators, sample/soak minimums, and decision owner are signed. The protocol must prove that a novice can start quick and substantial work without choosing an agent/model/mode; expert controls remain within the Classic interaction budget; disclosure preferences persist without obscuring defaults; and representative users can explain who acts, where, and under what authority without learning internal architecture. No invited alpha may proceed until M0A and M0B both pass.

If a lossless, supportable v0.11.8 transform is infeasible, M0 stops and presents that evidence to Sean. It may not substitute a pre-upgrade snapshot for preservation of post-upgrade work, and no later packet may redefine v0.11.18 as the rollback floor without explicit approval.

### Packet M1 — Pin Core contract and generate fixtures/types

Dependencies: M0A baseline inventory. A clean Core integration baseline is preferred, but Desktop may proceed against the exact released Core `v0.12.25` commit plus fixtures/schema digest. Unreleased Core behavior remains capability-gated and cannot block shell/navigation work.
Desktop paths: `src/process/agent/wcore/protocol.ts`, `src/process/agent/wcore/index.ts`, `src/process/task/WCoreManager.ts`, new `scripts/generate-wcore-protocol.*`, `tests/contract/wcore/`.
Core-owned request: `crates/wcore-protocol`, `docs/json-stream-protocol.md`, golden fixture export.

Outputs:

- pinned producer fixture/schema corpus;
- producer-generated Desktop types, or exact validator-derived types with an
  exhaustive schema coverage map and drift gate; never an independent
  hand-maintained event union;
- runtime validation of every untrusted stdout frame before it enters the typed/verified path;
- an explicit decoder for every supported released/bundled legacy frame family;
  a frame that cannot satisfy a pinned current or explicit legacy schema is
  quarantined and its dependent capability disabled rather than accepted by a
  permissive compatibility cast;
- event obligation registry: normalize, persist, display, acknowledge, criticality;
- version/capability compatibility matrix;
- exact bundled-engine identity matrix linking each Desktop package target to the released Core tag, release-archive digest, extracted binary digest, source-contract compatibility result, and package receipt;
- known-critical unknown-event behavior;
- minimal deterministic fake Core/provider subprocess using the real process/IPC boundary, reusable by every later packet.

Verify:

- replay every fixture through the real Desktop decoder/normalizer;
- fuzz unknown fields/types, malformed/bounded payloads, ordering and duplicate correlation;
- reject or quarantine shape-validity failures instead of TypeScript-casting arbitrary JSON into a trusted union;
- older/bundled/next Core matrix;
- actual package replay that rejects a valid-but-unpinned Core binary, a manifest copied from another target, a locally prebuilt binary, archive/binary digest drift, and a package missing the exact released manifest;
- receipt trust-boundary attack cases.
- autonomous/channel/scheduler approval fixtures prove that non-interactive execution cannot silently widen authority or auto-approve beyond the declared effective policy.

Contingency: if the Core refactor cannot publish a clean candidate, Desktop does not fork or patch Core from this lane. It holds Core-dependent UI claims, continues against released fixtures, and records a `wl handoff` issue containing the missing producer contract and blocker.

Acceptance: SC-11 through SC-13 pass; no critical event silently drops.

Every packet from M2 onward must add and pass at least one real-IPC vertical journey using this harness. M8 broadens and packages it; M8 does not introduce the first trustworthy end-to-end harness.

### Packet M1F — Pin Flux route and evidence contract

Dependencies: M0A baseline inventory; Flux lane publishes or identifies a clean producer baseline.
Desktop paths: `src/process/task/fluxRouting.ts`, `src/process/flux/`, backend spawn adapters, normalized execution selectors, `tests/contract/flux/`.
Flux-owned request: canonical route/attempt/fallback/circuit/cost/latency/override schema and golden fixtures.

Outputs:

- pinned Flux producer commit/version plus serialized fixture/schema digest;
- route precedence and override obligations for explicit model, Auto, native, fallback, disconnected, and unpriced states;
- correlation contract joining Desktop task/turn, backend spawn, provider attempts, fallback, cost, and terminal outcome;
- request-level charge contract preserving Flux `usage.cost_usd`/currency (or the versioned successor field), producer request identity, attempt count, and explicit unknown/BYOK-zero semantics across Core and every Flux-capable ACP adapter;
- reconciliation boundary distinguishing authoritative Flux charge from ACP cumulative session cost, ACP current-context occupancy, Core session aggregates, Desktop catalog estimates, MCP/third-party charges, and account balance movement;
- capability degradation rules when Flux is absent, stale, or version-incompatible;
- CI drift gate and real-IPC fixture process.

Verify:

- explicit native model never silently routes through Flux;
- Auto route, retry/fallback/circuit, cost/latency, disconnected, invalid-key, and unpriced cases;
- one turn/one charge, transient pre-tool retry, fallback, failed-but-billable attempt, compaction/context-occupancy decrease, session reset, streaming-final-cost, BYOK zero, absent cost, and account-total mismatch cases across ordinary chat and Teams;
- malformed/unknown fields and mismatched correlations fail visibly rather than producing plausible false evidence;
- Desktop and Web/Cloud composition-root replay.

Contingency: if Flux cannot publish the contract, Cockpit keeps existing route controls but disables new route explanations/cost claims and cannot satisfy SC-14. Desktop does not infer Flux semantics from UI state.

Acceptance: INV-06/08/09/11 and SC-12/14 pass against the pinned fixture corpus and real IPC. A Flux-lane `wl` handoff with producer/consumer owners and blocking date exists before M0A exits.

### Packet M1S — Effective policy and sandbox developer journey

Dependencies: M0A for rollback-safe config migration; M1 for the pinned Core schema/event corpus. Producer-enforced grants, config migration, real-profile mutation, automatic recovery, and inline effective-policy promotion remain locked until those dependencies and the producer capability pass.

Pre-M0A/M1 corrective exception — **SBX-0 truth-only boundary**:

- permitted: remove or disable the false controls in `SecurityPane.tsx`; replace claims with truthful static copy; add a pure version/section/value compatibility map and deterministic tests; disclose the two config roots and Raw Engine Mode's loss of Desktop model, skill, MCP, and profile overlays; add read-only diagnostics and copied-state fixtures;
- execution containment: any runnable exposure stays behind the existing corrective/Cockpit development flag, uses copied or disposable state, and is excluded from packaged/release artifacts until M0A/M1 receipts exist;
- prohibited: no config migration, no write to a real Core profile, no grant, no policy bypass, no `--i-accept-exfil-risk`, no automatic route/recovery, no capability/readiness promotion, no producer-enforcement claim, and no M2/M5/M7 selector, persistence, lifecycle, or UI expansion;
- files outside the enumerated settings/config-diagnostic/test surfaces require a new audit entry before change. “Truth correction” is not authority to build SBX-1 or SBX-2 early.

Specification: `.planning/desktop-overhaul/SANDBOX-DEVELOPER-JOURNEY.md`.

Desktop paths: `src/renderer/pages/settings/WCoreConfig/`, `src/process/agent/wcore/configBridge.ts`, `profilePaths.ts`, `profileStore.ts`, `envBuilder.ts`, `index.ts`, conversation/workspace recovery surfaces, Doctor/support bundles, `tests/unit/`, `tests/integration/`, and packaged E2E.

Outputs:

- a versioned Desktop/Core settings map with correct section, key, value domain, minimum/maximum version, restart semantics, and effective-policy evidence;
- removal or fail-closed disabling of inert `security.approval_mode`, `security.env_passthrough`, and `security.block_private_urls` behavior;
- an honest general-egress control that cannot claim OFF without Core's required invocation contract and that is never conflated with Browser SSRF policy;
- effective profile/Project/workspace/policy-source diagnostics and explicit temporary-chat/fresh-profile inheritance semantics;
- a Core producer request for typed, purpose-scoped local Browser grants and local toolchain read/write grants, preserving metadata/private-network/remote-session protections;
- inline recovery and an Effective Access projection only when the selected Core version advertises and enforces the relevant capability;
- macOS Xcode/Command Line Tools discovery and bounded build-root proof, never a blanket sandbox disable.

Verify:

- Desktop rejects or migrates every wrong-section/wrong-value config case and proves Core parses the resulting configuration;
- toggling a setting must change a producer-reported effective policy or remain unavailable—successful TOML persistence alone cannot pass;
- localhost host/port/Project grants cannot widen to metadata, RFC1918, alternate encodings, redirects, DNS rebinding, another Project, channels, schedules, Web/Cloud, or remote sessions;
- temporary versus Project workspace and empty versus cloned profile journeys preserve the intended global/project config chain and explain every non-inheritance boundary;
- signed packaged macOS arm64/x64 journeys cover `xcode-select`, `xcrun`, minimal compile, minimal `xcodebuild`, DerivedData, cancel/revoke, and redacted diagnostics;
- Classic and Cockpit project the same effective policy and recovery state.

Contingency: until Core publishes a safe local-target/toolchain policy, Desktop disables the false controls and shows the denial truthfully. It may offer a clearly labeled **user-initiated handoff outside Wayland enforcement**, but it may not automatically route, forward credentials, execute a command, inherit an approval, or report the outside action as a Wayland policy success. Changing to a Project/folder triggers a fresh producer-enforced decision and grants no access by itself. Desktop never invents an exception, silently adds `--i-accept-exfil-risk`, or recommends a nonexistent key.

Acceptance: INV-06/09/11/17/21 and SC-06F/07/10/11/12/13/15/21 pass against the bundled Core, oldest supported override, and next candidate. Open issue `#826` is corrected by its owning lane; Desktop does not close it.

### Packet M1M — MCP truth and live-session contract

Dependencies: M0A for migration/rollback safety; only the bounded MCP-0 corrective exception below may begin immediately. Runtime receipt work depends on M1's pinned Core corpus and the equivalent contract or explicit `published_unverified` capability for each non-Core backend. M1M follows the lifecycle, fixtures, security rules, and build packets in `MCP-DEEP-DIVE.md`.

Pre-M0A/M1 corrective exception — **production-path implementation, not production eligibility**:

- permitted implementation behavior: replace saved/probed-state false-ready copy with declaration/auth/probe/publication language; make existing add/import/publication transactions fail closed instead of painting failed declarations green; preserve supported localhost URL identity and reject unsafe metadata/link-local targets; remove stale hosted-token/config publication where the existing adapter can refresh it; and rename the ACP Team configuration-acceptance event so it cannot itself claim tools are ready;
- permitted implementation surfaces: MCP Library and composer connector presentation under `src/renderer/`, existing MCP hooks and i18n keys, `src/common/mcp.ts`, `src/common/mcp/mcpUrlSafety.ts`, `src/common/mcp/sessionReceipt.ts`, existing adapter/publication code under `src/process/services/mcpServices/`, existing ACP/Gemini/Codex/Core declaration builders, and tests/fixtures that exercise those exact paths;
- permitted proof-only work: deterministic vendor-shaped declarations for Tavily, Firecrawl, n8n, and Beeper; isolated receipt reducers and mock-agent `tools/list` / read-only `tools/call` seams that cannot promote production UI state;
- containment before dependencies pass: expose the changed path only behind a non-promoting development/corrective flag against copied state; use no real credentials; exclude it from release artifacts and cohort eligibility; and require M0A/M1 receipts before enablement beyond that harness;
- prohibited before dependencies pass: no persistent lifecycle-schema migration, no new canonical MCP store, no live credentialed vendor canary, no automatic session restart, no ToolSearch/readiness promotion, no invented backend receipt, no packaged/cohort claim, and no M2/M5/M7 state or UI expansion. Any behavior outside this list remains MCP-1+ and locked behind its declared dependency.

Desktop paths: `src/renderer/pages/settings/McpLibrary/`, `src/renderer/hooks/mcp/`, `src/process/services/mcpServices/`, `src/process/acp/`, `src/process/agent/acp/`, `src/process/agent/wcore/`, backend config adapters, ToolSearch integration, `tests/unit/`, `tests/integration/`, and `tests/e2e/specs/mcp.e2e.ts`.

Outputs:

- one main-process broker owns validate → authenticate → probe → persist → publish → session-refresh decisions for every entry path;
- versioned lifecycle states distinguish declaration, credentials, standalone probe, backend publication, restart requirement, active-session registration, discovery, invocation, degradation, and revocation;
- per-backend publication and per-session registration receipts are correlated by server identity, definition digest, session ID, transport, scope, and tool inventory;
- each connector/backend projection is capability-honest: direct transport when advertised and proven, a version-pinned Wayland remote-to-stdio relay when required and accepted, or an explicit unsupported result before send; ACP capability flags are never overridden to manufacture support;
- Core `mcp_ready{name, tools}` and `mcp_failed{name, reason}` are consumed per server rather than collapsed into one generic readiness promise;
- untrusted stdio is never wire-added after Core startup; trusted startup publication or a future pinned Core host-declaration contract is required;
- catalog, URL, JSON, extension, and migration paths share one transaction and one authoritative URL/network policy, including supported localhost connectors;
- ToolSearch indexes the current session's receipt inventory, respects tool allowlists and `tools/list_changed`, and never infers availability from stale settings probes;
- one-click redacted diagnostics report the exact failed lifecycle stage without exposing credentials;
- existing false-green records migrate no higher than `probe_reachable` until the active session proves them again.

Verify:

- red tests cover URL persistence without publication, keyless install-only readiness, local Beeper URL handling, unsupported transports, ACP advertised-capability enforcement, direct-versus-relay selection, Core stdio rejection, multi-server partial readiness, auth expiry, definition changes, and revoke;
- deterministic catalog fixtures cover Tavily hosted OAuth, Firecrawl local stdio/API key and hosted HTTP, n8n custom/curated remote, and Beeper localhost HTTP, plus mock/malicious equivalents for CI;
- a real process/IPC journey proves install → publish → new/current-session decision → `tools/list`/ToolSearch → read-only `tools/call` → revoke → disappearance for Core and at least two representative non-Core backends;
- the unconditional agent-layer MCP E2E skip is removed; unavailable real-provider credentials may skip only separate canaries, never the deterministic journey;
- packaged six-target proof covers restart, reconnect, offline/local, auth expiry, stale config, duplicate definitions, and partial backend failure;
- secrets and OAuth material remain redacted in logs, receipts, support exports, screenshots, and crash reports.

Contingency: a backend that cannot produce live registration evidence is labeled `published_unverified` and excluded from the connected/ready claim. An unavailable Core producer contract holds Core-specific runtime publication; it does not permit Desktop to widen scope, inject rejected stdio, or infer success.

Acceptance: INV-19 and SC-14A pass; no deterministic path renders a chat-ready green state without the exact active-session receipt; J9 passes in a packaged build with no simulation-only or unconditional skip.

### Packet M2 — Backend-neutral execution model

Dependencies: M1 plus either M1F passing or an explicit no-Flux/degraded capability profile. The degraded profile preserves existing route controls while disabling route explanations, route-cost claims, and every SC-14-dependent surface until M1F passes. A versioned M1M lifecycle schema and fixtures are a hard dependency for every MCP-capable M2 field, reducer, selector, or readiness projection. Before M1M passes, M2 may proceed only with MCP represented as absent/unsupported; it may not introduce provisional connector/readiness state or a second connector model.
Paths: new `src/common/execution/`, `src/common/chat/activityTree.ts`, `src/common/chat/innerEvent.ts`, backend managers/adapters, new renderer hooks/store, focused unit/contract tests.

Outputs:

- typed execution entities/reducer;
- adapters for WCore and representative non-Core backends;
- derived-state recovery semantics with no new canonical Task store in the preview;
- selector APIs for identity, execution spine, optional plan/steps, Activity, approvals, cost, domain outcome references, validation, and receipts;
- the single generated/validated capability manifest consumed and extended by Desktop, Cowork, and Web/Cloud composition roots, including per-backend enforceability.
- migration of the current Cowork-only Office readiness probe into that shared schema; the probe may remain as a producer adapter, but it cannot remain a second authority or independently grant a ready treatment.

Verify:

- golden event histories across stop/retry/reopen/resume;
- idempotency, out-of-order and nested-event tests;
- memory/output bounds on large tool streams;
- no regression in existing message rendering;
- Web/Cloud composition-root compile and contract replay;
- conservative effective-policy intersection across trusted/untrusted workspace, backend, host, scheduler, and channel constraints.
- enforced/brokered/advisory readiness fixtures prove that external backends never receive an unenforceable guaranteed-ready treatment.
- provider-handoff fixtures enumerate the checkpoint boundary, preserved Desktop-owned state, lost backend-owned session/plan/tool state, capability changes, and unresolved external side effects; the contract cannot imply continuity when the replacement backend starts fresh.

Acceptance: INV-04/06/08/09/15/17 and SC-07/10/10A/11/12/13 pass; one authoritative interpretation per event and capability; Classic behavior remains green. M2 closes only the provider-transition contract portion of SC-10A; M5 and the consuming vertical must still prove the live handoff journey. SC-14 is mandatory only when the M1F capability is enabled and otherwise remains visibly unavailable, never inferred. C1 remains locked until the shared manifest owns Cowork readiness and C0-B cites the exact M2 readiness-schema receipt. Final C0 release closure remains an M8 output, not a C1 entry dependency.

### Packet M3 — Shell selector and migration skeleton

Dependencies: M0A and stable shared-service boundaries; may run alongside late M2.
Paths: `src/common/config/storage.ts`, `src/renderer/main.tsx`, `src/renderer/components/layout/`, `src/renderer/components/layout/Router.tsx`, Settings Navigation/General, E2E shell fixtures.

Current-boundary note: the existing Cockpit shell/navigation code is an isolated prototype only. Before M0A passes it may run solely against copied/disposable state on the non-promoting preview path; it is not M3 acceptance, cohort eligibility, or permission for further shared-model expansion.

Outputs:

- typed `ui.shell` preference with safe default;
- Classic and empty Cockpit composition roots over canonical routes;
- independent lazy-load and fault-injection proof showing Classic boots when
  Cockpit import, render, route, or state initialization fails;
- switch/reset UI and startup crash fallback;
- same-conversation cross-shell E2E.

Verify:

- switch during idle, streaming, waiting approval, workspace open, and restart;
- invalid preference and Cockpit render failure fall back safely;
- no database writes or object duplication from switching;
- Classic read/edit/write round trips preserve every Cockpit-observed field and correlation;
- shared-service fault injection proves whether R1 helps or correctly escalates to R2.

Acceptance: INV-04/05/12/13, SC-02/08, and the SC-20 Cockpit-to-Classic shell-switch portion pass. This packet does not claim the aggregate install/restore/rollback/re-upgrade sequence; M8 closes that sequence by composing M0A and M3 evidence through the signed candidate.

### Packet M4 — Cockpit navigation, new chat, and Projects

Dependencies: M3.
Paths: existing Guid hooks/components, Sider/nav registry, Projects pages/services, new Cockpit shell components, localization files.

Outputs:

- canonical navigation;
- normal chat-first home/new-chat composition;
- recent chats and pinned Projects;
- Project context visible in new and existing chats;
- universal navigation/search entry point.

Verify:

- novice first-value and returning-user findability journeys;
- all legacy deep links/redirects;
- keyboard, focus, screen-reader, zoom, mobile/narrow layout;
- catalogue routes lazy/virtualized where needed.

Acceptance: SC-01, SC-04, INV-01/03 pass.

### Packet M5 — Conversation cockpit and execution spine

Dependencies: M2, M3, M4.
Paths: WCore/ACP/Gemini/Codex conversation platforms, `ChatLayout`, send boxes, confirmation UI, model/mode selectors, activity selectors, conversation tests.

Outputs:

- shared conversation frame;
- compact agent/model/scope/effective-policy bar;
- persistent composer;
- one entry path for quick answers and substantial work, with an unobtrusive effective execution intent that can be overridden without changing product surfaces;
- live execution spine;
- adaptive mission-rail activation and plan provenance, including auditable replans and a clearly distinct Desktop-local checklist fallback;
- sparse in-thread activity milestones and cross-linking to the same rail/output/evidence identities, with repeated low-level tool events collapsed;
- unified waiting/approval/failure/resume state;
- an unobtrusive post-turn charged-cost receipt and running conversation total, with route/attempt/retry detail progressively disclosed and an explicit distinction between authoritative, computed, and unknown values;
- conservative user-set spend warnings and a pre-call pause boundary for new billable turns; an already-started request is never represented as cancellable after the producer no longer guarantees cancellation;
- remembered expert disclosure and keyboard actions.
- validated visual reference in `mockups/mission-run/index.html`, showing a substantial run without turning quick chat into an always-on dashboard.

Voice/Cockpit work before M2/M5 acceptance is presentation-only prototype work on disposable state. It may explore layout, animation, microphone/voice selection, and static state projection, but canonical interruption, stop/resume, approval, persistence, lifecycle, shared selectors, and authority semantics remain locked behind M2/M5. Any “continue without interruption” language is subordinate to this boundary and cannot authorize runtime promotion.

Verify:

- send, streaming, queue, stop, true continue, restart/resume, question/approval, mode/model changes;
- Project/workspace context; pop-out; concurrent chats;
- low-risk quick answer, substantial steerable work, and graduation between them without a mandatory Cowork/coding mode switch;
- mission rail absent for quick chat; activated by durable multi-step state; producer/local ownership, step history, blockers, outputs, context, approvals, and completion remain truthful across replan/reconnect/reopen;
- thread/rail consistency fixtures prove both projections derive from one event history and cannot disagree after out-of-order, duplicate, reconnect, retry, provider-handoff, or terminal events;
- Core and at least two non-Core backend fixtures;
- live provider replacement at an explicit checkpoint, with preserved/lost state, capability delta, and unresolved-side-effect disclosure rendered before the replacement executes;
- Flux-charged ordinary chat reconciles producer request receipts to the conversation total; intentional retry/fallback is visible, an unexplained mismatch stops the cost claim and produces a redacted support receipt;
- Classic/Cockpit side-by-side parity assertions.

Acceptance: SC-05 through SC-07, the M5 live-adapter portion of SC-10A, and INV-02/06/08 pass. Each consuming vertical still owns its J20 outcome proof.

### Packet M6 — Contextual workbench and trusted outcomes

Dependencies: M1, M2, M5, plus a signed-off receipt contract covering trusted top-level sourcing, producer/host staleness ownership, digest binding, ordering, replay, and artifact mutation.
Paths: current Workspace, Preview, ObservabilityPanel, terminal, files/changes, artifact surfaces; new workbench host; receipt components/tests.

Outputs:

- one contextual workbench host with knowledge, development, automation, and external-action projections;
- responsive adaptive mission rail with active-section disclosure, pin/close/reopen, and no permanent narrowing of ordinary conversation;
- files, sources, plan, changes, terminal, tests, preview, artifacts, activity, approvals, logs, and Team/Core lanes activated only when relevant;
- top-level receipt chip/detail/staleness;
- distinct domain validation, integrity-checked, verified, receipt-stale, and source-dependency-stale states;
- consequential action scope/policy preview.

Verify:

- writing, coding, research, automation, consequential external-action, Team, and browser/CUA journeys through the same host;
- panel state/resizing/narrow layout/pop-out;
- receipt forgery, digest mismatch, mutation/staleness, unpriced cost;
- extension/plugin/MCP origin spoofing and IPC injection attempts;
- bounded tool output and terminal lifecycle.

Acceptance: INV-09/10/14 and workbench journeys pass. A verified badge is disabled unless the trusted-origin boundary is proven; a reported/integrity-checked result is not visually promoted to verified.

### Packet M7 — Library, Automations, and Activity consolidation

Dependencies: M4, M5, M6.
Paths: Assistants, Workflows, Teams, Skills, MCP/Connections, Scheduled Tasks, Mission Control, Memory navigation, command/search indexes.

Outputs:

- Library with typed filters and lifecycle actions;
- Automations over the existing Desktop scheduler;
- Activity groups: Needs you, Running, Upcoming, Recent;
- invocation and management paths for every capability;
- legacy route/deep-link compatibility.

Verify:

- large-catalogue virtualization/performance;
- create/invoke/manage/disable/revoke journeys;
- scheduled create/restart/run/result/receipt with deterministic provider;
- Desktop Workflow vs Core workflow and Desktop Team vs Core sub-agent provenance.

Acceptance: no capability cul-de-sac; INV-07 passes.

### Packet M8 — Hardening and release evidence

Dependencies: M4 through M7 feature-complete; M0/M1 continuously green; M1F for every Flux route/cost claim; M1M/MCP-4 for every connector path; M1S/SBX-2 for every sandbox/developer claim; C0-B for every Cowork/native-Office surface; an immutable C1 receipt for the mandatory first Cowork vertical and J17/J23; and the M5V-A functional receipt for every Voice surface included in the candidate. M8 itself produces final C0 release closure and the M5V-B packaged receipt, so neither is an M8 entry dependency. If C0-B/C1 or M5V-A is not green, the corresponding Cowork or Voice capability is absent from the candidate and its release/marketing claims. A capability whose dependency is not green must be absent from the candidate and its release/marketing claims, not merely visually disabled.
Paths: CI workflows, package scripts, E2E suites, accessibility/visual/performance harnesses, Doctor/support bundle, docs.

Outputs:

- risk-weighted test gates and repaired navigation/current-route suites;
- packaged journey matrix;
- broadened/package-capable deterministic provider and Core simulator/fixtures established in M1;
- real-provider canaries separated from deterministic proof;
- accessibility, performance, bundle, memory, crash, and localization gates;
- support/Doctor compatibility report.
- working rollback delivery path independent of a healthy in-app updater, plus tested in-app downgrade where supported;
- closure or release-blocking quarantine of the current Windows EACCES, mac updater, and uninitialized-updater findings before invited alpha;
- publisher-authenticated Core binary/update provenance; a checksum fetched beside a binary is not treated as an independent signature.
- actual packaged-resource verification consumes the M0/M1 Core provenance receipt and fails closed on `local-prebuilt`, unverified, skipped, wrong-target, wrong-release, archive-digest, or binary-digest drift; package scripts must assert strict mode directly rather than infer it from ambient lifecycle variables.
- third-party executable supply-chain ledger, including OfficeCLI redistribution license, publisher identity/signature where available, independent pinned hashes, update ownership, hosted fallback reachability, and explicit cost/network consent.
- signed-package updater receipt proving “Install and restart” actually quiesces, installs the intended version, relaunches the app, advances the displayed/runtime version, and recovers through the independent download/rollback path when silent apply fails.

Verify:

- clean signed/package artifacts on all supported OS/architectures;
- install/update/rollback smoke on macOS arm64/x64, Windows arm64/x64, and Linux arm64/x64;
- upgrade/rollback/re-upgrade corpus;
- kill/crash/network/offline/partial-service injection;
- orphan subprocess/process-tree cleanup and resumable-state reconciliation;
- no open P0/P1 tied to preview journeys.
- updater failure injection covers no-relaunch, install-on-quit deferral, stale pending-install markers, signature/version mismatch, manual-download recovery, and preservation of running work.
- replay C1's exact target/architecture-declared component/integration source-to-cited-DOCX/PDF receipt through the
  release artifact; J17 and J23 are mandatory preview journeys, not an
  optional Cowork follow-on claim.

Acceptance: all 21 invariants and all 31 distinct success criteria pass, with immutable citations to upstream packet receipts and exact-candidate replay. Capability-conditional criteria may be marked not applicable only when the capability is physically absent from the candidate and from every release or marketing claim; a disabled, hidden, or unverified path is not absence. M8 cannot accept on SC-15 through SC-21 alone.

### Packet M9 — Preview rollout and Classic decision

Dependencies: all previous M packets, including the M5V-B packaged receipt when Voice is present, plus immutable final C0 release-closure and C1 receipts; M8's
packaged replay of J17/J23 must remain green.
Paths: onboarding/update messaging, shell settings, privacy-respecting feedback, release docs, support process.

Outputs:

- existing users default Classic with explicit preview invitation;
- new-user Cockpit default only after first-run evidence passes;
- return-to-Classic reason capture;
- time-to-first-value, first-attempt task success, false-ready rate, intervention/recovery rate, accepted-output rate, and privacy-safe share/remix measures;
- published rollback/support matrix;
- time-boxed Classic support policy and later retirement review.

Verify:

- internal dogfood, invited alpha, opt-in beta, then default-new cohorts;
- metric comparison against Classic baseline;
- support drill and rollback drill before each cohort expansion.

Acceptance: Cockpit becomes default only at rollout gates; Classic retirement remains unapproved.

### Follow-on packet P1 — Encrypted Wayland instance migration

P1 is appended after the first-preview M0–M9 sequence and is excluded from the
16-packet first-preview accounting. Its contract is captured now so new stores
cannot become unexportable debt. P1-only audit findings block P1 design and
implementation, not M0–M9. They block first-preview work only when they expose
an independent violation of an M0–M9 invariant or of the shared M0
inventory/quiescence/restore seam named above.

Dependencies: accepted M0 application-consistent quiescence/backup primitives,
stable M7 object authorities, and the M9-supported schema set. Cloud and Pro
destinations additionally require their own tenant/import authority receipts.

Outputs:

- destination-bound and passphrase-recovery `.wayland-transfer.zip` modes;
- source-side actor, tenant, role, step-up authorization, denial, and export
  audit receipts for Desktop, self-hosted Cloud, and hosted Pro;
- destination-side `instance.import`, current-membership, role, step-up,
  dual-control, final dry-run approval, denial, and import audit receipts for
  Desktop, self-hosted Cloud, and hosted Pro; possession of an import key is
  never mutation authority;
- one versioned portability descriptor for every durable store;
- encrypted authenticated object graph covering supported settings, chats,
  Projects, Teams, files, artifacts, archives, schedules, workflows, assistants,
  skills, memory, receipts, and non-secret configuration references;
- explicit credential rebind and backend-session resumability ledger;
- hostile-archive-safe transactional dry-run/import, conflict mapping,
  pre-import recovery point, rollback, and post-import validation;
- immutable preservation of producer-signed source receipts plus a separate
  destination provenance/identity-map wrapper; receipt bytes and authenticated
  IDs are never rewritten to fit destination object IDs;
- destination-key expiry/single-use/revocation, signer trust, durable replay and
  idempotency, transactionally staged OS-vault rewrap, and cryptographically
  erasable staging contracts;
- fixed format-v1 KDF resource bounds validated before allocation, a
  pre-decryption archive-digest replay index and consumed-key tombstone that
  preserve exact idempotency after private-key destruction, and visibly
  time-bounded saved destination bundles;
- non-executable quarantine and separately receipted activation for unverified
  skills, assistants, connectors, scripts, prompt templates, and executable
  workflow content;
- Constitution v2 active/required-retired revision-authority continuity through
  its accepted portable recovery envelope, or explicit quarantine of every
  dependent history/configuration claim;
- Desktop, self-hosted Cloud, and hosted Pro transfer journeys.

Acceptance and threat model are normative in `INSTANCE-MIGRATION.md`. P1 reuses
M0 quiescence and recovery authority and may not create a competing backup or
identity store. Encryption protects artifacts in transit and at rest; Wayland
does not falsely claim that authorized plaintext is impossible to observe after
an approved destination decrypts it.

## 8. Gate-driven strike schedule

These waves are dependency strikes, not calendar phases. Work starts as soon as
its named inputs are pinned, parallelizes only across non-overlapping ownership,
and integrates serially through exact receipts. There is no intentional idle
time, date padding, or waiting for a nominal “next week.” Evidence gates remain
fixed; execution latency is compressed around them.

| Wave                             | Packets                                       | Start rule                                                                                                                                                                                                                | Shippable result                                                                                                                                                                                                               | Exit decision                                                                                                                                                              |
| -------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Safety foundation            | M0A, M0B, M1, M1F, M1M/MCP-0, M1S/SBX-0, C0-A | Immediate; run independent contract, recovery, truth, and proof lanes concurrently                                                                                                                                        | Recovery harness, isolated dogfood channel, Classic baseline capture, pinned Core/Flux fixtures, false-green MCP/Core-setting states removed, and non-promoting Cowork producer/supply-chain truth                             | M0A unlocks flagged development; M0A+M0B unlock invited alpha; C0-A is not Cowork readiness or release closure.                                                            |
| 1 — Migration skeleton           | M2, M3, C0-B                                  | Begin each slice immediately when its Wave 0 contract dependencies pass; C0-B starts only after the exact M2 readiness schema exists                                                                                      | Flagged Classic/Cockpit switch over shared state plus Cowork consumer conformance and target-exact first-vertical component proof                                                                                              | Same copied/disposable state works in both shells; C0-B may unlock C1 but does not claim final signed-app closure.                                                         |
| 2 — Daily cockpit                | M4, M5, M1M/MCP-1–2, M1S/SBX-1                | M4 may advance on stable shell boundaries; M5 waits only for its named execution contracts                                                                                                                                | Chat, Projects, navigation, routing, execution spine, brokered live connector receipts, and producer-backed policy recovery                                                                                                    | Primary daily journeys match or beat Classic; supported connectors and policy actions are session-proven.                                                                  |
| 3 — Power and outcomes           | M6, M7, M5V-A, C1, M1M/MCP-3                  | Start M6/M7 slices as soon as M5 and their receipt contracts pass; M5V-A runtime integration starts only after its M0A/M2/M5/M6 authority inputs pass; C1 starts only after the declared M0A/M1/M2/M5/M6/C0 receipt chain | Workbench, artifacts, receipts, Library, Automations, Activity, scoped ToolSearch discovery, provider-neutral Voice over the canonical run, and the first target-declared cited DOCX/PDF Cowork component/integration vertical | Power-user parity and trusted outcomes pass; M5V-A proves functional voice journeys without inventing a parallel run; C1 owns J17/J20/J23 and emits its immutable receipt. |
| 4 — Release hardening            | M8, M5V-B, M1M/MCP-4, M1S/SBX-2               | Continuous proof begins in Wave 0; aggregate release proof begins when product slices are complete; M8 produces M5V-B rather than depending on it                                                                         | Six-target packaged candidate, connector/policy corpus, packaged Voice evidence when included, macOS toolchain proof, and recovery drill                                                                                       | Mandatory journeys, M5V-B when Voice is present, MCP J9, sandbox J25, and rollback proof pass.                                                                             |
| 5 — Preview                      | M9                                            | Immediately after all prior receipts and the independent observation gate pass                                                                                                                                            | Invited alpha, then opt-in beta with daily cohort decisions                                                                                                                                                                    | Expand, hold, descope, or roll back from evidence.                                                                                                                         |
| 6 — Secure portability follow-on | P1                                            | After M0 recovery authority, M7 object ownership, and M9 supported schemas are stable; contract constraints apply to new stores immediately                                                                               | Encrypted Wayland-to-Wayland Desktop/Cloud/Pro transfer with dry-run, rollback, credential rebind, and full-object validation                                                                                                  | A representative instance transfers twice across supported targets without silent loss, secret disclosure, broken references, or authority widening.                       |

Operating rules:

- produce runnable internal candidates whenever a bounded slice passes, without
  waiting for a calendar milestone;
- begin the next dependency-safe strike immediately after each accepted seal;
- run proof with implementation, never as an end-loaded phase;
- the 14-calendar-day M0B Classic observation is an irreducible cohort evidence
  window, not a reason to pause engineering or withhold internal builds;
- invited alpha still requires M0A, M0B, and all named M0–M8 gates;
- default-new is evaluated from comparative cohort evidence, not a promised
  date; and
- Classic retirement remains unestimated until preview evidence exists.

A failed gate holds only its dependent slice and immediately reroutes capacity
to other unlocked work. It cannot turn an unverified platform, backend, or
journey green. Zero-tolerance failures—data corruption, approval bypass,
cross-Project leakage, receipt forgery, or failed recovery—stop the train.

Every build before M0A passes uses disposable or copied state, a separate prerelease update channel and version namespace, no automatic promotion, and no real-user enrollment. Data-integrity, approval, trust, or recovery failure is a global hold; it is never treated as a slice-level descope.

This cadence assumes reuse of existing services, managers, IPC, routes, and stores. It is not a greenfield rewrite. Cockpit is a new composition over proven machinery; any packet that begins reimplementing the engine is stopped and returned to the declared adapter boundary.

Continuous capacity allocation is 70% feature/integration, 20% automated proof/review, and 10% Classic/P0 response. This is concurrent work, not schedule padding. Descope order is: catalogue polish, advanced workbench tabs, selected backend integrations, then cohort eligibility for an unproven platform/architecture. Never descope rollback, data integrity, approvals, primary-journey accessibility, trusted outcomes, or Classic fallback.

Three bounded streams run in parallel with one integration head:

- contract/recovery: M0A, M0B, M1, M1F, M1M, migrations, compatibility, and external recovery;
- cockpit slices: M2–M7 behind flags, beginning only when their named contracts are pinned;
- proof/release: fixtures, real-IPC harness, E2E, accessibility, security,
  packaging, and release receipts from the first strike.

AI agents may parallelize bounded implementation and review, but integration is serialized through the packet receipts. M2/M3 may overlap after interfaces pin; M4 may proceed against released Core/Flux fixtures; M5/M6 remain integration bottlenecks. Broken main, deferred tests, and end-loaded hardening are not accepted as speed.

## 9. Verification strategy

### 9.1 Test layers

1. Pure unit tests for reducers, mapping, policy presentation, migration decisions, and receipt validation.
2. Component tests for focus/keyboard/states/responsive/accessibility.
3. Producer-consumer contract replay for Core and backend fixtures.
4. Main/renderer integration tests through real IPC/service boundaries.
5. Deterministic Electron E2E with fake provider/Core processes.
6. Credentialed real-provider canaries, never release's sole proof.
7. Packaged installer smoke on supported platforms.
8. Upgrade, backup, rollback, restore, and re-upgrade drills.
9. Adversarial security tests for approvals, trust, event spoofing, nested receipts, secrets, path/network scope, extensions, and channels.
10. Usability evaluation against novice, knowledge-work, developer, and operator journeys.
11. Property/state-machine tests for shell switching, event ordering, migration decisions, backup/restore, and policy intersections.

### 9.2 Benchmark journey registry

J1–J21 and J23–J25 are mandatory for the first Cockpit preview. J22 is retained in
the same numbered registry as a mandatory follow-on Cloud/hosted gate, but it
cannot be used to pass or block Wave 0–M9.

- J1: clean install → normal prompt → useful response → saved chat.
- J2: create/open Project → new chat → shared context → artifact.
- J3: developer workspace → inspect plan/policy → file change → terminal/test → diff → receipt.
- J4: Core question/approval → suspend → resume → verified outcome.
- J5: external agent conversation with the same cockpit semantics.
- J6: proposed Team → inspect roster → run → child activity → consolidated result.
- J7: Desktop Workflow step/auto → human gate → completion.
- J8: schedule work → restart app → execute → Needs-you/result/receipt.
- J9: MCP/connection declaration → credentials/auth → standalone probe → backend publication → exact active-session registration → ToolSearch discovery → read-only invocation → revoke → live disappearance → degraded explanation. The receipt must identify server, definition digest, backend, session, scope, transport, and tool inventory; a settings-page probe cannot satisfy this journey.
- J10: browser/CUA blocked and allowed paths under explicit policy.
- J11: switch Classic ↔ Cockpit during representative states.
- J12: v0.11.8 → v0.11.18/Cockpit → rollback → re-upgrade state corpus using Core plus at least two representative non-Core adapters, including safe degraded/non-resumable handling for CLI-owned session state.
- J13: shared execution/domain change → Desktop build + Web/Cloud composition build/contract replay, with missing packaged capability reported rather than hidden.
- J14: inspect Project/Core memory provenance → edit/delete/export → verify governance applies consistently and no hidden second memory store is implied.
- J15: offline/degraded network → local-capable chat and artifacts remain usable; unavailable Cloud/provider/MCP paths explain what is missing and recover without corrupting state.
- J16: schedule/Team/channel/Web execution requests a consequential action → declared non-interactive policy blocks or routes to Needs-you; no `yoloMode` or backend default silently auto-approves it.
- J17: ordinary composer → mixed local/web sources → cited DOCX and PDF → scoped revision → domain validation with honest limitations; no Cowork mode switch and no verified promotion from adapter output.
- J18: ordinary composer → repository issue → plan → file change → terminal/tests → diff → receipt, using the same work kernel and a development-specific Workbench projection.
- J19: capability removed or version-mismatched → enforceable backend blocks before execution; advisory backend warns honestly and cannot display guaranteed-ready state.
- J20: checkpointed provider replacement preserves Desktop-owned Project/sources/artifacts/versions, enumerates lost backend session/plan/tool state and unresolved side effects, and starts fresh where continuity is unsupported.
- J21: candidate writes `ask`/`trusted-edits` → signed v0.11.8 boots conservatively without authority widening → candidate re-upgrade preserves effective policy.
- J22 (follow-on Cloud/hosted gate; explicitly not a first Cockpit-preview gate): open the same Project goal on Desktop and Web/Cloud → portable capabilities retain semantics, adapted capabilities retain the user outcome, unavailable capabilities are hidden or explained with a recovery path → return without introducing a visible Cloud mode or second Project identity. No Wave 0–M9 packet may claim or be blocked on J22; M2 owns only the prerequisite J13 composition-root compile/replay. J22 becomes mandatory when the follow-on Cloud/hosted program names a host-transition packet with Project identity/portability fixtures, dependencies, return semantics, and packaged acceptance.
- J23: state the same supported knowledge-work outcome in plain language and through the Cowork starter → both use the same chat route, composer, kernel, stores, and authority → produce equivalent cited native-artifact state → continue naturally into coding, research, or follow-up work.
- J24: ordinary Flux-routed chat → one or more explicitly identified producer attempts → authoritative per-request cost and token/cache receipt → post-turn and conversation total → account/export reconciliation → conservative spend boundary. Retry/fallback and failed-but-billable attempts remain inspectable; absent cost is unknown; any unexplained mismatch disables the trusted total and yields a redacted diagnostic. If the required live evidence transport is unavailable, the preview must disable Flux metering claims and cannot enroll users into the affected route.
- J25: Project app on `http://localhost:3100` → typed Browser denial with effective source → purpose-scoped Project/host/port grant → successful local inspection while metadata/private/redirect/rebinding/other-Project paths remain blocked → restart/revoke proof → selected macOS Xcode toolchain runs a minimal compile/build with bounded readable/writable roots and a redacted receipt. If Core lacks the grant contract, Desktop must show the unsupported truth and the journey cannot be claimed green.

### 9.3 Evidence receipt

Every packet produces a verification receipt containing:

- immutable candidate identity: base commit, tracked-diff digest, untracked-file manifest and digests, dependency-lock digest, fixture/artifact digests, and dependency/Core versions;
- exact commands and exit status;
- deterministic fixtures and environment;
- tests/journeys and supported platforms exercised;
- screenshots/traces where appropriate;
- failures, skips, limitations, and owner;
- rollback result;
- artifact checksums.

“Passed unit tests” is never promoted to packaged journey proof.

## 10. Rollout gates and automatic stop conditions

### Cohorts

1. Developer-only behind explicit flag.
2. Internal dogfood using disposable and copied real state.
3. Invited alpha with R1 switch visible.
4. Existing-user opt-in beta, still Classic-default.
5. New-user Cockpit default after first-value evidence.
6. Existing-user default-new only after comparative evidence.

### Stop/rollback triggers

Any of the following pauses cohort expansion; data/security items trigger immediate rollback/quarantine:

- confirmed data loss, corruption, cross-Project leakage, or receipt forgery;
- permission scope wider than shown or approval bypass;
- unrecoverable conversation/job state introduced by Cockpit;
- crash-free sessions materially below Classic baseline;
- failed send/stop/resume/approval/schedule rate materially above Classic;
- accessibility blocker in a primary journey;
- p95 interaction/stream rendering outside the agreed budget;
- support incidents or return-to-Classic reasons show a repeated mental-model failure;
- Core candidate changes critical wire semantics without passing contract replay;
- rollback rehearsal fails or backup/restore cannot be verified.

M0B starts a 14-calendar-day rolling Classic baseline on Day 0 and must publish exact numerical thresholds, metric definitions, denominators, minimum sample/soak, and the named decision owner before invited alpha. Development and disposable/copied-state dogfood proceed during baseline collection only after the isolated channel/state rules above are active; external cohort enrollment does not. Zero tolerance applies immediately to data loss/corruption, permission widening, approval bypass, cross-Project leakage, and receipt forgery. If privacy constraints prevent product telemetry, use opted-in diagnostics plus structured cohort UAT; do not invent precision.

## 11. Risk register

| ID     | Severity | Risk                                                                                                                                                                                             | Mitigation                                                                                                                                                                                                      | Residual decision                                                          |
| ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| RSK-01 | Critical | Shared-state regression makes Classic fallback useless.                                                                                                                                          | UI-only shell boundary, shared-service contract tests, R1 drills every packet.                                                                                                                                  | No preview if shells diverge.                                              |
| RSK-02 | Critical | Binary downgrade opens incompatible newer state.                                                                                                                                                 | M0 compatibility preflight, state bundle, signed rollback drill.                                                                                                                                                | Sean decides if v0.11.18 must become rollback floor.                       |
| RSK-03 | High     | Moving Core protocol silently outpaces Desktop.                                                                                                                                                  | Pinned baseline, generated fixtures, event obligations, version matrix.                                                                                                                                         | Hold Core update/candidate.                                                |
| RSK-04 | High     | Desktop/Core duplicate Teams/workflows confuse users and state.                                                                                                                                  | Authority matrix, provenance, correlation without identity merge.                                                                                                                                               | Reject feature semantics that violate boundary.                            |
| RSK-05 | High     | Adaptive disclosure still feels neutered to experts.                                                                                                                                             | Compact always-visible spine, keyboard/pins, expert benchmark against Classic.                                                                                                                                  | Do not default-new until parity passes.                                    |
| RSK-06 | High     | Scope balloons into Cloud/Pro/artifact-suite rewrite.                                                                                                                                            | Separate follow-on programs and packet exit gates.                                                                                                                                                              | Defer rather than dilute Cockpit.                                          |
| RSK-07 | High     | Huge legacy managers make changes unsafe.                                                                                                                                                        | Adapter seams, touched-domain strictness/coverage ratchets, small packets.                                                                                                                                      | Quarantine unrelated refactors.                                            |
| RSK-08 | High     | Dual shell becomes permanent maintenance burden.                                                                                                                                                 | Time-boxed support policy, Cockpit-only new features, retirement review.                                                                                                                                        | Stop adding Classic features.                                              |
| RSK-09 | High     | Fake-provider tests pass while real integrations fail.                                                                                                                                           | Deterministic gates plus separate credentialed canaries.                                                                                                                                                        | Hold affected integration, not entire deterministic suite.                 |
| RSK-10 | High     | Privacy-hostile telemetry damages trust.                                                                                                                                                         | Opt-in diagnostics, local aggregation, explicit fields/retention.                                                                                                                                               | Use cohort UAT if consent is absent.                                       |
| RSK-11 | Medium   | Navigation grouping hides capability discovery.                                                                                                                                                  | universal search, pinned items, invocation/management path tests.                                                                                                                                               | Adjust IA without adding top-level nouns.                                  |
| RSK-12 | Medium   | Performance collapses on large histories/catalogues/activity.                                                                                                                                    | virtualization, bounded logs, profiler budgets, large fixtures.                                                                                                                                                 | Disable offending panel/slice via R0/R1.                                   |
| RSK-13 | Critical | Classic edits erase or orphan Cockpit execution metadata.                                                                                                                                        | Derived preview model, preserve-unknown round trips, no new Task identity/store.                                                                                                                                | Block shell switching or persistence.                                      |
| RSK-14 | Critical | Untrusted extension/IPC path forges a verified outcome.                                                                                                                                          | Authenticated origin plus digest/correlation validation; disable verified badge until isolation is proven.                                                                                                      | Render reported provenance only.                                           |
| RSK-15 | High     | Same-version unreleased Core changes evade semver compatibility checks.                                                                                                                          | Pin producer commit and fixture/schema digest, not version alone.                                                                                                                                               | Hold Core-dependent claim/update.                                          |
| RSK-16 | High     | Desktop-only domain fork worsens existing Cloud drift.                                                                                                                                           | Web/Cloud composition compile and contract replay in M2/M3.                                                                                                                                                     | Block shared-model merge; no Cloud-ready claim.                            |
| RSK-17 | High     | Solo-dev critical path overruns while Core refactor moves.                                                                                                                                       | Released-fixture contingency, capability gates, re-estimate at M0/M5, no Desktop Core fork.                                                                                                                     | De-scope dependent slice, not safety gate.                                 |
| RSK-18 | Critical | Non-interactive/yolo execution auto-approves a consequential Core request.                                                                                                                       | Conservative policy intersection, autonomous approval fixtures, Needs-you escalation, no hidden authority widening.                                                                                             | Disable affected schedule/channel/backend path.                            |
| RSK-19 | Critical | Settings reports an MCP connector connected while the active chat never received its tools.                                                                                                      | M1M lifecycle split, per-session receipts, ToolSearch correlation, deterministic invoke/revoke E2E.                                                                                                             | Disable green/ready state and affected backend claim.                      |
| RSK-20 | High     | Catalog/URL/JSON/extension paths or Core/ACP/native adapters publish different definitions and silently drift.                                                                                   | One broker transaction, definition digest, adapter receipts, backend matrix, config-drift diagnostics.                                                                                                          | Mark divergent adapter `published_unverified`; hold its cohort.            |
| RSK-21 | High     | Large MCP catalogs flood context or disappear behind stale discovery indexes.                                                                                                                    | Receipt-derived progressive discovery, allowlists, list-changed invalidation, context and cost budgets.                                                                                                         | Cap active tools and explain degraded discovery.                           |
| RSK-22 | Critical | Ordinary chat can consume substantial Flux credit without enough evidence to explain the route, attempts, or charge; local meters can also mislabel current context occupancy as billable usage. | Preserve authoritative per-request cost, correlate retries/fallbacks, distinguish context occupancy from processed tokens, reconcile totals, expose spend boundaries, and keep account traces private/redacted. | Disable trusted cost claims and affected preview routing until J24 passes. |

## 12. Coordination with Wayland Core and Flux

The active Core checkout is dirty and owned by another refactor. Desktop treats it as read-only.

Cross-lane coordination uses GitHub issues and `wl handoff`, with hostile issue text treated as data. Each request includes:

- producer and consumer owner;
- event/command example and minimum version;
- capability flag and activation semantics;
- ordering, correlation, idempotency, terminal behavior;
- trust/security boundary;
- producer golden fixture/test;
- Desktop decoder/normalizer/render/fallback obligations;
- bundle and release dependency.

Immediate Core-lane requests after plan approval:

1. Publish a clean integration commit/release candidate.
2. Export canonical serialized fixture corpus for Desktop-consumed events/commands.
3. Pin `EffectiveExecutionPolicy` wire shape/change semantics.
4. Pin Core workflow lifecycle and node/sub-agent correlation.
5. Pin Anvil receipt production, ordering, digest, and staleness responsibilities.
6. Preserve Desktop scheduling and host-delegated channel ownership.
7. Gate protocol-touching Core releases on Desktop consumer replay.
8. Pin the trusted pre-start MCP declaration contract, per-server `mcp_ready`/`mcp_failed` terminal semantics, tool inventory/list-change behavior, scope binding, reconnect behavior, and explicit rejection of untrusted wire-added stdio.
9. Publish a machine-readable settings/effective-policy contract plus typed, purpose-scoped local Browser and local toolchain grant capabilities; preserve metadata/private-network/remote-session protections and provide adversarial fixtures for Desktop J25.

Immediate non-Core MCP adapter obligations:

1. Each ACP/native adapter declares supported transports, publication/reload semantics, scoping enforceability, and whether live registration/tool receipts are available.
2. Adapters without live receipts return `published_unverified`; static config-name presence is never promoted to connected.
3. Catalog, URL, JSON, and extension producers use one normalized definition digest and cannot bypass network, credential, permission, or Project-scope checks.
4. Packaged acceptance covers Tavily, Firecrawl, n8n, and Beeper archetypes plus deterministic mocks; vendor-specific canaries supplement rather than replace CI.

Immediate Flux-lane requests after plan approval:

1. Publish or identify a clean producer commit/version for the Desktop candidate.
2. Export canonical fixtures for route choice, attempt, retry/fallback/circuit, override, disconnected, cost, latency, unpriced, and terminal outcomes.
3. Pin correlation and route-precedence semantics, including explicit native-model protection.
4. Gate contract-touching Flux releases on Desktop consumer replay.

Before M0A exits, each cross-lane request must exist as a claimed `wl`/GitHub handoff with issue ID, producer/consumer owner, acceptance receipt, and blocking date. Before M1/M1F exit, Desktop records the pinned producer commit/version, serialized fixture/schema digest, and generator version for Core and Flux. Before M1M runtime work exits, Desktop records the Core/adapter MCP declaration and receipt contract, supported-transport matrix, and deterministic corpus digest. If the Core candidate misses that gate, Desktop falls back to released `v0.12.25` fixtures and capability-gates frontier-only behavior; it does not fork Core or quietly consume the dirty checkout. If Flux misses its gate, SC-14 and new route-evidence UI remain disabled rather than inferred. If an MCP backend cannot prove live registration, it remains `published_unverified` and cannot satisfy SC-14A or J9.

## 13. Definition of done

A packet is done only when:

- its requirements trace to this plan;
- implementation uses the declared authority and no parallel store;
- unit/contract/integration/E2E/accessibility/performance/security evidence proportionate to risk exists;
- Classic regression and R1 fallback are tested;
- skips/limitations are explicit;
- docs/diagnostics/support behavior are updated;
- no unresolved Critical/High finding remains, or Sean has explicitly accepted it;
- the packet receipt identifies exact versions and artifacts.

The program is not done when Cockpit looks complete. It is done when the supported journeys, compatibility matrix, and rollback contract work in packaged releases and the evidence supports making Cockpit the default.

## 14. Pre-execution audit gate

This section is the execution-authority source of truth. It overrides the strike schedule, “continue” language, implementation receipts, and general authorization to build quickly.

Before M0 implementation or acceptance, shared-state work, commits, packaging, enrollment, or runtime promotion:

1. Run goal-backward plan audit against `.ijfw/memory/brief.md`.
2. Run independent adversarial reviews from at least one OpenAI-family and one Google-family reviewer.
3. Reconcile consensus and contested findings with evidence.
4. Revise this plan and repeat, maximum three cycles.
5. Stop when no unresolved HIGH findings remain.
6. If the loop stalls or reaches three cycles, present each remaining HIGH to Sean. Do not cross its boundary unless he explicitly accepts that named risk in writing.

For the first-preview program, “HIGH findings” in this gate means findings in
M0–M9 or in a shared authority/serialization/recovery seam already exercised by
M0–M9. While any such HIGH remains, work is limited to plan-only corrections,
read-only audits, and the enumerated MCP-0, SBX-0, C0-A, and Constitution
v2/recovery non-promoting remediation lanes: worktree code, pure compatibility
helpers, truthful copy/removal, deterministic fixtures, and copied/disposable-
state tests. Constitution v2/recovery may implement and prove its named native/
helper, Desktop-consumer, revision-authority, replay, recovery, and hosted
composition contract only inside isolated worktrees and test state. None of
these lanes may accept M0A, persist production profile/user-data state, use real
credentials, enter packaging or release artifacts, enroll a user, promote
readiness/effective-policy state, or expand M2/M5/M7. Existing C0 code remains
`code-present/unverified` until the corrected receipt chain closes. A HIGH found
only in an explicitly excluded follow-on such as P1 blocks that follow-on and
must be corrected before its implementation; it does not freeze M0–M9 unless
the finding independently violates a first-preview invariant or the stable M0
inventory/quiescence/restore registration seam.

No plan audit may mark the product safe merely because unknown events do not crash, tests exist but are not release gates, or a rollback command has not been rehearsed against representative data.

### Current retention hardening receipt — Memory and Wiki

Memory entry removal is now a durable Archive operation with a visible in-app
restore journey. The exact original block is hash-bound and written before the
active source changes; the source file is retained; concurrent mutations are
serialized; path escape, tampering, ambiguity, and collisions fail closed; and
remote paired clients cannot mutate local memory. Wiki promotion undo removes
only a generated copy and retains its source memory. Focused proof passes 99
tests plus TypeScript and diff validation. This does not alter M0A/M0B, release,
cohort, producer, MCP, or rollback gates.

### Current retention hardening receipt — Scheduled tasks

Scheduled-task removal is now a durable Archive operation with a visible
in-app recovery journey. Desktop publishes and hash-validates the full schedule
definition plus byte-verifies its complete skill directory before removing the
live row; the original directory is moved into the archive rather than erased.
Archive/database failure keeps the schedule and restarts its timer, orphan
cleanup follows the same contract, restore fails closed on tampering or
collision, and restored schedules always return paused. Completed chats,
reports, workspaces, and provenance remain independently retained. Remote
paired clients cannot restore executable local schedule/skill state. Focused
proof passes 165 tests plus TypeScript and diff validation. This does not alter
M0A/M0B, release, cohort, producer, MCP, packaging, or rollback gates.
