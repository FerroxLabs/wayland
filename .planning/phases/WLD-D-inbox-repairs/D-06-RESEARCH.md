# Phase WLD-D (D5) — UI Clarity Batch — Research

**Researched:** 2026-07-24
**Domain:** Electron renderer UI (React + Arco + i18next), display-only clarity fixes
**Confidence:** HIGH (all four root causes verified at file:line in this worktree, HEAD `4d1c7c7793`)

## Summary

Four small GitHub issues, all desktop-only, Core-independent, renderer-side. Every root cause
was traced and confirmed in-tree; none requires a new IPC, a new package, or a Core hook. The
data each fix needs is already present in the renderer — the work is surfacing it, not building
it.

- **#909** the chat header pill (`AgentBadge`) shows the assistant name ("Concierge") and hides
  the runtime ("Wayland Core"), even though the runtime (`backend: 'wcore'`) is already passed to
  the badge. Fix: render the runtime as a muted secondary label inside the same pill.
- **#910** two vocabulary inconsistencies: (a) the same pin action is called **"Pin"** on most
  surfaces but **"Star"/"Starred"** on the Conversations page; (b) the aggregation nav is called
  **"Conversations"** while every unit is a **"Chat"**. Fix (a): align the Conversations page to
  "Pin" by **reusing existing translated keys**. Fix (b): rename the two English-only aggregation
  labels to "Chats" (recommendation — see decision below).
- **#508** the full cost UI already ships (`mission-control/cost/`). Only delta: a compact spend
  indicator in the app top bar (`Titlebar`). The data source (`ipcBridge.cost.listBudgets` →
  `BudgetStatus` with `spentUsd`/`limitUsd`) and the severity/format helpers already exist.
- **#882** conversation tabs render `tab.name` only; add a muted secondary project label. The
  project id is available on `conversation.extra.projectId`; the name resolves via `useProjects()`.

**Primary recommendation:** Build all four as **ONE D-06 packet** with four independent task
groups (no shared files, zero cross-conflict), one cross-audit, one live-verify sweep. Reuse
translated i18n keys throughout; the only genuinely new user-facing string is the #508 pill's
accessible label, and the only product-vocabulary decision needing Sean's nod is "Conversations →
Chats".

<user_constraints>
## User Constraints (from D-CONTEXT.md + HANDOFF)

> There is no separate `CONTEXT.md` for D5; `D-CONTEXT.md` is the milestone-wide context and its
> guardrails are the locked constraints for this packet.

### Locked Decisions / Guardrails
- **LOCAL only** — no push/merge/release/PR without Sean. Never touch
  `/Users/seandonahoe/dev/wayland/app`. Work in
  `/Users/seandonahoe/dev/wayland-worktrees/desktop-integration` on branch
  `worktree-agent-desktop-integration`. [CITED: D-CONTEXT.md:91-92]
- **All four are BUILD, size S**, desktop-only, Core-independent, renderer-side UI. Minimal
  surgical changes; match existing component + test patterns. [CITED: D-CONTEXT.md:21; HANDOFF:104-111]
- **i18n discipline (D-04 lesson):** prefer reusing an existing translated key over adding
  English-only strings; if new user-facing text is unavoidable, flag which locale files need it.
- **American spelling.**
- Each fix stamps its issue number in the plan frontmatter so it auto-closes on merge; a SUMMARY
  is written when the packet is live-test-accepted. Acceptance = Sean + Claude live-test; a green
  Playwright/unit sweep IS acceptance. [CITED: D-CONTEXT.md:12-15]
- Full Factory loop: research → plan → build → independent cross-audit → full unit suite
  (`bun run test:vitest` / `npm test`) + a11y gate (`bun run test:e2e:a11y`) → live-verify → ship.
- **Always `bun run package`, never raw `npx electron-vite build`**; revert
  `src/process/services/constitution/constitutionFsAuthority.generated.ts` after any package build.
  Constitution tests flake under full-suite parallelism (pass isolated) — not a regression.
  [CITED: D-CONTEXT.md:94-97]
- No AI signatures in commits/PRs. gh writes (issue close comments) use FerroxLabs, Sean Writer
  voice, zero em dashes, no backticks in comment bodies, signed "All the best, The Wayland Team".

### Claude's Discretion
- Exact visual treatment of each secondary label (separator vs. subtitle, muted color token).
- Whether the #508 pill hides when no budget is configured (recommended) vs. shows month-to-date
  spend.
- Test file layout (new file vs. extend an existing DOM test) within the established patterns.

### Deferred / Out of Scope
- Any Core-gated behavior (SBX-02 wiring, COW-04 live citations). Not touched here.
- Renaming "Chat" → "Conversation" globally (the inverse of the #910(b) recommendation) — rejected
  as a large, core-CTA-touching change.
- Fixing the pre-existing a11y debt on `AgentBadge` (clickable `div` with no role/tabindex) beyond
  preserving its current accessible content — out of scope for these clarity fixes.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| #909 | Runtime not visible: header pill shows assistant, hides runtime | Root cause at `AgentBadge.tsx:76` (single-line `agentName || backend`); runtime already threaded as `backend:'wcore'` from `ChatConversation.tsx:262`. Fix = render runtime as secondary label. |
| #910 | Label alignment: pin↔Star, Chats↔Conversations | pin/star outlier isolated to Conversations page (`ConversationMenu.tsx:46-47`, `ConversationsListPage.tsx:343`, `ConversationRow.tsx:71,95,98`, `ResumeCard.tsx:68`); reusable translated keys `conversation.history.pin/unpin/pinnedSection` confirmed. "Conversations" labels are English-only defaults. |
| #508 | Compact spend indicator on top bar | Cost UI confirmed built; data source `ipcBridge.cost.listBudgets`→`BudgetStatus{spentUsd,limitUsd,period,scope}`; helpers `budgetSeverity`/`budgetFraction`/`formatUsd` exist; insertion point `Titlebar/index.tsx`. |
| #882 | Project name on conversation tabs | `ConversationTab` interface lacks `projectId`; source is `conversation.extra.projectId`; name via `useProjects()`; render point `ConversationTabView` (`ConversationTabs.tsx:81`). |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| #909 runtime label in chat header | Browser / Renderer | — | Pure presentation; `backend` already in props |
| #910 vocabulary alignment | Browser / Renderer (i18n resources) | — | Display strings + icons only |
| #508 compact spend pill | Browser / Renderer | API (existing `cost.*` IPC, read-only) | Reads existing remote-denied cost providers; no new IPC |
| #882 project label on tabs | Browser / Renderer | — | Derives from `conversation.extra.projectId` already loaded |

All four sit entirely in the renderer. #508's only cross-tier touch is reading the already-shipped,
already-allowlisted `cost.listBudgets` provider — no process/main changes.

## Standard Stack

No new dependencies. Everything uses in-repo modules already imported by neighboring components.

| Module | Purpose | Already imported by |
|--------|---------|---------------------|
| `react-i18next` `useTranslation` | translated labels | every touched component |
| `lucide-react` (`Pin`, `PinOff`, `FolderKanban`/`Folder`) | icons | ConversationMenu, ConversationRow |
| `@/renderer/pages/projects/hooks/useProjects` | project id→name lookup | ConversationsListPage (existing pattern) |
| `@/common` `ipcBridge` (`cost.listBudgets`, `cost.budgetAlert`) | budget data | BudgetsPanel |
| `budgetSeverity` / `budgetFraction` (`mission-control/cost/costChart.ts:109,120`) | severity tier + bar fraction | BudgetsPanel, BudgetBar |
| `formatUsd` (`@/renderer/utils/format/tokens.ts:35`) | `$` formatting | all cost components |
| `BudgetBar` (`mission-control/cost/BudgetBar.tsx`) | optional compact bar | reusable |

**Installation:** none.

## Package Legitimacy Audit

N/A — no external packages installed. Node builtins + in-repo modules only.

## Per-Issue Root Cause + Minimal Fix

### #909 — Runtime pill shows assistant, hides runtime  [VERIFIED: codebase]

**Confirmed render path (the pill the reporter sees):** a `wcore` "Concierge" chat renders via the
local `WCoreConversationPanel` (`ChatConversation.tsx:221`, dispatched at `:578-579`), NOT the
generic ChatLayout at the bottom of the file. The upper-right pill is `AgentBadge`
(`components/agent/AgentBadge.tsx`, `data-testid='agent-badge'`), mounted in the ChatLayout header
at `ChatLayout/index.tsx:274-282`.

**Data source for each label — both already present at the badge:**
- Assistant name: `presetAssistant?.name` = "Concierge", from
  `usePresetAssistantInfo(conversation)` (`ChatConversation.tsx:241,263`).
- Runtime: `backend: 'wcore'` is passed **unconditionally** (`ChatConversation.tsx:262`). ChatLayout
  already knows the friendly name — `NON_ACP_BACKEND_DISPLAY_NAMES = { wcore: 'Wayland Core' }`
  (`ChatLayout/index.tsx:144-146`).

**Root cause:** `ChatLayout/index.tsx:149-155` collapses to a single `displayName`
(`presetAssistant?.name || agentName || … || NON_ACP_BACKEND_DISPLAY_NAMES[backend] || backend`) —
the assistant name **wins and the runtime is only ever a fallback**. `AgentBadge.tsx:76` then renders
one line: `{agentName || backend}` → "Concierge". "Wayland Core" is never shown once an assistant is
loaded. Exactly the reporter's complaint.

**Minimal fix (2 files, display-only):**
1. In `ChatLayout/index.tsx`, compute a `runtimeName` from `backend` using the existing friendly
   resolver chain (`NON_ACP_BACKEND_DISPLAY_NAMES[backend] || ACP_BACKENDS_ALL[backend]?.name ||
   backend`). Pass it to `AgentBadge` as a new optional `runtimeName` prop.
2. In `AgentBadge.tsx`, when `runtimeName` is present AND differs from `agentName`
   (case-insensitive), render it as a muted secondary span inside the same pill (e.g.
   `Concierge` + muted `Wayland Core`, or `Concierge · Wayland Core`). When they are equal (a raw
   wcore chat with no preset assistant — `displayName` would already be "Wayland Core"), render one
   label only, so it never reads "Wayland Core · Wayland Core".

**Why this is the surgical fix:** the runtime is already threaded; no new data, no IPC, no change to
the assistant-name precedence (assistants still lead). The badge remains clickable-to-AssistantSettings
when `assistantId` is set.

**a11y:** set the badge's accessible name to include both, e.g. `aria-label={runtimeName &&
runtimeName !== agentName ? \`${agentName} on ${runtimeName}\` : agentName}` so a screen reader hears
the runtime. Keep `data-testid='agent-badge'`; add `data-testid='agent-badge-runtime'` on the new
span for testability. Do NOT expand scope to fix the pre-existing "clickable div, no role" debt.

### #910 — Label alignment  [VERIFIED: codebase + i18n]

Two independent inconsistencies. **Critical i18n finding:** the `conversations.*` namespace used by
the Conversations page is **English-only** — there is **no `conversations.json` locale file** (only
singular `conversation.json`); every string resolves through the inline `defaultValue`
(`ConversationMenu.tsx:46-47`, `ConversationsListPage.tsx:343`, etc.). So changing those defaults
touches no other locale and creates no drift. [VERIFIED: `find … -name conversations.json` → none]

#### (a) pin vs. "Star" — DECISION: **"Pin" wins**

Evidence that "Pin" predominates and is the source of truth:
- Data model: `isConversationPinned`, `getConversationPinnedAt`, `togglePin`, `pinnedAt` — all "pin".
- Icons: `Pin`/`PinOff` (lucide) on the conversations context menu (`ConversationMenu.tsx:8,43`) and
  project workspace menu (`ProjectWorkspacePage.tsx:349-350`).
- **Translated** keys already say Pin: `conversation.history.pin`="Pin", `.unpin`="Unpin",
  `.pinned`/`.pinnedSection`="Pinned" (`en-US/conversation.json:64-68`) — used by
  `ProjectWorkspacePage.tsx:353-354` and the sidebar/history surfaces.
- **The Conversations page is the lone outlier**, and is even internally inconsistent — its menu uses
  the **Pin icon** with **"Star" text**.

Align the Conversations page to "Pin" by **reusing the existing translated keys** (satisfies the
D-04 lesson — no new strings, translations already exist in all locales):

| File:line | Today | Change to (reuse translated key) |
|-----------|-------|----------------------------------|
| `ConversationMenu.tsx:46-47` | `conversations.menu.unstar`/`.star` → "Unstar"/"Star" | `conversation.history.unpin`/`conversation.history.pin` ("Unpin"/"Pin") |
| `ConversationsListPage.tsx:343` | `conversations.group.starred` → "Starred" | `conversation.history.pinnedSection` ("Pinned") |
| `ConversationRow.tsx:95` | aria `pinned ? 'Unstar' : 'Star'` | "Unpin"/"Pin" |
| `ConversationRow.tsx:71,98` icon | `Star` (lucide) | `Pin`/`PinOff` to match the menu |
| `ResumeCard.tsx:68` icon | `Star` | `Pin` |

Icon swap is included so the vocabulary is consistent visually as well as textually (the reporter's
core complaint is the same action wearing two names). Keep it minimal — only these files.

#### (b) "Chats" vs "Conversations" — RECOMMENDATION: **rename aggregation to "Chats"** (Sean to ratify)

The unit is a **"Chat"** everywhere the user creates or reads one: "New Chat"
(`conversations.list.newButton`), "Recent Chats", "chat history", "No chat history", "Every chat and
session" (`conversations.list.subtitle`). Only the **aggregation** is named "Conversations":
- Sider nav entry: `navItems.tsx` `labelKey:'conversations.siderEntry'`, `defaultLabel:'Conversations'`.
- Page H1: `conversations.list.title` → "Conversations" (`ConversationsListPage.tsx`).

Both are **English-only defaults** (no locale entry), so the change is a clean 2-string rename with no
locale drift. The reporter's argument ("an aggregation should be named the plural of what it
aggregates") plus the app's own predominant "Chat" vocabulary make **"Chats"** the consistent choice.

- **Scope:** `conversations.list.title` "Conversations"→"Chats" and `navItems.tsx` `defaultLabel`
  (+ any `conversations.siderEntry` default) "Conversations"→"Chats". Route path stays `/conversations`
  (internal, not user-facing) — do NOT touch. Leave unrelated "Conversation" strings alone (settings
  label `settings.json:2169`, workflow/export/search contexts) — different surfaces, out of scope.
- **Why flagged for ratify:** this is a visible product-vocabulary call, not a bug fix. It is cheap
  and fully reversible; recommend "Chats" but let Sean confirm at plan/live-test (acceptance model is
  Sean+Claude anyway). If Sean prefers keeping "Conversations", drop only #910(b); #910(a) stands
  independently.

### #508 — Compact spend indicator on the top bar  [VERIFIED: codebase]

**Confirmed already built (do NOT rebuild):** `src/renderer/pages/mission-control/cost/` ships
`CostTab`, `BudgetsPanel`, `CostBreakdown`, `BudgetBar`, `CostTrend`, `useCostAnalytics`;
`BudgetGateModal` lives in `components/cost/`. The remaining delta is exactly the reporter's ask: a
compact spend indicator in the top bar (and/or project page).

**Top-bar component:** `src/renderer/components/layout/Titlebar/index.tsx`. It already renders a
right-side pill (`UpdatePill`, `:354`) and a right toolbar (`app-titlebar__toolbar`, `:387`). Insert
the spend pill in the toolbar (or beside `UpdatePill`).

**Data source (single, cheap, already remote-denied + allowlisted):**
`ipcBridge.cost.listBudgets` (`common/adapter/ipcBridge.ts:3055`; allowlisted
`bridgeAllowlist.ts:378`) returns `BudgetStatus[]` = `Budget & { spentUsd, periodStartMs }`
(`process/services/cost/types.ts:130-133`), i.e. each budget carries its **current-period spend and
limit** — no second round-trip, no `useCostAnalytics` (which fires 6 IPCs and defaults to the wrong
period). Subscribe to `ipcBridge.cost.budgetAlert` (`:3057`) or SWR-poll (BudgetsPanel uses SWR) for
freshness.

**Minimal addition:** a small `SpendPill.tsx` in `Titlebar/`:
- Read `listBudgets`; pick the **global** budget (default seed is `{scope:'global', limitUsd:10,
  period:'month', action:'warn'}` per `BudgetsPanel.tsx`), prefer `period:'month'`.
- Render `formatUsd(spentUsd) / formatUsd(limitUsd)` with severity color via
  `budgetSeverity(spentUsd, limitUsd)` (`costChart.ts:120`) — reuse `Cost.module.css` bar classes or
  a colored dot; optionally a mini `BudgetBar fraction={budgetFraction(spentUsd,limitUsd)}`.
- **When no budget configured:** render nothing (recommended — the reporter's need is budget-runway
  visibility; a "set a budget" nudge is scope creep). Alternative (discretion): month-to-date spend
  with no limit.
- Click → navigate to the Mission Control cost tab (route already exists).

**a11y (important — new interactive element):** the pill is a NEW clickable control, so it MUST be a
real `<button>` with an `aria-label` (e.g. "Monthly spend: $X of $Y") to pass the `button-name` axe
rule in the milestone a11y gate. This is the one place a new user-facing string appears — reuse an
existing `missionControl.cost.*` translated key if one fits, else add under that (localized)
namespace and flag the locale files, or use an English `defaultValue` aria-label. Recommend reusing a
`missionControl.cost.*` key.

### #882 — Project label on conversation tabs (LOWEST priority)  [VERIFIED: codebase]

`ConversationTabs.tsx` renders `tab.name` only: `ConversationTabView` at `:81`
(`<span …>{tabName}</span>`), fed from `openTabs.map(... tabName={tab.name})` at `:602-606`.

**Where the project is available:** the `ConversationTab` interface
(`hooks/ConversationTabsContext.tsx:15-26`) has `id/name/workspace/type/isDirty` but **no
projectId**. The source of truth is `conversation.extra.projectId` (same accessor used by
`ConversationsListPage.getProjectId`). Tabs are built in `openTabImpl`
(`ConversationTabsContext.tsx:120-137`). Name resolution: `useProjects()`
(`pages/projects/hooks/useProjects`) returns `projects` with names.

**Minimal fix (touches the context interface + builder + view + one lookup):**
1. Add `projectId?: string` to `ConversationTab` (`ConversationTabsContext.tsx:15`).
2. Populate it in `openTabImpl` (`:131-136`) from `(conversation.extra as {projectId?:string})?.projectId`.
   (Persisted tabs restored from localStorage lack it until reopened — acceptable graceful
   degradation; note in plan.)
3. In `ConversationTabs` (`:602`), build a projectId→name map from `useProjects()` and pass
   `projectName={map.get(tab.projectId)}` into `SortableConversationTabView`/`ConversationTabView`
   (new optional prop).
4. In `ConversationTabView` (`:71-103`), render `projectName` as a muted secondary label. Reporter's
   mock is inline with a separator: `Read continuity files and … · <PROJECT>`. Use a flex where the
   title truncates (`flex-1 min-w-0 text-ellipsis`, existing) and the project label is `shrink-0`,
   muted, smaller, with its own small max-width — so the **project stays visible even when the title
   truncates** (explicit reporter requirement). Include the project in the existing `title=` tooltip.
   Optionally mirror into the `DragOverlay` label (`:620-628`) — polish, not required.

**a11y:** the project label is decorative text (project name is a proper noun, no i18n key); keep the
tab's existing hover `title`. No new interactive element, no role/name change.

## Architecture Patterns

### Data-flow diagram (per fix)

```
#909  conversation(type=wcore) ─► WCoreConversationPanel ─► ChatLayout
           presetAssistant.name="Concierge" ─┐             (compute runtimeName from backend)
           backend="wcore" ──────────────────┴─► AgentBadge ─► [Concierge · Wayland Core]

#910a  ConversationMenu / ConversationsListPage / ConversationRow / ResumeCard
           t('conversations.menu.star') ──►  t('conversation.history.pin')  (reuse translated)
           Star icon ──► Pin icon

#910b  navItems.defaultLabel + conversations.list.title : "Conversations" ─► "Chats"

#508   Titlebar ─► SpendPill ─► ipcBridge.cost.listBudgets ─► pick global/month BudgetStatus
           ─► budgetSeverity/budgetFraction/formatUsd ─► [$3.10 / $10]  ─(click)─► cost tab

#882   openTab(conversation) ─► ConversationTab{+projectId from extra.projectId}
           ConversationTabs + useProjects() map ─► ConversationTabView ─► [title · Project]
```

### Recommended structure (files touched)
```
src/renderer/
├── components/agent/AgentBadge.tsx            # #909 render runtime secondary
├── components/layout/
│   ├── Sider/navItems.tsx                      # #910b defaultLabel → "Chats"
│   └── Titlebar/{index.tsx, SpendPill.tsx*}    # #508 new compact pill (*new)
├── pages/conversation/
│   ├── components/ChatLayout/index.tsx         # #909 compute+pass runtimeName
│   ├── components/ConversationTabs.tsx         # #882 render project label + lookup
│   └── hooks/ConversationTabsContext.tsx       # #882 add projectId to tab + openTab
├── pages/conversations/
│   ├── ConversationMenu.tsx                     # #910a Pin/Unpin keys
│   ├── ConversationsListPage.tsx               # #910a "Pinned" group; #910b list.title
│   ├── ConversationRow.tsx                      # #910a Pin icon + aria
│   └── ResumeCard.tsx                           # #910a Pin icon
└── (no new i18n keys except optional #508 aria label)
```

### Anti-patterns to avoid
- **#508:** do NOT add a new IPC or a second cost store; `listBudgets` already carries spend+limit.
  Do NOT pull in `useCostAnalytics` for a compact pill (6 IPCs, wrong default period).
- **#909:** do NOT change the assistant-name precedence or invent a runtime *selector* — the issue
  asks for **visibility**, not a new control. A picker is scope creep.
- **#910:** do NOT add new English-only `conversations.*` keys when translated `conversation.history.*`
  equivalents exist. Do NOT chase every "Conversation" string app-wide — only the two aggregation
  labels.
- **#882:** do NOT persist project *names* on tabs (names change/rename) — store `projectId`, resolve
  the name at render.

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| Budget severity / fraction | custom thresholds | `budgetSeverity`/`budgetFraction` (`costChart.ts`) | Already the app's tiers (≥1 over, ≥0.8 warn) |
| `$` formatting | `toFixed` | `formatUsd` (`utils/format/tokens.ts:35`) | Consistent currency format |
| Runtime friendly name | new map | `NON_ACP_BACKEND_DISPLAY_NAMES` + `ACP_BACKENDS_ALL` (`ChatLayout`) | wcore→"Wayland Core" already defined |
| Pin/Unpin labels | new strings | `conversation.history.pin/unpin/pinnedSection` | Translated in all locales |
| Project name lookup | new IPC | `useProjects()` | Existing hook, already cached |

## Common Pitfalls

### Pitfall 1: #909 fixed in the wrong ChatLayout
The bottom-of-file generic ChatLayout (`ChatConversation.tsx:714`) is NOT the path for a wcore
Concierge chat — that dispatches to `WCoreConversationPanel` at `:578`. The badge lives in
`ChatLayout/index.tsx` (shared), fed by `WCoreConversationPanel`'s props. Fix in `ChatLayout` +
`AgentBadge`, verify with a wcore chat.

### Pitfall 2: #910 "Star" text vs Pin icon inconsistency looks like two bugs
The Conversations context menu already renders the **Pin icon** with **"Star" text**. Aligning text
to "Pin" without swapping the `ConversationRow`/`ResumeCard` `Star` icons would leave the list rows
starred while menus say Pin. Do the text AND the icon in the same pass.

### Pitfall 3: #882 persisted tabs
Tabs are restored from localStorage (`ConversationTabsContext.tsx:67-`). Pre-existing tabs won't have
`projectId` until reopened; the label simply won't show for them. Acceptable; do not write a
migration. New/reopened tabs get the label.

### Pitfall 4: #508 a11y button-name gate
A clickable pill that isn't a `<button>` with an `aria-label` will fail the `button-name` axe rule
in `bun run test:e2e:a11y`. Use a real button with a label from the start.

## Runtime State Inventory

N/A — no rename/migration of stored data. #882 adds an optional field to an in-memory/localStorage
tab shape (backward-compatible; missing field is simply undefined). No datastore keys, service
config, OS registrations, secrets, or build artifacts are affected. Verified: the only persistence
touched is `STORAGE_KEYS.CONVERSATION_TABS` (localStorage), which tolerates the new optional field.

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | "Pin" is the desired winning term for #910(a) | #910(a) | Low — data model + majority + icons all say pin; reversible |
| A2 | "Chats" is the desired aggregation name for #910(b) | #910(b) | Medium — product-vocab call; flagged for Sean's ratify; drop #910(b) only if rejected |
| A3 | Hiding the #508 pill when no budget is configured is acceptable | #508 | Low — discretion; alt is month-to-date spend |
| A4 | Showing runtime as an inline muted suffix (not a two-line subtitle) fits the pill | #909 | Low — visual discretion; both fit |

## Open Questions

1. **#910(b) "Conversations" → "Chats"** — recommend yes; needs Sean's one-word nod at plan or
   live-test. Independent of #910(a).
2. **#508 pill when no budget set** — recommend hide. Confirm with Sean during live-test.
3. **#508 project-page spend** — the reporter also mentioned the project page. Recommend top-bar
   only for this packet (single surface, minimal); project-page spend can be a fast follow if Sean
   wants it. Flag, don't build both unless asked.

## Environment Availability

N/A for #909/#910/#882 (pure renderer). #508 depends on the `cost.*` IPC providers, which are
in-repo and confirmed registered + allowlisted (`ipcBridge.ts:3018,3055,3057`;
`bridgeAllowlist.ts:378`). No external tool/service.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (jsdom) for `*.dom.test.tsx`; Playwright + axe for the a11y gate |
| Config file | `vitest.config.*` (present); `playwright.config.ts` |
| Quick run | `bun run test:vitest <pattern>` (alias `vitest run`) |
| Full suite | `npm test` (`bun run test:vitest && bun run test:bun`) |
| a11y gate | `bun run test:e2e:a11y` (`tests/e2e/specs/accessibility.e2e.ts`, baseline in `a11y/`) |

### Phase Requirements → Test Map
| Issue | Behavior | Type | Command | File |
|-------|----------|------|---------|------|
| #909 | badge shows both assistant + runtime; no dup when equal | unit/DOM | `bun run test:vitest AgentBadge` | ❌ Wave 0 — new `tests/unit/renderer/agent/AgentBadge.dom.test.tsx` (no existing AgentBadge test) |
| #910a | group renders "Pinned"; menu renders "Pin"/"Unpin"; row uses Pin icon | unit/DOM | `bun run test:vitest conversationVocabulary` | ❌ Wave 0 — new `tests/unit/renderer/conversations/conversationVocabulary.dom.test.tsx` |
| #910b | list title + sider label render "Chats" | unit/DOM | same file | ❌ Wave 0 — same new file |
| #508 | pill renders `$spent / $limit` + severity for a mocked global budget; renders nothing when none | unit/DOM | `bun run test:vitest spendPill` | ❌ Wave 0 — new `tests/unit/renderer/titlebar/spendPill.dom.test.tsx` (mock `ipcBridge.cost.listBudgets`) |
| #882 | tab with `extra.projectId` renders resolved project name; none without | unit/DOM | `bun run test:vitest conversationTabsProjectLabel` | ⚠️ extend pattern from `tests/unit/renderer/conversationTabsClose.dom.test.tsx`; new `…conversationTabsProjectLabel.dom.test.tsx` (mock `useProjects`) |
| all | no new axe violations (esp. #508 `button-name`, #909 accessible name) | e2e/a11y | `bun run test:e2e:a11y` | existing `accessibility.e2e.ts` |

### Sampling
- Per task commit: the issue's targeted `bun run test:vitest <pattern>`.
- Per packet: `npm test` (full unit) + `bun run test:e2e:a11y` green; `npx tsc --noEmit` clean.
- Gate: packaged live-verify (`bun run package`, revert the generated constitution file) — confirm
  each of the four in the running app with Sean.

### Wave 0 Gaps
- [ ] `tests/unit/renderer/agent/AgentBadge.dom.test.tsx` — #909 (no existing AgentBadge test)
- [ ] `tests/unit/renderer/conversations/conversationVocabulary.dom.test.tsx` — #910a/#910b
- [ ] `tests/unit/renderer/titlebar/spendPill.dom.test.tsx` — #508 (mock `cost.listBudgets`)
- [ ] `tests/unit/renderer/conversationTabsProjectLabel.dom.test.tsx` — #882 (mock `useProjects`)

## Security Domain

No new attack surface. #508 reads existing read-only, remote-denied, allowlisted `cost.*` providers
(no writes, no new IPC). No auth/session/crypto/input-parsing changes. STRIDE: none applicable beyond
the standard renderer input hygiene already in place (labels are display-only; project name is
already-stored trusted data). No ASVS category is newly engaged.

## Packet Recommendation

**ONE D-06 packet, four task groups (#909, #910, #508, #882).** [Confidence: HIGH]

Reasoning:
- All four are small, renderer-only, Core-independent, and touch **disjoint file sets** (chat header;
  conversations vocabulary; titlebar; conversation tabs) — zero cross-conflict, so no ordering or
  isolation benefit from splitting.
- Splitting into four Factory loops would multiply plan/build/cross-audit/live-verify overhead for
  trivial display changes. One packet = one cross-audit + one live-verify sweep, matching the
  milestone's "minimal, batch the small stuff" posture (the handoff already groups them as the "D5 —
  UI clarity batch").
- None is bigger than "small BUILD" (see per-issue fix boundaries above). **No BLOCKER / re-scope.**
  The only judgment gate is the #910(b) vocabulary call, which is a one-word confirmation, not extra
  build.

**Frontmatter note for the planner:** stamp all four issue numbers so all four auto-close on merge.
The existing plans use a singular `github_issue: NN`. Confirm whether the close tooling accepts a
list (`github_issue: [909, 910, 508, 882]`); if not, keep the primary in frontmatter and close the
remaining three in the ship/merge comment (FerroxLabs voice, no backticks, "All the best, The Wayland
Team"). This is a mechanical ship detail, not a reason to split.

## Sources

### Primary (HIGH — verified in this worktree, HEAD `4d1c7c7793`)
- `AgentBadge.tsx:57-79`, `ChatLayout/index.tsx:144-155,274-282`, `ChatConversation.tsx:221-277,578`
  — #909 render path + data flow
- `ConversationMenu.tsx:8,41-50`, `ConversationsListPage.tsx:339-347`, `ConversationRow.tsx:71,95,98`,
  `ResumeCard.tsx:68`, `ProjectWorkspacePage.tsx:348-355`, `en-US/conversation.json:64-68`,
  `navItems.tsx:71-84` — #910; plus confirmed **no** `conversations.json` locale (English-only defaults)
- `Titlebar/index.tsx:354,387`, `useCostAnalytics.ts`, `BudgetBar.tsx`, `costChart.ts:109-125`,
  `process/services/cost/types.ts:88-133`, `ipcBridge.ts:3018,3055,3057`, `bridgeAllowlist.ts:378`,
  `utils/format/tokens.ts:35` — #508
- `ConversationTabs.tsx:39-127,586-628`, `ConversationTabsContext.tsx:15-26,120-137`,
  `ConversationsListPage.tsx:37-38` (projectId accessor), `pages/projects/hooks/useProjects` — #882
- GitHub issues #909/#910/#508/#882 (fetched via `gh issue view`) — reporter intent

### Secondary / Tertiary
- None required — all claims verified against source.

## Metadata

**Confidence breakdown:**
- Root causes (all four): HIGH — traced to exact file:line in this tree.
- Fix boundaries: HIGH for #909/#508/#882 (data sources confirmed present); HIGH for #910(a)
  (reusable translated keys confirmed).
- #910(b) vocabulary choice: MEDIUM — a product decision (recommend "Chats", Sean ratifies).
- Test plan: HIGH — established Vitest DOM + Playwright/axe patterns; gaps enumerated.

**Research date:** 2026-07-24
**Valid until:** ~2026-08-23 (stable renderer surfaces; re-verify only if the chat header, cost IPC,
or tabs context is refactored).

## RESEARCH COMPLETE

**Phase:** WLD-D (D5) — UI clarity batch — #909, #910, #508, #882
**Confidence:** HIGH

### Confirmed root cause + minimal fix (file:line)
- **#909** — `AgentBadge.tsx:76` renders one line (`agentName || backend`); runtime `backend:'wcore'`
  is already passed (`ChatConversation.tsx:262`) and ChatLayout already knows "Wayland Core"
  (`ChatLayout/index.tsx:144-155`). Fix: compute `runtimeName` in ChatLayout, pass to `AgentBadge`,
  render as muted secondary when it differs from the assistant name. 2 files.
- **#910** — pin/star: align the Conversations page (`ConversationMenu.tsx:46-47`,
  `ConversationsListPage.tsx:343`, `ConversationRow.tsx:71,95,98`, `ResumeCard.tsx:68`) to **"Pin"**
  by **reusing** translated `conversation.history.pin/unpin/pinnedSection` + swapping `Star`→`Pin`
  icons. Chats/Conversations: rename the two English-only aggregation labels
  (`conversations.list.title`, `navItems.tsx` defaultLabel) "Conversations"→"Chats".
- **#508** — cost UI already built; add a compact `SpendPill` in `Titlebar/index.tsx` reading
  `ipcBridge.cost.listBudgets` (`BudgetStatus{spentUsd,limitUsd}`) with existing
  `budgetSeverity`/`budgetFraction`/`formatUsd`. No new IPC. Must be a real `<button>` + aria-label.
- **#882** — `ConversationTabs.tsx:81` renders `tab.name` only; add `projectId` to `ConversationTab`
  (`ConversationTabsContext.tsx:15`), populate in `openTabImpl` (`:131`) from `extra.projectId`,
  resolve name via `useProjects()`, render a muted secondary label that survives title truncation.

### Vocabulary decision (#910)
- **pin vs star → "Pin"** (data model, icons, and the majority of translated surfaces already say
  Pin; the Conversations page is the lone, internally-inconsistent outlier). Reuse existing keys.
- **Chats vs Conversations → "Chats"** for the aggregation (recommended; Sean to ratify — the only
  product-vocab call). English-only defaults, so no locale drift; drop only #910(b) if rejected.

### Packet recommendation
**ONE D-06 packet, four disjoint task groups.** No BLOCKER; nothing exceeds small BUILD. Splitting
would only multiply Factory-loop overhead. Stamp all four issue numbers in frontmatter (confirm
list-vs-singular close mechanic).

### i18n / a11y notes
- i18n: `conversations.*` is English-only (no locale file) — reuse translated `conversation.history.*`
  for pin labels (no new strings); the "Chats" rename touches only English defaults. Only possibly-new
  user-facing string is the #508 pill aria-label — reuse a `missionControl.cost.*` key if possible.
- a11y: #508 introduces a NEW interactive control → real `<button>` + `aria-label` to pass the
  `button-name` axe rule. #909 must keep the badge's accessible name conveying both assistant +
  runtime. #910/#882 add no interactive elements. Run `bun run test:e2e:a11y` after.

### Per-issue test plan (Vitest DOM + a11y gate)
- #909 → new `AgentBadge.dom.test.tsx` (both labels shown; no dup when equal).
- #910 → new `conversationVocabulary.dom.test.tsx` ("Pinned" group + "Pin"/"Unpin" menu + "Chats" title).
- #508 → new `spendPill.dom.test.tsx` (mock `cost.listBudgets`; `$X / $Y` + severity; empty when none).
- #882 → new `conversationTabsProjectLabel.dom.test.tsx` (mock `useProjects`; label with/without project).
- All → `bun run test:e2e:a11y` + `npm test` + `npx tsc --noEmit`, then packaged live-verify.

### Ready for planning
Research complete. Planner can create the single D-06 packet with four task groups; the only decision
to surface to Sean is #910(b) "Conversations → Chats".
