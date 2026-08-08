# W-1 — why the model never invoked a discovered MCP tool

**ROOT CAUSE FOUND, and it is Core's.** `ToolSearch` is not a semantic search. It is an
**ALL-tokens literal substring match**, so a natural-language query that *contains the tool's
exact name* still returns "no match" if any other word in it is absent from the name or
description. The model rephrases — usually with *more* words — matches even less, and loops.

The mechanism is not a model failure, not Desktop's publication path, and not the contract.
**MCP tools do execute end to end on released v0.12.26** once the search matches.

Everything below was established by EXECUTING the released binary and the packaged app.

---

## The proof, back to back in ONE session against the SAME tool

```
ToolSearch("probe")                                   -> MATCH, full schema returned
ToolSearch("wld_probe_secret tool schema parameters") -> "No deferred tools matching ... found."
```

The failing query **contains the tool's exact name, `wld_probe_secret`**. It fails anyway,
because `tool`, `schema` and `parameters` are not substrings of the name or the description.

The matcher, `v0.12.26:crates/wcore-tools/src/tool_search.rs:98` and `:120-123`:

```rust
let tokens: Vec<&str> = query_lower.split_whitespace().collect();
...
if tokens.iter().all(|t| name_l.contains(t) || desc_l.contains(t))
```

Two consequences fall straight out of that code, and both were observed:

1. **More descriptive query = strictly less likely to match.** Every added word is another
   `all()` conjunct. This inverts the incentive the tool's own UI label sets — Desktop's
   settings pane describes ToolSearch as "Search the tool catalogue by intent".
2. **Punctuation is part of the token.** `split_whitespace()` does not strip it, so the real
   observed query `Tool named aion_list_models, load full input schema` tokenises
   `aion_list_models,` **with the trailing comma**, and `name_l.contains("aion_list_models,")`
   is false. The exact tool name, defeated by one comma.

## Live corroboration — and it is not Gemini-specific

`~/Library/Logs/Wayland/2026-08-05.log`, independently verified with
`grep -o "Tool call: [A-Za-z_]*" | sort | uniq -c`:

- **28 tool calls in the session. All 28 are `ToolSearch`. Zero calls to any other tool.**
- **19 of them returned `No deferred tools matching`.**
- Model: **`claude-sonnet-5`** — an Anthropic model.

Reproduced again today in the packaged app on `gpt-5.6-sol`:

```
[ToolSearch success] No deferred tools matching "aion_list_models tool schema parameters" found.
[ToolSearch success] No deferred tools matching "Tool named aion_list_models, load full input schema" found.
```

`aion_list_models` is a genuine tool of the connected `wayland-team-guide` server
(`src/process/team/mcp/guide/teamGuideMcpStdio.ts:110`), and the engine had already logged
`Connected to 'wayland-team-guide': 2 tools`. The tool was present and the search still missed it.

**Correction to this document's first draft:** I initially attributed W-1 to the native Gemini
`thought_signature` defect (C-4). That was wrong. The sonnet-5 log and today's `gpt-5.6-sol`
repro show the loop is model-agnostic, and the substring matcher explains it directly.
C-4 remains a real, separate defect.

## Core already knows, and 0.12.26 shipped only advisory text

`tool_search.rs:126-141` carries Core's own comment describing a **measured** no-progress loop:
"ten identical searches, no call ever attempted ... Every MCP tool was unreachable this way."
The v0.12.25 → v0.12.26 diff in that file is **two text changes only** — a longer tool
description and a `"status": "LOADED — ..."` string on each match. Neither changes matching, and
neither helps at all in the dominant failure mode, where there is **no match to attach a status
to**. (The comment credits "the Wayland Desktop lane" — that is us, from an earlier pass.)

A second, distinct Core defect sits behind it: `ToolSearchTool` answers from a
construction-time snapshot (`crates/wcore-tools/src/registry.rs:206-216`) that is never rebuilt
on hydration, while hydration state lives in `AgentEngine::hydrated_tool_names`
(`crates/wcore-agent/src/engine.rs:15356-15367`). So a repeat search returns a byte-identical
body. That is the failure mode the `status` string was written for; it is real but secondary.

## What DOES work — proven, and it is the product claim

Driving the released binary directly over `--json-stream`, Desktop removed entirely, with a
one-tool stdio MCP server whose body appends to a witness file on every call:

| # | path | model | discovered | **body executed** | sentinel in reply |
|---|---|---|---|---|---|
| A | config-declared, `deferred` default | `flux-fast` | yes | **yes** | yes |
| B | config-declared, same | `flux-pinned-gemini-3-flash` | yes | **yes** | yes |
| C | **runtime `add_mcp_server`** (Desktop's real path) | `flux-fast` | yes | **yes** | yes |

Run A's full user-visible reply: `The probe code is **PROBE-OK-8842**.` The witness file
independently recorded `CALL wld_probe_secret` — the body ran; the model did not fabricate it.
A positive control was run on the probe server BEFORE any engine run, so the later `CALL` lines
are trustworthy and an absent one would have meant something.

This rules out: the deferred-tool design (all runs used `deferred` default true), Desktop's
`add_mcp_server` path, the contract and the seven dropped events, and Gemini as a family.

## Two further findings — one real and fixed, one a false alarm I got wrong

- **W-1b — REAL, and now FIXED (`c967368e3`).** After one `refused to start`, later turns replayed
  the identical cached error — same sentinel path, same PID, 95s apart, and crucially **no second
  `(start) failed` line between them**, so no fresh spawn was ever attempted. `startError` had
  exactly one writer and no reset. The user could not recover without restarting the app.
  `sendMessage` now retries once per turn through `ensureBootstrap()`.

- **W-1a — NOT A DEFECT. My earlier claim was wrong.** I reported that the Autopilot approval
  wedge blocked MCP invocation. It does not. The line `approval_required reason='exec' in auto
  mode has no resume token and no HITL UI; turn may wedge` appears 5 times in the live log, and
  **4 of the 5 are followed within ~70ms by `[Bash success] Exit code: 0`** — the tool ran every
  time. Verified independently with `grep -A2`, not taken from the analysis that raised it.
  The turn that skipped `aion_list_models` called `Bash` instead: a model choice, not a block.
  What is left is genuine but far smaller — **the alarm is a false positive**, and a log line that
  predicts a failure which never occurs trains everyone to ignore it. A nit, not a blocker.

Also confirmed live: **K-02 works.** An engine that refused to start put its reason in the chat
as a durable error tip instead of a silent spinner.

## The mitigation, measured live

Shipped in `3227332a2`: when a session publishes an MCP server, Desktop injects one instruction
telling the model to search with a single distinctive keyword, retry *shorter* never longer, and
call the tool by name once matched. Placed before the user's own preset rules; skipped when no
server is published and on resume.

Same profile, same connector, same ask, before and after:

| | before | after |
|---|---|---|
| ToolSearch calls | 28 in one session (captured log) | **2** |
| "No deferred tools matching" | 19 of 28 | **0 — both matched** |
| turn duration | 136s, then died | **16s** |

The matching failure is gone. **The MCP tool still did not execute in the app**, because the model
then called `Bash` and hit W-1a, the Autopilot approval wedge — a different, host-side defect.
So the honest status is: C-5's symptom is mitigated and the remaining blocker in the packaged app
is ours, tracked as W-1a. End-to-end MCP execution remains proven on the engine (runs A–C) but
**not yet in the packaged app**.

## Asks

**Core (new, high severity — this blocks every MCP tool for every model):** make ToolSearch
matching tolerate natural-language queries. Minimum: strip punctuation when tokenising, and rank
by number of matching tokens rather than requiring `all()` — an exact name match should never be
defeated by adjacent words. Then make the catalog snapshot hydration-aware so a repeat search is
distinguishable from the first.

**Ours (aggravator, cheap):** Desktop ships the team-guide tools with no usage guidance. A short
instruction to search by a single distinctive keyword would sharply raise the match rate today,
without waiting on Core.
