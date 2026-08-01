---
phase: WLD-01-safety-foundation
plan: 38
status: installed-and-pinned
verified_source_commit: 740ed52e14e5097bc9992e78164fb3b6188e9c00
verified_source_tree: c9a0101777e5adc13f44b04157c3e003b13f8d60
evidence_model: external-installation-and-pin-of-verified-01-37-source
---

# Plan 01-38 Summary: Install and pin the schema-v2 verifier

## Delivered

- Installed the exact committed schema-v2 verifier wrapper and library bytes
  into the external control plane and re-pinned external control to the tested
  01-37 successor commit before any target-acceptance plan runs.
- Backed up the complete prior installed wrapper, library, and control config
  into a timestamped, mode-preserving backup directory before writing.
- Atomically replaced the installed wrapper and library and atomically updated
  only the successor control commit, controlled paths, and installed-library
  digest.
- Preserved the acceptance key registry and accepted-packet registry
  byte-for-byte (canonical digest identical before and after install).
- Proved the installed successor is fail-closed on a missing target without
  provisioning any acceptance key or authorizing any packet.
- Exercised the local rollback: restored the backup, reproduced the prior
  verifier smoke result, then re-installed the successor.

## Exact installed source identity

- Pinned control commit: `740ed52e14e5097bc9992e78164fb3b6188e9c00`
- Pinned source tree: `c9a0101777e5adc13f44b04157c3e003b13f8d60`
- Gate manifest source baseline: `6d41c34087b5f40a368c83ca18d2d8e5a7fdb894`
- Gate manifest revision: `wld-packet-gates-2026-07-19.7` (schema_version 2)
- Installed wrapper (`~/.local/bin/wayland-gsd-gate`):
  `sha256:42a5524705653c8ae0f77aaae006f4610eca2c9066cad256cac0759816053dba`
- Installed verifier library (`~/.local/lib/wayland-gsd/packet-gate-lib.mjs`):
  `sha256:1d46ba963f538eb44133a773c3b1d326c9967711f1a1f92b9c8f227a6acefadc`
- `verifier_lib_digest` pinned in control config equals the installed library
  digest above.

Reproduce with `git show 740ed52e14e5097bc9992e78164fb3b6188e9c00:.planning/execution/wayland-gsd-gate.mjs`
and `...:.planning/execution/packet-gate-lib.mjs`, then `cmp` against the
installed paths and `shasum -a 256` against `verifier_lib_digest`.

## Authority-registry non-change (canonical digests, pre == post)

- Acceptance key registry (`keys`):
  `sha256:4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945`
  (canonical value: empty list — no key provisioned)
- Accepted-packet registry (`accepted_packets`):
  `sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a`
  (canonical value: empty object — no packet authorized)

## Live fail-closed result

`wayland-gsd-gate P1-C0A` from the clean pinned candidate:

- exit status `1` (nonzero)
- `schema_version: 2`, `mode: acceptance`, top-level `ok: false`
- `prerequisites` reported separately from `accepted_targets`
- `accepted_targets.ok: false` with target `C0-A` rejected,
  `reason_code: PACKET_CANDIDATE_UNAUTHORIZED`
  ("packet candidate is not externally authorized")

The missing target fails closed on its own even though prerequisites are green,
and no acceptance key or accepted packet was created to reach this result.

## Rollback evidence

- Prewrite backup: `~/.local/share/wayland-gsd/verifier-backups/pre-01-38-<UTC>/`
  (mode-preserving copies of the prior wrapper, library, and control config).
- Exercised restore reproduced the prior installed state
  (control commit `8586686ffbe008ad6f566f7ee2535fb1fb9a3877`, prior library
  digest `sha256:fe08f0abc5a8e0b7a64165f006cd00f7865ef4674a4e99c428e8e8659247dff9`)
  and re-ran the prior verifier smoke, which returned exit `2`
  (`CONTROL_PLANE_DRIFT`) as before install. The successor was then re-installed
  and re-verified.

## Proof

- Task 1 verify: `git diff --exit-code 740ed52e1 -- .planning/execution` clean;
  installed wrapper/library `cmp` byte-identical to the committed source;
  installed library `shasum -a 256` equals `verifier_lib_digest`; pre/post
  canonical `keys` and `accepted_packets` digests identical.
- Task 2 verify: `wayland-gsd-gate P1-C0A` exit `1` with the fail-closed
  missing-target result above; `node --test .planning/execution/*.test.mjs`
  45/45 passed; `bun run lint -- .planning/execution` 0 warnings/0 errors.
- `bun run typecheck` (`tsc --noEmit`): exit `0`.
- `bun run test`: 15609 passed, 21/151 skipped. Four unrelated renderer DOM
  cases in `tests/unit/renderer/pages/workflows/WorkflowDetailModal.dom.test.tsx`
  flake under full-suite load; the file passes 12/12 deterministically in
  isolation and this packet changes zero repository files (`git status` clean),
  so the flake is a pre-existing property of the green head `a88ea3e06`, not a
  regression from this install.

## Explicit non-claims

- No acceptance key was created, rotated, or delegated. The trust root remains
  intentionally empty; Sean must still explicitly provision an acceptance key.
- No packet was authorized, accepted, or added to the accepted-packet registry.
- Nothing was merged, pushed, released, deployed, or used to close an issue.
- This install re-pins external control to the exact tested 01-37 source; it
  does not itself accept plan 01-37 or any downstream packet.
