# Receipt-Gated GSD Execution

This milestone stays flat. GSD workstreams are separate milestones and are not
used to model the master plan's packet DAG.

Before any gated plan executes, run the separately installed verifier from the
repository root:

```sh
wayland-gsd-gate <gate-id>
```

The checker fails closed unless every required upstream packet has an
Ed25519-authenticated acceptance receipt under `.planning/receipts/`. The trust
root and exact control-plane commit live outside the mutable candidate at
`~/.config/wayland-gsd/desktop-control.json`. The external verifier checks the
gate manifest, packet contracts, checker, library, and hostile tests are
byte-exact to that pinned commit before invoking the in-repo checker. The trust
root intentionally starts empty and Sean must explicitly provision or delegate
an acceptance public key. Private keys never live in the repository. Directly
invoking the in-repo checker is non-authoritative and fails without external
trust-root injection.

The canonical signature binds packet ID, sealed packet-contract digest, source
baseline, full gate-manifest digest and revision, the exact authorized gate and
prerequisite-set digest, exact Git commit and tree, evidence log and environment
digests, acceptance state, issuer, and timestamp. The checker also proves the
commit exists, derives its actual tree, verifies baseline ancestry, and hashes the exact evidence
artifacts. Unknown or revoked signers, self-generated local signatures,
arbitrary/sibling commits, wrong baseline/revision/contract, substituted
evidence, malformed data, and missing receipts all fail closed. A colocated hash
sidecar is not acceptance authority and is not used.

Phase 1 is intentionally open. Its bounded plans may execute, but it cannot be
marked complete until `P1-AGGREGATE-ACCEPTANCE` passes. That sentinel requires
signed M0B and the named Phase 5 proof closure; code presence is insufficient.

Automatic GSD parallelization is disabled. Parallel Codex builders are launched
only after manually creating one clean worktree per plan, confirming disjoint
file and sequential-seam ownership, and binding each agent to its worktree.
Integration is serial.
