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

## One open question we cannot attribute yet — not filed as a defect

After the fixes above, Desktop reaches the point where MCP tools are published, connected, and
**discoverable by name**: `ToolSearch("aion")` returns `aion_create_team` and `aion_list_models` from
our `wayland-team-guide` server. The model then repeatedly calls `ToolSearch` for `aion_list_models`,
gets it back each time, and **never issues the actual call** — it loops on discovery instead of
invoking.

We do not yet know whether that is the model, our prompt, or something about how deferred tools are
surfaced for invocation on this engine. We are not claiming a Core defect. Flagging it because if
there is a known intended "load then call" step in the deferred-tool flow that a host must
participate in, we would rather be told than reverse-engineer it.

---

## Summary of asks

| id | ask | severity |
|---|---|---|
| **C-1** | Add the 7 missing events to the corpus and re-cut; assert `PRODUCER_EVENT_TYPES` == manifest events in the generator | **blocks every strict host** |
| **C-2** | Document the `--assistant` requirement as a breaking change; answer the two design questions | high |
| **C-3** | Fix or remove the passphrase branch of the plaintext refusal message | medium, high user cost |
| **C-4** | Triage `thought_signature` on non-first function calls | medium |

Happy to supply binaries, logs, or a repro harness for any of these.
