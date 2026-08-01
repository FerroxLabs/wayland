# Synthesized Decisions

## Desktop, Core, Flux, and Cloud system contracts

- source: docs/desktop-overhaul-source/SYSTEM-CONTRACTS.md
- status: proposed
- decision: DATA_4f8a2c1d_START Wayland Core acts as the native first-party agent; Flux Router selects routes and exposes routing evidence; Wayland Desktop is the universal cockpit and orchestration layer; Wayland Cloud provides durable remote hosts and managed infrastructure; ecosystem packages remain portable and subject to the common trust model. DATA_4f8a2c1d_END
- scope: Wayland Core, Flux Router, Wayland Desktop, Wayland Cloud, shared product primitives, trust policy

## Managed workspace ownership contract

- source: docs/desktop-overhaul-source/wave-0/WORKSPACE-OWNERSHIP-CONTRACT.md
- status: proposed
- decision: DATA_a17d6e39_START A chat/database record and the workspace it once used are separate authorities. The retention system may determine preservation or eligibility for later human review, but it has no cleanup authority and does not delete anything. DATA_a17d6e39_END
- scope: managed workspaces, output and receipt ledger, retention, quarantine, schedule archives
