# Smart Trader + the two doctors — plan, 2026-08-12

Everything marked **[X]** was established by reading or running something, not assumed.

---

## 0. The decisions already made (do not relitigate)

| decision | answer |
|---|---|
| Chart save | Set everything up programmatically, then tell the user to press Cmd+S. No `state_snapshot`, no keystroke automation. |
| TC-TIDE | **Published PRIVATELY, direct link only.** Not searchable. The user must open the URL and favourite it first; only then can it be added. See §5.5. |
| Morning report output | An app-owned folder, opened each morning. **Never** the documented path. |
| Voice thread (earlier, separate work) | Dedicated visible "Voice" conversation, not hidden. |

---

## 1. There are two doctors and they answer different questions [X]

**`wayland_concierge_diag`** — `src/process/resources/builtinMcp/conciergeDiagServer.ts` (798 lines).
Model-callable MCP. Runs in a standalone **Node subprocess**: no Electron, no main-process
singletons, no ipcBridge, only node builtins + `better-sqlite3` (`:12-14`). Strictly read-only
(`:16`). Reads `mcp.config`, the cron SQLite `cron_jobs` table, the provider SQLite (STATE columns
only — the creds column is NEVER read), the workspace DB and a tailed log dir. Every output string
passes a central `sanitize()` that applies both `redact()` and `scrubHome()` (`:23-28`). No tool
throws; an unreadable source degrades to `available: false`.

→ Answers **"what is installed and configured?"** Cannot connect, spawn, or reach the network.

**Settings `/doctor`** — `src/process/doctor/`. 12 checks, flat array in `registry.ts:171`,
concurrent via `Promise.all` (`runner.ts:81`), 30s per-check timeout (`runner.ts:20`), total error
containment — a throwing check becomes a `fail` result and cannot kill the run (`runner.ts:57-64`).

→ Answers **"does it actually work?"** Live probes. Not model-callable
(`doctor.run` is in `REMOTE_DENIED_KEYS`, `bridgeAllowlist.ts:473-474`).

### Two structural facts to design against [X]
1. **There is no auto-fix anywhere.** `remediation?: string` (`types.ts:48`) is the entire
   remediation surface, rendered verbatim (`DoctorSettings/index.tsx:59`, `reportText.ts:34`).
   Adding a fix button is a types + both-UIs + IPC change. **We are not doing that.**
2. **New checks are free UI-wise.** Both surfaces iterate `report.results` generically and fall back
   to the check `id` when no i18n key exists (`index.tsx:51`).

### The reentrancy trap — read before writing any check [X]
`registry.ts:88-99`: never call `ConfigStorage.get` inside a check. It is a renderer↔main round
trip, and because checks run inside the `doctor.run` bridge invocation the nested call never
resolves — it hangs until the 30s timeout (issue #273). **Use `ProcessConfig`.** This is the exact
same defect class as the `voiceSynthBridge` hang fixed earlier today.

---

## 2. Work item A — Settings /doctor: the engine contract pin

**Why first: this is open blocker #1 and `/doctor` would state it in one line.**

`engine.reachable` (`engineChecks.ts:40`) only confirms the binary returned *a* version string
(`:49-55`). Nothing compares it against the pin. Zero occurrences of `DESKTOP_CORE_V1_PIN`,
`contract` or `pin` anywhere in `src/process/doctor/` [X].

- Constant: `DESKTOP_CORE_V1_PIN` (`desktopContractV1.ts:37`), producer commit
  `DESKTOP_CORE_V1_PRODUCER_COMMIT = 'd6f76c67'` (`:18`), live comparison site at `:275`.
- Drift is real, not theoretical: `binaryResolver.ts:22` notes an accepted update can supersede the
  bundled version.

New check `engine.contractPin`, category `engine`. Compare resolved engine against the pin; `fail`
on mismatch naming both sides.

## 3. Work item B — Settings /doctor: MCP tool counts

`McpTestResult.tools?: Array<{name: string}>` is **declared at `mcpChecks.ts:27` and discarded** —
the success branch is `else if (result.success) { okCount += 1; }` (`:106-107`) [X]. So a server
that connects and exposes **zero tools** is indistinguishable from a healthy one.

That is precisely the TVControl failure of 2026-08-04 (connected fine, served nothing, root cause
its own zod-4 `z.record`). It is also exactly what Smart Trader step 1 needs.

Accumulate `result.tools?.length`; surface "N server(s) reachable exposing M tool(s)"; `warn` a
server that connects but publishes 0 tools.

Note the deliberate existing ceiling: an all-success run still returns `warn` (`mcpChecks.ts:136-140`)
because standalone reachability ≠ session tool publication. Adding counts weakens that rationale
slightly — keep the warn, tighten the wording.

## 4. Work item C — concierge diag: the new systems

All on-disk, all inside the sandbox. Nothing here may spawn, connect, or touch Electron.

- **Voice STT** — `existsSync(join(getVoiceModelsDir(), 'whisper-tiny'))`. Resolver already exists
  main-side: `getVoiceModelsDir()` (`src/process/extensions/constants.ts:92-101`). Bundled by
  `electron-builder.yml:174-175`, pinned by `scripts/voice-model-pinned-release.json:3`.
  ⚠️ Do NOT call the `voiceAsset.exists` IPC provider — bridge provider, reentrancy trap.
- **Voice TTS** — `resolveLocalTtsProvider` (`voiceReadiness.ts:176-189`) is pure: darwin →
  `system-native`, win32 → `windows-native`, everything else → **null**. `VoiceLeg` /
  `VoiceLegStatus` (`:149-162`) is already the right shape. Note nothing enumerates actual installed
  OS voices — report resolution, do not claim a voice exists.
- **Agent installs** — receipt `.wayland-agent-install.json` (`installManifest.ts:26-38`), prefix
  `resolveAgentInstallPrefix` (`installPrefix.ts:55`). Today a broken install is **silent**:
  `resolveManagedAgentLaunch` returns null for every bad case (`installedAgentLaunch.ts:88-97`) and
  the caller just `continue`s (`:163`), so "receipt present, launch target gone" is
  indistinguishable from "never installed" [X].
- **TVControl presence** — `mcp.config` already readable here; report whether
  `libraryEntryId === 'com.ferroxlabs/tvcontrol'` is present and enabled.

---

## 5. Work item D — the Smart Trader assistant

### Registration
`ASSISTANT_PRESETS` (`src/common/config/presets/assistantPresets.ts:38`), 30 entries today.
`presetAgentType: 'wcore'`. Persona markdown under `src/process/resources/assistant/smart-trader/`,
named by `ruleFiles`. Seeded to `<assistantsDir>/builtin-smart-trader.<locale>.md` by
`initStorage.ts:674-723`; add the id to the enabled-by-default allowlist at `:780-792`.

**Prerequisite already landed** (commit `fe0753fc3`): wcore preset assistants were writing their
rules to `extra.presetContext`, which `createWCoreAgent` never persists and `WCoreManager` never
reads — so a wcore assistant created from the `+` menu ran with **no persona at all**. Smart Trader
would have shipped broken and silent. Fixed, with a RED→GREEN test.

### What it does — "don't make me think"
1. **Check what they have.** Its own toolset tells it whether TVControl is connected. Then
   `tv_health_check` (live), `tv_capability_matrix` (per-tool availability table).
2. **Advise + open the browser** to what is missing. TradingView Desktop download; the TC-TIDE
   script page so the user can favourite it. Wayland has never downloaded and installed a
   third-party app and will not start here — it opens the page and walks them through.
3. **Walk the debug-port step.** The single hard precondition: TradingView must be launched with
   `--remote-debugging-port=9222`; relaunching from the Dock does not work. Per-platform commands
   already written in the shipped setup guide.
4. **Watchlist.** ⚠️ `TC-MASTER-WATCHLIST.txt` will NOT import — `watchlist_import` requires
   `{schema_version:1, symbols:[{symbol}]}` JSON (`src/core/watchlist.js:465-470`) and the `.txt` is
   TradingView's own UI-import format [X]. Parse it, chunk to ≤100, `watchlist_add_bulk`. Adds are
   UI-driven per symbol, so 72 tickers is slow and partially failure-prone — report per-symbol
   errors, never claim a clean import.
5. **Indicator — the one unavoidable manual step.** TC-TIDE is published **privately**: reachable
   only at `https://www.tradingview.com/script/7qX9c9mf-TC-TIDE/`, and **not searchable**. There is
   no URL-based add anywhere in TVControl [X] — `indicator_add_from_search` drives TradingView's
   Indicators dialog, which will not list a private script the user has not favourited.

   So the order is fixed and the favourite is mandatory, not a fallback:
   a. `shell.openExternal` the script URL.
   b. Tell the user exactly which control to click — "Add to favourite indicators" on the script
      page. This is the single step the assistant cannot do for them; say so plainly rather than
      letting it look like a failure.
   c. `indicator_search` with query "TC TIDE" and **no `section` constraint**, and report which
      section it actually came back under. TradingView files favourited private scripts under
      Favorites / Invite-only rather than Community Scripts, and I have NOT verified the exact
      label — verifying it means driving the owner's live chart, which is forbidden. Searching
      unconstrained and reading back the real section is both more robust and self-verifying.
   d. `indicator_add_from_search` using the section just observed.
   e. If (c) still returns nothing, the favourite did not take. Say that, and re-open the page.
      Do not silently continue with no indicator on the chart.
6. **Chart.** Symbol, timeframe, indicators — then **ask the user to press Cmd+S**. There is no
   `layout_save` / `layout_create` / `saveChart` in TVControl; grep returns zero [X].
   `state_snapshot` writes a TVControl-local JSON TradingView never sees — do not call that "saved".
7. **Verify itself.** Re-run `tv_health_check` + `chart_get_state` and report what is actually true.
8. **Offer the schedule.**

### Hard constraints
- Never drive the owner's live chart during development.
- `ui_evaluate` stays disabled behind `TV_MCP_ADVANCED=1`. Do not flip it.
- `tv_launch` with `kill_existing: true` would kill a live session and lose unsaved state. Default
  is `false`; keep it.
- The model has **no agent-callable tool to install an MCP server** [X]. `installMcpServers` is an
  internal main-process API. Installing TVControl is a deep-link handoff into the MCP Library detail
  page for `com.ferroxlabs/tvcontrol`, not something the assistant does itself.

### Already shipped, reuse it
TVControl is a **first-party-verified catalog connector**:
`src/renderer/mcp-catalog/entries/com.ferroxlabs-tvcontrol.json`, pinned
`@ferroxlabs/tvcontrol@2.2.2`, verified 2026-08-04, plus a 3-step setup guide at
`guides/com.ferroxlabs-tvcontrol.md` that is most of wizard step 1 already written [X].
`tests/unit/renderer/mcp-library/tvcontrolConnector.test.ts:64-79` pins the argv exactly, because
2.2.1's `bin` answered an MCP `initialize` with "Usage: tv <command>".

---

## 6. Work item E — the morning report routine

### Use the Python chain, NOT the SKILL.md path [X]
Two pipelines exist in `~/dev/tvcontrol/skills/market-open-report`:
- `SKILL.md` (2026-08-05, first commit) — agent + MCP + a **visible foreground** TradingView.
  **Not schedulable**: a hidden TV window makes `Page.captureScreenshot` hang or return a stale
  composited frame that looks like a valid PNG (`HANDOFF-2026-08-11.md:93-99`). Also a hardcoded
  layout id and a manual "name scanner.pine by hand" step.
- **The Python chain (current, 2026-08-09→11)** — stdlib only, Python ≥3.11, no MCP, no
  TradingView, no LLM, no API keys. One network host: `query1.finance.yahoo.com`, 82 requests.

```
cwd: ~/dev/tvcontrol/skills/market-open-report
python3 tools/morning_report.py --tier 1 --slots 20 --json <APP_TMP>/mr.json
python3 tools/brief_html.py <APP_TMP>/mr.json <APP_OUT>/morning-brief.html
```

### Wiring
`routines.json` + `BuiltinRoutinesSeeder.ts`. A routine is a Wayland-shipped cron wrapper around a
bundled workflow, created **DISABLED** (`BuiltinRoutinesSeeder.ts:21-24`), idempotent by
`routineId`, user opts in. That is step 3 of the brief, already designed.

### The failure that matters [X]
`yahoo_data.py:57-58` returns `[]` after 3 attempts; `morning_report.py:104-109` turns that into a
per-row `'error': 'no data'`; `main()` never exits non-zero. **A rate-limited run produces a
well-formed brief listing all 74 names as NO DATA and reports success.** The routine must assert on
content, not the exit code.

Also: no market-calendar awareness (`--end` defaults to today UTC — it will run Saturday and
reprint Friday); `backtests/yahoo-cache/` keys on the end date so it grows ~82 files/day, already at
791; and the documented output path writes into the tvcontrol git repo and would dirty the tree
daily — hence the app-owned folder decision.

---

## 7. Build order

1. **A** engine contract pin — smallest, highest value, unblocks a real shipping question.
2. **B** MCP tool counts — small, and Smart Trader step 1 depends on the signal.
3. **C** concierge diag sections.
4. **D** Smart Trader.
5. **E** the routine.

Guardrails throughout: no merge/tag/release/PR; never commit
`src/process/services/constitution/constitutionFsAuthority.generated.ts`; never `git add -A src`;
no AI attribution in commits; never relax a test to make something pass.
