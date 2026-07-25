# Synthesized Requirements

## REQ-canonical-distribution-foundation
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/ADOPTION-DISTRIBUTION.md
- description: DATA_b6e3f910_START Establish one trustworthy, release-derived distribution foundation across the website, installers, packages, self-hosting, and update telemetry. DATA_b6e3f910_END
- acceptance: DATA_19ca74b2_START One canonical website detects the OS and exposes signing/checksum trust; installation docs derive from releases; trusted OS/package channels are available; telemetry distinguishes checks, downloads, installs, rollback, and active versions; self-host deployment is deterministic. DATA_19ca74b2_END
- scope: distribution channels, signed downloads, package channels, self-host deployment

## REQ-advocacy-through-outcomes
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/ADOPTION-DISTRIBUTION.md
- description: DATA_2f81d7ac_START Make advocacy a natural by-product of successful work through shareable outcomes, remixable systems, collaboration, and ecosystem incentives. DATA_2f81d7ac_END
- acceptance: DATA_8a4cb613_START Users can publish polished artifacts or redacted Task Receipts, export inspectable outcome bundles, save successful tasks as templates, install/remix via one link, invite reviewers without full setup, and distribute portable manifests with declared trust and compatibility. DATA_8a4cb613_END
- scope: shareable outcomes, remixable systems, collaborative invitations, ecosystem incentives

## REQ-activation-under-ten-minutes
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/ADOPTION-DISTRIBUTION.md
- description: DATA_71d0a9e4_START The first-run experience asks for an outcome before presenting a provider matrix. DATA_71d0a9e4_END
- acceptance: DATA_c45e218f_START A user chooses a posture, states a meaningful outcome, sees the minimum connection and permission needed, completes a verified artifact in under ten minutes, can inspect Wayland's choices, and can save, schedule, share, or remix the successful task. DATA_c45e218f_END
- scope: activation journey, first verified artifact

## REQ-adoption-evidence
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/ADOPTION-DISTRIBUTION.md
- description: DATA_9e32f0b7_START Measure adoption through verified value and retained use rather than updater metadata or vanity activity. DATA_9e32f0b7_END
- acceptance: DATA_3ad5c861_START Metrics cover signed installer to first launch, first launch to verified artifact, completed tasks, retained workspaces and automations, share/remix and invite/install conversion, update health, self-host deploy/restore success, contribution time, and Pro conversion after managed value is consumed. DATA_3ad5c861_END
- scope: adoption metrics, retention, distribution evidence

## REQ-product-tier-boundary
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/CLOUD-PRO.md
- description: DATA_d4178b2e_START Keep Desktop and Community Cloud complete while charging Hosted Pro for managed operation, continuity, governance, and scale. DATA_d4178b2e_END
- acceptance: DATA_6c98ef31_START Free Desktop remains the complete local personal product; Community Cloud remains a complete documented single-user or small-team server; Hosted Pro adds managed deployment, always-on isolation, cross-device continuity, managed credentials, team/org controls, compliance, higher resources, and premium support. DATA_6c98ef31_END
- scope: Free Desktop, Community self-hosted Cloud, Hosted Pro, commercial tiers

## REQ-credible-community-cloud
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/CLOUD-PRO.md
- description: DATA_0ba6d4f9_START Community Cloud must be reproducible, supportable, secure by default, and proven on every release. DATA_0ba6d4f9_END
- acceptance: DATA_f21c5a87_START Images and installs are pinned and reproducible; runtime is minimal and non-root; health, readiness, graceful shutdown, metadata, persistent storage, migrations, backup, restore, rollback, TLS references, capability parity, Doctor output, and deterministic container E2E are present. DATA_f21c5a87_END
- scope: container deployment, reproducibility, backup and restore, support matrix

## REQ-hosted-isolation-and-portability
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/CLOUD-PRO.md
- description: DATA_54e1c8b3_START Hosted Pro isolates tenant authority while preserving portable task, workspace, and receipt formats. DATA_54e1c8b3_END
- acceptance: DATA_a8d30f6c_START Tenant data, execution, network policy, secrets, and connector tokens are isolated; Desktop-to-Cloud handoff is cryptographically bound; consequential connector actions are logged; control, execution, artifact, and connector planes are separated; metering follows value-aligned resources. DATA_a8d30f6c_END
- scope: tenant isolation, secure handoff, connector broker, metering

## REQ-provider-neutral-connectors
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/CLOUD-PRO.md
- description: DATA_137be905_START Wayland owns a provider-neutral Connector contract instead of adopting a vendor's connector ontology. DATA_137be905_END
- acceptance: DATA_e54a7c12_START A connection may be backed by an MCP server, native Wayland adapter, managed connector vendor, or customer-owned integration; Pro value is managed authentication, reliability, audit, support, and scale while open/self-hosted connections remain available. DATA_e54a7c12_END
- scope: connector contract, managed OAuth, self-hosted connections

## REQ-provider-neutral-cowork
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/COWORK-DEEP-DIVE.md
- description: DATA_85fc213a_START Cowork is a provider-neutral knowledge-work capability for turning goals and source material into editable, traceable work with honest validation. DATA_85fc213a_END
- acceptance: DATA_4d70be96_START Cowork is not a Project replacement, privileged security mode, provider-bound assistant, separate workflow engine, memory store, scheduler, or alternate starting surface; it uses the ordinary Project, Chat, Sources, and Output mental model. DATA_4d70be96_END
- scope: Cowork, knowledge work, provider and agent neutrality

## REQ-cowork-source-ledger
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/COWORK-DEEP-DIVE.md
- description: DATA_f6390c4e_START Maintain an inspectable source and citation ledger for knowledge-work claims. DATA_f6390c4e_END
- acceptance: DATA_30bd2a71_START Claims can be traced to page, sheet, slide, cell range, URL, message, or database record; polished reports do not lose recoverable provenance. DATA_30bd2a71_END
- scope: sources, citations, provenance

## REQ-cowork-artifact-acceptance
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/COWORK-DEEP-DIVE.md
- description: DATA_7c14e0a5_START Define format-aware completion and validation contracts for Cowork artifacts. DATA_7c14e0a5_END
- acceptance: DATA_ae528d93_START Workbooks preserve formula/type/range/style/chart/recalculation behavior; presentations preserve templates, layouts, overflow, contrast, and notes; documents preserve structure, references, decisions, and rendering quality; PDFs pass structural and visual checks; every output records sources, adapter, validation, and limitations. DATA_ae528d93_END
- scope: artifact validation, Office formats, PDF, release readiness

## REQ-cowork-capability-readiness
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/COWORK-DEEP-DIVE.md
- description: DATA_1e8b73c4_START Replace skill-library breadth with a tested Cowork capability and readiness model. DATA_1e8b73c4_END
- acceptance: DATA_62a9f0de_START A small standard capability pack and optional role packs declare dependencies, permissions, formats, provider constraints, network/cost behavior, tests, and compatibility; task readiness is driven by live capability contracts rather than provider identity. DATA_62a9f0de_END
- scope: capability manifest, skill packs, readiness

## REQ-cowork-end-to-end-journey
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/COWORK-DEEP-DIVE.md
- description: DATA_c7d34918_START Assemble existing Project, preview, editor, history, source, validation, and delivery machinery into a coherent knowledge-work journey. DATA_c7d34918_END
- acceptance: DATA_58f1a2cb_START A user brings sources, receives and steers a plan, reviews a cited native artifact, refines selected content, validates it, and completes delivery without switching to a competing work mode or losing provider neutrality. DATA_58f1a2cb_END
- scope: Cowork journey, Workbench, artifact refinement, delivery

## REQ-transfer-cryptographic-boundary
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/INSTANCE-MIGRATION.md
- description: DATA_9a6e31d7_START Wayland Transfer uses destination-bound or recovery encryption with fixed, downgrade-resistant format-v1 suites and no plaintext inventory. DATA_9a6e31d7_END
- acceptance: DATA_205de8f4_START Destination mode uses the fixed WT-D1 suite; recovery mode uses fixed WT-R1 parameters; unknown suites, downgrades, nonce reuse, substitution, hostile KDF parameters, and plaintext metadata are rejected; every chunk and the encrypted manifest are authenticated. DATA_205de8f4_END
- scope: encrypted transfer bundle, cryptographic suites, metadata confidentiality

## REQ-transfer-export-authority
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/INSTANCE-MIGRATION.md
- description: DATA_4be710c9_START Instance export is an explicit consequential owner/tenant action and is never inferred from an agent, schedule, channel, Team, connector, or background identity. DATA_4be710c9_END
- acceptance: DATA_d6831fa2_START Desktop and hosted exports require the appropriate owner or tenant principal, explicit review, current membership, step-up authentication where required, scope checks, and a signed source authorization receipt; cross-tenant, stale, unresolved, or unsupported authority fails closed. DATA_d6831fa2_END
- scope: source export authority, tenant identity, step-up authentication

## REQ-transfer-import-authority
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/INSTANCE-MIGRATION.md
- description: DATA_13f5ce84_START Possession of an import key or encrypted bundle does not authorize destination mutation. DATA_13f5ce84_END
- acceptance: DATA_b8072d3e_START Key issuance, content-addressed dry-run approval, and final publication are separate checks; wrong instance/principal/tenant, expired membership, stale step-up, scope widening, policy drift, or approval drift aborts before publication and requires fresh authority. DATA_b8072d3e_END
- scope: destination import authority, dry-run approval, tenant policy

## REQ-application-consistent-export
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/INSTANCE-MIGRATION.md
- description: DATA_759ce204_START Export reuses the global quiescence and mutation-epoch authority to capture one application-consistent object graph. DATA_759ce204_END
- acceptance: DATA_ec1a4f87_START Preflight inventories all stores and exclusions; writers quiesce at one mutation epoch; encrypted staging stays private and same-filesystem; publication is atomic; the finished bundle is reopened, authenticated, decrypted, hashed, and graph-validated; every durable store has a versioned portability descriptor. DATA_ec1a4f87_END
- scope: application-consistent export, portability descriptors, staging

## REQ-transactional-import
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/INSTANCE-MIGRATION.md
- description: DATA_0d4b81f6_START Import is bounded, isolated, conflict-aware, reversible, idempotent, and conservative about executable authority. DATA_0d4b81f6_END
- acceptance: DATA_a3f96725_START Outer input limits and archive attacks are rejected; decryption occurs in non-executable staging; object graphs and provenance validate before dry-run; ID mapping is deterministic; receipts remain immutable; a pre-import recovery point covers stores and vault aliases; consequential objects remain paused or quarantined until separately approved. DATA_a3f96725_END
- scope: transactional import, object identity, quarantine, rollback

## REQ-transfer-proof-matrix
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/INSTANCE-MIGRATION.md
- description: DATA_693afc10_START P1 accepts only after cross-platform, fault, adversarial, replay, authority, provenance, and round-trip evidence proves no silent loss or authority widening. DATA_693afc10_END
- acceptance: DATA_91d5e8b7_START Full and scoped transfers cover Desktop and cloud compatibility pairs; crash/cancel/low-disk and crypto/archive attacks are exercised; counts, hashes, references, receipts, schedules, Teams, Projects, and settings reconcile; restart, re-authentication, paused-authority review, restore, resumed work, and a second verified transfer succeed. DATA_91d5e8b7_END
- scope: migration proof, platform matrix, fault injection, semantic determinism

## REQ-derived-execution-view
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/PRODUCT-STRATEGY.md
- description: DATA_e2745a0c_START Every meaningful run produces a derived, inspectable execution view without introducing a new persisted Task store or competing Workspace hierarchy. DATA_e2745a0c_END
- acceptance: DATA_5c93f1b8_START The flow scopes the outcome, proposes plan/host/budget/permissions, routes through Flux, selects an agent, executes declared capabilities, produces and verifies artifacts, records a receipt, and supports sharing, scheduling, continuation, or automation. DATA_5c93f1b8_END
- scope: outcome execution, derived view, Projects, execution scope

## REQ-canonical-information-architecture
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/PRODUCT-STRATEGY.md
- description: DATA_76a8d4e2_START Use one canonical top-level information architecture instead of exposing implementation taxonomy. DATA_76a8d4e2_END
- acceptance: DATA_b15fe903_START Top-level destinations are New chat/Home, Search, Chats, Projects, Library, Automations, Activity, and Settings; artifacts, execution details, approvals, receipts, health, and operations remain contextual to their owning surfaces. DATA_b15fe903_END
- scope: Home, Search, Chats, Projects, Library, Automations, Activity, Settings

## REQ-outcome-first-home
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/PRODUCT-STRATEGY.md
- description: DATA_3f709ce1_START Home begins with outcomes, active work, and attention instead of a permanent provider/agent mode wall. DATA_3f709ce1_END
- acceptance: DATA_d02be857_START Home has one outcome composer, recent/active work, and needs-attention items; routing is a compact expandable summary; starting points are contextual; reusable capability recommendations follow intent; expected artifact, host, permission, cost, and time are shown before consequential work. DATA_d02be857_END
- scope: Home redesign, routing summary, contextual starting points

## REQ-portable-artifact-lifecycle
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/PRODUCT-STRATEGY.md
- description: DATA_8f1c2a64_START Every artifact has a first-class, traceable, versioned, reviewable, exportable, and portable lifecycle. DATA_8f1c2a64_END
- acceptance: DATA_4a69e5d3_START Artifacts have a type-appropriate preview/editor, source and receipt provenance, versions/comments/comparison/restore, open/native export, connector destinations, explicit publish/share approval, and a portable self-hosted/cross-provider bundle. DATA_4a69e5d3_END
- scope: artifact lifecycle, provenance, versions, export, sharing

## REQ-trust-authority-vocabulary
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/PRODUCT-STRATEGY.md
- description: DATA_1b87f043_START Explain permissions at the outcome level without adding a second persisted authority vocabulary. DATA_1b87f043_END
- acceptance: DATA_f6c03d29_START Stored Project/workspace authority remains only `ask` and `trusted-edits`; explanatory behavior never widens authority; users can inspect roots, domains, connector scopes, commands, budgets, and recipients; moved or scheduled work keeps the same or narrower effective policy. DATA_f6c03d29_END
- scope: trust UX, Project authority, effective policy

## REQ-truthful-core-settings
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/SANDBOX-DEVELOPER-JOURNEY.md
- description: DATA_2ca95e61_START Desktop security controls must reflect the pinned Core schema and effective runtime policy rather than reporting file-write success as enforcement. DATA_2ca95e61_END
- acceptance: DATA_a7d6143f_START Unknown or mis-sectioned controls are removed or disabled; approval and environment fields use the correct sections and values after contract tests; egress-off is not offered unless the spawn contract and effective posture prove it; Browser denials show profile, scope, policy source, and honest recovery. DATA_a7d6143f_END
- scope: Desktop security controls, Core policy schema, effective settings

## REQ-bounded-developer-grants
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/SANDBOX-DEVELOPER-JOURNEY.md
- description: DATA_50e1b7c4_START Local development uses purpose-scoped Project grants rather than blanket sandbox disablement. DATA_50e1b7c4_END
- acceptance: DATA_d9382a05_START A Project-only host+port Browser grant is explicit, revocable, receipt-backed, redirect/DNS safe, and isolated from other Projects; Xcode/toolchain and DerivedData roots are separately declared; metadata/private-network targets, alternate encodings, unrelated ports, symlink escapes, and inherited remote authority remain blocked. DATA_d9382a05_END
- scope: localhost browser policy, macOS toolchains, project-scoped grants

## REQ-managed-workspace-retention
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/SANDBOX-DEVELOPER-JOURNEY.md
- description: DATA_6be24c89_START Deleting a chat never implies deletion of its managed workspace content. DATA_6be24c89_END
- acceptance: DATA_15a7fce3_START Generated workspaces are inventoried against all live references; unknown, referenced, scheduled, artifact-bearing, and modified content is preserved; Phase 1 may classify only provably empty abandoned shells for later human review and has no quarantine, prune, or delete authority. The older cleanup-oriented acceptance wording is superseded by the normative WORKSPACE-OWNERSHIP-CONTRACT. Any later quarantine, restore, keep-forever, or separately authorized deletion belongs only to future requirement WSLX-01 after a complete trusted output/receipt ledger exists. DATA_15a7fce3_END
- scope: temporary chat workspaces, retention, quarantine, recovery

## REQ-image-vision-chat-parity
- source: User-reported Wayland Desktop failure evidence (2026-07-19); /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/COWORK-DEEP-DIVE.md
- description: Ordinary chat image attachments are a first-preview parity journey, not a Cowork-only or future capability.
- acceptance: An image attached through the ordinary composer preserves MIME/content identity through storage, routing, translation, retries/fallbacks, and response correlation; only a proven image-capable route is selected; provider/model-incompatible or deprecated parameters are omitted; unsupported capability degrades honestly without a false credential diagnosis; malformed, dropped, or privacy-unsafe attachments fail closed. Phase 5 runs real image input through every claimed packaged provider/adapter and target, or physically omits the capability and claims.
- scope: composer attachments, multimodal routing, provider translation, packaged parity, privacy

## REQ-support-and-updater-proof
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/SANDBOX-DEVELOPER-JOURNEY.md
- description: DATA_83c4f1a6_START Troubleshooting and updates preserve work and produce bounded, resumable, packaged evidence. DATA_83c4f1a6_END
- acceptance: DATA_297e6b40_START Support emits a compact redacted artifact and continuation summary with context-budget warning; signed-package updater proof covers quit, apply, relaunch, version advance, pending-marker reconciliation, manual-download/rollback recovery, injected failure, and preserved conversation/workspace state. DATA_297e6b40_END
- scope: Doctor diagnostics, support handoff, automatic updater

## REQ-canonical-voice-presentation
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/VOICE-CONVERSATION-MODE.md
- description: DATA_c8e31a72_START Voice and Chat are two presentations of the same canonical conversation and execution state. DATA_c8e31a72_END
- acceptance: DATA_4f9d620b_START Entering or leaving Voice never forks the thread or creates a separate assistant, store, permission mode, or engine; the same chat, Project, agent, model, workspace, authority, tools, plan, outputs, transcript, activity, costs, and receipts remain available. DATA_4f9d620b_END
- scope: Voice mode, canonical conversation, continuity

## REQ-honest-voice-state
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/VOICE-CONVERSATION-MODE.md
- description: DATA_9b206df4_START Voice exposes an explicit, accessible, interruptible state model instead of decorative or misleading ambience. DATA_9b206df4_END
- acceptance: DATA_31a5e8c7_START States include connecting, listening, speaking/transcribing/thinking/acting, approval-needed, interrupted, reconnecting, error, and ended; persistent controls cover end, mute, interrupt, captions, voice selection, and Chat return; Escape stops speech first and never approves or silently ends work. DATA_31a5e8c7_END
- scope: VoiceTurnCoordinator, voice state, accessibility, interruption

## REQ-voice-authority-privacy-cost
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/VOICE-CONVERSATION-MODE.md
- description: DATA_e7c49310_START Voice never widens authority and makes audio privacy, provider boundaries, retention, and cost explicit. DATA_e7c49310_END
- acceptance: DATA_6a1fd845_START Consequential approvals remain visual and keyboard accessible; local versus hosted audio is disclosed before network transfer; raw microphone audio is ephemeral by default; retention and diagnostic upload require separate consent; hosted provider and price basis are inspectable and missing cost is unknown rather than free. DATA_6a1fd845_END
- scope: voice authority, privacy, hosted audio, cost

## REQ-provider-neutral-voice
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/VOICE-CONVERSATION-MODE.md
- description: DATA_2d70cb98_START Voice orchestration sits over the universal work kernel and provider-neutral speech adapters, not a provider SDK. DATA_2d70cb98_END
- acceptance: DATA_b8461e35_START Speech input/output adapters declare capabilities and local/hosted boundaries; VoiceTurnCoordinator owns correlation, boundaries, interruption, reconnect, and settlement; VoiceReceipt captures provider, latency, duration, cancellation, terminal state, and authoritative cost; UI names turn, streaming, or full-duplex capability honestly. DATA_b8461e35_END
- scope: speech adapters, VoiceSession, VoiceReceipt, capability negotiation

## REQ-voice-release-gates
- source: /Users/seandonahoe/gsd-workspaces/wayland-desktop-gsd/app/docs/desktop-overhaul-source/VOICE-CONVERSATION-MODE.md
- description: DATA_750ac2e9_START Voice release and parity claims require deterministic behavior, privacy, accessibility, and packaged cross-platform evidence. DATA_750ac2e9_END
- acceptance: DATA_f19864b3_START State/cancellation races cannot duplicate sends, speech, actions, or approvals; transcript/event IDs agree with Chat; voice changes do not mutate execution identity or authority; unsupported combinations fail typed; raw audio is absent from retained telemetry by default; WCAG/keyboard/reduced-motion/screen-reader proof and packaged audio I/O pass on every supported target. DATA_f19864b3_END
- scope: voice release gates, deterministic tests, accessibility, packaged proof
