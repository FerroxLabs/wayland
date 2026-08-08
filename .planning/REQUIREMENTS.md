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

| Feature                                                                                                                               | Reason                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Separate Cowork, coding, workflow, Voice, or Cloud mode before a user states an outcome                                               | These are contextual projections over one chat-centered work kernel, not competing products or stores.                                      |
| Second canonical store for conversations, Projects, tasks, workflows, Teams, schedules, memory, capabilities, connectors, or settings | Classic and Cockpit must share canonical state and authority.                                                                               |
| Forced migration of all agents through Core                                                                                           | Desktop remains provider-neutral; Core is first-party, not mandatory for every journey.                                                     |
| Classic retirement in this milestone                                                                                                  | Defaulting Cockpit and retiring Classic require separate post-preview evidence decisions.                                                   |
| Hosted Pro tenancy or broad Community Cloud parity                                                                                    | These remain v2 requirements with separate commercial and release gates.                                                                    |
| Public marketplace, creator monetization, and broad distribution loops                                                                | These remain v2 distribution/advocacy scope.                                                                                                |
| Managed-workspace quarantine or deletion                                                                                              | Phase 1 is preservation/inventory only; mutation waits for a complete trusted output/receipt ledger and a separately accepted v2 lifecycle. |
| Main merge, release, deploy, cohort expansion, or issue closure without Sean                                                          | External promotion authority is explicitly retained by Sean.                                                                                |

## Traceability

Every v1 requirement maps to exactly one implementation phase. A later proof-closure phase may replay or aggregate the implementation evidence without changing ownership.

| Requirement | Phase                        | Packet      | Implementation phase |    Proof closure | Status      | Provenance                                                       |
| ----------- | ---------------------------- | ----------- | -------------------: | ---------------: | ----------- | ---------------------------------------------------------------- |
| SAF-01      | Phase 1 — Safety Foundation  | M0A         |                    1 |                5 | In Progress | Master plan sections 6 and 7                                     |
| SAF-02      | Phase 1 — Safety Foundation  | M0B         |                    1 | 1; consumed by 6 | In Progress | Master plan M0B                                                  |
| SAF-03      | Phase 1 — Safety Foundation  | M0A/M1S     |                    1 |                5 | In Progress | REQ-trust-authority-vocabulary                                   |
| SAF-04      | Phase 1 — Safety Foundation  | M0A         |                    1 |                5 | In Progress | REQ-managed-workspace-retention                                  |
| SAF-05      | Phase 1 — Safety Foundation  | M0A         |                    1 |                5 | In Progress | Master plan sections 9 and 13                                    |
| CORE-01     | Phase 1 — Safety Foundation  | M1          |                    1 |                5 | In Progress | Master plan M1                                                   |
| CORE-02     | Phase 1 — Safety Foundation  | M1          |                    1 |                5 | In Progress | Master plan M1; Core matrix                                      |
| FLUX-01     | Phase 1 — Safety Foundation  | M1F         |                    1 |                5 | In Progress | Master plan M1F                                                  |
| MCP-01      | Phase 1 — Safety Foundation  | M1M         |                    1 |                5 | In Progress | Master plan M1M/MCP-0                                            |
| SBX-01      | Phase 1 — Safety Foundation  | M1S/SBX-0   |                    1 |                5 | In Progress | REQ-truthful-core-settings                                       |
| COW-01      | Phase 1 — Safety Foundation  | C0-A        |                    1 |                5 | In Progress | REQ-cowork-capability-readiness; C0-A                            |
| KRN-01      | Phase 2 — Migration Skeleton | M2          |                    2 |                5 | Pending     | REQ-derived-execution-view                                       |
| AUTH-01     | Phase 2 — Migration Skeleton | M2          |                    2 |                5 | Pending     | REQ-trust-authority-vocabulary; master section 5                 |
| HND-01      | Phase 2 — Migration Skeleton | M2          |                    2 |                5 | Pending     | REQ-derived-execution-view                                       |
| CMP-01      | Phase 2 — Migration Skeleton | M2          |                    2 |                5 | Pending     | INV-15 and J13                                                   |
| SHL-01      | Phase 2 — Migration Skeleton | M3          |                    2 |                5 | Pending     | Master plan M3                                                   |
| COW-02      | Phase 2 — Migration Skeleton | C0-B        |                    2 |                5 | Pending     | REQ-cowork-capability-readiness; C0-B                            |
| NAV-01      | Phase 3 — Daily Cockpit      | M4          |                    3 |                5 | Pending     | REQ-canonical-information-architecture                           |
| HOME-01     | Phase 3 — Daily Cockpit      | M4          |                    3 |                5 | Pending     | REQ-outcome-first-home; REQ-activation-under-ten-minutes         |
| PRJ-01      | Phase 3 — Daily Cockpit      | M4          |                    3 |                5 | Pending     | INV-03                                                           |
| RUN-01      | Phase 3 — Daily Cockpit      | M5          |                    3 |                5 | Pending     | REQ-derived-execution-view                                       |
| MCP-02      | Phase 3 — Daily Cockpit      | M1M/MCP-1-2 |                    3 |                5 | Pending     | Open connector slice; MCP deep dive                              |
| SBX-02      | Phase 3 — Daily Cockpit      | M1S/SBX-1   |                    3 |                5 | Pending     | REQ-bounded-developer-grants                                     |
| EXT-01      | Phase 3 — Daily Cockpit      | M5          |                    3 |                5 | Pending     | INV-02 and SC-05                                                 |
| IMG-01      | Phase 3 — Daily Cockpit      | M2/M5/IMG   |                    3 |                5 | Pending     | User-reported image failure; COWORK-DEEP-DIVE capability honesty |
| WBK-01      | Phase 4 — Power and Outcomes | M6          |                    4 |                5 | Pending     | REQ-provider-neutral-cowork; M6                                  |
| OUT-01      | Phase 4 — Power and Outcomes | M6          |                    4 |                5 | Pending     | First slice of REQ-portable-artifact-lifecycle                   |
| POW-01      | Phase 4 — Power and Outcomes | M7          |                    4 |                5 | Pending     | Master plan M7                                                   |
| COW-03      | Phase 4 — Power and Outcomes | C1          |                    4 |                5 | Pending     | REQ-provider-neutral-cowork                                      |
| COW-04      | Phase 4 — Power and Outcomes | C1          |                    4 |                5 | Pending     | First slice of REQ-cowork-source-ledger                          |
| COW-05      | Phase 4 — Power and Outcomes | C1          |                    4 |                5 | Pending     | First slice of REQ-cowork-artifact-acceptance                    |
| COW-06      | Phase 4 — Power and Outcomes | C1          |                    4 |                5 | Pending     | First slice of REQ-cowork-end-to-end-journey                     |
| MCP-03      | Phase 4 — Power and Outcomes | M1M/MCP-3   |                    4 |                5 | Pending     | MCP deep dive                                                    |
| VOC-01      | Phase 4 — Power and Outcomes | M5V-A       |                    4 |                5 | Pending     | REQ-canonical-voice-presentation                                 |
| VOC-02      | Phase 4 — Power and Outcomes | M5V-A       |                    4 |                5 | Pending     | REQ-honest-voice-state                                           |
| VOC-03      | Phase 4 — Power and Outcomes | M5V-A       |                    4 |                5 | Pending     | REQ-voice-authority-privacy-cost                                 |
| VOC-04      | Phase 4 — Power and Outcomes | M5V-A       |                    4 |                5 | Pending     | REQ-provider-neutral-voice                                       |
| PKG-01      | Phase 5 — Release Hardening  | M8          |                    5 |                5 | Pending     | Master plan M8                                                   |
| REC-01      | Phase 5 — Release Hardening  | M8          |                    5 |                5 | Pending     | SC-20                                                            |
| UPD-01      | Phase 5 — Release Hardening  | M8          |                    5 |                5 | Pending     | REQ-support-and-updater-proof                                    |
| MCP-04      | Phase 5 — Release Hardening  | M1M/MCP-4   |                    5 |                5 | Pending     | MCP deep dive                                                    |
| SBX-03      | Phase 5 — Release Hardening  | M1S/SBX-2   |                    5 |                5 | Pending     | REQ-bounded-developer-grants                                     |
| VOC-05      | Phase 5 — Release Hardening  | M5V-B/M8    |                    5 |                5 | Pending     | REQ-voice-release-gates                                          |
| QA-01       | Phase 5 — Release Hardening  | M8          |                    5 |                5 | Pending     | SC-16                                                            |
| QA-02       | Phase 5 — Release Hardening  | M8          |                    5 |                5 | Pending     | SC-17                                                            |
| SEC-01      | Phase 5 — Release Hardening  | M8          |                    5 |                5 | Pending     | SC-21                                                            |
| ROL-01      | Phase 6 — Preview            | M9          |                    6 |                6 | Pending     | Preview slice of REQ-adoption-evidence                           |
| ROL-02      | Phase 6 — Preview            | M9          |                    6 |                6 | Pending     | Master plan M9                                                   |
| ROL-03      | Phase 6 — Preview            | M9          |                    6 |                6 | Pending     | Master plan M9                                                   |
| XFER-01     | Phase 7 — Secure Portability | P1          |                    7 |                7 | Pending     | REQ-transfer-cryptographic-boundary                              |
| XFER-02     | Phase 7 — Secure Portability | P1          |                    7 |                7 | Pending     | REQ-transfer-export-authority                                    |
| XFER-03     | Phase 7 — Secure Portability | P1          |                    7 |                7 | Pending     | REQ-transfer-import-authority                                    |
| XFER-04     | Phase 7 — Secure Portability | P1          |                    7 |                7 | Pending     | REQ-application-consistent-export                                |
| XFER-05     | Phase 7 — Secure Portability | P1          |                    7 |                7 | Pending     | REQ-transactional-import                                         |
| XFER-06     | Phase 7 — Secure Portability | P1          |                    7 |                7 | Pending     | REQ-transfer-proof-matrix                                        |

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

_Requirements defined: 2026-07-19_
_Last updated: 2026-07-19 after independent normalization audit; 55 current-milestone requirements include the previously omitted user-reported image/vision chat parity journey and preserve the no-cleanup workspace contract as queued WSLX-01._

---

## WLD-I — Licence Compliance Requirements

**Defined:** 2026-07-30
**Milestone:** WLD-I (lettered milestone, phase namespace `I-01` … `I-10`)
**Goal:** Bring Wayland's third-party attribution into a defensible state under Apache-2.0
§4(b)/§4(c) and MIT, and make every attribution claim the app ships actually true.

> **Additive.** The 55 current-milestone and 13 deferred requirements above are untouched — no
> renumbering, no reclassification, no deletion. WLD-I requirements use their own ID prefixes (LEG,
> NTC, CUS, MFT, HDR, ADJ, DEP, BND, CIG, DIS) which do not collide with any existing prefix.

**Authoritative scope:** measured against **AionUi v1.9.5, tag `5b2c741f92`, dated 2026-04-01**;
**1005** same-path files (730 in `src/`, 275 outside), **DERIVED-HIGH 891 · DERIVED-LIKELY 90 ·
REVIEW 18 · DIVERGED 6**, **186** at 100% literal line overlap, **0** carrying an AionUi copyright
notice. Source: `.planning/phases/WLD-I-licence-compliance/AIONUI-INVENTORY.csv` (+ `inventory.py`).
Every other figure in the four dimension research files is superseded — do not quote 445, 503, 550,
~310, 455, 1424, 1390, 2615, 3966, or 2316.

**Proof standard for every requirement below:** verified against the actual tree, the pinned
upstream, or a **real packaged artifact**. Never against a commit message, a prior finding, or
`electron-builder.yml`. A green `tsc` is not packaged evidence.

### Phase I-01 — Counsel: the §4(c) placement question

- [ ] **LEG-01**: Ship the §4(c) placement question to counsel, verbatim and alone — does a central
      provenance manifest in the source tree satisfy Apache-2.0 §4(c), or must the retained notice sit
      in the file it was removed from? Record the answer verbatim with its date, and name every phase
      whose content it changes.
- [ ] **LEG-02**: Scope the counsel packet to the **remedy**: the five subsidiary decisions (literal
      §4(b) wording; whether the upstream copyright must precede ours; the overlap threshold below
      which "independent" is defensible; sufficiency of the remedy form; the `3f1c5ba10` GPL-family
      standard of investigation), enclosures limited to the inventory CSV, the header template and the
      notices diff, and **no** request to adjudicate settled or measured facts.

### Phase I-02 — Small, settled, independent notices work

- [x] **NTC-01**: Reproduce the Apache-2.0 licence text verbatim, with its appendix placeholder
      intact rather than overwritten with our name. *(`78329477f`)*
- [x] **NTC-02**: Ship `notices/OfficeCLI-NOTICE.txt` verbatim from the upstream `NOTICE` at the
      pinned release — the one upstream for which §4(d) actually binds. *(`78329477f`)*
- [x] **NTC-03**: Remove the four false claims from the shipped notices file — the blanket §4(d)
      claim, the enumerated §4(b) list containing the false `.wcore.toml` / `~/.wcore` claims, the
      gemini-cli blanket header claim, and "every file carries a header" — plus the three smaller
      corrections (pptx2json not "verbatim", 7zip-bin not "solely Windows", OfficeCLI digests read
      locally). *(`78329477f`)*
- [x] **NTC-04**: Rewrite the stale shipped `notices/README.md`, and retract the false authorship
      claim shipped in the notices. *(`78329477f`, `d99c70b07`)*
- [x] **NTC-05**: Exclude `src/process/channels/whatsapp-bridge/` from formatting so the pinned bridge
      cannot be silently reformatted out of pin. *(`78329477f`)*
- [ ] **NTC-06**: Add the owed OpenClaw MIT notices to the tunnel trio and
      `src/process/channels/types.ts`, in an `@license` form that survives bundling and is present in
      a real packaged artifact.
- [ ] **NTC-07**: Collapse the six OpenClaw header dialects to one (the `backoff.ts` form, 32 measured
      surviving instances) while preserving the inline per-function
      `// Adapted from openclaw/… (MIT).` comments, which are the good pattern.
- [ ] **NTC-08**: Land the `backends/baileys.js` header in its own commit with
      `scripts/whatsapp-bridge-source.json` re-pinned in that same commit, gated by
      `whatsappBridgeSourcePin.test.ts` and a full packaged build.

### Phase I-03 — Per-file chain of custody for non-AionUi upstreams

- [ ] **CUS-01**: For every file attributed to a non-AionUi upstream, record per file whether the path
      exists in AionUi v1.9.5 and **which copyright line the v1.9.5 file itself carries**, quoted
      verbatim — because for any file also present in AionUi, the chain of custody runs through
      AionUi, not the original upstream.
- [ ] **CUS-02**: Rewrite the gemini-cli entry in `notices/THIRD-PARTY-NOTICES.md` to assert only
      lineages that survive CUS-01, recording each removal together with the upstream bytes that
      disprove the claim. The entry is wrong **wholesale**, not in one file.
- [ ] **CUS-03**: Gate: no non-AionUi notice may be written anywhere in the tree before its per-file
      verdict exists, and every provenance measurement run reproduces a known-adapted positive control
      and an unrelated negative control or is void.

### Phase I-04 — Manifest, generator, drift test, upstream tree index

- [ ] **MFT-01**: `scripts/provenance/aionui.json` — the source of truth: path, upstream path, pin
      `5b2c741f92`, measurement, classification, reviewer, date; one row per file; seeded reproducibly
      from `AIONUI-INVENTORY.csv`. It lives in `scripts/`, **not** `notices/`, because anything in
      `notices/` ships and a shipped classification error is a shipped false claim.
- [ ] **MFT-02**: `scripts/provenance/aionui.tree.json` — a checked-in path index of the pinned
      upstream tree so the new-file check is offline and deterministic and cannot go flaky, get
      disabled, and die.
- [ ] **MFT-03**: `scripts/provenance/apply.mjs` — renders headers from the manifest by reading the
      exact upstream copyright bytes from the local pinned checkout; `--check` default, `--write`
      opt-in; **fails rather than templating** when the checkout is absent or at the wrong revision,
      and holds no copyright holder or year as a constant.
- [ ] **MFT-04**: `tests/unit/scripts/provenanceManifest.test.ts` — the load-bearing drift gate,
      cloned from the proven `whatsappBridgeSourcePin.test.ts` pattern: seconds, no build, no network,
      and it fails when a row's pin, path, or classification is mutated.
- [ ] **MFT-05**: A committed pin-impact list enumerating every digest, shasum, and patch-context file
      a header edit can invalidate (bridge digests, OfficeCLI shasums, bundled-wayland-core shasums,
      `patches/*.patch` context lines), produced **before** the sweep touches a byte.

### Phase I-05 — The header sweep

- [ ] **HDR-01**: The §4(b) per-file modification statement on the derived set (891 DERIVED-HIGH + 90
      DERIVED-LIKELY), generated from the manifest. Currently satisfied on **zero** files. Per-file by
      the licence's own words; no central-document reading exists.
- [ ] **HDR-02**: The §4(c) retained AionUi copyright restored **alongside** the Ferrox line, in the
      placement counsel's answer directs. The defect is that Ferrox **replaced** rather than
      **joined**; §4's final paragraph expressly blesses the dual form.
- [ ] **HDR-03**: Each of the 18 REVIEW files individually read, with a five-field verdict recorded —
      upstream candidate set enumerated by `find -type f`; best-match upstream file across the whole
      tree, not the plausibly-named sibling; the three-way split of shared identifiers; whose copyright
      the upstream file itself carries; verdict plus asymmetry note. No verdict without all five.
- [ ] **HDR-04**: Each of the 6 DIVERGED files defaults to *independent*; a derived verdict requires a
      written reason recorded in the same five fields.
- [ ] **HDR-05**: The **negative** determinations recorded with the same fields as the positives —
      precisely the omission `3f1c5ba10` was faulted for.
- [ ] **HDR-06**: Verbatim-copy files receive **no** Ferrox copyright and **no** §4(b) statement, and
      no previously unheadered file with no upstream notice to retain gains an Apache header. Claiming
      copyright in an unmodified copy is a false claim, and ASF forbids adding the Apache header to
      third-party files.
- [ ] **HDR-07**: The 275 files outside `src/` handled as a separate packet: they never reach the
      object form, so only §4(c) applies to them.

### Phase I-06 — Re-adjudicate `3f1c5ba10`

- [ ] **ADJ-01**: A per-file comparison for every provenance comment `3f1c5ba10` removed, to the
      `9add51a0c` standard, with the removal set enumerated from the commit itself and the upstreams
      (acpx, Zed, Codex CLI) cloned at recorded revisions. Removal requires strictly **more** evidence
      than retention.
- [ ] **ADJ-02**: Claude Code recorded as **UNVERIFIED** — closed source, undiffable — with the
      pointer **restored**, because a deleted pointer is unrecoverable and a retained one carries no
      liability.
- [ ] **ADJ-03**: The acpx / Zed **GPL-family** restore-or-leave call routed to counsel as a named
      decision, default **restore** pending adjudication.

### Phase I-07 — npm dependency licence report

- [ ] **DEP-01**: An npm attribution document generated from resolved lockfile data only, with no
      hand-editing anywhere in the path and byte-for-byte reproducible on regeneration.
- [ ] **DEP-02**: Reconciliation against `@electron/asar list` over the **real** artifact as the
      ground-truth oracle — the shipped set is ~1,332 packages, not the 144 declared `dependencies`.
      CI fails on *ships-but-undocumented* and warns only on the reverse, both directions proven by a
      deliberate injection.
- [ ] **DEP-03**: An explicit "could not determine" section naming each of the ~59 shipped packages
      that carry no licence file of their own, and the resolution attempted for each. No silent
      omission, no invented licence text.

### Phase I-08 — Bundle-retention hardening and packaged-artifact verification

- [ ] **BND-01**: A generated `rollupOptions.output.banner` from `notices/BUNDLE-NOTICE.txt` — opening
      `/*!` or containing `@license`, since esbuild keeps only those — generated from the manifest in
      `prebuild` so the shipped notice and the manifest cannot drift.
- [ ] **BND-02**: `verify-notices-in-bundle.mjs` asserting every `requiredNotice` appears in
      `out/main/**`, `out/preload/**` and `out/renderer/**`, proven non-vacuous by a deliberate
      deletion.
- [ ] **BND-03**: The **inverse** assertion — every retracted notice is absent from the bundle, and
      the check fails if one is reintroduced.
- [ ] **BND-04**: The verification runs under `bun run dist:verify:mac`, never raw
      `electron-vite build`, and `notices/THIRD-PARTY-NOTICES.md` remains the primary §4(d) vehicle
      because a copied text file is durable where a comment is not.

### Phase I-09 — Required CI gate

- [ ] **CIG-01**: Manifest drift check, new-file check (a file at a path in the pinned upstream index
      and absent from the manifest fails, **naming the file**), scoped `reuse lint-file $CHANGED`, and
      a header-shape check — as **explicit CI steps with scoped file arguments**.
      `prek run --all-files` is forbidden and must appear nowhere in the workflow.
- [ ] **CIG-02**: The gate **fails closed**: no `paths:` filter that can make it skip (a skipped
      required check counts as a **pass** in this repo, and `paths:` filters fire on **any** match),
      and a missing pinned-upstream cache fails the job rather than passing or skipping.
- [ ] **CIG-03**: Proven to fail on a deliberately stripped header and on a deliberately added
      unattributed file, with both failing runs linked.

### Phase I-10 — Remedy sign-off and disclosure

- [ ] **DIS-01**: Counsel sign-off on the remedy recorded with date and scope.
- [ ] **DIS-02**: A compliance note as a separate, linkable repo document carrying the full factual
      record — method, pin `5b2c741f92`, the measured counts, what was restored, what remains open —
      asserting **method, scope and date** and never completeness.
- [ ] **DIS-03**: A separate, strength-led release-note line. The compliance note and the release note
      are never merged: the release note carrying the confession produces the "credits but no apology"
      headline, and the compliance note carrying spin loses credibility.
- [ ] **DIS-04**: No release ships while any known-false claim is outstanding, and **no contact with
      AionUi** — the cure comes first regardless.

### WLD-I Traceability

Every WLD-I requirement maps to exactly one phase in the `I-01` … `I-10` namespace.

| Requirement | Phase | Status | Basis of proof |
| --- | --- | --- | --- |
| LEG-01 | I-01 Counsel — §4(c) question | Pending | Committed counsel packet; answer recorded verbatim with date |
| LEG-02 | I-01 Counsel — §4(c) question | Pending | Packet enclosure list; grep shows no settled/measured question asked |
| NTC-01 | I-02 Settled notices work | **Complete** (`78329477f`) | `diff notices/Apache-2.0.txt` against a fresh canonical copy |
| NTC-02 | I-02 Settled notices work | **Complete** (`78329477f`) | `diff` against the upstream OfficeCLI `NOTICE` at the pinned release |
| NTC-03 | I-02 Settled notices work | **Complete** (`78329477f`) | grep the four retracted claim strings in the shipped notices file → 0 |
| NTC-04 | I-02 Settled notices work | **Complete** (`78329477f`, `d99c70b07`) | `notices/README.md` read against the tree it describes |
| NTC-05 | I-02 Settled notices work | **Complete** (`78329477f`) | bridge pin clean: 9 pinned / 9 on disk / 0 drift at `2c0d1d203` |
| NTC-06 | I-02 Settled notices work | Pending | `@license` block found in `out/main/**` after `dist:verify:mac` |
| NTC-07 | I-02 Settled notices work | Pending | one dialect remains; inline adapted-from comment count unchanged |
| NTC-08 | I-02 Settled notices work | Pending | `whatsappBridgeSourcePin.test.ts` green + launchable packaged artifact |
| CUS-01 | I-03 Non-AionUi chain of custody | Pending | `git -C <pin> show 5b2c741f92:<path>` per row |
| CUS-02 | I-03 Non-AionUi chain of custody | Pending | notices entry vs the upstream bytes that disprove each removed claim |
| CUS-03 | I-03 Non-AionUi chain of custody | Pending | positive + negative controls reproduced in the same run |
| MFT-01 | I-04 Manifest and generator | Pending | seeder reproduces the manifest byte-for-byte; tier counts 891/90/18/6 |
| MFT-02 | I-04 Manifest and generator | Pending | `--check` runs with the network off |
| MFT-03 | I-04 Manifest and generator | Pending | non-zero exit + no output with the checkout absent; no holder constant |
| MFT-04 | I-04 Manifest and generator | Pending | test fails on a mutated pin / path / classification |
| MFT-05 | I-04 Manifest and generator | Pending | each listed digest located in the file that carries it |
| HDR-01 | I-05 Header sweep | Pending | `apply.mjs --check` exits zero post-sweep; command + output in each PR |
| HDR-02 | I-05 Header sweep | Blocked on LEG-01 for content | every emitted copyright line `grep -F`-able verbatim at `5b2c741f92` |
| HDR-03 | I-05 Header sweep | Pending | 18 committed five-field verdicts, no missing field |
| HDR-04 | I-05 Header sweep | Pending | 6 committed verdicts; a derived call carries a written reason |
| HDR-05 | I-05 Header sweep | Pending | negative determinations present with the same fields |
| HDR-06 | I-05 Header sweep | Pending | grep the verbatim set for a Ferrox line or §4(b) statement → 0 |
| HDR-07 | I-05 Header sweep | Pending | the 275 outside-`src/` files land as their own packet, §4(c) only |
| ADJ-01 | I-06 Re-adjudicate `3f1c5ba10` | Pending | row count equals the removal count enumerated from the commit |
| ADJ-02 | I-06 Re-adjudicate `3f1c5ba10` | Pending | pointer present in the tree, marked UNVERIFIED with its reason |
| ADJ-03 | I-06 Re-adjudicate `3f1c5ba10` | Pending | named counsel decision recorded; default restore held meanwhile |
| DEP-01 | I-07 npm licence report | Pending | delete + regenerate reproduces byte-for-byte from the lockfile |
| DEP-02 | I-07 npm licence report | Pending | `@electron/asar list` over the real artifact; both CI directions proven |
| DEP-03 | I-07 npm licence report | Pending | every undeterminable package named with its attempted resolution |
| BND-01 | I-08 Bundle retention | Pending | regenerate + diff yields no change; unregenerated manifest edit fails |
| BND-02 | I-08 Bundle retention | Pending | notices found in `out/main`, `out/preload`, `out/renderer`; check non-vacuous |
| BND-03 | I-08 Bundle retention | Pending | retracted notices asserted absent; reintroduction fails the check |
| BND-04 | I-08 Bundle retention | Pending | run under `bun run dist:verify:mac`, artifact launchable |
| CIG-01 | I-09 Required CI gate | Pending | grep the workflow for `prek run --all-files` → 0; scoped args only |
| CIG-02 | I-09 Required CI gate | Pending | docs-only PR still runs the check; missing cache fails the job |
| CIG-03 | I-09 Required CI gate | Pending | stripped header and unattributed new file each produce a linked failure |
| DIS-01 | I-10 Sign-off and disclosure | Blocked on LEG-01 | sign-off recorded with date and scope |
| DIS-02 | I-10 Sign-off and disclosure | Blocked on LEG-01 | grep the note for a self-referential completeness word → 0 |
| DIS-03 | I-10 Sign-off and disclosure | Blocked on LEG-01 | two separate files; neither carries the other's framing |
| DIS-04 | I-10 Sign-off and disclosure | Blocked on LEG-01 | every check green on the exact candidate; no AionUi contact exists |

**WLD-I Coverage:**

- WLD-I requirements: **42** total
- Mapped to exactly one phase: **42**
- Unmapped: **0** ✓
- Duplicated across phases: **0** ✓
- Already complete at milestone start: **5** (NTC-01 … NTC-05, `78329477f` / `d99c70b07`)
- Blocked on the §4(c) answer for *content*: **HDR-02, DIS-01 … DIS-04**. HDR-01 and the existence of
  the I-05 sweep are **not** blocked — §4(b) is per-file regardless.

### WLD-I Acceptance and Closure Rules

- A WLD-I requirement is Complete only when its basis of proof has been executed against the tree, the
  pinned upstream, or a real packaged artifact — not when a commit message says so.
- Where a requirement asserts something ships, the proof is presence in a real packaged artifact, not
  a line in `electron-builder.yml`.
- One packet per PR. No bulk cleanup bombs; a large generated diff is acceptable only when
  reproducible from a small reviewed input with the exact `--check` command and output in the PR body.
- No history rewriting. No AI attribution trailers. `prek run --all-files` is forbidden.
- `migrations.ts` `aionrs` SQL literals never change. `FoundrySkills` / `foundry-skills` is never
  renamed. Editing anything under `src/process/channels/whatsapp-bridge/` re-pins
  `scripts/whatsapp-bridge-source.json` in the same commit.
- Nothing merges, tags, or releases without the owner. No release ships while any known-false claim is
  outstanding.

---

_WLD-I requirements defined: 2026-07-30, from `.planning/research/SUMMARY.md` "Implications for
Roadmap". Scope measured against AionUi v1.9.5 (`5b2c741f92`); 42 requirements mapped exactly once
across phases `I-01` … `I-10`._

---

## WLD-K — Core First Requirements

**Defined:** 2026-08-08
**Milestone:** WLD-K (lettered milestone, phase namespace `K-01` … `K-08`)
**Goal:** Make Wayland Core the backend a non-technical user actually succeeds on, so the Master
Class demonstrates Wayland architecture — Wayland Desktop driving Wayland Core — rather than
Desktop driving Claude Code.

> **Additive.** Every requirement above, including the 42 WLD-I requirements, is untouched — no
> renumbering, no reclassification, no deletion. WLD-K uses its own ID prefixes (PRF, ENG, DIA, TRN,
> RCI, INS, FAN) which collide with no existing prefix.

**Scope decision (Sean, 2026-08-08):** all seven packets stay in this milestone. Splitting the
L-sized installer/Flux work into a follow-on milestone was recommended and overridden, so the
roadmap carries an explicit **"Master Class is safe at this line"** boundary after `K-04`. Phases
`K-01` … `K-04` must be able to ship without any of `K-05` … `K-08`.

**Engine targeting (Sean, 2026-08-08):** Core 0.12.26 is in final CI ahead of publish. The committed
Desktop pin stays `v0.12.25` (`scripts/prepareWaylandCore.js:213`), so a 0.12.26 release does not
break already-shipped Desktop — but **the pin bump is blocked until PRF-01 lands**, because current
Desktop code dies at bootstrap on 0.12.26. Every PRF requirement is therefore proven on **both**
0.12.25 and 0.12.26 (rc.2 until stable publishes, stable thereafter).

**Proof standard for every requirement below:** established by **executing** the mechanism against a
real engine, never by reading source. Any search returning zero is disbelieved until the same method
is shown to find a **known positive** — that rule caught a false finding during this milestone's own
planning. A requirement's evidence may cite only what was actually run.

### Phase K-01 — Move the launch profile out of project config *(the spine)*

- [ ] **PRF-01**: Desktop writes its launch-local MCP narrowing profile into the config root the
      engine is already pointed at (`resolveActiveConfigDir()` → `WAYLAND_HOME`), not into the
      per-chat workspace `.wayland-core.toml`. A fresh profile with Wayland Core selected runs one
      prompt and executes an MCP tool on **both** 0.12.25 and 0.12.26.
- [ ] **PRF-02**: The global-config mutation is transactional on the existing
      `ProjectConfigTransaction` posture — journalled backup, marker, atomic rename, fsync, and
      crash recovery — and never leaves a partial write.
- [ ] **PRF-03**: The hash-ownership check governs **every** restore, not only crash recovery — on
      mismatch the user's bytes win, the failure is visible, and a precise repair action is offered.
      **Status: already implemented — this is a preserve-and-prove requirement, not a build one.**
      `ProjectConfigTransaction.restore()` delegates to `recoverProjectConfigTransaction()`, which
      restores only when the on-disk bytes still hash to the replacement it wrote; the existing test
      `'preserves a user edit made after the temporary file was published'`
      (`tests/unit/process/agent/wcore/projectConfigTransaction.test.ts:53`) passes today —
      re-verified by execution 2026-08-08, 6 passed / 0 failed. The work is to route the **new**
      global-config target through this existing primitive without weakening it, and to keep that
      test green. Both cross-research legs proposed this as a needed refinement; they were reasoning
      from my brief, which described the normal restore path inaccurately. Do not rebuild it.
- [ ] **PRF-04**: Only the Desktop-owned `[profiles.__wayland_desktop_session*]` table is spliced
      textually; the result is validated as parsing TOML before the atomic rename. Structured
      round-trip serialization is forbidden — it destroys comments and formatting in a file the user
      hand-edits.
- [ ] **PRF-05**: Concurrent launches are serialised by a lease spanning write → **Core config
      ingestion confirmed** → restore. A lease that ends at spawn is insufficient: a sibling launch
      can replace the bytes before the first engine reads them.
- [ ] **PRF-06**: A launch killed mid-flight leaves the user's global config byte-identical to its
      pre-launch state, proven by a real kill test, not a simulated one.
- [ ] **PRF-07**: A user edit made to the global config *during* the launch window survives, proven
      by a test that performs the edit inside the lease window.
- [ ] **PRF-08**: Genuinely project-scoped project-config writes are retained; only the profile
      block moves. No unrelated behaviour changes.

### Phase K-02 — Honest failure surfacing

- [ ] **DIA-01**: An engine that refuses to start surfaces the engine's own stderr reason in the UI,
      secret-scrubbed through the existing `SECRET_PATTERNS`, replacing the contract-layer abstraction
      "wcore Desktop contract rejected ready".
- [ ] **DIA-02**: Stripped-config and profile-resolution failures are distinguishable in the surfaced
      reason, so the next occurrence of the 0.12.26 class of failure is diagnosable from the UI alone.

### Phase K-03 — The turn that never finishes

- [ ] **TRN-01**: A turn that Core ends is shown as ended. Core emits `stream_end` with
      `finish_reason: 'stop'`; the UI must leave the running state.
- [ ] **TRN-02**: The no-tools-found and error paths also terminate the running state.
- [ ] **TRN-03**: A regression test drives a `stream_end` carrying no assistant text and asserts the
      UI leaves the running state.

### Phase K-04 — Engine asks and release-candidate policy

- [ ] **ENG-01**: Core receives the written ask for a session-local MCP selection flag —
      `--mcp-server <ID>` repeatable plus `--no-mcp-servers` for the explicit empty set — applied
      after all config and profile merging, retaining exactly those IDs; unknown ID is a fatal startup
      error naming the missing IDs; host-provided, session-local, never persisted; applied
      independently of workspace trust and assistant identity.
- [ ] **ENG-02**: Core receives the misleading-error report: "Profile not found" is raised for a
      profile that was present in a file Core parsed and then discarded.
- [ ] **ENG-03**: Core is asked to confirm intent on the wire-added-stdio question before it ships.
      An **uncommitted** local edit refusing wire-added stdio MCP servers was observed; at
      `v0.12.26-rc.2` stdio **is** still accepted. This is raised as a forward-compatibility question,
      never asserted as shipped behaviour — if it lands it kills Desktop's `add_mcp_server` stdio path.
- [ ] **RCI-01**: The release-candidate integration decision is written down. `build-with-builder.js`
      deliberately uses `prepareWaylandCore.DEFAULT_WCORE_VERSION` with `requireVerified: true` so a
      **packaged** build can never carry an RC — that is correct and stays. Any new flag defaults OFF.

> ─────────── Master Class is safe at this line ───────────
> Phases `K-01` … `K-04` must ship independently of everything below.

### Phase K-05 — Agent installer: npm subset

- [ ] **INS-01**: An agent from the npm-installable subset installs from the Settings panel, is then
      detected by the existing `AgentRegistry`, and a chat runs on it — proven on a clean VM per OS.
- [ ] **INS-02**: Installation never uses `curl | sh`. It goes through the package manager the tool
      actually publishes to, with a pinned version and a verified checksum, matching the bundled
      engine's posture. A tool offering only a shell installer does not ship in this phase.
- [ ] **INS-03**: Every install requires explicit per-install consent. No silent background install.
- [ ] **INS-04**: Windows is first-class: PATH, `.cmd` shims, and the `shell:false` spawn trap
      already hit with `npx` (`mcpStdioSpawn.ts`) are all handled, proven on the Windows box.
- [ ] **INS-05**: Uninstall exists and removes exactly what was installed, **by manifest, not by
      name**, returning the machine to its prior state.

### Phase K-06 — Agent installer: non-npm channels

- [ ] **INS-06**: The non-npm channels extend the same manifest, consent, checksum, and uninstall
      contract as `INS-02` … `INS-05`. No channel weakens it.

### Phase K-07 — Flux fan-out

- [ ] **FAN-01**: After install, Wayland writes the agent's own config so its provider base URL points
      at Flux and its model list is the Flux pinned catalog. On a fresh machine: connect Flux, install
      the agent, open it, select a non-Anthropic pinned model, get a correct answer — per supported
      agent, on all three OSes.
- [ ] **FAN-02**: API key and base URL only. **Never Claude subscription OAuth** — standing hard NO on
      ToS grounds. This feature touches subscription auth on no agent.
- [ ] **FAN-03**: The user sees every config file Wayland modified and can undo it. No key is written
      into a file we do not own without saying so.
- [ ] **FAN-04**: An agent whose config was rewritten keeps working if the user later removes Flux —
      restore, do not strand.
- [ ] **FAN-05**: Pinned models are filtered per agent capability. A model offered in an agent must
      actually work there; a pinned model that 500s in Claude Code is worse than not offering it.

### Phase K-08 — Milestone verification

- [ ] **PRF-09**: Full suite green on the final merged state before any pass claim. Baseline to beat:
      **16,231 tests, 0 failures**.
- [ ] **DIA-03**: A live end-to-end user sweep on the **packaged** artifact — not dev mode — covering
      the Master Class path: install TVControl from the Library, select Wayland Core, run a prompt,
      execute a chart tool, see the turn finish.

### Out of scope for WLD-K

- Migrating existing `@native` users onto a Desktop-owned named profile. The user-owned-file risk is
  real but that migration carries `memory.db`, credentials, skills and a hand-edited config; it is an
  explicit, validated, rollback-capable project, not a selector change.
- Option F (`only_for_assistant` scoping) as the primary narrowing mechanism. It can only *restrict* —
  an unmarked server is always injected — so it cannot enforce an exact per-chat allow-list, and one
  missed marking is a cross-chat tool leak. Retained only as possible later defence-in-depth.
- Option C (ephemeral `WAYLAND_HOME` root). The config root also holds `memory.db` and skills, so an
  ephemeral root destroys memory continuity and Core refuses to let symlinks restore it.
- `--trust-workspace` in any form. Reverted in `3ebacf41c` and not to be reopened.

### Standing constraints that bind every WLD-K phase

- No merge, tag, or release without the owner. `build-and-release.yml` fires on **any** tag.
- Never commit `src/process/services/constitution/constitutionFsAuthority.generated.ts`.
- Never weaken the security shell: `sandbox: true`, `contextIsolation: true`,
  `nodeIntegration: false`, CSP, `bridgeAllowlist.ts`, `urlValidation.ts`, DOMPurify, `safeStorage`.
  Never touch the signing pipeline. No forged attestations; any new flag defaults OFF.
- `migrations.ts` `aionrs` SQL literals never change. `FoundrySkills` / `foundry-skills` is never
  renamed. `prek run --all-files` is forbidden. No history rewriting. No AI attribution trailers.
- TVControl's `ui_evaluate` stays disabled behind `TV_MCP_ADVANCED=1`; no packet flips it.

---

_WLD-K requirements defined: 2026-08-08, from `.planning/MILESTONE-WLD-K-core-first.md` and a
two-round cross-research convergence between Codex 5.6 Sol and Kimi K3. 30 requirements mapped
exactly once across phases `K-01` … `K-08`._
