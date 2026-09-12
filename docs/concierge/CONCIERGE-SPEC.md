# Concierge — Specification

**Status:** LOCKED for build (one-day mega build: Phase 1 + Phase 2). **Owner:** Concierge CLI
instance (isolated worktree `feat/concierge`). **Repo:** FerroxLabs/wayland (desktop).
**Base:** ferrox/main. **Engineering contract (exact signatures + file-ownership):**
`docs/concierge/CONTRACT.md`.

Concierge is a built-in assistant persona that knows Wayland inside-out and operates it on the
user's behalf. North star: **the everyman who never wanted to become a programmer. Friction is the
enemy.** Concierge is the front door to everything Wayland already does but nobody can find — and
the hands that do it for you.

Two design lodestars, applied literally below:

- **Rory Sutherland** — solve the _perceived_ problem (uncertainty), not the literal one (tokens).
  Defaults are the design. Specificity is a costly-to-fake trust signal.
- **Sean's "it just fucking works"** — zero setup, on by default, in the place you already are;
  never guesses about itself; tells you the truth when something breaks.

---

## 0. Why this exists (the gap)

Wayland ships ~2,105 skills, 70 bundled workflows, ~100 connectable providers, assistants, teams,
scheduled tasks, workflows, and MCP — and the assistant cannot accurately tell a user any of it,
because the model has no structured view of its own product. Ask "what can you do?" and it
guesses. Concierge closes that gap, then extends from "tell me" to "do it for me."

## 1. Prior art: how AionUI's "butler" works (what to copy, what to skip)

Verified against AionUI source + public docs. **The AionUi Butler shipped in AionCore v0.1.31** as
an ordinary built-in assistant ("looks like a regular assistant"). It is **not** a special model,
agent runtime, or bespoke UI — it is declarative assets: a persona/routing system-prompt plus
three skills that document and drive a control API, across three plain-language domains:

1. **Configure (write)** — create/edit assistants, attach skills, manage MCP servers + LLM
   providers, change app/UI settings, all by asking.
2. **Diagnose (read-only)** — inspects conversations, logs, and the health of providers, scheduled
   tasks, teams, and MCP connections to tell you _what went wrong_.
3. **Remote** — one-click public link via an automatic Cloudflare tunnel; verifies the link works
   before handing it over.

**Critical architectural finding:** the Butler's brain lives in **AionCore — a separate closed
backend binary**, not the AionUI frontend (which only ships client-side `/api/*` call defs in
`ipcBridge.ts`). AionUI's control plane is an **unauthenticated localhost HTTP server**, and
`GET /api/providers` returns API keys in **plaintext**. Guardrails are prompt-level only. Remote is
a single shared-password ephemeral tunnel.

**Copy:** the _pattern_ (persona + routing × skills over a config/diag surface) and the _one_ good
UX instinct — _verify the action worked before handing it back_. **Beat them where it counts:**
Wayland already has these as **in-process services** (`SkillLibrary`, `modelRegistryIpc`,
scheduler, MCP) — so we **never stand up a loopback HTTP control plane**, eliminating that entire
vulnerability class. We do diagnostics + config with **real consent** (existing tool-confirmation
flow), **secret hygiene** (keychain storage, redaction to last-4, never returned in plaintext), and
treat remote as a _designed-in, dependency-sequenced_ capability — not a gimmick.

## 2. Wayland foundation (already exists — build on it)

Integration points re-verified live on this base (see `CONTRACT.md` for exact signatures):

- **Skills index** — `src/process/services/skills/SkillLibrary.ts` (singleton `getInstance()`;
  `list(filter?)`, `get(name)`, `stats(filter?)`). ~2,105 entries of type
  `skill | workflow | agent-profile`; 70 bundled workflows via `loadBundledWorkflows()`.
- **Model/provider catalog** — `src/process/providers/ipc/modelRegistryIpc.ts`:
  `getProviderCatalog()` is a **direct main-callable export** (~100 providers); curated models per
  agent via the function behind `curatedForAgent`.
- **System-prompt assembly (bundled Fuigo engine)** — `src/process/task/agentUtils.ts`
  `buildSystemInstructionsWithSkillsIndex(config: FirstMessageConfig)`. Block order:
  presetContext → skills index → team guide → workflow protocol, then `composePrompt` prepends the
  Constitution.
- **System-prompt assembly (ACP agents: Claude Code / Codex)** — same file,
  `prepareFirstMessageWithSkillsIndex(content, config)` wraps the composed instructions in a
  `[Assistant Rules ...]` block (deliberately not XML-tagged so external CLIs honor it).
- **Per-turn skill retrieval (BM25)** — `agentUtils.ts` `buildTurnSkillContext(userText, opts?)`
  already ranks + auto-loads relevant skills per turn, in BOTH backends. **This is the lever that
  makes self-knowledge omnipresent without a token tax.**
- **Constitution / persona overlay** — `src/process/services/constitution/composePrompt.ts`
  (`composePrompt({ assistantId, basePrompt })`; per-assistant overlay from
  `~/.wayland/specialists/<assistantId>.md`).
- **Assistant presets** — `src/common/config/presets/assistantPresets.ts` (`ASSISTANT_PRESETS`);
  runtime ids are `builtin-<id>`.
- **Assistant home surface** — `src/renderer/pages/guid/GuidPage.tsx` + intent system
  (`intents.ts`, `IntentPillBar`, `IntentSuggestionPanel`), `LaunchpadBar`, `useGuidAgentSelection`.
- **Built-in MCP server pattern** — `src/process/resources/builtinMcp/searchSkillsServer.ts`
  (precedent for exposing capabilities to any backend agent as MCP tools — the Phase-2 mechanism).
- **Confirmation / approval flow** — reuse the existing tool-confirmation flow for ALL Phase-2
  mutations (no new consent path).
- **Main-process config** — use **`ProcessConfig`**, never renderer `ConfigStorage` (it hangs from
  main).

## 3. Naming & persona

Name is **Concierge** everywhere (user label, assistant id `concierge`, runtime `builtin-concierge`,
skill ids `concierge-*`, MCP servers `concierge-diag` / `concierge-config`). Same persona across
both phases — Phase 1 gives it knowledge, Phase 2 gives it hands. **Persona discipline (locked):**
warm, plain-English, zero jargon; **answer first**; real specifics from the live install; end with
**exactly one** concrete next step framed as an offer. In Phase 1 the offer guides; in Phase 2 the
_same_ offer becomes a one-click action. The answer's shape never changes — only the verb behind it
flips from "here's how" to "done."

---

## DESIGN DECISIONS (locked — these supersede the old "open questions")

1. **Self-knowledge everywhere, paid for nowhere.** Do NOT statically inject the manifest per
   assistant. Concierge carries the always-on live manifest; **every other assistant and every
   backend** gets it _intent-triggered_ via `buildTurnSkillContext` (capability-shaped turns only:
   "what can you do / how do I / can Wayland…"). Idle turns cost ~0 tokens; no user toggle.
2. **Concierge is the default front door** — the pre-selected landing persona on the home, gated by
   a reversible setting `concierge.defaultPersona` (default ON). Also pinned first in the launchpad
   - assistant list. You arrive on it; you never hunt for it.
3. **Proactive, live-state starter prompts.** A "What can Wayland do?" affordance whose suggestions
   are generated from live state (connected providers, whether anything is scheduled, skill counts)
   — specific and costly-to-fake, not a static FAQ.
4. **Every answer ends in a door** — the Phase-2 bridge is built into the Phase-1 answer format now.
5. **Diagnostics first in Phase 2** (read-only, redacted) — highest trust, lowest risk; the honesty
   anchor for "it just works."
6. **Security designed-in, sequenced by dependency.** Guarded built-in MCP (in-process, no loopback
   HTTP); every mutation through the existing confirmation flow with a diff/summary; secrets
   keychain-stored, redacted to last-4, never returned. Remote access designed correctly
   (explicit user toggle, consented session, honest caveats, verify-before-handover) and built last
   because it sits on this foundation — **not vaguely deferred.**
7. **Reviewable delivery.** Phase 1 and each Phase-2 sub-phase land as their own commits/PR-ready
   slices even within the one-day build.

---

## PHASE 1 — Self-knowledge ("What can Wayland do? How do I do X?")

**Goal:** Concierge — and any assistant/backend on a capability-shaped turn — answers capability and
how-to questions accurately, grounded in live product data, in native chats AND through ACP agents.

### 1.1 Capabilities manifest service (new) — `src/process/services/capabilities/CapabilitiesManifest.ts`

- `buildCapabilitiesManifest(opts): Promise<string>` — compiles a COMPACT, accurate summary from
  live sources at call time (never a static blurb): skills total + top categories
  (`SkillLibrary.stats()`/`list()`), workflows count + names, connected providers + a few
  representative models (`getProviderCatalog()` + curated), headline features (assistants, teams,
  scheduled tasks, workflows, MCP, projects).
- Output is short and **token-bounded** (target a few hundred tokens; assert an upper bound).
- `opts`: `{ includeSkills?, includeWorkflows?, includeModels?, agentKey? }`.
- Cache with cheap invalidation (skills index already lazy-loaded; recompute when catalog changes).
- **Main-process: read config via `ProcessConfig`, never `ConfigStorage`.**

### 1.2 Injection (both backends) — `agentUtils.ts` (single-owner edit)

- Add optional `capabilitiesManifest?: string` to `FirstMessageConfig`; inject in BOTH
  `buildSystemInstructionsWithSkillsIndex` (native) and `prepareFirstMessageWithSkillsIndex` (ACP),
  after the skills index / team guide and before the workflow protocol.
- **Concierge: always on.** Other assistants/backends: intent-triggered via `buildTurnSkillContext`
  (decision #1) — a capability-intent detector surfaces the manifest + concierge skill only on
  capability-shaped turns.

### 1.3 Concierge how-to skill (new) — bundled `concierge` SKILL.md

Documents Wayland's own features + concrete "how do I…" answers (connect a provider, create an
assistant, build/launch a workflow, set up a team, schedule a task, connect an MCP server, switch
models / use Flux Auto). Authored so the existing BM25 retrieval surfaces it on intent. Answers
follow the persona format (answer-first → one offer).

### 1.4 Concierge assistant definition (new) — `ASSISTANT_PRESETS` entry `concierge`

Register a built-in `concierge` preset (persona system-prompt markdown in its resource dir +
routing). Persona per §3. Routing (Phase 1): capability/how-to → answer from manifest + concierge
skill. Pinned first; default landing persona behind `concierge.defaultPersona`.

### 1.5 UI surface (home) — reuse existing primitives

- **"What can Wayland do?" affordance** on `GuidPage` (intent pill + a live-state suggestion panel
  that reads connected providers / scheduled state / counts via existing renderer IPC).
- **Concierge as default landing persona** (reversible setting) + **pinned first** launchpad card +
  assistant-list entry. No bespoke chat UI — uses existing assistant rendering.
- All user-facing text via a new `concierge` i18n module.

### 1.6 Phase 1 non-goals

- No new model/agent runtime — Concierge runs on the normal engine path.
- Do not dump the full skills index into context — summary only.

### 1.7 Phase 1 acceptance

- Bundled Fuigo engine chat AND a Claude Code/Codex ACP chat: "what can you do?" returns an accurate
  summary (real skill/workflow counts, real connected providers); "how do I connect Claude /
  schedule a task?" returns correct steps + one offer.
- Default home lands on Concierge (with setting ON); pill surfaces live-state suggestions.
- No measurable turn-latency regression; manifest stays token-bounded.
- Unit tests: manifest builder (shape, counts, token bound), injection presence at both points +
  intent-trigger gating, concierge-skill retrieval on representative queries, preset registration,
  default-persona setting behavior, live-suggestion component.

---

## PHASE 2 — The full Concierge (diagnostics → config → remote)

Delivered as **guarded Wayland built-in MCP servers** (same pattern as `searchSkillsServer`) so ANY
backend agent can call them. Security-first is the differentiator vs AionUI. Each sub-phase is an
independently reviewable slice.

### 2a — Diagnostics (read-only) — DO FIRST — `concierge-diag` built-in MCP server

Read-only tools, bounded output, **secrets never returned (last-4 only)**:

- provider/model health + connection status,
- "why didn't my scheduled task run" (read scheduler state / run history),
- "MCP connected but 0 tools" inspection (read MCP connection status + tool counts),
- recent errors / relevant logs (redacted).
  Highest value, lowest risk — AionUI's most differentiated capability, done safely.

### 2b — Conversational configuration (mutating) — `concierge-config` built-in MCP server

Mutating tools — add a provider + API key, set default model, create/edit an assistant,
add/configure an MCP server. **Security requirements (HARD):**

- Every mutation routes through the EXISTING tool-confirmation/approval flow — explicit user yes,
  never silent; no new bypass path.
- Never echo secrets in plaintext (input or output); store via the existing keychain/secret store.
- In-process/IPC control path only — **no open loopback HTTP** (unlike AionUI).
- Destructive/overwrite actions require an explicit confirm with a **diff/summary** of the change.
- After applying, **verify** and report the result (the one AionUI UX instinct worth copying).

### 2c — Remote access — designed-in, built last

Behind an explicit user-flipped toggle; consented session; honest caveats; verify-before-handover.
Architected on the 2a/2b foundation. Ship within the day **only if** 2a + 2b are green and time
remains; otherwise its seams are in place and it is the immediate next slice (not a redesign).

### 2.x Phase 2 acceptance

- Diagnostics tools return correct, redacted state and never mutate.
- Config tools cannot mutate without an explicit user confirmation; no secret is ever returned in
  plaintext; the diff/summary appears for destructive changes; the control path has no open HTTP.
- Works from a native chat and from an ACP agent. Tests cover: each diag tool (read-only +
  redaction), each config tool (confirmation-gated + redaction + keychain store), and an
  integration test that a mutation without confirmation is rejected.

---

## 4. Conventions (this repo — non-negotiable)

- Three process types, never mix APIs: `src/process/` (main, no DOM), `src/renderer/` (no Node),
  `src/process/worker/`. Cross-process via the IPC bridge (`src/preload.ts`).
- UI: `@arco-design/web-react` only (no raw interactive HTML); icons `@icon-park/react` or the
  existing lucide usage on the home; UnoCSS utilities + CSS Modules; semantic color tokens only.
- TS strict, no `any`; prefer `type`; path aliases `@process/* @renderer/* @worker/*`.
- All user-facing text via i18n keys (`bun run i18n:types` + `node scripts/check-i18n.js`).
- Tests: Vitest, `bun run test`, coverage >= 80%. Directory <= 10 children; follow the
  `architecture` skill.
- Commits: `<type>(<scope>): <subject>`. **NEVER add AI signatures.** PRs via the `oss-pr` skill,
  base = ferrox/main, gh account FerroxLabs, push to remote `ferrox`.
- Main-process services use **ProcessConfig**, not renderer ConfigStorage.

## 5. Out of scope

- No changes to the release lanes, the `wl` board, or other instances' work — Concierge is isolated
  in this worktree until Sean lands it. No new model runtime. No telemetry beyond what exists.
- Fuigo (engine repo) changes are NOT expected; flag immediately if any surface requires one.

## 6. Build sequence (one day)

1. Lock spec + `CONTRACT.md` (exact signatures + single-owner file partition).
2. Phase 1 — parallel build of independent units → serial integration of shared files → green gate.
3. Phase 2a diagnostics MCP → tests. 4. Phase 2b config MCP + consent/secret hardening → tests.
4. Phase 2c remote — if green + time remains.
   Each slice working, tested, and independently reviewable. Final: full green gate
   (`bunx tsc --noEmit`, `bun run test`, lint, i18n checks, `prek`) before PR.
