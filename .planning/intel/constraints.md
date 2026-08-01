# Synthesized Constraints

## Incremental strangler migration

- source: docs/desktop-overhaul-source/BUILD-PLAN.md
- type: nfr
- content: DATA_6f2c9a18_START Build the Adaptive Cockpit as an incremental refactor, not a rewrite or permanent second product. Classic and Cockpit temporarily coexist over the same routes, services, IPC, storage, conversations, Projects, agents, and Core process, and migration proceeds one complete journey at a time behind evidence gates. This superseded plan is retained for design-history context; its calendar is not execution authority. DATA_6f2c9a18_END

## Shared domain and service layer

- source: docs/desktop-overhaul-source/BUILD-PLAN.md
- type: nfr
- content: DATA_b4307de1_START Both shells consume the existing authoritative repositories, configuration, conversation/Project services, agent/task managers, adapters, trust/approval services, scheduler, Teams, workflows, memory, cost, and channels. Cockpit-specific copies are not allowed. DATA_b4307de1_END

## Presentation shell boundary

- source: docs/desktop-overhaul-source/BUILD-PLAN.md
- type: protocol
- content: DATA_1d7fa83c_START A typed device-local `ui.shell` preference selects Classic or Cockpit while both resolve the same canonical routes and domain objects. The shell owns presentation composition only; it does not own conversation data, Core state, Projects, Teams, workflows, jobs, memory, or permissions. DATA_1d7fa83c_END

## Unified execution view model

- source: docs/desktop-overhaul-source/BUILD-PLAN.md
- type: protocol
- content: DATA_e2c658a4_START One main-process-to-renderer view model normalizes backend-specific actor, scope, lifecycle, activity, governance, economics, and outcome events. Renderer components consume this model while raw protocol events remain diagnostic data. DATA_e2c658a4_END

## Classic migration policy

- source: docs/desktop-overhaul-source/BUILD-PLAN.md
- type: nfr
- content: DATA_90ac3f57_START The preview toggle selects presentation rather than services or storage, is immediate and reversible, preserves routes and state, records return reasons without dark-pattern friction, limits Classic to compatibility/security/severe-bug fixes, and cannot become permanent architecture without sunset criteria and review. DATA_90ac3f57_END

## Cockpit implementation go-no-go gate

- source: docs/desktop-overhaul-source/BUILD-PLAN.md
- type: nfr
- content: DATA_3e14b9c0_START Broad UI implementation begins only after product/ownership principles, initial vertical acceptance, a pinned Core baseline, shared-state shell rules, parity categories, and telemetry/privacy boundaries are accepted. Do not proceed if Cockpit requires parallel stores, conflates Core and Desktop semantics, splits by screen before shared models, or forces premature Classic removal. DATA_3e14b9c0_END

## Core and Desktop ownership boundary

- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/CORE-INTEGRATION-MATRIX.md
- type: protocol
- content: DATA_72e80d4a_START Core owns first-party agent reasoning, execution policy, and runtime evidence; Desktop owns product organization, heterogeneous orchestration, scheduling, host policy, and distribution. Desktop makes Core legible without duplicating Core runtime state, and Core does not absorb Desktop product organization. DATA_72e80d4a_END

## Core normative schema authority

- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/CORE-INTEGRATION-MATRIX.md
- type: schema
- content: DATA_c8f31652_START Core Rust types are the producer source of truth. Desktop uses generated fixtures/schema-derived types where practical; every known variant has decoder/normalizer tests and explicit rendering/fallback behavior; contract drift fails CI before packaging. DATA_c8f31652_END

## Critical event compatibility behavior

- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/CORE-INTEGRATION-MATRIX.md
- type: protocol
- content: DATA_2a5d90e7_START Unknown explicitly noncritical variants may be dropped safely, but unknown criticality, required extensions, critical variants, malformed frames, descriptor mismatch, ordering gaps, conflicting duplicates, and conflicting terminals fail closed. Safety-critical known events are never silently discarded. DATA_2a5d90e7_END

## Core and Desktop semantic collision rules

- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/CORE-INTEGRATION-MATRIX.md
- type: protocol
- content: DATA_f0714c29_START Desktop Teams/workflows/memory/project policy remain distinct from Core sub-agents/workflows/cognitive memory/effective runtime policy. Correlation may unify presentation, but runtime events never implicitly mint durable Desktop objects or widen host authority. DATA_f0714c29_END

## Core release compatibility matrix

- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/CORE-INTEGRATION-MATRIX.md
- type: protocol
- content: DATA_8c2e41b6_START Every Desktop release records bundled Core, oldest supported override, candidate Core, contract-suite status, and E2E journeys. Additive events cannot be required unless the bundled minimum supplies them or a fallback exists. DATA_8c2e41b6_END

## Core receipt and capability evidence gate

- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/CORE-INTEGRATION-MATRIX.md
- type: nfr
- content: DATA_d5a7903e_START Capability flags advertise possible emission rather than runtime success. Activation/runtime events prove availability, and verified Anvil treatment derives only from the top-level `anvil_receipt` event with ordering, staleness, digest, and publication-bound trust checks. DATA_d5a7903e_END

## Wave 0 authorization boundary

- source: docs/desktop-overhaul-source/wave-0/EXECUTION.md
- type: protocol
- content: DATA_41e6bc83_START Wave 0 is limited to recovery, compatibility, contract, fixture, proof infrastructure, named C0 corrections, and the bounded M1M/MCP-0 exception. It does not authorize persistent MCP lifecycle storage, automatic session restart, readiness promotion, invented receipts, packaged/cohort claims, or M2/M5/M7 expansion before dependencies pass. DATA_41e6bc83_END

## Wave 0 global stop conditions

- source: docs/desktop-overhaul-source/wave-0/EXECUTION.md
- type: nfr
- content: DATA_a93c1d6e_START Data corruption, approval widening, cross-Project leakage, forged verification, or failed recovery stops all cohort promotion. A producer-contract miss disables only its dependent capability when a named degraded profile exists and never produces inferred evidence. DATA_a93c1d6e_END

## Receipt evidence rule

- source: docs/desktop-overhaul-source/wave-0/EXECUTION.md
- type: nfr
- content: DATA_5f82e4a9_START Receipts are generated only from exact commands and artifacts. An absent or skipped proof remains absent and is never represented as passed; local or partial evidence cannot promote release, cohort, or capability claims. DATA_5f82e4a9_END

## Real-user enrollment gate

- source: docs/desktop-overhaul-source/wave-0/EXECUTION.md
- type: nfr
- content: DATA_ec3075b2_START Real-user enrollment remains blocked until M0A, M0B, M1/M1F capability gates, MCP truth gates, and release evidence pass. Existing Cockpit shell/navigation code remains an isolated prototype rather than accepted product work. DATA_ec3075b2_END

## Universal work kernel

- source: docs/desktop-overhaul-source/MASTER-BUILD-PLAN.md
- type: protocol
- content: DATA_4c71e2a9_START One internal universal work kernel owns identity, actor, scope, lifecycle, authority, capabilities, economics, outcomes, evidence, interruption, and recovery across chat turns, scheduled work, Team runs, Core workflows, and receipts. Cowork, development, automation, and consequential actions are contextual projections rather than separate engines, stores, or required modes. DATA_4c71e2a9_END

## Non-negotiable product invariants

- source: docs/desktop-overhaul-source/MASTER-BUILD-PLAN.md
- type: nfr
- content: DATA_b93f05d8_START Release is blocked by violations of the plan's 21 invariants, including novice startability, expert inspectability, Project/workspace separation, single authoritative stores, reversible shell switching, honest policy/cost/receipt state, provider neutrality, non-widening authority, trusted receipt origin, evidence-backed capability claims, Cloud composition compatibility, connector session truth, explicit metered fallback consent, and schema-confirmed Core settings. DATA_b93f05d8_END

## Requested and effective authority separation

- source: docs/desktop-overhaul-source/MASTER-BUILD-PLAN.md
- type: protocol
- content: DATA_18e6c4f2_START Desktop computes a conservative requested ceiling from user, workspace, host, channel, and scheduler constraints. The producer reports its policy and the adapter declares `enforced`, `brokered`, or `advisory`; only a correlated producer receipt may be rendered as effective or enforced. DATA_18e6c4f2_END

## Backend-neutral execution schema

- source: docs/desktop-overhaul-source/MASTER-BUILD-PLAN.md
- type: schema
- content: DATA_d4a20b67_START Each backend adapter translates once into a derived model covering identity and correlation, actor, Project/workspace/host/trust scope, lifecycle, activity, backend-reported plan, requested and producer-reported governance, economics, outcomes, validation, verification, and dependency staleness. Renderer surfaces do not independently reinterpret raw backend events. DATA_d4a20b67_END

## Application-consistent rollback and recovery

- source: docs/desktop-overhaul-source/MASTER-BUILD-PLAN.md
- type: nfr
- content: DATA_709ebc35_START Rollback is not a direct binary reinstall. Before cohort use, representative state must upgrade, exercise all declared stores, switch shells, preserve post-baseline work, restore or transform a copy, boot the signed rollback target, re-upgrade, and validate across six release targets. Bundles are application-consistent under a global quiescence barrier and one mutation epoch; any non-acknowledging writer aborts the bundle. DATA_709ebc35_END

## Packet dependency and ownership gates

- source: docs/desktop-overhaul-source/MASTER-BUILD-PLAN.md
- type: nfr
- content: DATA_5ca984e1_START No packet begins before its dependencies and entry gates pass. Each packet receipt cites its owned invariants, success criteria, mandatory cross-cutting proof, exact tests, and evidence; appearing only in program prose does not count as coverage. DATA_5ca984e1_END

## Verification and evidence receipt contract

- source: docs/desktop-overhaul-source/MASTER-BUILD-PLAN.md
- type: nfr
- content: DATA_31f76ad0_START Verification spans unit, component, producer-consumer replay, real IPC integration, deterministic Electron E2E, separate credentialed canaries, packaged installer smoke, recovery drills, adversarial security, usability, and property/state-machine tests. Every receipt binds immutable candidate identity, exact commands, fixtures, platforms, failures/skips, rollback result, and artifact checksums; unit tests alone never become packaged journey proof. DATA_31f76ad0_END

## Definition of done and pre-execution audit gate

- source: docs/desktop-overhaul-source/MASTER-BUILD-PLAN.md
- type: nfr
- content: DATA_e6218b4c_START A packet is done only with requirement traceability, declared authority, proportionate multi-layer evidence, Classic regression and fallback proof, explicit limitations, updated support surfaces, no unaccepted Critical/High findings, and an exact-version receipt. Before implementation or promotion, goal-backward and independent adversarial review repeat until no in-scope HIGH remains or Sean explicitly accepts the named risk. DATA_e6218b4c_END
