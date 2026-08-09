# DESKTOP → CORE — C-1..C-5 integrated, §4 answered

**Binary tested:** `sha256:6d0ca72a1ca5afa7d33a337a73a6a389a1075d583a97e14096aaebc583b08a08`
(branch `fix/contract-corpus-host-parity` @ `d6f76c67`). Identified by sha throughout; it does
still self-report `0.12.26`.

**Integration commit:** `f94487a6b`. Full suite 16,328 passed / 0 failed, typecheck clean.
Nothing merged, nothing tagged, no PR.

---

## 0. Answer first — §4.3, the question that kills or confirms your last hypothesis

> *"Do you rotate session between turns?"*

**No. Desktop does not rotate session between turns, so `switch_active_session` never fires
between turns and cannot be clearing `hydrated_tool_names` in our sessions.**

How that was established, so you can judge it:

- Desktop spawns **one engine process per conversation** and keeps it alive across turns.
- The per-turn command is `{ type: 'message', msg_id, content, files }` — **no session field at
  all** (`src/process/agent/wcore/index.ts:1683`).
- The complete outbound command set is: `init_history`, `message`, `stop`, `tool_approve`,
  `tool_deny`, `approval_resume`, `set_config`, `set_mode`, `ping`. Nothing session-rotating.
- `switch_active_session` / `switch_session` / `session_switch` / `new_session` / `resume_session`
  appear **nowhere** in Desktop's source. That zero was positive-controlled first — the same
  search finds `set_mode` — because an unverified zero is worth nothing.

**So the surviving hypothesis in §4.3 is dead for the Desktop host.** If the loop persisted at
41 tools with curation engaged, session rotation is not the cause on our side.

---

## 1. §4.1 — the loop re-run, with the negative control you asked for

**Both runs are the same prompt, same profile, same model (GPT-5.6 Sol), same MCP set.**
The old-binary run is an archival session captured earlier today, not a fresh re-run.

| | OLD binary (released 0.12.26) | **NEW binary** |
|---|---|---|
| ToolSearch calls | **23** | **10** |
| Bash calls | 1 | 0 |
| total result-body chars | 964 | 367 |
| **largest single result body** | **117 chars** | **52 chars** |
| assistant answer produced | yes | yes |
| our ToolSearch guidance prompt | **INJECTED** | **DELETED** |

### What this does and does not prove

**Calls more than halved, 23 → 10, and that is with our coaching prompt removed.** We deleted
`toolSearchGuidance.ts` before measuring precisely so it could not flatter the result — it told
the model how to phrase searches, so leaving it in would have made this number meaningless. The
engine now gets short, well-formed queries with no coaching at all.

**But we cannot credit the bounded-echo fix from this data, and you should know that.** Your §4.1
expectation was "any miss response ≤ ~200 chars instead of a multi-KB echo". On the **old** binary
the largest result body in this session was **117 chars**. The multi-KB echo amplifier never fired
here, so this session cannot distinguish it. We are not going to claim a fix we did not observe
working.

**The `max_turns`-with-no-output failure did not reproduce on either binary.** Both produced a real
answer. Our earlier "21 ToolSearch + 4 Bash → `max_turns`, no output" was a different session shape
and we could not reproduce it today on either build.

### Why it still takes 10 calls — probably not your matcher

Every one of the 10 returned `status=Success`; there were no hard misses. The verbatim queries:

```
1  "research-advisor skill and web search"
2  "Skill tool load research-advisor instructions"
3  "web search current authoritative sources retail trading strategies stocks forex options"
4  "load skill named research-advisor"
5  "web"
6  "Skill"
7  "research-advisor"          -> No deferred tools matching "research-advisor" found.
8  "web search operation schema"
9  "internet search"
10 "search the web for sources"
```

**Only one MCP server was connected: `wayland-team-guide`, 2 tools.** There is no web-search tool
and no `research-advisor` skill tool in that session. The model is repeatedly hunting for tools
**that do not exist**, then rephrasing. That is a model-persistence behaviour against an absent
tool, not obviously a matcher defect — so we are not filing it against C-5.

Note the shape: short natural queries throughout, **no blob paste-back**. The §7 "invitation"
failure mode did not occur in either run.

---

## 2. A correction to §2 that would have killed us on frame 1

**Your re-pin table describes two sets. There is a third, and it is the one Desktop actually
ships.**

| | contract | generator | schema_digest |
|---|---|---|---|
| **shipped v0.12.26 (what Desktop ran)** | **1.12** | **gen/13** | **`23fb3048…`** |
| "OLD binary" `eb242c4c` in your table | 1.13 | gen/14 | `4971f456…` |
| NEW binary `d6f76c67` | 1.13 | gen/14 | `4971f456…` |

Your table marks `schema_digest` **"unchanged"**. That is true between your two dev commits and
**false for any host coming from the released engine** — ours was `23fb3048…`. A host that
re-pinned by following "unchanged" literally would have kept the wrong schema digest and died on
frame 1 with exactly the `GeneratorMismatch` §2 exists to prevent.

`eb242c4c` never shipped, so "if you are still running a binary built from `eb242c4c`" describes a
state no released host has ever been in.

**Suggested fix for the next handoff:** state the digests absolutely per binary, and drop
"unchanged" — it is only meaningful relative to a baseline the reader may not share.

We took our numbers from the manifest at `d6f76c67` and then **confirmed all three present in the
binary itself**, rather than copying the table. Your embedded-manifest verification method
reproduces exactly: both new digests present ×1, both old absent.

---

## 3. C-1 — confirmed fixed, and our workaround is deleted

All seven previously-undeclared events (`workspace_policy`, `capability_activation`,
`compact_offload`, `mid_flight_monitor_decision`, `provider_attempt`, `provider_failure`,
`provider_retry`) are now in the corpus — checked name by name against the new manifest, not taken
on trust. Counts are 23 commands / 59 events / 168 fixtures.

Desktop's seven-event drift allowlist is **deleted**. Those types now take the ordinary path:
schema-validated, then dropped by our unknown-variant arm. We ported all 173 corpus files from
`d6f76c67` rather than hand-editing digests.

---

## 4. Residuals — acknowledged, and one of them bites us

- **§6 resumed sessions replay thoughts unsigned.** Desktop **does** resume sessions, and we do run
  Gemini, so this will hit us. Understood as separate work; not filing.
- **§6 journal forward-compat.** Noted — we will not roll back across it with live journals.
- **§7 the success body is still a JSON array.** It did not cause a paste-back in either run above,
  so we have no evidence to push on it. Your two cheap follow-ups both sound right; we have no
  preference.

## 5. Not tested by us

- **C-4 / §4.2 Gemini `position 2` 400.** Not exercised — the runs above were GPT-5.6 Sol. We make
  **no claim** either way and have captured no request body.
- **§4.4 micro-compaction.** Not tested.
- The engine ran on macOS arm64, which you flagged as first exposure. It started, negotiated the
  contract, connected an MCP server and completed turns with no platform-specific failure.

## 6. One thing for whoever ships the next binary

Overwriting the engine binary **in place** gets the new one `SIGKILL`ed on exec on macOS, even
though bytes, adhoc signature and xattrs are identical to a copy that runs fine — the kernel's
code-signing cache is keyed to the path/inode. `rm` then `cp` works.

Checked on our side rather than left as a guess: `prepareWaylandCore.js`'s `copyFileSafe` does
`fs.copyFileSync` onto an existing target with no unlink first, so it can hit this. **Scope is
dev/CI only** — that script runs at build/prepare time, and a shipped upgrade delivers a whole new
`.app` bundle rather than overwriting a binary in place, so end users are not exposed. Flagging it
because it will waste someone's afternoon on a re-pin exactly as it wasted part of ours.
