# Handoff → wayland-core: MCP tools are unreachable via ToolSearch

**From:** Wayland Desktop / TVControl integration, 2026-08-04
**Requested for:** the current Core RC, not a later release — see "Why the RC" below.
**Assumes no prior context on Desktop or TVControl.**

---

## The ask, in one paragraph

In a Wayland Core chat session, an MCP server's tools appear to be unreachable by the model.
Core connects the server and logs its full tool count, but when the model calls `ToolSearch`
to discover those tools, it gets `No deferred tools matching "..." found.` Because deferred
tools are folded out of the outbound `tools[]` array, `ToolSearch` is the model's **only**
route to an MCP tool — so if it can't see them, the MCP server is effectively dead in chat.
We have one defect proven and one strongly suspected. **We are asking for two unit tests
first**, not a fix — the tests decide which defect is real before anyone writes code.

---

## Symptom, reproduced twice end to end

Real conversation, real model (`flux-pinned-claude-sonnet`), Wayland Core backend, an MCP
server (`tvcontrol`, 101 tools) connected and healthy, a live TradingView chart to act on.
Prompt: read the chart, then change the symbol.

**The chart never moved, in either run.** From the Desktop log:

```
13:12:43.625  [wcore] [mcp] Connected to 'tvcontrol': 101 tools, resources=false
13:14:08.627  [ToolSearch success] No deferred tools matching "tvcontrol TradingView chart" found.
13:14:12.593  [ToolSearch success] No deferred tools matching "TradingView" found.
13:14:12.593  [ToolSearch success] No deferred tools matching "chart symbol MCP" found.
```

The tools were connected **85 seconds before** the search executed, so this is not a race with
connection latency. We dumped the server's `tools/list` directly and confirmed **22 of its 101
tool descriptions contain the literal word "TradingView"** — so the second query had 22 valid
candidates and matched none.

---

## Defect 1 — PROVEN: `ToolSearch` matches the whole query as a single substring

`crates/wcore-tools/src/tool_search.rs:88-91`:

```rust
let name_l = def.name.to_lowercase();
let desc_l = def.description.to_lowercase();
if name_l.contains(&query_lower) || desc_l.contains(&query_lower) {
```

`query_lower` is the entire query string. So `"tvcontrol TradingView chart"` must appear
**verbatim** inside one tool's name or description. No real tool description contains a
model-authored natural-language phrase, so a model that searches the way models actually
search gets nothing back.

This one needs no investigation — it is a substring comparison, and it explains the first
failed query outright.

**Fix direction:** tokenize the query and match on terms rather than the whole string; rank
results (all-terms first, then any-term). Keep exact-name match as the strongest signal so
`ToolSearch("chart_get_state")` still behaves.

---

## Defect 2 — SUSPECTED, NOT PROVEN: the search snapshot is frozen before MCP connects

`crates/wcore-tools/src/tool_search.rs:18-21`, the struct's own doc comment:

```rust
pub struct ToolSearchTool {
    /// Snapshot of all tool definitions (taken at construction time).
    tool_defs: Vec<ToolDef>,
}
```

It is constructed once, at `crates/wcore-agent/src/bootstrap.rs:2240`. MCP servers connect
after session start.

If bootstrap runs before MCP connection, that `Vec<ToolDef>` never contains any MCP tool, for
the entire life of the session — no matter how long the model waits or how well it phrases the
query. That would explain why the **single-word** `"TradingView"` query matched none of 22
valid candidates, which Defect 1 alone does not explain.

**Note the apparent contradiction we cannot resolve from outside.**
`bootstrap.rs:249-260` documents the deferred-MCP limitations and states:

> _"Late tool REGISTRATION is fully supported; late skill/hook binding is not."_

Both can be true at once: the **registry** may accept late tools correctly while
`ToolSearchTool`'s independent copy does not. Someone who owns this code will know in minutes
what took us hours to guess at from the outside — which is why this is a handoff and not a
patch.

**We are explicitly not asserting this is the cause.** An earlier revision of our own analysis
confidently named a root cause that a four-model audit demolished. We are not repeating that.

---

## What we are asking for: two tests, before any fix

Both belong in `crates/wcore-tools`, which builds without the full Core tree
(`cargo test -p wcore-tools`).

**Test A — the decisive one.** Build a registry, construct `ToolSearchTool`, register a
deferred MCP-style tool _afterwards_, then search for it **by exact name**.

- If it is **not** found → Defect 2 is real. Fix: consult the live registry rather than a
  construction-time copy, or rebuild the snapshot when tools register.
- If it **is** found → Defect 2 is dead, Defect 1 is the whole story, and the fix is much
  smaller. Good outcome either way.

**Test B — regression guard for Defect 1.** A multi-word natural-language query against a tool
whose description contains those words must match. This is expected to fail today; it is the
guard that stops the substring behaviour coming back.

---

## Acceptance

- Test A settles Defect 2 one way or the other, in writing.
- Test B passes.
- End-to-end, the gate we will run on the Desktop side: fresh profile, MCP server connected,
  **one prompt in a fresh conversation causes the MCP tool to actually execute.** Nothing
  weaker counts — Desktop's MCP Library showed "101 tools" while the model saw zero, so a tool
  count is not evidence.

---

## Why the RC, and not after

If this lands in the current RC it ships with the Core already being built. If it waits, that
RC ships a Core in which **no MCP server is discoverable in a chat session** — and an MCP
server driving live TradingView charts is the centrepiece of the Master Class this is for.
Missing the RC means another Core release cycle for something already understood.

---

## Scope note — this is not TVControl-specific

TVControl is simply where we noticed. The mechanism is generic: MCP proxies stay deferred
(`crates/wcore-tools/src/registry.rs:268-269`), and `fold_deferred_into_catalog`
(`registry.rs:302-318`) removes every deferred def from the outbound `tools[]` array. So
`ToolSearch` is the sole discovery path for **every** MCP server, not just this one.

---

## Two secondary observations from the same runs

Lower priority, logged here so they are not lost. Neither is being asked for in this handoff.

1. **A turn that finds no tools never reports completion.** Core emitted
   `stream_end ... finish_reason: 'stop'` at 93s; the Desktop UI still showed the turn
   "running" 1145 seconds later. May be a Desktop-side issue rather than Core — untriaged.
2. **`W7: wcore-pricing catalog miss`** for `provider="openai" model="flux-pinned-claude-sonnet"`
   — a Flux-routed pinned model falls through to the ProviderCompat cost heuristic. Cosmetic
   for us; possibly of interest to whoever owns pricing.

---

## Reproduction, if Core wants to see it directly

1. `npm install -g @ferroxlabs/tvcontrol@2.2.1` (MIT, published, 101 tools over stdio).
2. Launch TradingView Desktop with `--remote-debugging-port=9222`
   (`scripts/launch_tv_debug_mac.sh 9222` in the package).
3. Confirm the server itself is healthy, independent of Core — it answers `tools/list` with
   101 tools from a bare environment.
4. Configure it as an stdio MCP server in a Wayland profile, start a fresh conversation, and
   ask the model to read the chart and change the symbol.

Evidence logs from our runs: `/tmp/wl-demo.log`, `/tmp/wl-demo2.log` (local to the Desktop
machine; can be attached on request).
