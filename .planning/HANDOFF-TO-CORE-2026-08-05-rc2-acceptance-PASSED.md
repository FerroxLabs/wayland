# Desktop → Core — rc.2 acceptance PASSED, plus four defects found getting there

**2026-08-05.** Reply to `HANDOFF-TO-DESKTOP-2026-08-05-rc2-and-mcp.md`.

---

## 1. Headline: your acceptance criterion is cleared

The bar neither lane had met — *"one prompt in a fresh conversation causes the MCP
tool to actually execute"* — is met on the rc.2 binary.

```
[mcp] Connected to 'tvcontrol': 101 tools, resources=false
> ToolSearch({"query":"chart"})
  └> [{ "name": "tv_health_check",
        "description": "Check CDP, TradingView market-data connection, ...",
        "status": "LOADED — this tool is now callable by name. Call it
                   directly on your next step; searching for it again
                   returns this same result and makes no progress." }]
> chart_get_state({})
  └> "Your chart is currently on NASDAQ:GOOGL, daily (1D) timeframe."
```

Then, separately, the write path — the exact thing that failed in the original
report, where *"the chart never moved"*:

```
> chart_set_symbol({"symbol":"NASDAQ:TSLA"})
  └> "Done — the chart is now set to NASDAQ:TSLA and ready."
```

**Independently verified out-of-band** (not from the model's own claim): a direct
CDP read returned `NASDAQ:TSLA`. The chart physically moved. The pre-recorded
baseline `NASDAQ:GOOGL / 1D` also matched what the model reported, so the read was
genuine as well.

Your callability signal is visibly doing the work in that `status` line. **Your
diagnosis was right and ours was wrong.** Defect 2 was a red herring; the absent
callability signal was the better explanation, as you said.

### Harness

- `wayland-core 0.12.26` from `npm install -g @ferroxlabs/wayland-core@next`
- isolated `WAYLAND_HOME`, `memory.enabled = false`
- `@ferroxlabs/tvcontrol@2.2.2` over stdio, spawned via `npx -y`
- `flux-pinned-claude-sonnet` through `flux-router`, burner key
- `--auto-approve` (tier-0; the OS sandbox stays on — no `--dangerously-*` used)

---

## 2. Your credential blocker — reproduced, then diagnosed

You wrote that three routes all refused with *"No API key found"* and that it was
*"either a harness misconfiguration or a real defect, and we are not asserting
which."*

**It is a real defect, and it is a consequence of your own 0.12.26 breaking change.**

We reproduced it exactly: with `[providers.flux-router] api_key = "sk-flux-…"`
present in `$WAYLAND_HOME/config.toml`, the run still died with:

```
Error: No API key found. Add one with `wayland-core auth add <provider> <key>` …
```

The announcement's breaking-changes section says the plaintext credential fallback
is removed. That is exactly what bites here: a key sitting in `config.toml` is no
longer read, and on a host with no writable keyring and a locked vault there is no
supported place to put it. The warning even says so:

```
warning: no secure credential backend is available here — the OS keyring is not
writable and the encrypted vault is locked … saving a new credential will be
REFUSED rather than written in cleartext.
```

**Workaround that works:** pass `-k/--api-key` on the command line. That is the only
route we found on a keyless host. Worth documenting explicitly, because the error
message recommends `auth add` first, which cannot succeed there.

---

## 3. Four defects found while getting to the pass

### D-1 — `auth add` rejects `flux-router` (blocks the documented path)

```
$ wayland-core auth add flux <key>
wayland-core auth: unknown provider 'flux'. Known providers: anthropic, openai,
openrouter, gemini, groq, xai, mistral, deepseek, fireworks, together, cerebras,
perplexity, moonshot, sakana. Or pass `autodetect` to infer it from the key.

$ wayland-core auth add autodetect <key>
wayland-core auth: could not autodetect the provider — this key shape is shared
by several providers.
```

But `flux-router` is a first-class provider everywhere else:

| fact | location |
|---|---|
| `ProviderType::FluxRouter => "flux-router"` | `config.rs:1807` |
| `"flux-router" \| "flux" => Some(ProviderType::FluxRouter)` | `config.rs:2969` |
| config key `providers.flux-router.api_key` | `config.rs:3559` |
| listed in the provider help string | `config.rs:3005` |
| default base URL reachable with empty `base_url` | `egress/defaults.rs:192-206` |

So the `auth` CLI's allowlist is out of sync with `ProviderType`. Given Flux is the
routing layer, this is the provider users are most likely to add.

### D-2 — project-level `[mcp.servers.*]` never connects; global does

**This is the one worth prioritising.** It is the difference between "MCP is broken"
and "MCP works", and it is what produced our false negative.

With this in `<project>/.wayland/config.toml`:

```toml
[mcp.servers.tvcontrol]
transport = "stdio"
command = "npx"
args = ["-y", "@ferroxlabs/tvcontrol@2.2.2"]
```

…there was **no `[mcp]` line in the output at all**, no connection, and ToolSearch
returned `No deferred tools matching "chart" found.` — reproducing the original
symptom perfectly, including the single-word miss.

Moving that block **verbatim** to `$WAYLAND_HOME/config.toml` connected immediately:
`[mcp] Connected to 'tvcontrol': 101 tools`.

Nothing else changed between the two runs.

That looks like it contradicts the merge at `config.rs:4825-4826`:

```rust
let mut mcp_servers = global.mcp.servers;
mcp_servers.extend(project.mcp.servers);
```

We did not chase it further — the file may not be the project config Core resolves
(`--project-dir` mentions `.wayland-core.toml`, while `wayland-core init` scaffolds
`.wayland/config.toml`, and those are two different names). If the scaffolded file
is not the one the MCP merge reads, that is itself the bug: `init` writes a config
whose `[mcp.servers.*]` is silently ignored.

**Worth a test:** declare an MCP server in the file `init` scaffolds, assert it
connects.

### D-3 — `-p` without `-m` sends an empty model

```
$ wayland-core -p flux-router -k <key> "…"
error: API error 400: Flux Router error: You passed in model=.
       There are no healthy deployments for this model
```

The provider flag drops the configured `[default] model` instead of keeping it.
Adding `-m` fixes it. Minor, but it makes `-p` look broken.

### D-4 — AND-tokenization has a real usability edge (working as designed, worth knowing)

The tokenizer requires **all** terms to match. So the model's natural first query:

```
ToolSearch({"query":"chart_get_state TradingView chart symbol timeframe"})
  └> No deferred tools matching "…" found.
```

…misses, because no single tool description contains every one of those words. The
model recovered on its own by retrying with `"chart"`, so this is not a blocker —
but a model that gives up after one miss would conclude no tools exist, which is
what ours did in the earlier failing run. Consider OR-with-ranking as a fallback
when AND returns empty, so a long query degrades instead of failing.

---

## 4. Corrections we owe you

1. **We were wrong that Test A did not exist.** We searched `tool_search.rs`, found
   8 tests, none named Test A, and reported it missing. It is at `registry.rs:1230`
   and is in the shipping rc.2 tag. Your method note is fair and we have adopted it.
2. **We verified your claims rather than taking them.** Test A is in the rc.2 tag;
   `tool_proxy.rs` registers at `:274` and refreshes at `:292`, guarded on having
   registered something. Your call-site table holds. Defect 2 is properly refuted.
3. Your Test A's sentinel detail — asserting on `starts_with("No deferred tools
   matching")` rather than absence of the tool name, because the miss message echoes
   the query back — is a genuine trap we would have fallen into. Adopted.

---

## 5. What we still owe you, and what we need

**Owed:** the Desktop-side end-to-end run, with the engine bundled rather than
invoked standalone. **We cannot do it yet**, for a reason on our side:

```
$ node scripts/stage-wcore-bump.mjs v0.12.26-rc.2 --write
stage-wcore-bump: invalid release tag "v0.12.26-rc.2";
expected an exact vMAJOR.MINOR.PATCH tag
```

Desktop's engine-bump tooling refuses pre-release tags, so we cannot bundle a Core
RC through the sanctioned path. We deliberately did **not** hand-swap the binary:
`resources/bundled-wayland-core/<arch>/manifest.json` carries a signed publisher
attestation with the archive and binary SHA-256, and leaving that manifest asserting
v0.12.25 over a different binary would be forging an attestation.

**So the request is simply: tell us when 0.12.26 goes stable**, and we will bundle
it and re-run the whole gate inside the packaged Desktop app. If you would rather we
test the RC bundled, we would need to teach `stage-wcore-bump.mjs` to accept
pre-release tags — happy to, but that is a Desktop change we would not ship to users.

**Not needed any more:** the wire capture of the outbound `tools` array. The turn
executed, so the array was populated. If D-2 turns out to be the whole story, that
also explains the original empty-tools report.

---

## 6. Scoreboard, updated

| claim | status |
|---|---|
| Defect 1 — substring match | FIXED (your Test B in tree) |
| Defect 2 — frozen snapshot | REFUTED (your Test A in tree, verified by us) |
| Callability signal | FIXED — **observed working live** |
| MCP connects + tool registers | PROVEN on rc.2 |
| **Acceptance: prompt → MCP tool executes** | **PASSED — read AND write, chart physically moved** |
| Credential routing on a keyless host | **DEFECT — plaintext fallback removal, `-k` is the only route** |
| `auth add flux-router` | **DEFECT (D-1)** |
| project-scope `[mcp.servers.*]` | **DEFECT (D-2) — highest priority** |
| `-p` without `-m` | DEFECT (D-3) |
| Desktop bundling of an RC | blocked on our side, not yours |

W-0 is closed from our end. TVControl 2.2.2 is published and is the version to test
against — 2.2.1 could not be launched by `npx` at all (its `bin` pointed at the CLI,
not the MCP server), which is a separate bug we fixed and shipped today.
