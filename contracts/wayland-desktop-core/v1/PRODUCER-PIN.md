# Desktop validation pin

This corpus is a byte-for-byte mechanical import from Wayland Core commit
`bc13e6e32c161e291f283af5b73ad3b47a68d631`, which is the **`v0.13.11` release tag**.

**v0.13.11 ships the IDENTICAL corpus to v0.13.10.** Same contract `1.22`, same
generator `gen/22`, same counts (3 child types, 29 commands, 68 events, 195 fixtures),
and all three digests below unchanged — `git status contracts/` was empty after the
re-import, which is the check that establishes it rather than an assumption. Only the
producer commit moved (`cfa89a9c` -> `bc13e6e3`), so every wire note recorded below
for v0.13.10 still stands unmodified, including the open `approval_required` /
`resume_token` question, which this bump neither settles nor disturbs.

The engine itself is why the bump exists: v0.13.11 carries `20d99006`, which lets
skill executables under `.wayland-core/skills` run. v0.13.10's command floor refused
them, so no skill-bearing pack could execute a script at all. Proven by execution on
both platforms, interleaved A,B,A,B through `wayland-core sandbox exec`: v0.13.10
refused `node .wayland-core/skills/probe.js` in both rounds on macOS and on Windows;
v0.13.11 ran it in both rounds on both.

- contract: `wayland-desktop-core` `1.22`
- generator: `wcore-desktop-contract-gen/22`
- fixtures: `sha256:2221656e299ce2408ccbfe5380dc72cb0b542ec7bc1d1e2369488aa5bb311eb1`
- schemas: `sha256:47e255b800cb36390e975580e7d1cfa19c35bb43cb6ac71fa3e4efd55c22da6f`
- source inputs: `sha256:c2e79a631ff5401e9870569d147edcffd7b15bc1a3ce662ee04f1aee9c17c0f0`

Verified by execution, not by reading. `scripts/bump-core-engine.mjs` imported the
signed release asset `wayland-core-v0.13.10-desktop-contract-v1.tar.gz`
(`sha256:723f9d7c0fdcb243…`) and then re-hashed **every** imported file against the
extracted archive: 0 mismatches. The `ready` fixture was confirmed to agree with
`manifest.json` on every descriptor field, including the whole capability map — that
is the frame a real engine sends on line one. The release's publisher attestation was
verified to the producer commit above on `refs/heads/main`.

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
