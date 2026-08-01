# Desktop, Core, Flux, and Cloud system contracts

## Target architecture

| System          | Product responsibility                                                                                                                                                    | Must not own                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Wayland Core    | Act as Wayland's native first-party agent: reason, plan, invoke capabilities, enforce its execution policy, and emit evidence/receipts through the shared agent contract. | Orchestration of every external CLI, Desktop navigation, provider catalogue UX, hosted tenancy.                |
| Flux Router     | Select models/routes, enforce budget and routing policy, expose attempts/fallbacks/cost/latency.                                                                          | Task identity, workspace ownership, generic UI state.                                                          |
| Wayland Desktop | Universal cockpit and orchestration layer over Core, external agent CLIs, providers, tools, hosts, workspaces, artifacts, approvals, and local OS integrations.           | Treating every agent as if it runs inside Core, a private fork of the Core protocol, or a separate task truth. |
| Wayland Cloud   | Durable remote hosts, cross-device continuity, managed identity/secrets/connectors, observability, backups.                                                               | A hand-maintained subset of Desktop capability semantics.                                                      |
| Ecosystem       | Portable assistants, workflows, skills, extensions, connector definitions, templates.                                                                                     | Undeclared access or bypass of the common trust model.                                                         |

## Shared product primitives

1. **Derived execution view** — the current preview's non-canonical projection of intent, actor, state, host, budget, policy, and timestamps from existing conversations and runtime evidence. It has no independent durable identity or store.
2. **Project context** — the durable product container for related chats, sources, instructions, memory, outputs, history, connections, and collaborators.
3. **Execution scope** — optional filesystem roots, host, sandbox, working directory, and isolation boundary. “Workspace” may remain a compatibility label only for this execution scope; it never replaces Project.
4. **Execution host** — Desktop, remote self-host, managed Cloud, channel-triggered, or delegated agent.
5. **Capability** — versioned tool/skill/connector/agent function with declared permissions and availability.
6. **Trust policy** — what may be read, written, executed, transmitted, purchased, or published and who approves it.
7. **Artifact** — durable user output with provenance, version, preview, export, and share semantics.
8. **Connector** — identity, scopes, credentials, rate limits, and revocation independent of the vendor implementation.
9. **Receipt** — append-only evidence of routing, policy, attempts, actions, approvals, costs, artifacts, and result.

Project context, capabilities, artifacts, connectors, and receipts require stable IDs wherever their authority supports portability. The derived execution view is rebuilt from authoritative state and may not claim cross-host identity. A future **durable task identity** for remote continuation is a separately gated persistence contract; only after that milestone may a task ID be promised across local, remote, Web UI, channels, and restarts.

## Core protocol finding

Desktop currently maintains a manual TypeScript event union for its first-party Core agent integration and falls through unknown events with a warning. The Core refactor's Rust protocol includes events not represented in the released Desktop contract, including execution-policy, capability-activation, workflow lifecycle, provider attempt/retry/failure, compact-offload, and Anvil receipt events.

Dropping an unknown cosmetic event is acceptable. Dropping policy, failure, cost, approval, or receipt evidence is not. It can make the UI falsely calm while the engine is making consequential decisions.

### Required Core contract

- Core owns the versioned normative schema, manifest, generator identity, and
  golden fixture corpus.
- Desktop types are generated from that schema where the producer publishes a
  type generator. Otherwise Desktop owns an exact runtime validator derived
  from the pinned schema plus an exhaustive schema-to-validator coverage map;
  TypeScript types are inferred/generated from that validator. A manual union
  may never remain an independent authority, and schema/validator/type drift
  fails CI.
- Every event declares severity, persistence, display requirement, acknowledgement requirement, and forward-compatibility behavior.
- Handshake includes protocol version, engine version, capability set, required features, and deprecations.
- Golden transcript fixtures are produced by Core and replayed in Desktop tests.
- Unknown critical events cause an explicit compatibility state, not silent degradation.
- The compatibility matrix is tested for bundled Core, user-updated Core, and one forward version.

## Flux contract finding

Flux is currently both a provider-like model entry and a system routing option. That is useful but undersells its role. The Task Receipt should make Flux decisions inspectable:

- requested outcome and routing class;
- candidate routes and policy constraints;
- selected model/provider/agent;
- attempt, retry, and fallback chain;
- latency, token usage, estimated and final cost;
- quality or verification signals;
- user override and replay controls.

Desktop should show simple outcomes by default and reveal this routing trace on demand. Cloud should use the identical receipt schema.

## Cloud parity finding

Desktop and standalone Cloud register bridge capabilities separately. The standalone initializer omits many production surfaces, including concierge, kickoff, constitution, IJFW, major memory flows, wiki, workspace trust, terminal, Flux connector management, mission control, remote agents, snapshots, migration/import, and multiple Core configuration/update paths.

Some omissions are correctly host-specific. The problem is that this is implicit. Each capability needs one classification:

- **portable** — same semantics everywhere;
- **adapted** — same user outcome through a host adapter;
- **desktop-only** — requires local OS trust/interaction;
- **cloud-only** — requires managed remote infrastructure;
- **unsupported** — explicit, explained, and hidden from incompatible surfaces.

Generate bridge registration, navigation availability, docs, and parity tests from that manifest.

## Trust boundary

All execution surfaces need one permission vocabulary. A task moving from Desktop to Cloud or from chat to schedule must not silently gain authority. At minimum, policies cover filesystem roots, shell/process execution, network domains, connector scopes, secrets, messaging/publishing, purchases, destructive changes, and human approval. Receipts must show which policy allowed each consequential action.
