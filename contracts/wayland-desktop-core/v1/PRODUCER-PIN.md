# Desktop validation pin

This corpus is a byte-for-byte mechanical import from Wayland Core commit
`0ccaa90b17bea8eee606a79859e4a2be6ca05f12`, which is the **`v0.13.4` release tag**.

- contract: `wayland-desktop-core` `1.16`
- generator: `wcore-desktop-contract-gen/16`
- fixtures: `sha256:3d0d62863053a31046aec4f09338d911d5416b4a01fcdfcd574e20b70c1e0422`
- schemas: `sha256:2993aee1129fc1659cdd06d0ed168770ede7ed89437f644021cb9e77ec5bed62`
- source inputs: `sha256:7109269427740ec4c06abf2ee536b11ca6a465bfa5d12970ff84a32ca3342550`

Verified by execution, not by reading. The import was compared **file by file**
against the tag: 176 files, 176 digest matches, and a deliberately-wrong
comparison (the `v0.13.3` manifest against the `v0.13.4` one) was shown to
report a mismatch, so the check is known to discriminate rather than to be
vacuously green. The five values above were read from the tag's `manifest.json`
and then confirmed identical to the `contract` block of the `ready` fixture the
same tag publishes — the frame a real engine sends on line one.

## Why this pin moved

The previous pin was `1.14` / `gen-14`, taken from the 0.13.0 tree. It is the
same descriptor `v0.13.2` and `v0.13.3` advertise, so it was correct for the
engine Desktop bundled. `v0.13.4` advertises `1.16` / `gen-16`.

The descriptor check is **exact-match on every field**. Feeding Core's real
`v0.13.4` `ready.json` to the pre-move consumer throws
`Core contract minor differs from the pin` and puts the session in `failed`,
which is terminal — every later frame fails closed. So the corpus, the pin and
the bundled engine move in **one commit**, or 100% of conversations die on frame
one. That is why this file, `DESKTOP_CORE_V1_PIN`, `DEFAULT_WCORE_VERSION`,
`bundled-wcore-shasums.json` and `installer/scripts/postinstall.mjs` are a
single coupled edit and not five independent ones.

⚠️ **This pin is ahead of `v0.13.3` and is NOT backward-safe.** The old note said
pinning ahead was safe in one direction, but that was only true against
`v0.12.25`, which advertises no descriptor at all and therefore negotiates as
legacy without ever reaching `assertDescriptor`. `v0.13.2` and `v0.13.3` DO
advertise one (`1.14`), so a Desktop pinned here refuses them outright.

## Uptake from 1.14, measured against the released corpus

Purely additive. No event, command or shape was removed or altered:

- events 60 → 61. The one addition is `render_artifact`.
- **commands 23 → 23. Nothing was added.**
- fixtures → 171, child types 3.
- capabilities gain `path_boundary_prompt_v1`, `path_grants_v1` and
  `render_artifact_v1`.
- the `tool_approve` `scope` schema gains `always_path`.

That last line is the one that matters for behaviour. Under `1.14` the scope
`oneOf` admitted only `once`, `always` and `always_prefix`, so a folder grant
was **rejected by Desktop's own `validateOutboundCommand`** and threw before the
frame was written. Verified by execution with `once`, `always_prefix` and
`tool_deny` as positive controls in the same run. The folder-grant card could
never have worked on any engine we had pinned; this import is what makes it
reach Core at all.

## What is still missing, and is not ours to fix

`commands 23 → 23` is not an oversight in this note. Core added `grant_path`,
`revoke_path` and `grant_workspace_capability` to `ProtocolCommand` and
documented them in `docs/json-stream-protocol.md`, but shipped **no command
fixtures** for them. The command schema is generated from the fixture set over a
**closed `oneOf`**, so none of the three is representable in the published
schema, and a host that has negotiated the contract cannot send them: it fails
its own outbound validation.

Filed as **`FerroxLabs/wayland-core#314`**. Until it lands, do not build
spawn-time path-grant replay against this contract minor expecting it to work.

## What this pin does and does not authorize

This file is contract authority for Desktop's v1 consumer. It does not by itself
change the packaged Wayland Core binary — but unlike the previous move, it
**cannot be landed without it**. See the warning above.

Core states the constraint plainly in `.planning/CONTRACT-REGEN.md`: a Desktop
pinned to one digest refuses to start against a Core built from a different
commit, and vice versa — **the two must ship on the same release train.**
