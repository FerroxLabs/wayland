# Plan — TVControl full integration in Wayland Desktop (2026-08-04, rev 2)

**Rev 2 supersedes rev 1 entirely.** Rev 1's W-1 was misdiagnosed: it offered two hypotheses
(H1 stale row guard, H2 global-revision exhaustion) and both are refuted below. The 4-leg
cross-audit returned **NO-GO** (internal adversarial), **NO-GO** (Gemini 3.1 Pro),
**FIX-FIRST** (Codex 5.6 Sol), **FIX-FIRST** (Kimi K3). All four independently rejected rev 1's
"keep the publication and re-commit" prescription; three independently killed H2 on the same
142ms timing arithmetic.

**Repo split:** TVControl is DONE (2.2.1 published, tagged `v2.2.1`, verified by clean
install from the public registry: 101 tools over stdio). Everything below is Wayland Desktop,
worktree `~/dev/wayland-worktrees/packet-attribution`.

**Standing constraints:** no push / merge / tag without Sean. Never commit
`constitutionFsAuthority.generated.ts`. `AGENTS.md` / `CLAUDE.md` are dirty from IJFW
tooling — keep out of every commit. 76 commits local, nothing pushed.

---

## W-0 — The agent cannot reach TVControl's tools  🔴🔴 MASTER-CLASS BLOCKER

**The fix is in `wayland-core`, not Desktop.** That matters for scoping: Core is already
being rebuilt, and this belongs in that work.

### Observed, twice, with a real model and a live chart

Two full end-to-end runs (`/tmp/wl-demo.log`, `/tmp/wl-demo2.log`): real conversation,
`flux-pinned-claude-sonnet`, Wayland Core backend, TVControl enabled, TradingView live,
prompt = read the chart then switch to NASDAQ:TSLA.

**The chart never moved, in either run.** Run 1, after permission was granted:

```
13:12:43.625  [wcore] [mcp] Connected to 'tvcontrol': 101 tools
13:14:08.627  [ToolSearch success] No deferred tools matching "tvcontrol TradingView chart" found.
13:14:12.593  [ToolSearch success] No deferred tools matching "TradingView" found.
13:14:12.593  [ToolSearch success] No deferred tools matching "chart symbol MCP" found.
```

The tools were connected 85 seconds before the search executed. **22 of TVControl's 101 tool
descriptions contain the literal word "TradingView"** (verified by dumping `tools/list`), so
the second query should have matched 22 tools. It matched none.

### PROVEN — `ToolSearch` matches the entire query as one substring

`crates/wcore-tools/src/tool_search.rs:88-91`:

```rust
let name_l = def.name.to_lowercase();
let desc_l = def.description.to_lowercase();
if name_l.contains(&query_lower) || desc_l.contains(&query_lower) {
```

`query_lower` is the whole query. `"tvcontrol TradingView chart"` must appear **verbatim** in
a single tool's name or description. No tool in any MCP server will ever contain a
natural-language phrase, so a model that searches the way models actually search gets nothing.
This is arithmetic, not a hypothesis. Fix: tokenize the query and match on any/all terms, and
rank.

### INFERRED, NOT PROVEN — the snapshot is frozen before MCP servers connect

`ToolSearchTool` holds a construction-time snapshot, by its own doc comment
(`tool_search.rs:18-21`): *"Snapshot of all tool definitions (taken at construction time)."*
It is constructed once, during bootstrap (`bootstrap.rs:2240`). MCP servers connect after
session start. If bootstrap precedes MCP connection, MCP tools are invisible to ToolSearch for
the entire session — which would explain why the single-word `"TradingView"` query matched
nothing despite 22 candidates.

**This ordering has not been proven and must not be treated as established.** It is the same
shape of claim that rev 1 got wrong.

**Decisive experiment — cheap, Core-side, do this first:** a unit test that builds a registry,
constructs `ToolSearchTool`, registers an MCP-style deferred tool *afterwards*, and searches
for it by exact name. If it is not found, the snapshot is the cause and the fix is to consult
the live registry instead of a frozen copy.

### Why this is total, not partial

MCP proxies stay deferred (`registry.rs:268-269`) and `fold_deferred_into_catalog`
(`registry.rs:302-318`) removes every deferred def from the outbound tools array. So ToolSearch
is the **only** route from the model to an MCP tool. If ToolSearch cannot see MCP tools, no MCP
server is callable in a Wayland Core session — TVControl is just the one we noticed.

### Not the cause — corrected

An earlier revision blamed Desktop's `MCP ToolSearch candidate pool: 0 tools` log line.
`getMcpCandidateTools()` (`WCoreManager.ts:1857`) is consumed **only** by a `mainLog` call at
`:1367` and is never sent anywhere. It is a diagnostic projection with no functional effect.
The 93-second gap in run 1 was also not a stall — it was the permission prompt waiting for a
human.

### Secondary defects surfaced by the same runs

- **A turn that finds no tools never completes.** Core logged `stream_end ... finish_reason:
  'stop'` at 93s; the UI still showed "running" 1145 seconds later.
- **Wayland shows "Wake your agents / connect a model provider"** in a profile with a working
  configured provider that is actively answering.

### Acceptance

- Core unit test: a deferred tool registered after `ToolSearchTool` construction is findable.
- Core unit test: a multi-word natural-language query matches a tool whose description
  contains those words.
- End-to-end gate, falsifiable: fresh profile, TradingView live, one prompt, **the chart symbol
  actually changes**. The Library tool count does not count — it read 101 while the agent saw
  zero.

---

## W-1 — Publication fails on every toggle  🔴 BLOCKER

Two stacked defects. Fixing only the first produces a new failure that looks identical.

### Defect 1-A (proximate) — an unsupported backend is counted as a publication failure

`McpService.ts:341-347` returns, for every detected backend with no MCP agent implementation:

```js
console.warn(`[McpService] Skipping MCP sync for unsupported backend: ${agent.backend}`);
return { agent: agent.name, success: false, error: `MCP publication is not supported ...` };
```

`useMcpOperations.ts:177-181` then throws if **any** result is unsuccessful:

```js
const failedPublications = publicationResults.filter((result) => !result.success);
if (!syncResponse.success || publicationResults.length === 0 || failedPublications.length > 0) {
  throw new Error(syncResponse.msg || t('settings.mcpSyncFailedNoAgents'));
}
```

`removeMcpFromAgents` carries the identical predicate at `useMcpOperations.ts:135-143`, fed by
the identical skip path at `McpService.ts:455-461`.

**Evidence, from the plan's own reproduction:** `/tmp/wl-run4.log` logs **12** unsupported
backends — grok, goose, auggie, kimi, droid, copilot, qoder, vibe, cursor, kiro, hermes,
openclaw-gateway — at `09:49:15.830`, inside the very publication rev 1 described as "all five
succeed". So `syncMcpToAgents` throws on every toggle on this machine regardless of outcome,
`handleToggleMcpServer` never reaches its CAS, the catch runs `removeMcpFromAgents`, that throws
for the same reason, and `retainMcpPublicationReconciliation` persists the divergence marker.

**This is deterministic, not a race** — which is why it reproduced on every attempt.

**Fix:** an unsupported backend is a non-target, not a failure. Filter those results before the
throw decision (or stop emitting them as `success:false` in `McpService`). `McpService.ts:367`
`allSuccess` is computed over the same polluted set.

### Defect 1-B (latent behind 1-A) — publication mutates the row it is about to compare against

`handleToggleMcpServer` publishes the enabled declaration, then commits with a row guard on
`targetServer.updatedAt` (`useMcpServerCRUD.ts:377-385`). But `WaylandMcpAgent` is one of the
publication targets, and its install writes the authoritative config directly
(`WaylandMcpAgent.ts:67-87`), bumping that row's `updatedAt`:

```js
await updateMcpConfig((existingServers) => { ...
  serverMap.set(server.name, { ...server, updatedAt: Math.max(Date.now(), (previous?.updatedAt ?? 0) + 1) });
```

`updateMcpConfig` is main-process (`mcpConfigAuthority.ts:36`) and bypasses the renderer write
queue entirely. So the instant 1-A is fixed and publication returns normally, the CAS runs
against a row publication itself changed, `committed` stays false, and the same rollback fires.

Two corollaries the plan must carry:
- The row is left `enabled: true` by this self-write even though the toggle never committed —
  which is why `retainMcpPublicationReconciliation` (`useMcpConnection.ts:109-115`,
  `enabled: current?.enabled ?? false`) retains an **enabled** divergence row.
- `WaylandMcpAgent`'s removal is an explicit no-op (`WaylandMcpAgent.ts:97-111`), so rollback
  cannot undo the self-write. "Rollback strips it from every agent" is false.

**Fix:** make the config authority the sole writer of Wayland's own declaration — exclude
`WaylandMcpAgent` from pre-commit publication, or make its install validation-only. **Do not
weaken the row CAS to accommodate it** — every leg that reached this defect agrees.

**And do not fix it by bypassing the guard.** `updatedTargetServer` is built at t0 and hardcodes
`status: 'disconnected'` (`useMcpServerCRUD.ts:355-362`). Suppressing the throw and writing it
unconditionally would clobber any live status another writer legitimately applied during the
window, silently reverting a connected connector to disconnected. The commit must **merge** the
publication's intent (`enabled`, the declaration) onto current durable truth, not overwrite the
row wholesale.

### Refuted — do not re-raise

- **H1 as rev 1 stated it.** All three legs independently enumerated the 16 renderer
  `saveMcpServers` sites: none can bump a durably disabled row without a second user action.
  `refreshServerStatuses` targets `s.enabled === true` only (`useMcpConnection.ts:449-454`);
  `:206` returns the array unchanged; the four image-gen writers are scoped to the builtin.
  The real writer was never a renderer writer — see 1-B.
- **H2, global-revision exhaustion.** `/tmp/wl-run3.log`: publication completes `09:46:27.411`,
  rollback begins `09:46:27.**553**` — **142ms**. Sixteen CAS retries under sustained churn
  cannot occur in 142ms. Also `compareAndSetMcpConfig` (`mcpConfigAuthority.ts:49-70`) returns
  `applied:false` for exactly one reason — a revision mismatch; every other failure throws — so
  a validation rejection cannot masquerade as churn.
- **"Keep the publication and re-commit."** Rev 1's prescription. It breaks the invariant at
  `useMcpServerCRUD.ts:366-367` ("a failed or partial publication can therefore never leave a
  false-green row") and would overwrite a concurrent edit, or resurrect a deleted row, with a
  45-second-old candidate. The correct algorithm — re-read the durable winner, publish the
  winner, reconcile the loser out — **already exists** as `reconcileLostProbeFailureCas`
  (`useMcpConnection.ts:190-317`). `handleToggleMcpServer` is the only publication path lacking
  it. That asymmetry is the real design gap.

### Acceptance — rev 1's gate could not fail; these can

Rev 1 mandated a regression test in `useMcpServerCRUD.dom.test.tsx`, which stubs the defect out
of existence at line 1118 (`vi.fn().mockResolvedValue(undefined)`). Replace with:

1. `useMcpOperations.dom.test.tsx` — a results array mixing an unsupported-backend
   `success:false` with real successes must **not** throw. (Fails against current tree.)
2. Wayland publication must not mutate `mcp.config` before the renderer commit.
3. A material same-row edit or deletion during publication must still win — not be overwritten.
4. Partial adapter publication must leave retryable, fail-closed durable truth.
5. Divergence retention must derive `enabled` from pre-transaction authority, not from a row an
   adapter already mutated.

Duration is **not** a criterion — the failure fires at 142ms.

---

## W-2 — The two Claude Code agent fixes (`e3303e5cc`)

**Correct rev 1's claim: W-2 was already live during the failing runs 3, 4 and 5.**
`wl-run3.log:725` logs `Replaced existing MCP server` at `09:46:27.411` and the row is re-poisoned
142ms later at `:740`. It fixes two real CLI defects; it does **not** recover the connector,
because the renderer throws regardless. Rev 1's "verified live: recovers on reconnect" was a
partial observation reported as a result.

**Open question, must be answered before PR:** `wl-run4.log:553` adds the server successfully at
`09:49:36.311`; `:580` reports it `not found in any scope (may already be removed)` 48s later, and
`ClaudeMcpAgent.ts:347` swallows that as success. Either the add did not persist where the remove
looks, or the new `execErrorDetail` classifier is misreading a genuine failure as absence. The
negative control covers permission-denied and timeout, not this case. Also: no `GeminiMcpAgent`
removal line appears in the rollback at all despite a successful add at `09:49:16.852`.

Sequencing: implement in parallel with W-1, but **both are required** before W-1's end-to-end
acceptance and before W-3 ships.

---

## W-3 — TVControl as a catalog connector (after W-1 + W-2)

The install path **does** reach `handleToggleMcpServer`, via
`DetailPage.tsx:649-670` → `oauth-flow` → stdio → `saveAndConnect` → `handleAddMcpServer` (:300)
→ probe (:305) → `saveMcpServers` (:318) → `handleToggleMcpServer(id, true, probedServer.updatedAt)`
(:340). So W-1 gates it. Rev 1's claim that install "runs the same publication path" was wrong in
detail — `handleAddMcpServer` is declaration-persistence only (`useMcpServerCRUD.ts:67-69`) — but
right in conclusion.

Corrections to rev 1's file list:

- **`auth.method` must be `"none"`, not `"local-credentials"`.** With any non-`none` value,
  `DetailPage.tsx:659-661` and `:676-681` render "Sign-in or a token is required after install."
  for a connector that needs neither. `"none"` also routes Install straight to `saveAndConnect`.
- **`x-wayland` requires `tier`, `categories`, `maintainerType`, `iconUrl`, `auth`** per
  `schema/entry.schema.json`. Rev 1 omitted three; `validate-catalog.ts` would reject it.
- **`x-wayland.setupGuide.path` is mandatory** or the guide is never loaded
  (`DetailPage.tsx:154`) and `build-catalog-index.ts:22` derives no `guideUrl`. Without it the
  single most important artifact — the TradingView-debug-port precondition — silently does not
  exist.
- **`catalog.json` is generated, not hand-edited.** Add the entry file, run
  `build-catalog-index.ts`, then `validate-catalog.ts`.
- **Drop the claim that this "runs on a machine with no system node."** `resolveMcpStdioSpawn` is
  not used by `ClaudeMcpAgent` (`:33`), `CodexMcpAgent` (`:185`) or `GeminiMcpAgent` (`:202`) —
  raw `npx` goes into all three configs. True only for the Library probe, WCore and ACP sessions.
- `platforms` is **informational**: `useMcpLibrary.ts:168-188` loads every entry with no platform
  or version filtering. Decide Linux behaviour explicitly rather than assuming it is enforced.

Still correct from rev 1: do **not** bundle as a builtin, do **not** build detection-gating, do
**not** set `TV_MCP_ADVANCED`.

Two pre-existing catalog-path bugs found during the audit, worth their own tickets:
`useMcpServerCRUD.ts:354` returns `false` with no toast/error/log when `expectedRevision`
mismatches — only the catalog path passes it, so the user sees a successful install and a durably
disabled connector; and `DetailPage.tsx:314` is dead code (`handleAddMcpServer` hard-sets
`enabled:false` at `:58`).

---

## Sequencing

```
W-0 (tool pool must not report absence while MCP registration is in flight)  <- FIRST
      |
      v
W-1A (unsupported-backend filter)  ──┐
W-1B (stop the WaylandMcpAgent self-write) ──┼─> integrated acceptance ──> W-3
W-2 (Claude agent fixes + answer log:580)  ──┘
```

W-0 goes first because it is the only defect that breaks the product for a user whose setup
is already correct. W-1/W-2 make setup survivable; W-3 makes it discoverable. Without W-0 all
three are polish on something that does not work.

There is no Phase A. The diagnosis is done — rev 1's instrumentation would have logged nothing,
because the failing path issues no config write at all.

---

## Separate tickets (real, not W-1)

- **Unbounded probe loop.** `publishMcpConfig` hands every mounted hook a fresh array on every
  applied CAS; `useConnectedMcps.ts:133` keys its effect on array identity, so any config write
  re-runs `refreshServerStatuses`. Any enabled server that never reaches `connected` is re-probed
  forever (`wl-run4.log`: four servers on an ~18-24s cycle, spawning subprocesses). Not the cause
  of W-1 — it cannot touch a disabled row.
- **Non-monotonic revision.** `DetailPage.tsx:620` uses `updatedAt: Date.now()` where every other
  writer uses `nextMcpRevision`. Two toggles in the same millisecond produce an equal `updatedAt`,
  which every row-level CAS reads as "unchanged".

## TVControl follow-ups (separate repo, not blocking)

1. `tests/state.test.js` connects to a live TradingView whenever one listens on 9222 — it ran 11
   minutes against a real chart. An ordinary `npm test` can mutate it.
2. Two moderate advisories remain in the SDK's HTTP stack, unreachable (stdio only). Clearing them
   means SDK 1.30.0 — its own PR, gated by `tests/mcp_stdio.test.js`.
