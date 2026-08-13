# Handoff to Wayland Core — MCP hydration corruption, plus two blockers found live

**Severity: ships broken.** With `compaction = "full"`, a model driving a large MCP
server cannot learn the name of a single one of its tools, and Core's own
hydration bookkeeping silently records zero. Verified live on 0.13.0 against a
101-tool server (TVControl): the server connects, a tool executes, and the
catalogue stays unreachable.

**[X]** = proven by executing something. Everything else says what it is.

---

## 0. ⚠️ Your checkout is not the shipping tree

Everything here is anchored to **`116f2d21`** (and `b06232a7`, the
`lane/v0130-build2` head the 0.13.0 binary was built from). `~/dev/waylandcore`
sits on **`frontier/m0`**, which has diverged enormously:

| file | `frontier/m0` | shipping lane |
|---|---|---|
| `crates/wcore-tools/src/tool_search.rs` | **209 lines**, no `MAX_MATCHES` | **1457 lines**, `MAX_MATCHES = 10` at :190 |
| `crates/wcore-agent/src/orchestration/mod.rs` | 2214 lines, `compact_output` ~:958 | `compact_output` at :2517 |

Not academic: one of our four audit legs ran on `frontier/m0` and concluded
`MAX_MATCHES` "does not exist, delete that finding". On the tree you ship it
exists and caps ToolSearch at ten hits [X]. Audit against the release lane, and
anchor on symbols, never line numbers.

---

## 1. Symptom

`ToolSearch` is the hydration path for deferred tools — its result is the only
channel by which a deferred tool's name and schema reach the model. On the wire
[X] (`~/Library/Logs/Wayland-Dev/2026-08-13.log`; grep control `ToolSearch`=59,
`wcore`=41):

```
[WCoreManager] info: [ToolSearch success] [
  {
[... 37 similar lines]
  }
]
```

In the app [X] the model reports *"there is no `chart_get_state` tool ... I can't
fabricate a symbol/timeframe without actually calling it"* and correctly refuses
to guess. `tv_health_check` — hot, not deferred — executes fine and returns real
chart data, so this is **not** a connection or registration failure.

---

## 2. Root cause

### 2a. The fold anchors on a 3-byte structural line
`crates/wcore-compact/src/fold.rs`:

```rust
let prefix = common_prefix_len(a, b);
let min_len = a.len().min(b.len());
prefix as f64 / min_len as f64 >= MIN_PREFIX_RATIO   // 0.5
```

`fold.rs:32-35` compares every candidate against the **group head**, not its
predecessor. The group head of a pretty-printed JSON body is `  {` — three bytes.
Any line indented two spaces scores 2/3 = 0.667, so the entire array body joins
one group and only the outer `[` / `]` escape [X]:

```
similar  prefix=2 min_len=3   '  {'  vs  '    "name": "chart_get_state",'
similar  prefix=2 min_len=3   '  {'  vs  '  },'
NOT      prefix=5 min_len=30  '    "name": ...'  vs  '    "description": ...'
```

The content lines are not similar to each other. **The `  {` line is the whole
bug.** Measured on a 14-tool catalogue: **72 lines → 5 lines, 0 of 14 names
survive** [X]. Field content is irrelevant — every pretty-printed JSON array of
objects folds.

### 2b. It is state corruption, not a display problem
`engine.rs:13748` iterates the **post-compaction** `ToolResult`; `engine.rs:13828`
feeds that string to `record_hydrated_tools`, which at `engine.rs:17015-17020`
bails unless the whole string parses as a JSON array — and returns **silently**:

```rust
fn record_hydrated_tools(&mut self, content: &str) {
    let Ok(serde_json::Value::Array(matches)) =
        serde_json::from_str::<serde_json::Value>(content)
    else {
        return;                      // no log, no metric
    };
```

So folding does not merely hide names. It zeroes `hydrated_tool_names`, the
force-admission pass at `engine.rs:16926-16957` never puts the tool into the
outbound `tools[]`, and `publish_hydrated_tools` never updates the set
`ToolSearchTool` reads at `tool_search.rs:476-486` — so every repeat search
returns a byte-identical body. That is the documented ten-identical-searches loop
(`tool_search.rs:454-464`) arrived at from a different direction. Measured:
`hydrated = 0` [X].

**That silent `else` is why this survived to a live session.** Any fix should be
justified against `record_hydrated_tools`, not against readability.

### 2c. Call path
`orchestration/mod.rs:2516 truncate_result` → `:2517 compact_output` →
`wcore-compact/src/lib.rs:26-29` `Full` ⇒ `sanitize` → `fold_repeated_lines` →
`compact_json`. `:2517` is the **only** production call site of `compact_output`
in the tree. `CompactionLevel` defaults to `Safe`; the affected deployment sets
`compaction = "full"`. **Desktop never sets it** — verified, no compaction
setting anywhere in Desktop's source.

At `Safe`, `sanitize` is a byte-exact no-op on a ToolSearch body [X] (serde
escapes ESC/CR as ``/`\r`, so `strip_ansi`/`collapse_cr_lines` never see a
raw control byte). **The defect is `Full`-only.**

---

## 3. Proposed fix

Ordered by what actually unblocks a 101-tool server.

### Fix A — the fold must not anchor on short lines
```rust
-    let min_len = a.len().min(b.len());
-    prefix as f64 / min_len as f64 >= MIN_PREFIX_RATIO
+    // Normalising by the SHORTER line makes tiny structural lines promiscuous:
+    // `  {` shares its indent with every field beneath it (2/3 = 0.67), so a
+    // pretty-printed JSON object folds away entirely. Also count chars on both
+    // sides — `common_prefix_len` counts chars while `len()` is bytes, so the
+    // ratio is meaningless for non-Latin output (see Fix G).
+    let span = a.chars().count().max(b.chars().count());
+    prefix as f64 / span as f64 >= MIN_PREFIX_RATIO
```

Controlled measurement [X] — kills the damage, preserves every case the fold
exists for:

| input | current | after Fix A |
|---|---|---|
| JSON tool catalogue (must NOT fold) | 72 → 5, **0/14 names** | 72 → 72, **14/14** |
| identical warnings (MUST fold) | 10 → 3 | 10 → 3 |
| progress bar (MUST fold) | 14 → 8 | 14 → 8 |

**Honest cost, stated up front.** Our fourth audit leg compiled the pipeline and
measured a **530× byte increase** on a 27KB catalogue after stopping the fold;
we reproduce the same effect (2376 → 34 bytes today, 2376 after) [X]. That is
real, and you should weigh it — but the 34-byte baseline contains **zero tool
names**. It is not compression, it is deletion, and `compact_json` recovers
nothing on this shape (`json.rs:70-72` returns the input unchanged when the
compacted form is not shorter). The tokens are the payload. If you want the
payload bounded, bound it by **match count**, not by mangling bytes — see Fix C.

### Fix B — the hydration path must be lossless, and the exemption is on the wrong line
Put the exemption **above** `truncate_result` (`:2516`), not below it, and use the
lossless level rather than a blanket bypass:

```rust
-let content = truncate_result(&error_content, max_size);
-let content = wcore_compact::compact_output(&content, compaction_level);
+let is_hydration_path = name == wcore_tools::TOOL_SEARCH_NAME;
+let content = if is_hydration_path {
+    error_content                       // bounded by Fix C, never byte-cut
+} else {
+    truncate_result(&error_content, max_size)
+};
+// `Safe`, not a bypass: ANSI stripping still applies, and any future LOSSLESS
+// compaction stage is still picked up. Only `Full` is lossy.
+let level = if is_hydration_path { CompactionLevel::Safe } else { compaction_level };
+let content = wcore_compact::compact_output(&content, level);
```

Two things this fixes that the obvious version does not: a bypass placed at
`:2517` still lets `truncate_result` middle-cut a >50KB body into unparseable
JSON, and a full bypass would permanently exempt ToolSearch from ANSI stripping
at every level.

`name` is in scope, destructured at `mod.rs:1416-1421` and already used at
`:2495` — verified, compiles [X]. Add `pub const TOOL_SEARCH_NAME` while you are
here: the literal is currently hardcoded at `tool_search.rs:265`,
`registry.rs:265/535/572/583` and `engine.rs:13827`, so a rename silently
un-fixes this in five places.

### Fix C — bound ToolSearch by match count, never by byte-cutting
`ToolSearchTool` does not override `max_result_size()`, so it inherits the
50 000-char default (`wcore-tools/src/lib.rs:516-518`) [X], and `truncate_result`
(`mod.rs:3501-3526`) cuts middle-out. Measured on a 10-match catalogue with real
MCP schemas (63,182 bytes): post-truncation the body no longer parses,
`record_hydrated_tools` records **zero**, and the outcome is byte-identical with
or without a JSON-aware fold guard [X].

Give `ToolSearchTool` its own budget and **drop whole matches to fit**, so the
array is always complete and parseable. Say so in the body
(`"truncated_matches": N`) rather than silently.

### Fix D — the enumeration ceiling
`MAX_MATCHES = 10` (`tool_search.rs:190`, applied at `:443`) [X]. Ten hits per
query cannot enumerate a 101-tool server; combined with
`render_deferred_catalog`'s `max_chars` bound (`registry.rs:604-628`) a model can
be shown "+92 more not listed" with no mechanism to reach them. Wants a higher
cap for exact-prefix or server-scoped queries, or pagination. (Absent on
`frontier/m0` — see §0.)

### Fix E — stop failing silently
Add to the `else` arm at `engine.rs:17018`:
```rust
tracing::warn!(target: "wcore_agent::engine",
    "ToolSearch result did not parse as a JSON array; hydration not recorded");
```
One byte of damage anywhere in a 50KB body currently zeroes hydration for all ten
tools with no log, no metric, no error.

### Fix F — `compact_json` emits invalid JSON for exotic keys (independent bug)
`json.rs:38` interpolates the map key raw:
```rust
format!("{indent}\"{k}\": {}", ...)
```
A property named `say "hi"` comes out as `"say "hi"":` — unparseable [X]. Use
`serde_json::to_string(k)`. Pre-existing, but it lands directly on the hydration
path once JSON stops being folded.

### Fix G — `fold.rs` mixes chars and bytes (independent bug)
`common_prefix_len` counts **chars**; `min_len` is `a.len()`, i.e. **bytes**.
Six byte-identical CJK lines do **not** fold (9/27 = 0.33) while six identical
ASCII lines do [X]. Folded into Fix A above.

### Regression test — assert parseability and hydration, not `contains`
`out.contains(name)` passes on mangled, unparseable JSON, so it would not catch
Fix F. Assert what the pipeline actually needs:

```rust
let out = compact_output(&catalogue, CompactionLevel::Full);
assert!(serde_json::from_str::<serde_json::Value>(&out).is_ok());
assert_eq!(record_hydrated_tools_names(&out), names);
```

Keep a `wcore-compact` unit test with a **negative control** (10 identical lines
must still fold to `[... 8 identical lines]`, or the fix can be reverted to
"never fold anything" and stay green), but the load-bearing test belongs in
`wcore-agent` next to `hydrate_via_tool_search`: drive a real ToolSearch dispatch
at `compaction = "full"` and assert `hydrated_tool_names == the returned names`,
at both 5 matches and >50KB. The bug is a pipeline-ordering bug; no unit test of
one stage can see it.

**Mutant check [X]:** the unpatched pipeline yields
`[\n  {\n[... N similar lines]\n  }\n]` on the test input, 0 names, `hydrated=0`.
The test is not vacuous — confirmed independently by two legs.

---

## 4. Cross-audit — four legs, and they changed the fix twice

- **Internal reviewer — FIX-FIRST, and the strongest leg.** Compiled verbatim
  copies of `fold.rs` / `json.rs` / `sanitize.rs` / `truncate_result` /
  `record_hydrated_tools` into a scratch crate and measured. Produced the
  530× number, the truncation-defeats-the-guard proof, the `compact_json` key
  escaping bug, the chars-vs-bytes bug, and the full state-corruption trace
  through force-admission. It killed our second draft.
- **Kimi K3 — FIX-FIRST.** Found `record_hydrated_tools` independently, and the
  revision divergence in §0. Reproduced the fold on the test input and confirmed
  the mutant check. Identified the `  {` anchor mechanism before we did. One
  finding refuted: it reported `MAX_MATCHES` as non-existent, which is true of
  `frontier/m0` and false of the shipping lane.
- **Gemini 3.1 Pro — FIX-FIRST.** Killed our *first* draft: `truncate_result`
  runs first so sliced JSON fails a parse-guard and folds anyway; NDJSON never
  parses; `from_str::<Value>` builds a whole DOM just to test syntax
  (`IgnoredAny` is the cheap form). Elevated `MAX_MATCHES` from footnote to
  blocker.
- **Codex 5.6 Sol.** Independently flagged the sanitize-ordering and the
  NDJSON / fenced / prefixed-JSON gaps. Its specific CRLF claim is **refuted**:
  `collapse_cr_lines` already strips the terminator before collapsing, and at
  `Safe` sanitize is a byte-exact no-op on a ToolSearch body.

Draft 1 was "parse the text, skip the fold if it's JSON" — defeated by truncation
and NDJSON. Draft 2 was "fix the similarity metric" — correct but blunt, and it
still sat below `truncate_result`. What is above is draft 3.

**Known open disagreement:** Fix A stops `Full` from compacting *any* JSON, not
just ToolSearch bodies — a real blast radius across every JSON-returning tool
(`data_get_ohlcv`, `kubectl`, every MCP proxy). We think that is correct because
the "saving" was destroying data, and Fix C is the honest way to bound size. If
you disagree, the alternative the internal leg proposed is **fold-then-verify**:
fold, and if the input parsed as JSON but the output no longer round-trips, keep
the unfolded form. Same outcome for catalogues, narrower blast radius, more code.
Your call — you own the token budget.

---

## 4b. Two further 0.13.0 defects, found driving the real product

Both surfaced while testing the Master Class flow end to end. Independent of the
fold; filing here because they are in the same engine.

### 4b-1. 🔴 The Bash sandbox has no DNS — this blocks a whole class of skill
```
$ curl -sS -m 12 https://query1.finance.yahoo.com/v8/finance/chart/AAPL
curl: (6) Could not resolve host: query1.finance.yahoo.com
exit=6
```
Run through the agent's own Bash tool on 0.13.0 [X]. Node fetches behave the
same: our market-open-report skill sat for **10 minutes** on 74 symbols and
cached zero, because each fetch fails DNS and the retry/backoff loop keeps
going.

This makes any data-fetching skill impossible inside the agent. Ours reads daily
prices from Yahoo — no key, no auth, one host. Two things would help:

1. **A host allowlist for outbound HTTPS**, per workspace or per skill, so a
   skill can declare `query1.finance.yahoo.com` and nothing else.
2. Failing that, **fail fast and say so**. A DNS-blocked run currently produces a
   complete, well-formed, entirely empty report and exits 0. The tool result
   should name the sandbox as the cause the way the filesystem denial already
   does ("⚠ The OS sandbox — not a broken machine and not a missing tool …" is
   an excellent message; network has no equivalent).

Related: `truncate_result`-style silent success. A skill that cannot reach the
network should not look like a skill that found nothing.

### 4b-2. 🔴 `stream_end` before `stream_start`, reproduced twice
```
Wayland Core protocol safety check failed:
turn event stream_end arrived before stream_start
```
Two consecutive turns in the same conversation, on 0.13.0 [X]. Desktop fails
closed, correctly — but the turn is lost. Both turns were ordinary
single-Bash-tool requests, nothing exotic. We have not isolated a minimal repro;
flagging the ordering violation itself since Core owns turn framing.

### 4b-3. 🟡 Filesystem denials sometimes arrive with empty stderr
Most sandbox refusals produce the excellent explanatory message above. But four
Bash calls in one turn returned `Exit code: 1` with **both stdout and stderr
empty**, which is indistinguishable from a command that legitimately failed
silently, and sent the model hunting the filesystem. Worth making the denial
message unconditional.

---

## 5. What is NOT wrong — please don't chase these

- **Not registration.** TVControl connects, reports 101 tools, and
  `tv_health_check` returned live chart data (`NASDAQ:MU`, `1D`) [X].
- **Not Desktop.** No tool cap anywhere in Desktop's agent code and it never sets
  a compaction level. Desktop only *reads* the marker (`activityLabels.ts`,
  which calls it "the logger's own").
- **Not the TOON pass.** `toon_encode_array` (`toon.rs:16-22`) bails on any
  object-valued field, and every match carries `"parameters"` as an object
  (`tool_search.rs:490`), so it returns the text unchanged [X]. It *would* fire
  on a boolean JSON Schema (`"parameters": true` is legal) — noted, not blocking.
- **Not `sanitize`.** Cannot turn valid JSON invalid; every transform is a no-op
  on serde-serialized JSON [X].
- **Not the `+N more` catalogue bound.** The catalogue line was complete.
- **Not `call_announced`.** That fix works — see §6.

---

## 6. Unrelated, and good news: 0.13.0's `call_announced` fix works

Verified in the app [X] — but it needed a host-side change, and the commit
message's reasoning about older hosts is wrong in a way worth knowing.

`116f2d21` says hosts predating the frame "drop it through their default arm".
They do — and that is **not sufficient**. The `tool_running` behind it then has no
matching request and the host fails closed on exactly the path the frame exists
to fix. An un-updated host reproduces the original crash identically. The host
must **register** the call, not merely tolerate the frame. Desktop now does.

A/B in the running app, same binary, profile, model and prompt, one line
different [X]:

| | outcome |
|---|---|
| with the handler | "Did 3 things", turn completes |
| without it | `tool_sequence: tool event tool_running has no matching request` → engine exits mid-turn |

Suggest a line in the 0.13.0 release note telling host authors they must consume
`call_announced`, not just tolerate it.

---

## 7. Also worth a look

- **`compactable_tools` is not honoured on this path.** Only readers are
  `compact/micro.rs:126,151,213`; `mod.rs:2517` applies `compaction_level` to
  every tool unconditionally. Setting `compactable_tools = ["Read","Bash"]` is
  exactly what an operator would reach for, and it does nothing. Promote this.
- **`HYDRATED_TOOLS_CAP = 64`** (`engine.rs:1029`) with evict-oldest at
  `:17035-17043` plus the MCP-budget demotion at `:16938-16961`: hydrating past
  the cap silently un-admits earlier tools. Same failure surface, next report.
- Sean's `config.toml` carries **two** TVControl entries —
  `[mcp.servers.tvcontrol]` and `[mcp.servers."com.ferroxlabs-tvcontrol"]`.
  Flagging, not diagnosing.

---

## 8. Reproduction

```bash
# config.toml:  [compact] \n compaction = "full"
# any MCP server with a few dozen tools
# ask the model to ToolSearch for a tool you know exists there
# -> result arrives as `[ { [... N similar lines] } ]`, model can name nothing,
#    and record_hydrated_tools has recorded zero
```

Pure-function repro, no engine: feed `serde_json::to_string_pretty` of any array
of 3+ objects into `compact_output(.., CompactionLevel::Full)` and count
surviving field values.

---

## 9. Why this is urgent

The Master Class demo is Wayland Desktop driving TradingView through Wayland
Core. Smart Trader needs `chart_set_symbol`, `indicator_add_from_search` and
`watchlist_import`. All three are deferred, all three are currently
undiscoverable, and the assistant behaves correctly by refusing to guess.

Desktop is integrated and green on 0.13.0 (`packet/wl-integration @ f0fcfd291`,
suite 17,512). **v0.13.0 is deliberately untagged** until this is resolved —
Desktop's `DEFAULT_WCORE_VERSION` stays at `v0.12.26` and the pin test carries a
tripwire saying the branch is not shippable.
