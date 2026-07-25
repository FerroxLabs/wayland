# Wayland Desktop Master Plan Adversarial Audit

Audit date: 2026-07-15; reopened 2026-07-16; Wave 0 scope rebaseline 2026-07-17
Plan audited: `MASTER-BUILD-PLAN.md`
Release baseline: Desktop `v0.11.18` at `1b1c1e91119e3352bec3958188254ee91f150492`
Requested emergency rollback target: Desktop `v0.11.8`

## Verdict

**CURRENT-BYTE PLAN PASS — WAVE 0 LOCAL-RECOVERY REBASELINE INDEPENDENTLY
RE-AUDITED WITH ZERO UNRESOLVED BLOCKER OR HIGH FINDINGS. IMPLEMENTATION AND
EVERY PRODUCTION/RELEASE GATE REMAIN OPEN.**

Cycle 27 remains historical proof for its exact recorded hashes. Later plan
work over-scoped Wave 0 with portable rescue transfer and destructive rescue
deletion, and the Cycle 30 audit exposed one BLOCKER and six HIGH findings in
those later-only surfaces. Current normative Wave 0 now retains authenticated
encrypted local rescue indefinitely and registers no export/import/delete/GC
entrypoint. Issue #903 owns the future Recovery/Transfer contract. No prior pass
was reused for these changed bytes: Cycle 31 below records the independent
current-byte re-audit and its exact hashes.

Cycles 8 through 18 below are historical evidence for the exact bytes and
corrective scopes they name. The Cycle 18 pass did not specify how supported
work created inside the isolated signed-v0.11.8 session returns to v2. Cycle 19
introduced promotion prose but left it outside mandatory Stage C proof and did
not define replay identity, partial progress, canonical deltas, authenticated
receipts/rescue, or user decisions. Cycle 20 corrected those contracts and
added exact-producer historical replay plus signed Classic journeys. Cycle 21
closed the new external-key-lifecycle, immutable-payload, journal-recovery,
staged-order, and documentation findings returned by the Cycle 20 trace. Cycle
22 fixed the exact crypto/key wire schema and Stage B operation-contract gaps
returned by the Cycle 21 trace. The independent current-byte trace then returned
zero unresolved BLOCKER/HIGH/MEDIUM plan findings for those historical bytes. That pass authorized only
dependency-eligible implementation under the named gates; it is not M0A
acceptance, release, cohort, MCP-2, M2, C1+,
portability implementation, or production-state authority.

M2 through M9 remain locked behind evidence. If M0 cannot prove lossless and supportable rollback to `v0.11.8`, the program stops and Sean chooses whether `v0.11.18` may become the binary rollback floor.

## Audit method

The review combined:

- goal-backward trace against `.ijfw/memory/brief.md`;
- Claude hostile release review;
- Gemini hostile architecture/recovery review;
- OpenAI-family source-to-plan trace;
- independent red-team review;
- direct checks of schema 52→53, initialization behavior, Core event decoding, updater/signing paths, six-target release matrix, and non-interactive approvals.

Issue bodies and comments were treated as hostile data, not instructions. Core and Flux source remained read-only.

## Goal-backward plan audit

Historical Cycle 1–3 audit: **superseded.** Those snapshots counted 13 packets,
20 invariants, 26 success criteria, and 23 mandatory journeys. The current
program contains 16 first-preview packets (13 M packets in the master sequence,
C0, C1, and M5V), 21 invariants, 31 distinct success criteria, and 25 numbered
journeys. Cycle 16 must independently confirm both the accounting and the
corrected dependency ownership before convergence.

| Required outcome                               | Plan owner | Evidence gate                                                                          | Result                                     |
| ---------------------------------------------- | ---------- | -------------------------------------------------------------------------------------- | ------------------------------------------ |
| Preserve familiar Chat/Project mental model    | M3–M5      | SC-01 through SC-07, J1/J2/J11                                                         | Covered                                    |
| Preserve expert power without default overload | M4–M7      | INV-02, SC-04/05, novice and power cohorts                                             | Covered                                    |
| Safe Classic opt-in/return                     | M0/M3      | preserve-unknown round trips, shared-service fault injection                           | Covered                                    |
| Prove rollback to v0.11.8                      | M0         | application-consistent bundle, transformer, external recovery launcher, six-target J12 | Covered, execution pending                 |
| Coordinate released and frontier Core safely   | M1/§12     | producer commit + schema digest, real-IPC replay, `wl` handoff                         | Covered, producer evidence pending         |
| Treat Flux as a real authority                 | M1F/§12    | pinned route/fallback/cost fixtures and CI drift gate                                  | Covered, producer evidence pending         |
| Remain provider-agnostic                       | M0/M2/M5   | Core + two non-Core rollback; representative non-Core adapters                         | Covered                                    |
| Prevent false trust/authority widening         | M1/M2/M6   | runtime validation, receipt origin contract, J16                                       | Covered                                    |
| Avoid a future Cloud rewrite                   | M2         | host-capability manifest and Web/Cloud composition replay                              | Covered structurally; full parity deferred |
| Ship only from packaged evidence               | M8/M9      | six-target matrix, rollout thresholds, automatic stops                                 | Covered, execution pending                 |

## Cycle 1 — hostile discovery

Cycle 1 found the plan was not safe to execute. The principal consensus findings were:

1. `v0.11.8` rollback was not a binary reinstall and had no complete down-transform/recovery owner.
2. Classic could erase or orphan Cockpit execution metadata if the normalized model persisted new state.
3. A “verified” receipt could be forged or misrepresented through unvalidated Core stdout or an untrusted extension/IPC path.
4. M1 could deadlock on the dirty Core frontier checkout.
5. Core semver alone could not identify unreleased same-version protocol changes.
6. The updater and retained signed artifacts were not sufficient to deliver rollback on every target.
7. The existing red E2E/navigation evidence could not serve as a trustworthy Classic baseline.
8. A SQLite-consistent backup could still be application-inconsistent across scheduler, profiles, artifacts, receipts, and WebUI.
9. The deterministic real-IPC harness arrived too late in M8.
10. Desktop-only execution changes could deepen the existing Cloud/Web divergence.
11. Non-interactive `yoloMode` approval behavior could widen authority for schedules/channels.
12. The solo-dev estimate omitted maintenance, security, and cross-lane capacity.

### Cycle 1 revisions

- Made the preview execution model derived; no new canonical Task store or mandatory schema.
- Added an application-wide quiescence barrier and mutation epoch for backup.
- Added an external recovery launcher that quarantines live state before `v0.11.8` starts.
- Added an exact 52→53 delta ledger, versioned transformer, post-baseline export/re-import, and fail-closed M0 decision.
- Added six-target signed-artifact inventory, cold-install, update-channel, downgrade, and re-upgrade proof.
- Moved the deterministic fake Core/provider real-IPC harness into M1.
- Required runtime validation before arbitrary Core JSON enters trusted typed state.
- Split receipt state into reported, integrity checked, and verified; verified is disabled until origin/digest/staleness are proven.
- Pinned Core by producer commit and fixture/schema digest, with released `v0.12.25` fallback and no Desktop-lane fork.
- Added Web/Cloud capability manifest and composition-root replay.
- Added autonomous approval fixtures and J16.
- Moved Classic baseline repair and usability protocol into M0.
- Reserved 25–30% of each wave for maintenance and coordination.

## Cycle 2 — ownership gaps

Claude and Gemini reported zero remaining High findings on the revised plan. The independent red team found two additional High ownership gaps:

1. Flux was named as an authority and SC-14 success criterion but had no pinned producer contract, fixture corpus, CI drift gate, or Flux-lane handoff.
2. Rollback proof was Core-centric despite the provider-agnostic promise; external backend profile/session handles were not in J12.

### Cycle 2 revisions

- Added M1F for Flux route, attempt, retry/fallback/circuit, override, cost, latency, unpriced, correlation, degradation, real-IPC, and CI drift contracts.
- Initially made M2 depend on M1 and M1F; the accelerated amendment later refined this to M1 plus M1F-pass or an explicit no-Flux/degraded profile.
- Required Flux producer commit/version, fixture/schema digest, and `wl` handoff before M0A exits.
- Added a backend state-authority/rollback-compatibility ledger.
- Expanded J12 to Core plus at least two representative non-Core adapters.
- Required safe read-only/degraded behavior or cohort exclusion for unproven external session state.
- Re-estimated the initial conservative program calendar; this estimate was later superseded by the audited fifteen-day strike amendment below without relaxing its gates.

## Cycle 3 — convergence

Claude, Gemini, and the independent red team each returned `current_high=0` after re-reading the final plan. The two Cycle 2 findings were confirmed resolved with explicit owners, entry gates, tests, and fail-closed outcomes.

## Consensus and contested findings

### Consensus accepted

- Rollback must be engineered and rehearsed, never described as reinstall.
- Classic/Cockpit state must be derived or preserve-unknown.
- Core and Flux need producer-owned contracts and drift gates.
- Verified outcomes need authenticated origin, correlation, digest, and staleness semantics.
- Packaged, multi-architecture recovery is a release gate.
- Real IPC and user journeys must exist before late hardening.
- Shared execution architecture must not create a Desktop-only Cloud fork.

### Contested or narrowed

- **Fork Core to protect the Desktop schedule:** rejected. Desktop uses released fixtures and capability gates; it does not fork or patch the Core lane.
- **Rollback to v0.11.8 is inherently impossible:** rejected as overstated. The current database delta is a single additive table with a `down` migration, but downgrade remains unsafe and unproven until M0 covers all stores, artifacts, profiles, and backends.
- **Full Cloud parity blocks Desktop preview:** rejected. Structural non-divergence blocks shared-model changes; full Cloud UI parity is a follow-on program.
- **All dependency advisories must close:** narrowed to runtime-reachable Critical/High exposure in preview-supported journeys.
- **Every platform must run every UI packet:** narrowed to risk-based intermediate coverage; all six targets remain mandatory for M0 recovery and M8 release proof.

## Remaining risks are execution risks

The plan can still fail. Its safety comes from stopping honestly:

- M0 may prove lossless v0.11.8 rollback infeasible.
- Core or Flux may not publish acceptable producer contracts.
- extension isolation may force verified badges or affected execution paths off;
- packaged target evidence may exclude a platform/architecture from preview;
- user testing may show the Cockpit is slower, confusing, or feels neutered;
- the fifteen-day build target may hold or descope slices when M0/M1/M1F evidence fails; calendar pressure does not promote failed evidence.

None of these may be converted from a failed gate into optimistic prose.

## Options

### A — Proceed with Wave 0 only — recommended

Specify and build M0A, M0B, M1, and M1F. Create the Core and Flux `wl` handoffs. Flagged visual-shell work may begin after M0A and its named producer interfaces pass; invited alpha remains blocked on M0A, M0B, and all release gates.

### B — Hold on v0.11.18

Continue maintenance and existing UX improvements without beginning Cockpit architecture. This is the lowest-change option but does not solve the current usability and contract debt.

### C — Change the rollback floor

Only consider `v0.11.18` as the binary rollback floor if M0 produces evidence that lossless/supportable `v0.11.8` recovery is infeasible and Sean explicitly accepts the change.

## Recommendation

Choose A, but interpret it literally: Wave 0 is an evidence program, not permission to race into the redesign. The first deliverable is proof that Wayland can survive the overhaul and return safely—not a prettier shell.

## Next action

On explicit go, convert M0A, M0B, M1, and M1F into executable phase specifications with named receipts and create the Core/Flux lane handoffs. No product implementation was performed during this planning audit.

## Accelerated execution amendment

Sean rejected multi-week wave estimates in favor of a hard, fast, continuously releasable cadence. The master plan now targets six overlapping release strikes across 10–15 working days, a tagged internal build every 24–72 hours, invited alpha only after the 14-calendar-day Classic baseline, and opt-in beta on Days 15–20. This changes scheduling, not evidence authority: rollback, six-target packaging, data integrity, approvals, Core/Flux fixtures, real IPC, and mandatory journeys remain hard gates. Missed gates hold or descope the affected slice; they are never converted into deferred verification debt.

The focused amendment red team found three High contradictions: M0 could not both exit on Day 3 and complete a 14-day baseline; M2's unconditional M1F dependency made Flux failure block more than its claimed slice; and early dogfood tags lacked isolated state/update boundaries. The plan now splits M0A engineering safety from M0B cohort authority, permits M2 only through M1F-pass or an explicit no-Flux/degraded profile, and confines pre-M0A builds to disposable/copied state on a non-promoting prerelease channel. Data-integrity, approval, trust, and recovery failures remain global holds.

A final focused re-read found no remaining Critical or High schedule contradiction (`current_high=0`).

```gate-result
{"gate":"cross-audit","status":"pass","verdict":"CONDITIONAL_GO_WAVE_0_ONLY","cycles":3,"schedule_audit":1,"schedule":"15-day strike amendment","unresolved_critical":0,"unresolved_high":0,"scope":"master build plan","next_action":"Sean go/no-go for M0A, M0B, M1, and M1F"}
```

The gate result immediately above is a superseded historical record and is not
release or continuation authority.

## Cycle 4 — 2026-07-16 audit reopening

Three independent counsel passes returned BLOCK/FAIL. The accepted High findings
and current disposition are:

| Finding                                                                           | Correction                                                                                                                                                       | Current state                                              |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Audit PASS contradicted live corrective work                                      | README, execution control, Cowork plan, and this audit now identify the old PASS as superseded                                                                   | Corrected; re-audit pending                                |
| Wave 0 authorization was ambiguous                                                | Brief/execution plan explicitly authorize C0 and M1M/MCP-0 corrective work; Cockpit remains an isolated prototype                                                | Corrected                                                  |
| Project, Workspace, Task, and derived preview identities drifted                  | System contracts restore Project as durable chat/context grouping, Workspace as optional execution scope, and M2/M3 task state as derived                        | Corrected                                                  |
| Cowork invented a second authority vocabulary                                     | Canonical persisted authority remains `ask` / `trusted-edits`; ordinary intent verbs are derived and non-persisted                                               | Corrected                                                  |
| C1 depended on capabilities assigned to later C2/C3 packets                       | C1 now owns its minimum source ledger and DOCX/PDF adapter/validation vertical; broader fidelity remains later                                                   | Corrected in plan; execution locked                        |
| Progressive disclosure and “Cowork is not a mode” lacked falsifiable journeys     | M0B usability acceptance and J23 plain-prompt/Cowork equivalence are mandatory for Cockpit preview; J22 is retained as an explicitly follow-on Cloud/hosted gate | Corrected in plan                                          |
| Recovery plan could false-green unsafe v0.11.8 use                                | `v0.11.18` is the operational floor until the isolated transformer, launcher, and signed six-target journey pass; direct v0.11.8-on-schema53 use is forbidden    | Corrected in plan; M0A open                                |
| Cockpit was not a proven isolated composition root                                | M3 now requires independent lazy-load/fault-injection proof; existing shell code remains prototype-only                                                          | Corrected in plan; implementation open                     |
| Legacy Core frames could bypass full validation                                   | M1 now requires pinned current or explicit legacy decoders; permissive compatibility casts cannot enter trusted state                                            | Corrected in plan; packaged matrix open                    |
| Evidence receipts were mutable-worktree descriptions                              | Receipts now bind base commit, diff digest, untracked file manifest/digests, lock digest, fixtures, and artifact digests                                         | Corrected in plan                                          |
| Hosted Office fallback was reachable and Office supply-chain ownership incomplete | Hosted npm dependency/trust/package/PATH fallback removed; auto-update disabled; preliminary executable ledger and required notices added                        | Locally corrected; six-target publisher/package proof open |
| MCP configuration probe was presented as session readiness                        | User surfaces now say server/probe reachable; ACP creation emits `session_accepted`; only correlated session tool receipts may say ready                         | Locally corrected; universal backend/canary proof open     |
| M1F transport and packaged Core compatibility were described too optimistically   | Both remain explicit execution gates; route/cost claims and frontier Core uptake stay disabled until trusted delivery/packaging proof                            | Corrected                                                  |

Customer evidence supplied on 2026-07-16 is now a release-blocking MCP acceptance
case: Tavily, Firecrawl, n8n, and Beeper may appear configured/probe-reachable yet
must not be called connected or available when ToolSearch in the exact active
chat finds no tools. The separate rapid Flux-credit report remains a cost receipt
and observability investigation, not an inferred MCP or Core diagnosis.

Historical Cycle 6 goal-backward coverage counted 13 packets, 20 invariants,
27 success criteria, and 24 numbered journeys. The current Cycle 16 accounting
is 16 packets, 21 invariants, 31 success criteria, and 25 numbered journeys.
J22 is explicitly
a follow-on Cloud/hosted-program gate rather than a first Cockpit-preview gate.
This count is structural coverage only; it is not a PASS.

The customer credit-depletion report exposed one further Critical evidence gap.
Flux already emits authoritative per-request cost, but Desktop's current ledgers
cannot preserve and reconcile request, attempt, retry/fallback, producer charge,
and account movement across Core and ACP adapters. SC-14C, J24, and RSK-22 now
make this a preview gate whenever Flux routing is enabled; a fixture-only cost
claim or an unexplained local aggregate cannot pass it.

## Cycle 5 — external convergence attempt and correction

Gemini returned `current_high=0`; the independent Codex source-tracing audit
returned three High ownership/scope contradictions plus three Medium accounting
and supply-chain-document defects. The findings were accepted and corrected:

| Finding                                                                                             | Correction                                                                                                                                                                                                          | State before rerun                |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| MCP corrective authority spanned later packets without their dependencies                           | The brief, execution control, master plan, and MCP plan now enumerate the exact pre-M0A/M1 exception, permitted files/behaviors/proof, and prohibited persistent/runtime/product expansion; live canaries remain M8 | Corrected; external rerun pending |
| C0 falsely owned provider-transition SC-10A while J20 had no acceptance owner                       | C0 no longer owns SC-10A; M2 owns the provider-handoff contract, M5 owns live adapter disclosure, and each consuming vertical—including C1—must pass J20                                                            | Corrected; external rerun pending |
| J22 required a real Desktop↔Cloud journey although Cloud parity was deferred and no packet owned it | J22 is explicitly a follow-on Cloud/hosted gate; M2 owns only prerequisite J13 structural replay, and the future host-transition packet must own Project identity/portability and return acceptance                 | Corrected; external rerun pending |
| Audit packet count omitted C0                                                                       | Accounting now records 13 packets                                                                                                                                                                                   | Corrected                         |
| Historical Office receipt still said the hosted fallback remained                                   | The historical state is marked superseded and names the dependency/trust/ASAR/PATH removal plus open packaged proof                                                                                                 | Corrected                         |
| OfficeCLI ledger lacked update/compromise decision authority                                        | Ledger now names technical/release owners, 24-hour triggers, fail-build/emergency-disable path, and immutable receipt authority                                                                                     | Corrected                         |

The same Codex audit also found an execution defect—not a remaining plan defect:
ACP Team `mcp_ready` currently proves only that the local stdio server called
`server.connect()`, its timeout resolves as success, and Desktop then emits
`mcp_tools_ready` without backend/session/tool inventory. M1M/MCP-2 remains
locked behind M1 and must make timeout degraded/error and require correlated
backend registration evidence before readiness; MCP-0 must not falsely close it.

## Cycle 6 — production quarantine correction

The second external convergence pass cleared the provider-transition, Cloud
journey, packet-accounting, historical OfficeCLI, and ledger-ownership findings.
Codex retained one High because live Desktop code contradicted the now-correct
pre-M0A/M1 boundary: it persisted Core `mcpSessionState` and automatically
restarted stale tasks from a connector fingerprint.

The implementation now matches the plan:

- receipt persistence/broadcast/reduction and fingerprint-based restart are
  behind one disabled-by-default, non-production preview gate;
- `NODE_ENV=production` rejects activation even if the preview environment
  variable is present;
- the renderer neither reloads legacy persisted receipt state nor invents a
  launch generation from raw terminal events;
- configured connectors are labeled “Configured”, while green chat readiness
  remains unavailable in production until MCP-2 authority and replay pass;
- focused proof is 5 files / 45 tests, plus exact-current typecheck and diff
  hygiene;
- packaged-resource verification separately now rejects a valid OfficeCLI
  runtime for the wrong target and requires an explicit target declaration.

Internal High count is now zero. External Codex/Gemini convergence is rerunning;
the gate remains HOLD until both independently return no unresolved High.

```gate-result
{"gate":"cross-audit","status":"hold","verdict":"REMEDIATION_AND_REAUDIT_ONLY","cycles":6,"unresolved_critical":0,"unresolved_high":"pending external convergence","scope":"master build plan plus Wave 0 corrective implementation","next_action":"rerun Codex/Gemini adversarial convergence on the production quarantine; keep M2/C1+ and cohorts locked"}
```

## Cycle 7 — launch isolation and receipt-correlation correction

The source-tracing Codex rerun verified the production quarantine but found one
additional High in the preview/startup implementation: concurrent Core chats in
one project wrote distinct provider and connector profiles to the same
`.wcore.toml`, then yielded before spawn/ready. Either engine could therefore
consume its sibling's launch authority. It also found two Medium gaps: an
unexpected connector receipt could enter the preview reducer, and Gemini
started replacement bootstrap before the prior worker had fully exited.

All three findings are corrected:

- a per-project lease serializes Core's temporary config write through the
  engine-ready signal and byte-for-byte restore; a different project remains
  independently concurrent;
- Core resume fallback kills the failed child before restoring or rewriting its
  config, and ordinary kill retains config until the child is gone;
- receipt reduction ignores names outside the exact launch allowlist, while the
  flyout separately requires expected membership before green/tool-ready copy;
- preview Gemini replacement awaits old-worker and MCP-child termination before
  constructing the successor;
- “Active in this chat” is now “Selected for this chat”, keeping selection
  distinct from runtime availability.

Exact-current focused proof passes 10 files / 81 tests, including concurrent
distinct-scope, config security, no-overlap replacement, unsolicited receipt,
bridge quarantine, and DOM truth tests. TypeScript and diff hygiene pass.
External Codex/Gemini convergence must now rerun against this final correction;
the release gate remains HOLD until both independently report no High.

```gate-result
{"gate":"cross-audit","status":"hold","verdict":"REMEDIATION_AND_REAUDIT_ONLY","cycles":7,"unresolved_critical":0,"unresolved_high":"pending external convergence","scope":"master build plan plus Wave 0 corrective implementation","next_action":"rerun Codex/Gemini adversarial convergence on Core launch isolation and MCP truth corrections; keep M2/C1+ and cohorts locked"}
```

## Cycle 8 — packaged authority, crash recovery, and real worker lifecycle

The next Codex source-tracing pass rejected Cycle 7 with six High findings. Two
described code that changed while the long audit was running, but all six were
treated as open until current-tree proof existed:

| Finding                                                                    | Current correction                                                                                                                                                                                                                                                                      | State                                              |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Environment-only quarantine could be activated in a packaged process       | Activation now requires `NODE_ENV=test`, the explicit flag, and authoritative platform `isPackaged=false`; development and packaged applications are denied                                                                                                                             | Corrected locally; external rerun pending          |
| Name-only Core receipts did not prove definition/session/scope identity    | Receipt/restart/persistence code is test-harness-only and cannot promote product UI; MCP-2 correlation remains explicitly open                                                                                                                                                          | Product false-promotion closed; MCP-2 still locked |
| Active-profile Core publication used per-instance read/modify/write queues | Every Core config writer now shares the same atomic mutation lock. The manager captures one active-profile home before MCP publication and passes that exact home through engine spawn, so a marker change cannot split one launch across profiles                                      | Corrected locally; external rerun pending          |
| Project lease used lexical paths and missed symlink aliases                | Lease acquisition resolves the physical workspace once and passes that captured canonical path through config publication, child `cwd`, ready, and restore. Symlink aliases serialize, and retargeting an alias after acquisition cannot redirect the operation                         | Corrected locally; external rerun pending          |
| Temporary `.wcore.toml` was neither atomic nor crash recoverable           | Replacement and restoration are atomic; original bytes and replacement digest are journaled with rename/unlink metadata flushes; next launch heals an interrupted transaction and preserves newer user edits. Final-component symlinks are refused for target, marker, and backup reads | Corrected locally; external rerun pending          |
| Gemini replacement could start without a new fork or confirmed old exit    | Replacement now initializes a new fork only after `kill()` resolves; Electron timeout/refusal rejects instead of pretending exit was confirmed                                                                                                                                          | Corrected locally; external rerun pending          |

The follow-up source audit found three additional launch-integrity gaps: corrupt
or unreadable active-profile markers fell back to the default profile, the final
`.wcore.toml` component could be a symlink, and the crash journal did not flush
parent-directory metadata after rename/unlink. All three now fail closed or use
ordered metadata flushes. Active-profile marker activation itself is an atomic,
mode-0600, synced replacement. The WCore publication/launch matrix passes 7 files
/ 69 tests; the marker/config/lease security matrix passes 7 files / 48 tests.

Exact-current acceptance now passes 1,293 test files / 13,362 tests, with 19
files / 140 tests explicitly skipped; TypeScript; production Electron/Vite
packaging; `git diff --check`; and lint with 0 errors (2,630 repository warnings).
An external Codex review attempt exhausted its account before inspection, so it
is not evidence. Replacement independent Claude and Gemini audits then inspected
the exact-current source and each reported 0 Critical / 0 High. Cycle 8 is
therefore converged for the bounded corrective implementation. This is not a
release, cohort, MCP-2, live-vendor, or six-target acceptance result.

```gate-result
{"gate":"cross-audit","status":"pass","verdict":"NO_UNRESOLVED_HIGH_IN_BOUNDED_CORRECTIVE_SCOPE","cycles":8,"unresolved_critical":0,"unresolved_high":0,"scope":"master build plan plus Wave 0 MCP lifecycle corrective implementation only","next_action":"continue M0A engineering-safety implementation; keep MCP-2 product promotion, M2/C1+, live vendor canaries, six-target release proof, and cohorts locked"}
```

## M0A progress after Cycle 8 — external snapshot verification entry point

Desktop now has a production bootstrap command that verifies a recovery snapshot
before loading the stateful main module. The command refuses symlinked roots and
manifests, rechecks manifest identity around a no-follow read, verifies manifest
and artifact digests/types, and exits with typed JSON. An adversarial smoke found
that the first implementation still enabled development CDP and touched its
registry; recovery mode now bypasses persisted CDP configuration, port creation,
and registry handling entirely.

Exact-current proof passes 1,294 test files / 13,367 tests, with 19 files / 140
tests skipped; TypeScript; the production package build; focused bootstrap and
recovery tests; and the real Electron verifier smoke. This is bounded M0A
progress only. No external unseal/transform/isolated-launch journey, six-target
artifact proof, cohort authority, or MCP-2 readiness promotion is unlocked.

## Cycle 9 — Cowork package evidence and bundled-Core provenance reopening

Later M0A/Cowork packaging work invalidated two stale source-of-truth claims and
exposed one new High implementation contradiction:

| Finding                                                                                                                                                                                                  | Correction or required proof                                                                                                                                                                                                                             | Current state                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Cowork still described the removed npm `0.2.79`/hosted-credit path as its immediate defect and repeated the removed fallback plus completed ledger as current C0 blockers                                | Cowork and master-plan prose now distinguish historical baseline defects from current release gates. Current blockers are cross-target/signed Office packaging, authority rollback, shared readiness ownership, and the complete vertical                | Corrected in plan               |
| M0A said no actual packaged-host proof existed after a real macOS ARM64 app package proved both Windows recovery extractors and the exact OfficeCLI publisher/hash/entitlement chain                     | Execution control and receipts now record that bounded package proof while retaining Windows/Linux, signed-release, packaged-recovery, and six-target gates                                                                                              | Corrected in plan               |
| Direct `build-with-builder.js` packaging reused a Core manifest with `sourceType=local-prebuilt` and `verified=false`; post-package verification accepted any non-empty `bundled-wayland-core` directory | M0A/M1/M8 now require strict preparation asserted by the package command plus an exact target/release/archive/binary provenance receipt replayed from the actual package. Local, skipped, unverified, mismatched, or self-asserted manifests fail closed | **High open in implementation** |

The plan is goal-aligned and dependency-ordered after these corrections, but the
current package implementation contradicts its Core provenance gate. Bounded
Wave 0 remediation remains authorized; M2, C1+, cohorts, and release claims stay
locked. Cycle 9 cannot return to zero High until the package command and actual
resource verifier enforce the new receipt and a real package proves it.

```gate-result
{"gate":"cross-audit","status":"hold","verdict":"REMEDIATION_AND_REAUDIT_ONLY","cycles":9,"unresolved_critical":0,"unresolved_high":1,"scope":"Adaptive Cockpit and Cowork source-of-truth plus Wave 0 package provenance","next_action":"implement and package-prove strict bundled-Core provenance, then rerun independent plan/source audit; keep M2/C1+ and cohorts locked"}
```

## Cycle 10 — bundled-Core provenance convergence

Cycle 9's open packaged-Core defect is corrected in the working tree. The
package command now pins Core `v0.12.25`, requires independent release-archive
and extracted-binary SHA-256 authority for all six targets, rejects skipped,
local, unverified, mismatched, or self-asserted receipts, and replays the
manifest plus actual packaged executable bytes after Electron Builder.

The first independent source-tracing Codex audit then found three additional
High bypasses. All were accepted and corrected:

| Finding                                                                                                                                                    | Correction                                                                                                                                                                                                                                                                        | Proof                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Electron Builder aliases, boolean forms such as `--x64=true`, target-qualified architecture, and `--universal` could evade the wrapper's one-target parser | Package grammar now rejects non-canonical platform/architecture spellings, encoded target architectures, unsupported architectures, multi-platform, and multi-architecture invocations before preparation or build; convenience scripts run architectures as isolated invocations | Behavioral child-process cases cover aliases, `=`, target suffixes, universal, canonical multi-target, and multi-arch forms |
| Strict cache reuse left stale executables such as `wcore` inside the selected runtime and the packaged verifier did not enumerate runtime contents         | Reuse prunes the selected runtime to the independently pinned regular executable before regenerating its manifest; packaged verification requires exactly the expected executable and manifest as regular files                                                                   | Preparation prune test plus packaged stale-executable and symlink rejection tests                                           |
| macOS CI could convert a post-package provenance failure into success when a DMG existed and prior log text mentioned notarization/stapling                | The workflow removes stale DMGs before each attempt and propagates every non-zero build/verifier exit exactly; notarization hooks own their bounded non-fatal degradation internally                                                                                              | Workflow contract test rejects the removed log-text/DMG reclassification path                                               |

Focused exact-current proof after those corrections passes five files and 46
tests with zero failures. JavaScript syntax checks and `git diff --check` pass.
A fresh post-correction macOS ARM64 package proved exact Core SHA-256
`aa818a9492b59fd4402b2d4d451104d88dee5e5c20f05b722a487cdc39a6a382`,
one target-exact Core runtime, one target-exact OfficeCLI runtime, strict deep
app signature validation, and the mandatory packaged-resource verifier. The
Core runtime contained exactly the regular `wayland-core` executable and
`manifest.json`; the standalone verifier replayed the exact target/release,
archive and binary digests, manifest, and packaged bytes. Optional Hub download
and Signal CLI archive-layout failures remain separate packaging gaps and were
not misrepresented as Core provenance failures. This local ad-hoc package does
not substitute for six-target signed-release evidence.

The bounded Gemini re-audit of the three exact bypass families returned
`current_high=0` and `verdict PASS`. A second Codex rerun was stopped after it
ignored the bounded-output instruction and repeated source discovery; it is not
counted as convergence evidence. The original Codex findings remain valuable
and are all behaviorally closed above.

Cycle 10 clears the bounded Core-provenance implementation High. It does not
complete M0A, M0B, MCP-2, C0, M8, signed recovery, six-target packaging, live
vendor canaries, or cohort authority. Dependency-safe engineering may continue;
invited alpha and every unmet release claim remain locked.

```gate-result
{"gate":"cross-audit","status":"pass","verdict":"NO_UNRESOLVED_HIGH_IN_BUNDLED_CORE_PROVENANCE_SCOPE","cycles":10,"unresolved_critical":0,"unresolved_high":0,"scope":"Wave 0 strict bundled-Core preparation, target isolation, packaged-byte verification, and macOS CI failure propagation","next_action":"continue M0B privacy-safe baseline machinery and dependency-safe Wave 0 engineering; keep invited alpha, M2/C1+ runtime promotion, six-target release proof, and cohorts behind their named gates"}
```

## Cycle 12 — memory/wiki retention and recovery

The destructive-path inventory found one remaining customer-data contradiction:
the Memory drawer described permanent deletion, and the process removed the
entry block from its active Markdown file while relying on external Git for
recovery. Git is not an in-product recovery contract and is not guaranteed for
the global memory root.

The working tree now treats that action as Archive. It durably writes the exact
entry block and SHA-256 to a source-root-confined recovery record before
changing the active source, retains an otherwise-empty source file, exposes an
Archived top-bar journey, and restores without overwriting later sibling edits.
Tampered records, path escapes, ambiguous IDs, and summary collisions fail
closed. Edit/archive/restore mutations are serialized, remote mutation remains
denied, and restore cleanup failure is idempotent rather than a false loss.

The adjacent wiki undo path is not destructive to source memory: promotion
creates a derived wiki copy, and undo removes only that copy plus its derived
index/sidecar state. No other memory compaction or pruning path was found.

Exact focused proof after the correction: 4 files / 99 tests pass across pure
block mutation, filesystem archive/restore, renderer confirmation/recovery, and
remote bridge policy. TypeScript and `git diff --check` pass. Bounded lint has
zero errors; remaining warnings are pre-existing in large shared bridge/archive
files and are not introduced by this slice. This is retention hardening, not
M0A acceptance, release authorization, cohort authority, or evidence that all
other Wave 0 gates are complete.

```gate-result
{"gate":"retention-audit","status":"pass","verdict":"MEMORY_AND_WIKI_DESTRUCTIVE_PATHS_RECOVERY_SAFE_IN_BOUNDED_SCOPE","unresolved_critical":0,"unresolved_high":0,"scope":"Memory entry archive/restore, wiki promotion undo, and memory service compaction search","next_action":"continue the next highest-priority Wave 0 destructive-state and authority audit; keep release and cohort gates locked"}
```

## Cycle 11 — execution-authority, sandbox truth, and Cowork ownership reopening

Mike Caffrey's July 16 evidence packet and the next independent plan reviews
reopened the broader plan gate. The customer packet is source-correlated:

- the two displayed Desktop config paths should normally be the real macOS app
  config directory and its CLI-safe `~/.wayland-config` symlink, not two
  independent Desktop stores; the unresolved UX defect is canonical identity,
  active Core profile, and authority disclosure;
- Raw Engine Mode also drops Desktop MCP publication and the active Desktop Core
  profile override, not only model/skills, so it can worsen the reported
  connector/skill symptoms and cannot be offered as Browser recovery;
- deleting a conversation removes only its database record while generated
  `wcore-temp-*` workspaces remain unmanaged; this is a Desktop state-lifecycle
  gap, but it does **not** authorize deleting user files;
- updater pending-marker/quit safeguards are code-present, while Mike's failed
  relaunch remains unclosed until a signed candidate proves apply/relaunch and
  version advancement;
- Concierge diagnostic payloads are bounded, but the repeated troubleshooting
  journey has no proven context-budget/continuation contract.

The independent OpenAI-family audit returned ten HIGH/CRITICAL plan findings.
The Google-family review returned five HIGH findings, two overlapping with the
OpenAI review and three contested. Accepted findings and corrections:

| Finding                                                           | Correction                                                                                                                                                                                                   | State before rerun                |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| §14 contradicted schedule/prior implementation authority          | §14 is now explicit precedence; only enumerated non-promoting MCP-0/SBX-0 work may proceed while HIGHs remain                                                                                                | Corrected; rerun pending          |
| SBX-0 was not bounded like MCP-0                                  | Exact files/behaviors, copied-state/flag containment, and prohibited migration/profile/grant/promotion work are enumerated                                                                                   | Corrected; rerun pending          |
| Voice/Cockpit “non-interruption” could bypass M2/M5               | Pre-M2/M5 Voice/Cockpit is presentation-only prototype work; canonical lifecycle/approval/persistence remains locked                                                                                         | Corrected; rerun pending          |
| Cowork readiness had two owners                                   | Cycle 11 made M2 the sole schema authority but used the ambiguous chain `M2 schema → C0 conformance → C0 close → C1`; Cycle 16 supersedes it with `C0-A → M2 schema → C0-B entry → C1 → M8 final C0 closure` | Superseded by Cycle 16 correction |
| M2 could model connectors before M1M                              | Every MCP-capable M2 field/reducer now depends on the versioned M1M schema; otherwise MCP is absent/unsupported                                                                                              | Corrected; rerun pending          |
| MCP-0 “production behavior” implied eligibility                   | Renamed production-path implementation; copied state, non-promoting flag, no real credentials/artifact/cohort, and M0A/M1 enablement gate are explicit                                                       | Corrected; rerun pending          |
| Sandbox contingency looked like a policy bypass                   | Removed automatic routing; only explicit outside-Wayland user handoff is allowed, with no credentials/execution/inherited approval/success claim                                                             | Corrected; rerun pending          |
| Desktop could overclaim effective policy                          | Schema now separates requested ceiling, producer policy, enforcement class, and correlated effective receipt                                                                                                 | Corrected; rerun pending          |
| M8 omitted conditional connector/sandbox/Flux/Cowork dependencies | M1F/M1M/M1S/C0 are hard dependencies when their surfaces or claims are present; otherwise capability is absent from candidate/marketing                                                                      | Corrected; rerun pending          |
| Cowork local assertions could become false-green claims           | Status and all local/current-host evidence are `code-present/unverified for release` until immutable §9.3 receipts exist                                                                                     | Corrected; rerun pending          |

The three non-overlapping Google findings are rejected as contradictions, while
their underlying risk stays gated:

1. Mandatory OfficeCLI packaging is not a cross-platform claim: C0/M8 already
   fail closed on every unproven target and signed candidate. Capability-gating
   remains the contingency if the mandatory contract cannot pass; no platform
   is painted green.
2. Schema-53 rollback does not silently drop unmappable state: M0 already
   requires a versioned 53→52 transformer, per-object loss report,
   export/re-import of post-baseline work, and a hard stop if supportable
   transformation is infeasible.
3. J9 deterministic acceptance does not require live vendor credentials: the
   real process/IPC fixture is the mandatory gate and credentialed canaries are
   explicitly separate. This prevents availability of third-party accounts
   from weakening deterministic connector truth.

The managed-workspace response is deliberately fail-closed: referenced,
scheduled, artifact-bearing, modified, user-promoted, and unknown work is
preserved. Only provably empty abandoned shells become prune-eligible after a
visible retention window, dry run, recoverable quarantine, and receipt.

```gate-result
{"gate":"cross-audit","status":"pass","verdict":"NO_UNRESOLVED_HIGH_IN_CORRECTED_PLAN_AND_BOUNDED_SBX0_SCOPE","cycles":11,"unresolved_critical":0,"unresolved_high":0,"scope":"master execution authority, Cowork readiness ownership, sandbox/config truth, managed workspace retention, updater and support journey","next_action":"continue dependency-safe Wave 0 engineering; keep M0A acceptance, MCP-2, M2/C1+, release packaging, enrollment, and cohorts behind their named receipts"}
```

### Cycle 11 independent rerun evidence

| Reviewer                           | Result                           | Boundary                                                                                                                         |
| ---------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Google-family adversarial rerun    | `current_high=0`; `verdict PASS` | Corrected precedence, readiness ownership, M1M/M2 coupling, sandbox/config truth, workspace retention, support, and updater plan |
| OpenAI-family source-tracing rerun | `current_high=0`; `verdict PASS` | Corrected master/Cowork/Sandbox/MCP packet graph; explicitly found no gate path that requires weakening a dependency             |

Both reviewers explicitly limited their result to plan consistency. Neither
result is release, packaging, enrollment, live-vendor, or locked-packet proof.
The source-tracing rerun examined the apparent C0/M2/M8 relationship and found
no mandatory cycle under its interpretation: M2 may publish the sole readiness
schema without enabling MCP or Cowork; C0 then proves consumer conformance; M8
revalidates any included Cowork surface. Cycle 16 found that the written phrase
"C0 release closure before C1" could instead make C1 and M8 circular. The
current authority therefore supersedes this historical interpretation with
explicit C0-A/C0-B/M8 receipts. If a named dependency is absent, that capability
and its claims must be absent from the candidate.

## Cycle 13 — scheduled-task definition and skill recovery

The continuing destructive-path inventory found that schedule removal had only
partially satisfied the retention contract: completed run chats were retained,
but the authoritative schedule row was permanently deleted and its complete
per-job skill directory was recursively removed. Startup orphan cleanup used
the same destructive path. That contradicted the explicit requirement to keep
user schedules, instructions, reports, and files recoverable.

The working tree now treats removal as Archive. It publishes a source-confined,
hash-bound schedule record and byte-verifies the full skill tree before deleting
the live row. The original skill directory is moved into the archive instead of
erased. Archive failure or database failure leaves the live row intact and
restarts an enabled timer; unsuccessful archive attempts are retired from the
recovery list. Orphan cleanup uses the same boundary.

Automations now exposes Archived schedules and in-app Restore. Restore validates
record and skill hashes, refuses path/symlink/collision drift, recreates the
complete schedule and skill, and always returns the task paused. Failed database
insertion moves restored bytes back into the archive. Completed chats, reports,
workspaces, and provenance remain independent objects. Remote paired clients
cannot restore executable local schedule/skill state.

Exact focused proof: 6 files / 165 tests pass across archive filesystem,
scheduler compensation, IPC, renderer recovery, task-detail behavior, and
remote policy. TypeScript and `git diff --check` pass. Bounded lint reports zero
errors; remaining warnings are existing large-file findings plus intentional
serialized filesystem checks where ordering is part of the escape-prevention
and deterministic-hash contract. This is retention hardening, not M0A, release,
cohort, packaging, or producer acceptance.

```gate-result
{"gate":"retention-audit","status":"pass","verdict":"SCHEDULE_DEFINITION_SKILL_AND_RUN_OUTPUTS_RECOVERY_SAFE_IN_BOUNDED_SCOPE","unresolved_critical":0,"unresolved_high":0,"scope":"scheduled-task archive/restore, orphan cleanup, complete skill-tree retention, timer/database compensation, renderer recovery, and remote mutation policy","next_action":"continue the remaining process unlink/rm audit; keep release and cohort gates locked"}
```

## Cycle 14 — MCP connector definition recovery and publication truth

The continuing destructive-path inventory found that “Remove connector” could
permanently discard Wayland's only complete connector definition—including
command, arguments, environment/API keys, headers, transport, OAuth client
credentials, allowlists, and original JSON—after attempting to mutate several
external agent configurations. Multiple CLI adapters also converted real
removal failures into success, permitting the local definition to disappear
while stale external publication remained.

The working tree now treats connector removal as Archive. Before revocation it
publishes a private, atomic, SHA-256-bound recovery record under the canonical
Desktop config root. Adapter failure, concurrent edits, and config persistence
failure retain or restore the active definition and attempt compensating
publication. Corrupt records, identity collisions, path escapes, and child
symlinks fail closed. Restore preserves the complete definition but returns it
disabled and disconnected; recovered records are retired, not erased.

Electron IPC and authenticated hosted HTTP use the same serialized lifecycle
owner. Remote WebSocket mutation remains denied, HTTP mutations retain the
secure-config-write gate, and every browser response is a secret-free summary.
The Library exposes Archived connectors and no longer claims that removing a
connector deletes its sign-in. Claude, Gemini, Qwen, and CodeBuddy adapter
absence remains idempotent only when every relevant scope explicitly reports
not found; permission, parse, spawn, and write errors now remain failures.

Exact focused proof: 6 files / 119 tests pass across archive integrity,
compensation, concurrency, adapter truth, renderer recovery, bridge policy, and
hosted routes. The macOS CLI-safe top-level config symlink is accepted while
archive-child symlink redirection is refused. TypeScript, bounded new-surface
lint with zero warnings/errors, and `git diff --check` pass. This closes the
bounded destructive connector-definition gap; it does not prove active-session
ToolSearch, live revoke disappearance, vendor credentials, packaged six-target
MCP J9, MCP-2, M0A, release, or cohort authority.

```gate-result
{"gate":"retention-audit","status":"pass","verdict":"MCP_CONNECTOR_DEFINITION_ARCHIVE_AND_RESTORE_RECOVERY_SAFE_IN_BOUNDED_SCOPE","unresolved_critical":0,"unresolved_high":0,"scope":"complete connector definition archive/restore, adapter failure truth, compensation, Electron and hosted recovery UI, and remote mutation policy","next_action":"resume the remaining process unlink/rm audit and MCP active-session proof; keep MCP-2, release, packaging, and cohort gates locked"}
```

## Cycle 15 — Strike Mode implementation re-audit

The checkpoint was split into isolated Runtime Truth, Shell Resilience, and
Safety lanes with root-only integration. This changed the evidence boundary:
green focused tests are necessary, but no lane is accepted until an independent
review traces its claims through the real consumer, filesystem, hosted, and CI
paths.

The Runtime Truth lane is integrated at `b9f4e0baf828e735669beda811bd80a8c12df0ca`.
It requires publication plus a correlated, exact-session Core tool receipt and
binds conversation, generation, backend, server identity, transport, scope,
tool inventory, and a process-local HMAC definition digest. ACP/native probes
do not become Core registration evidence. This closes false active-session
promotion in the bounded implementation; it does not prove ToolSearch or live
Tavily, Firecrawl, n8n, or Beeper invocation and does not promote MCP-2.

The first Shell Resilience implementation was rejected with two HIGH findings:
it isolated only the Cockpit sider rather than independent composition roots,
and the native recovery suites were absent from required CI. The CI authority
gap is corrected at `34c6cb6d1e393267a6cda72318c97975e15942ba`:
`bun run test` now runs Vitest and deterministically enumerates every
`*.bun.test.ts` file, and required PR CI runs that native corpus. The follow-up
Shell correction was independently source-traced with zero remaining HIGH and
is integrated at `623dace07a40a67da6f0b20e40e75cf71d21d2e4`. Classic and
Cockpit are separate lazy composition roots; Classic never invokes the Cockpit
loader; Cockpit import, root, injected route, and injected state-init failures
recover through an independently loaded Classic root. Automatic fallback is
session-only and durable Classic selection is an explicit localized action.
Focused root proof passes 1 file / 7 tests, TypeScript, scoped lint with zero
warnings/errors, i18n structural validation, and diff validation. This proof is
limited to Cockpit-specific injected route failure and does not claim recovery
from every arbitrary shared canonical route crash or from simultaneous Classic
chunk failure.

The first Constitution history/restore implementation was rejected with five
HIGH findings despite 50 focused tests passing:

1. archive integrity did not authenticate the immutable target identity;
2. real bridge reads and predictable temporary writes could follow symlinks
   outside the Constitution root;
3. archive/read/publish/restore retained pathname check/use races under the
   stated same-user malicious-tool threat model;
4. external edits could be replaced without a stable snapshot/CAS and without
   first being archived; and
5. hosted metadata-only endpoints could leak archived prose through raw parse
   errors.

That commit remains outside the integration tree while a hostile-filesystem
correction and re-audit run. No Constitution recovery pass may be claimed from
its happy-path suite.

Follow-up `7f7a20849076413b3296dec13f5eea7d54fa6655` passed 57 focused
tests and independently closed metadata-only hosted error reflection, legacy
v1 restore, and static POSIX symlink containment. It is still rejected with
three residual HIGHs: the archive seal is an attacker-recomputable public hash,
parent/path swaps remain possible around pathname mutations, and a verified
recovery reservation is not held through commit so late archive or displaced
byte changes can be lost. The authenticated-seal successor is still under
construction and has no acceptance authority until these race windows and the
Windows/reparse boundary are independently proven.

The repository already documents that Node does not expose `openat()` and that
`O_NOFOLLOW` protects only the final component. Therefore another pre/post
`lstat` loop is not acceptable proof against the named same-user malicious
parent-swap threat. Acceptance requires directory-anchored mutation through a
platform-safe native primitive, or an explicit fail-closed quarantine of the
destructive operation on platforms where that primitive is unavailable. The
transaction must also retain an authenticated recovery reservation through the
commit and revalidate or preserve displaced bytes before any unlink. Honest
quarantine is preferable to claiming a race is closed when the runtime cannot
close it.

The first native-helper work-in-progress is not integration-eligible. Direct
source tracing found six boundary defects before commit: it synthesized an
unauthenticated version-2 archive incompatible with the HMAC-v3 archive store;
it implemented replace/delete but not anchored restore and archive retirement;
its crash journals were retained but had no reconciliation/resume path; file
opens did not yet prove regular-file and safe-link identity; its response
parser did not bind the receipt to the exact target, expectations, replacement,
archive, and key-envelope request; and its manifest/hash verification still
executed a pathname after verification, leaving the helper trust anchor open to
a verify/exec swap. These are implementation findings inside the existing five
Constitution HIGH categories, not six newly counted HIGHs. Acceptance requires
one coherent HMAC-v3 transaction protocol, anchored recovery and reconciliation,
strictly request-bound receipts, a defensible helper executable trust boundary,
and hostile proof for every supported platform. Windows remains honestly
fail-closed until HANDLE-relative reparse-safe behavior is independently proven.

Subsequent live attack of the uncommitted successor found additional ways a
superficially green helper could remain unsafe. Acceptance also requires: the
held executable identity to remain bound to the originally verified manifest
when both helper and manifest are replaced; write-ahead crash states and
fact-based reconciliation for every filesystem-effect/journal-append gap in
replace, delete, restore, archive publication, destination displacement, and
source retirement; rollback from a held trusted snapshot rather than a reopened
attacker-controlled recovery pathname; final inode and digest binding for a
retired source archive; and anchored, non-creating live Constitution,
specialist, and archive read/list operations. Mutation-only native coverage is
insufficient because pathname-based reads can still redirect the prompt through
an ancestor swap. Every crash checkpoint must prove crash -> reconcile -> next
transaction, and no plaintext journal claim may authorize bytes that are not
independently established by caller-bound artifact facts. These are sub-findings
within the existing five Constitution HIGH categories; they do not lower or
inflate the aggregate count before final integration re-audit.

This requirement is now split into two non-overlapping lanes. The archive lane
owns authenticated HMAC v3 records, legacy list-only behavior, recovery
reservation semantics, and an explicit no-fallback backend boundary. A new
standalone `wayland-constitution-fs` lane owns directory-handle-anchored native
transactions; it is independent of Wayland Core. POSIX support must use held
directory descriptors and no-replace mutation. Windows must either implement
HANDLE-relative reparse-safe operations with real junction tests or return a
stable unsafe-platform error. Packaging and signed multi-target proof remain
separate gates after source acceptance.

The sealed native source candidate
`6ddcdefa003e1b29fc15654dc477e42c510703df` is now independently strong only
inside that low-level boundary. Its ordered proof passes 39 native tests,
22 focused TypeScript tests, isolated TypeScript, strict Clippy, Rust format,
and diff validation after the helper has first been built. That proof directly
covers request-bound ordinary/restore/reconcile receipts, publication-loss
replay, partial receipt recovery, missing/corrupt committed receipts,
root/parent/leaf swaps, HMAC-v3 archive envelopes, and Darwin/Linux held-image
execution. It does not make the commit production- or CI-acceptable.

The attempted root integration `a2debfd66ed4385af0e9e9b258f153469e6f5e85`
was rejected by cold composition-root proof and reverted by
`12ea88caf3cd6e490a054060ea96b0f60966bfd8`. A focused real-helper test failed with `ENOENT` because it
hard-coded `native/constitution-fs/target/debug/wayland-constitution-fs` and
silently depended on a prior Cargo build. Full root TypeScript also failed at
the executor boundary because the declared `/dev/fd/3 | /proc/self/fd/3`
literal union excluded the real Darwin private snapshot pathname. The revert
returns the tracked tree exactly to
`3c1ebc9a643e8efdc205b909bfc0e14b05321f38`, the accepted bounded hosted tree;
the native source commit remains preserved only in its isolated lane.

Independent source tracing found a further restart-safety HIGH that the ordered
in-process suite did not close. Native pending inventory returns transaction
IDs, while reconciliation requires the original authenticated operation,
target, expected, replacement, archive, restore, and recovery facts. Those
facts exist only in caller memory and cannot be reconstructed after a process
restart. Production acceptance therefore requires authenticated pending-detail
retrieval (or an equivalently authenticated intent authority), hostile/tamper
tests, and crash -> process restart -> exact reconcile -> next transaction
proof. An ID-only pending list cannot authorize guessed reconciliation facts.

The production boundary also remains absent: there is no non-test embedded
helper authority, one lifetime-owned Constitution filesystem service,
persistent journal/archive key owner and loss/rotation/migration policy,
bridge/Web/composePrompt cutover, retirement of the disconnected unauthenticated
v1 archive store, exact target helper staging, post-pack binary replay,
signing/notarization order proof, supported-host CI, or functional Windows
adapter. Windows may remain explicitly fail-closed, but packaging and product
copy must not claim native parity there. Required integration order is:
cold-root type/build correction; restart-safe pending protocol; service/key
ownership; consumer cutover and legacy retirement; target-exact
build/sign/package verification; CI matrices; then full packaged journeys and
independent re-audit.

The next read-only hosted-journey audit found three additional HIGH gaps in the
pre-existing Constitution editor:

1. hosted canonical autosave cannot satisfy the server's destructive step-up
   contract and therefore always fails authorization;
2. hosted specialist list/read are absent and create/edit/delete neither carry
   valid authority nor hydrate existing data; and
3. the client collapses every hosted read failure to an empty editable
   document. The automatic reset reaction has since been removed, but a later
   unlock plus autosave can still overwrite an unreadable existing file.

The required order is fail-closed read-versus-absence truth, a scoped and
expiring Constitution edit authorization, canonical autosave, specialist
list/read/hydration plus create/edit, separate delete/restore authority, and
real guard/CSRF journey proof. Commit
`61d79d22c538998e0a76371eea343df93f781df3` closes the scoped edit-grant and
serialized/durable autosave portion as a bounded independently zero-HIGH
candidate without weakening `requireDestructive`. The other two hosted HIGH
categories remain open: all hosted reads still need truthful present/absent/
error states through the anchored non-creating backend, and hosted specialist
inventory/read/hydration still needs a coherent HTTP journey. Delete and
archive restore must continue to reject continuous edit authority.

That renderer status is now superseded by exact clean candidate
`de9f3c9adb4203654667c4feea7f8d44a7d7668e`. The intermediate
`09148604c0f652c2a51c101bb808f19460f65d1a` candidate was rejected for silent
conflict adoption, specialist delete/autosave races, and treating a committed
reset as uncommitted after refresh failure. `d1374911ddcf8d31fe8b59b759dcd80293af0702`
closed those findings but was rejected for missing synchronous delete
ownership and truthy mutation/grant success parsing. `de9f3c9a` adds the
synchronous target/editor/autosave lock and exact `success === true`
discriminants. It passes 48 focused tests, the full renderer suite at 2,114
passed / 2 skipped across 282 files, TypeScript, lint with zero errors, diff
validation, clean-tree proof, and independent review with zero intrinsic
HIGH/BLOCKER.

The bounded pre-v2 renderer behavior candidate does not promote durable v2,
aggregate hosted, or Wave 0 acceptance. It must still satisfy the v2
single-shot lifecycle and be composed with the native production service and
proven through the actual authenticated route -> HTTP client -> reducer path.
Non-creating startup/read behavior, request replay after response loss, exact
native/IPC/HTTP envelopes, helper staging and packaged-byte authority, archive
restore, and the aggregate package/journey re-audit remain mandatory. Root
therefore stays at `12ea88caf3cd6e490a054060ea96b0f60966bfd8` until the isolated
production branch is clean, fully proved, and independently zero-HIGH.

The isolated production composition is now sealed and clean at
`991c502e74506ec3702f92e429a8b31b655412ba`. Candidate-worktree proof passes
154/154 combined integration/authority tests, 39/39 native filesystem tests,
strict Clippy, Rust formatting, full TypeScript, 47/47 package tests, and diff
validation. Its exact staged/codesigned Darwin ARM64 helper digest is
`sha256:141e9ec8e2163a31d4be124dcaa0dbb4cffddf7295b8bd6fd17d9ecc4559bd17`.
Registered Express routes consumed by the actual renderer fetch client prove
response-loss replay-first behavior for main write, reset, specialist write,
and delete. The first independent pass rejects `991c502e7` for integration:
the real `ConstitutionFsService` replays an already-present main/reset write by
recomputing its fingerprint with a synthetic absent revision, so the same
request ID and payload conflicts with its own committed operation. The mocked
route-client service hid the defect. Root remains sealed; acceptance now
requires real-service present-update/reset response-loss replay, changed-fact
rejection, the full proof rerun, and a fresh exact-commit adversarial verdict.
The same pass finds a second HIGH: Windows packaging intentionally emits
`supported:false` with no helper, but `initBridge.ts` constructs the production
service at module load and propagates `CONSTITUTION_FS_UNSAFE_PLATFORM`, which
appears to prevent main-process boot instead of exposing an unavailable
Constitution capability. A corrected candidate must prove Windows-authority
startup remains usable, Constitution reads/mutations fail honestly, ordinary
startup/chat do not crash, and no direct-filesystem fallback is introduced.

The final immutable-commit verdict for `991c502e7` is **NO-GO**. The helper's
authenticated transaction machinery, held native paths, target-exact staging,
and post-pack verification pass, but the Desktop layer above it has seven
release-significant gaps:

1. original request facts and committed results do not survive service restart,
   so native authenticated replay is unreachable after reboot;
2. request IDs remain optional at HTTP, IPC/preload, and service producer
   boundaries, permitting unreplayable commits;
3. renderer uncertainty is not persisted before dispatch and single-shot
   reset/delete/create/overwrite retries mint new IDs;
4. legacy migration binds canonical absence but not the concurrently mutable
   `SOUL.md` source in the same native transaction;
5. authenticated pending reconciliation runs after live read/CAS exposure
   rather than before authoritative truth is returned;
6. route-client replay tests substitute a mocked persistence service instead
   of the real service and native helper; and
7. unsupported Windows authority aborts main-process initialization instead of
   degrading only the Constitution capability.

Revisions also use a process-random HMAC key and therefore drift for identical
state after reboot. Exact Electron read/list validation, hosted failure-envelope
validation, crash/remount tombstones, and clean-source package authority remain
partial. All named gaps must be corrected or explicitly fail-closed under the
accepted product contract, rerun through real composition proof, and receive a
fresh immutable zero-HIGH audit before root integration.

The current exact root after the rejected native integration and explicit
revert is `12ea88caf3cd6e490a054060ea96b0f60966bfd8` (tree
`3c1ebc9a643e8efdc205b909bfc0e14b05321f38`), which is byte-for-byte the
tracked source tree accepted for bounded hosted grant/autosave at
`61d79d22c538998e0a76371eea343df93f781df3`. That tree passes TypeScript,
1,330 Vitest files / 13,734 tests with 139 skipped, all 26 Bun-native files /
191 tests, 21-file hosted scoped lint with zero warnings/errors, canonical
formatting and diff validation, the production Web renderer build, and the
server bundle build. This is proof for the bounded integrated source only; it
does not accept the native filesystem worktree, full hosted journey, package
matrix, M1, or release.

The earlier pre-`791fccb34` baseline's dual-architecture macOS production build
was not green.
ARM64 and x64 both built and signed, but independent source tracing confirmed
four additional HIGH packaging defects:

1. the final x64 verifier scans both app outputs and reapplies x64
   Core/OfficeCLI expectations to the valid ARM64 app;
2. Signal extraction debris without `bin/signal-cli` is packaged and the
   generic non-empty-directory check falsely reports it as `OK`;
3. Signal preparation selects the build host architecture instead of the
   requested package architecture and may fall back to an unrelated release
   archive; and
4. DMG retry resolves the first `mac*` app rather than the exact current target,
   so a stale or wrong-architecture app can substitute for the requested
   artifact.

Generic presence-only checks also leave a MEDIUM-to-HIGH stale-resource design
gap for Bun, voice/model data, indexes, Hub, WhatsApp, and Signal. Hub
`dist-latest` returned 404 and remains an explicitly optional omission, but a
skip before cleanup can preserve stale Hub bytes. The package lane must bind
verification and DMG retry to one exact platform/architecture output, make
optional Signal preparation atomic and target-aware, and replace generic
presence with expected entrypoints or authenticated manifests. None of these
observations may be converted into M1 packaging or capability proof until the
correction, hostile tests, independent re-audit, and fresh aggregate build pass.

Later source tracing sharpens that gate. Optional means an honestly absent
feature may degrade with a warning; it does not mean a present-but-invalid Hub,
WhatsApp, or Signal payload may ship. Any present optional bundle must pass its
authority and exact-content contract or fail packaging, and any Hub directory
must fail while no immutable Hub authority exists. Bun selection must use the
requested package platform as well as architecture rather than the build host.
The committed models.dev floor and voice/Bun executables require exact byte
pins. The WhatsApp bridge must preserve the exact authoritative source and its
lockfile-bound dependency payload: release packaging must perform a clean frozen
`bun.lock` install, reject mutable installer fallback as release evidence, and
verify the packaged recursive tree including safe in-tree link identity. A
comparison against an arbitrary dirty `node_modules` tree is not dependency
authority. These are refinements of the existing packaging freshness/target
HIGHs. Commit `791fccb3466209ec4b9bd8140194c22716a8f7c7` now carries the
target/resource source corrections in the root history, but packaging remains
HOLD until the native helper is integrated into the same package authority and
fresh six-target outputs, the post-pack verifier, signed/notarized execution,
and independent aggregate review all pass. The former twelve-HIGH counter is a
historical pre-correction snapshot and must not be reused as a current exact
count; final recount waits for native and packaging re-audit.

Live upstream inspection further constrains the honest Signal capability. The
current `AsamK/signal-cli` v0.14.6 release publishes no macOS or Windows native
asset. Its only native artifact is Linux x64: archive SHA-256
`c78639c2d3c14cd004872a99ecf129bd7d7c26ee7d9844d50c2b0afdafefea68`,
containing one root `signal-cli` ELF x86-64 executable with SHA-256
`0f9850154f51a0ef0ffcb7a52a38c8aa794ec92a4ab6f76210e726c544c01798`.
The package lane may support only that pinned target unless a separately
verified runtime is added; all other targets must degrade as unavailable. The
configured `FerroxLabs/waylandHub` repository currently returns 404 and no
accessible FerroxLabs Hub repository exists, so Hub also remains an honest
optional omission rather than a substituted or stale bundle.

```gate-result
{"gate":"strike-implementation-reaudit","status":"hold","verdict":"BOUNDED_HOSTED_SLICE_ACCEPTED_FULL_WAVE_LOCKED","unresolved_critical":0,"unresolved_high":null,"unresolved_high_status":"recount-required-after-native-and-packaging-reaudit","current_root":"12ea88caf3cd6e490a054060ea96b0f60966bfd8","accepted_bounded_commit":"61d79d22c538998e0a76371eea343df93f781df3","rejected_native_integration":"a2debfd66ed4385af0e9e9b258f153469e6f5e85","preserved_native_source":"6ddcdefa003e1b29fc15654dc477e42c510703df","scope":"hosted scoped grant and serialized durable autosave independently pass with zero HIGH; hosted read truth and specialist inventory remain open; native restart reconciliation, production authority, lifecycle ownership, packaging and CI remain unaccepted","next_action":"close cold-root helper/type proof, authenticated reboot reconciliation facts, native production authority, Windows truth, key lifecycle, service/bridge cutover, CI, signing and package proof; then integrate anchored read/list/CAS/archive and complete hosted journeys; rerun aggregate adversarial review before unlocking M0A/M0B, MCP-2, M2/C1+, release, enrollment, or cohorts"}
```

## Cycle 16 — Native production v2 authority gate

The exact bounded pre-v2 hosted renderer behavior candidate
`de9f3c9adb4203654667c4feea7f8d44a7d7668e` remains independently accepted
inside its historical bounded renderer scope. It does not satisfy the later v2
durable single-shot lifecycle. The immutable audit of production
composition commit `991c502e74506ec3702f92e429a8b31b655412ba`
returned NO-GO despite its green local suites. Root therefore remains at
`12ea88caf3cd6e490a054060ea96b0f60966bfd8`.

The rejected candidate proved the low-level anchored helper, but not a durable
Desktop authority. Its release-significant gaps are process-random revision
keys, memory-only committed-request replay, optional producer request IDs,
post-dispatch uncertainty persistence, split legacy migration,
reconciliation-after-truth, mocked persistence in the route-client journey,
and Windows startup failure when the helper is intentionally absent. These are
one coherent protocol/lifecycle defect and may not be closed as unrelated
patches that retain the v1 end state.

`wave-0/NATIVE-CONSTITUTION-V2-ACCEPTANCE.md` now requires a paired versioned v2
helper/consumer contract: durable external revision authority, authenticated
lookup before read/CAS, deterministic reconciliation IDs, guarded reads,
atomic legacy migration, mandatory IDs, persisted single-shot retries, honest
unsupported-platform capability, a real helper/service/Express/fetch restart
journey, package proof, and a fresh immutable zero-HIGH audit. The current
remediation is unsealed. Focused boundary tests are evidence for their bounded
behaviors only and cannot satisfy this aggregate gate.

```gate-result
{"gate":"native-constitution-v2","status":"hold","verdict":"REJECTED_PREDECESSOR_REMEDIATION_ONLY","unresolved_critical":0,"unresolved_high":"recount-required-after-sealed-v2-candidate","current_root":"12ea88caf3cd6e490a054060ea96b0f60966bfd8","accepted_renderer":"de9f3c9adb4203654667c4feea7f8d44a7d7668e","rejected_production_candidate":"991c502e74506ec3702f92e429a8b31b655412ba","authority":"wave-0/NATIVE-CONSTITUTION-V2-ACCEPTANCE.md","next_action":"finish the paired v2 implementation and exact proof, seal one immutable commit, rerun source-tracing audit, and integrate only after zero unresolved HIGH/BLOCKER"}
```

### Cycle 16 current-byte plan findings and corrections

| Severity | Finding                                                                                                                                                                | Source-of-truth correction                                                                                                                                                   | Current gate                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| BLOCKER  | Recovery UI and native v2 authority depended on one another, leaving no valid first merge                                                                              | Recovery is split into Stage A native primitive, Stage B DTO/routes/UI, and Stage C aggregate recovery proof                                                                 | Corrected; independent rerun pending |
| BLOCKER  | M5V included packaged V4 acceptance while M8 also depended on M5V, creating a hidden circular release gate                                                             | One M5V packet now emits M5V-A functional proof in Wave 3 and M5V-B packaged proof inside M8; M9 requires M5V-B                                                              | Corrected; independent rerun pending |
| BLOCKER  | C1 required final C0 release closure, while C0 closure required signed cross-target app proof in M8 and M8 required C1                                                 | C0-A now owns Wave 0 producer truth, C0-B owns post-M2 conformance and C1 entry, and M8 emits final C0 release closure after replaying C0-B plus C1                          | Corrected; independent rerun pending |
| HIGH     | Revision authority omitted key loss, rotation, migration, recovery, and downgrade/re-upgrade continuity                                                                | v2 acceptance and M0 bundle requirements now define active/retired key IDs, same-device and portable envelopes, rotation receipts, quarantine on loss, and v0.11.8 isolation | Corrected; independent rerun pending |
| HIGH     | Mandatory first Cowork vertical C1 was absent from wave ownership and aggregate receipts                                                                               | C1 now has packet ownership, Wave 3 placement, immutable receipt, packaged J17/J23 replay, and M8/M9 dependencies                                                            | Corrected; independent rerun pending |
| HIGH     | Hosted renderer evidence was described as an accepted journey after the v2 lifecycle superseded it                                                                     | Hosted evidence is now a bounded pre-v2 behavior prerequisite only; the durable v2 renderer journey remains open                                                             | Corrected; independent rerun pending |
| MEDIUM   | Core types could become an independently maintained Desktop wire authority                                                                                             | Producer manifest/schema/generator/fixtures remain normative; Desktop must use generated types or an exact validator plus exhaustive schema coverage map                     | Corrected; independent rerun pending |
| MEDIUM   | Packet/invariant/criterion/journey counts and the top verdict were stale                                                                                               | Current accounting is 16 / 21 / 31 / 25 and the verdict is reopened                                                                                                          | Corrected; independent rerun pending |
| MEDIUM   | v2 and recovery work lacked explicit ownership and receipt handoff                                                                                                     | Both acceptance documents now name owners, issues, staged receipts, and merge order                                                                                          | Corrected; independent rerun pending |
| MEDIUM   | The historical roadmap still instructed Phase 1/3 to create and carry a shared Task/Workspace model after the approved mental model removed that persistence authority | Roadmap now names Project context, optional Execution Scope, derived execution semantics, and explicitly denies a durable cross-host Task identity                           | Corrected; independent rerun pending |

M5V is explicitly a first-preview packet because the master program includes
Voice Conversation Mode. It is now owned in the packet matrix, scheduled in
Wave 3 after M0A/M2/M5/M6 authority inputs, and required whenever a Voice
surface is present. M5V-A is the functional Wave 3 receipt and M8 entry gate;
M8 produces M5V-B as the packaged receipt; M9 and Voice release/parity claims
require M5V-B. This removes the former M5V↔M8 circularity without adding a new
packet or weakening package proof. Voice may be omitted from a candidate, but
it may not be present or marketed without the receipt appropriate to that gate.

```gate-result
{"gate":"cycle-16-plan-current-byte","status":"hold","verdict":"REMEDIATION_APPLIED_INDEPENDENT_REAUDIT_PENDING","unresolved_blocker":"recount-required","unresolved_high":"recount-required","packets":16,"invariants":21,"success_criteria":31,"journeys":25,"scope":"Adaptive Cockpit, Cowork, Voice, Constitution v2 and recovery source-of-truth","next_action":"run a fresh independent current-byte source-tracing audit; retain program/release hold until zero unresolved HIGH/BLOCKER"}
```

## Cycle 17 — Current-byte convergence corrections

The fresh Cycle 16 independent source-tracing audit returned three BLOCKER,
one HIGH, and three MEDIUM findings. The source-of-truth documents now contain
the following corrections. None is accepted merely because the prose changed;
an independent current-byte rerun must verify the complete graph.

| Severity | Finding                                                                                                  | Source-of-truth correction                                                                                                                                                                                                                                                                       | Current gate                         |
| -------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| BLOCKER  | §14 permitted only MCP-0/SBX-0 while the audit required Constitution v2/recovery and C0-A remediation    | §14 now explicitly permits plan corrections, read-only audits, and isolated non-promoting MCP-0, SBX-0, C0-A, and Constitution v2/recovery remediation, while retaining the bans on acceptance, production state, credentials, packaging, release, enrollment, promotion, and M2/M5/M7 expansion | Corrected; independent rerun pending |
| BLOCKER  | Virgin-absent Constitution state had no stable revision because reads could not initialize key authority | A cold read may initialize only the external revision HMAC authority at the explicit `app.getPath('userData')` path; it may not create `~/.wayland`, Constitution state, archives, journals, defaults, or history, and no process fallback exists                                                | Corrected; independent rerun pending |
| BLOCKER  | M0A required aggregate SC-20 before M3 could implement its shell-switch step                             | SC-20 is staged: M0A owns target-exact install/backup/restore/signed rollback/re-upgrade engineering via the external harness, M3 owns Cockpit-to-Classic switching, and M8 composes and closes the aggregate signed-candidate journey                                                           | Corrected; independent rerun pending |
| HIGH     | M8 owned every invariant and criterion but its acceptance text required only SC-15–21                    | M8 now explicitly requires all 21 invariants and all 31 distinct success criteria with immutable upstream citations and exact-candidate replay; conditional criteria may be N/A only when the capability and its claims are absent                                                               | Corrected; independent rerun pending |
| MEDIUM   | C1's use of “packaged” blurred its pre-M8 component receipt with the signed release package              | C1 is now a target/architecture-declared component/integration vertical using the native executable and artifact stack; it is not a signed/notarized application and M8 must replay it through the exact signed candidate                                                                        | Corrected; independent rerun pending |
| MEDIUM   | Phase 4 retained a competing Task/Workspace continuity promise                                           | Phase 4 now uses Project identity plus optional Execution Scope, conversation, artifact, and receipt continuity and explicitly denies a durable cross-host Task identity or competing Workspace store                                                                                            | Corrected; independent rerun pending |
| MEDIUM   | README required complete Stage C acceptance before the audit that itself closes Stage C                  | README now orders implementation/proof excluding final audit, immutable seal, exact-HEAD independent audit, then Stage C/root integration only on zero HIGH/BLOCKER                                                                                                                              | Corrected; independent rerun pending |

Accounting remains 16 first-preview packets, 21 invariants, 31 distinct success
criteria, and 25 numbered journeys. The later encrypted instance-migration
program is explicitly outside those first-preview counts and cannot weaken any
current gate.

```gate-result
{"gate":"cycle-17-plan-current-byte","status":"hold","verdict":"SEVEN_FINDINGS_CORRECTED_INDEPENDENT_REAUDIT_PENDING","unresolved_blocker":"recount-required","unresolved_high":"recount-required","packets":16,"invariants":21,"success_criteria":31,"journeys":25,"scope":"Adaptive Cockpit, Cowork, Voice, Constitution v2 and recovery source-of-truth","next_action":"run a fresh independent current-byte source-tracing audit; retain program/release hold until zero unresolved HIGH/BLOCKER"}
```

## Cycle 18 — Current-byte convergence pass and P1 follow-on audit

The independent Cycle 18 source-tracing audit recomputed the complete effective
plan rather than treating historical HOLD receipts as current authority. It
returned zero unresolved BLOCKER and zero unresolved HIGH findings for M0–M9
and for the explicitly follow-on P1 transfer contract. The accounting remains
16 first-preview packets, 21 invariants, 31 distinct success criteria, and 25
numbered journeys; J22 remains an explicitly follow-on Cloud/hosted journey.

P1's five adversarial findings are closed in normative and downstream text:

- destination import requires principal/tenant/scope-bound authorization and a
  fresh content-addressed dry-run approval rather than treating key possession
  as mutation authority;
- a bounded pre-decryption archive digest and destination replay tombstone make
  an exact retry idempotent after the one-use private key is destroyed, while
  conflicting bytes, scope, or bindings fail closed;
- format v1 fixes Argon2id version, memory, time, parallelism, key length, and
  salt bounds and rejects lower, higher, duplicate, overflowing, or unsupported
  header values before resource allocation;
- unverified executable-capable skills, assistants, connectors, scripts, and
  workflow nodes remain non-executable and absent from prompt composition,
  discovery, indexing, ToolSearch, sessions, schedules, and extensions until a
  destination activation receipt exists; and
- the saved destination bundle is visibly labelled as 15-minute and single-use,
  with countdown, fingerprint, scope, consumed state, expiry warning, and an
  explicit statement that it is not an offline backup.

The audit found two non-gating MEDIUM editorial contradictions. This Cycle 18
receipt replaces the stale active Cycle 16 banner, and the Wave 3 result now
describes C1 as a target-declared component/integration vertical rather than a
signed packaged application. Historical HOLD gate blocks remain unchanged as
evidence of what prior bytes required; they are not the current verdict.

```gate-result
{"gate":"cycle-18-plan-current-byte","status":"pass","verdict":"ZERO_UNRESOLVED_BLOCKER_OR_HIGH","unresolved_blocker":0,"unresolved_high":0,"packets":16,"invariants":21,"success_criteria":31,"journeys":25,"scope":"Adaptive Cockpit, Cowork, Voice, Constitution v2/recovery, and follow-on P1 transfer source-of-truth","authority":"dependency-eligible implementation only; all packet acceptance, production state, cohort, packaging, release, and portability implementation remain behind their named receipts"}
```

## Cycle 19 — Classic-session re-upgrade promotion correction

The Constitution implementation audit found that “restore the exact preserved
v2 envelope” proved no-change continuity but did not define how supported work
created while signed v0.11.8 runs against the isolated projection returns on
re-upgrade. Receipt prose without a promotion implementation would strand that
work, contradicting SC-09, SC-20, J12, and M0's lossless rollback promise.

The normative plan and Constitution v2 acceptance contract now require:

- a projection receipt binding the immutable source snapshot, exact preserved
  v2 authority-envelope digest, projected Classic baseline, and supported
  object inventory;
- a delta/tombstone manifest for Classic-session work;
- re-acquisition of current profile/quiescence authority and verification of
  destination expected revisions before mutation;
- promotion only through current-version CAS/migration APIs with request IDs
  persisted once during preparation and receipts bound to source, delta,
  expected revision, and result;
- idempotent exact replay and fail-closed changed-fact conflicts; and
- preservation of both copies in a sealed rescue bundle when current v2 state
  changed, Classic state is unsupported, or promotion is interrupted.

No Classic process receives v2 key material, and no recovery path may overwrite
current v2 state or silently discard Classic work. Independent current-byte
re-audit is required before the Cycle 19 hold can clear.

```gate-result
{"gate":"cycle-19-plan-current-byte","status":"hold","verdict":"REUPGRADE_PROMOTION_CORRECTED_INDEPENDENT_REAUDIT_PENDING","unresolved_blocker":"recount-required","unresolved_high":"recount-required","packets":16,"invariants":21,"success_criteria":31,"journeys":25,"scope":"M0 rollback/re-upgrade and Constitution v2 Classic-session promotion","next_action":"independently source-trace the corrected plan and retain all acceptance/release/cohort holds until zero unresolved HIGH/BLOCKER"}
```

## Cycle 20 — Promotion authority and mandatory proof correction

The independent Cycle 19 source trace found one BLOCKER and five HIGH gaps.
Promotion existed in descriptive prose but was absent from the Stage A/B/C
merge gates, so root integration could still pass without preserving Classic
work. Replay identity, multi-object partial progress, canonical delta semantics,
authenticated rescue, exact historical fixtures, and user disposition were not
normative enough to implement or test without inventing authority.

| Severity | Finding                                                                               | Source-of-truth correction                                                                                                                                                                                                                                          | Current gate                         |
| -------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| BLOCKER  | Stage C/root integration did not require Classic promotion implementation or proof    | Stage A now owns projection verification, canonical delta, durable journal, per-item replay and rescue primitives; Stage B owns explicit user decisions and recovery UI; Stage C and M0A require the signed Classic promotion receipt                               | Corrected; independent rerun pending |
| HIGH     | Historical compatibility could pass on fixtures synthesized by current code           | Exact `991c502e...` transaction implementation now emits a digest/provenance-bound corpus with real crash points; any additive hook-wiring patch is stored, separately digested, and proved transaction-neutral; candidate reconciliation before truth is mandatory | Corrected; independent rerun pending |
| HIGH     | “Fresh IDs” contradicted idempotent exact replay                                      | One persisted promotion ID and per-item UUID/fingerprint are published before dispatch and reused for committed lookup and replay                                                                                                                                   | Corrected; independent rerun pending |
| HIGH     | Partial multi-object promotion had no durable state machine                           | A no-clobber journal records ordered objects, expected revisions, item terminal states and receipts; restart performs lookup before reads and never hides earlier commits                                                                                           | Corrected; independent rerun pending |
| HIGH     | Delta/tombstone identity, path and digest rules were undefined                        | The acceptance contract fixes supported object identities, NFC/case rules, derived paths, canonical JSON/base64/digests, explicit create/replace/delete, rename semantics, and traversal/collision rejection                                                        | Corrected; independent rerun pending |
| HIGH     | Projection/rescue could be modified by the Classic user and had no recovery lifecycle | Projection records and rescue are authenticated, content-addressed, no-clobber and external to the Classic root; rescue is encrypted, authority-bound, retained while unresolved, and has authenticated resume/export/delete semantics                              | Corrected; independent rerun pending |
| MEDIUM   | The user could not explicitly choose promotion, rescue-only, or discard               | Stage B presents the three outcomes; discard requires object-specific confirmation and retained authenticated rescue                                                                                                                                                | Corrected; independent rerun pending |

The correction does not accept any implementation. It names the evidence the
current Constitution worktree must produce, and retains the production,
packaging, cohort, and downstream packet holds.

```gate-result
{"gate":"cycle-20-plan-current-byte","status":"hold","verdict":"PROMOTION_AUTHORITY_CORRECTED_INDEPENDENT_REAUDIT_PENDING","unresolved_blocker":"recount-required","unresolved_high":"recount-required","packets":16,"invariants":21,"success_criteria":31,"journeys":25,"scope":"M0 rollback/re-upgrade and Constitution v2 Classic-session promotion, historical replay, and rescue authority","next_action":"independently source-trace Cycle 20 and retain every acceptance/release/cohort hold until zero unresolved HIGH/BLOCKER"}
```

## Cycle 21 — Recovery lifecycle, immutable payload and journal correction

The fresh Cycle 20 current-byte source trace confirmed that all prior one
BLOCKER, five HIGH, and one MEDIUM findings were materially closed, then found
four new HIGH findings and one MEDIUM documentation gap. No BLOCKER remained.

| Severity | Finding                                                                                                           | Source-of-truth correction                                                                                                                                                                                                                       | Current gate                         |
| -------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| HIGH     | External recovery records could be stranded by signing/sealing-key loss or rotation                               | The recovery authority now fixes MAC/cipher/envelope schemas, active and required-retired keys, same-device and portable recovery, authenticated rotation, retention, quarantine, and the ban on minting a replacement key over existing records | Corrected; independent rerun pending |
| HIGH     | A digest-bound final payload could be reread from mutable Classic state after preparation                         | Create/replace deltas now embed exact bounded canonical-base64 final bytes; the complete delta and rescue are sealed before the first CAS and every later Classic-root/external-payload reread is forbidden                                      | Corrected; independent rerun pending |
| HIGH     | Append-only journal plus CAS head did not define orphan, torn-head, stale-writer, or competing-successor recovery | Event-before-head durability, one contiguous authenticated authoritative chain, exact response-loss replay, orphan quarantine, concurrent-writer failure, and hostile crash injections are now mandatory                                         | Corrected; independent rerun pending |
| HIGH     | Execution control said Stage B was locked behind the Stage C acceptance that requires Stage B                     | Execution now permits Stage B only after locally sealed Stage A inside isolated non-promoting state; neither stage may enter root or be accepted until Stage C composes and audits them                                                          | Corrected; independent rerun pending |
| MEDIUM   | README named only the native acceptance file as Constitution authority                                            | README now names both paired Stage A and Stage B/Stage C acceptance documents and their integration boundary                                                                                                                                     | Corrected; independent rerun pending |

The discard contract is also made phase-correct: three-way disposition exists
before the first destination CAS; after any partial commit, prior receipts stay
authoritative and the only promotion choices are resume-pending or preserve
current v2 plus rescue/export. A later restoration is a separate destructive
CAS workflow and cannot masquerade as discard.

```gate-result
{"gate":"cycle-21-plan-current-byte","status":"hold","verdict":"FOUR_HIGH_AND_ONE_MEDIUM_CORRECTED_INDEPENDENT_REAUDIT_PENDING","unresolved_blocker":"recount-required","unresolved_high":"recount-required","packets":16,"invariants":21,"success_criteria":31,"journeys":25,"scope":"Constitution external recovery lifecycle, immutable Classic delta authority, promotion journal crash/concurrency recovery, and Stage A/B/C sequencing","next_action":"independently source-trace Cycle 21 current bytes and retain every acceptance/release/cohort hold until zero unresolved HIGH/BLOCKER"}
```

## Cycle 22 — Exact recovery cryptography and Stage B operation contract

The Cycle 21 current-byte trace closed all four prior HIGH findings and the
documentation MEDIUM, then returned two new HIGH findings: cryptographic
algorithms were named without an implementable versioned envelope/key schema,
and Stage B Classic operations were required through real DTOs without those
DTOs or authority/error/receipt semantics being defined.

| Severity | Finding                                                                                                                               | Source-of-truth correction                                                                                                                                                                                                                    | Current gate |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| HIGH     | Recovery key/envelope implementations could invent incompatible fields, derivation, nonce, AAD, wrapper and KDF rules                 | Native acceptance now fixes the key-state and sealed-record exact keys, canonical encoding, HKDF role separation, AES-GCM/HMAC coverage, nonce uniqueness, verification order, portable scrypt wrapper, rotation and quarantine semantics     | Closed       |
| HIGH     | Destructive Classic Stage B actions had no normative DTO, endpoint/channel, caller authority, idempotency, error, or receipt contract | Recovery acceptance now fixes metadata, decision, resume, export and deletion DTOs; HTTP and IPC surfaces; fresh destructive authentication; revision/head CAS; replay; transport-specific encrypted export; stable envelopes and error codes | Closed       |

These corrections specify implementation and proof; they do not accept the
current Constitution worktree or relax the signed Classic Stage C journey.

```gate-result
{"gate":"cycle-22-plan-current-byte","status":"pass","verdict":"ZERO_UNRESOLVED_BLOCKER_HIGH_OR_MEDIUM","unresolved_blocker":0,"unresolved_high":0,"unresolved_medium":0,"packets":16,"invariants":21,"success_criteria":31,"journeys":25,"audited_hashes":{"MASTER-BUILD-PLAN.md":"5f6756f7d1635a702e50a90c00e24baf9b6aa007503d6c5217b862397292af06","MASTER-PLAN-AUDIT.md-pre-result":"64c0e7c6c12bc972f02686f8be9546a892cbd5201c44279e1a26ce98154793bd","README.md":"b7fdd137f8ec0e99a08aeebacd51ee59ce197e500ef6b202304b5c2c96c78cb1","NATIVE-CONSTITUTION-V2-ACCEPTANCE.md":"635b6ab051722041cfb86169d28b116286cdbb967eef9b56755b649e709ebea2","CONSTITUTION-RECOVERY-ACCEPTANCE.md":"0f601d3366faf704f4ed795bf225f7ece443d150e67e393d094866ea74abc1d6","M0A-SPEC.md":"28afe9b1c2f56bce079a4b98d5345515dd57a5e8961e8f052e26f56dc1345647","EXECUTION.md":"8986bce7e793248a6c13b9aba4fbad1e96a83ed019f5db98d22c2eb80a91d54a"},"scope":"Adaptive Cockpit, Cowork, Constitution v2/recovery source of truth including external recovery crypto, immutable Classic payload, journal recovery, staged integration and Stage B operation contracts","authority":"plan pass only; implementation, receipts, Stage C, M0A, production state, packaging, release and cohorts remain gated","next_action":"finish the exact Constitution Stage A/B implementation and proof, seal one immutable candidate, and run the independent exact-HEAD implementation audit before root integration"}
```

## Cycle 27 — Archive restore identity, principal and replay convergence

Fresh current-byte audits after Cycle 22 found that archive restore still left
implementers room to disagree about inventory envelopes, rotation between GET
and POST, replay after source retirement, principal ownership, native versus
process fingerprints, rollback finality, and abandonment. Cycles 23 through 27
closed those gaps without weakening the Native Stage A contract:

- the shared archive inventory/restore DTO now fixes exact fields, bounds,
  ordering, transport names, error/status/retryability mappings and preview-key
  rotation behavior;
- one global UUID ownership record binds a stable authenticated principal,
  exact client facts, server-derived target/content, and separate
  domain-separated process and Native fingerprints before dispatch;
- durable `dispatched` publication and the shared authority lock precede Native
  invocation, so cancellation/tombstoning cannot race an in-flight request;
- `committed`, `not_found`, `rolled_back`, wrong-principal, abandoned and
  authority-full outcomes have exact non-enumerating replay semantics;
- RFC 8785 digest preimages, stable hosted/Desktop principal encodings,
  monotonic operation state, permanent UUID tombstones and a fail-closed 65,536
  ownership bound are normative; and
- the proof matrix includes transport byte equivalence, cross-principal UUID
  collision, response loss after archive retirement, key rotation between GET
  and POST, dispatch/cancellation crash barriers, digest KATs and quota
  exhaustion.

The independent Cycle 27 audit returned zero unresolved BLOCKER, HIGH or MEDIUM
against the current Native identity/replay contract. This is a plan pass only;
the current implementation, Stage A/B receipts, Stage C, root integration,
packaging, release and cohorts remain gated.

```gate-result
{"gate":"cycle-27-plan-current-byte","status":"pass","verdict":"ZERO_UNRESOLVED_BLOCKER_HIGH_OR_MEDIUM","unresolved_blocker":0,"unresolved_high":0,"unresolved_medium":0,"packets":16,"invariants":21,"success_criteria":31,"journeys":25,"audited_hashes":{"MASTER-BUILD-PLAN.md":"fbf4941bf141b757ad9bbf7c14dfd12317af4fca2cfe9fca248eafaab42d4fba","MASTER-PLAN-AUDIT.md-pre-result":"141aba60c39320a90aeba4e36c067c78d8717ea1c84ba348829d87a81ba557c0","README.md":"68aeaa8469a34ace9fde2b5a45ee4f612f7dc999d96d4334e4a89ef0a81cff0a","NATIVE-CONSTITUTION-V2-ACCEPTANCE.md":"635b6ab051722041cfb86169d28b116286cdbb967eef9b56755b649e709ebea2","CONSTITUTION-RECOVERY-ACCEPTANCE.md":"80995c2449d4b37ea4672b14f4aaa62a74beecee5da3d9ba23edcf75960dc999","M0A-SPEC.md":"28afe9b1c2f56bce079a4b98d5345515dd57a5e8961e8f052e26f56dc1345647","EXECUTION.md":"8986bce7e793248a6c13b9aba4fbad1e96a83ed019f5db98d22c2eb80a91d54a"},"scope":"Adaptive Cockpit, Cowork and Constitution v2/recovery source of truth including exact archive DTOs, principal-bound global UUID ownership, dual fingerprints, rotation, replay, rollback and bounded abandonment","authority":"plan pass only; implementation, receipts, Stage C, integration, packaging, release and cohorts remain gated","next_action":"implement and prove the exact contract against these bytes, seal Stage A at zero unresolved HIGH/BLOCKER, then begin Stage B"}
```

## Cycle 31 — Wave 0 local-recovery scope rebaseline

Cycle 30 correctly rejected an over-scoped Wave 0 that had absorbed portable
rescue transfer, portable key wrapping, destructive rescue deletion and
retention garbage collection. Those are independent product and security
surfaces, not prerequisites for proving a safe Classic rollback. The corrected
Wave 0 contract therefore retains authenticated encrypted local rescue
indefinitely, exposes no portable or destructive rescue entrypoint, and leaves
the complete future transfer contract with issue #903/P1.

The first independent re-audit found two HIGH documentation/proof gaps: the
README still appeared to reuse a historical pass, and the negative-surface
gate did not explicitly enumerate Native helper verbs or background lifecycle
registries. The current bytes close both findings. The README rejects stale
Cycle 22/27 authority, and the proof now covers hosted routes, preload and IPC,
renderer actions, service methods, Native request unions/dispatch/protocol
verbs, startup hooks, scheduled/background jobs, cleanup registries, retention
workers and updater migrations. Unknown Native verbs must fail before any
filesystem entry; cold start, restart, key rotation, upgrade, conflict,
discard and chat deletion must preserve local rescue and required retired keys.

The independent current-byte rerun returned zero unresolved BLOCKER or HIGH
findings. This pass authorizes continued dependency-eligible implementation
only. It does not accept Stage A, Stage B, Stage C, M0A, production state,
packaging, a release, a cohort or any later portable/destructive rescue surface.

```gate-result
{"gate":"cycle-31-wave0-local-recovery-current-byte","status":"pass","verdict":"ZERO_UNRESOLVED_BLOCKER_OR_HIGH","unresolved_blocker":0,"unresolved_high":0,"audited_hashes":{"MASTER-BUILD-PLAN.md":"f24f875f481fda74ff2b3ce53ee2abad0a954494130d35b7be46aec51e9adc1f","MASTER-PLAN-AUDIT.md-pre-result":"83b2804602c8422ba37e7ff10bfcb2e3ea24dd5e4f2845c5e360962078f652bb","wave-0/M0A-SPEC.md":"11dbe8fb7b10a588541e49fe719401796e0f5f4c20cdda20df9f2b99d47c44a4","wave-0/NATIVE-CONSTITUTION-V2-ACCEPTANCE.md":"536964353a241e882e5c57aec15e46a608e4dadc9576a8abd6e3fab705001fc2","wave-0/CONSTITUTION-RECOVERY-ACCEPTANCE.md":"da2b9a3b89127764bc69e99efc7e17cece1fc9212c53cf447b7abc68385c6f80","README.md":"e8267ad9ea6d9d94a3ee2a09113ca7b4bc057afe765522c1c591c6525c64ff45","wave-0/EXECUTION.md":"8986bce7e793248a6c13b9aba4fbad1e96a83ed019f5db98d22c2eb80a91d54a","INSTANCE-MIGRATION.md":"f34c5ddacde25b83e9f1db9f8361c3a849da8155ba7303625deeacc8d54be8f7"},"scope":"Wave 0 non-destructive same-device Classic rollback and indefinite authenticated encrypted local rescue; exhaustive absence of portable export/import and destructive delete/purge/prune/GC surfaces","authority":"plan pass only; implementation, receipts, Stage A/B/C, M0A, production state, packaging, release and cohorts remain gated","next_action":"finish canonical request identity, crash-safe legacy migration replay, archive restore operation authority and exact-HEAD implementation proof"}
```

## Cycle 32 — Restart-safe Classic recovery discovery

The first Stage B service implementation exposed one new HIGH that Cycle 31 did
not model: production preparation returned the projection authority path only
to the short-lived Classic-launch command. After process restart, ordinary v2
Desktop had no authenticated locator and the shared DTO correctly prohibited a
caller-supplied path. A user could therefore create supported work in Classic
whose sealed projection existed but was disconnected from the recovery UI.

The corrected contract adds a deterministic installation-scoped registry
outside live v2 state and every Classic tree. An append-only external-recovery-
key sealed locator chain selects exactly one active preparation, binds its
projection digest and installation root identity, publishes activation before
Classic spawn, publishes terminal disposition without deleting rescue, and is
the only production discovery source. It also closes the cross-preparation
cryptographic inventory gap by requiring one tuple registry to authenticate
every locator and every retained preparation record before seal or exposure.
Cold absence remains non-creating; malformed, forked, stale, wrong-root,
multi-active, missing-key, missing-projection and digest-mismatched states fail
closed without exposing a path.

Inline adversarial source tracing found no remaining unresolved HIGH in the
corrected contract: the process-loss, pre-spawn crash, post-mutation response
loss, concurrent successor, rollback-selection, live-state-touch, path-leak,
multi-session, key-rotation, tuple-reuse and indefinite-rescue boundaries are
now explicit. This is a plan pass only. Implementation, exact-head proof, Stage
C, M0A, root integration, packaging, release and cohorts remain gated.

```gate-result
{"gate":"cycle-32-classic-locator-current-byte","status":"pass","verdict":"ZERO_UNRESOLVED_BLOCKER_OR_HIGH","unresolved_blocker":0,"unresolved_high":0,"scope":"restart-safe same-device Classic recovery discovery, append-only locator authority, installation binding, crash and response-loss replay, cross-preparation tuple inventory, indefinite local rescue","authority":"plan pass only; implementation and all downstream gates remain locked","next_action":"implement the exact locator contract, prove it with hostile restart/concurrency/tamper tests, then wire Stage B transports and UI"}
```

## Cycle 33 — Current implementation truth and reproducible hosted evidence

The Stage A/B implementation moved materially beyond the Cycle 32 source-of-
truth banner. The Native and recovery acceptance packets are now explicit that
the key/envelope lifecycle, authenticated CAS journal, rescue-before-CAS,
restart-safe locator, shared DTOs, services, HTTP/IPC/preload and renderer
surfaces exist and are locally green. They remain equally explicit that this is
an unsealed dirty candidate, not Stage A, Stage B or Stage C acceptance. The
required sequential Stage A then Stage B commit identities, immutable receipts,
signed Classic journey, target packages and independent exact-HEAD audit remain
hard gates.

Goal-backward and current-source tracing found two HIGH evidence defects and one
HIGH sequencing-truth defect while reconciling those claims:

| Finding                                                                                                                                                                                                    | Correction                                                                                                                                                                                                                                                                         | Current evidence boundary                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| The retained historical manifests contained strong provenance fields, but the recorded producer generator emitted only a raw manifest; no digest-bound step reproduced the enriched checked-in bytes       | Added a deterministic, self-digest-bound manifest finalizer; reproduction now records both finalization commands, each manifest binds the finalizer and updated reproduction digest, and the candidate test reconstructs the raw manifest and requires byte-identical final output | Targeted real-helper/service provenance proof passes; the finalizer does not rebuild the historical helper or mutate fixture state bytes             |
| Standalone startup installed strict Constitution authority, but the Docker runtime copied no Linux helper resources; a Linux-target authority could therefore fail at boot or degrade for the wrong reason | Docker now builds the exact helper in a pinned Rust stage, `prepareConstitutionFs` digest-binds an exact-target non-symlink prebuilt helper before server bundling, and the runtime copies only the bound resource directory                                                       | Source/contract tests, strict lint, typecheck and `build:server` pass; an actual built-container journey remains package evidence and is not claimed |
| Stage B source was implemented before Stage A had an immutable local seal, while the normative order forbids Stage B from consuming an unsealed Stage A                                                    | Both acceptance packets now call the Stage B source provisional and require an exact Stage A commit followed by an exact Stage B commit based on it, with Stage B proof rerun against that identity; a combined commit is explicitly rejected                                      | This closes the source-of-truth contradiction only. Commit splitting, rerun and receipts remain mandatory before Stage C                             |

Plan audit: 16 packets reviewed
Goal alignment: 16 trace to brief criteria / 0 need attention
Scope: clean
Risk surface: 0 unresolved plan defects; 3 named implementation/evidence gates remain active
Dependency order: correct after the explicit Stage A then Stage B seal rule

Verdict: **PASS for dependency-eligible non-promoting implementation only.**
There are zero unresolved HIGH findings in the corrected Adaptive Cockpit,
Cowork and Constitution v2/recovery source of truth. This verdict does not turn
the current worktree into an accepted implementation and does not authorize
root integration, packaging claims, release, enrollment, cohorts or portable
recovery.

Audited current bytes before this result:

- `MASTER-BUILD-PLAN.md`: `f24f875f481fda74ff2b3ce53ee2abad0a954494130d35b7be46aec51e9adc1f`
- `MASTER-PLAN-AUDIT.md`: `2ef95de76dbd14b212af9f84aa31a83fcf90bf4ec1e3a40d4911ca0e49a9caa3`
- `README.md`: `fe812e700b0661cebac0c9a9d0e284b787498588a2bcab9193380b1660ed63a3`
- `wave-0/NATIVE-CONSTITUTION-V2-ACCEPTANCE.md`: `990730e0a95ff23e2978822bb9f4c7a80f1affb5e1de85e51c9c4014def51b68`
- `wave-0/CONSTITUTION-RECOVERY-ACCEPTANCE.md`: `5f50d74178937f92d3944c7f424b3e09229544982c1d3d5c9b9ce0dd98d0eef9`
- `wave-0/M0A-SPEC.md`: `11dbe8fb7b10a588541e49fe719401796e0f5f4c20cdda20df9f2b99d47c44a4`
- `wave-0/EXECUTION.md`: `8986bce7e793248a6c13b9aba4fbad1e96a83ed019f5db98d22c2eb80a91d54a`

```gate-result
{"schema_version":"1.0","gate":"plan-check","status":"PASS","project_type":"software","lenses":["goal-backward","scope","risk","dependency","source-trace"],"affected_artifacts":["MASTER-BUILD-PLAN.md","MASTER-PLAN-AUDIT.md","wave-0/NATIVE-CONSTITUTION-V2-ACCEPTANCE.md","wave-0/CONSTITUTION-RECOVERY-ACCEPTANCE.md"],"accounting":{"duration_ms":0,"lenses_invoked":5,"cost_usd":null},"remediation":[],"receipts_ref":null,"supersedes":"cycle-32-classic-locator-current-byte","gate_id":"plan-check-20260716T233621Z-a7c3","emitted_at":"2026-07-16T23:36:21Z"}
```

## Cycle 34 — Exact-current local aggregate closure

The final Cycle 33 manifest-finalizer and standalone Docker corrections have
now passed the complete local candidate gate on the unsealed Constitution
worktree at baseline `991c502e74506ec3702f92e429a8b31b655412ba`:

- `bun run test`: 1,347 Vitest files passed and 21 skipped; 13,959 tests passed
  and 143 skipped; all 30 Bun-native files passed with 224 tests and zero
  failures;
- `bun run typecheck`: passed;
- `bun run build:server`: passed with the two recorded pre-existing direct-eval
  warnings in `apiRoutes.ts` and `ChannelPluginResolver.ts`;
- scoped `oxlint`: zero warnings and zero errors;
- scoped `oxfmt --check`: passed;
- `bun run i18n:types`: generated key types were already current;
- `node scripts/check-i18n.js`: passed, while retaining the repository's
  existing missing-translation and unknown-literal-key warnings;
- `bunx electron-vite build`: passed; the renderer chunk-size warning remains
  advisory and is not a build failure;
- `git diff --check`: passed.

This closes the outstanding exact-current **local aggregate rerun** from Cycle 33. It does not change the plan-check verdict and does not seal Stage A or
Stage B: the candidate remains a dirty worktree, the sequential immutable
commit identities and receipts do not exist, and signed Classic, built-
container, Windows, target-package and independent exact-HEAD proof remain
mandatory.

## Cycle 35 — Seal inventory and Stage dependency correction

The first executable seal-boundary audit found one HIGH defect in the prepared
split: `externalRecoveryLauncher.ts` and its test were assigned wholly to Stage
A even though the candidate's activation-before-spawn path imports the Stage B
restart-safe locator. A literal split would therefore either fail to compile or
silently pull Stage B authority into the Stage A seal.

The corrected boundary makes both launcher files mixed. Stage A retains signed
Classic artifact verification, isolated projection and preparation without
locator registration. Stage B adds locator activation-before-spawn, terminal
publication, restart/tamper handling and the locator dependency. The dependency
scan then found the native service test also instantiating the Stage B archive
orchestration service; that test is now mixed, with the response-loss
orchestration case removed from Stage A. The hunk audit also corrected two
over-classified tests: the existing hosted route-client contract and hosted
security integration diffs contain only Stage A request identity, authority,
default and unsafe-platform proof, so both are wholly Stage A. The prepared
inventory now assigns all 135 live dirty paths exactly once: 96 Stage A, 20
Stage B, 19 mixed and zero unknown. Its fail-closed checker binds the exact
baseline HEAD, status bytes, path safety, regular-file identity and all current
file bytes. The live checker passes.

This removes the newly found plan HIGH but does not seal either stage. Mixed
hunk patches, byte-identical reconstruction, immutable commits, receipts and
all Stage C evidence remain required.

## Cycle 36 — Current-byte Stage A/B seal plan-check

Plan audit: 13 tasks reviewed
Goal alignment: 13 trace to brief criteria / 0 need attention
Scope: clean
Risk surface: 0 need sharpening after the Cycle 35 dependency/hunk corrections
Dependency order: correct

The current seal plan preserves the brief's Wave 0 boundary, v0.11.8 rollback
proof, exact evidence rule, cross-lane ownership and prohibition on commits,
integration or release without explicit authorization. Its preflight now fails
closed on dirty-path drift, ambiguous ownership, unsafe paths, symlinks, content
drift and Stage A imports of Stage B authority. Every one of the 19 mixed files
has an exact production/test hunk contract; the other 116 files have one whole-
stage owner. Stage A proof precedes its receipt, Stage B must use that exact
receipt commit as parent, and Stage C remains a separate package/live/audit
gate.

Verdict: **PASS for preparing the non-promoting seal only.** There are zero
unresolved plan HIGH/BLOCKER findings in the current-byte Stage A/B seal plan.
The verdict does not authorize either commit and does not convert local green
tests into Stage A, Stage B, Stage C, M0A or release acceptance.

```gate-result
{"schema_version":"1.0","gate":"plan-check","status":"PASS","project_type":"software","lenses":["goal-backward","scope","risk","dependency","source-trace"],"affected_artifacts":[".ijfw/memory/brief.md","wave-0/NATIVE-CONSTITUTION-SEAL-PLAN.md","wave-0/NATIVE-CONSTITUTION-SEAL-INVENTORY.json","wave-0/verify-native-constitution-seal-inventory.mjs","wave-0/NATIVE-CONSTITUTION-V2-ACCEPTANCE.md","wave-0/CONSTITUTION-RECOVERY-ACCEPTANCE.md","README.md"],"accounting":{"duration_ms":0,"lenses_invoked":5,"cost_usd":null},"remediation":[],"receipts_ref":null,"supersedes":"plan-check-20260716T233621Z-a7c3","gate_id":"plan-check-20260716T235944Z-7f2a","emitted_at":"2026-07-16T23:59:44Z","audited_hashes":{".ijfw/memory/brief.md":"9c40e1f07541eea47f1b42e06d97905b4c9ee129da618beccc5d94b813de7c58","wave-0/NATIVE-CONSTITUTION-SEAL-PLAN.md":"cdbc77ebaf90cb444a92087fd5e40357a076cb0ddaba71e09e38ff2d0cb0702b","wave-0/NATIVE-CONSTITUTION-SEAL-INVENTORY.json":"5736ab393da119d1689a6440740dc7744b16d3680b3f8f649473ec50324ce1f6","wave-0/verify-native-constitution-seal-inventory.mjs":"728cd6f1982b72c5f20fc865e86f61d7ae88dc31ea183fa9091a75ef10c9a0e0","wave-0/NATIVE-CONSTITUTION-V2-ACCEPTANCE.md":"e788ccbd581d7f3252031f3a895844398d0a6ee8d845e6631383323ff8e14596","wave-0/CONSTITUTION-RECOVERY-ACCEPTANCE.md":"6d618ed12c98524e4991271d82bc2911aa3cc15674ac8496b58976e9f5b809f6","README.md":"402d254640de9ac71de2bf6f0952d8012b6d0ef8f8fc5a8799d8f97b594bbddb"}}
```

## Cycle 37 — Hunk-level ownership convergence

The post-Cycle 36 hunk fingerprint exposed one further HIGH in the then-current
mixed assignment. The new `externalRecoveryLauncher.ts` projection publication
renames the prepared destination and activates the restart-safe locator as one
failure-atomic transaction. Splitting its candidate delta into a Stage A
no-locator publication and Stage B locator addition would invent an
intermediate implementation that does not exist and is not independently
proved. Cycle 36 is therefore superseded for seal-boundary authority.

The corrected inventory assigns the complete launcher delta and its test to
Stage B; Stage A retains the unmodified baseline launcher. The new
`applicationBridge.ts` sender predicate and `bridge/index.ts` recovery-service
wiring are likewise wholly Stage B. The recovery barrel diff is wholly Stage A
because it exports only crypto, authority, record, capture and promotion
primitives and contains no locator export. This reduces the mixed surface from
19 to 14 files without moving any behavior across the product boundary.

Plan audit: 13 tasks reviewed
Goal alignment: 13 trace to brief criteria / 0 need attention
Scope: clean
Risk surface: 0 need sharpening after hunk-level convergence
Dependency order: correct

The live fail-closed checker now passes at 97 Stage A, 24 Stage B, 14 mixed and
zero unknown paths, with zero forbidden Stage A dependencies. The 14 remaining
mixed files are necessary interface seams whose Stage A and Stage B symbols and
tests are individually enumerated. No unresolved plan HIGH/BLOCKER remains.
The candidate is still unsealed and every downstream evidence gate remains in
force.

```gate-result
{"schema_version":"1.0","gate":"plan-check","status":"PASS","project_type":"software","lenses":["goal-backward","scope","risk","dependency","source-trace","hunk-fingerprint"],"affected_artifacts":[".ijfw/memory/brief.md","wave-0/NATIVE-CONSTITUTION-SEAL-PLAN.md","wave-0/NATIVE-CONSTITUTION-SEAL-INVENTORY.json","wave-0/verify-native-constitution-seal-inventory.mjs","wave-0/NATIVE-CONSTITUTION-V2-ACCEPTANCE.md","wave-0/CONSTITUTION-RECOVERY-ACCEPTANCE.md","README.md"],"accounting":{"duration_ms":0,"lenses_invoked":6,"cost_usd":null},"remediation":[],"receipts_ref":null,"supersedes":"plan-check-20260716T235944Z-7f2a","gate_id":"plan-check-20260717T000312Z-b91e","emitted_at":"2026-07-17T00:03:12Z","audited_hashes":{".ijfw/memory/brief.md":"9c40e1f07541eea47f1b42e06d97905b4c9ee129da618beccc5d94b813de7c58","wave-0/NATIVE-CONSTITUTION-SEAL-PLAN.md":"5507c09552f75228b4d1b6d669e447e3651903b15f0d2ad9af56551dd49cfd4d","wave-0/NATIVE-CONSTITUTION-SEAL-INVENTORY.json":"c27980dd4ebf949ab5acc0815eb8ed6c6dc6c3228924d947956b3b967a509e69","wave-0/verify-native-constitution-seal-inventory.mjs":"728cd6f1982b72c5f20fc865e86f61d7ae88dc31ea183fa9091a75ef10c9a0e0","wave-0/NATIVE-CONSTITUTION-V2-ACCEPTANCE.md":"e788ccbd581d7f3252031f3a895844398d0a6ee8d845e6631383323ff8e14596","wave-0/CONSTITUTION-RECOVERY-ACCEPTANCE.md":"6d618ed12c98524e4991271d82bc2911aa3cc15674ac8496b58976e9f5b809f6","README.md":"744c897f166e5153cf6a0b83fda71fea462a22008db212d4a573cd0e75b90378"}}
```

## Cycle 38 — Live candidate inventory drift correction

The current-byte re-audit invalidated the Cycle 37 seal-plan PASS before any
seal or integration. The live `codex/desktop-constitution-production`
candidate at baseline `991c502e74506ec3702f92e429a8b31b655412ba` contained one
new untracked recovery consumer journey absent from the prepared inventory:
`tests/unit/webserver/constitutionRecoveryConsumerJourney.dom.test.tsx`.
Because the path exercises the real Stage B HTTP/IPC clients and mounted
recovery renderers, it cannot be excluded or silently absorbed by a descriptive
“corresponding tests” phrase.

The source of truth now assigns that exact path to Stage B, updates the live
inventory from 135 to 136 paths (98 Stage A, 24 Stage B, 14 mixed, zero
unknown), and names the test explicitly in the Stage B whole-file boundary.
The focused file passes four consumer-journey tests. The fail-closed inventory
checker passes against the live candidate with status digest
`66427634932ed46a1b7103e87c16434745a47e577f06f61e63d173a0ba5dc920`
and content-inventory digest
`b07f44d60e01ce327aef39b6782f182b5dea046c694093ac0265dbd55fab97ac`.

This closes the observed ownership drift only. Cycle 37 is superseded and the
plan remains on HOLD until an independent current-byte goal-backward, scope,
risk, dependency, source-trace, and hunk-fingerprint audit returns zero
unresolved HIGH/BLOCKER. No commit, seal, receipt, root integration, packaging,
release, or cohort authority follows from this correction.

```gate-result
{"schema_version":"1.0","gate":"plan-check","status":"HOLD","project_type":"software","lenses":["goal-backward","scope","risk","dependency","source-trace","hunk-fingerprint"],"affected_artifacts":["MASTER-BUILD-PLAN.md","MASTER-PLAN-AUDIT.md","README.md","wave-0/NATIVE-CONSTITUTION-SEAL-PLAN.md","wave-0/NATIVE-CONSTITUTION-SEAL-INVENTORY.json","wave-0/verify-native-constitution-seal-inventory.mjs","wave-0/NATIVE-CONSTITUTION-MIXED-HUNKS.json"],"accounting":{"duration_ms":0,"lenses_invoked":6,"cost_usd":null},"remediation":["independent current-byte re-audit"],"receipts_ref":null,"supersedes":"plan-check-20260717T000312Z-b91e","gate_id":"plan-check-20260718T133300Z-cycle38-hold","emitted_at":"2026-07-18T13:33:00Z"}
```

## Cycle 39 — Seal source-of-truth and identity repair

The independent Cycle 38 re-audit returned three HIGH, three MEDIUM and one
LOW finding. This cycle repairs the source-of-truth defects without sealing or
integrating the candidate.

The Cycle 37 ownership transition is now reconstructed exactly. Starting from
the current 136-entry inventory, removing the new consumer-journey path and
restoring `tests/unit/apiRoutes-helpers.test.ts` from Stage A to Stage B
reproduces the recorded Cycle 37 inventory SHA-256 exactly:
`c27980dd4ebf949ab5acc0815eb8ed6c6dc6c3228924d947956b3b967a509e69`.
Therefore the actual transition was the helper test Stage B -> Stage A, then the
new consumer journey entering Stage B. `useSerializedAutosave.ts` was already
Stage A in the hashed Cycle 37 inventory; its old mixed-table row, which named
no Stage B hunk, was stale prose and is removed. The resulting current counts
remain 98 Stage A, 24 Stage B and 14 mixed.

Inventory schema 1.1 now records `git_mode`, Git `blob_oid` and raw-byte
`sha256` on every one of the 136 entries. The verifier validates field shape
against the repository object format, recomputes and directly compares all
three identities, and fails closed before any aggregate digest is accepted. A
one-nibble Dockerfile SHA tamper produced exit 1 with `candidate identity
drift`; restoring the inventory returned the verifier to PASS at exact baseline
`991c502e74506ec3702f92e429a8b31b655412ba`, status digest
`66427634932ed46a1b7103e87c16434745a47e577f06f61e63d173a0ba5dc920`
and content-identity digest
`102fa7950b3e53bed2b661ba15c5336102570996fbc6dc20ce7f429d761c888e`.

The two acceptance contracts now label the 13,959 Vitest / 224 Bun-native run
as pre-Cycle-38 evidence and require a new aggregate run against the eventual
immutable candidate. The public badge names v0.11.18, the observation date is
2026-07-18, and the new consumer-journey file passes 4/4 focused tests.

Verdict: **HOLD pending independent re-audit.** These repairs remove the known
plan/source-of-truth findings but are not self-acceptance. No commit, seal,
receipt, integration, packaging, release or cohort authority follows.

```gate-result
{"schema_version":"1.0","gate":"plan-check","status":"HOLD","project_type":"software","lenses":["goal-backward","scope","risk","dependency","source-trace","hunk-fingerprint","identity-authority"],"affected_artifacts":["MASTER-BUILD-PLAN.md","MASTER-PLAN-AUDIT.md","README.md","wave-0/NATIVE-CONSTITUTION-SEAL-PLAN.md","wave-0/NATIVE-CONSTITUTION-SEAL-INVENTORY.json","wave-0/verify-native-constitution-seal-inventory.mjs","wave-0/NATIVE-CONSTITUTION-V2-ACCEPTANCE.md","wave-0/CONSTITUTION-RECOVERY-ACCEPTANCE.md"],"accounting":{"duration_ms":0,"lenses_invoked":7,"cost_usd":null},"remediation":["independent Cycle 39 current-byte re-audit"],"receipts_ref":null,"supersedes":"plan-check-20260718T133300Z-cycle38-hold","gate_id":"plan-check-20260718T140122Z-cycle39-hold","emitted_at":"2026-07-18T14:01:22Z"}
```

## Cycle 40 — Finite BLOCKER/HIGH convergence

The independent Cycle 39 audit found two gating authority defects: unknown
inventory fields were accepted, and a count-preserving Stage A/Stage B owner
swap was not checked against an approved identity. The verifier now requires
exact top-level, rules, counts and per-entry schemas, and requires the computed
136-entry ownership/content identity to equal the approved
`102fa7950b3e53bed2b661ba15c5336102570996fbc6dc20ce7f429d761c888e`.

Independent hostile replay rejected unknown inventory, rules, counts and entry
fields with exit 1; rejected a count-preserving owner swap with exit 1; and
restored to PASS at candidate `991c502e74506ec3702f92e429a8b31b655412ba`,
status digest `66427634932ed46a1b7103e87c16434745a47e577f06f61e63d173a0ba5dc920`,
136 paths and ownership counts 98/24/14/0.

Verdict: **PASS with zero unresolved BLOCKER/CRITICAL/HIGH plan findings.**
Non-gating editorial observations are not permitted to reopen this finite gate.
Implementation, seal, integration, packaging, release and cohort authority
remain separate.

```gate-result
{"schema_version":"1.0","gate":"plan-check","status":"PASS","project_type":"software","lenses":["identity-authority","strict-schema","ownership-pin","hostile-replay"],"affected_artifacts":["wave-0/verify-native-constitution-seal-inventory.mjs","wave-0/NATIVE-CONSTITUTION-SEAL-INVENTORY.json"],"accounting":{"duration_ms":0,"lenses_invoked":4,"cost_usd":null},"remediation":[],"receipts_ref":"candidate 991c502e74506ec3702f92e429a8b31b655412ba; status 66427634932ed46a1b7103e87c16434745a47e577f06f61e63d173a0ba5dc920; approved content 102fa7950b3e53bed2b661ba15c5336102570996fbc6dc20ce7f429d761c888e","supersedes":"plan-check-20260718-cycle39-independent-fail","gate_id":"plan-check-20260718-cycle40-pass","emitted_at":"2026-07-18T14:24:00Z"}
```
