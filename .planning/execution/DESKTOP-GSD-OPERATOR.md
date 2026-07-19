# Desktop GSD execution adapter

The Desktop milestone intentionally keeps Phase 1 open while long-lived observation and
acceptance checkpoints mature. Stock `gsd-progress --next` and unscoped
`gsd-execute-phase` are therefore prohibited: both can treat the lowest incomplete phase as
one serial queue and stall unrelated construction behind a human checkpoint.

`desktop-gsd-next.mjs` is a read-only construction selector. It is not an evidence,
acceptance, merge, release, or deployment authority.

## Operating loop

1. From the clean integration worktree, invoke the selector with the canonical repository
   root, expected branch, and exact integration HEAD.
2. Inspect its JSON candidate set. A missing mapping, verifier mismatch, dirty worktree,
   stale HEAD, dependency ambiguity, or shared seam returns nonzero or a serialized tail.
3. Manually create exactly one named clean worktree from the declared HEAD for each selected
   plan. Codex generic agents do not create or bind worktrees automatically.
4. Bind one builder to that exact worktree and one PLAN. The builder may own only the paths
   declared by the plan.
5. Run focused proof continuously. After the terminal claim is green, run the plan's lint,
   typecheck/build, hostile tests, and exact full `bun run test` contract.
6. Commit the task in its worktree. Integrate one commit at a time. Rebase and re-prove the
   next overlapping seam against the new integration HEAD before landing it.
7. Create the PLAN SUMMARY only after the terminal claim is green. A SUMMARY proves
   construction history only; it never proves packet acceptance.
8. Re-run the selector against the new clean exact integration HEAD.

Example:

```sh
node .planning/execution/desktop-gsd-next.mjs \
  --repo-root "$(git rev-parse --show-toplevel)" \
  --expected-branch "$(git rev-parse --abbrev-ref HEAD)" \
  --expected-head "$(git rev-parse HEAD)"
```

## Admission and checkpoint rules

- Phase 1 local construction needs no invented receipt.
- Mapped Phase 2-4 construction must use the exact schema-v2 **entry** gate in
  `DESKTOP-GSD-ADMISSION.json`. The verifier result must identify that gate, report
  `mode: entry`, prove green prerequisites, and return `accepted_targets: []`.
- Acceptance-mode gates cannot admit construction. A non-empty accepted target in an entry
  result is a hard failure, not extra evidence.
- Unmapped Phase 2-4 construction is denied. Phase 5 and Phase 6 are hard-denied.
- An explicit dependency on a non-autonomous checkpoint remains blocked in this selector,
  even if someone creates a forged SUMMARY. Checkpoint execution and authentication use
  their dedicated plans and verifier gates.
- Unrelated incomplete checkpoints do not block dependency-unlocked construction.

## Absolute prohibitions

- Do not use stock `--next` or unscoped/full phase execution for this milestone.
- Do not build directly in the integration/planning worktree.
- Do not integrate concurrently or accept stale proof.
- Do not infer acceptance from source, tests, SUMMARY presence, top-level verifier `ok`, or a
  green prerequisite graph.
- Do not alter keys, accepted-packet registries, receipts, requirement checkboxes, or Phase 1
  completion through this adapter.
- Merge to main, issue closure, release, deploy, observation start, cohort promotion, and live
  key provisioning remain Sean-only authorization gates.
