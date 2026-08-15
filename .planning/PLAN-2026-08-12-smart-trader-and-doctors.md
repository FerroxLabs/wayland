# Smart Trader + the two doctors — plan, 2026-08-12

Everything marked **[X]** was established by reading or running something, not assumed.

---

## 0. The decisions already made (do not relitigate)

| decision                              | answer                                                                                                                                             |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chart save                            | Set everything up programmatically, then tell the user to press Cmd+S. No `state_snapshot`, no keystroke automation.                               |
| TC-TIDE                               | **Published PRIVATELY, direct link only.** Not searchable. The user must open the URL and favourite it first; only then can it be added. See §5.5. |
| Morning report output                 | An app-owned folder, opened each morning. **Never** the documented path.                                                                           |
| Voice thread (earlier, separate work) | Dedicated visible "Voice" conversation, not hidden.                                                                                                |

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

`engine.reachable` (`engineChecks.ts:40`) only confirms the binary returned _a_ version string
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

## 6b. Work item F — bring Concierge up to date

### Correction to an earlier claim in this plan

I wrote that Concierge can diagnose but not act. **That was wrong.** Commit `e52f16a70`
(2026-06-29, the 0.11.7 headliner) is titled "Concierge assistant — knows, diagnoses, acts" and
ships all three:

- **knows** — a live capabilities manifest (real skill/workflow/provider counts) always on
  Concierge's system prompt, surfaced to other assistants only on a capability-intent turn. Kill
  switch: `concierge.capabilityInjection`.
- **diagnoses** — `wayland_concierge_diag`, the read-only stdio MCP server (§1).
- **acts** — `src/common/chat/conciergeConfig.ts`: propose → confirm → apply. The agent emits a
  `[CONCIERGE_PROPOSE]` block, the user confirms an inline card (`ConciergeConfigCard.tsx`), MAIN
  applies on accept. Secrets are entered in the card and travel over in-process confirm IPC — never
  in the chat, the message DB, or the model. Auth + pending-only + atomic-processing guards.

**Consequence for work item D:** `add_mcp` is a real install path. An earlier finding said "the
model has no agent-callable tool to install an MCP server" — true and misleading. It is not a tool
call, it is a proposal. Smart Trader step 1 should propose the TVControl install rather than
deep-linking the user into Settings.

### The upstream comparison is already done

`.planning/research/WLD-J/03-feature-parity.md` §6: "We already have upstream's flagship feature,
under another name." AionUi's Butler (v2.1.20 + v2.1.25 "via chat") vs our Concierge — we have the
engine; **the gap is the affordance**, not the assistant. Ranked TAKE #1, marked ADAPT: contextual
"set this up by chat" entry points beside each manual surface that jump home, select Concierge and
pre-fill the prompt. Believed never built — CONFIRM before scheduling.
Deliberately declined: Butler's Cloudflare-tunnel remote access (`SUMMARY.md:110`).

### F1 — what Concierge does not KNOW

Everything below shipped AFTER 2026-06-29 [X, from `git log e52f16a70..HEAD`]:

| system                                                                                                     | landed             |
| ---------------------------------------------------------------------------------------------------------- | ------------------ |
| Voice, both directions — on-device whisper STT, platform-native TTS, composer voice mode, readiness ladder | Aug lanes          |
| Agent installers — install/uninstall managed ACP agents, receipts, the install band                        | Aug lanes          |
| Constitution / key-ring reclaim                                                                            | Aug lanes          |
| TVControl as a first-class MCP catalog connector                                                           | 2026-08-04         |
| Bundled engine moved to released Core v0.12.26                                                             | 2026-08-08         |
| Core extensions management (#481)                                                                          | 2026-07-11         |
| Per-workspace Chat/Cowork trust axis (#671)                                                                | 2026-07-12         |
| Cron high-frequency guard + overlap skip (#845); routines                                                  | 2026-07-12         |
| Task-completion notifications (#579)                                                                       | 2026-07-12         |
| Assistant export as credential-redacted SKILL.md (#848); workflow portable export (#512)                   | 2026-07-12         |
| Hermes profiles as preset assistants (#851)                                                                | 2026-07-12         |
| Per-chat native agent TUI over a PTY (#645)                                                                | 2026-07-04         |
| Memory edit + delete (#414/#641/#647)                                                                      | 2026-07-04         |
| Persistent per-project workspace (#455); Project History timeline (#180)                                   | 2026-06-30 / 07-04 |
| Skills import + scan + verify (#582)                                                                       | 2026-07-03         |
| Output budget Auto/Fixed (#468); custom model ID per provider (#617)                                       | 2026-06-30 / 07-04 |
| Playwright MCP bundled + auto-enabled (#465)                                                               | 2026-06-30         |
| macOS Computer-Use permission onboarding (#466)                                                            | 2026-06-30         |
| Flux Router precedence over a local Ollama default                                                         | 2026-08-12         |

Open question the swarm is resolving: how much of the manifest is LIVE-computed (the commit claims
real counts) versus prose. Only the prose can go stale — fix the source, not the symptom.

### F2 — what Concierge cannot DO

Current proposal kinds, verified present in `conciergeConfig.ts:39-44`: `provider_connect`,
`set_default_model`, `add_mcp`, `edit_assistant`, `file_bug_report`.

None of them touch a system built in the last two months. Candidates, in value order:

- `install_agent` — the agent-installer band. Highest value: it is the one new system with a real
  install flow and an existing consent surface to mirror.
- `enable_routine` — routines seed DISABLED by design, so "shall I turn it on?" is the natural
  action and it is exactly Smart Trader step 3.
- `configure_voice` — enable speech in/out and pick a provider.
- `enable_skill` / `import_skill` — pairs with the #582 import/scan/verify path.

Every new kind inherits the existing consent boundary: propose → confirm card → main applies. No
write path may run without accept, and no secret may pass through the model. Do not add a kind that
cannot be expressed as a single confirmable card.

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
