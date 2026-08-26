# Desktop validation pin

This corpus is a byte-for-byte mechanical import from Wayland Core commit
`7066118a2835f6ec5d6932ffa525a6aff2e30100`, which is the **`v0.13.8` release tag**.

- contract: `wayland-desktop-core` `1.19`
- generator: `wcore-desktop-contract-gen/19`
- fixtures: `sha256:f71f73765225e6b2412155a4442a6f45590a0186d25e95976a0f2001d8241860`
- schemas: `sha256:9e594e4eda55d6cb52efca39092529e3a2ee2dac24ca69b7b3e1a0200d141de2`
- source inputs: `sha256:ac7c0a48b25ccb5c49a58bb8360fb0111cb6b0f7f978f17c6401c8ab7aa1efdf`

Verified by execution, not by reading. The import was compared **file by file**
against the signed release asset `wayland-core-v0.13.8-desktop-contract-v1.tar.gz`
(`sha256:3e21f826b08038a200a116b443da38ff2af85d08742a72a6ab069eae43d8d6ac`):
179 files, 179 digest matches, 0 mismatches, and a deliberately-wrong comparison
was shown to report a mismatch, so the check is known to discriminate rather than
to be vacuously green. The release's publisher attestation was verified to the
same producer commit on `refs/heads/main`. The five values above were read from the tag's `manifest.json`
and then confirmed identical, field by field including the whole capability map,
to the `contract` block of the `ready` fixture the same tag publishes — the frame
a real engine sends on line one.

## v0.13.7 -> v0.13.8: the stamp moved, the shape did not

This move changes **only** `fixture_digest` and `source_inputs_digest`. Compared
field by field against the released manifest, `name`, `major`, `minor` (19),
`generator` (`gen/19`) and `schema_digest` are byte-identical, and the capability
map compares EQUAL as a set: nothing added, nothing removed, nothing re-graded.
Counts hold at **26 commands, 61 events, 3 child types, 174 fixtures**.

Exactly **six** of the 174 vendored fixtures carry the descriptor stamp, and with
`manifest.json` that is seven changed files in the whole corpus; every other byte
is unchanged. That is why `DESKTOP_CORE_V1_PIN.minor` did not move.

It is also why the corpus still had to be re-vendored. `assertDescriptor` is
exact-match on **both** stamped digests, so a Desktop pinned to `v0.13.7` handed a
`v0.13.8` engine dies at the handshake on every turn, and a `v0.13.8`-pinned
Desktop refuses a `v0.13.7` engine the same way. A stamp-only move is not a
cosmetic move.

## Why this pin moved

The previous pin was `1.16` / `gen-16`, taken from the `v0.13.6` tree. The
descriptor check is **exact-match on every field**, so feeding Core's real
`v0.13.7` `ready.json` to the pre-move consumer throws
`Core contract minor differs from the pin` and puts the session in `failed`,
which is terminal — every later frame fails closed. So the corpus, the pin and
the bundled engine move in **one commit**, or 100% of conversations die on frame
one. That is why this file, `DESKTOP_CORE_V1_PIN`, `DEFAULT_WCORE_VERSION`,
`bundled-wcore-shasums.json` and `installer/scripts/postinstall.mjs` are a
single coupled edit and not five independent ones.

## Uptake from 1.16, measured against the released corpus

Purely additive. No event, command, capability or shape was removed or re-graded:

- **commands 23 → 26** — see below, this is the one that matters.
- events 61 → 61. Unchanged.
- fixtures 171 → 174, child types 3, subcontracts 8.
- capabilities gain `turn_abandon_v1`, `path_write_grants_v1` and
  `inline_reasoning_split_v1`.
- the manifest gains a `wire_shapes` section (0 → 88 entries) describing each
  command and event's on-the-wire file.

## wayland-core#314 is CLOSED by this import

`commands 23 → 26` is the headline. Core had already added `grant_path`,
`revoke_path` and `grant_workspace_capability` to `ProtocolCommand` and
documented them, but shipped **no command fixtures** for them. The command schema
is generated from the fixture set over a **closed `oneOf`**, so none of the three
was representable in the published schema, and a host that had negotiated the
contract could not send any of them: it failed its own outbound validation before
the frame was written.

`v0.13.7` ships all three fixtures. The three new files are the entire file-level
delta of this import. Spawn-time path-grant replay is now buildable against this
contract minor — it was not, at any minor we have ever pinned.

## What this pin does and does not authorize

This file is contract authority for Desktop's v1 consumer. It **cannot be landed
without the matching engine bump**: a Desktop pinned to one digest refuses to
start against a Core built from a different commit, and vice versa — the two must
ship on the same release train.
