# Target-verification amendment required before packet acceptance

Status: **repository source implemented by plan 01-37; external installation remains BLOCKED on plan 01-38**

This document records the repository-side amendment implemented and hostile-
tested by plan 01-37. It is not evidence that the installed verifier changed.
The installed verifier and its external trust configuration remain untouched;
plan 01-38 exclusively owns installation and external pinning.

## Confirmed current behavior

Inspected on 2026-07-19:

- wrapper: `/Users/seandonahoe/.local/bin/wayland-gsd-gate`
- verifier library: `/Users/seandonahoe/.local/lib/wayland-gsd/packet-gate-lib.mjs`
- verifier digest: `sha256:fe08f0abc5a8e0b7a64165f006cd00f7865ef4674a4e99c428e8e8659247dff9`
- external control commit: `8586686ffbe008ad6f566f7ee2535fb1fb9a3877`
- repository manifest revision: `wld-packet-gates-2026-07-19.6`

`checkGate` validates only packets named in a gate's `all`, `any`, and `one`
prerequisite sets. The schema has no field identifying the packet that the gate
is meant to accept. Therefore a target-free gate is vacuously green and a gate
with prerequisites authenticates those prerequisites, not its claimed target.

Live read-only reproduction from the repository root:

```text
wayland-gsd-gate P1-M0B-COHORT  -> exit 0, ok=true, required=[]
wayland-gsd-gate P1-C0A         -> exit 0, ok=true, required=[]
wayland-gsd-gate P1-M1          -> exit 1 only because M0A is absent; M1 is not inspected
```

No Phase-1 plan may interpret the current command as target-packet acceptance.

## Minimal interface amendment

Keep the executable interface `wayland-gsd-gate <gate-id>`, but revise the
sealed manifest to schema version 2. Every gate declares a sealed `mode`.
Entry gates authenticate prerequisites only; acceptance gates separately
authenticate their accepted target:

```json
{
  "schema_version": 2,
  "gates": {
    "P1-M1": {
      "mode": "acceptance",
      "prerequisites": { "all": ["M0A"], "any": [], "one": [] },
      "accepts": { "all": ["M1"], "one": [] }
    },
    "P1-M1F": {
      "mode": "acceptance",
      "prerequisites": {
        "all": ["M0A", "FLUX-PRODUCER-ACCEPTANCE"],
        "any": [],
        "one": []
      },
      "accepts": { "all": [], "one": [["M1F", "NO-FLUX-CLAIMS"]] }
    }
  }
}
```

Required semantics:

1. Every gate must declare exactly one supported `mode`: `entry` or
   `acceptance`. Legacy `all`/`any`/`one` fields at gate top level and mixed
   v1/v2 objects are invalid.
2. An acceptance gate with no non-empty `accepts.all` or `accepts.one` is
   invalid and exits nonzero before reading receipts.
3. An entry gate has `prerequisites` and no `accepts`; it can report only entry
   readiness and can never mint or imply packet acceptance.
4. `prerequisites` and acceptance targets are validated independently through the same
   signature, contract, candidate, tree, registry, evidence, environment, and
   ancestry checks.
5. Acceptance-gate success requires every prerequisite group and every target group to
   pass. A prerequisite receipt can never substitute for a target receipt.
6. The result exposes separate `prerequisites` and `accepted_targets` objects.
   Plans close only from `accepted_targets`, never from the top-level `ok` alone.
   Entry results identify `mode: entry` and contain no green accepted target.
7. The signed receipt binds the digest of the complete schema-v2 gate object,
   including `accepts`; a v1 authorization cannot be replayed.
8. `accepts.one` requires exactly one authenticated target. Both and neither
   fail closed.

## Required Phase-1 gate targets

| Gate | Prerequisites | Accepted target |
|---|---|---|
| `P1-M0B-COHORT` | none | `M0B-COHORT-AUTHORITY` |
| `P1-M0B-INSTRUMENTATION` | `M0B-COHORT-AUTHORITY` | `M0B-INSTRUMENTATION` |
| `P1-M0B-DAY0` | `M0B-COHORT-AUTHORITY`, `M0B-INSTRUMENTATION` | `M0B-DAY0` |
| `P1-M0B-OBSERVATION` | `M0B-DAY0` | `M0B-OBSERVATION-COMPLETE` |
| `P1-M0B` | `M0B-OBSERVATION-COMPLETE` | `M0B` |
| `P1-M0A` | none | `M0A` |
| `P1-FLUX-PRODUCER` | none | `FLUX-PRODUCER-ACCEPTANCE` |
| `P1-M1` | `M0A` | `M1` |
| `P1-M1F` | `M0A`, `FLUX-PRODUCER-ACCEPTANCE` | exactly one of `M1F`, `NO-FLUX-CLAIMS` |
| `P1-M1M0` | none | `M1M-0` |
| `P1-M1S0` | none | `M1S-0` |
| `P1-C0A` | none | `C0-A` |
| `P1-AGGREGATE-ACCEPTANCE` | the existing complete Phase-1 prerequisite DAG | `PHASE1-AGGREGATE-ACCEPTANCE` |

`M0B-OBSERVATION-COMPLETE` must be added to the sealed packet contracts with
the bounded terminal claim already defined by plan 01-04. It is evidence of an
elapsed complete observation, not cohort acceptance.

## Complete existing-gate migration

Schema v2 is atomic for the manifest. It is not a Phase-1-only overlay. Every
current gate is classified from the master packet dependency contract:

### Acceptance gates

The Phase-1 gates in the table above are acceptance gates. In addition:

| Gate | Prerequisites | Accepted target |
|---|---|---|
| `P5-M8-ACCEPTANCE` | existing M0A/M0B/M1-M7 plus all existing exact-one capability/absence groups | `M8` |

`P5-M8-ACCEPTANCE` preserves every existing mutually exclusive physical-
absence branch as a prerequisite. Those branches are not targets and cannot
mint `M8`; the separately authenticated M8 receipt does.

### Entry gates

The following gates are construction/admission gates. They retain their exact
existing prerequisite sets and exclusive groups, declare `mode: entry`, omit
`accepts`, and cannot be cited as acceptance of the packet named in the gate:

- `P2-M2-BASE`, `P2-M2-MCP`, `P2-M3`, `P2-C0B`
- `P3-M4`, `P3-M5`, `P3-MCP12`, `P3-SBX1`, `P3-IMG`
- `P4-M6`, `P4-M7`, `P4-MCP3`, `P4-M5VA`, `P4-C1`
- `P5-M8-CONSTRUCTION`
- `P6-M9`
- `P7-P1`

`P6-M9` is the admission boundary for building/running M9 after exact release
evidence; it does not accept M9. `P7-P1` is the admission boundary for secure
portability construction; it does not accept P1. Later target acceptance needs
a separately sealed acceptance gate and receipt rather than reinterpretation of
these entry results.

The migration must reject any manifest containing an unclassified gate,
mixed v1/v2 fields, an entry gate with `accepts`, or an acceptance gate without
targets. Manifest tests enumerate every gate so future additions cannot bypass
classification.

## Files the external/control-plane owner must amend

Repository-controlled and therefore requiring a new pinned control commit:

- `.planning/execution/PACKET-GATES.json`
- `.planning/execution/PACKET-CONTRACTS.json`
- `.planning/execution/packet-gate-manifest.test.mjs`
- `.planning/execution/check-packet-gate.test.mjs`
- `.planning/execution/cross-worktree-receipt.test.mjs`
- `.planning/execution/README.md`

Externally installed and explicitly not edited by this planning pass:

- `/Users/seandonahoe/.local/lib/wayland-gsd/packet-gate-lib.mjs`
- `/Users/seandonahoe/.local/bin/wayland-gsd-gate`
- `/Users/seandonahoe/.config/wayland-gsd/desktop-control.json`

The external control update must pin the successor control commit and verifier
library digest. Its hostile proof must cover empty target sets, missing target,
prerequisite-only receipts, wrong target identity, stale v1 gate authorization,
both/neither exclusive targets, sibling commit/tree substitution, and a green
prerequisite paired with a red target. It must also cover unclassified gates,
mixed schema objects, entry gates with targets, acceptance gates without
targets, and attempts to cite an entry result as accepted-target evidence.

## Replanning rule

Plan 01-37 implements and tests the repository-owned source. Plan 01-38 then
installs those exact committed bytes and pins the external wrapper/library/control
without provisioning an acceptance key. Every packet-acceptance plan depends on
01-38 and may invoke only the gate ID implemented by 01-37 and proven live by
01-38. This document and repository source never substitute for that installation
proof.
