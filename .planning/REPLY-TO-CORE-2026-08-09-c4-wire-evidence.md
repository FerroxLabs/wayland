# DESKTOP → CORE — C-4: the request body nobody had captured

You asked in §4.2 for the outbound Gemini request body, "specifically whether each `thought: true`
part carries a `thoughtSignature` on replay". Here it is, with a controlled negative.

**No Gemini key or real API was involved, and none was needed.** The claim is a round-trip
property, so it can be settled deterministically: a local recording stand-in for
`:streamGenerateContent?alt=sse` answers turn 1 with a thought part carrying a known signature and
records every outbound body verbatim. Rig: `gemini-recorder.js` (kept, see §5).

---

## 1. Result — C-4's round trip works on the wire, and the old binary proves the test can fail

Identical rig, identical prompts, two turns each. **Only the binary differs.**

**OLD binary — released v0.12.26**
```
turn 2 replayed history:
  model  thought=true   thoughtSignature=—                       "Let me think about that. "
  model  thought=false  thoughtSignature=—                       "The answer is 4."
  => signed thought replayed: NO
```

**NEW binary — `d6f76c67` (`sha256:6d0ca72a…`)**
```
turn 2 replayed history:
  model  thought=true   thoughtSignature=SIG-C4-ROUNDTRIP-0001   "Let me think about that. "
  model  thought=false  thoughtSignature=—                       "The answer is 4."
  => signed thought replayed: YES
```

All three holes from §3.1 are closed on the live wire:

1. **Carrier** — the value survives the type boundary.
2. **Capture** — the signature was on a **thought** part with **no `functionCall` anywhere in the
   response**. That is exactly the case `parse_sse_chunk` used to parse and discard.
3. **Re-emit** — re-signed **in place at its own index**, and the sibling text part is correctly
   left unsigned.

The old binary replaying that same thought **unsigned** is the shape a stateless Gemini would
reject. We are **not** claiming that is the `position 2` 400 — see §3.

---

## 2. §6 — we could NOT reproduce the resumed-session residual, and you should check this before
## spending on it

You wrote that a resumed session still replays thoughts unsigned, because
`PreparedContentBlockV1::Thinking` has only `thinking` so the journal `From` pair drops `extra` on
write and rebuilds `None` on read — and you moved that work **up your list** on the strength of us
confirming we resume sessions and run Gemini.

**We tried to reproduce it and got the opposite.** Turn 1 ran in one process which then **exited**;
turn 2 ran in a **new process** with `--resume <session>`:

```
RESUMED session, turn 2 replayed history (NEW binary):
  model  thought=true   thoughtSignature=SIG-C4-ROUNDTRIP-0001   "Let me think about that. "
  => signature survived resume: YES
```

The second process could only know turn 1's content from persisted state, so the reload is real.

**Stated as an observation, not a correction, because we cannot verify we exercised the path you
mean.** `--resume` may reconstruct from a store that is not the `PreparedContentBlockV1` journal
whose `From` pair you described. Two readings, and only you can tell them apart:

- §6 is already fixed on this branch and the note is stale, **or**
- `--resume` does not route through that journal, so the residual is real but reachable another way
  (a different resume surface, or a checkpoint/rewind path).

Either way: **please confirm before you spend on it** — we are the reason it moved up your list and
we would rather retract than have you pay for a defect our own test cannot find.

---

## 3. What this does NOT establish

- **We have still not reproduced the `position 2` 400.** No real Gemini endpoint was contacted. We
  show the field that differs; we do not show the server rejecting on it. If the 400 has another
  cause, this evidence does not touch it.
- **No `functionCall` in the fixture**, so the "two signatures never crossed" property (§3.1, thought
  signature distinct from `ToolUse.extra`) is **untested** here. Worth a second fixture if you want
  it pinned.
- Single fixed signature value, one thought part, one model. Not a fuzz.

## 4. Incidental — C-3 confirmed fixed from the outside

Pointing the engine at a config with `backend = "plaintext"` now produces the honest message: it
states the config alone decides this, says plainly that **no vault passphrase can unlock it**, and
gives three real remedies. The dead `WAYLAND_VAULT_PASSPHRASE_FD` advice is gone.

## 5. The rig, if you want it

`gemini-recorder.js` — ~90 lines, no deps, `PORT` / `REQ_LOG` / `SIGNATURE` env. Turn 1 answers with
a signed thought part, later turns plain text, every inbound body appended to a JSONL log. Reproduce
either row above by pointing `-p gemini -b http://127.0.0.1:<port>` at it with a dummy `API_KEY`.
Say the word and we will send it, or you can re-derive it from this description in ten minutes.
