# Roadmap: Wayland Desktop Adaptive Cockpit and Cowork

> ## ▶ 2026-07-21 RECONCILIATION — READ FIRST (supersedes conflicting detail below)
>
> The 2026-07-20 pivot **killed** the cohort/M0B external-cohort acceptance ceremony.
> Acceptance is now **Sean + Claude live-test together; a green Playwright sweep IS acceptance.**
> The 7-phase / 40-packet model below is preserved as the audit trail but is recast into
> **three milestones**. Where the detailed sections below describe cohort/M0A/M0B/`wayland-gsd-gate`
> promotion, **that model is SUPERSEDED** — see the banners on those sections.
>
> **Reconciled Phase-1 truth (verified against git + source, 2026-07-21):**
>
> - **Accepted-by-live-test (construction complete):** the 20 non-cohort safety packets
>   (01-06/07/08/09/10/11/12/13/15/16/19/20/21/22/24/35/36/37/38/40) — all ship in Desktop
>   v0.11.18, code present + wired + tested, exercised by the live sweep + full green suite (15,510 pass).
> - **SUPERSEDED — do not build:** the 20 cohort/M0B packets. 14 acceptance/ceremony
>   (01-03/04/05/14/17/18/25/26/27/28/29/30/31/39) + 6 construction whose code was DELETED
>   in `9b661a948` (01-01/02/23/32/33/34).
> - **Phase 1 = CLOSED, accepted-by-live-test.** Zero remaining construction. The per-packet
>   SUMMARY/independent-audit ceremony is superseded by the same pivot.
>
> **The three milestones (the live plan):**
>
> - **Milestone A — Cockpit Preview Ship** (ACTIVE): Wave A package + matched-engine smoke ·
>   Wave B trust/a11y floor · Wave C hygiene. (Replaces old "Phase 6 Preview" ROL-01/02/03,
>   which were the killed cohort rollout — SUPERSEDED, NOT relabeled.)
> - **Milestone B — Scope Decisions** (parallel, non-blocking): COW-04/05/06, SBX-02, IMG-01,
>   VOC-04, CMP-01 — a decisions ledger, not build work.
> - **Milestone C — Secure Portability** (deferred): the old Phase 7 transfer engine. Does not block preview.
>
> The `execution/` packet adapter + `wayland-gsd-gate` verifier are **DORMANT** (part of the killed
> ceremony). STATE.md + this reconciliation section are the source of truth for `/ferrox-progress`.
> Wave A + B are tracked as new `NN-NN-PLAN.md` packets under `phases/WLD-A-preview-ship/`.
>
> **▶ 2026-07-30 — Milestone WLD-I (Licence Compliance) is ACTIVE.** Its ten phases (`I-01` …
> `I-10`) are appended at the **end of this file** under `# Milestone WLD-I — Licence Compliance`.
> Nothing in Milestones A/B/C or the Phase 1-7 wave model is renumbered by it.

## Overview

The roadmap preserves the master plan's seven dependency waves as the seven active phases: establish recovery and producer truth, migrate over shared state, deliver the daily cockpit, reveal power and trusted outcomes, harden exact release artifacts, run evidence-gated preview cohorts, and then deliver secure full-instance portability. The 33 synthesized source requirement families plus the user-reported image/vision parity gap are normalized into 55 atomic current-milestone acceptance slices and 13 queued next-milestone slices so packet ownership and proof closure stay falsifiable without losing source provenance.

## Phases

**Phase Numbering:** sequential. Phases 1-7 are the preserved master-plan waves and the complete active milestone.

> Reconciled status per the 2026-07-21 header. Original goals retained as trail.

- [x] **Phase 1: Safety Foundation** - CLOSED, accepted-by-live-test (20 non-cohort packets ship; 20 cohort packets superseded).
- [x] **Phase 2: Migration Skeleton** - Construction ships in v0.11.18 (never separately GSD-decomposed).
- [x] **Phase 3: Daily Cockpit** - Construction ships in v0.11.18 (never separately GSD-decomposed).
- [x] **Phase 4: Power and Outcomes** - Ships; residual scope calls tracked as **Milestone B**.
- [x] **Phase 5: Release Hardening** - Folded into **Milestone A** (package + smoke).
- [ ] **~~Phase 6: Preview~~ → Milestone A** - SUPERSEDED cohort rollout (ROL-01/02/03); replaced by Milestone A package + smoke + trust floor.
- [ ] **Phase 7: Secure Portability → Milestone C** - Deferred; encrypted full-instance transfer. Does not block preview.

## Phase Details

### Phase 1: Safety Foundation

**Goal**: Users' existing work, authority, and recovery options are protected by accepted engineering and observation evidence before Cockpit or related capabilities can promote.
**Depends on**: Nothing (first phase)
**Requirements**: SAF-01, SAF-02, SAF-03, SAF-04, SAF-05, CORE-01, CORE-02, FLUX-01, MCP-01, SBX-01, COW-01
**Success Criteria** (what must be TRUE):

1. **SAF-01:** A user can preserve, inspect, recover, downgrade, and re-upgrade representative work through the signed target matrix without silent loss, authority widening, or direct launch of an old binary against unclassified future state.
2. **SAF-02:** M0B replaces the hard-coded cohort with one closed, persisted, main-process-authoritative assignment; process-owned Classic instrumentation covers session terminals, all five journeys, crashes, support, accessibility, and zero-tolerance incidents; only then does a real 14-calendar-day four-cohort observation produce signed `M0B.json`.
3. **SAF-03:** Stored legacy `chat`/`cowork` values migrate to canonical `ask`/`trusted-edits`, no other persistent authority vocabulary remains, signed v0.11.8 interprets downgrade state conservatively, and re-upgrade preserves effective authority without widening it.
4. **SAF-04:** Deleting a chat preserves referenced, scheduled, artifact-bearing, modified, and unknown managed workspace content; only proven empty abandoned shells may be classified for later human review, and Phase 1 has no quarantine or deletion authority.
5. **SAF-05:** Implementation, fixture acceptance, packaging, deployment, canary, release, and cohort acceptance remain separately recorded states; no earlier state or skipped proof mints a later one.
6. **CORE-01:** Desktop pins the published Core commit, contract version, generator, schema digest, fixture digest, and source-input identity and rejects drift.
7. **CORE-02:** Every Core fixture replays through the real Desktop decoder, normalizer, reducer, and presentation seam; malformed/critical/ordering/terminal/trust failures fail closed.
8. **FLUX-01:** The pinned Flux corpus replays route, attempt, retry, fallback, terminal, cost, and degraded evidence with full correlation; absent trusted live delivery keeps dependent claims disabled.
9. **MCP-01:** MCP declaration, authentication, probe, and publication remain distinct; failed add/import/publication paths fail closed and none can mint chat-ready or live-session status. Persistent lifecycle/session readiness is Phase 3 `MCP-02`.
10. **SBX-01:** Desktop exposes only schema-valid Core settings and distinguishes requested policy from correlated producer-enforced policy; unsupported controls and false-green effective states remain absent or explicitly unavailable.
11. **COW-01:** C0-A proves OfficeCLI executable/skill contract lockstep, unchanged caller authority, and current-host-only execution with no reachable hosted fallback. Any future fallback requires a separately accepted explicit-consent contract before it can be introduced; C0-A does not claim Phase 2 C0-B or Phase 5 six-target signed-app closure.
    **Plans**: 40 executable plans in eleven dependency-derived waves.

> **▶ RECONCILED 2026-07-21.** Phase 1 = CLOSED, accepted-by-live-test. Of the 40: the 20 non-cohort
> packets (01-06/07/08/09/10/11/12/13/15/16/19/20/21/22/24/35/36/37/38/40) ship in v0.11.18 and are
> accepted via live-test + green suite. The 20 cohort/M0B packets are **SUPERSEDED — do not build**:
> ceremony 01-03/04/05/14/17/18/25/26/27/28/29/30/31/39 (all `autonomous:false`) + construction
> 01-01/02/23/32/33/34 (code DELETED in `9b661a948`). The wave list below is historical trail.

- **Wave 1:** 01-40 bounded GSD execution adapter.
- **Wave 2:** 01-01 cohort authority; 01-06 authority inventory/capture/quiescence; 01-08 workspace preservation; 01-11 MCP declaration/catalog/CRUD/probe; 01-13 OfficeCLI supply-chain lockstep; 01-37 repository target-verifier v2 implementation.
- **Wave 3:** 01-02 cohort observer/repository core; 01-10 Flux local consumer construction; 01-12 SBX read-only truth projection; 01-15 Constitution transform/replay; 01-16 canonical authority downgrade/re-upgrade; 01-19 deterministic Classic v0.11.18 baseline; 01-21 packaged-Core provenance; 01-23 immutable M0B usability protocol; 01-24 C0-A authority/fallback construction; 01-35 MCP backend publication/session receipts; 01-38 exact-byte external target-verifier installation and pin proof.
- **Wave 4:** 01-07 historical artifact/isolated-launch trust; 01-25 cohort-authority acceptance; 01-28 Flux producer acceptance; 01-30 SBX M1S-0 acceptance; 01-31 C0-A acceptance; 01-32 conversation/Project/Cowork/developer cohort bindings.
- **Wave 5:** 01-33 automation/crash/support/accessibility cohort bindings.
- **Wave 6:** 01-09 Core contract consumer replay; 01-22 Core/Gemini/ACP backend-state authority ledger; 01-34 cohort production integration and E2E.
- **Wave 7:** 01-20 exact historical transaction corpus; 01-26 instrumentation acceptance; 01-36 MCP chat-readiness/ToolSearch withholding.
- **Wave 8:** 01-03 authorized M0B Day-0 start; 01-18 immutable complete six-target M0A harness; 01-29 MCP M1M-0 acceptance.
- **Wave 9:** 01-04 real 14-calendar-day observation completion; 01-39 six-target M0A execution and acceptance.
- **Wave 10:** 01-05 independent signed M0B decision; 01-17 mutually exclusive live M1F or NO-FLUX-CLAIMS acceptance; 01-27 Core M1 acceptance.
- **Wave 11:** 01-14 authenticated aggregate acceptance sentinel, intentionally open until Phase-5 exact-package proof closure.
  **Status note** (⛔ HISTORICAL — superseded 2026-07-21; Phase 1 = CLOSED, accepted-by-live-test): ~~**IN PROGRESS.**~~ Current baseline already has production controller wiring and consent/window UI, contrary to the stale historical ledger. Its hard-coded cohort blocks valid observation; see `.planning/intel/PHASE-1-IMPLEMENTATION-RECON.md`. The installed schema-v1 gate also lacks target authentication: 01-37 must implement v2 and 01-38 must separately install/pin the exact bytes before any packet-acceptance plan can run. No later implementation, prerequisite-only gate result, or receipt may infer this phase complete.
  **UI hint**: yes

### Phase 2: Migration Skeleton

**Goal**: Users can move between Classic and Cockpit over one canonical work model without state migration, duplicated authority, or false continuity.
**Depends on**: Product order follows Phase 1; executable M2/M3/C0-B plans may start only when their exact packet gates pass, while M0B remains required before cohort promotion
**Requirements**: KRN-01, AUTH-01, HND-01, CMP-01, SHL-01, COW-02
**Success Criteria** (what must be TRUE):

1. **SHL-01:** A user can switch Classic and Cockpit during idle, streaming, approval, workspace, restart, and injected Cockpit failure states while preserving the same conversation, Project, route, data, and authority.
2. **KRN-01 / AUTH-01:** Every supported backend projects identity, lifecycle, activity, policy, capability, economics, outcomes, validation, and evidence through one bounded execution model; missing or conflicting critical evidence fails visibly and requested authority remains distinct from producer-reported/effective authority.
3. **COW-02:** Cowork, developer, Voice, automation, and connector readiness consume one validated capability manifest with explicit `enforced`, `brokered`, or `advisory` semantics rather than provider identity or skill-library breadth, and the C0-B target-exact component proof is accepted.
4. **HND-01:** Provider replacement occurs only at an inspectable checkpoint that distinguishes preserved Desktop-owned state from lost backend-owned state and unresolved side effects.
5. **CMP-01:** The shared model and capability manifest compile and replay their contracts through the standalone Web/Cloud composition root; this compatibility proof does not claim Community Cloud, Hosted Pro, deployment, or product readiness.
   **Plans**: TBD
   **UI hint**: yes

### Phase 3: Daily Cockpit

**Goal**: A novice can start with an outcome and an expert can inspect routing, scope, policy, connectors, and developer grants without leaving the ordinary chat journey.
**Depends on**: Product order follows Phase 2; executable M4/M5/MCP/SBX plans use their exact packet gates and consume the named Phase 1 contracts rather than waiting on unrelated siblings
**Requirements**: NAV-01, HOME-01, PRJ-01, RUN-01, MCP-02, SBX-02, EXT-01, IMG-01
**Success Criteria** (what must be TRUE):

1. **HOME-01:** A clean-install user can state a meaningful outcome, see only required connection/permission choices, and reach a verified first artifact in under ten minutes without selecting an internal mode.
2. **NAV-01:** Home and navigation expose New chat, Search, Chats, Projects, Library, Automations, Activity, and Settings while keeping execution detail contextual and every legacy capability deliberately reachable.
3. **PRJ-01:** A user can create or open a named Project, start a related chat, reuse its shared context, and retain its artifacts across that Project; an optional execution workspace remains scope attached to work and never becomes or renames the Project.
4. **RUN-01:** Thread activity and the adaptive mission rail derive from the same canonical event history, expose honest plan/output/approval/terminal progress, and never create a parallel task state.
5. **MCP-02:** One provider-neutral connector lifecycle distinguishes declaration, authentication, probe, publication, restart, exact live-session registration, discovery, invocation, degradation, and revocation; no saved/probed connector appears chat-ready without its correlated session receipt.
6. **SBX-02:** A developer can grant and revoke one Project-scoped localhost/toolchain capability while metadata, private-network, redirect/rebinding, other-Project, remote, channel, schedule, and Cloud paths remain blocked.
7. **EXT-01:** Returning users can inspect agent, model route, scope, effective policy evidence, cost basis, and relevant tools with no more friction than Classic.
8. **IMG-01:** A user can attach an image in the ordinary composer and receive a correlated vision-capable response with MIME/content identity preserved; routing chooses only a proven image-capable adapter/model, strips incompatible or deprecated parameters such as unsupported `top_p`, reports unsupported/degraded capability without inventing a credential diagnosis, and fails closed on malformed or silently dropped images. Hostile fixtures cover loss, incompatible selection, malformed payloads, fallback/retry correlation, cleanup, and privacy; Phase 5 replays the journey with real image input through every claimed packaged provider/adapter and target, or image capability and claims are physically absent.
   **Plans**: TBD after mandatory phase-specific import
   **Phase import gate**: Before discussion or planning, import and reconcile `docs/desktop-overhaul-source/MCP-DEEP-DIVE.md`. Preserve Phase 1's MCP-0 non-promoting boundary and plan the remaining lifecycle packets here; do not treat the deep dive as already implemented or drop it.
   **UI hint**: yes

### Phase 4: Power and Outcomes

**Goal**: Users can steer substantial knowledge, development, automation, and Voice work through contextual projections over the same chat, Project, authority, and execution history.
**Depends on**: Phase 3 plus trusted receipt, C0-B, C1-entry, and M5V-A dependencies from the master plan
**Requirements**: WBK-01, OUT-01, POW-01, COW-03, COW-04, COW-05, COW-06, MCP-03, VOC-01, VOC-02, VOC-03, VOC-04
**Success Criteria** (what must be TRUE):

1. **WBK-01:** Quick chat remains uncluttered while substantial work activates a contextual Workbench whose thread, plan, outputs, approvals, receipts, and terminal state project the same canonical event history without a competing mode or store.
2. **OUT-01:** Reported, structurally validated, integrity-checked, verified, receipt-stale, and source-dependency-stale outcomes remain distinct; only trusted observed evidence can advance an artifact through its lifecycle.
3. **POW-01:** Files, changes, terminal, tests, preview, sources, artifacts, Teams, Automations, Library, and Activity appear when relevant, remain directly reachable by experts, preserve provenance, and create no parallel stores.
4. **COW-03:** Both a Cowork starter and a plain-language request enter through the ordinary composer and use the same chat route and backend-neutral work kernel.
5. **COW-04:** The mandatory first DOCX/PDF vertical records source identity and citations through a durable ledger that survives revision and delivery.
6. **COW-05:** The first DOCX/PDF vertical declares target type, performs type-aware validation, exposes honest validation limits, and scopes revisions without silently rewriting accepted content.
7. **COW-06:** A user can bring sources through the ordinary composer, steer a plan, review and revise a cited target-declared DOCX/PDF artifact, inspect receipts and validation, and deliver it without a Cowork mode switch or provider lock-in.
8. **MCP-03:** ToolSearch discovery is bounded by the correlated active-session capability manifest; stale, revoked, merely saved, or untrusted connector claims cannot become callable tools or self-promote outcomes.
9. **VOC-01:** Chat and Voice enter and leave the same canonical conversation, Project, execution, and artifact state without transcript or authority forks.
10. **VOC-02:** Voice exposes honest accessible listening, thinking, speaking, approval, interruption, cancellation, failure, and recovery states with deterministic interruption.
11. **VOC-03:** Voice authority never exceeds the current conversation policy, while local/hosted provider, audio retention, privacy, and cost remain explicit before consequential use.
12. **VOC-04:** Provider-neutral speech adapters emit one authoritative VoiceReceipt whose provider, transcript identity, timing, usage, cost, and terminal state derive from observed boundaries rather than model claims.
    **Plans**: TBD
    **Scope boundary**: This phase owns the first C1 vertical and functional Voice receipt only. Broad source coverage, full native-format parity, and ecosystem outcome loops remain queued for the next Cowork milestone; packaged Voice closure remains in Phase 5.
    **UI hint**: yes

### Phase 5: Release Hardening

**Goal**: Users can install, update, use, recover, and roll back the exact signed Desktop candidate across supported targets with trustworthy accessibility, security, performance, and support evidence.
**Depends on**: Phases 1-4 feature and contract receipts; capability-specific dependencies must be green or physically absent from the candidate and its claims
**Requirements**: PKG-01, REC-01, UPD-01, MCP-04, SBX-03, VOC-05, QA-01, QA-02, SEC-01
**Success Criteria** (what must be TRUE):

1. **PKG-01:** Exact signed/package artifacts on macOS arm64/x64, Windows arm64/x64, and Linux arm64/x64 pass the claimed critical journeys and bind source, resources, producer contracts, architecture, signature, and package identity.
2. **REC-01:** The aggregate install, Classic/Cockpit switch, representative-work restore, signed rollback, conservative downgrade, and delta-safe re-upgrade sequence passes without silent loss or authority widening.
3. **UPD-01:** A user can invoke “Install and restart,” return on the intended version with running work preserved, and recover via an independent signed download/rollback when apply, relaunch, marker reconciliation, signature, or elevation fails; support can emit bounded redacted evidence and a continuation summary.
4. **MCP-04:** The packaged MCP transport, authentication, backend, lifecycle, and adversarial corpus—including J9—passes on every claimed target, or MCP capability and claims are physically absent.
5. **SBX-03:** The packaged sandbox/browser/toolchain proof—including J25—passes with truthful requested-versus-enforced policy and bounded grants on every claimed target, or the capability is physically absent.
6. **VOC-05:** When Voice is included, deterministic race, transcript identity, privacy, keyboard, screen-reader, reduced-motion, and packaged audio I/O evidence passes on every claimed target; otherwise Voice is physically absent from the candidate and claims.
7. **QA-01:** Keyboard, focus order, zoom, reduced motion, screen-reader semantics, and contrast gates pass across the supported critical journeys and exact packages.
8. **QA-02:** Long-chat, activity, Library, CPU, memory, latency, subprocess cleanup, and bundle budgets pass their declared thresholds on exact packages.
9. **SEC-01:** Runtime-reachable dependency, extension, IPC, credential, archive, update, and producer-evidence risks have zero unresolved in-scope findings, or the affected capability is physically absent; receipts keep proof layers distinct and bind the exact candidate.
   **Plans**: TBD
   **UI hint**: yes

### Phase 6: Preview

> **⛔ SUPERSEDED — pivot 2026-07-20.** ROL-01/02/03 below are the cohort-gated staged-rollout
> ceremony that was killed. They are NOT satisfied by, and are NOT relabeled as, Milestone A
> (package + smoke + trust floor). Preview acceptance is now the live-test sweep. Retained as trail.

**Goal**: Users receive Cockpit only as cohort evidence proves verified value, safe recovery, and a better or equal experience to Classic.
**Depends on**: Phases 1-5, including both M0A and signed M0B plus immutable release receipts
**Requirements**: ROL-01, ROL-02, ROL-03
**Success Criteria** (what must be TRUE):

1. **ROL-01:** Evidence measures signed-install-to-launch, launch-to-verified-artifact, completed tasks, retained workspaces/automations, accepted outputs, recovery/intervention, share/remix, update health, support burden, failures, and return-to-Classic reasons rather than vanity activity.
2. **ROL-02:** Internal dogfood, invited alpha, opt-in beta, and default-new expansion occur only at declared thresholds with exact denominators, sample/soak minimums, and a named decision owner; data loss, corruption, authority widening, approval bypass, cross-Project leakage, receipt forgery, failed recovery, or repeated mental-model failure automatically holds or rolls back the cohort.
3. **ROL-03:** A user can switch back to Classic immediately with the same work and follow a published support/rollback matrix; Cockpit default and Classic retirement remain separate evidence decisions and Classic retirement is unapproved in this milestone.
   **Plans**: TBD
   **UI hint**: yes

### Phase 7: Secure Portability

**Goal**: An authorized user can transfer a complete supported Wayland instance through an encrypted, dry-run-first, reversible process without secret disclosure, broken identity, silent loss, or widened authority.
**Depends on**: Phase 1 quiescence/recovery authority, Phase 4 object ownership, and Phase 6 supported schema set; import `INSTANCE-MIGRATION.md` before planning
**Requirements**: XFER-01, XFER-02, XFER-03, XFER-04, XFER-05, XFER-06
**Success Criteria** (what must be TRUE):

1. **XFER-01:** An owner can create a destination-bound or recovery-encrypted bundle whose metadata, chunks, manifest, cryptographic suite, KDF bounds, nonce use, and signer identity authenticate under a fixed downgrade-resistant boundary before any destination mutation.
2. **XFER-02:** Export requires a distinct, current source-principal authorization for the declared scope; ordinary read access, bundle possession, or stale consent cannot mint export authority.
3. **XFER-03:** Destination key issuance, dry-run approval, and final mutation/publication are distinct current-principal checks; bundle or key possession alone never authorizes destination mutation.
4. **XFER-04:** Export captures one quiesced mutation epoch across every registered durable store and publishes only after reopen, decrypt, hash, reference, and complete object-graph validation.
5. **XFER-05:** Import stages non-executable content, rejects hostile archives and policy drift, maps identities and conflicts deterministically, preserves immutable receipts, creates a recovery point, and keeps consequential objects paused or quarantined until separately approved.
6. **XFER-06:** A representative instance transfers twice across supported Desktop/Cloud compatibility pairs under fault, replay, adversarial, provenance, restart, re-authentication, restore, and resumed-work tests with no silent semantic loss or authority widening.
   **Plans**: TBD after mandatory phase-specific import
   **UI hint**: yes

## Queued Next-Milestone Requirements

These are deliberately outside active Phase 1-7 execution authority:

- **Cowork Expansion:** ADV-01, ADP-02, COWX-01, COWX-02, COWX-03, COWX-04, ARTX-01.
- **Managed Workspace Lifecycle:** WSLX-01 after the trusted output/receipt ledger exists; Phase 1 retains preservation and review classification only.
- **Cloud/Pro and Distribution:** DIST-01, CLOUD-01, CLOUD-02, CLOUD-03, CONN-02.

They require a new-milestone discussion, requirements split, roadmap, and acceptance review. Phase 4 proves only the first C1 cited DOCX/PDF vertical; shared Web/Cloud compilation proves only composition compatibility.

## Packet-Level Dependency and Promotion Rule

> **⛔ SUPERSEDED — pivot 2026-07-20.** The M0A/M0B receipt-gated promotion model, the
> `wayland-gsd-gate` external verifier, and the aggregate-acceptance sentinel (01-14) are killed.
> Acceptance is now the live-test sweep. This section + the "Evidence State Model", "Master Contract
> Coverage", and SC-xx/INV-xx/journey traceability tables below are retained as trail only — they no
> longer gate anything.

The seven phases preserve product and evidence order, but they are not whole-phase construction barriers. A packet may start as soon as its exact upstream packet receipts are accepted:

- M0A and the pinned M1/M1F/M1M/M1S/C0-A contracts may unlock their named Phase 2-4 construction slices while M0B's 14-day Classic observation is still running.
- M2/M3/C0-B, M4/M5, and M6/M7/C1/M5V-A remain bound to the dependency graph in master-plan sections 7-8; one unlocked packet never authorizes a sibling whose own inputs are red.
- M0B observation may therefore overlap dependency-safe Phase 2-4 implementation and proof work. It may not authorize real-user enrollment, invited alpha, release promotion, capability marketing, or any claim that Phase 1 is complete.
- Phase 5 exact-candidate closure, Phase 6 cohort expansion, and every Sean-only merge/release/deploy action remain blocked until all named engineering, observation, capability, and package receipts are green.

GSD therefore executes these waves inside one canonical milestone through receipt-gated cross-phase plans rather than pretending a normal sequential phase-close is available. Phase 1 remains open until its named engineering and signed M0B evidence are accepted; dependency-safe Phase 2-4 plans may advance only after the separately installed `wayland-gsd-gate` verifier authenticates exact accepted receipts and byte-exact control-plane files against an external anchor, while Phase 5 owns exact-package aggregate replay. GSD's separately namespaced workstreams are not used as the packet DAG. This preserves the source gates and prevents the progress display from misrepresenting concurrent construction as acceptance.

Phase 1 includes an intentionally open aggregate-acceptance sentinel. Bounded plan waves may execute, but standard full-phase completion is prohibited until that sentinel verifies signed M0B and every named Phase 5 proof closure. Parallel builders run only in manually created clean worktrees bound to one plan each; ownership and sequential seams are checked before launch, and integration is serial.

This is deliberate critical-path concurrency: packet/plan dependencies govern construction; complete phase evidence governs promotion.

## Execution Constraint Coverage

All 24 synthesized constraints remain mandatory even though product requirements map exactly once. Primary phase ownership is defined in `.planning/PROJECT.md`; the critical replay chain is:

| Constraint group                                                                     | Primary phase                            | Required replay                                                                                          |
| ------------------------------------------------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| M0 application-consistent recovery, rollback, historical corpus, package provenance  | Phase 1                                  | Phases 2, 5, 6, and 7 consume immutable M0A receipts                                                     |
| M0B 14-day observation, usability protocol, thresholds, denominators, decision owner | Phase 1                                  | Phase 6 consumes the independently signed M0B receipt                                                    |
| Core producer schema/fixtures, critical compatibility, ownership, receipts           | Phase 1                                  | Phases 2-5 replay through real decoders/reducers and exact packages                                      |
| Flux route/attempt/fallback/cost fixtures and reconciliation                         | Phase 1                                  | Phases 2, 3, 4, and 5 disable dependent claims when evidence is absent                                   |
| MCP declaration-to-live-session lifecycle                                            | Phase 3 after mandatory deep-dive import | Phases 4-5 require correlated session receipts or physical absence                                       |
| Requested/effective authority and backend-neutral schema                             | Phase 2                                  | Phases 3-7 consume shared selectors and never infer enforcement                                          |
| Shared-state strangler, shell isolation, Classic preservation                        | Phase 2                                  | Phases 3-6 continuously regression-test R1 fallback                                                      |
| Multi-layer verification and exact evidence receipts                                 | Phase 5                                  | Phases 6-7 may consume but never upgrade narrower evidence; queued milestones require their own evidence |
| Pre-execution audit, packet dependencies, stop conditions, definition of done        | Phase 1                                  | Applies to every phase; no unresolved in-scope HIGH may be hidden by roadmap status                      |

## Evidence State Model

| State                   | Meaning                                                                               | Cannot imply                                        |
| ----------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Code present            | Source exists at the current baseline                                                 | Accepted behavior, package proof, or user readiness |
| Fixture/contract proven | Pinned producer identity and immutable corpus replay through real consumer boundaries | Exact signed package behavior or cohort readiness   |
| Package proven          | Exact candidate/resources pass claimed platform journeys                              | M0B observation or product adoption                 |
| M0A accepted            | Engineering safety passes on copied/disposable representative state                   | M0B acceptance or invited alpha by itself           |
| M0B accepted            | Signed observation/cohort protocol and baseline pass                                  | Recovery engineering or release closure by itself   |
| Release accepted        | Required exact-candidate receipts pass and unready capabilities are physically absent | Sean's merge/release/deploy/issue-close action      |
| Cohort accepted         | Comparative metrics pass the declared gate                                            | Classic retirement or Cloud/Pro readiness           |

## Master Contract Coverage

These IDs remain normative from `MASTER-BUILD-PLAN.md`; requirement traceability does not replace them. “Implementation phase” is where the named packet builds or integrates the contract. “Proof closure” is the earliest phase that can close the preview claim; Phase 5 still replays every active invariant, criterion, and journey through the exact candidate, and Phase 6 may only consume that evidence.

### Invariants

| Contract | Packet owner(s)                                                   | Implementation phase(s) | Proof closure |
| -------- | ----------------------------------------------------------------- | ----------------------- | ------------- |
| INV-01   | M4; aggregate M8/M9                                               | 3, 5-6                  | Phase 5       |
| INV-02   | M5, C1, M5V-A; aggregate M8/M9                                    | 3-6                     | Phase 5       |
| INV-03   | M4; aggregate M8/M9                                               | 3, 5-6                  | Phase 5       |
| INV-04   | M2, M3, C1, M5V-A; aggregate M8/M9                                | 2, 4-6                  | Phase 5       |
| INV-05   | M0A, M3; aggregate M8/M9                                          | 1-2, 5-6                | Phase 5       |
| INV-06   | M1, M1F, M1M, M2, M5, C1, M5V-A, M6; aggregate M8/M9              | 1-6                     | Phase 5       |
| INV-07   | M7; aggregate M8/M9                                               | 4-6                     | Phase 5       |
| INV-08   | M1F, M1M, C0, M2, M5, C1, M5V-A; aggregate M8/M9                  | 1-6                     | Phase 5       |
| INV-09   | M1, M1F, M1M, M1S, C0, M2, M5, C1, M5V-A, M6, M7; aggregate M8/M9 | 1-6                     | Phase 5       |
| INV-10   | M1, M6; aggregate M8/M9                                           | 1, 4-6                  | Phase 5       |
| INV-11   | M1F, M1M, M1S, C0, M4, M5V-A, M7; aggregate M8/M9                 | 1, 3-6                  | Phase 5       |
| INV-12   | M0A, M3; aggregate M8/M9                                          | 1-2, 5-6                | Phase 5       |
| INV-13   | M0A, M3; aggregate M8/M9                                          | 1-2, 5-6                | Phase 5       |
| INV-14   | M1, M1M, C1, M6; aggregate M8/M9                                  | 1, 4-6                  | Phase 5       |
| INV-15   | M2, C1, M5V-A; aggregate M8/M9                                    | 2, 4-6                  | Phase 5       |
| INV-16   | M4; aggregate M8/M9                                               | 3, 5-6                  | Phase 5       |
| INV-17   | M1M, M1S, C0, M2, C1, M5V-A; aggregate M8/M9                      | 1-2, 4-6                | Phase 5       |
| INV-18   | C0, C1; aggregate M8/M9                                           | 1-2, 4-6                | Phase 5       |
| INV-19   | M1M, M5V-A; aggregate M8/M9                                       | 1, 4-6                  | Phase 5       |
| INV-20   | C0; aggregate M8/M9                                               | 1-2, 5-6                | Phase 5       |
| INV-21   | M1S; aggregate M8/M9                                              | 1, 3, 5-6               | Phase 5       |

### Success criteria

| Contract | Packet owner(s)                                      | Implementation phase(s) | Proof closure                             |
| -------- | ---------------------------------------------------- | ----------------------- | ----------------------------------------- |
| SC-01    | M4; aggregate M8/M9                                  | 3, 5-6                  | Phase 5                                   |
| SC-02    | M0A, M3; aggregate M8/M9                             | 1-2, 5-6                | Phase 5                                   |
| SC-03    | M4, M8, M9                                           | 3, 5-6                  | Phase 5; Phase 6 replays before expansion |
| SC-04    | M4, M7; aggregate M8/M9                              | 3-6                     | Phase 5                                   |
| SC-05    | M5, C1, M5V-A; aggregate M8/M9                       | 3-6                     | Phase 5                                   |
| SC-06    | M5, C1, M5V-A, M7; aggregate M8/M9                   | 3-6                     | Phase 5                                   |
| SC-06A   | C0, M5, C1; aggregate M8/M9                          | 1-6                     | Phase 5                                   |
| SC-06B   | M5, M6; aggregate M8/M9                              | 3-6                     | Phase 5                                   |
| SC-06C   | M5, M5V-A; aggregate M8/M9                           | 3-6                     | Phase 5                                   |
| SC-06D   | M5, M6; aggregate M8/M9                              | 3-6                     | Phase 5                                   |
| SC-06E   | M5V-A/M5V-B; aggregate M8/M9                         | 4-6                     | Phase 5                                   |
| SC-06F   | M1S/SBX-0..2; aggregate M8/M9                        | 1, 3, 5-6               | Phase 5                                   |
| SC-07    | M1M, M1S, M2, M5, C1, M5V-A, M7; aggregate M8/M9     | 1-6                     | Phase 5                                   |
| SC-08    | M0A, M3; aggregate M8/M9                             | 1-2, 5-6                | Phase 5                                   |
| SC-09    | M0A; aggregate M8/M9                                 | 1, 5-6                  | Phase 5                                   |
| SC-10    | M1M, M1S, M2, M5, C1, M5V-A, M6, M7; aggregate M8/M9 | 1-6                     | Phase 5                                   |
| SC-10A   | M2, M5, C1; aggregate M8/M9                          | 2-6                     | Phase 5                                   |
| SC-11    | M1, M1M, M1S, M2; aggregate M8/M9                    | 1-2, 5-6                | Phase 5                                   |
| SC-12    | M1, M1F, M1M, M1S, M2; aggregate M8/M9               | 1-2, 5-6                | Phase 5                                   |
| SC-13    | M1, M1M, M1S, M2, M5, C1, M5V-A, M6; aggregate M8/M9 | 1-6                     | Phase 5                                   |
| SC-14    | M1F, M2, M5, M5V-A, M6; aggregate M8/M9              | 1-6                     | Phase 5                                   |
| SC-14A   | M1M/MCP-0..4; aggregate M8/M9                        | 1, 3-6                  | Phase 5                                   |
| SC-14B   | C0, C1; aggregate M8/M9                              | 1-2, 4-6                | Phase 5                                   |
| SC-14C   | M1F, M2, M5, M6; aggregate M8/M9                     | 1-6                     | Phase 5                                   |
| SC-15    | M1M, M1S, C1, M5V-B, M8                              | 1, 4-5                  | Phase 5                                   |
| SC-16    | M4, M5, C1, M5V-B, M6, M7, M8                        | 3-5                     | Phase 5                                   |
| SC-17    | M4, M5, C1, M5V-B, M6, M7, M8                        | 3-5                     | Phase 5                                   |
| SC-18    | M8, M9                                               | 5-6                     | Phase 5; Phase 6 replays before expansion |
| SC-19    | M0A, M8, M9                                          | 1, 5-6                  | Phase 5                                   |
| SC-20    | M0A, M3, M8, M9                                      | 1-2, 5-6                | Phase 5                                   |
| SC-21    | M0A, M1M, M1S, C0, M5V-A, M6, M8, M9                 | 1, 4-6                  | Phase 5                                   |

### Benchmark journeys

| Journey | Packet owner(s)                            | Implementation phase(s) | Proof closure                                 |
| ------- | ------------------------------------------ | ----------------------- | --------------------------------------------- |
| J1      | M4                                         | 3                       | Phase 5                                       |
| J2      | M4                                         | 3                       | Phase 5                                       |
| J3      | M5, M6                                     | 3-4                     | Phase 5                                       |
| J4      | M1, M5, M6                                 | 1, 3-4                  | Phase 5                                       |
| J5      | M2, M5                                     | 2-3                     | Phase 5                                       |
| J6      | M5, M7                                     | 3-4                     | Phase 5                                       |
| J7      | M5, M7                                     | 3-4                     | Phase 5                                       |
| J8      | M5, M7                                     | 3-4                     | Phase 5                                       |
| J9      | M1M/MCP-0..4                               | 1, 3-5                  | Phase 5                                       |
| J10     | M1S/SBX-0..2, M5, M6                       | 1, 3-5                  | Phase 5                                       |
| J11     | M3                                         | 2                       | Phase 5                                       |
| J12     | M0A, M3                                    | 1-2                     | Phase 5                                       |
| J13     | M2                                         | 2                       | Phase 5                                       |
| J14     | M7                                         | 4                       | Phase 5                                       |
| J15     | M5, M6, M7                                 | 3-4                     | Phase 5                                       |
| J16     | M1S, M5, M7                                | 1, 3-4                  | Phase 5                                       |
| J17     | C0, C1, M6                                 | 1-2, 4                  | Phase 5                                       |
| J18     | M5, M6                                     | 3-4                     | Phase 5                                       |
| J19     | M2, M5, M7                                 | 2-4                     | Phase 5                                       |
| J20     | M2, M5, C1                                 | 2-4                     | Phase 5                                       |
| J21     | M0A, M1S, M3                               | 1-2                     | Phase 5                                       |
| J23     | C0, M5, C1, M6                             | 1-4                     | Phase 5                                       |
| J24     | M1F, M2, M5, M6                            | 1-4                     | Phase 5                                       |
| J25     | M1S/SBX-0..2, M5, M6                       | 1, 3-5                  | Phase 5                                       |
| J26     | M2, M5, IMG, M8                            | 2-3, 5                  | Phase 5                                       |
| J22     | Future Cloud/hosted host-transition packet | Future milestone only   | Future milestone only; never a Phase 1-7 gate |

Coverage check: all 21 invariants, all 31 master-plan success criteria, all 24 master-plan first-preview journeys (J1-J21 and J23-J25), and the added user-reported image/vision parity journey J26 have exact packet ownership, implementation phases, and a proof-closure phase. J22 remains explicitly future as required by the master plan.

## Requirement Coverage

| Phase                               | Requirement count | Milestone role                                                                |
| ----------------------------------- | ----------------- | ----------------------------------------------------------------------------- |
| 1. Safety Foundation                | 11                | First-preview wave 1                                                          |
| 2. Migration Skeleton               | 6                 | First-preview wave 2                                                          |
| 3. Daily Cockpit                    | 8                 | First-preview wave 3                                                          |
| 4. Power and Outcomes               | 12                | First-preview wave 4                                                          |
| 5. Release Hardening                | 9                 | First-preview wave 5                                                          |
| 6. Preview                          | 3                 | First-preview wave 6                                                          |
| 7. Secure Portability               | 6                 | Follow-on wave preserved from master plan                                     |
| **Active total**                    | **55**            | **55/55 atomic current-milestone requirements mapped exactly once**           |
| Future: Cowork Expansion            | 7                 | Atomic slices queued next milestone                                           |
| Future: Cloud/Pro and Distribution  | 5                 | Atomic slices queued next milestone                                           |
| Future: Managed Workspace Lifecycle | 1                 | Queued until a complete trusted output/receipt ledger exists                  |
| **Normalized total**                | **68**            | **68/68 atomic slices classified exactly once; all retain source provenance** |

## Progress (RECONCILED 2026-07-21 — milestone model)

The old 7-phase progress table is superseded. Truth by milestone:

| Milestone                    | Status                    | Detail                                                                                                              |
| ---------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Phase 1 safety construction  | **ACCEPTED-BY-LIVE-TEST** | 20 non-cohort packets ship in v0.11.18 + green suite; 20 cohort packets SUPERSEDED                                  |
| **A — Cockpit Preview Ship** | **ACTIVE**                | Wave A (package + matched-engine smoke) not started; Wave B (trust/a11y) partially landed; Wave C (hygiene) pending |
| B — Scope Decisions          | Not started               | 5 decisions: COW-04/05/06, SBX-02, IMG-01, VOC-04, CMP-01                                                           |
| C — Secure Portability       | Deferred                  | old Phase 7 transfer engine; does not block preview                                                                 |

<details><summary>Historical 7-phase table (superseded — was the fictional whole-phase build over already-shipping code)</summary>

| Phase                 | Plans Complete | Status                                                             | Completed  |
| --------------------- | -------------- | ------------------------------------------------------------------ | ---------- |
| 1. Safety Foundation  | reconciled     | Accepted-by-live-test; cohort half superseded                      | 2026-07-21 |
| 2. Migration Skeleton | n/a            | Construction ships in v0.11.18; never GSD-decomposed               | -          |
| 3. Daily Cockpit      | n/a            | Construction ships in v0.11.18; never GSD-decomposed               | -          |
| 4. Power and Outcomes | n/a            | Ships; scope calls tracked as Milestone B                          | -          |
| 5. Release Hardening  | n/a            | Folded into Milestone A packaging                                  | -          |
| 6. Preview            | superseded     | ROL-01/02/03 were cohort rollout — killed; replaced by Milestone A | -          |
| 7. Secure Portability | deferred       | → Milestone C                                                      | -          |

</details>

---

# Milestone WLD-I — Licence Compliance (ACTIVE)

> **Appended 2026-07-30. Additive only.** Nothing above this line is rewritten, renumbered, or
> restated. Milestones A/B/C and the preserved Phase 1-7 wave model keep their own IDs; WLD-I is a
> separate lettered milestone with its own phase namespace `I-01` … `I-10`. Phase artifacts live in
> `.planning/phases/WLD-I-licence-compliance/` as `I-NN-PLAN.md`, matching the `D-NN-PLAN.md`
> convention already in `phases/WLD-D-inbox-repairs/`. Do **not** create numbered `01-*` / `02-*`
> phase directories for this milestone.

**Goal:** Bring Wayland's third-party attribution into a defensible state under Apache-2.0
§4(b)/§4(c) and MIT, and make every attribution claim the app ships actually true — verified against
the tree, the pinned upstream, or a real packaged artifact, never against a commit message or a
prior finding.

**Spine:** `.planning/research/SUMMARY.md` → "Implications for Roadmap". Its ten phases are the
plan; their order and their blocked/not-blocked markers are preserved verbatim here.

## Authoritative scope numbers

Measured against **AionUi v1.9.5, tag `5b2c741f92`, dated 2026-04-01**, committed as
`.planning/phases/WLD-I-licence-compliance/AIONUI-INVENTORY.csv` (re-derivable by re-running
`inventory.py`):

| Measure | Value |
| --- | --- |
| Same-path files | **1005** (730 in `src/`, 275 outside it) |
| DERIVED-HIGH | **891** (645 in `src/`, 246 outside) |
| DERIVED-LIKELY | **90** (66 in `src/`, 24 outside) |
| REVIEW | **18** (14 in `src/`, 4 outside) |
| DIVERGED | **6** (5 in `src/`, 1 outside) |
| Files at 100% literal line overlap | **186** |
| Files carrying an AionUi copyright notice | **0** |

**Every other figure circulating in the four dimension research files is superseded.** Anyone
quoting **445, 503, 550, ~310, 455, 1424, 1390, 2615, 3966, or 2316** — or the pins `b97f34b28e` /
`f37a6187`, or root-commit date 2026-07-06 (it is **2026-06-07**) — is quoting a superseded number.
The `445` figure still present in `PROJECT.md`'s "Current Milestone: WLD-I" target-features list is
one of them; this table wins.

## Already shipped — completed, not future work

The WLD-H branch is folded into this milestone (locked decision), and a material part of the remedy
has already landed. These are recorded as **completed requirements inside Phase I-02** with
verification-shaped criteria so they are re-checkable as regressions, not re-planned as work.

| Commit | Landed |
| --- | --- |
| `78329477f` | Verbatim Apache-2.0 licence text restored (the appendix placeholder had been overwritten with our name); `notices/OfficeCLI-NOTICE.txt` shipped verbatim; four false claims removed from the shipped notices file (blanket §4(d) claim; enumerated §4(b) list containing the false `.wcore.toml` / `~/.wcore` claims; gemini-cli blanket header claim; "every file carries a header"); three smaller claim corrections (pptx2json not "verbatim", 7zip-bin not "solely Windows", OfficeCLI digests read locally); `notices/README.md` rewritten; whatsapp-bridge added to `.prettierignore` |
| `d99c70b07` | A false authorship claim I shipped in the notices retracted |
| `fc7939423`, `b11f6ad87`, `0aac367bc` | The AionUi inventory built and rebaselined onto the supplied fork point |
| `4a516002e` | The four-leg WLD-H cross-audit recorded, two wrong verdicts corrected |

**There is no baseline-reconstruction phase.** The fork point was supplied by the owner and the
inventory is committed. Every recommendation to reconstruct, bracket, or argmax-search a baseline is
obsolete, and fork-point location by git blob-set intersection maximisation is **refuted** — record
it as a dead end so nobody retries it.

## The one question that sizes the milestone

> **Does a central provenance manifest in the source tree satisfy Apache-2.0 §4(c), or must the
> retained notice sit in the file it was removed from?**

It decides whether the §4(c) restoration touches **1 file or ~981**. It does **not** gate the
existence of the header sweep: §4(b) — "state THAT you changed the files" — is per-file by its own
words with no central-document reading. **Phase I-05 happens either way; the §4(c) answer changes
what each header says, not whether the sweep exists.**

## Phases

Phase IDs are `I-NN` within milestone WLD-I. Blocked/not-blocked markers are carried from
`SUMMARY.md` unchanged.

- [ ] **Phase I-01: Counsel — the §4(c) placement question** - NOT BLOCKED (it is the unblocking action). One question, shipped first and alone, against the remedy and not the fact-finding.
- [ ] **Phase I-02: Small, settled, independent notices work** - NOT BLOCKED. Partly landed already (`78329477f`, `d99c70b07`); remaining: OpenClaw MIT notices owed, six header dialects collapsed to one, baileys.js header isolated with the bridge pin re-pinned in the same commit.
- [ ] **Phase I-03: Per-file chain of custody for non-AionUi upstreams** - NOT BLOCKED. The `web-fetch.ts` finding generalises: the gemini-cli notices entry is wrong wholesale. Stops the cure creating a new false claim.
- [ ] **Phase I-04: Manifest, generator, drift test, upstream tree index** - NOT BLOCKED. Makes the sweep reviewable from a small reviewed input and produces the pin-impact list before a byte moves.
- [ ] **Phase I-05: The header sweep — tier-shaped, generated, human-signed** - §4(b) half NOT BLOCKED; §4(c) *content* BLOCKED on I-01. The sweep happens either way.
- [ ] **Phase I-06: Re-adjudicate `3f1c5ba10`** - NOT BLOCKED for fact-finding; the acpx/Zed GPL-family restore-or-leave call is a counsel item.
- [ ] **Phase I-07: npm dependency licence report** - NOT BLOCKED, fully parallel. Reconciled against the asar over the real artifact.
- [ ] **Phase I-08: Bundle-retention hardening and packaged-artifact verification** - NOT BLOCKED; consumes I-05's output so it lands after. A notice that Rollup strips is a notice that does not exist.
- [ ] **Phase I-09: Required CI gate** - NOT BLOCKED; must land after I-05 or it fails on its own remediation target. Fails closed.
- [ ] **Phase I-10: Remedy sign-off and disclosure** - BLOCKED on I-01 and on counsel sign-off. Gates the release, not the code.

## Phase Details

### Phase I-01: Counsel — the §4(c) placement question

**Status**: NOT BLOCKED — it *is* the unblocking action.
**Goal**: The one question that sizes the milestone is in counsel's hands on day one, scoped to the
remedy, so Phase I-05's §4(c) payload stops being a guess.
**Depends on**: Nothing. Runs first and alone.
**Requirements**: LEG-01, LEG-02
**Success Criteria** (verification-shaped — checkable against the tree or the pinned upstream):

1. A committed counsel packet states the §4(c) placement question verbatim plus the five subsidiary
   decisions (literal §4(b) wording; whether the upstream copyright must precede ours; the overlap
   threshold below which "independent" is defensible; sufficiency of the remedy form; the
   `3f1c5ba10` GPL-family standard of investigation), and **every factual figure in it resolves
   against `AIONUI-INVENTORY.csv`** — re-derivable by re-running `inventory.py`, not by citing this
   roadmap.
2. The packet's enclosures are enumerable as a file list — the inventory CSV, the proposed header
   template, the notices diff — and the packet contains **no** request to adjudicate whether files
   are derived (measured), whether AionUi ships a NOTICE (404), or whether Apache-2.0 is
   AGPL-compatible (settled). Grepping the packet for those three questions returns zero hits.
3. The record states explicitly that I-05's sweep happens regardless of the answer, and marks I-05's
   §4(c) payload **UNRESOLVED** — not assumed in either direction — until the answer returns.
4. When the answer returns it is recorded verbatim with its date as a locked decision, and every
   phase whose content it changes is named in that record.

**Plans**: TBD (`I-01-PLAN.md`)
**Constraint**: counsel reviews the **remedy**, not the fact-finding. Five decisions, not 981 files.

### Phase I-02: Small, settled, independent notices work

**Status**: NOT BLOCKED. Partly landed.
**Goal**: The settled, small, independent notices obligations are discharged and the already-shipped
half is provably still true.
**Depends on**: Nothing.
**Requirements**: NTC-01 (done), NTC-02 (done), NTC-03 (done), NTC-04 (done), NTC-05 (done),
NTC-06, NTC-07, NTC-08
**Success Criteria** (verification-shaped):

1. `notices/Apache-2.0.txt` is byte-identical to the canonical Apache-2.0 text and its appendix
   placeholder is **not** our name; `notices/OfficeCLI-NOTICE.txt` is byte-identical to the upstream
   `NOTICE` at the pinned OfficeCLI release. Both proven by `diff` against a freshly obtained copy.
2. None of the four retracted claims can be found in `notices/THIRD-PARTY-NOTICES.md` — grep for
   their exact strings returns zero hits — and no claim in that file asserts completeness about our
   own files (`all` / `every` / `none` / `complete` / `fully` → zero hits in a self-referential
   claim).
3. The tunnel trio (`src/process/channels/tunnel/…`) and `src/process/channels/types.ts` each carry
   a **single** `@license` block naming OpenClaw and MIT, and that block is **present in a real
   packaged artifact** after `bun run dist:verify:mac` — verified in `out/`, not by `git grep`.
4. Exactly one OpenClaw header dialect remains across the OpenClaw-attributed set (the `backoff.ts`
   form, 32 measured surviving instances); the inline per-function `// Adapted from openclaw/… (MIT).`
   comments are preserved, count unchanged before and after.
5. The `backends/baileys.js` header edit lands in **its own commit** with
   `scripts/whatsapp-bridge-source.json` re-pinned in that **same** commit;
   `tests/unit/scripts/whatsappBridgeSourcePin.test.ts` passes and `bun run dist:verify:mac`
   produces a launchable artifact afterwards. A green `tsc` is not accepted as evidence.

**Plans**: TBD (`I-02-PLAN.md`)
**Entry precondition (verified 2026-07-30 at `2c0d1d203`)**: the bridge pin is currently **clean** —
9 pinned files, 9 on disk, zero digest drift, zero unpinned files. The D-01 stale-pin regression
noted elsewhere is not present on this branch. Re-verify before the baileys.js commit; if it has
drifted, **fix the pin, never the check**, and route the regeneration to the owner first.
**Avoids**: Pitfalls 3 (bundler-stripped notice), 4 (pin invalidation), 5 (asserting completeness).
Do **not** run `bun run format` — bare `oxfmt` reformats the pinned bridge directory.

### Phase I-03: Per-file chain of custody for non-AionUi upstreams

**Status**: NOT BLOCKED. Flagged for deeper research during planning.
**Goal**: No notice this milestone writes asserts a lineage the pinned upstream contradicts.
**Depends on**: Nothing. Must complete before I-05 writes any non-AionUi notice.
**Requirements**: CUS-01, CUS-02, CUS-03
**Success Criteria** (verification-shaped):

1. For every file currently attributed to a non-AionUi upstream, a committed row records: the path;
   whether that path exists in AionUi v1.9.5; **the copyright line the v1.9.5 file itself carries,
   quoted verbatim**; and the verdict. Each row is re-checkable by
   `git -C <pinned checkout> show 5b2c741f92:<path>`.
2. The gemini-cli entry in `notices/THIRD-PARTY-NOTICES.md` asserts only lineages that survive
   step 1. Any claim the upstream file contradicts is removed, and its removal is recorded together
   with the upstream bytes that disprove it.
3. `src/process/agent/gemini/cli/tools/web-fetch.ts` and
   `src/process/agent/gemini/cli/utils/geminiSchemaFilter.ts` each name the holder the pinned
   upstream actually names, `grep -F`-able verbatim in the pinned checkout.
4. A known-adapted **positive control** and an unrelated **negative control** are recorded and
   reproduced through the identical method in the same run. A run whose controls are not reproduced
   is void.

**Plans**: TBD (`I-03-PLAN.md`)
**Method constraints**: shared third-party API vocabulary is not evidence; shared hand-authored
helper names are. A shared name appearing only as an *import* of a helper defined in an attributed
sibling needs no notice of its own — the notice belongs on the definition. `rtk` silently truncated
`git log` to 50 of 18,151 commits during research: any enumeration uses `rtk proxy git …` or
`child_process.execFile`.

### Phase I-04: Manifest, generator, drift test, upstream tree index

**Status**: NOT BLOCKED.
**Goal**: A 900-file diff becomes reviewable from a small reviewed input, and no header edit can
silently invalidate a pin.
**Depends on**: Nothing. Must complete before I-05 touches a byte.
**Requirements**: MFT-01, MFT-02, MFT-03, MFT-04, MFT-05
**Success Criteria** (verification-shaped):

1. Re-running the seeder reproduces `scripts/provenance/aionui.json` **byte-for-byte** from
   `AIONUI-INVENTORY.csv`, and its per-tier counts equal 891 / 90 / 18 / 6 with pin `5b2c741f92` on
   every row.
2. `node scripts/provenance/apply.mjs --check` runs **offline** against
   `scripts/provenance/aionui.tree.json`, exits non-zero on the pre-sweep tree, and names the files
   it faults. `--check` is the default; `--write` is opt-in.
3. With the pinned checkout absent or at the wrong revision, `apply.mjs` **exits non-zero and emits
   nothing** — it fails rather than templating. Grepping the generator for a literal copyright
   holder or year constant returns zero hits.
4. `tests/unit/scripts/provenanceManifest.test.ts` passes in seconds with no build and no network,
   and **fails** when a manifest row's pin, path, or classification is mutated — proven by mutating
   one and recording the failure.
5. A committed pin-impact list enumerates every digest, shasum, and patch-context file a header edit
   can invalidate (`scripts/whatsapp-bridge-source.json` bridge digests, OfficeCLI shasums,
   bundled-wayland-core shasums, `patches/*.patch` context lines), each entry verified by locating
   the digest in the file that carries it.

**Plans**: TBD (`I-04-PLAN.md`)
**Placement constraint**: the manifest lives in `scripts/`, **not** `notices/`. Anything in
`notices/` ships, and a shipped classification error is a shipped false claim.
**Rejects**: blob-set-intersection fork-point search — recorded as a dead end.

### Phase I-05: The header sweep — tier-shaped, generated, human-signed

**Status**: §4(b) half **NOT BLOCKED**. §4(c) *content* **BLOCKED on I-01**. The sweep happens
either way; the answer changes what each header says, not whether the sweep exists.
**Goal**: Every derived file states that it was changed, and carries the upstream copyright
*alongside* the Ferrox line rather than in place of it.
**Depends on**: I-03 (so no Google LLC notice lands on a file whose custody runs through AionUi),
I-04 (manifest, generator, pin-impact list). §4(c) payload consumes I-01's answer.
**Requirements**: HDR-01, HDR-02, HDR-03, HDR-04, HDR-05, HDR-06, HDR-07
**Success Criteria** (verification-shaped):

1. **Every** copyright line the sweep emits is `grep -F`-able verbatim in the pinned upstream
   checkout at `5b2c741f92` — asserted over the whole diff, zero misses, zero modernised years, zero
   normalised holders.
2. `node scripts/provenance/apply.mjs --check` exits zero on the post-sweep tree, and the exact
   command plus its output appears in **every** PR body, so each large diff is reproducible from the
   small reviewed manifest rather than reviewed line by line.
3. Each of the 18 REVIEW and 6 DIVERGED files carries a committed **five-field** verdict — upstream
   candidate set enumerated by `find -type f`; best-match upstream file across the whole tree, not
   the plausibly-named sibling; the three-way split of shared identifiers; whose copyright the
   upstream file itself carries; verdict plus asymmetry note. No verdict exists with a missing field.
   DIVERGED defaults to *independent*; a derived verdict needs a written reason.
4. No file classified verbatim-copy carries a Ferrox copyright or a §4(b) statement (grep the
   verbatim set → zero hits), and no previously unheadered file with no upstream notice to retain
   gained an Apache header.
5. Every entry in the I-04 pin-impact list still validates after the sweep: `bun run dist:verify:mac`
   produces a launchable artifact and the full suite is green. A passing `tsc` is **not** accepted.

**Plans**: TBD (`I-05-PLAN.md`) — split by classification tier × edit-kind (modify-existing-header vs
add-where-none-exists) × upstream. The 275 files outside `src/` are a **separate packet**: they never
reach the object form, so only §4(c) applies to them.
**Claim-type split**: a **copyright retention** is conservative — over-applying costs credit we did
not owe and creates no liability, so bias inclusion. A **derivation assertion** (a `Source:` path, a
notices claim) is a factual claim and needs its measurement attached. Record the **negative**
determinations with the same fields as the positives — that omission is precisely what `3f1c5ba10`
was faulted for.
**Constraint**: conventional-commit `type(scope): subject`, `--strict --force-scope`. One packet per
PR. No history rewriting, ever.

### Phase I-06: Re-adjudicate `3f1c5ba10`

**Status**: NOT BLOCKED for fact-finding; the acpx/Zed **GPL-family** restore-or-leave call is a
counsel item. Flagged for deeper research during planning.
**Goal**: Every provenance comment that commit deleted is held to the same per-file evidentiary
standard the OpenClaw removals got, with restoration as the default.
**Depends on**: Nothing for fact-finding. Reuses I-03's verdict-row schema rather than inventing a
second one.
**Requirements**: ADJ-01, ADJ-02, ADJ-03
**Success Criteria** (verification-shaped):

1. The removal set is enumerated **from the commit itself** (`rtk proxy git show 3f1c5ba10`), and
   every removal has a committed row naming the upstream, the clone revision compared against, the
   measurement, and the verdict — row count equal to removal count.
2. acpx, Zed, and Codex CLI are cloned locally at **recorded revisions** and each disputed file is
   diffed against them. A verdict of "independent" cites the measurement that supports it; removal
   requires strictly **more** evidence than retention.
3. The Claude Code pointer is present in the tree, marked **UNVERIFIED** with its reason (closed
   source, undiffable), and no verdict claims it was disproven. A comment that cannot be disproven
   stays.
4. Any restoration that must reach users is confirmed present in a real packaged artifact, not
   inferred from source.

**Plans**: TBD (`I-06-PLAN.md`)

### Phase I-07: npm dependency licence report

**Status**: NOT BLOCKED — fully parallel. Flagged for deeper research during planning (the residue of
packages shipping no licence text of their own is manual).
**Goal**: The dependency licences we actually ship are documented, and the document cannot drift from
the artifact.
**Depends on**: Nothing.
**Requirements**: DEP-01, DEP-02, DEP-03
**Success Criteria** (verification-shaped):

1. The report is regenerable: deleting it and re-running the generator reproduces it byte-for-byte
   from resolved lockfile data, with **no** manual edit step anywhere in the path.
2. Every package listed by `@electron/asar list` over the **real** built artifact appears in the
   report or in its explicit "could not determine" section. The reconciliation exits non-zero on
   *ships-but-undocumented* and exits zero with a warning on *documented-but-not-shipped* — both
   directions proven by a deliberate injection.
3. The report is **present inside a real packaged artifact**, confirmed by listing the artifact —
   not by reading `electron-builder.yml`. The shipped set is ~1,332 packages, not the 144 declared
   `dependencies`; the count in the report matches the artifact, not `package.json`.
4. The "could not determine" section names each package and the resolution attempted. There is no
   silent omission and no invented licence text.

**Plans**: TBD (`I-07-PLAN.md`)
**Note**: `generate-license-file` is not currently a devDependency — adding it is in scope for this
phase. `rollup-plugin-license`'s `thirdParty` half is rejected: it lists only bundled deps, and
`externalizeDepsPlugin()` means main-process deps are not bundled.

### Phase I-08: Bundle-retention hardening and packaged-artifact verification

**Status**: NOT BLOCKED; its input is I-05's output, so it lands after.
**Goal**: A notice that ships is a notice that exists in the shipped bytes.
**Depends on**: I-05 (the notices it verifies), I-04 (the manifest it generates from).
**Requirements**: BND-01, BND-02, BND-03, BND-04
**Success Criteria** (verification-shaped):

1. Every `requiredNotice` in the manifest is found in `out/main/**`, `out/preload/**` **and**
   `out/renderer/**` after `bun run dist:verify:mac`, and the checker exits non-zero if any is
   missing. Never raw `electron-vite build`.
2. The check is proven **not vacuous**: deliberately deleting one notice from the generated banner
   makes it fail, and the failing run is recorded.
3. Each **retracted** notice is asserted **absent** from the bundle, and the check fails if one is
   reintroduced — the inverse assertion, not only the positive one.
4. `notices/BUNDLE-NOTICE.txt` cannot drift from the manifest: it is generated in `prebuild`,
   regenerating and diffing yields no change, and a manifest edit without regeneration fails the
   build. The banner opens `/*!` or contains `@license`, since esbuild keeps only those.

**Plans**: TBD (`I-08-PLAN.md`)
**Structural basis**: §4(c) binds the **source form** (the git repo / AGPL §6 Corresponding Source) —
Rollup is irrelevant to it. §4(a)/§4(d) bind the **object form**, already served by
`electron-builder.yml`'s `extraResources` copy of `notices/` and `LICENSES/`. This phase closes the
object-form gap for notices that live only as comments. `notices/THIRD-PARTY-NOTICES.md` stays
primary — a copied text file is durable; a comment is not.

### Phase I-09: Required CI gate

**Status**: NOT BLOCKED; must land **after** I-05 or it fails on its own remediation target.
**Goal**: The fix cannot regress on the next import, and the gate cannot pass by not running.
**Depends on**: I-05 (or it red-flags its own target), I-04 (manifest + tree index).
**Requirements**: CIG-01, CIG-02, CIG-03
**Success Criteria** (verification-shaped):

1. The gate is a required check with **no `paths:` filter** that can make it skip. A PR touching only
   docs still runs it, verified on a real PR — because in this repo a **skipped required check counts
   as a PASS**, and `paths:` filters fire on **any** match.
2. Deliberately stripping one restored header makes the check **fail** and **name the file**; the
   failing run is linked.
3. A new file at a path present in `aionui.tree.json` and absent from `aionui.json` fails the check
   and names the file — proven by adding one.
4. With the pinned-upstream cache missing, the job **fails closed** rather than passing or skipping.
5. `reuse lint-file` and the header-shape check run as **explicit steps with scoped file arguments**.
   `prek run --all-files` appears nowhere in the workflow — grep returns zero hits. `reuse` is scoped
   to declaration conformance only; it has no vocabulary for "derived from upstream X at pin Y" and
   cannot replace the manifest gate.

**Plans**: TBD (`I-09-PLAN.md`)

### Phase I-10: Remedy sign-off and disclosure

**Status**: **BLOCKED** on I-01's answer and on counsel sign-off. Gates the release, not the code.
**Goal**: The factual record is published, counsel has signed the remedy, and no known-false claim
is outstanding on the candidate that would ship.
**Depends on**: I-01 through I-09.
**Requirements**: DIS-01, DIS-02, DIS-03, DIS-04
**Success Criteria** (verification-shaped):

1. The compliance note states **method, the pin `5b2c741f92`, the measured counts, what was restored,
   and what remains open** — and contains no completeness word about our own coverage (`all`,
   `every`, `none`, `complete`, `fully` → zero hits as a self-referential claim). Three completeness
   assertions already existed in this tree and the first serious audit found all three.
2. The compliance note and the release-note line are **separate files**, and neither carries the
   other's framing: the release note contains no confession, the note contains no spin. Merging them
   produces either the "credits but no apology" headline or a note nobody believes.
3. Every claim in both documents resolves against the tree or the pinned upstream **at the moment of
   sign-off** — re-verified by re-running the I-04 checker and the I-08 packaged verification on the
   exact candidate, not by citing this roadmap or a prior finding.
4. No known-false claim is outstanding: the notices file, the restored headers, and the dependency
   report each pass their own checks on the exact candidate. **No release ships while any known-false
   claim is outstanding.**
5. Counsel sign-off is recorded with date and scope, and **no communication with AionUi exists** —
   locked decision: no contact now, the cure comes first regardless.

**Plans**: TBD (`I-10-PLAN.md`)
**Consequence framing**: the sanction that bites is distributional, not judicial. Across every
attribution-specific case in the prior art, **zero** produced litigation; the observed consequences
were a removed launch post, a C&D that went nowhere, an emergency licence change, and a permanent
public record.

## Phase Ordering Rationale (carried from SUMMARY.md)

- **Counsel first** — one question sizes I-05 and is the only true long-pole.
- **Everything cheap and settled runs in parallel immediately** (I-02, I-03, I-04, I-06, I-07).
  Sequencing a false-statement correction behind a legal decision is a mistake.
- **No baseline phase exists.** Fork point supplied, inventory committed, blob-intersection refuted.
- **I-03 before I-05** so the sweep does not write a Google LLC notice onto a file whose custody runs
  through AionUi.
- **I-04 before I-05** because the manifest makes the sweep reviewable and the generator stops the
  bundler-stripped-notice pitfall.
- **I-08 after I-05** (it verifies I-05's output in the packaged artifact). **I-09 after I-05** or it
  blocks its own remediation. **I-10 last**, gating the release.

## Milestone-wide execution constraints

These bind every phase in WLD-I. A phase plan may add constraints; none may weaken these.

| Constraint | Rule |
| --- | --- |
| Packet discipline | **One packet per PR.** No bulk cleanup bombs. A large generated diff is acceptable only when reproducible from a small reviewed input, with the exact `--check` command and output in the PR body. |
| History | **No history rewriting, ever.** |
| Commit hygiene | Conventional commits, `type(scope): subject`, `--strict --force-scope`. **No AI attribution trailers** in commits or PRs. |
| Hooks | **`prek run --all-files` is forbidden.** Scoped CI steps with explicit file arguments only. |
| `migrations.ts` | The `aionrs` SQL literals must **never** change. They are on-disk schema identity, not a branding artifact. |
| Foundry naming | `FoundrySkills` / `foundry-skills` must **never** be renamed. |
| whatsapp-bridge | Editing anything under `src/process/channels/whatsapp-bridge/` requires re-pinning `scripts/whatsapp-bridge-source.json` in the **same commit**. Fix the pin, never the check. Do not run `bun run format` (bare `oxfmt` reformats the pinned directory). |
| Promotion | **Nothing merges, tags, or releases without the owner.** |
| Evidence | Verify against the tree, the pinned upstream, or a real packaged artifact. Never against a commit message, a prior finding, or `electron-builder.yml`. A green `tsc` is not packaged evidence. |
| Enumeration | `rtk` intercepts `git log` and silently truncated 18,151 commits to 50 during research. Any enumeration uses `rtk proxy git …` or `child_process.execFile`. A short commit list is a method artifact, not evidence. |
| Counting | `ls` is never acceptable; use `find -type f`. Every zero and every tidy count needs a recorded positive control through the identical method. |
| Claims | Assert **method, scope, date**. Never `all` / `every` / `none` / `complete` / `fully` about our own coverage. §4(b) requires only a statement **that** files changed — the default action on an enumerated modification claim is **delete**, not correct. |

## Locked Decisions — constraints, never open questions

| Decision | Owner call |
| --- | --- |
| Inventory before remedy | Done. `AIONUI-INVENTORY.csv` committed against pin `5b2c741f92`. |
| The WLD-H branch | Fold into this milestone; do **not** merge as a standalone compliance packet. |
| Outside legal review | On the **remedy** decision only, not on fact-finding. |
| Contacting AionUi | **No contact now.** The post-cure notification recommendation is overruled; the cure comes first regardless. |
| Discord attribution | **Stays.** Provenance UNVERIFIED; asymmetric risk favours keeping it. |
| Per-file `SPDX-License-Identifier: Apache-2.0` | **Leave it alone.** Not a compliance defect and cannot become one — an identifier more permissive than the outbound licence over-grants Ferrox's own rights, and no third party has a claim. Panel disagreement recorded. |
| SBOM | Deferred unless a customer demands it. |

## Requirement Coverage — WLD-I

| Phase | Requirement IDs | Count |
| --- | --- | --- |
| I-01 Counsel — §4(c) question | LEG-01, LEG-02 | 2 |
| I-02 Settled notices work | NTC-01…NTC-08 | 8 (5 already complete) |
| I-03 Non-AionUi chain of custody | CUS-01, CUS-02, CUS-03 | 3 |
| I-04 Manifest, generator, drift test | MFT-01…MFT-05 | 5 |
| I-05 Header sweep | HDR-01…HDR-07 | 7 |
| I-06 Re-adjudicate `3f1c5ba10` | ADJ-01, ADJ-02, ADJ-03 | 3 |
| I-07 npm dependency licence report | DEP-01, DEP-02, DEP-03 | 3 |
| I-08 Bundle retention + packaged proof | BND-01…BND-04 | 4 |
| I-09 Required CI gate | CIG-01, CIG-02, CIG-03 | 3 |
| I-10 Sign-off and disclosure | DIS-01…DIS-04 | 4 |
| **Total** | | **42 mapped exactly once; 0 unmapped** |

Full definitions and traceability: `.planning/REQUIREMENTS.md`, section
"WLD-I — Licence Compliance Requirements". The 55 current + 13 deferred requirements of the
Phase 1-7 milestone are untouched.

## Progress — WLD-I

| Phase | Plans Complete | Status | Completed |
| --- | --- | --- | --- |
| I-01 Counsel — §4(c) question | 0/? | Not started | - |
| I-02 Settled notices work | 0/? | Partly landed (`78329477f`, `d99c70b07`) | - |
| I-03 Non-AionUi chain of custody | 0/? | Not started | - |
| I-04 Manifest, generator, drift test | 0/? | Not started | - |
| I-05 Header sweep | 0/? | Not started (§4(c) payload UNRESOLVED) | - |
| I-06 Re-adjudicate `3f1c5ba10` | 0/? | Not started | - |
| I-07 npm dependency licence report | 0/? | Not started | - |
| I-08 Bundle retention + packaged proof | 0/? | Not started | - |
| I-09 Required CI gate | 0/? | Not started | - |
| I-10 Sign-off and disclosure | 0/? | Blocked (I-01 + counsel sign-off) | - |

## Research Flags — WLD-I

Needs deeper research during phase planning:

- **I-03** — the `web-fetch.ts` generalisation is identified but not executed; per-file verdicts
  against v1.9.5 do not exist, and the answer rewrites a shipped notices entry.
- **I-06** — acpx / Zed / Codex CLI are cloneable and have not been cloned; Claude Code stays
  UNVERIFIED by construction.
- **I-07** — the ~59 shipped packages carrying no licence text of their own need it resolved from the
  registry / SPDX corpus; that residue is manual.

Standard patterns, skip research:

- **I-05** — mechanical once pin, inventory and generator exist; the OpenSearch / Linux-kernel
  SPDX-sweep pattern is well documented. Note OpenSearch's own header convention arrived as a
  *correction* issue — plan for two passes.
- **I-04, I-09** — drift-test pattern already proven in-repo
  (`tests/unit/scripts/whatsappBridgeSourcePin.test.ts`); OpenTofu's `copyright` job is the
  reference CI shape.
- **I-02** — settled findings, small diffs.

## Explicitly rejected — record so nobody retries

- Fork-point location by **git blob-set intersection maximisation**. Blob identity requires
  byte-identical files; the import was a rebranded snapshot that rewrote headers throughout.
  Reproduced locally against 173 upstream commits it returned a flat 223-256 shared blobs (~4% of
  our root) with **no peak**, and its claimed pin `b97f34b28e` does not resolve as an object here.
- **Baseline reconstruction / bracketing / argmax search** — moot, the fork point is supplied.
- **Comparing against upstream's current `main`** — it has restructured into `packages/desktop/**`;
  valid only as a lower bound for inclusion, never as a basis for exclusion.
- **MOSS, simian, PMD CPD, NiCad, SourcererCC, scancode, FOSSology, ORT, licensee, ninka** as the
  derivation classifier — they answer "what licence does this tree declare?", not "is this file
  derived from that file at that revision".
- **`rollup-plugin-license`'s `thirdParty` half** and **`hashicorp/copywrite`** (one uniform header;
  this tree needs per-file variable upstream attribution driven by a manifest).
- **`prek run --all-files`** — forbidden by this repo.

## UI hint

**No.** WLD-I touches licence headers, notices files, generators, CI, and packaged-artifact
verification. It ships no user-facing interface change, so `/ferrox-ui-phase` does not apply to any
phase in this milestone.

---

## WLD-K — Core First

> **Appended 2026-08-08. Additive only.** Nothing above this line is rewritten, renumbered, or
> restated. Milestones A/B/C, the preserved Phase 1-7 wave model, and WLD-I keep their own IDs;
> WLD-K is a separate lettered milestone with its own phase namespace `K-01` … `K-08`. Phase
> artifacts live in `.planning/phases/WLD-K-core-first/` as `K-0N-PLAN.md`, matching the
> `I-NN-PLAN.md` convention already in `phases/WLD-I-licence-compliance/`. Do **not** create
> numbered `01-*` / `02-*` phase directories for this milestone.

**Goal:** Make Wayland Core the backend a non-technical user actually succeeds on, so the Master
Class demonstrates Wayland architecture — Wayland Desktop driving Wayland Core — rather than
Desktop driving Claude Code.

**Spine:** `.planning/MILESTONE-WLD-K-core-first.md` (verified state table) and a two-round
cross-research convergence between Codex 5.6 Sol and Kimi K3. Its phase order and the demo-safety
boundary are preserved verbatim here.

## Where WLD-K starts (verified, 2026-08-08)

- **Engine targeting.** Core 0.12.26 is in final CI ahead of publish. The committed Desktop pin
  stays `v0.12.25` (`scripts/prepareWaylandCore.js:213`), so a 0.12.26 release does not break
  already-shipped Desktop — but **the pin bump is blocked until PRF-01 lands**, because current
  Desktop code dies at bootstrap on 0.12.26.
- **Scope decision (Sean, 2026-08-08).** All seven packets stay in this milestone. Splitting the
  L-sized installer/Flux work into a follow-on milestone was recommended and overridden, so the
  roadmap carries an explicit **"Master Class is safe at this line"** boundary after K-04. Phases
  K-01…K-04 must be able to ship without any of K-05…K-08.
- **K-01 mechanism is decided (option A).** Move the profile into the global config root
  (`resolveActiveConfigDir()` → `WAYLAND_HOME`). It is execution-proven on 0.12.26-rc.2 — 101 MCP
  tools connected, turn completed, no trust flag, symlinks present. K-04's ENG-01 pursues the
  architecturally correct Core flag in parallel so option A can be retired later. Two independent
  cross-research legs (Codex 5.6 Sol, Kimi K3, two rounds each) converged on exactly this split.
- **Reuse, do not reinvent.** `projectConfigTransaction.ts` (journalled backup + marker + atomic
  rename + fsync + crash recovery), `projectConfigLease.ts` (realpath-keyed lease), `profilePaths.ts`
  (`resolveActiveConfigDir`/`resolveActiveConfigIdentity`, `DEFAULT_PROFILE='@native'`,
  `ProfileIsolationError`), `configMcpServers.ts`, `mcpSessionConfig.ts`.
- **The user-owned-file risk applies only to the `@native` profile.** For named profiles the
  config root is already a Desktop-owned, symlink-asserted tree.
- **Proof standard, milestone-wide.** Every mechanism claim is established by **executing** it
  against a real engine, never by reading source; any search returning zero is disbelieved until
  the same method is shown to find a **known positive**. Full suite baseline to beat: **16,231
  tests, 0 failures**.
- **Dual-version acceptance.** Every PRF requirement is proven on **both** 0.12.25 and 0.12.26
  (rc.2 until stable publishes, stable thereafter).

## Phases

Phase IDs are `K-NN` within milestone WLD-K.

- [ ] **Phase K-01: Move the launch profile out of project config (the spine)** - Ship blocker, not demo polish: Core 0.12.26 dies at bootstrap on current Desktop code until this lands. Runs first.
- [ ] **Phase K-02: Honest failure surfacing** - Small; sequenced after K-03. Stops the next Core-refuses-to-start failure from costing another lost afternoon.
- [ ] **Phase K-03: The turn that never finishes** - Small, high user-visible value; affects users on the already-shipped 0.12.25 engine today. Runs second.
- [ ] **Phase K-04: Engine asks and release-candidate policy** - Doc-only. ENG-01's handoff to Core goes out early, in parallel with K-01.

  > ─────────── Master Class is safe at this line ───────────
  > Phases `K-01` … `K-04` must ship independently of everything below.

- [ ] **Phase K-05: Agent installer: npm subset** - L, new capability; installs from the Settings panel with pinned-version, checksum-verified, manifest-uninstallable packages.
- [ ] **Phase K-06: Agent installer: non-npm channels** - L; extends K-05's manifest/consent/checksum/uninstall contract to the remaining channels.
- [ ] **Phase K-07: Flux fan-out** - L, high risk; the actual moat — an installed agent immediately drives the user's own Flux key on the pinned catalog.
- [ ] **Phase K-08: Milestone verification** - Full suite green plus a live packaged-artifact sweep of the Master Class path.

## Phase Details

### Phase K-01: Move the launch profile out of project config (the spine)

**Status**: SHIP BLOCKER — runs first.
**Size**: M. **Risk**: medium — it writes to a file the user also owns.
**Audit**: required, 4-leg — Codex 5.6 Sol, Gemini 3.1 Pro, Kimi K3, internal `ferrox-code-reviewer`.
This is the packet that must not be wrong.
**Goal**: A fresh Wayland Core launch with Desktop's MCP narrowing profile succeeds on both engine
versions, because the profile lives in a location Core's untrusted-workspace policy cannot strip.
**Depends on**: Nothing. First phase; the spine.
**Requirements**: PRF-01, PRF-02, PRF-03, PRF-04, PRF-05, PRF-06, PRF-07, PRF-08
**Success Criteria** (verification-shaped — checkable by execution, not by reading source):

1. A fresh profile with Wayland Core selected runs one prompt and executes an MCP tool on **both**
   0.12.25 and 0.12.26.
2. The global-config mutation is transactional on the existing `ProjectConfigTransaction` posture
   (journalled backup, marker, atomic rename, fsync, crash recovery) and never leaves a partial
   write; a launch killed mid-flight leaves the user's global config byte-identical to its
   pre-launch state, proven by a real kill test, not a simulated one.
3. The hash-ownership check governs **every** restore, not only crash recovery; on mismatch the
   user's bytes win, the failure is visible, and a precise repair action is offered.
   **Already implemented — preserve and prove, do not rebuild.** `ProjectConfigTransaction.restore()`
   delegates to `recoverProjectConfigTransaction()`, which restores only when the on-disk bytes still
   hash to the replacement it wrote. Verified by execution 2026-08-08: the existing test
   `'preserves a user edit made after the temporary file was published'` passes (6 passed / 0 failed).
   The work is to route the new global-config target through this primitive without weakening it.
4. Only the Desktop-owned `[profiles.__wayland_desktop_session*]` table is spliced textually; the
   result is validated as parsing TOML before the atomic rename. Structured round-trip
   serialization never runs — it destroys comments and formatting in a file the user hand-edits.
5. Concurrent launches are serialised by a lease spanning write → **Core config ingestion
   confirmed** → restore, not a lease that ends at spawn — a sibling launch cannot replace the
   bytes before the first engine reads them.
6. A user edit made to the global config *during* the launch window survives, proven by a test
   that performs the edit inside the lease window.
7. Genuinely project-scoped project-config writes are retained; only the profile block moves, with
   no unrelated behaviour change.

**Plans**: TBD (`K-01-PLAN.md`)
**Reuse, do not reinvent**: `projectConfigTransaction.ts`, `projectConfigLease.ts`,
`profilePaths.ts` (`resolveActiveConfigDir`/`resolveActiveConfigIdentity`,
`DEFAULT_PROFILE='@native'`, `ProfileIsolationError`), `configMcpServers.ts`,
`mcpSessionConfig.ts`.
**Scope note**: the user-owned-file risk applies only to the `@native` profile; named profiles'
config root is already a Desktop-owned, symlink-asserted tree.

### Phase K-02: Honest failure surfacing

**Status**: NOT BLOCKED. Sequenced after K-03 in execution order — small and independent, but
lower priority than the higher user-visible-value fix.
**Size**: S. **Risk**: low.
**Goal**: When Wayland Core refuses to start, the reason is readable in the app itself and
distinguishable by class, so the next 0.12.26-style bootstrap failure costs minutes, not an
afternoon.
**Depends on**: Nothing technically.
**Requirements**: DIA-01, DIA-02
**Success Criteria**:

1. An engine that refuses to start surfaces the engine's own stderr reason in the UI,
   secret-scrubbed through the existing `SECRET_PATTERNS`, in place of the contract-layer
   abstraction "wcore Desktop contract rejected ready".
2. Stripped-config failures and profile-resolution failures produce visibly distinct surfaced
   reasons, so the 0.12.26 failure class this milestone hit is diagnosable from the UI alone,
   without reading logs.

**Plans**: TBD (`K-02-PLAN.md`)
**UI hint**: yes

### Phase K-03: The turn that never finishes

**Status**: NOT BLOCKED. Runs second, immediately after K-01.
**Size**: S/M. **Risk**: low. **Priority**: high — it makes a working product look broken.
**Goal**: A turn that Core has already finished is shown as finished, on the engine already
shipped to users today.
**Depends on**: Nothing. Independent of K-01/K-02; the bug reproduces on the already-released
0.12.25 engine.
**Requirements**: TRN-01, TRN-02, TRN-03
**Success Criteria**:

1. A turn where Core emits `stream_end` with `finish_reason: 'stop'` leaves the UI's running
   state — reproduced live, not asserted from a plausible diff.
2. The no-tools-found and error paths also terminate the running state instead of hanging.
3. A regression test drives a `stream_end` carrying no assistant text and asserts the UI leaves
   the running state, so this exact class of bug cannot silently return.

**Plans**: TBD (`K-03-PLAN.md`)
**UI hint**: yes

### Phase K-04: Engine asks and release-candidate policy

**Status**: NOT BLOCKED; doc-only. ENG-01's handoff should go out early, in parallel with K-01, so
Core can build the correct long-term mechanism while K-01 ships the interim one.
**Size**: S. **Risk**: low (doc-only).
**Goal**: Core has a precise written record of what Desktop needs — a session-local
MCP-selection flag, the misleading-error report, and the stdio-policy question — and Desktop's
release-candidate handling stays fail-closed with no undocumented default turned on.
**Depends on**: Nothing.
**Requirements**: ENG-01, ENG-02, ENG-03, RCI-01
**Success Criteria**:

1. Core has received the written ask for a session-local `--mcp-server <ID>` (repeatable) plus
   `--no-mcp-servers` flag: applied after all config/profile merging, retaining exactly those IDs;
   an unknown ID is a fatal startup error naming the missing IDs; host-provided and session-local
   (never persisted); applied independently of workspace trust and assistant identity.
2. Core has received the misleading-error report: "Profile not found" is raised for a profile that
   was present in a file Core parsed and then discarded.
3. Core has been asked to confirm intent on the wire-added-stdio question, framed as a
   forward-compatibility question and never asserted as shipped behaviour — the current state
   (`v0.12.26-rc.2` still accepts stdio) is recorded alongside the observed uncommitted local edit
   that would refuse it.
4. The release-candidate integration decision is written down: `build-with-builder.js` keeps
   `prepareWaylandCore.DEFAULT_WCORE_VERSION` with `requireVerified: true` so a packaged build can
   never carry an RC — that stays correct — and any new flag introduced to relax it defaults OFF.

**Plans**: TBD (`K-04-PLAN.md`)

> ─────────── Master Class is safe at this line ───────────
> Phases `K-01` … `K-04` must ship independently of everything below.

### Phase K-05: Agent installer: npm subset

**Status**: NOT BLOCKED; begins after the K-01…K-04 boundary. New capability — detection of 18
agents already works via `AgentRegistry`; installation is the gap.
**Size**: L. **Risk**: medium.
**Goal**: A user installs a supported agent from Wayland's own Settings interface — never a shell
script — and immediately runs a chat on it, with a real uninstall path back to their prior state.
**Depends on**: Nothing technically; sequenced after the Master Class boundary per Sean's scope
decision to keep K-01…K-04 shippable independently of this L-sized product work.
**Requirements**: INS-01, INS-02, INS-03, INS-04, INS-05
**Success Criteria**:

1. An agent from the npm-installable subset installs from the Settings panel interface, is then
   detected by the existing `AgentRegistry`, and a chat runs on it — proven on a clean VM per OS.
2. Installation never uses `curl | sh`. It goes through the package manager the tool actually
   publishes to, with a pinned version and a verified checksum, matching the bundled engine's
   posture. A tool offering only a shell installer does not ship in this phase.
3. Every install requires explicit per-install consent in the interface; there is no silent
   background install.
4. Windows is first-class: PATH, `.cmd` shims, and the `shell:false` spawn trap already hit with
   `npx` (`mcpStdioSpawn.ts`) are all handled, proven on the Windows box.
5. Uninstall exists and removes exactly what was installed, **by manifest, not by name**,
   returning the machine to its prior state.

**Plans**: TBD (`K-05-PLAN.md`)
**UI hint**: yes

### Phase K-06: Agent installer: non-npm channels

**Status**: NOT BLOCKED. Sequential after K-05 — same install contract, extended.
**Size**: L. **Risk**: medium.
**Goal**: The agents that don't publish to npm get the same install guarantees as the ones that
do — no channel is allowed to be the weak one.
**Depends on**: K-05 (extends its manifest, consent, checksum, and uninstall contract).
**Requirements**: INS-06
**Success Criteria**:

1. Every non-npm channel extends the same manifest, consent, checksum, and uninstall contract
   proven in K-05; no channel weakens it — verified per channel, not asserted from the npm result.

**Plans**: TBD (`K-06-PLAN.md`)
**UI hint**: yes — same Settings interface as K-05.

### Phase K-07: Flux fan-out

**Status**: NOT BLOCKED. Depends on K-05.
**Size**: L. **Risk**: high.
**Goal**: An agent installed through Wayland immediately drives the user's own Flux key against
the pinned model catalog — the actual moat, not the installer.
**Depends on**: K-05 (an agent must be installable before it can be configured for Flux).
**Requirements**: FAN-01, FAN-02, FAN-03, FAN-04, FAN-05
**Success Criteria**:

1. After install, Wayland writes the agent's own config so its provider base URL points at Flux
   and its model list is the Flux pinned catalog; on a fresh machine — connect Flux, install the
   agent, open it, select a non-Anthropic pinned model, get a correct answer — per supported
   agent, on all three OSes.
2. Configuration uses API key and base URL only; **never Claude subscription OAuth** — standing
   hard NO on ToS grounds. This feature touches subscription auth on no agent.
3. The user can see, in the interface, every config file Wayland modified and can undo it; no key
   is written into a file Wayland does not own without saying so.
4. An agent whose config was rewritten keeps working if the user later removes Flux — the config
   is restored, not stranded.
5. Pinned models are filtered per agent capability; a model offered in an agent actually works
   there — a pinned model that 500s in Claude Code is worse than not offering it.

**Plans**: TBD (`K-07-PLAN.md`)
**UI hint**: yes

### Phase K-08: Milestone verification

**Status**: BLOCKED on K-01 through K-07 — verifies the merged state of the whole milestone.
**Size**: S/M. **Risk**: low.
**Goal**: The milestone's claims are true on the actual packaged artifact, not on a plausible
diff.
**Depends on**: K-01 through K-07.
**Requirements**: PRF-09, DIA-03
**Success Criteria**:

1. The full suite is green on the final merged state before any pass claim, beating the baseline
   of **16,231 tests, 0 failures**.
2. A live end-to-end sweep on the **packaged** artifact — not dev mode — walks the Master Class
   path start to finish: install TVControl from the Library, select Wayland Core, run a prompt,
   execute a chart tool, see the turn finish.

**Plans**: TBD (`K-08-PLAN.md`)

## Phase Ordering Rationale — WLD-K

- **K-01 is the spine and runs first — it is a ship blocker, not demo polish.** Core 0.12.26 is in
  final CI ahead of publish, and the committed Desktop pin (`v0.12.25`,
  `scripts/prepareWaylandCore.js:213`) cannot be bumped until K-01 lands, because current Desktop
  code dies at bootstrap on 0.12.26.
- **K-03 runs next** — high user-visible value, small, and it affects users on the *already
  shipped* engine today, independent of K-01.
- **K-02 runs after K-03** — small, and it prevents the next lost afternoon of misdiagnosis; not a
  hard dependency, just lower priority than the visible turn-never-finishes fix.
- **K-04 can run at any time and is doc-only.** Its ENG-01 handoff should be sent **early, in
  parallel with K-01**, so Core can build the architecturally correct session-local flag while
  K-01 ships the interim global-config mechanism.
- **Explicit boundary after K-04: "Master Class is safe at this line."** Phases K-01…K-04 must be
  shippable with none of K-05…K-08 — this is what let Sean keep all seven packets in one milestone
  without risking the demo.
- **K-05 → K-06 run sequentially** — same install contract (manifest, consent, checksum,
  uninstall), extended from npm to non-npm channels.
- **K-07 depends on K-05** — an agent must be installable before it can be configured for Flux.
- **K-08 runs last** — full-suite green plus a live packaged-artifact sweep, over the merged state
  of everything above.

## Milestone-wide execution constraints — WLD-K

These bind every phase in WLD-K. A phase plan may add constraints; none may weaken these.

| Constraint | Rule |
| --- | --- |
| Promotion | No merge, tag, or release without the owner. `build-and-release.yml` fires on **any** tag. |
| Generated file | Never commit `src/process/services/constitution/constitutionFsAuthority.generated.ts`. |
| Security shell | Never weaken `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`, CSP, `bridgeAllowlist.ts`, `urlValidation.ts`, DOMPurify, `safeStorage`. Never touch the signing pipeline. No forged attestations; any new flag defaults OFF. |
| Schema identity | `migrations.ts` `aionrs` SQL literals never change. `FoundrySkills` / `foundry-skills` is never renamed. |
| Hooks / history | `prek run --all-files` is forbidden. No history rewriting. No AI attribution trailers. |
| TVControl | `ui_evaluate` stays disabled behind `TV_MCP_ADVANCED=1`; no WLD-K packet flips it. |
| Proof standard | Every mechanism claim is established by **executing** it against a real engine, never by reading source. Any search returning zero is disbelieved until the same method is shown to find a **known positive**. |
| Dual-version acceptance | Every PRF requirement is proven on **both** 0.12.25 and 0.12.26 (rc.2 until stable publishes, stable thereafter). |
| Full suite | `npx vitest run` before any pass claim. Baseline to beat: **16,231 tests, 0 failures**. |

## Requirement Coverage — WLD-K

| Phase | Requirement IDs | Count |
| --- | --- | --- |
| K-01 Move the launch profile out of project config (the spine) | PRF-01…PRF-08 | 8 |
| K-02 Honest failure surfacing | DIA-01, DIA-02 | 2 |
| K-03 The turn that never finishes | TRN-01, TRN-02, TRN-03 | 3 |
| K-04 Engine asks and release-candidate policy | ENG-01, ENG-02, ENG-03, RCI-01 | 4 |
| K-05 Agent installer: npm subset | INS-01…INS-05 | 5 |
| K-06 Agent installer: non-npm channels | INS-06 | 1 |
| K-07 Flux fan-out | FAN-01…FAN-05 | 5 |
| K-08 Milestone verification | PRF-09, DIA-03 | 2 |
| **Total** | | **30 mapped exactly once; 0 unmapped** |

Full definitions and traceability: `.planning/REQUIREMENTS.md`, section "WLD-K — Core First
Requirements". The **30** distinct REQ-IDs are `PRF-01…PRF-09`, `DIA-01…DIA-03`, `TRN-01…TRN-03`,
`ENG-01…ENG-03`, `RCI-01`, `INS-01…INS-06`, `FAN-01…FAN-05`, each mapped exactly once below.

> **Resolved 2026-08-08.** The requirements section originally closed by claiming "31 requirements".
> Direct enumeration found 30; the roadmapper flagged the mismatch rather than inventing a 31st to
> make the arithmetic work. The miscount was in the closing line, not in the requirement set — the
> line now reads 30. No requirement was added, removed, or renumbered.

Nothing above this milestone (WLD-I's 42 requirements, or the Phase 1-7 milestone's 55 current + 13
deferred requirements) is touched by this count.

## Progress — WLD-K

| Phase | Plans Complete | Status | Completed |
| --- | --- | --- | --- |
| K-01 Move the launch profile out of project config (the spine) | 0/? | Not started — ship blocker, runs first | - |
| K-02 Honest failure surfacing | 0/? | Not started | - |
| K-03 The turn that never finishes | 0/? | Not started | - |
| K-04 Engine asks and release-candidate policy | 0/? | Not started (ENG-01 handoff to send early, parallel with K-01) | - |
| K-05 Agent installer: npm subset | 0/? | Not started | - |
| K-06 Agent installer: non-npm channels | 0/? | Not started | - |
| K-07 Flux fan-out | 0/? | Not started | - |
| K-08 Milestone verification | 0/? | Blocked (K-01…K-07) | - |

## Explicitly rejected — record so nobody retries (WLD-K)

- `--trust-workspace` — trips Core's `executable_surface_symlinks_fail_closed` rule because
  builtin skills are symlinked, and wrongly auto-trusts user-cloned repos. Reverted in
  `3ebacf41c`.
- Option C, ephemeral `WAYLAND_HOME` root — the config root also holds `memory.db` and skills, so
  it destroys memory continuity, and Core refuses symlinks that would restore it.
- Option F, `only_for_assistant` scoping as the primary mechanism — it can only *restrict*; an
  unmarked server is *always* injected, so it cannot enforce an exact per-chat allow-list, and one
  missed marking is a cross-chat tool leak. Retained only as possible later defence-in-depth.
- Migrating existing `@native` users onto a Desktop-owned named profile inside this milestone — it
  carries `memory.db`, credentials, skills and hand-edited config; a real rollback-capable
  migration project, not a selector change.

## UI hint — WLD-K

Partial. K-02 (failure reason surfaced in the UI), K-03 (turn/running state in the UI), K-05/K-06
(Settings-panel installer interface), and K-07 (modified-config visibility and undo in the
interface) touch user-facing surface and carry a per-phase `**UI hint**: yes` annotation above.
K-01 is backend config-plumbing and K-04 is doc-only; neither carries an annotation. K-08 verifies
existing surfaces rather than building new UI, so it carries none either. Where `/ferrox-ui-phase`
is warranted, run it against K-02, K-03, K-05, K-06, and K-07 specifically, not the whole
milestone.
