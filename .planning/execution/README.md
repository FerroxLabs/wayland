# Receipt-Gated GSD Execution

> **⛔ DORMANT / SUPERSEDED — pivot 2026-07-20.** This entire receipt-gated packet machinery
> (`wayland-gsd-gate` external verifier, M0A/M0B acceptance receipts, the `P1-AGGREGATE-ACCEPTANCE`
> sentinel, the schema-v2 checker, and the `desktop-gsd-next.mjs` adapter) implemented the cohort/M0B
> acceptance ceremony that Sean killed. It is NO LONGER the acceptance model. Acceptance is now
> **Sean + Claude live-test together; a green Playwright sweep IS acceptance.** `STATE.md` +
> `ROADMAP.md` (see its 2026-07-21 reconciliation header) are the source of truth for `/ferrox-progress`.
> These files are retained as trail; do NOT run this gate to accept work. Never run the Ferrox
> milestone lifecycle here (it deletes worktrees).

This milestone stays flat. GSD workstreams are separate milestones and are not
used to model the master plan's packet DAG.

Before any gated plan executes, run the separately installed verifier from the
repository root:

```sh
wayland-gsd-gate <gate-id>
```

The schema-v2 checker distinguishes construction admission from acceptance.
Every gate is sealed as either `mode: entry` or `mode: acceptance`. Entry gates
authenticate prerequisites only, always emit `accepted_targets: []`, and can
never be cited as packet acceptance. Acceptance gates authenticate their
declared targets separately from prerequisites; both sections must be green and
the exact target must appear in `accepted_targets`. A top-level `ok` without the
declared target is never acceptance.

The checker fails closed unless every required upstream packet and every
declared acceptance target has an Ed25519-authenticated acceptance receipt in the absolute shared evidence store
pinned by `~/.config/wayland-gsd/desktop-control.json`. Receipts never live in a
candidate worktree: every clean packet worktree sees the same externally
authorized, digest-bound evidence, and a repository-relative override is
rejected. The trust root and exact control-plane commit also live outside the
mutable candidate. The external verifier checks the
gate manifest, packet contracts, checker, library, and hostile tests are
byte-exact to that pinned commit before invoking the in-repo checker. The trust
root intentionally starts empty and Sean must explicitly provision or delegate
an acceptance public key. Private keys never live in the repository. Directly
invoking the in-repo checker can produce a syntactically green result from
caller-supplied inputs, but that result is non-authoritative and cannot accept a
packet. The installed verifier executes an externally installed, digest-pinned verification library;
candidate-controlled environment variables cannot substitute a trust root or
invoke an authoritative in-repo path.

Verification and execution use the same immutable byte snapshot. The selector
executes the digest-checked wrapper bytes from memory instead of reopening its
mutable path. The wrapper imports the digest-checked verifier-library bytes
from memory and evaluates the gate manifest and packet contracts read from the
exact pinned Git commit together with one captured external trust/config
snapshot. A mixture of before/after manifest, contract, trust-root, or verifier
bytes is not an authority state.

The canonical signature binds packet ID, sealed packet-contract digest, source
baseline, full gate-manifest digest and revision, the complete exact schema-v2
gate object (mode, prerequisites, and targets), exact Git commit and tree, evidence log and environment
digests, acceptance state, issuer, acceptance-key ID, and canonical UTC
timestamp. Trust roots reject duplicate public-key identities so a revoked or
expired identity cannot be relabelled through another key record. The checker also proves the
commit exists, derives its actual tree, verifies baseline ancestry, and hashes the exact evidence
artifacts. Unknown or revoked signers, self-generated local signatures,
arbitrary/stale/unintegrated sibling commits, wrong baseline/revision/contract, substituted
evidence, malformed data, and missing receipts all fail closed. A colocated hash
sidecar is not acceptance authority and is not used.

Receipt failures expose a stable `reason_code` plus a fixed human-readable
`reason`. Parser excerpts, external paths, and runtime exception messages are
never copied into the result. Unexpected wrapper failures emit only a stable
`error_code` and the fail-closed exit status.

Repository source is not installed authority. Plan 01-37 supplies and tests the
schema-v2 source only. Until plan 01-38 installs those exact committed bytes and
pins the external wrapper, library, trust configuration, and control commit,
the currently installed verifier remains authoritative and no schema-v2 source
result may be used to accept a packet.

Phase 1 is intentionally open. Its bounded plans may execute, but it cannot be
marked complete until `P1-AGGREGATE-ACCEPTANCE` passes. That sentinel requires
signed M0B and the named Phase 5 proof closure; code presence is insufficient.
Release and Preview preserve both legitimate capability paths: Cowork may ship
only with C0-B, C1, and final package closure, or be physically absent together
with its native Office resources, UI surfaces, and release claims. A partial or
claims-only Cowork state cannot open either gate. Present and physically absent
receipts are exclusive alternatives: exactly one must authenticate. Zero or two
accepted alternatives fail closed for Flux, MCP, sandbox, image, Voice, and
Cowork release branches. A single physical-absence receipt may intentionally be
shared across independent exact-one groups so one bounded absence claim covers
the related capability and package-closure branches. Required packets and
`any` groups may not reuse packet identities across branches.

Automatic GSD parallelization is disabled. Parallel Codex builders are launched
only after manually creating one clean worktree per plan, confirming disjoint
file and sequential-seam ownership, and binding each agent to its worktree.
Integration is serial.
