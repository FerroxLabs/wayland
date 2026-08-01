# Sequenced overhaul roadmap

Status: program-level phase map. `MASTER-BUILD-PLAN.md` controls packet
dependencies, current information architecture, authority, release gates, and
execution order when this historical phase summary is less specific.

Dates should be estimated after owners and the Core refactor merge window are known. The gates below matter more than calendar promises.

## Phase 0 — Truth and release safety

Goal: make the current product supportable before expanding the surface.

- Establish the capability ledger and evidence states as generated artifacts.
- Fix notarization/npm/version/deployment documentation and derive claims from release metadata.
- Repair Docker build, pin toolchains, freeze installs, include MCP artifacts and version metadata.
- Triage dependency advisories by runtime reachability; produce SBOM and remediation decisions.
- Repair current navigation and flagship E2E; introduce deterministic provider simulator.
- Make packaged Desktop and container smoke journeys release-blocking.
- Add startup capability health and visible degraded-mode reporting.

Exit: every supported distribution path installs/boots; five representative outcomes pass deterministically; docs match artifacts; no untriaged critical/high production exposure.

## Phase 1 — Contract spine with Core and Flux

Goal: prevent the Core refactor and Desktop evolution from creating parallel truths.

- Define the shared derived-execution projection, Project context, optional
  Execution Scope, Capability, Trust Policy, Artifact, Connector, and Receipt
  schemas without introducing a persisted Task identity or competing Workspace
  hierarchy.
- Generate Desktop protocol types from Core and add version/capability handshake.
- Classify event severity and display/persistence obligations.
- Replay Core-owned golden transcripts in Desktop CI.
- Put Flux attempts, fallback, cost, latency, and policy into the Receipt.
- Create the Desktop/Cloud capability manifest and generated bridge registration.

Exit: Desktop supports bundled, user-updated, and forward Core compatibility
cases; no critical event can be silently dropped; the same Project context,
derived execution semantics, and Receipt contract compose across local and Web
surfaces without claiming a durable cross-host Task identity.

## Phase 2 — Outcome-first Desktop shell

Goal: make breadth disappear behind intent without removing expert control.

- Introduce the approved familiar shell: New chat/Home, Search, Chats, Projects,
  Library, Automations, Activity, and Settings. Artifacts, connection health,
  receipts, and execution detail remain contextual rather than becoming peer
  top-level mental models.
- Replace pre-intent agent/model/mode overload with a compact inspectable routing policy.
- Merge assistants/workflows/teams/skills discovery into Library with type filters and recommendations.
- Project scheduled, delegated, remote, and chat work through one derived
  execution view without introducing a parallel persisted Task store.
- Add universal search/command over every object.
- Virtualize large catalogues and enforce interaction/bundle budgets.
- Run accessibility contract and usability tests with novice, knowledge-worker, developer, and operator cohorts.

Exit: a new user completes a verified artifact without opening Settings; an expert can inspect/override every important decision; route accessibility gates pass.

## Phase 3 — Knowledge-work and developer outcome parity

Goal: make the most common outcomes feel finished, not assembled.

- First-class document, spreadsheet, presentation, report, and code-change artifact lifecycles.
- Source/citation, version, diff, comment, export, connector destination, publish approval.
- Browser/computer-use journey with scoped trust and replayable evidence.
- Developer execution-scope/worktree/terminal/test/review flow on the same
  Project context and derived execution model.
- Curated outcome packs for research, analysis, writing, operations, sales, creation, and software work.

Exit: benchmark outcomes meet defined quality, time, cost, editability, and trust criteria against Claude/ChatGPT/Codex, while retaining provider portability.

## Phase 4 — Community Cloud

Goal: make “Wayland anywhere” true and self-hostable.

- Durable remote execution hosts and Desktop handoff.
- Cross-device Project identity, optional Execution Scope, artifact, receipt,
  and conversation continuity. This does not create a durable cross-host Task
  identity or a competing Workspace hierarchy; any later persistence packet
  must pass the master plan's M0 rollback and preserve-unknown gates.
- Stable Web/API/channel parity via host adapters.
- Secure Docker Compose reference, backups, restore, upgrade, rollback, observability.
- Explicit local-only/cloud-only capability UX.

Exit: a clean self-host deploy completes, survives restart, upgrades, restores,
runs scheduled work projected from the canonical records, and returns a receipt
to Desktop without inventing a second Task or Workspace store.

## Phase 5 — Hosted Pro and ecosystem distribution

Goal: monetize operation and accelerate distribution without weakening community trust.

- Tenant isolation, managed secrets/connectors, roles, budgets, policy, audit, support, SLA.
- Composio-backed managed connections behind Wayland's neutral Connector contract.
- Template/gallery/remix/deploy links and verified publishers.
- Artifact review invites, team templates, attribution, and creator analytics.
- Metering and billing aligned with hosting/operation value.

Exit: Pro has a repeatable paid activation path; share/remix loops produce
measurable organic acquisition; tenant export authority is ready to participate
in the separately gated Wayland Transfer program.

## Phase 6 — Secure instance portability

Goal: make a complete Wayland setup safely movable without hidden-folder
archaeology or false promises about credentials and backend-owned sessions.

- Build destination-bound Wayland-to-Wayland transfer and an owner-controlled
  passphrase recovery bundle in the `.wayland-transfer.zip` format.
- Export supported settings, chats, Projects, Teams, files, artifacts, archives,
  schedules, workflows, assistants, skills, memory, receipts, and non-secret
  configuration references through one application-consistent snapshot.
- Reuse Phase 0 quiescence/recovery authority; require every durable store to
  register portability, compatibility, secret, conflict, and restore behavior.
- Import through hostile-archive validation, isolated staging, dry-run conflict
  mapping, credential rebind, paused consequential authority, atomic publish,
  and exact rollback.
- Require explicit destination import permission, current membership, fresh
  step-up/dual-control where configured, and approval of the exact final dry-run;
  pairing keys provide confidentiality but never mutation authority.
- Use fixed format-v1 KDF resource bounds plus a pre-decryption archive-digest
  replay tombstone so exact retries remain idempotent after single-use key
  destruction without retaining decryption authority.
- Quarantine unverified executable-capable content outside prompt, discovery,
  indexing, ToolSearch, schedules, and extension access until separately
  reviewed and activated; reject known-malicious content.
- Prove Desktop-to-Desktop, Desktop-to-self-hosted, and hosted Pro transfers
  across supported platforms without plaintext secret or metadata leakage.

Exit: a representative full instance transfers, restarts, re-authenticates,
resumes approved work, restores archives, validates object/reference parity, and
transfers again without silent loss or authority widening. The normative
contract is `INSTANCE-MIGRATION.md`.

## Cross-phase operating rules

- Do not add a top-level noun without mapping it to the shared primitives.
- Do not claim parity from code presence; prove the outcome.
- Do not allow Desktop and Cloud to hand-register divergent semantics.
- Do not couple Pro-only value to closed task/artifact formats.
- Before Phase 6, every durable store must register a stable authority ID,
  inventory hook, M0 quiescence and backup/restore ownership, and an explicit
  portability status (`unsupported` is honest). The full Wayland Transfer
  serializer, conflict, secret, compatibility, and restore descriptor becomes
  mandatory when P1 begins and blocks P1—not the first preview—unless its
  absence also violates an existing M0–M9 recovery or data-integrity invariant.
- Do not merge Core protocol changes without generated Desktop compatibility evidence.
- Every phase includes documentation truth, accessibility, security exposure, telemetry, and rollback.
