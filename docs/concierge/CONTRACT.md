# Concierge — Engineering Contract (build source of truth)

Read with `CONCIERGE-SPEC.md`. Every build agent MUST follow this. All facts re-verified live on
`feat/concierge`. **Do not re-research these — they are confirmed.**

## Global invariants (apply to EVERY unit)

- TS strict, **no `any`**, prefer `type`. Path aliases `@/* @process/* @renderer/* @worker/*`.
- **Process boundaries:** `src/process/**` = main (no DOM); `src/renderer/**` = renderer (no Node);
  never import across. Cross-process only via `ipcBridge` / `src/preload.ts`.
- **Main-process config: `ProcessConfig` (from `@process/utils/initStorage`), NEVER renderer
  `ConfigStorage`** (it hangs from main). Renderer code uses `ConfigStorage` / `ipcBridge` as usual.
- **UI:** `@arco-design/web-react` only (no raw `<button>/<input>/<select>`); home surface already
  uses `lucide-react` icons — match that locally. UnoCSS utilities + CSS Modules; **semantic color
  tokens only** (`var(--text-0)`, `var(--bg-1)`, `rgb(var(--primary-6))`, etc.) — no hardcoded hex.
- **All user-facing text via i18n** — new `concierge` module (see §I18N). No hardcoded strings.
- **Tests:** Vitest, colocated under `tests/unit/...` mirroring source path. Coverage ≥ 80% for new
  code. Follow the `testing` skill. Run via `bun run test <path>`.
- **Commits:** `<type>(<scope>): <subject>`. **NEVER add AI signatures.** scope = `concierge`.
- Directory ≤ 10 children. New dirs are fine (e.g. `services/capabilities/`).

## FILE OWNERSHIP — single-owner rule (no two agents edit the same file)

SHARED files (exactly one owner each; all edits to that file go through that owner):

| Shared file                                              | Owner unit           | Edit                                                                                                                         |
| -------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `src/process/task/agentUtils.ts`                         | **U2 inject**        | add `capabilitiesManifest?` to `FirstMessageConfig`; inject in native + ACP; capability-intent trigger                       |
| `src/common/config/presets/assistantPresets.ts`          | **U4 preset**        | add `concierge` entry                                                                                                        |
| `src/process/utils/initStorage.ts`                       | **U-INT (me, lead)** | seed `concierge-diag` (+ later `concierge-config`) in `ensureBuiltinMcpServers()`; (preset resource copy is generic—no edit) |
| `src/process/resources/builtinMcp/constants.ts`          | **U-INT (me, lead)** | add `BUILTIN_CONCIERGE_DIAG_*` (+ later CONFIG)                                                                              |
| `src/renderer/pages/guid/GuidPage.tsx`                   | **U6 home-ui**       | mount capabilities panel + default-persona wiring                                                                            |
| `src/renderer/pages/guid/intents.ts`                     | **U6 home-ui**       | (only if adding an intent key)                                                                                               |
| `src/renderer/pages/guid/quickLaunchAnchors.ts`          | **U6 home-ui**       | pin `concierge` first                                                                                                        |
| `src/renderer/pages/guid/hooks/useGuidAgentSelection.ts` | **U6 home-ui**       | default-persona setting                                                                                                      |
| `src/common/config/i18n-config.json`                     | **U7 i18n**          | add `"concierge"` to `modules`                                                                                               |

NEW files: owned solely by the creating unit (disjoint paths → safe to build in parallel).

Integration of SHARED files + the full green gate is done by the lead (me) — agents that own a
shared file return a precise diff/patch description; the lead applies and gates.

---

## PHASE 1

### U1 — Capabilities manifest service (NEW files only)

- Create `src/process/services/capabilities/CapabilitiesManifest.ts`.
- Export: `buildCapabilitiesManifest(opts?: CapabilitiesManifestOptions): Promise<string>` where
  `type CapabilitiesManifestOptions = { includeSkills?: boolean; includeWorkflows?: boolean;
includeModels?: boolean; agentKey?: string }` (all default true except agentKey).
- Sources (main-process, direct calls — NOT ipc):
  - Skills: `SkillLibrary.getInstance().stats()` → `{ total, bySource, pinned, flagged, verified }`
    and `.list({ type })` for top categories (group by `entry.metadata?.category`).
  - Workflows: `SkillLibrary.getInstance().list({ type: 'workflow' })` → count + a few names.
  - Providers/models: `getProviderCatalog()` (direct export from
    `@process/providers/ipc/modelRegistryIpc`) for available; connected providers + representative
    models — read connected state from `ProcessConfig.get('model.config')` (provider list) and, if
    feasible, the curated function behind `curatedForAgent` (else omit models gracefully).
  - Headline features: static list (assistants, teams, scheduled tasks, workflows, MCP, projects).
- Output: COMPACT markdown, **token-bounded**. Export `const CAPABILITIES_MANIFEST_MAX_CHARS = 2400`
  and hard-truncate to it; expose so the test can assert `result.length <= MAX`.
- Add an in-module cache keyed on a cheap signature (skills `stats().total` + providers length);
  export `invalidateCapabilitiesManifestCache()`.
- Must degrade gracefully: any source throwing → that section omitted, never throws to caller.
- TEST `tests/unit/process/services/capabilities/CapabilitiesManifest.test.ts`: mock SkillLibrary +
  getProviderCatalog + ProcessConfig; assert shape (contains real counts), token bound, graceful
  degradation when a source throws, cache hit avoids recompute.

### U2 — Injection (OWNS agentUtils.ts)

- Add `capabilitiesManifest?: string` to `FirstMessageConfig`.
- In `buildSystemInstructionsWithSkillsIndex`: push the manifest block AFTER skills index / team
  guide, BEFORE workflow protocol, only when `config.capabilitiesManifest` is set. Wrap in a clear
  delimiter e.g. `\n## Wayland capabilities (live)\n<manifest>\n`.
- In `prepareFirstMessageWithSkillsIndex`: same manifest included in the composed instructions that
  go into the `[Assistant Rules ...]` block.
- **Capability-intent trigger:** add a small pure helper
  `isCapabilityIntent(userText: string): boolean` (matches "what can you/it/wayland do", "how do i",
  "can wayland/you", "what features", "show me what", etc. — case-insensitive, word-bounded) and a
  helper that, inside the per-turn path (`buildTurnSkillContext` flow / its caller), causes the
  manifest to be built + injected when the active assistant is Concierge OR the turn is a capability
  intent. Keep the manifest-building call OUT of `buildTurnSkillContext`'s hot path unless triggered.
  Expose `isCapabilityIntent` for unit testing.
- Do NOT build the manifest on every turn — only Concierge (always) or capability-intent turns.
- TESTS: `isCapabilityIntent` truth table (positives/negatives); injection presence at both points
  when `capabilitiesManifest` set and absence when unset.

### U3 — Concierge persona + how-to skill (NEW files only)

- Persona: `src/process/resources/assistant/concierge/concierge.md` (en-US). Voice per SPEC §3:
  warm, plain-English, zero jargon, **answer-first**, real specifics, end with **one** offer
  ("Want me to set that up?"). Phase-1 routing: capability/how-to → answer from the live manifest +
  concierge skill; never dump the full skills index. Include guidance to phrase the next step as an
  offer (the Phase-2 bridge). Keep it tight (≤ ~250 lines).
- Provide `concierge.zh-CN.md` as a faithful translation (other locales optional; loader falls back
  to en-US).
- How-to skill `concierge` SKILL.md: authored Claude-style with a description that the BM25
  retriever surfaces on intents like "what can wayland do / how do I connect a provider / create an
  assistant / build a workflow / schedule a task / connect MCP / switch models / Flux Auto". Body:
  concrete step lists for each. Place under the bundled skills set — **U-INT will confirm the exact
  bundled-skills path**; author the content as a single SKILL.md and hand the lead the file to slot
  in. (Default location to mirror: `src/process/resources/skills-library/bodies/skills/<cat>/concierge/SKILL.md`.)
- No test (content asset); retrieval covered by U2/integration.

### U4 — Concierge preset (OWNS assistantPresets.ts)

- Add to `ASSISTANT_PRESETS`:
  ```ts
  {
    id: 'concierge',
    avatar: 'lucide:Concierge',            // verify icon name resolves; fallback 'lucide:Sparkles'
    presetAgentType: 'fuigo',              // bundled Fuigo engine (self-knowledge works natively + ACP)
    category: 'general',
    resourceDir: 'src/process/resources/assistant/concierge',
    ruleFiles: { 'en-US': 'concierge.md', 'zh-CN': 'concierge.zh-CN.md' },
    defaultEnabledSkills: ['concierge'],   // the how-to skill name (match U3)
    nameI18n: { 'en-US': 'Concierge', 'zh-CN': '礼宾助手' },
    descriptionI18n: { 'en-US': '…', 'zh-CN': '…' },   // via i18n source; keep short
    promptsI18n: { 'en-US': [ /* 4–5 starter prompts: "What can Wayland do?", "How do I connect Claude?", "Schedule a daily digest", "Find a skill to…", "Why didn’t my task run?" ] },
  }
  ```
- Runtime id becomes `builtin-concierge` automatically (initStorage). No initStorage edit needed for
  the preset itself.
- TEST: extend/author `tests/unit/...presets...` to assert the concierge entry shape + that ruleFiles
  locales exist + promptsI18n present.

### U6 — Home UI (OWNS GuidPage.tsx, quickLaunchAnchors.ts, useGuidAgentSelection.ts, intents.ts)

- NEW `src/renderer/pages/guid/components/newChatStarter/WaylandCapabilitiesPanel.tsx` (+ `.module.css`):
  a live-state suggestion panel titled via i18n "What can Wayland do?". Reads live state with the
  EXISTING renderer pattern (`useEffect` + `ipcBridge.*.invoke().then()`, or `swr` which is already a
  dep) using: providers → `useModelRegistry()` (`providers`); scheduled tasks →
  `ipcBridge.cron.listJobs.invoke()`; skills → `ipcBridge.fs.listAvailableSkills.invoke()`;
  workflows → `ipcBridge.workflow.findAllActive.invoke()` (best-effort, guard optional chaining).
  Generate 3–5 suggestion rows of type `IntentPrompt` (`{ title, promptText, targetAssistantId }`,
  default `targetAssistantId: 'builtin-concierge'`) conditioned on live state (0 providers →
  "Connect a model"; has providers + no cron → "Schedule a daily digest"; always → "Find a skill out
  of N"). On row click call the SAME handler `handleSelectIntentPrompt` shape used by
  `IntentSuggestionPanel` (selects preset + prefills input). All strings via `t('concierge.*')`.
- Mount it on `GuidPage` in the cold-start (`!showPresetHero`) starter block, near `IntentPillBar`.
  Keep diffs surgical; don't disturb existing intent/launchpad logic.
- Pin Concierge first in `quickLaunchAnchors.ts`:
  `{ id:'concierge', label:'Concierge', sub:'Ask anything', prefill:'', assistantId:'builtin-concierge', lucideIcon:'sparkles' }`
  as the FIRST element (label/sub via the anchor's existing i18n mechanism — match how other anchors
  localize; if anchors use raw strings, keep parity and add keys per existing pattern).
- Default landing persona (REVERSIBLE): in `useGuidAgentSelection.ts` `restoreSavedSelection`, before
  the "first detected engine" fallback, if no saved `guid.lastSelectedAgent` AND
  `ConfigStorage.get('concierge.defaultPersona') !== false` (default ON), set
  `custom:builtin-concierge`. Never override an explicit saved selection. Gate strictly so existing
  users with a saved selection are unaffected.
- TESTS: WaylandCapabilitiesPanel (renders rows per live-state branches via mocked ipc/hooks; row
  click routes); default-persona logic (fresh install → concierge; saved selection → unchanged;
  setting false → not concierge).

### U7 — i18n (OWNS i18n-config.json)

- Add `"concierge"` to `modules` in `src/common/config/i18n-config.json`.
- Create `src/renderer/services/i18n/locales/en-US/concierge.json` with all keys used by U6/preset
  (`concierge.title`, `concierge.whatCanWaylandDo`, `concierge.suggest.connectModel`,
  `concierge.suggest.scheduleDigest`, `concierge.suggest.findSkill`, `concierge.card.label`,
  `concierge.card.sub`, etc. — coordinate exact keys with U6).
- Mirror keys into `zh-CN/concierge.json` (translated) and create empty-but-valid stubs for other
  supported locales OR rely on en-US fallback — match how a recent module (e.g. a single-locale
  module) is handled; do NOT break `node scripts/check-i18n.js`.
- After files exist, lead runs `bun run i18n:types` + `node scripts/check-i18n.js`.

---

## PHASE 2a — Diagnostics MCP (`concierge-diag`) — stdio subprocess, READ-ONLY

- NEW `src/process/resources/builtinMcp/conciergeDiagServer.ts` (factory, mirrors
  `searchSkillsServer.ts` shape) + `conciergeDiagServerEntry.ts` (stdio `McpServer` wrapper +
  `main()`, mirrors `searchSkillsServerEntry.ts`). Tool name e.g. `wayland_concierge_diag`.
- Subprocess constraints: NO Electron APIs, NO main singletons, NO ipcBridge. Read on-disk only:
  - Scheduled tasks: open the cron store read-only (mirror how CronStore locates its SQLite path) →
    report `name, enabled, nextRunAtMs, lastRunAt, lastError`. Answers "why didn't my task run".
  - MCP health: read the config file (same path ProcessConfig writes `mcp.config`) → per server
    `name, enabled, status, toolCount=tools?.length, lastError`. Answers "MCP enabled but 0 tools".
  - Provider/model health: read provider state (connected/error) from the provider store — **state
    only, NEVER creds**; redact any key-like value to last-4.
  - Recent errors/logs: tail relevant log file(s), redacted, bounded.
- Output: bounded JSON; **secrets never returned (last-4 only)**; read-only (no writes anywhere).
- The lead (U-INT) wires registration: `constants.ts` IDs + `ensureBuiltinMcpServers()` seed +
  packaging of the entry script (mirror searchSkills packaging).
- TESTS: factory with a temp SQLite + temp config json fixture → asserts correct diagnosis strings,
  redaction (no full secret in output), and that no write method exists/!is called.

## PHASE 2b — Conversational config — MUTATING — RESOLVED: propose/confirm/apply (NO MCP subprocess)

Mirror the existing, battle-tested **cron propose/confirm/apply** flow. Config mutations do NOT use
an MCP subprocess (a subprocess can't touch Electron safeStorage/secrets) — instead the agent emits a
chat-tag block, the renderer confirms, and MAIN applies. Secrets only ever live in MAIN.

Reuse these proven pieces (read them before building):

- **Propose (agent → block):** mirror `[CRON_PROPOSE]…[/CRON_PROPOSE]`. New tag `[CONCIERGE_PROPOSE]`
  with `kind: 'provider_connect' | 'set_default_model' | 'add_mcp' | 'edit_assistant'` + fields.
  Parser mirrors `src/process/task/CronCommandDetector.ts`; message creation mirrors
  `src/process/task/MessageMiddleware.ts` (new message type `concierge_propose`, state machine
  `pending|processing|accepted|cancelled`). The concierge SKILL.md documents the block format so the
  model emits it from natural language (works for the bundled Fuigo engine AND other ACP agents, same as cron).
- **Confirm card (renderer):** new `ConciergeConfigCard.tsx` mirroring
  `src/renderer/pages/conversation/Messages/components/CronProposeCard.tsx`. Shows a **diff/summary**
  of the change; secrets rendered last-4 only. Yes/Edit/Cancel → `ipcBridge.conciergeConfig.confirmProposal.invoke({ conversationId, msgId, action })`.
- **Apply (MAIN bridge):** new `src/process/bridge/conciergeConfigBridge.ts` mirroring
  `src/process/bridge/cronBridge.ts` (DB lookup + authorization + status guard + atomic
  `processing` transition + emit broadcast). On `accept`, call the REAL write paths **in main**:
  - provider_connect → `connectModelRegistryProvider(providerId, creds)` (exported from
    `@process/providers/ipc/modelRegistryIpc`; encrypts via safeStorage in main).
  - set_default_model → `ProcessConfig.set('fuigo.defaultModel'|'gemini.defaultModel', { id, useModel, accountId })` (MAIN → ProcessConfig, NOT ConfigStorage).
  - add_mcp → read+write `ProcessConfig.get/set('mcp.config', IMcpServer[])`.
  - edit_assistant → `writeAssistantResource('rules', assistantId, content, locale, …)` (from `fsBridge`).
- **Consent is automatic + explicit:** the confirm card IS the approval; never apply without `accept`.
  Never echo secrets in plaintext (input field shows last-4; stored encrypted). Destructive/overwrite
  proposals must show before/after in the card. **After apply, verify and report the result.**
- SHARED files (single-owner = lead/U-INT at integration): `MessageMiddleware.ts`,
  `CronCommandDetector.ts` (or a sibling detector), `ipcBridge.ts` (+ preload), the renderer message
  renderer that maps message type → card. NEW: `conciergeConfigBridge.ts`, `ConciergeConfigCard.tsx`,
  proposal types, tests.
- TESTS: parser truth table; bridge apply for each kind (mock write paths); **a mutation without
  `accept` never calls a write path**; secret redaction in the card payload; cross-backend parse.

---

## Green gate (lead runs before any slice is "done")

`bunx tsc --noEmit` · `bun run test` (≥80% new) · `bun run lint` · `bun run i18n:types` +
`node scripts/check-i18n.js` · `prek run --from-ref origin/main --to-ref HEAD`. Then `oss-pr`,
base `ferrox/main`, remote `ferrox`, gh `FerroxLabs`, no AI signatures.
