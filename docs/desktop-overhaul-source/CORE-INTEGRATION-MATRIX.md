# Wayland Desktop / Wayland Core Ownership and Integration Matrix

Status: active source of truth; Core v1 exact producer commit published and accepted  
Prepared: 2026-07-15

## Boundary rule

Wayland Core is the bundled primary agent runtime. Wayland Desktop is the provider-agnostic product host that organizes people’s work and can also run other agents and CLIs.

Desktop should make Core's intelligence, execution, and evidence legible. It should not duplicate Core's runtime state. Core should not absorb Desktop's product organization, heterogeneous orchestration, scheduling UI, or distribution surfaces.

## Product concepts

| Concept | Product meaning | Authority | UI treatment |
|---|---|---|---|
| Chat | Durable conversation and control surface | Desktop | Primary daily surface; can be backed by Core or another agent |
| Project | Named group of related chats with shared instructions, knowledge, files, and memory controls | Desktop | Familiar Claude-like organizational object |
| Workspace | Optional filesystem execution scope attached to a chat/Project | Desktop chooses and governs; agent consumes | Visible scope/trust chip and workbench, never a competing project type |
| Agent | Runtime that performs a turn | Registry/adapter in Desktop; behavior inside selected agent | Always visible and switchable when supported |
| Model route | Provider/model selection, including Flux Auto | Desktop selection + Flux/Core routing semantics | Auto by default; pin/inspect for experts |
| Assistant | Reusable persona/instructions/resource preset | Desktop | Library object invokable into a chat |
| Desktop Workflow | Durable authored step experience with cadence, asks, pause/resume, and cross-agent use | Desktop | Library/Automation capability; may invoke any backend |
| Core Workflow | Runtime execution graph inside one Core task/run | Core | Execution lanes in the conversation/workbench, not a second top-level workflow library by default |
| Standing Team | Durable heterogeneous roster that may combine Core, Codex, Claude, Gemini, or ACP agents | Desktop | Library object and reusable execution capability |
| Core sub-agent/swarm | Ephemeral or run-scoped delegation inside Core | Core | Nested execution lane/activity under the parent Core turn |
| Automation | Run a chat/workflow later or repeatedly | Desktop scheduler invokes selected backend | Automations destination; Core is an executor, not the scheduling authority |
| Memory | Agent long-term recall and learned user model | Core for Core cognition; Desktop for user-facing governance and Project/chat metadata | One user-facing memory control surface with source/provenance, not duplicated stores presented as peers |
| Artifact | Durable human-usable output | Desktop indexes/presents; producing agent writes | Opens in contextual workbench and remains linked to chat/Project |
| Receipt | Honest verification verdict bound to an artifact/run | Core emits typed receipt; Desktop validates/renders/persists reference | Trusted badge only from the top-level `anvil_receipt` event |
| Channels | Product distribution and inbound/outbound gateways | Desktop for hosted app surfaces | Settings/connections/automation; host-delegated Core sends use Desktop transport |

## Core protocol adoption map

The live Core frontier contract is ahead of the Desktop `0.11.18` TypeScript mirror. Adoption must be capability-aware and fixture-tested.

| Core signal | Desktop meaning | Required host behavior | Cockpit surface |
|---|---|---|---|
| `ready.capabilities` | What this Core session may emit/support | Store per session; tolerate new fields | Agent detail and feature availability |
| `execution_policy` | Effective sandbox, approval, and budget posture | Treat as canonical; do not infer from mode text | Identity/policy bar and permission inspector |
| `capability_activation` | Evidence that selected capabilities are actually constructed/reached | Normalize for diagnostics and activity; unavailable reason is user-actionable | Activity/Doctor; concise warnings only when relevant |
| stream/tool lifecycle | Current turn and tool state | Preserve ordering/correlation; bound output | Conversation plus execution spine/workbench |
| `trace_event` | Structured execution trace | Validate/bound opaque payload; derive stable view model | Activity inspector and diagnostics |
| `session_cost` + usage | Settled cost/tokens | Distinguish session vs run delta and priced vs unpriced | Compact cost status and receipt detail |
| `sub_agent_event` | Nested Core actor activity | Recursively normalize but preserve parent/correlation | Runtime team lanes under the parent turn |
| `workflow_started` / `workflow_finished` | Core runtime graph lifecycle | Correlate by `workflow_id`; do not create Desktop workflow records implicitly | Execution spine/workbench workflow lane |
| `tool_chunk` | Live long-running tool output | Stream with memory/render bounds; final result remains authoritative | Terminal/tool inspector |
| provider attempt/retry/failure/circuit | Resilience and fallback state | Normalize without alarming on successful recovery | Execution spine; detailed activity on expand |
| approval/suspend/resume | Human gate and suspended run state | Correlate idempotently; never lose a waiting action | Needs-you activity plus inline decision card |
| `budget_exceeded` | Bounded autonomy stopped honestly | Explain observed limit and recovery choices | Execution spine/error recovery |
| browser/CUA policy denied | Safety boundary prevented action | Never collapse into generic failure only | Inline policy explanation and Activity |
| compact/offload | Context management action | Preserve active-window information when present | Context inspector, not chat noise |
| `anvil_receipt` | Trusted verification outcome | Accept trust badge only from this top-level event; verify ordering/staleness/digests | Outcome/receipt chip and artifact inspector |
| plugin/evolution events | Optional engine/plugin diagnostics | Capability gate, bound payload, avoid default noise | Activity/Doctor or specialized extension surface |

## Exact Desktop v1 validation candidate

Desktop has vendored and replayed the producer corpus from exact local Core commit `d0aa0abc75afe056cc5434fcd652efa6d474ab0c` for validation only:

- contract `wayland-desktop-core` `1.0`;
- generator `wcore-desktop-contract-gen/1`;
- 11 commands, 39 events, and 110 fixtures;
- fixture digest `sha256:2c611ffad0096289fc6a68e93921233821b9d75028b21b9a85c67b293eadac2b`;
- schema digest `sha256:37c51099256e62226306fa02f7a8637cc6a9a102df8e7c41c6e73253f7638271`; and
- source-input digest `sha256:c3fb582801bbf7ab75a9fefe45e79e5cafb28013bc900a6515cfd7462650863e`.

The actual production stdout path now performs bounded fatal-UTF-8 JSONL framing, descriptor and digest negotiation, pinned schema validation, and semantic replay before renderer dispatch. The consumer fails closed on malformed frames, unsupported required extensions, critical/unknown-criticality events, descriptor mismatch, ordering gaps, conflicting duplicates, and conflicting terminals. Unknown explicitly noncritical events are counted/dropped.

The three producer-deferred Desktop proofs are implemented:

- `ordinary_turn_tool_replay_reducer`;
- `anvil_desktop_replay_reducer`; and
- `anvil_persistent_mutation_watcher`.

Anvil trust remains `publication_bound`. Unsupported recursive watching, watcher failure, later workspace mutation, disconnect, or reconnect removes live trust and requires fresh Core validation. Desktop emits a host-derived `anvil_trust_changed` display status; it never forges a Core `anvil_receipt_invalidated` event.

The producer commit is published and immutable on `FerroxLabs/wayland-core` / `origin/feat/887`, so the source-contract publication gate is closed. This is still not an automatic packaged-binary switch: production packaging and default engine preparation remain on released Core `v0.12.25` until a separately authorized binary/release uptake passes the compatibility matrix.

## Remaining gaps after the v1 consumer packet

The Desktop mirror already handles many advanced Core events, including traces, cost, nested sub-agents, streamed tool chunks, provider circuit state, approvals, budgets, browser/CUA events, plugins, evolution events, and host-delegated messaging. It is not a blank integration.

The v1 packet now enumerates and reduces `execution_policy`, Core workflow lifecycle, extended sub-agent correlation, and publication-bound Anvil receipts. Remaining frontier or product-integration work includes:

- `capability_activation`
- provider attempt/retry/failure variants
- `compact_offload`
- newer capability fields including user-model and memory signals
- newer fields on existing variants, including run-scoped usage/correlation and typed approval plan data
- renderer view models and durable Cockpit presentation for accepted policy, workflow, Anvil receipt, and `anvil_trust_changed` events
- an immutable published Core producer baseline and bundled/previous/candidate release matrix

Unknown-event tolerance prevents a crash, but silent dropping is not adequate for safety, policy, workflow, or receipt UX. These become the first Core integration packet after a baseline is pinned.

## Contract engineering rules

1. Core Rust types are the producer source of truth.
2. Desktop uses generated/exported JSON fixtures or schema-derived types where practical; a manual union alone is insufficient.
3. Every known variant has a decoder/normalizer test and an explicit rendering/fallback decision.
4. Unknown explicitly noncritical variants are dropped safely; unknown criticality, required extensions, or critical variants fail closed.
5. Safety-critical known events are not silently discarded.
6. Capability flags advertise possible emission; they are not proof that a runtime path succeeded. Use activation/runtime events for that.
7. Desktop supports a version matrix: bundled Core, previous supported Core, and next candidate Core.
8. New fields/variants are additive. Desktop does not require a frontier event unless the bundled minimum Core version provides it or a fallback exists.
9. Nested opaque payloads are bounded, sanitized for display, and never promoted across trust boundaries.
10. Contract drift fails CI before packaging.

## Cross-repo change packet template

Every requested Core change should carry:

- product journey and why Desktop needs it
- producer owner and consumer owner
- event/command JSON example
- capability flag and minimum Core version
- ordering, correlation, idempotency, and terminal-state semantics
- unknown/older-host behavior
- security/trust boundary
- producer fixture/golden test
- Desktop decoder, normalizer, renderer, and fallback tests
- bundle/release dependency

## Immediate coordination requests for the Core lane

These are requests, not Desktop-side edits to the active Core checkout:

1. Pin the next integration baseline after the current frontier changes settle.
2. Export a canonical fixture corpus for every `ProtocolEvent` and command used by Desktop.
3. Publish the serialized shape of `EffectiveExecutionPolicy` and its change semantics.
4. Confirm workflow lifecycle ordering and whether node-level identity remains exclusively inside sub-agent events.
5. Confirm `anvil_receipt` staleness verification responsibilities between producer and host.
6. Keep Desktop scheduling authority explicit despite Core's internal cron/runtime code.
7. Preserve host-delegated channel sending so Desktop remains the distribution authority.
8. Add Desktop compatibility to the release gate for protocol-touching Core changes.

## Semantic collision rules

### Teams

- A Desktop Team is durable, user-authored, and heterogeneous.
- Core sub-agents are runtime children of a Core turn.
- A Desktop Team may contain Core agents; a Core agent may create internal children.
- Internal children do not silently become durable Desktop teammates.
- The UI can visually unify both as lanes while retaining provenance and lifecycle.

### Workflows

- A Desktop Workflow is a reusable product recipe that may span agents and human steps.
- A Core Workflow is a runtime execution graph inside Core.
- Launching a Desktop Workflow against Core may produce a Core Workflow run, but the identifiers and state machines remain separate and correlated.
- Core runtime events never implicitly create or mutate a Desktop workflow definition.

### Memory

- Project instructions, attached knowledge, chat history, and user-managed metadata remain Desktop concepts.
- Core's cognitive memory/user model remains Core-owned.
- Desktop provides the user one governance surface showing what source stores exist, what is remembered, and how to inspect/delete/export them.
- Desktop must not copy Core memory into a second pseudo-memory database merely for UI convenience.

### Permissions and autonomy

- The user selects intent/posture in Desktop.
- Core emits the effective policy actually in force.
- The UI shows effective policy, not merely the requested mode.
- Workspace trust remains a Desktop host policy and must compose conservatively with Core's sandbox/approval policy.

## Release compatibility matrix

For each Desktop release, record:

| Desktop | Bundled Core | Oldest supported override | Candidate Core | Contract suite | E2E journeys |
|---|---|---|---|---|---|
| `0.11.18` baseline | `0.12.25` | To be established | published `d0aa0ab` producer contract | 110/110 fixtures replayed; source contract accepted, packaged binary unchanged | Existing WCore live-chat/sub-agent coverage plus v1 raw-wire boundary |
| Cockpit alpha | Pin in Phase 0 | Pin in Phase 0 | Pin in Phase 0 | Required full fixture corpus | Shell switch + WCore send/stop/approve/workbench |

No Cockpit release is green solely because an unknown event was dropped without crashing. Known policy, safety, workflow, cost, and receipt signals require semantic proof.
