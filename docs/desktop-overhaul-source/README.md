# Wayland Desktop overhaul source of truth

Audit baseline: `v0.11.18` at `1b1c1e91119e3352bec3958188254ee91f150492`, published 2026-07-15.

This directory separates four questions that are too often collapsed into one:

1. Is a capability claimed?
2. Is code present and connected to a user surface?
3. Does the outcome work in a clean, representative journey?
4. Is it release-gated and supportable across Desktop, Core, Flux, and Cloud?

## Documents

- `MASTER-BUILD-PLAN.md` — canonical, release-gated Cockpit implementation and rollback plan; supersedes `ROADMAP.md` for the Desktop build sequence after audit approval.
- `MASTER-PLAN-AUDIT.md` — adversarial cross-audit history, post-implementation re-open, accepted revisions, residual execution risks, and the latest formal gate result.
- `AUDIT-v0.11.18.md` — executive assessment and scorecard.
- `CAPABILITY-LEDGER.md` — inventory and evidence-state model.
- `SYSTEM-CONTRACTS.md` — Desktop/Core/Flux/Cloud boundaries and required contracts.
- `JOURNEY-SCORECARD.md` — live application, build, cloud, and release evidence.
- `PARITY-MATRIX.md` — current competitive position.
- `CONCERNS-REGISTER.md` — prioritized defects, risks, debt, and gaps.
- `PRODUCT-STRATEGY.md` — the product thesis for an outcome-first all-in-one system.
- `COWORK-DEEP-DIVE.md` — source audit, competitor benchmark, target architecture, and release-gated build packets for provider-neutral knowledge work.
- `VOICE-CONVERSATION-MODE.md` — provider-neutral conversational voice surface, current implementation gaps, state/authority/privacy contract, and M5V delivery packet.
- `INSTANCE-MIGRATION.md` — encrypted full-instance Wayland Transfer contract,
  store inventory, crypto/container boundary, transactional import, hostile
  archive defenses, recovery, and P1 acceptance.
- `CLOUD-PRO.md` — community cloud and hosted Pro boundary.
- `ADOPTION-DISTRIBUTION.md` — community, advocacy, and distribution loops.
- `ROADMAP.md` — sequenced overhaul with exit gates.
- `live-ui-observations.json` and `screenshots/` — generated live Electron evidence.
- `e2e/live-ui-audit.e2e.ts` — repeatable route-capture harness.
- `wave-0/NATIVE-CONSTITUTION-V2-ACCEPTANCE.md` — paired native/helper,
  Desktop-consumer, durable replay, migration, degraded-capability, and real
  journey gate that supersedes the rejected production candidate.
- `wave-0/CONSTITUTION-RECOVERY-ACCEPTANCE.md` — Stage B recovery DTO,
  route/IPC, renderer, Classic disposition, rescue, and Stage C composition
  authority. It follows locally sealed Stage A and cannot independently grant
  root integration or production acceptance.
- `wave-0/NATIVE-CONSTITUTION-SEAL-PLAN.md` — executable whole-file and
  mixed-hunk boundary for producing the required sequential Stage A then Stage
  B immutable commits without collapsing the evidence chain.
- `wave-0/NATIVE-CONSTITUTION-SEAL-INVENTORY.json` — exact prepared assignment
  of all 136 current dirty candidate paths: 98 Stage A, 24 Stage B, 14 mixed,
  and zero unknown. It is not a seal; status/digests and mixed patches must be
  regenerated against the frozen candidate during the authorized seal.
- `wave-0/verify-native-constitution-seal-inventory.mjs` — fail-closed live
  checker for baseline, status, ownership, path safety and content-byte drift.
- `wave-0/prepare-native-constitution-seal-artifacts.mjs` — non-promoting
  generator for status, byte/patch digests and whole/mixed binary patch inputs;
  it creates no commit and explicitly leaves mixed-hunk acceptance unresolved.
- `wave-0/NATIVE-CONSTITUTION-MIXED-HUNKS.json` — exact 14-file Stage A/B
  selector contract, bound to current candidate file and patch digests.

## Evidence vocabulary

| State | Meaning |
|---|---|
| Claimed | Documentation or product copy says it exists. |
| Present | Relevant implementation exists in the pinned source. |
| Wired | A reachable production surface invokes it. |
| Journey-proven | A representative user outcome passed live. |
| Release-gated | CI blocks a release when that outcome regresses. |
| Operable | Diagnostics, recovery, versioning, and support boundaries exist. |

No row should be promoted by inference. A unit test proves a unit; it does not prove a packaged outcome.

## Planning authority

The earlier three-cycle PASS is superseded by the complete audit history. Cycle
10 closed only the bounded packaged-Core provenance contradiction: focused
proof was 46/46, a fresh macOS ARM64 package replayed the exact Core bytes and
runtime shape, and that bounded Gemini rerun returned `current_high=0`. It was
not an aggregate Wave 0 or Constitution-production verdict. The later immutable
audit rejected production Constitution candidate
`991c502e74506ec3702f92e429a8b31b655412ba`; the rollback-safe root remains
`12ea88caf3cd6e490a054060ea96b0f60966bfd8`. A replacement must first satisfy
the implementation and proof requirements in the paired
`wave-0/NATIVE-CONSTITUTION-V2-ACCEPTANCE.md` and
`wave-0/CONSTITUTION-RECOVERY-ACCEPTANCE.md` contracts excluding their final
independent audit, then seal one immutable Stage A/B candidate composition. A
fresh exact-HEAD independent audit
runs against that seal; only a zero-HIGH/BLOCKER result closes Stage C and
permits root integration. Cycle 20 additionally makes preservation of supported
work created in the isolated signed-v0.11.8 session a mandatory Stage C/M0A
gate: exact historical transaction replay, externally authenticated projection,
canonical Classic deltas, durable per-item promotion replay, explicit user
  disposition, encrypted rescue, and signed Classic journeys must pass. The
  current Wave 0 local-recovery plan rebaseline passed its fresh independent
  current-byte BLOCKER/HIGH audit in Cycle 40; no historical Cycle
  22 or Cycle 27 hash authorizes these changed bytes. Implementation remains
  non-promoting and must satisfy the named receipts and exact-HEAD audit
  independently. Cycle 32 additionally requires restart-safe discovery through
  the derived sealed Classic locator registry: no caller path, mutable process
  memory, or write into live v2 state may stand in for that authority. M0B
  privacy/aggregation machinery is a tested engineering
candidate, but its product capture, actual 14-day observation, and signed
receipt do not exist. Dependency-safe Wave 0 engineering may continue; M0A,
M0B, C0, MCP-2, M8, six-target release proof, invited alpha, and cohort
  promotion remain locked. `ROADMAP.md` retains the wider Desktop/Cloud/Pro
program history; where its older information architecture conflicts with the
approved adaptive-cockpit mental model, the master plan controls.

Cycle 38 supersedes the Cycle 37 current-byte pass. The live candidate gained
`tests/unit/webserver/constitutionRecoveryConsumerJourney.dom.test.tsx` after
the 135-path inventory was recorded. The fail-closed checker rejected that
unowned path. It is now explicitly Stage B, the prepared inventory contains
136 paths (98 Stage A, 24 Stage B, 14 mixed), the focused four-journey consumer
test passes, and the checker passes against the live candidate. This was a
correction, not implementation acceptance; every seal, integration, package,
release, and cohort gate remains separately closed.

Cycle 39 repairs the findings from that re-audit. Exact reconstruction of the
Cycle 37 inventory digest proves that `useSerializedAutosave.ts` was already
Stage A: the real intervening owner change was
`tests/unit/apiRoutes-helpers.test.ts` from Stage B to Stage A, followed by the
new Stage B consumer journey. The seal plan now matches that 98/24/14 source of
truth. Inventory schema 1.1 freezes Git mode, Git blob OID and raw-byte SHA-256
for every one of the 136 entries, and the checker directly rejects identity
drift. Historical aggregate evidence is labeled pre-Cycle-38 rather than
exact-current. Focused consumer-journey proof is 4/4. Cycle 40 independently
proved strict unknown-field rejection and pinned owner-map rejection, closing
the plan BLOCKER/HIGH gate. No commit, seal, integration, packaging, release or
cohort authority is granted by the plan pass.
