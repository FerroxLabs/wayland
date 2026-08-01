# Wayland Desktop Adaptive Cockpit Build Plan

Status: superseded by `MASTER-BUILD-PLAN.md`; retained for design-history context only
Prepared: 2026-07-15
Desktop baseline: Wayland Desktop `0.11.18`
Core planning baseline: `frontier/m0` at committed `2b662fe`, workspace version `0.12.25`, with an active uncommitted refactor
Related design: `../sketches/003-complete-copilot/`

## Executive decision

Build this as an incremental refactor of the existing application, not a rewrite and not a permanent second product.

The target is one adaptive cockpit with three semantic layers:

1. Conversation expresses intent.
2. Workbench exposes execution and outcomes in context.
3. Command center preserves continuity, governance, and operational state.

Classic and Cockpit temporarily coexist as shells over the same routes, services, IPC, storage, conversations, Projects, agents, and Core process. Existing users can opt into Cockpit and return to Classic. New feature development lands in Cockpit. Classic remains a time-boxed compatibility shell receiving security, compatibility, and severe-bug fixes only.

This is a strangler migration: move one complete user journey at a time onto shared primitives, measure it, then retire the old presentation after parity and reliability gates pass.

## Confidence and scope

Confidence: high that the architecture and product can be built; medium-high on the estimate while Core's protocol and Desktop's broad feature surface are moving.

Why it is buildable:

- Desktop already has the hard services: conversations, Projects, workspace panels, previews, artifacts, agents, models, permissions, schedules, Teams, workflows, memory, cost capture, activity normalization, and Core process management.
- The existing WCore conversation already has a resizable observability panel and normalized nested activity. It is a foundation for the execution spine and workbench, not a throwaway.
- Projects already have the right product definition: a group of chats with shared knowledge and an optional filesystem workspace.
- Core's wire protocol is additive and capability-advertised, which supports gradual host adoption.

What this plan does not promise:

- A safe big-bang replacement in one release.
- A pixel-only reskin that leaves the information architecture fragmented.
- Full support for every uncommitted Core frontier event before the Core contract is pinned.
- Permanent feature development in two shells.

## Current-state conclusions

### Strong foundations to preserve

- Provider-agnostic agent and model selection.
- Wayland Core as the bundled always-available engine, without making it the only agent.
- Projects as organizational context, not an execution lock.
- Per-conversation workspace, preview, terminal, files, and changes.
- Heterogeneous Desktop Teams that can combine Core, Codex, Claude, Gemini, and other ACP agents.
- Durable Desktop workflow sessions with step/auto cadence and human gates.
- Desktop-owned scheduler and channel/gateway delivery.
- Detailed activity, cost, tool, permission, and sub-agent event infrastructure.
- Comprehensive settings and diagnostics.

### Structural problems the refactor must solve

1. The route map exposes the product's implementation taxonomy: Conversations, Projects, Assistants, Workflows, Scheduled Tasks, Teams, Memory, Wiki, and Mission Control compete as peers.
2. Power is available but scattered; users must learn where a capability lives before they can use it.
3. Conversation state is split across the chat, workspace sider, preview, observability panel, confirmation UI, and multiple library/control pages.
4. Core protocol support is manually mirrored in TypeScript and can drift. The `0.11.18` mirror does not yet enumerate live Core events such as `execution_policy`, `capability_activation`, `workflow_started`, `workflow_finished`, or `anvil_receipt`, and does not include newer capability fields.
5. Desktop workflows/Teams and Core workflows/sub-agents can appear to be duplicate product concepts unless ownership is made explicit.
6. Classic/new coexistence could become two products if presentation, state, and services are not separated rigorously.

## Target architecture

### 1. Shared domain and service layer

Both shells consume the existing authoritative layers:

- SQLite repositories and migrations
- `ConfigStorage` and main-process config
- conversation and Project services
- agent registry and task managers
- WCore process adapter
- ACP/Gemini/Codex adapters
- workspace trust and approval services
- scheduler, Teams, workflow sessions, memory, cost, and channels

No Cockpit-specific copies of these systems are allowed.

### 2. Presentation shell boundary

Introduce a typed device-local preference such as `ui.shell: 'classic' | 'cockpit'`. The root layout selects a shell, but both shells resolve the same canonical route destinations and domain objects.

The shell boundary owns:

- primary navigation composition
- home/new-chat composition
- conversation chrome
- workbench placement
- command-center grouping
- density and disclosure preferences

It does not own conversation data, Core state, Projects, Teams, workflows, jobs, memory, or permissions.

### 3. Unified execution view model

Add one main-process-to-renderer view model that translates backend-specific events into a stable Desktop vocabulary:

- actor: agent, model route, parent/child relationship
- scope: Project, workspace, trust posture
- lifecycle: queued, running, waiting, blocked, completed, failed, cancelled
- activity: thinking, tool, workflow node, sub-agent, browser/CUA, provider retry
- governance: mode, effective execution policy, approval, budget
- economics: turn/session tokens and cost, priced/unpriced
- outcome: artifact, change set, verification receipt

Raw protocol events remain available for diagnostics, but renderer components consume the normalized view model. This prevents every visual surface from reinterpreting Core independently.

### 4. Conversation frame

The shared conversation frame contains:

- compact identity bar: Project, agent, model route, execution scope, autonomy/policy
- conversation stream
- persistent composer
- execution spine: calm summary of running/waiting/finished work
- contextual workbench: workspace, changes, terminal, preview, artifact, team lanes, activity, receipt

The workbench reuses the current workspace/preview split machinery and observability primitives. It opens because the task created relevant state or because the user requested it; it is not another mandatory dashboard.

### 5. Command-center information architecture

Primary navigation:

- New chat
- Chats
- Projects
- Library
- Automations
- Activity
- Settings

Library groups reusable capabilities: Assistants, Desktop Workflows, Standing Teams, Skills, and Connections. Activity groups Mission Control, live jobs, approvals, failures, recent outcomes, cost, and receipts by human priority instead of implementation type.

## Workstreams and effort split

The estimate assumes one primary implementation lane with heavy AI assistance, continuous review by the product owner, and no long pause waiting for Core. It is effort, not a promise of elapsed time.

| Workstream                                             | Share | Primary output                                        |
| ------------------------------------------------------ | ----: | ----------------------------------------------------- |
| Shell, navigation, tokens, reusable layout             |   18% | Cockpit shell and responsive navigation               |
| Conversation frame, composer, execution spine          |   24% | The core daily-use experience                         |
| Core contract adapter and execution view model         |   18% | Typed capability/policy/activity/receipt bridge       |
| Contextual workbench and artifact surfaces             |   16% | Files, changes, terminal, preview, artifact, activity |
| Projects, Library, Automations, Activity consolidation |   14% | Coherent non-chat IA using existing services          |
| Migration, accessibility, performance, E2E, release    |   10% | Safe preview, telemetry, parity evidence, packaging   |

Desktop/Core effort boundary:

- Desktop/UI and shared Desktop view-model work: about 70%.
- Core protocol stabilization, fixtures, capability semantics, and cross-version proof: about 15%.
- End-to-end integration, packaging, beta evidence, and release migration: about 15%.

## Delivery phases

### Phase 0 — Contract freeze and scaffolding

Estimate: 1–1.5 weeks.

Deliverables:

- Confirm the design principles and experience contract as the product contract.
- Pin a Core integration baseline instead of coding against a dirty moving checkout.
- Add the shell preference and reversible route-level preview.
- Define normalized execution types and reducer boundaries.
- Add protocol fixtures generated or exported from `wcore-protocol`; stop relying only on a hand-maintained TypeScript union.
- Establish a Desktop/Core compatibility matrix covering bundled, previous, and current Core versions.
- Add empty Cockpit shell routes using shared services; no duplicate persistence.

Exit gate:

- Switching shells moves no data and does not restart/mutate a conversation.
- Unknown Core events remain safely tolerated.
- Every known safety- or trust-relevant event has an explicit test expectation.

### Phase 1 — Familiar first-run, home, navigation, and Projects

Estimate: 1.5–2 weeks.

Deliverables:

- New-chat-first home with recent chats and pinned Projects.
- Cockpit primary navigation and Library grouping.
- Existing Projects list/workspace restyled and recomposed, not remodeled.
- Project context flows visibly into new chats.
- Keyboard-first command palette and navigation.
- Responsive/collapsed navigation behavior.

Exit gate:

- A new user can reach first useful response without understanding Core, Flux, workflows, Teams, or workspaces.
- An existing user can find every former top-level destination in at most two deliberate steps.

### Phase 2 — Conversation cockpit and execution spine

Estimate: 2–3 weeks.

Deliverables:

- Shared conversation frame across WCore and other supported agents.
- Compact, always-legible agent/model/scope/policy bar.
- Execution spine built from normalized activity rather than message-card heuristics.
- Unified approval/waiting/error/resume presentation.
- Context, token, and cost status with priced/unpriced honesty.
- Power-user state persistence: expanded controls, pinned actions, keyboard shortcuts.

Exit gate:

- Existing conversation send, resume, stop, approval, model switch, mode switch, workspace, preview, and pop-out journeys remain green.
- No agent backend loses a capability because it lacks a Core-specific event.

### Phase 3 — Contextual workbench and outcomes

Estimate: 2–3 weeks.

Deliverables:

- Consolidate workspace, preview, observability, and artifact panels into one tabbed/contextual workbench host.
- Files, diffs, terminal, preview, artifacts, team lanes, activity, and receipts use shared panel contracts.
- Core workflow/sub-agent events render as runtime execution lanes.
- `anvil_receipt` renders only from the trusted top-level protocol event and records staleness/digest status.
- Consequential actions expose clear permission and scope changes before execution.

Exit gate:

- A writing, coding, research, and automation journey can each complete without navigating away to hunt for a required execution surface.
- Receipt-like nested sub-agent/plugin payloads cannot produce a verified badge.

### Phase 4 — Command center consolidation

Estimate: 2–2.5 weeks.

Deliverables:

- Library groups Assistants, Desktop Workflows, Standing Teams, Skills, and Connections.
- Automations combines scheduled-task creation and management around the existing scheduler.
- Activity replaces the current fragmented operational mental model with Needs you, Running, Upcoming, and Recent.
- Mission Control remains an underlying capability/view, not an additional competing destination.
- Deep links and legacy routes continue to resolve.

Exit gate:

- Every capability has both an invocation path from the relevant chat/Project and a durable management path.
- No existing library, Team, workflow, schedule, memory, or diagnostic data is migrated into a new store.

### Phase 5 — Hardening and production preview

Estimate: 1.5–2 weeks engineering plus 2–4 weeks overlapping beta soak.

Deliverables:

- Accessibility pass: keyboard, focus, screen reader, contrast, reduced motion, zoom.
- Performance budgets and profiling on long conversations and high-volume activity.
- Full localization of new strings.
- Screenshot/visual regression coverage for major states and responsive widths.
- macOS, Windows, and Linux packaging/smoke evidence.
- In-product return-to-Classic reason capture that is explicit and privacy-respecting.
- Recovery, export, and rollback documentation.

Exit gate:

- Cockpit meets or beats Classic on crash-free sessions, task completion, approval comprehension, latency, accessibility, and support burden.
- All P0/P1 parity items are proven.
- Classic retirement remains a separate release decision; it is not automatic at the end of this phase.

## Superseded calendar estimate

The estimates below predate Sean's fifteen-day strike directive and are not execution authority. See `MASTER-BUILD-PLAN.md` §8.

For one solo developer directing AI implementation and review:

- Credible internal alpha: 4–6 weeks.
- Production preview with the central daily journeys: 8–10 weeks.
- Broad parity and a credible Classic-retirement candidate: 12–16 weeks.
- Beta soak: 2–4 weeks overlapping the later phases, potentially longer if adoption evidence is weak.

With two genuinely independent implementation lanes, the preview may compress to roughly 6–8 weeks, but the contract/view-model and shell integration remain serial bottlenecks. Adding more parallel UI builders before those boundaries stabilize will increase rework.

## Implementation process

### Slice shape

Every slice follows the same loop:

1. Confirm the user journey and acceptance criteria against the experience contract.
2. Identify existing services/components to reuse.
3. Extend the normalized domain/view model first when new state is needed.
4. Build the smallest end-to-end Cockpit slice behind the shell flag.
5. Add unit, component, protocol-contract, E2E, accessibility, and visual assertions proportionate to risk.
6. Test against the pinned bundled Core plus a previous compatible Core and the frontier candidate.
7. Demo the actual journey, collect confusion/friction, and adjust before expanding the slice.

### Branch and coordination rules

- Desktop changes stay in the Desktop lane and Desktop worktree.
- Core changes are requested through a Core-owned GitHub issue/handoff, never patched opportunistically in the active dirty Core checkout.
- Each cross-repo issue names: producer, consumer, wire shape, capability flag, minimum version, fixtures, failure behavior, and release dependency.
- Core protocol changes are additive; Desktop never infers capability construction from a config flag when Core can emit typed evidence.
- A Core event is not considered integrated until the Desktop protocol fixture, normalizer, renderer state, fallback behavior, and version-matrix test all exist.

### Review gates

- Product: does the journey match the mental model and preserve power?
- Usability: can a new user start, and can an expert reach controls without detours?
- Architecture: is there one authoritative state path?
- Contract: are Core version/unknown-event/failure semantics proven?
- Safety: are scope, approval, cost, and verification claims honest?
- Quality: typecheck, lint, unit, contract, integration, E2E, visual, accessibility, and packaging evidence.

## Classic migration policy

The preview toggle is a good idea only under these constraints:

- It selects presentation, not services or storage.
- Existing users start in Classic until they deliberately preview Cockpit; new users may default to Cockpit after onboarding is proven.
- Switching is immediate and reversible.
- Return-to-Classic feedback is captured by journey/reason, not used as dark-pattern friction.
- New features target Cockpit. Classic receives compatibility, security, and severe-bug fixes.
- Parity is maintained in a visible matrix with P0, P1, and intentionally changed behavior.
- Classic has an announced sunset criterion and review date so the toggle cannot become permanent architecture.

## Go/no-go gates before implementation begins

Go when:

- Product principles and the ownership matrix are approved.
- The first three vertical slices and their acceptance criteria are frozen.
- A Core protocol commit/release candidate is pinned for the first integration wave.
- The shell flag and shared-state rule are accepted.
- Classic parity categories and telemetry/privacy boundaries are agreed.

Do not start a broad UI rewrite if:

- Core workflow/sub-agent semantics are still being treated as replacements for Desktop Teams/workflows.
- Cockpit requires a parallel conversation or Project store.
- the work is split by screen without first establishing the shared conversation frame and execution view model.
- release pressure would force Classic removal before evidence exists.

## Recommended first build packet

The first implementation packet should be deliberately narrow:

1. Typed `ui.shell` preference and root shell selector.
2. Cockpit navigation skeleton using existing canonical routes.
3. Cockpit new-chat/home composition using existing Guid selection hooks.
4. Shared execution view-model types plus protocol fixtures for `ready`, `execution_policy`, `stream_*`, tool lifecycle, approval, cost, sub-agent/workflow lifecycle, and receipt.
5. One real WCore chat inside the Cockpit conversation frame with identity bar, composer, and read-only execution spine.
6. E2E proof that the same conversation opens and continues correctly in both shells.

That packet validates the migration architecture before substantial visual surface area is committed.
