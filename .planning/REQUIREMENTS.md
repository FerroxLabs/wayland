# Requirements: Wayland Desktop Adaptive Cockpit and Cowork

**Defined:** 2026-07-19  
**Core Value:** A provider-agnostic get-shit-done copilot that keeps chat immediately usable, progressively reveals all existing power, and makes AI work for novices, knowledge workers, developers, and operators.

## v1 Requirements

These are atomic, checkable requirements for the current seven-phase milestone. A checked box requires implementation, the named proof closure, and a committed exact candidate; code presence alone does not count.

### Phase 1 — Safety Foundation

- [ ] **SAF-01**: Application-consistent backup, restore, signed rollback, and delta-safe re-upgrade.
- [ ] **SAF-02**: Signed Classic baseline observation and cohort authority.
- [ ] **SAF-03**: Persist only canonical `ask`/`trusted-edits`; conservative downgrade/re-upgrade.
- [ ] **SAF-04**: Preserve managed workspaces and classify only provably empty abandoned shells for later human review; no cleanup authority.
- [ ] **SAF-05**: Keep implementation, fixture, packaging, canary, release, and cohort evidence separate.
- [ ] **CORE-01**: Pin Core commit, version, generator, schema digest, and fixture digest.
- [ ] **CORE-02**: Replay Core corpus through the real consumer/reducer and fail closed.
- [ ] **FLUX-01**: Pin and replay Flux route/attempt/fallback/cost evidence with full correlation.
- [ ] **MCP-01**: Remove declaration/probe/publication false-green states.
- [ ] **SBX-01**: Show only schema-valid Core controls and correlated effective policy.
- [ ] **COW-01**: Prove C0-A executable/skill lockstep, authority isolation, and current-host-only execution with no reachable hosted fallback; any future fallback requires a separately accepted explicit-consent contract.

### Phase 2 — Migration Skeleton

- [ ] **KRN-01**: One backend-neutral execution model and universal work kernel.
- [ ] **AUTH-01**: Separate requested ceiling from producer-reported/effective authority.
- [ ] **HND-01**: Provider replacement only at declared checkpoints with explicit loss and side effects.
- [ ] **CMP-01**: Shared model compiles and contract-tests through Web/Cloud composition.
- [ ] **SHL-01**: Reversible Classic/Cockpit presentation switch over canonical state.
- [ ] **COW-02**: C0-B readiness-schema conformance and target-exact component proof.

### Phase 3 — Daily Cockpit

- [ ] **NAV-01**: Canonical top-level information architecture.
- [ ] **HOME-01**: Outcome-first Home and under-ten-minute activation.
- [ ] **PRJ-01**: Projects remain groups of chats, shared context, and artifacts.
- [ ] **RUN-01**: Honest thread activity and adaptive mission rail from one event model.
- [ ] **MCP-02**: Exact live-session register/discover/invoke/revoke lifecycle.
- [ ] **SBX-02**: Purpose-scoped Project localhost and toolchain grants.
- [ ] **EXT-01**: Expert controls remain inspectable and no slower than Classic.
- [ ] **IMG-01**: Ordinary-composer image/vision input survives end to end through capability-aware routing, provider-safe translation, honest degradation, and exact packaged proof.

### Phase 4 — Power and Outcomes

- [ ] **WBK-01**: Contextual Workbench projection without a competing mode or store.
- [ ] **OUT-01**: Trusted receipt origin, integrity, staleness, validation, and first artifact lifecycle.
- [ ] **POW-01**: Library, Automations, and Activity preserve reachability and provenance.
- [ ] **COW-03**: Cowork starter and plain-language request use the same chat route/kernel.
- [ ] **COW-04**: Source/citation ledger for the mandatory first DOCX/PDF vertical.
- [ ] **COW-05**: Type-aware validation and scoped revision for first native artifacts.
- [ ] **COW-06**: Complete ordinary-composer source-to-delivery journey.
- [ ] **MCP-03**: Scoped ToolSearch discovery cannot exceed active-session capability.
- [ ] **VOC-01**: Chat and Voice share canonical conversation/execution state.
- [ ] **VOC-02**: Honest interruptible Voice state and accessible controls.
- [ ] **VOC-03**: Voice authority, privacy, retention, provider, and cost remain explicit.
- [ ] **VOC-04**: Provider-neutral speech adapters and authoritative VoiceReceipt.

### Phase 5 — Release Hardening

- [ ] **PKG-01**: Exact signed candidate passes all six target combinations.
- [ ] **REC-01**: Aggregate install/switch/restore/rollback/re-upgrade sequence passes.
- [ ] **UPD-01**: Updater and support recovery preserve work and produce bounded evidence.
- [ ] **MCP-04**: Packaged MCP transport/auth/backend corpus and J9 pass.
- [ ] **SBX-03**: Packaged sandbox/browser/toolchain J25 proof passes.
- [ ] **VOC-05**: Deterministic, accessible, private packaged Voice proof.
- [ ] **QA-01**: Keyboard, focus, zoom, motion, screen-reader, and contrast gates pass.
- [ ] **QA-02**: Long-chat/activity/Library CPU, memory, latency, and bundle budgets pass.
- [ ] **SEC-01**: Runtime-reachable security/dependency/extension risks close or capability is absent.

### Phase 6 — Preview

- [ ] **ROL-01**: Measure task success, verified value, failures, support, and Classic returns.
- [ ] **ROL-02**: Cohort expansion obeys explicit thresholds and automatic stop/rollback rules.
- [ ] **ROL-03**: Cockpit default and Classic retirement remain distinct evidence decisions.

### Phase 7 — Secure Portability

- [ ] **XFER-01**: Fixed downgrade-resistant encrypted transfer boundary.
- [ ] **XFER-02**: Explicit source export authority.
- [ ] **XFER-03**: Destination mutation authority separate from key possession.
- [ ] **XFER-04**: Application-consistent encrypted export graph.
- [ ] **XFER-05**: Transactional, conflict-aware, reversible import.
- [ ] **XFER-06**: Cross-platform adversarial round-trip proof.

## v2 Requirements

These requirements are preserved but deferred to a later milestone. They are not evidence for the current Desktop preview.

### Distribution and Advocacy

- **DIST-01**: Website, installer/package channels, and self-host distribution.
- **ADV-01**: Sharing, remix, invitations, and ecosystem distribution loops.
- **ADP-02**: Share/remix/install, contribution, self-host, and Pro-conversion metrics.

### Cloud, Hosted Pro, and Managed Connectors

- **CLOUD-01**: Desktop, Community, and Hosted commercial boundary.
- **CLOUD-02**: Reproducible supported Community Cloud.
- **CLOUD-03**: Hosted multitenant isolation and handoff.
- **CONN-02**: Managed OAuth/vendor connectors and Pro operations.

### Cowork and Artifact Expansion

- **COWX-01**: Full page/sheet/slide/cell/message/database citation matrix.
- **COWX-02**: Full workbook/presentation/document/PDF matrix.
- **COWX-03**: Standard/role packs, recurring, and remote work.
- **COWX-04**: Broad knowledge-work parity beyond C1.
- **ARTX-01**: Versions, collaboration, publishing, connector destinations, and portable bundles.

### Managed Workspace Lifecycle

- **WSLX-01**: After a complete trusted output/receipt ledger exists, add explicit human-reviewed quarantine, restore, keep-forever, and separately authorized permanent deletion; never automatic chat-cascade cleanup.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Separate Cowork, coding, workflow, Voice, or Cloud mode before a user states an outcome | These are contextual projections over one chat-centered work kernel, not competing products or stores. |
| Second canonical store for conversations, Projects, tasks, workflows, Teams, schedules, memory, capabilities, connectors, or settings | Classic and Cockpit must share canonical state and authority. |
| Forced migration of all agents through Core | Desktop remains provider-neutral; Core is first-party, not mandatory for every journey. |
| Classic retirement in this milestone | Defaulting Cockpit and retiring Classic require separate post-preview evidence decisions. |
| Hosted Pro tenancy or broad Community Cloud parity | These remain v2 requirements with separate commercial and release gates. |
| Public marketplace, creator monetization, and broad distribution loops | These remain v2 distribution/advocacy scope. |
| Managed-workspace quarantine or deletion | Phase 1 is preservation/inventory only; mutation waits for a complete trusted output/receipt ledger and a separately accepted v2 lifecycle. |
| Main merge, release, deploy, cohort expansion, or issue closure without Sean | External promotion authority is explicitly retained by Sean. |

## Traceability

Every v1 requirement maps to exactly one implementation phase. A later proof-closure phase may replay or aggregate the implementation evidence without changing ownership.

| Requirement | Phase | Packet | Implementation phase | Proof closure | Status | Provenance |
|-------------|-------|--------|---------------------:|--------------:|--------|------------|
| SAF-01 | Phase 1 — Safety Foundation | M0A | 1 | 5 | In Progress | Master plan sections 6 and 7 |
| SAF-02 | Phase 1 — Safety Foundation | M0B | 1 | 1; consumed by 6 | In Progress | Master plan M0B |
| SAF-03 | Phase 1 — Safety Foundation | M0A/M1S | 1 | 5 | In Progress | REQ-trust-authority-vocabulary |
| SAF-04 | Phase 1 — Safety Foundation | M0A | 1 | 5 | In Progress | REQ-managed-workspace-retention |
| SAF-05 | Phase 1 — Safety Foundation | M0A | 1 | 5 | In Progress | Master plan sections 9 and 13 |
| CORE-01 | Phase 1 — Safety Foundation | M1 | 1 | 5 | In Progress | Master plan M1 |
| CORE-02 | Phase 1 — Safety Foundation | M1 | 1 | 5 | In Progress | Master plan M1; Core matrix |
| FLUX-01 | Phase 1 — Safety Foundation | M1F | 1 | 5 | In Progress | Master plan M1F |
| MCP-01 | Phase 1 — Safety Foundation | M1M | 1 | 5 | In Progress | Master plan M1M/MCP-0 |
| SBX-01 | Phase 1 — Safety Foundation | M1S/SBX-0 | 1 | 5 | In Progress | REQ-truthful-core-settings |
| COW-01 | Phase 1 — Safety Foundation | C0-A | 1 | 5 | In Progress | REQ-cowork-capability-readiness; C0-A |
| KRN-01 | Phase 2 — Migration Skeleton | M2 | 2 | 5 | Pending | REQ-derived-execution-view |
| AUTH-01 | Phase 2 — Migration Skeleton | M2 | 2 | 5 | Pending | REQ-trust-authority-vocabulary; master section 5 |
| HND-01 | Phase 2 — Migration Skeleton | M2 | 2 | 5 | Pending | REQ-derived-execution-view |
| CMP-01 | Phase 2 — Migration Skeleton | M2 | 2 | 5 | Pending | INV-15 and J13 |
| SHL-01 | Phase 2 — Migration Skeleton | M3 | 2 | 5 | Pending | Master plan M3 |
| COW-02 | Phase 2 — Migration Skeleton | C0-B | 2 | 5 | Pending | REQ-cowork-capability-readiness; C0-B |
| NAV-01 | Phase 3 — Daily Cockpit | M4 | 3 | 5 | Pending | REQ-canonical-information-architecture |
| HOME-01 | Phase 3 — Daily Cockpit | M4 | 3 | 5 | Pending | REQ-outcome-first-home; REQ-activation-under-ten-minutes |
| PRJ-01 | Phase 3 — Daily Cockpit | M4 | 3 | 5 | Pending | INV-03 |
| RUN-01 | Phase 3 — Daily Cockpit | M5 | 3 | 5 | Pending | REQ-derived-execution-view |
| MCP-02 | Phase 3 — Daily Cockpit | M1M/MCP-1-2 | 3 | 5 | Pending | Open connector slice; MCP deep dive |
| SBX-02 | Phase 3 — Daily Cockpit | M1S/SBX-1 | 3 | 5 | Pending | REQ-bounded-developer-grants |
| EXT-01 | Phase 3 — Daily Cockpit | M5 | 3 | 5 | Pending | INV-02 and SC-05 |
| IMG-01 | Phase 3 — Daily Cockpit | M2/M5/IMG | 3 | 5 | Pending | User-reported image failure; COWORK-DEEP-DIVE capability honesty |
| WBK-01 | Phase 4 — Power and Outcomes | M6 | 4 | 5 | Pending | REQ-provider-neutral-cowork; M6 |
| OUT-01 | Phase 4 — Power and Outcomes | M6 | 4 | 5 | Pending | First slice of REQ-portable-artifact-lifecycle |
| POW-01 | Phase 4 — Power and Outcomes | M7 | 4 | 5 | Pending | Master plan M7 |
| COW-03 | Phase 4 — Power and Outcomes | C1 | 4 | 5 | Pending | REQ-provider-neutral-cowork |
| COW-04 | Phase 4 — Power and Outcomes | C1 | 4 | 5 | Pending | First slice of REQ-cowork-source-ledger |
| COW-05 | Phase 4 — Power and Outcomes | C1 | 4 | 5 | Pending | First slice of REQ-cowork-artifact-acceptance |
| COW-06 | Phase 4 — Power and Outcomes | C1 | 4 | 5 | Pending | First slice of REQ-cowork-end-to-end-journey |
| MCP-03 | Phase 4 — Power and Outcomes | M1M/MCP-3 | 4 | 5 | Pending | MCP deep dive |
| VOC-01 | Phase 4 — Power and Outcomes | M5V-A | 4 | 5 | Pending | REQ-canonical-voice-presentation |
| VOC-02 | Phase 4 — Power and Outcomes | M5V-A | 4 | 5 | Pending | REQ-honest-voice-state |
| VOC-03 | Phase 4 — Power and Outcomes | M5V-A | 4 | 5 | Pending | REQ-voice-authority-privacy-cost |
| VOC-04 | Phase 4 — Power and Outcomes | M5V-A | 4 | 5 | Pending | REQ-provider-neutral-voice |
| PKG-01 | Phase 5 — Release Hardening | M8 | 5 | 5 | Pending | Master plan M8 |
| REC-01 | Phase 5 — Release Hardening | M8 | 5 | 5 | Pending | SC-20 |
| UPD-01 | Phase 5 — Release Hardening | M8 | 5 | 5 | Pending | REQ-support-and-updater-proof |
| MCP-04 | Phase 5 — Release Hardening | M1M/MCP-4 | 5 | 5 | Pending | MCP deep dive |
| SBX-03 | Phase 5 — Release Hardening | M1S/SBX-2 | 5 | 5 | Pending | REQ-bounded-developer-grants |
| VOC-05 | Phase 5 — Release Hardening | M5V-B/M8 | 5 | 5 | Pending | REQ-voice-release-gates |
| QA-01 | Phase 5 — Release Hardening | M8 | 5 | 5 | Pending | SC-16 |
| QA-02 | Phase 5 — Release Hardening | M8 | 5 | 5 | Pending | SC-17 |
| SEC-01 | Phase 5 — Release Hardening | M8 | 5 | 5 | Pending | SC-21 |
| ROL-01 | Phase 6 — Preview | M9 | 6 | 6 | Pending | Preview slice of REQ-adoption-evidence |
| ROL-02 | Phase 6 — Preview | M9 | 6 | 6 | Pending | Master plan M9 |
| ROL-03 | Phase 6 — Preview | M9 | 6 | 6 | Pending | Master plan M9 |
| XFER-01 | Phase 7 — Secure Portability | P1 | 7 | 7 | Pending | REQ-transfer-cryptographic-boundary |
| XFER-02 | Phase 7 — Secure Portability | P1 | 7 | 7 | Pending | REQ-transfer-export-authority |
| XFER-03 | Phase 7 — Secure Portability | P1 | 7 | 7 | Pending | REQ-transfer-import-authority |
| XFER-04 | Phase 7 — Secure Portability | P1 | 7 | 7 | Pending | REQ-application-consistent-export |
| XFER-05 | Phase 7 — Secure Portability | P1 | 7 | 7 | Pending | REQ-transactional-import |
| XFER-06 | Phase 7 — Secure Portability | P1 | 7 | 7 | Pending | REQ-transfer-proof-matrix |

**Coverage:**

- v1 requirements: 55 total
- Mapped to phases: 55
- Unmapped: 0 ✓
- v2 requirements: 13 total

## Acceptance and Closure Rules

- Each requirement line is the exact atomic acceptance slice from `.planning/intel/REQUIREMENTS-NORMALIZATION-AUDIT.md`; its provenance identifies the normative source contract.
- Packet-level receipts may unlock dependency-safe construction before a whole phase closes, but they do not promote release or cohort state.
- Phase 5 aggregates current-milestone product, package, recovery, accessibility, performance, and security proof; it does not replace earlier packet receipts.
- Phase 6 consumes M0B and release evidence for cohort decisions; it cannot infer Classic retirement from Cockpit default evidence.
- A requirement becomes Complete only after implementation, the named proof closure, verification, and an exact committed candidate all exist.

---
*Requirements defined: 2026-07-19*
*Last updated: 2026-07-19 after independent normalization audit; 55 current-milestone requirements include the previously omitted user-reported image/vision chat parity journey and preserve the no-cleanup workspace contract as queued WSLX-01.*
