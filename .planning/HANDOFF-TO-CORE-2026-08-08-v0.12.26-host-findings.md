# Wayland Core v0.12.26 — findings from bringing the Desktop host onto it

**From:** Wayland Desktop
**Engine under test:** released `v0.12.26`, `--build-info` source `98ad1c2836a543385a7a4298f4b3e54a55867ac5`
**Method:** the packaged Desktop app driven through its real UI against the real engine, plus the
released binary driven directly over `--json-stream`. Everything below was observed by execution.
Source is cited only to name the cause of something already seen, never to assert behaviour on its own.

---

## Read this first: what was ours, and what is yours

Desktop could not talk to v0.12.26 at all. Four distinct causes. **The first and largest was ours**,
and it is fixed on our side — it is written up here only because the way it hid for months is a
contract-design problem worth your attention.

| # | cause | whose |
|---|---|---|
| 0 | Desktop pinned a contract corpus from a commit that never shipped | **ours** — fixed |
| 1 | The generated corpus under-declares the producer wire | **yours** — C-1 |
| 2 | `add_mcp_server` requires an assistant identity, undocumented | **yours (docs)** — C-2 |
| 3 | `backend = "plaintext"` refusal advertises a remedy that does not work | **yours** — C-3 |
| 4 | Gemini function calls fail on a missing `thought_signature` | **yours, probably** — C-4 |

Nothing here is a complaint about the engine's direction. C-1 is the one that matters: it will break
**any** host that does what the corpus tells hosts to do.

### Cause 0, ours, for context

Desktop pinned contract `1.0` / `wcore-desktop-contract-gen/1`, imported from Core commit
`d0aa0abc75af…` on branch `feat/887`. That commit **is not an ancestor of any `v0.12.*` tag** — so
our consumer had been validating against a corpus that never described a shipped engine.

It stayed invisible because **`v0.12.25` ships no contract corpus at all.** It emits no
`ready.contract`, our consumer takes its legacy branch, and none of the v1 machinery runs. `v0.12.26`
is the first released engine to advertise a descriptor, so it is the first that could ever have
caught this. We have re-pinned to `1.12` / `gen-13`, imported byte-for-byte from released 0.12.26.

**The design note:** a host cannot tell "the contract matched" from "the contract was never
checked", because a producer with no descriptor is indistinguishable from a producer whose
descriptor happens to be absent. If you ever ship an engine that *should* advertise a descriptor but
does not, every strict host silently downgrades to unvalidated. Worth a thought.

---

## C-1 — the generated corpus under-declares the producer wire  ⚠️ **highest impact**

`crates/wcore-protocol/src/contract/spec.rs` `PRODUCER_EVENT_TYPES` declares **59** producer events.
`contracts/desktop/v1/manifest.json`, generated from the same tree, declares **52**. The seven-event
difference:

```
capability_activation, compact_offload, mid_flight_monitor_decision,
provider_attempt, provider_failure, provider_retry, workspace_policy
```

All seven have emitter-side references in `wcore-agent` / `wcore-cli`, so none is a dead declaration.

**Two of them we watched arrive.** Driving the released binary directly with a one-tool stdio MCP
server, the event sequence on an ordinary session is:

```
ready, execution_policy, workspace_policy, capability_activation, mcp_ready
```

`workspace_policy` arrives **immediately after `ready`, on every session, carrying no `critical`
flag.** A host that validates events against the manifest — which is what the corpus exists for —
therefore fails closed on the second frame of every session it will ever open. Ours did:

```
wcore Desktop contract rejected ready: unknown Core event workspace_policy is not explicitly noncritical
```

**Why your gates stay green:** your reference host observer (`contract/observation.rs`) accepts
events off `PRODUCER_EVENT_TYPES`, not off the manifest. So the producer and the reference consumer
agree with each other while the shipped artifact disagrees with both. The corpus self-check cannot
see it.

**Ask:** add the seven to `EVENT_SPECS` with fixtures and re-cut the corpus. Separately, consider a
generator assertion that `PRODUCER_EVENT_TYPES` and the manifest's event list are equal — that one
check would have caught this at build time.

**What we did meanwhile:** Desktop drops exactly those seven, sourced from `PRODUCER_EVENT_TYPES` at
`98ad1c28`, under their own disposition. A frame explicitly marked `critical: true` still fails
closed, and `workspace_policy` / `capability_activation` are logged rather than dropped in silence
because they carry security posture we do not model yet. Those entries come out the moment the
corpus declares them.

---

## C-2 — `add_mcp_server` now requires an assistant identity, and this is not in the notes

`scope_host_runtime_mcp` (`crates/wcore-cli/src/main.rs`) scopes every wire-added MCP server to the
active assistant and refuses when the host supplied none:

```
mcp_failed { name: 'wayland-team-guide',
             reason: 'active assistant identity is required for a runtime MCP declaration' }
```

**Credit where due: your reporting here is correct.** You emit a well-formed `mcp_failed` naming the
server and the exact reason. Desktop received it and logged it; that we did not put it in front of
the user was our bug, and it is fixed. No complaint about the mechanism.

The problem is that this is a **breaking change to the host contract on the 0.12.25 → 0.12.26 line
and it is not in the release notes.** A host that worked yesterday gets every runtime MCP
declaration refused today, and the visible symptom is not an error — it is a session with zero
tools, which reads as "MCP is broken" rather than "you are missing a flag."

We now pass `--assistant` unconditionally, so we are unblocked.

**Two questions, and they change what we build next:**

1. **Is mandatory assistant scoping the intended long-term contract for host-provided runtime MCP?**
   If it is, it materially changes the `--mcp-server` / `--no-mcp-servers` request we sent earlier: a
   host-supplied *per-chat* assistant identity would already give exact per-chat MCP narrowing,
   which is the whole thing that ask was for. We would much rather adopt the mechanism you intend
   than run a parallel one. We currently pass a single constant host identity
   (`wayland-desktop`) precisely because we do not want to commit to per-chat semantics before you
   answer this.
2. **Should `only_for_assistant` remain restrict-only?** An unmarked config server is still always
   injected, so assistant scoping alone cannot express an exact allowlist. That asymmetry is why we
   still carry a launch-local profile.

---

## C-3 — the plaintext-credentials refusal sends users to a dead end

Verified against the released binary, with the same real config file:

| engine | `backend = "plaintext"` + `[session] enabled = true` |
|---|---|
| **v0.12.25** | **starts** |
| **v0.12.26** | **refuses** |

The refusal itself is defensible and the message is otherwise good — a plaintext store genuinely
cannot hold the key durable session recovery needs. The defect is the remedy it advertises:

> Unlock an encrypted vault by setting `WAYLAND_VAULT_PASSPHRASE_FD` (a passphrase file descriptor —
> preferred) or `WAYLAND_VAULT_PASSPHRASE`, or set `[storage.credentials] backend = "keyring"`, or
> turn durable sessions off with `[session] enabled = false`

Full matrix, released binary:

| config | result |
|---|---|
| `plaintext` + sessions on | **refuses** |
| `plaintext` + sessions on + **`WAYLAND_VAULT_PASSPHRASE`** | **still refuses** |
| `plaintext` + sessions off | starts |
| `keyring` + sessions on | starts |
| no `[storage.credentials]` block + sessions on | starts |

**Row 2 is the bug.** The first remedy in your own error text does not work while an explicit
`backend = "plaintext"` is configured — the explicit backend wins over the passphrase. The other
three remedies all work.

**Ask:** either let the passphrase override an explicit plaintext backend, or drop that branch from
the message. As written it is the first thing a user tries and the one that cannot succeed, on the
one failure they have no way to diagnose themselves.

Related: your open issue **#183** (plaintext-to-vault migration entrypoint). Until that lands there
is no in-place path off plaintext without stranding existing secrets, which makes the wrong advice
more costly than it looks.

---

## C-4 — Gemini function calls fail on a missing `thought_signature`

Observed live, Wayland Core driving `gemini-3.6-flash` with tools:

```
"message": "Function call is missing a thought_signature in functionCall parts. This is required for
tools to work correctly, and missing thought_signature may lead to degraded model performance.
Additional data, function call `default_api:ToolSearch`, position 2.",
"status": "INVALID_ARGUMENT"
```

The turn ended `finish_reason: 'error'` after 108s with no usable output. Reproduced once; we did not
chase it further because it was not the blocker we were on.

Reporting it because the shape is suggestive rather than obviously broken: `crates/wcore-providers/src/gemini.rs`
already has `build_contents_round_trips_thought_signature_on_function_call` and
`parse_sse_chunk_captures_thought_signature_on_function_call`, so the round-trip is implemented and
tested. Yet **"position 2"** says the *first* function call carried its signature and a later one did
not. That points at a specific path — a replayed, synthesized, or post-approval call — rather than
the feature being absent.

**Ask:** triage whether the round-trip survives every path that can produce a `functionCall` part,
particularly deferred-tool (`ToolSearch`) flows and calls reconstructed after a host approval
round-trip. We can supply a fuller repro if useful.

---

## C-5 — `ToolSearch` matching makes MCP tools unreachable for every model  ⚠️ **highest impact**

**This supersedes the "open question" we flagged in the previous draft.** We said we could not yet
attribute the discover-but-never-invoke loop and would not claim a Core defect. We can now, and it
is reproducible in one command.

`ToolSearch` matches with an **ALL-tokens literal substring** test —
`crates/wcore-tools/src/tool_search.rs:98` and `:120-123`:

```rust
let tokens: Vec<&str> = query_lower.split_whitespace().collect();
if tokens.iter().all(|t| name_l.contains(t) || desc_l.contains(t))
```

Back to back in ONE session, against the SAME tool, on the released binary:

```
ToolSearch("probe")                                   -> MATCH, full schema
ToolSearch("wld_probe_secret tool schema parameters") -> "No deferred tools matching ... found."
```

The failing query **contains the tool's exact name**. It fails because `tool`, `schema` and
`parameters` are not substrings of the name or description. Two consequences, both observed live:

1. **A more descriptive query is strictly less likely to match** — every extra word is another
   `all()` conjunct. So when the model gets no match and rephrases more fully, it diverges.
2. **Punctuation is part of the token.** `split_whitespace()` does not strip it, so a real observed
   query, `Tool named aion_list_models, load full input schema`, tokenises `aion_list_models,`
   with the comma, and the exact tool name never matches.

**Not model-specific.** `~/Library/Logs/Wayland/2026-08-05.log` contains a session with **28 tool
calls, all of them `ToolSearch`, none to any other tool, 19 returning "No deferred tools matching"**,
on **`claude-sonnet-5`**. We reproduced it again on `gpt-5.6-sol` against a connected server the
engine had already logged as `Connected to 'wayland-team-guide': 2 tools`.

**Why the 0.12.26 change did not help.** `tool_search.rs` differs from v0.12.25 by exactly two text
edits: a longer description and a `"status": "LOADED — ..."` string on each match. In the dominant
failure mode there is **no match to attach a status to**. Your own comment at `tool_search.rs:126-141`
describes the measured loop ("ten identical searches, no call ever attempted ... Every MCP tool was
unreachable this way") and says the real fix is making the snapshot hydration-aware — that snapshot
issue (`registry.rs:206-216` vs `engine.rs:15356-15367`) is real but **secondary** to matching.

**Ask:** strip punctuation when tokenising, and rank by matching-token count instead of requiring
`all()`. An exact tool-name match must never be defeated by adjacent descriptive words. Then make
the catalog snapshot hydration-aware so a repeat search is distinguishable from the first.

### C-5b — the second half, and it is the one that still blocks us

**Update after mitigating the matcher host-side.** We injected an instruction telling the model to
search with a single distinctive keyword. Measured, same profile and connector, before/after:
**ToolSearch calls 28 → 2..5, "No deferred tools matching" 19 → 0, turn 136s → 16s.** The matching
failure is gone.

**The tool still never becomes callable in a real host configuration.** In the packaged app, with
the team-guide server connected (`Connected to 'wayland-team-guide': 2 tools`), five consecutive
`ToolSearch` calls all MATCHED — and the model never issued the call. It then reached for the shell
and printed its own diagnosis:

```
Execute: printf 'Tool schema did not load into the callable tool registry.\n'
```

That is the model telling you, unprompted, that a matched ToolSearch did not admit the tool to its
callable set. It matches your comment at `tool_search.rs:126-141` exactly — the construction-time
snapshot in `registry.rs:206-216` is never rebuilt on hydration, while hydration state lives in
`AgentEngine::hydrated_tool_names` (`engine.rs:15356-15367`), with no write path between them.

**The discriminator, and it is the useful part:** driving the released binary DIRECTLY with a single
one-tool MCP server, the same flow works — search matches, tool is called, body executes. It fails
only in the app's fuller configuration (many builtins plus MCP, cold deferral, catalog folding). So
this is not "deferred tools never work"; it is something about admission at realistic tool counts.
`engine.rs:12266` (the `ToolSearch` arm) has no branch coverage, and the eval scenarios route around
it — `wcore-eval-scenarios/src/mcp_scenarios.rs:44-49` sets `deferred = false`, so the suite never
exercises the path that fails here.

**Ask, in priority order:** (1) make the catalog snapshot hydration-aware so a matched tool is
genuinely callable and a repeat search is distinguishable from the first; (2) add an eval scenario
with `deferred = true` at a realistic tool count that asserts INVOCATION, not just discovery.

**To be clear about what is NOT broken:** in a minimal configuration, once a search matches,
everything works. We proved the
full chain on the released binary — discovery, invocation, tool body execution (verified by an
independent witness file the tool itself writes), and the result reaching the reply — on both a
config-declared server and a runtime `add_mcp_server`, with `deferred` at its default, on Flux and
Gemini models. The deferred-tool design is sound. There is no host-side "load then call" step for us
to adopt; we asked, and the answer is that there isn't one.

---

## Summary of asks

| id | ask | severity |
|---|---|---|
| **C-5** | Fix `ToolSearch` matching: strip punctuation, rank by token count instead of `all()`; then make the catalog snapshot hydration-aware | **blocks every MCP tool, every model** |
| **C-1** | Add the 7 missing events to the corpus and re-cut; assert `PRODUCER_EVENT_TYPES` == manifest events in the generator | **blocks every strict host** |
| **C-2** | Document the `--assistant` requirement as a breaking change; answer the two design questions | high |
| **C-3** | Fix or remove the passphrase branch of the plaintext refusal message | medium, high user cost |
| **C-4** | Triage `thought_signature` on non-first function calls | medium |

Happy to supply binaries, logs, or a repro harness for any of these.
