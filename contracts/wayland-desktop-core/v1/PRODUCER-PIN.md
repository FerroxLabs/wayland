# Desktop validation pin

This corpus is a byte-for-byte mechanical import from Wayland Core commit
`6e4eca07fe5a215e365daa4e540767e0c9b8158b`, which is the **`v0.13.12` release tag**.

- contract: `wayland-desktop-core` `1.23`
- generator: `wcore-desktop-contract-gen/23`
- fixtures: `sha256:795bfc45481c28aadcfeada8de5a956b64eeb5ebb36460c7c78f274f45ef7188`
- schemas: `sha256:8497e92e4ab2599201f95b2aa62c359ae2328429305e79a96761356483fc6e33`
- source inputs: `sha256:83643f347adf9ea4c794d691778ea691e21cb0fe56d693234d4934fed42cca25`

Verified by execution, not by reading. `scripts/bump-core-engine.mjs` imported the
signed release asset `wayland-core-v0.13.12-desktop-contract-v1.tar.gz`
(`sha256:ae029ed9db621e5d…`) and then re-hashed **every** imported file against the
extracted archive: 0 mismatches. The `ready` fixture was confirmed to agree with
`manifest.json` on every descriptor field, including the whole capability map — that
is the frame a real engine sends on line one. The release's publisher attestation was
verified to the producer commit above on `refs/heads/main`.

## v0.13.11 -> v0.13.12: additive on the wire, mandatory for the engine

    minor        22 -> 23          generator  gen/22 -> gen/23
    commands     29 -> 29          events     68 -> 69
    child types   3 -> 3           fixtures  195 -> 196
    capabilities  NONE added, NONE removed, NONE re-graded

All three digests moved. One event was added, `grant_refused` (capability `available`,
criticality `safety`, correlated on `grant_id`). No command changed, and **no existing
event or command descriptor moved** — every type present in 22 kept its capability,
correlation and criticality byte-for-byte. That is what makes this bump additive, and
it is the difference between this one and v0.13.10's.

`grant_refused` types a refusal Desktop already expected. Its fixture:

    {"type":"grant_refused","surface":"path","grant_id":"grant-001",
     "reason":"local_opt_in_required",
     "detail":"the local launcher did not opt in with --allow-host-path-grants"}

Through contract `1.22` that refusal arrived as an untyped `info` string. The
behaviour has not changed — only its shape on the wire. Desktop's side of the opt-in
already exists and is untouched by this bump: `buildSpawnConfig`'s
`allowHostPathGrants` is per-spawn and default OFF (`pathGrantSeam.test.ts`), so a
session with no folder grants never asks for the authority and never sees the event.
Nothing in `src/` consumes it, which is not a gap: the `workspace_policy` receipt is
still what tells a host a grant landed — the absence of an error never was — so a
typed refusal is a second, louder signal rather than a new requirement. `set_mode_refused`,
the analogous additive event from v0.13.10, has no consumer either and has shipped since.

**The reason this bump is mandatory is not in the contract at all.** v0.13.12 carries
serde's `float_roundtrip`. Without it floats parse 1 ULP off, every journal digest
breaks, and a conversation dies on turn 2 — on v0.13.11 the only mitigation was one
turn per chat. Nothing in the corpus above can show that; it is an engine fix.

The open `approval_required` / `resume_token` question recorded below for v0.13.10 is
neither settled nor disturbed by this bump: both fixtures are byte-identical to 22's.

## This file was missing, and that is worth recording

`PRODUCER-PIN.md` is Desktop-authored and the bump script preserves it across the
corpus copy. The `v0.13.9` bump (`357fabd24`) **deleted it**, which is why the
`v0.13.10` bump crashed on `ENOENT` before writing anything. It was restored from
`357fabd24^` and then rewritten here. The v0.13.9 import therefore shipped with no
provenance record of its own; this file is the first since v0.13.8.

## v0.13.9 -> v0.13.10: small on the counts, NOT additive on the wire

    minor        21 -> 22          generator  gen/21 -> gen/22
    commands     29 -> 29          events     67 -> 68
    child types   3 -> 3           fixtures  194 -> 195
    capabilities  NONE added, NONE removed, NONE re-graded

All three digests moved. One event was added, `set_mode_refused` (capability
`available`, criticality `safety`). No command changed.

**The change that matters is not in the counts.** `approval_required` re-correlates
from `resume_token` to `call_id`:

    v0.13.9   {"call_id":"call-tool-001", "correlation_id":"resume-001",     "resume_token":"resume-001"}
    v0.13.10  {"call_id":"call-tool-001", "correlation_id":"call-tool-001",  "resume_token":""}

`commands/approval_resume.json` and `events/approval_resume.json` are **byte-identical**
to v0.13.9 and still correlate on `resume_token`. So the resume side of the handshake
did not move — only the side that hands Desktop the token.

Desktop reads that field truthily (`src/process/agent/wcore/index.ts`:
`if (event.resume_token) this.pauseStallWatchdog(...)`, and the `resumeToken` it
forwards to the renderer). An empty string is not a harmless null there: it would stop
pausing the stall watchdog across a human approval, silently. Whether the LIVE engine
populates the field or the empty fixture is the real wire is a question the corpus
cannot answer, so this bump is signed off against a packaged build and a turn that
actually raises approvals — not from the manifest alone.

`assertDescriptor` fails closed on the stamped digests, so a 0.13.9-pinned Desktop
handed a 0.13.10 engine dies at the handshake on every turn, and vice versa. That is
what these digests changing MEANS, and it is why the corpus re-import is not optional.
