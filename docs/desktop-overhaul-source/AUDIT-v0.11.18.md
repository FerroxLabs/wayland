# Wayland Desktop v0.11.18 deep audit

## Verdict

Wayland is not short of product. It is short of compression, contracts, and proof.

The release contains an unusually broad local AI operating environment: provider-neutral models, 18 detected agent backends in the audited environment, Wayland Core, Flux Router, assistants, workflows, teams, projects, memory, wiki, scheduled work, mission control, channels, extensions, a 107-entry MCP library, a standalone Web UI, and signed packages for six OS/architecture combinations. That breadth is a genuine advantage over provider-owned clients.

The experience does not yet turn that advantage into a simple promise. The interface exposes implementation nouns—models, agents, assistants, teams, workflows, skills, commands, Core, channels, MCPs—before it has established the user's outcome, workspace, trust boundary, execution host, or expected artifact. The result feels more like several powerful products sharing a sidebar than one system that can help with anything.

The recommended direction is:

> One task, one workspace, one trust model—any model, engine, tool, or surface.

Wayland Desktop should be the trusted universal cockpit: the simplification and orchestration layer over Wayland Core, external agent CLIs, providers, tools, and execution hosts. Wayland Core should be Wayland's native, deeply integrated agent -- a peer to external agents, not a kernel underneath them. Flux should be the model-routing, cost, and reliability control plane. Wayland Cloud should provide durable remote execution and continuity. Pro should sell managed operation, not remove the completeness of the free local or self-hosted product.

## Current scorecard

Scores are evidence-based readiness scores, not a judgement on ambition.

| Area                          | Score / 5 | Assessment                                                                                                                       |
| ----------------------------- | --------: | -------------------------------------------------------------------------------------------------------------------------------- |
| Capability breadth            |       4.5 | Genuinely exceptional breadth already exists.                                                                                    |
| Provider and agent neutrality |       5.0 | The clearest defensible differentiation.                                                                                         |
| Native desktop distribution   |       4.0 | macOS, Windows, and Linux across x64/arm64; signing and notarization are now strong.                                             |
| Outcome-first user experience |       2.5 | Coherent styling, but the user must understand the system's taxonomy before getting value.                                       |
| Core integration              |       2.5 | Real and substantial, but protocol ownership is manual and already drifting.                                                     |
| Flux integration              |       3.5 | Flux is visible and useful; the product contract and value telemetry need to become first-class.                                 |
| Knowledge-work parity         |       2.5 | Strong raw ingredients; finished artifact and connected-work journeys are less coherent than the leaders.                        |
| Developer/power-user parity   |       3.5 | Strong agents, projects, terminal-adjacent capabilities, MCPs, and local control; reliability proof and workspace semantics lag. |
| Cloud deployment              |       1.5 | Standalone server boots, but the official image fails to build and starts incomplete when built manually.                        |
| Security architecture         |       4.0 | Electron and Web UI hardening are thoughtful; dependency exposure and workspace trust still require work.                        |
| Release evidence              |       2.5 | Large unit suite and signed packages, but representative E2E is manual and several flagship journeys fail.                       |
| Accessibility                 |       2.5 | Deliberate ARIA/keyboard work is visible, but there is no automated WCAG gate and some screens expose many unlabeled controls.   |
| Maintainability               |       2.0 | Giant bridge/manager files, weak boundaries, warnings, dead candidates, manual registration, and low coverage in critical seams. |
| Community/distribution        |       3.0 | Strong early GitHub momentum; metadata, documentation truth, share loops, and repeatable deployment are underdeveloped.          |

## What is strong

- Provider independence is structural, not marketing: Wayland can select among provider APIs, local models, external agent CLIs, Wayland Core, and Flux Router.
- Desktop release engineering is broader than many young projects: signed Windows artifacts, notarized/stapled macOS artifacts, and Linux AppImage/deb/rpm builds for x64 and arm64.
- Electron security defaults are materially good: sandboxing, context isolation, disabled Node integration, constrained navigation/window creation, permission handling, CSP, CSRF, origin checks, and rate limiting.
- The product already supports multiple operating modes: local interactive work, projects, scheduled jobs, mission control, channels, teams, extensions, Web UI, and remote-facing concepts.
- The ecosystem surface is real: 97 assistants, 176 workflows, 60 teams, 107 MCP connectors, 71 discovered skills, and 11 extensions in the audited session.
- Persistence tests are comparatively strong: the focused suite passed settings across restart, project workspace allocation, and project-chat workspace resolution.
- Twelve locales and broad platform support increase the potential community surface.

## Where the product is weak

- The information architecture describes components rather than outcomes. A user must choose among overlapping concepts before Wayland has enough intent to route intelligently.
- Breadth is rendered eagerly. The live assistants screen exposed 263 visible controls; workflows exposed 224 controls and about 99,000 characters; `/guid` exposed 67 controls.
- A persistent task does not have one canonical identity and receipt across chat, schedule, team, Core execution, remote host, artifact, and mission control.
- Desktop/Core protocol types are manually duplicated. The Core refactor has event variants the released Desktop neither types nor renders, and Desktop drops unknown events.
- The cloud surface initializes a smaller bridge than Desktop, so “Cloud” is currently a divergent subset rather than the same product on another host.
- Release claims are ahead of release proof: full E2E is manually dispatched, current navigation tests encode retired routes, and flagship journey failures are not blocking release.
- Documentation is not release-derived. The README still says macOS is not notarized and `getwayland` is coming soon even though v0.11.18 is notarized and the npm package exists.
- Dependency and ownership hygiene is behind the feature velocity: 101 audit advisories, 2,610 lint warnings, critical seams with near-zero coverage, large orchestration files, and high-signal disconnected code candidates.

## Product diagnosis

“All in one” should not mean “show all things.” It should mean Wayland can accept almost any outcome and progressively assemble the right workspace, model, agent, tools, trust policy, execution host, and artifact without making the user design that graph first.

The first interaction should usually be one of:

- state an outcome;
- open a workspace;
- resume work needing attention;
- inspect an artifact or decision;
- approve a consequential action.

Models, agents, assistants, workflows, skills, and MCP servers should remain accessible to experts, but normally operate as inspectable routing decisions under the task—not as prerequisites to starting it.

## Highest-priority decisions

1. Make the Task Ledger and Receipt the cross-product spine before adding another top-level product noun.
2. Establish a generated, versioned Core protocol and compatibility policy before the Core refactor lands.
3. Define one capability/parity manifest consumed by Desktop and Cloud; stop registering two products by hand.
4. Make five representative outcomes release-blocking across a clean packaged app.
5. Repair the Cloud image and decide which Desktop capabilities are host-independent, host-adapted, or intentionally unavailable.
6. Restructure the home and navigation around outcomes, active work, and attention; progressively disclose the component catalog.
7. Treat documentation, SBOM/advisory exposure, accessibility, and deployment proof as release artifacts.

## Audit boundary

This assessment is pinned to the v0.11.18 source and release artifacts. The live Wayland Core `frontier/m0` worktree is a moving refactor and is used only to identify integration risk, not to attribute unreleased behavior to Desktop v0.11.18.

The live UI and focused journeys ran in the repository's local Electron development harness, not from every signed installer. macOS/Windows packaging and signing conclusions come from official CI logs; Linux and Windows installers were not manually installed in this environment. UI control counts are triage heuristics, not a WCAG conformance test. Dependency-audit severity is not proof of exploitability until runtime reachability is classified. Competitor findings use current first-party documentation rather than a full hands-on benchmark account for every paid surface.

Primary release evidence: [v0.11.18 release](https://github.com/FerroxLabs/wayland/releases/tag/v0.11.18) and [Build and Release workflow](https://github.com/FerroxLabs/wayland/actions/runs/29376683529).
