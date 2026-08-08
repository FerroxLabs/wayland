# Desktop validation pin

This corpus is a byte-for-byte mechanical import from Wayland Core commit
`98ad1c2836a543385a7a4298f4b3e54a55867ac5`, which is **released `v0.12.26`**.

- contract: `wayland-desktop-core` `1.12`
- generator: `wcore-desktop-contract-gen/13`
- fixtures: `sha256:aa95fefa7a822b0b7adede96c9c72fe3f8fe8dde1da25d4af9135bafaf39be10`
- schemas: `sha256:23fb30488d5a71521a13403dea1dc02cb8690ceec40f72aecd89b54bc5810edb`
- source inputs: `sha256:e762ec2e2084b75bf384dcef24f5edfc5a815d79c2abc59766d0e225a61775f2`

Verified by execution, not by reading: the released `v0.12.26` binary
(`--build-info` reports source `98ad1c28…`) emits exactly these five values in
its `ready.contract` block, and both digests recompute from the vendored bytes
in `desktopContractV1.test.ts`.

## Why this pin moved, and what it corrects

The previous pin was `1.0` / `wcore-desktop-contract-gen/1`, imported from Core
commit `d0aa0abc75af…`. That commit lives on branch `feat/887` and **is not an
ancestor of any `v0.12.*` release tag** — so the corpus this consumer validated
against never described a shipped engine. The mismatch stayed invisible because
`v0.12.25`, the version Desktop bundles, ships no contract corpus at all: it
emits no `ready.contract`, the consumer takes its legacy branch, and none of the
v1 machinery runs. `v0.12.26` is the first released engine to advertise a
descriptor, and it is the release that surfaced the drift.

`v0.12.26-rc.2` advertises the same `1.12` / `gen/13` identity but **different**
`fixture_digest` and `source_inputs_digest`. The pin is not interchangeable
between them; it tracks the release, not the line.

## Uptake from 1.0, measured against the released corpus

Purely additive — no event or command was removed or reshaped:

- events 39 → 52 (13 new), commands 11 → 23 (12 new), fixtures 110 → 161
- capabilities 8 → 17, subcontracts 3 → 8 (`durable_child`,
  `operator_tool_effect_resolution`, `runtime_diagnostics`,
  `semantic_failover_receipts`, `turn_recovery`)
- of the 115 files common to both corpora, 98 are byte-identical; 15 of the 17
  that differ only carry the descriptor stamp or its offset
- the one real wire change to an existing shape is `add_mcp_server` gaining an
  optional `allow_local` boolean. It is not in the schema's `required` set, so
  Desktop's existing command remains valid. In Core it gates loopback URLs for
  the SSE and streamable-HTTP transports only — it does not gate stdio.

## What this pin does and does not authorize

This file is contract authority for Desktop's v1 consumer. It does **not** change
the packaged Wayland Core binary: `DEFAULT_WCORE_VERSION` stays `v0.12.25` until
that uptake is separately authorized and passes live verification. Pinning ahead
of the bundled engine is safe in exactly one direction — `v0.12.25` advertises no
descriptor, so it negotiates as legacy and never reaches `assertDescriptor`.

The descriptor check itself is unchanged and stays exact-match on every field,
mirroring Core's own `observation.rs` host observer. Core states the constraint
plainly in `.planning/CONTRACT-REGEN.md`: a Desktop pinned to the old digest will
refuse to start against a Core built from a different commit, and vice versa —
**the two must ship on the same release train.**
