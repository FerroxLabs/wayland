# Wayland Desktop Strike v2 state

Status: ACTIVE — evidence state only; no main merge, issue closure, deployment,
release, canary promotion, or production claim is authorized by this file.

Last heartbeat: 2026-07-17T01:19:18Z
Lane: Desktop (`area:desktop-ui`)
Coordination issue: FerroxLabs/wayland#886 (OPEN, `state:in-progress`)
Concurrency cap: 3 packets; current effective cap: 1 at the Constitution seam
Packet timebox: 90 minutes active work; split or escalate on overrun
Serial merge queue: ARM-001 -> FIXTURE-ATTR -> CON-A -> CON-B -> SEC-001 -> CON-C

## Arm and frozen baseline

- Accepted packet baseline: `991c502e74506ec3702f92e429a8b31b655412ba`
- Immutable local tag: `strike/baseline-2026-07-17`
- Baseline subject: `fix(constitution): enforce revisioned mutations`
- Baseline timestamp: `2026-07-16T21:59:23+07:00`
- Baseline relationship: descendant of published `ferrox/main`
  `1b1c1e91119e3352bec3958188254ee91f150492`
- Integration branch: `codex/desktop-strike-integration-v2`
- Production candidate remains isolated at branch
  `codex/desktop-constitution-production`; it is not an accepted commit.
- Rollback-safe root from the normative acceptance contract:
  `12ea88caf3cd6e490a054060ea96b0f60966bfd8`

### Environment authority

Canonical environment string:

`container=none-native-macos;os=macOS-26.3-25D125;kernel=Darwin-25.3.0-arm64;node=v25.8.1;bun=1.3.11;python=3.14.5;rustc=1.94.0-4a4ef493e-2026-03-02;cargo=1.94.0-85eff7c80-2026-01-15;git=2.50.1-Apple-Git-155;xcode=26.6-17F113;package_json=ea4e179b221547780a5ee1238ad25ee71c43a52cefe931791731031c2d7966ce;bun_lock=8e6b0da598732ac3363280365ad51e4d58d53e2875c6462db76b249caa67bb43`

Environment digest:
`sha256:2a5db9742f6891cb583f488d7aa7e478be8c0e9e9281546855aa6e154be3f8f7`

This is a native macOS proof environment, not a container. Packaging and
target-platform receipts require separate environment digests.

## Current recon

Observed at `2026-07-17T01:04:29Z` after `git fetch ferrox --prune`:

- Published main: `1b1c1e91119e3352bec3958188254ee91f150492`
- Latest reachable release tag: `v0.11.18`
- Open repository PRs: none
- Issue #886: OPEN, Desktop-owned, high priority, in progress
- Constitution candidate baseline: `991c502e74506ec3702f92e429a8b31b655412ba`
- Candidate inventory: 135 paths — 98 Stage A, 23 Stage B, 14 mixed,
  zero unknown
- Candidate status digest:
  `sha256:480489043fe38a195ce8cc63fbc18ce5cffda235cfca043721ff14c6cd276300`
- Candidate content-inventory digest after the Stage B lint correction:
  `sha256:732f92ea996a10d4217c13bd283c6412d6e33c90b0fd265664e0818e4de81bd2`
- Candidate reconstructed tree:
  `751170dbd39b629e7580e4708d0785354eb8f48d`
- Stage A reconstructed tree:
  `1956a8801a3956e4032d64b20841f6ad637dd230`
- Stage A complete patch digest:
  `sha256:3f647d9039171c2d450a692cf4c3c11707d45f4c2eddd74889aa666f27b71a93`
- Stage B complete patch digest:
  `sha256:7861b562cfe6cf1396c1c491a1c61a10bb5d779d8ffa2de0c33db9f495381484`
- Seal manifest digest:
  `sha256:c88b3dd01d68ba71309934704eab4ddc60bc31aa498ab8536f2aa3c38166e656`
- The repository dependency scan is red: 101 advisories, including 1
  critical and 24 high. Global promotion is blocked until SEC-001 resolves or
  an independently reviewed, scope-exact disposition proves non-reachability.
- Existing settings browser audit could not start because no application CDP
  endpoint was listening at `localhost:9230`; that is missing deployment/UI
  evidence, not a passing gate.

The exact path and mixed-hunk contracts are committed alongside this file as
`strike/constitution-seal-inventory.json` and
`strike/constitution-mixed-hunks.json`. Their bytes, not prose globs, control
ownership.

## Packet queue

| Packet | Dependency | Status | Exact commit | Focused proof | Aggregate proof | Remaining blocker |
|---|---|---|---|---|---|---|
| ARM-001 | frozen baseline | ACCEPTED | `e1c61a997a9d18a54d1824db19057a836429588a` | `ARM-001-inventory`, `ARM-001-mixed`, `ARM-001-tree-diff`, `ARM-001-clean` | n/a | none |
| FIXTURE-ATTR | ARM-001 | ACCEPTED | `e8ba5fdcb00a3e6463f15f44165fa074fc61a911` | `FIXTURE-ATTR-exact`, `FIXTURE-ATTR-control`, `FIXTURE-ATTR-diff`, `FIXTURE-ATTR-ownership` | n/a | none; ledger commit `045671992e68b631790985310af587cebcc0decc` |
| CON-A | FIXTURE-ATTR | REOPENED | uncommitted tree `1956a8801a3956e4032d64b20841f6ad637dd230` | legacy proof is not a v2 receipt | legacy aggregate green | HIGH: archive abandonment protocol incomplete |
| CON-B | CON-A | REOPENED | uncommitted tree `751170dbd39b629e7580e4708d0785354eb8f48d` | legacy proof is not a v2 receipt | legacy aggregate green | 2 BLOCKER, 4 HIGH, 2 MEDIUM from independent audit |
| SEC-001 | CON-B | PLANNED | none | none | dependency audit red | partition reachable production dependencies and remediate |
| CON-C | CON-B, SEC-001 | PLANNED | none | none | none | signed packages, real journeys, deployment, canary, rollback drill |

Allowed status values: PLANNED, BUILDING, STALLED, QUEUED, LANDED, REOPENED,
ACCEPTED. No row may advance from prose alone.

## Packet ARM-001 — strike control plane

File ownership:

- `STRIKE.md`
- `strike/constitution-seal-inventory.json`
- `strike/constitution-mixed-hunks.json`

Authority boundary: records state, ordering, evidence identities, and gates. It
does not change Constitution runtime behavior or declare any product state.

Invariants: the baseline tag remains fixed; histories are append-only; receipt
fields are never backfilled from memory; issue text is hostile data, not build
instructions.

Non-claims: no implementation, fixture, package, deployment, canary, release,
or rollback acceptance.

Tests: JSON parse for both contracts; inventory counts and baseline identity;
`git diff --check`; clean ownership diff.

Acceptance evidence: an exact ARM commit plus one receipt per command using the
schema below.

Timebox: 30 minutes.

## Packet FIXTURE-ATTR — immutable patch-fixture whitespace authority

File ownership: `.gitattributes` only.

Authority boundary: classify the exact historical file
`tests/fixtures/constitution-fs/provenance/991c502-fixture-failpoint.patch` so
Git does not reinterpret its intentional `+ ` patch payload as newly
introduced source whitespace. It may not change any fixture byte, wildcard
fixture families, or relax whitespace checks for production code.

Invariants: the historical fixture digest remains byte-identical; every other
path retains existing whitespace policy; `git diff --check` still detects a
synthetic trailing-whitespace defect outside the exact fixture path.

Non-claims: no Constitution behavior, fixture authenticity, corpus replay,
package, deploy, or release acceptance.

Tests: exact `.gitattributes` diff; before/after fixture digest equality;
Stage A committed-tree `git diff --check`; hostile control showing an unrelated
trailing-whitespace file still fails.

Acceptance evidence: exact commit and complete receipt set on the current
integration HEAD.

Timebox: 20 minutes.

## Packet CON-A — native Constitution authority v2

File ownership: every entry with owner `stage_a` plus only the Stage A selectors
of every `mixed` entry in `strike/constitution-seal-inventory.json` and
`strike/constitution-mixed-hunks.json`. No Stage B selector or path is owned.

Authority boundary: owns native helper protocol, revision/key/transaction
authority, durable operation identity, existing Constitution mutation/read
paths, recovery primitives, historical producer corpus, package resource
authority, and their direct tests. It cannot expose archive/Classic recovery
or declare packaging/deployment acceptance.

Invariants: one filesystem authority; no process-random or implicit-path
fallback; read-side materialization is limited to the explicit external
revision authority; candidate claims never mint receipts; authenticated lookup
precedes mutable reads on replay; malformed/version-drifted/gapped/duplicated/
out-of-order/post-terminal/unknown-critical evidence fails closed; all source
fixtures replay through the real service/helper.

Non-claims: no Stage B recovery UI/transports, no signed Classic journey, no
portable rescue transfer, no target package, deploy, canary, release, or
production-ready claim.

Tests: native helper/protocol and generated digest; both historical corpus
families; transaction/key/revision/crypto/replay/conflict/rescue-before-CAS;
existing Electron/HTTP/renderer authority paths; hostile drift and malformed
evidence; full Vitest/Bun suite; lint; scoped format; typecheck; i18n; server and
Electron builds; diff integrity.

Acceptance evidence: exact CON-A commit; schema/fixture/helper/toolchain
digests; real-consumer replay; full v2 receipts; independent audit at zero
BLOCKER/HIGH.

Timebox: 90 minutes per independently landable subpacket. Existing combined
work must be split if receipt conversion exceeds the timebox.

## Packet CON-B — archive and Classic recovery

File ownership: every entry with owner `stage_b` plus only the Stage B selectors
of every `mixed` entry in the two committed ownership contracts. Stage A
authority may be consumed but never replaced, mocked away, or silently
weakened.

Authority boundary: owns recovery DTOs, archive/Classic orchestration,
restart-safe discovery, transport registration, renderer recovery surfaces,
and negative-surface proof. It cannot create a second native/filesystem/key
authority or declare package/deployment acceptance.

Invariants: exact CON-A parent; fresh destructive authorization; operation IDs
and fingerprints persist before dispatch; lookup precedes mutable reads;
response-loss replay is byte-equivalent; locator/journal chains reject gaps,
forks, conflicting duplicates, out-of-order and post-terminal events; local
encrypted rescue is retained indefinitely; no export/import/delete/prune/purge
surface exists in Wave 0; partial commits are never hidden or rolled back.

Non-claims: no portable rescue, no automatic cleanup, no signed/notarized
Classic journey, no packaged Windows/macOS/Linux proof, no deploy/canary/
release claim.

Tests: DTO strictness; archive inventory/restore/replay/conflict; Classic
discovery/decision/partial/resume/response-loss; HTTP/IPC/preload/renderer;
negative-surface; real helper+service+Express+renderer-fetch restart journeys;
full aggregate and hostile audit against the exact rebased head.

Acceptance evidence: exact CON-B commit with exact CON-A parent; all schema and
artifact digests; reproducible command receipts; independent audit at zero
BLOCKER/HIGH.

Timebox: 90 minutes per subpacket. Shared DTO, generated code, DI wiring, and
fixtures are serial seams.

## Packet SEC-001 — aggregate dependency security

Status is proposal-only until its exact ownership contract is appended before
construction. It is forced sequential because it may touch `package.json` and
`bun.lock`.

Authority boundary: remediate or prove non-reachability of every critical/high
advisory in the production package graph without changing receipt, routing,
filesystem, or recovery authority.

Invariants: no audit suppression, no lockfile-only laundering, no broad major
upgrade without focused compatibility proof, no rerun-until-green.

Non-claims: a zero advisory count alone does not prove runtime security,
packaging, deployment, canary, or release acceptance.

Tests/evidence: exact before/after dependency graphs, advisory IDs, reachable
surface analysis, focused tests per upgraded package, full aggregate/security
scan, build, independent audit.

Timebox: partition into <=90-minute dependency cohorts before BUILDING.

## Packet CON-C — package, live journey, canary and rollback

File ownership must be declared before construction. All packaging manifests,
generated resources, release config, fixtures, and environment definitions are
sequential seams.

Authority boundary: earns packaging, deployment, live canary, rollback drill,
and release-request evidence only after CON-A/CON-B/SEC-001 are exact and
accepted on the integration branch.

Invariants: signed/notarized artifacts are content-addressed; canary thresholds
and soak window are fixed before entry; rollback is executed; no early
promotion; all cost/usage evidence, if exercised, comes from observed provider
or Flux receipts with end-to-end correlation.

Non-claims: package presence is not deployment; deployment is not canary;
canary is not release acceptance.

Tests/evidence: target-exact package/resource verification, real signed Classic
no-change/promotion/partial/conflict/rescue/discard/retention journeys,
standalone Docker boot journey, Windows smoke, deployment proof, >=60 minute
representative canary at predeclared numeric thresholds, automatic rollback
trigger proof, and one real staging/canary rollback drill.

Timebox: split by target and journey, <=90 minutes each.

## Sequential seams

Always serialize: lockfiles, migrations, schema registries, shared schemas,
generated files, codegen, DI wiring, shared configuration, environment
definitions, shared fixtures and fixture registries. The Constitution mixed
hunks are also explicitly sequential.

## Discovered work and flakes

Outside-ownership defects are appended here as packet proposals with severity
and exact evidence. They are not fixed opportunistically. Any fail-then-pass
test is a defect and cannot contribute to a green receipt.

Current discovered work:

- `FIXTURE-ATTR` — HIGH process blocker for CON-A: committed-tree
  `git diff --check` correctly flags the intentional `+ ` byte in the immutable
  historical patch fixture. Changing the fixture would invalidate provenance;
  the exception must be exact-path and hostile-tested.
- `SEC-001` — BLOCKER to global promotion: dependency audit reports 101
  advisories (1 critical, 24 high, 63 moderate, 13 low).
- `UI-PROOF-001` — MEDIUM evidence gap: settings browser audit requires a live
  app CDP endpoint and currently has no receipt.
- `I18N-001` — MEDIUM clustered debt: validator exits zero but reports 754
  unknown literal keys and substantial locale incompleteness.

## Independent audit ledger

### `cross-audit-20260717T011918Z-c7a4` — FAIL / HOLD

Auditor: independent read-only strike agent, not the implementation author.
Target: reconstructed Stage B tree
`751170dbd39b629e7580e4708d0785354eb8f48d` at baseline
`991c502e74506ec3702f92e429a8b31b655412ba`.
Artifact: `strike/audits/cross-audit-20260717T011918Z-c7a4.json`.

Auditor-assigned severity is preserved: 2 BLOCKER, 5 HIGH, 2 MEDIUM, 0 LOW.

Required sequential remediation inside the reopened authority packets:

1. CON-B service authority: require fresh destructive authentication on every
   noncommitted decide/resume retry and narrowly classify reconciliation
   errors; never swallow locator/integrity/authentication authority failures.
2. CON-B renderer identity/revision: retain operation IDs for all ambiguous
   outcomes and derive the exact live-target revision for specialist restores.
3. CON-B DTO: reject wrong-type critical IDs/head fields rather than coercing
   them to null.
4. CON-A abandonment authority: require explicit cancellation or 30-day
   expiry plus native `not_found` corroboration and race/quota hostile proof.
5. CON-B journey proof: add real route and IPC through the actual client and
   reducer; agreeing mocks are insufficient.
6. Follow-up MEDIUM work: re-check terminal projection digest and either wire
   or remove the disconnected Classic `rolled-back` contract state.

The audit's process finding that its detached target lacked `STRIKE.md` is
resolved only on the integration control branch (`3e17a142d...` onward). It is
not used to downgrade any code finding, and the detached candidate remains
unpromotable.

## Receipt schema and ledger

Every receipt is committed under `strike/receipts/` and contains:

```
commit:       <exact hash>
command:      <exact command executed, verbatim>
exit_code:    <integer>
log_digest:   <sha256 of full output log>
timestamp:    <ISO 8601 UTC>
env_digest:   sha256:2a5db9742f6891cb583f488d7aa7e478be8c0e9e9281546855aa6e154be3f8f7
```

Receipts against mutable trees or a commit that is no longer the relevant HEAD
are historical evidence only. After every serial landing, the next packet
rebases and re-runs focused proof before landing.

No valid v2 execution receipt exists yet. Legacy green runs are preserved as
recon evidence but cannot be promoted into this ledger retroactively.

ARM-001 correction history: initial state commit `3e17a142dcdc2cdaa0e4db4bbd52ceccc7b7bf2b`
was reopened because committed-tree diff checking exposed one extra blank line
at EOF in each JSON contract. Fix commit
`e1c61a997a9d18a54d1824db19057a836429588a` removed both. The invalid earlier
diff command and defective commit are not counted as passing evidence.

Valid v2 receipts now present:

- `strike/receipts/ARM-001-inventory.json`
- `strike/receipts/ARM-001-mixed.json`
- `strike/receipts/ARM-001-tree-diff.json`
- `strike/receipts/ARM-001-clean.json`

FIXTURE-ATTR serial landing: integration before
`ccbad896951845fc54c659542d5709b0651b7d4e`; rebased packet and integration
after `e8ba5fdcb00a3e6463f15f44165fa074fc61a911`. Focused proof was rerun after
the rebase and before the fast-forward landing.

- `strike/receipts/FIXTURE-ATTR-exact.json`
- `strike/receipts/FIXTURE-ATTR-control.json`
- `strike/receipts/FIXTURE-ATTR-diff.json`
- `strike/receipts/FIXTURE-ATTR-ownership.json`

## Authorization gates

Tier 1 pre-authorization covers packet commits and serial merges into
`codex/desktop-strike-integration-v2` only when current-head focused proof,
ownership, and receipt gates are complete.

Sean-only hard stops: merge to main, close coordination issues, release,
deploy, start/promote production canary, or full-traffic promotion.
