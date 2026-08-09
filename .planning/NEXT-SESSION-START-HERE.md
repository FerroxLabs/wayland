# START HERE — 2026-08-09 (late)

Branch `packet/attribution-audit`, head **`ff73b9ec0`**, pushed to ferrox.
**Full suite 16,413 tests / 16,264 passed / 0 failed / 0 failed suites. Typecheck clean.**
Nothing merged, tagged, or PR'd. `constitutionFsAuthority.generated.ts` is modified and MUST stay
unstaged.

---

## What landed this session (4 commits)

| Commit | What |
|---|---|
| `1e09826ed` | P1 — a lone activity step renders as itself, once (regression I introduced) |
| `4d5f6b65d` | P3 — workbench stacked vertically, Observability section removed |
| `87631b617` | Deleted the Observability UI left orphaned by that removal |
| `6d1fedd3a` | **K-03 — a finished wcore turn now actually finishes** |
| `ff73b9ec0` | Design parity with the Claude panel (cards, chevron, headings, empty states) |

### K-03 is the significant one

Root-caused by EXECUTION, then fixed and mutation-proven. Two defects stacked:
1. The engine DOES emit `stream_end`; `WCoreManager` turned it into a `'finish'` frame and then
   dropped it (`skipTransformTypes`), so no message was ever persisted for turn end.
2. The only remaining path out was unfalsifiable: `rollUpStatus` returns `running` for a zero-node
   card, and a zero-node `session_cost` card is force-forwarded on EVERY turn — so it both blocked
   the tool-only fallback and could never fire the terminal arm itself.

Fix: turn end produces a durable, **sticky** verdict (`ended`) that terminalizes every running node
and settles the card; the adapter guard now asks "is any STEP running" instead of "does any card
exist". The terminal lifecycle is emitted at the TAIL — inline it made the reducer treat it as
absorbing, which **deleted later tools and marked integrity invalid**.

**⚠️ Two pre-existing tests caught a first attempt that settled a genuinely live turn. The fix was
changed, not the tests.** Independently re-verified: mutating `if (ended) return ended;` turns tests
red with `expected 'running' to be 'done'`; restore → 47/47 green.

---

## 🔴 THE HONEST GAP — none of it has been seen running

The app **boots clean** on a scratch profile (verified this session, CDP 9243). That is ALL that was
live-verified. The stacked panel, the card design, the empty states and the K-03 rail fix have been
seen only by unit tests.

This matters more than usual: **every single defect this session was found by Sean looking at the
app while the suite was green at 16,411 / 0 failed.**

### Live rig (works, reuse it)
```
node scripts/prepareConstitutionFs.js ; node scripts/build-mcp-servers.js
WAYLAND_HOME=<scratch> WAYLAND_MULTI_INSTANCE=1 WAYLAND_DEV_PROFILE=LV-P3 \
  WAYLAND_DISABLE_AUTO_UPDATE=1 WAYLAND_CDP_PORT=9243 bun run start
```
CDP helper at `scratchpad/cdp.mjs` (import `ws` by ABSOLUTE path). Traps, all real:
- `curl` is hook-rewritten and fails against CDP for evaluate — use node `fetch` / raw WebSocket.
- Approval prompts are NOT buttons — dispatch a real `Input.dispatchKeyEvent` Enter.
- **NEVER pass the Flux key inline on a command line** — it leaks into `ps`. Use a heredoc or env file.
- Flux connects via Settings > Models > paste key > "Connect Flux Router", then "Connect". 77 models.

### The six things to actually LOOK at
1. Sections render as separate rounded cards with gaps — not one grey slab.
2. Chevron sits beside the title, not at the far right.
3. Workspace is REACHABLE without a scroll arrow (the original complaint).
4. Several sections open at once; opening one does not close another.
5. An empty lane shows the faded glyph + one line, not Arco's stock illustration.
6. **K-03: run a real wcore turn and watch the rail actually reach `completed`, and the elapsed
   timer STOP.** This is the one that has never been observed working.

---

## Open decisions for Sean

1. **`MessageActivity` is now orphaned in src** — `ObservabilityPanel` was its only renderer. NOT
   deleted: 13 live tests, and its CSS module is imported by `ActivityNodeTree`, so removing it
   cascades. Separate decision.
2. **Six orphaned locale keys** (`conversation.observability.*`, `conversation.subAgent.*`). Left in
   place; nothing in the repo detects unused keys.
3. **Old `wayland.workbench.*.v1` localStorage entries are not migrated or cleaned up.** Harmless
   orphans; a decision, not a test.
4. **An error-only turn still settles as `completed`, not `failed`** — only a process exit maps to
   failed. Deliberately left; changes rail semantics beyond this packet.

---

## Next work, in order

1. **LIVE-VERIFY the six items above.** Highest value by far.
2. **Integrate the new Core binary** `e912ab2d…` (on the Desktop, digests verified with a negative
   control). Pin fixture→`3bf2f0f1…`, source→`677d0fd6…` in `desktopContractV1.ts`. **`rm` then
   `cp`, never overwrite in place.** Then **re-run the ToolSearch loop measurement — 23→10 is
   UNCONFIRMED**, because the binary it was measured on loses 82% of long output and exits 0 on
   failure.
3. **File card for written files.** Full per-backend plumbing map is in memory
   (`file-card-outcome-plumbing-2026-08-09`). Key facts: the outcome lane is fully plumbed and
   completely UNFED (zero adapters emit `type:'outcome'`); wcore/gemini/acp are adapter-only fixes;
   codex needs `codex_tool_call` admitted to the stream first. **Blocker: which code path a real
   Codex run takes was never resolved.** The `[[AION_FILES]]` marker hole is CLOSED (`cc82eddb1`) —
   but still never drive the card off the marker.
4. **Windows verification for K-05 T1** — mocked `spawn`, never real `CreateProcess`.
   `ssh -i ~/.ssh/wayland_win seand@100.109.207.54`.
5. **K-05 T5** — port `readClaudeProviderEnvFromCcSwitch()` and codebuddy's `--mcp-config` onto the
   generic spawn path (the B1 trade Sean approved keeping).
6. The corrupted-conversation DB migration — still Sean's call, NOT run.
