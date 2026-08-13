# Handoff to Wayland Core — tool compaction destroys the MCP hydration path

**Severity: ships broken.** With `compaction = "full"`, a model driving a large MCP
server cannot learn the name of a single one of its tools. Verified live on
0.13.0 against a 101-tool server (TVControl): the server connects, a tool
executes, and the catalogue is still unreachable.

**[X]** = proven by executing something. Everything else says what it is.

---

## 0. ⚠️ Read this before auditing: your checkout is not the shipping tree

Everything below is anchored to **`116f2d21`** (and `b06232a7`, the
`lane/v0130-build2` head the 0.13.0 binary was built from). The
`~/dev/waylandcore` working tree here sits on **`frontier/m0`**, which has
diverged enormously:

| file | `frontier/m0` | shipping lane |
|---|---|---|
| `crates/wcore-tools/src/tool_search.rs` | **209 lines**, no `MAX_MATCHES` | **1457 lines**, `MAX_MATCHES = 10` at :190 |
| `crates/wcore-agent/src/orchestration/mod.rs` | 2214 lines, `compact_output` ~:958 | `compact_output` at :2516 |

This is not academic: one of our four audit legs ran against `frontier/m0` and
concluded `MAX_MATCHES` "does not exist and finding 1 should be deleted". On the
tree you are shipping it exists and caps ToolSearch at ten hits [X]. Audit against
the release lane or you will reach the opposite conclusion. Anchor on symbols,
never line numbers.

---

## 1. Symptom

`ToolSearch` is the hydration path for deferred tools — its result is the only
channel by which a deferred tool's name and schema reach the model. On the wire
[X] (`~/Library/Logs/Wayland-Dev/2026-08-13.log`, grep control: `ToolSearch`=59,
`wcore`=41):

```
[WCoreManager] info: [ToolSearch success] [
  {
[... 37 similar lines]
  }
]
```

Consequence, observed in the app [X]: the model reports *"there is no
`chart_get_state` tool ... I can't fabricate a symbol/timeframe without actually
calling it"*, and correctly refuses to invent names. `tv_health_check` — which
happens to be hot, not deferred — executes fine and returns real chart data, so
this is **not** a connection or registration failure.

---

## 2. Root cause — `lines_are_similar` normalises by the SHORTER line

`crates/wcore-compact/src/fold.rs`:

```rust
fn lines_are_similar(a: &str, b: &str) -> bool {
    let prefix = common_prefix_len(a, b);
    let min_len = a.len().min(b.len());
    prefix as f64 / min_len as f64 >= MIN_PREFIX_RATIO   // 0.5
}
```

Dividing by the **shorter** line makes short structural lines promiscuous. A
3-character line like `  {` shares its 2-space indent with every field line
beneath it, so the ratio is 2/3 = 0.67 and everything "matches" it [X]:

```
similar  prefix=2 min_len=3   '  {'  vs  '    "name": "chart_get_state",'
similar  prefix=2 min_len=3   '  {'  vs  '    "description": "TradingView tool ..."'
similar  prefix=2 min_len=3   '  {'  vs  '  },'
NOT      prefix=5 min_len=30  '    "name": ...'  vs  '    "description": ...'
```

The content lines are **not** similar to each other. It is the `  {` line that
anchors a fold group and swallows the whole array. This is why pretty-printed
JSON is annihilated while the fold looks harmless on prose.

Measured on a 14-tool catalogue [X]: **72 lines → 5 lines, 0 of 14 names survive.**

### Call path
1. `crates/wcore-agent/src/orchestration/mod.rs` — the tool-result pipeline applies
   `truncate_result(...)` then `wcore_compact::compact_output(&content, compaction_level)`
   to **every** tool result, then optionally `compact_output_toon`.
   *(At `116f2d21` this is lines 2516-2519; on your current working branch the same
   code is near line 958. Anchor on the symbols, not the line numbers.)*
2. `compact_output` at `Full` = `sanitize` → `fold_repeated_lines` → `compact_json`.
3. The fold destroys the JSON. `compact_json` then cannot parse it and passes it
   through, so the damage is final.

`CompactionLevel` defaults to `Safe`; the affected deployment sets
`compaction = "full"` in `config.toml`. **Desktop never sets it** — verified, no
compaction setting anywhere in Desktop's source.

### Why this was invisible
Core already exempts `ToolSearch` from deferral in `apply_cold_deferral`
("never deferred — it is the hydration path") but not from **compaction**. The
one output that must stay lossless is fed through a lossy text heuristic.

---

## 3. Proposed fix

### Fix A (root cause, one line) — normalise by the longer line
```rust
-    let min_len = a.len().min(b.len());
-    prefix as f64 / min_len as f64 >= MIN_PREFIX_RATIO
+    // Normalising by the SHORTER line makes tiny structural lines promiscuous:
+    // `  {` shares its indent with every field beneath it (2/3 = 0.67), so a
+    // pretty-printed JSON object folds away entirely and every tool name in a
+    // ToolSearch result is destroyed. The longer line is the honest denominator.
+    let span = a.len().max(b.len());
+    prefix as f64 / span as f64 >= MIN_PREFIX_RATIO
```

**Controlled measurement [X]** — the fix kills the damage and preserves every
case the fold exists for:

| input | current | after fix |
|---|---|---|
| JSON tool catalogue (must NOT fold) | 27 → 5, **0/5 names** | 27 → 27, **5/5 names** |
| identical warnings (MUST fold) | 10 → 3 | 10 → 3 |
| progress bar (MUST fold) | 14 → 8 | 14 → 8 |

A `MIN_FOLD_LINE_LEN = 16` guard scores identically if you prefer an explicit
floor to changing the denominator.

### Fix B (defence in depth) — the hydration path is never lossy
Route `ToolSearch` through a lossless-only path: `sanitize` + `compact_json`,
never `fold`, and **not** `compact_output_toon`. Do not simply bypass
`compact_output` — that would forfeit `compact_json`'s lossless token saving,
and it would leave the TOON encoder still running on the result.

### Fix C — truncation ordering
`truncate_result` runs **before** compaction, so a large catalogue can be cut
mid-structure. Fix A protects valid JSON; it does not protect JSON that was
already sliced. For `ToolSearch` specifically, truncate on a record boundary or
raise its `max_result_size`.

### Fix D — the enumeration ceiling (revision-dependent, please check yours)
On the shipping lane, `MAX_MATCHES = 10` (`tool_search.rs:190`, used at :443
`scored.truncate(MAX_MATCHES)`) [X]. Even fully fixed, ten hits per query cannot
enumerate a 101-tool server. Wants a higher cap for exact-prefix or
server-scoped queries, or pagination.

On `frontier/m0` the cap is **absent** — and there the *opposite* problem bites:
`ToolSearchTool` does not override `max_result_size()`, so it inherits the
50 000-char default (`crates/wcore-tools/src/lib.rs:517-519`) [X] and a full
101-tool catalogue is truncated mid-JSON. Whichever tree you land on, one of
these two applies. Both are fixed by giving `ToolSearchTool` an explicit
`max_result_size()` override plus record-boundary-aware truncation.

### Fix E — hydration admission fails silently
`Engine::record_hydrated_tools` (`crates/wcore-agent/src/engine.rs:17015`) [X]:

```rust
fn record_hydrated_tools(&mut self, content: &str) {
    let Ok(serde_json::Value::Array(matches)) =
        serde_json::from_str::<serde_json::Value>(content)
    else {
        return;                      // <- silent
    };
```

It parses the **compacted** string. So the fold did not merely hide names from
the model — it broke hydration *admission*, meaning even a correctly guessed tool
name would not be force-included in `tools[]`. Fixes A/B repair this incidentally,
but the silent `return` should log:

```rust
else {
    tracing::debug!(target: "wcore_agent::engine",
        "ToolSearch result did not parse as a JSON array; hydration not recorded");
    return;
};
```

Otherwise the next transform that corrupts this string (truncation, TOON, a new
compaction stage) no-ops hydration with no trace, exactly as this one did.

### Regression test
```rust
#[test]
fn full_never_folds_a_json_tool_catalogue() {
    let names = ["chart_get_state", "chart_set_symbol", "watchlist_import"];
    let catalogue = serde_json::to_string_pretty(
        &names.iter().map(|n| serde_json::json!({
            "name": n, "description": format!("TradingView tool {n}"),
            "server": "com.ferroxlabs-tvcontrol"
        })).collect::<Vec<_>>()).unwrap();

    let out = compact_output(&catalogue, CompactionLevel::Full);

    assert!(!out.contains("similar lines"), "folded a tool catalogue: {out}");
    for n in names { assert!(out.contains(n), "compaction destroyed {n}: {out}"); }
}
```
Pair it with a **negative control** asserting 10 identical lines still fold to
`[... 8 identical lines]`, or the fix can be reverted to "never fold anything"
and this test stays green.

**Mutant check [X]:** the test input really does fold today — simulated against a
faithful port of `fold_repeated_lines`, `to_string_pretty` output collapses to
`[\n  {\n[... N similar lines]\n  }\n]`. The test is not vacuous.

---

## 4. Cross-audit

Four independent legs on this patch. Findings folded into §3 above.

- **Gemini 3.1 Pro — FIX-FIRST.** Killed the original draft's JSON-guard approach:
  `truncate_result` runs first so sliced JSON fails the guard and gets folded
  anyway; NDJSON never parses; `serde_json::from_str::<Value>` builds a whole DOM
  just to test syntax (`IgnoredAny` is the cheap form); bypassing `compact_output`
  for ToolSearch forfeits real token savings. Elevated `MAX_MATCHES` from a
  footnote to a blocker.
- **Kimi K3.** Caught that the line numbers differ between `116f2d21` and your
  working branch (hence the symbol-anchoring note in §2). Found the `toon_enabled`
  path running *after* compaction, which a naive bypass misses. Noted
  `engine.rs` already couples on the `"ToolSearch"` string literal, so that
  coupling matches convention. Pushed hardest on whether the regression test was
  vacuous — which is why §3 carries an explicit mutant check.
- **Codex 5.6 Sol.** Independently flagged the sanitize-before-guard ordering and
  the NDJSON / fenced / prefixed-JSON gaps. Its specific CRLF claim is
  **refuted**: `collapse_cr_lines` already strips the terminator before
  collapsing, and the code comment documents that exact fix.
  Kimi's full verdict was **FIX-FIRST**, and two of its findings are in §3 above
  as Fix D and Fix E. One is **refuted**: it reported `MAX_MATCHES` as
  non-existent and asked for finding 1 to be deleted. That is true of
  `frontier/m0` and false of the tree you ship — see §0. It also independently
  reproduced the fold on the regression-test input (27 → 5, 0 names) and
  confirmed the mutant check is not vacuous, and it identified the real anchor
  mechanism (`  {` at 2/3 similarity) before we did.
- **Internal reviewer.** Still running at time of writing; nothing folded in yet.

Two further Kimi points accepted but not blocking: Fix 2 also bypasses
`sanitize`, so MCP-supplied descriptions reach the transcript unsanitised; and
the whole defect is a *composition* failure (ToolSearch × per-result compaction)
that no unit test in `wcore-compact` can catch — the missing test belongs next to
`hydrate_via_tool_search` in `engine.rs`.

The audits are the reason the fix moved from "detect JSON and skip the fold"
(fragile, parse-dependent, defeated by truncation) to "fix the similarity metric"
(one line, no parsing, no new failure modes).

---

## 5. What is NOT wrong — please don't chase these

- **Not registration.** TVControl connects and reports 101 tools; `tv_health_check`
  executed and returned live chart data (`NASDAQ:MU`, `1D`) [X].
- **Not Desktop.** No tool cap anywhere in Desktop's agent code, and Desktop never
  sets a compaction level. Desktop only *reads* the marker
  (`activityLabels.ts`, which calls it "the logger's own").
- **Not the `+N more` catalogue bound.** The catalogue line was complete, with no
  overflow suffix.
- **Not `call_announced`.** That fix works; see below.

---

## 6. Unrelated, and good news: 0.13.0's `call_announced` fix works

Verified in the app [X] — but it needed a host-side change, and the commit
message's reasoning about older hosts is wrong in a way worth knowing.

`116f2d21` says hosts predating the frame "drop it through their default arm".
They do — and that is **not sufficient**. The `tool_running` behind it then has no
matching request and the host fails closed on exactly the path the frame exists to
fix. An un-updated host reproduces the original crash identically. The host must
**register** the call, not merely tolerate the frame. Desktop now does
(`desktopContractV1.ts`, in both the ordinary-event allowlist and the announce
branch).

A/B in the running app, same binary, profile, model and prompt, one line
different [X]:

| | outcome |
|---|---|
| with the handler | "Did 3 things", turn completes |
| without it | `tool_sequence: tool event tool_running has no matching request` → engine exits mid-turn |

Suggest adding a line to the 0.13.0 release note telling host authors they must
consume `call_announced`, not just tolerate it.

---

## 7. Also worth a look

- `compactable_tools` (default `["Read","Bash","Grep","Glob","Write","Edit"]`) is
  honoured **only** in `compact/micro.rs`. The per-result compaction in
  `orchestration/mod.rs` ignores it, so the documented allow-list does not bound
  the compaction users actually hit. Either honour it there or document that it
  only governs history micro-compaction.
- Sean's `config.toml` carries **two** TVControl entries —
  `[mcp.servers.tvcontrol]` and `[mcp.servers."com.ferroxlabs-tvcontrol"]`. Likely
  harmless, possibly a double registration; flagging rather than diagnosing.

---

## 8. Reproduction

```bash
# 1. any MCP server with a few dozen tools, and in config.toml:
#      [compact]
#      compaction = "full"
# 2. ask the model to ToolSearch for a tool you know exists on that server
# 3. the result arrives as `[ { [... N similar lines] } ]` and the model
#    cannot name a single tool
```

Pure-function repro, no engine needed: feed
`serde_json::to_string_pretty` of any array of 3+ objects into
`compact_output(.., CompactionLevel::Full)` and count surviving field values.

---

## 9. Why this is urgent

The Master Class demo is Wayland Desktop driving TradingView through Wayland Core.
Smart Trader needs `chart_set_symbol`, `indicator_add_from_search` and
`watchlist_import`. All three are deferred, all three are currently
undiscoverable, and the assistant behaves correctly by refusing to guess.

Desktop is integrated and green on 0.13.0 (`packet/wl-integration @ f0fcfd291`,
suite 17,512). **v0.13.0 is deliberately untagged** until this is resolved —
Desktop's `DEFAULT_WCORE_VERSION` stays at `v0.12.26` and the pin test carries a
tripwire saying the branch is not shippable.
