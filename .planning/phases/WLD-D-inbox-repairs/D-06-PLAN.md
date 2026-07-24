---
phase: WLD-D-inbox-repairs
plan: D-06
type: execute
wave: D4
depends_on: []
files_modified:
  - src/renderer/components/agent/AgentBadge.tsx
  - src/renderer/pages/conversation/components/ChatLayout/index.tsx
  - src/renderer/pages/conversations/ConversationMenu.tsx
  - src/renderer/pages/conversations/ConversationsListPage.tsx
  - src/renderer/pages/conversations/ConversationRow.tsx
  - src/renderer/pages/conversations/ResumeCard.tsx
  - src/renderer/components/layout/Sider/navItems.tsx
  - src/renderer/components/layout/Titlebar/index.tsx
  - src/renderer/components/layout/Titlebar/SpendPill.tsx (new)
  - src/renderer/pages/conversation/components/ConversationTabs.tsx
  - src/renderer/pages/conversation/hooks/ConversationTabsContext.tsx
  - tests/unit/renderer/AgentBadge.dom.test.tsx (new)
  - tests/unit/renderer/conversationPinVocabulary.dom.test.tsx (new)
  - tests/unit/renderer/conversationsAggregationLabel.dom.test.tsx (new)
  - tests/unit/renderer/spendPill.dom.test.tsx (new)
  - tests/unit/renderer/conversationTabsProjectLabel.dom.test.tsx (new)
autonomous: false
blocking: true
github_issue: [909, 910, 508, 882]
---

> **Source of truth:** `D-06-RESEARCH.md` (all four root causes traced to exact file:line
> at HEAD `4d1c7c7793`, independently re-verified in this worktree during planning — every
> anchor below still holds) and the locked guardrails in `D-CONTEXT.md`. Confidence HIGH on
> all four root causes and fix boundaries; the only MEDIUM item is the #910(b) product-vocab
> call ("Conversations" → "Chats"), which is built as the recommended default and ratified by
> Sean at live-verify. **Do not re-derive the diagnoses — build the four fixes.**
>
> **Auto-close mechanic (confirmed during planning):** no tooling parses the `github_issue`
> frontmatter field — it is documentation. The actual GitHub auto-close happens via `Closes #NN`
> lines in the merge commit / PR body. This packet closes FOUR issues, so the ship step MUST
> carry `Closes #909`, `Closes #910`, `Closes #508`, `Closes #882` (all four) in the merge
> commit body. The frontmatter list records intent for all four; the merge body does the work.

<objective>
**D5 — UI-clarity batch.** Four small, renderer-only, Core-independent display fixes, built as
ONE D-06 packet with four disjoint task groups (research + Sean's "batch the small stuff" posture;
zero cross-file conflict, so splitting into four Factory loops would only multiply overhead). Every
fix surfaces data that is **already present in the renderer** — none needs a new IPC, a new package,
or a Core hook.

- **#909** — the chat header pill (`AgentBadge`) shows the assistant name ("Concierge") and hides the
  runtime ("Wayland Core"), even though `backend:'wcore'` is already passed to the badge
  (`ChatConversation.tsx:262`) and ChatLayout already knows the friendly name
  (`ChatLayout/index.tsx:144-146`). Root cause: `AgentBadge.tsx:76` renders one line
  (`agentName || backend`) and `ChatLayout` collapses everything to a single `displayName` where the
  assistant always wins. Fix: compute a `runtimeName` in ChatLayout, pass it to `AgentBadge`, render
  it as a muted secondary label **when it differs** from the assistant name.
- **#910** — two vocabulary inconsistencies. **(a)** the same pin action is called "Pin" on most
  surfaces but "Star"/"Starred" on the Conversations page (which even pairs the **Pin icon** with
  **"Star" text**). Fix: align the Conversations page to "Pin" by **reusing** the already-translated
  `conversation.history.pin/unpin/pinnedSection` keys and swapping the `Star` icon to `Pin`/`PinOff`.
  **(b)** the aggregation is named "Conversations" while every unit is a "Chat"; rename the two
  English-only aggregation labels to "Chats" — **recommended default, ratified by Sean at live-verify,
  built as its OWN independently-revertible commit.**
- **#508** — the full cost UI already ships (`mission-control/cost/`). Only delta: a compact
  `SpendPill` in the top bar (`Titlebar`) reading `ipcBridge.cost.listBudgets` (one cheap,
  already-allowlisted call that returns `BudgetStatus{spentUsd,limitUsd}`) with the existing
  `budgetSeverity`/`budgetFraction`/`formatUsd` helpers. The pill MUST be a real `<button>` with an
  accessible name (the `button-name` axe rule).
- **#882** (LOWEST) — conversation tabs render `tab.name` only (`ConversationTabs.tsx:81`); the
  `ConversationTab` type has no `projectId`. Add `projectId` (from `conversation.extra.projectId`),
  resolve the name via `useProjects()`, and render a muted secondary project label that **survives
  title truncation**.

Purpose: each of the four surfaces reads correctly in the running app — the runtime is visible, the
pin action wears one name, the aggregation is named for its unit, spend is glanceable, and a tab tells
you its project — with **no a11y regression** and **no new English-only keys in a localized namespace**
(the D-04 lesson).

Output: 11 production edits (1 new file) + 5 new Vitest DOM test files, each task group its own
test-first (RED) → implement (GREEN) atomic-commit pair, proven green on the full unit suite + the
a11y gate + `tsc --noEmit`, and confirmed by a batched packaged live-verify with Sean.

**Scope discipline (explicit):** every fix is display-only and minimal-surgical. Do NOT rebuild the
cost UI (#508), do NOT add a runtime *selector* (#909 asks for visibility, not a new control), do NOT
chase every "Conversation" string app-wide (#910 touches only the two aggregation labels), do NOT
persist project *names* on tabs (#882 stores the id, resolves at render). No push/merge without Sean.
LOCAL only.
</objective>

<tasks>

**Task 1 — #909: runtime visible in the chat header pill (test-first → fix). Commits:
`test(D-06): #909 ...` then `fix(D-06): #909 ...`.**

- **Write the test FIRST (RED). New file `tests/unit/renderer/AgentBadge.dom.test.tsx`** — follow the
  established `*.dom.test.tsx` render pattern (see `tests/unit/renderer/conversationTabsClose.dom.test.tsx`
  for harness shape). Assert, before any production edit:
  1. **Both labels when they differ.** `AgentBadge` with `agentName='Concierge'` and
     `runtimeName='Wayland Core'` renders "Concierge" AND a secondary span
     (`data-testid='agent-badge-runtime'`) containing "Wayland Core".
  2. **One label when equal (case-insensitive).** `agentName='Wayland Core'`, `runtimeName='Wayland Core'`
     renders exactly one label and NO `agent-badge-runtime` span (it must never read "Wayland Core"
     twice).
  3. **Accessible name conveys both.** When they differ, the badge's `aria-label` names both the
     assistant and the runtime; when equal/absent, it names just the assistant.
  RED on today's single-line badge. Commit `test(D-06): #909 ...`.
- **Implement (GREEN).** In `ChatLayout/index.tsx`, compute a `runtimeName` from `backend` by reusing
  the SAME friendly resolver already at `:149-155` (`NON_ACP_BACKEND_DISPLAY_NAMES[backend] ||
  ACP_BACKENDS_ALL[backend]?.name || backend`) — do NOT introduce a new map (`Don't Hand-Roll`). Pass
  it into the `AgentBadge` mount (`:274-282`) as a new optional `runtimeName` prop; leave
  `agentName={displayName}` unchanged so assistant precedence is preserved. In `AgentBadge.tsx`, add
  optional `runtimeName?: string` to the props and replace the single-line render at `:76`: when
  `runtimeName` is present and differs from `agentName` case-insensitively, render the assistant span
  plus a muted secondary span (`data-testid='agent-badge-runtime'`, muted token e.g. `text-t-tertiary`,
  separator per discretion); otherwise render one label only. Set the badge `aria-label` to convey both
  when they differ. Preserve `data-testid='agent-badge'` and the click-to-AssistantSettings behavior;
  do NOT touch the pre-existing clickable-`div` a11y debt (out of scope). Commit `fix(D-06): #909 ...`.
- **Verify:** `bun run test:vitest AgentBadge` green.
- **Done:** a wcore Concierge chat header shows both the assistant and "Wayland Core"; a raw wcore chat
  with no preset assistant shows "Wayland Core" once (never doubled); assistant-name precedence is
  unchanged; the badge's accessible name includes the runtime.

**Task 2 — #910(a): one pin vocabulary on the Conversations page (test-first → fix). Commits:
`test(D-06): #910a ...` then `fix(D-06): #910a ...`.**

- **Write the test FIRST (RED). New file `tests/unit/renderer/conversationPinVocabulary.dom.test.tsx`.**
  Assert the Conversations-page surfaces render pin vocabulary (positive assertions only):
  1. `ConversationMenu` renders "Pin" / "Unpin" (via `conversation.history.pin` / `.unpin`).
  2. `ConversationsListPage`'s pinned-group header renders "Pinned" (via
     `conversation.history.pinnedSection`).
  3. `ConversationRow`'s pin control exposes an accessible name of "Pin" / "Unpin".
  RED on today's "Star" defaults. Commit `test(D-06): #910a ...`.
- **Implement (GREEN).** Swap the four English-only `conversations.*` label lookups to the EXISTING
  translated `conversation.history.*` keys (already present in every locale — no new strings):
  `ConversationMenu.tsx:46-47` `conversations.menu.unstar` / `.star` → `conversation.history.unpin` /
  `conversation.history.pin`; `ConversationsListPage.tsx:343` `conversations.group.starred` →
  `conversation.history.pinnedSection`; `ConversationRow.tsx:95` aria `pinned ? 'Unstar' : 'Star'` →
  the same unpin/pin translated keys. Swap the `Star` lucide icon to `Pin`/`PinOff` to match the menu's
  existing iconography — `ConversationRow.tsx:71` (pinned indicator) and `:98` (action button), and
  `ResumeCard.tsx:68`. Do the text AND the icon in one pass (Pitfall 2: otherwise rows stay "starred"
  while menus say "Pin"). Do NOT touch the `togglePin` / `pinnedAt` data model, and add NO new i18n key.
  Commit `fix(D-06): #910a ...`.
- **Verify:** `bun run test:vitest conversationPinVocabulary` green.
- **Done:** the Conversations page shows Pin / Unpin / Pinned wording with Pin icons across menu, rows,
  section header, and resume card — the one action wears one name.

**Task 3 — #910(b): rename the aggregation to "Chats" (GATED, independently revertible; test-first →
fix). Commits: `test(D-06): #910b ...` then `fix(D-06): #910b ...`.**

- **Independence note:** this is the ONLY product-vocab decision in the packet (MEDIUM confidence,
  Sean ratifies). It is built as the recommended "Chats" default but kept as a STANDALONE commit
  touching only its own two files + its own test, so it can be reverted (or inverted back to
  "Conversations") without touching #910(a) or any other group. It shares `ConversationsListPage.tsx`
  with #910(a) but at a DISJOINT line (the page title `conversations.list.title`, not the pinned-group
  label), so each commit reverts cleanly and independently.
- **Write the test FIRST (RED). New file `tests/unit/renderer/conversationsAggregationLabel.dom.test.tsx`.**
  Assert: the sider nav entry renders "Chats", and the Conversations page H1 (`conversations.list.title`)
  renders "Chats". RED on today's "Conversations" defaults. Commit `test(D-06): #910b ...`.
- **Implement (GREEN).** Change the two English-only aggregation defaults "Conversations" → "Chats":
  `navItems.tsx` `defaultLabel` (and the `conversations.siderEntry` inline `defaultValue`) and
  `conversations.list.title` in `ConversationsListPage.tsx`. Do NOT touch the route path `/conversations`
  (internal, not user-facing). Do NOT touch unrelated "Conversation" strings (settings label,
  workflow/export/search) — different surfaces, out of scope. Because `conversations.*` is English-only
  (no locale file — verified: no `conversations.json`), this is a clean default swap with zero locale
  drift. Commit `fix(D-06): #910b ...`.
- **Gate:** confirmed by Sean at the Task 6 live-verify. If Sean prefers "Conversations", revert only
  this commit — nothing else is affected.
- **Verify:** `bun run test:vitest conversationsAggregationLabel` green.
- **Done:** the nav entry and page title read "Chats" (pending Sean's live ratify), revertible in
  isolation.

**Task 4 — #508: compact SpendPill on the top bar (test-first → feat). Commits:
`test(D-06): #508 ...` then `feat(D-06): #508 ...`.**

- **Write the test FIRST (RED). New file `tests/unit/renderer/spendPill.dom.test.tsx`** — mock
  `ipcBridge.cost.listBudgets`. Assert:
  1. **Renders spend for a configured global month budget.** Given `[{scope:'global', period:'month',
     spentUsd:3.1, limitUsd:10}]`, the pill renders `$3.10 / $10` (via `formatUsd`) with a
     severity-tier class/marker from `budgetSeverity(3.1, 10)`.
  2. **Renders nothing when no budget is configured.** Given `[]`, the component renders null.
  3. **Is a labeled button.** The rendered element is a real `<button>` carrying an `aria-label` that
     conveys the spend and limit (the `button-name` axe rule).
  RED (component does not exist yet). Commit `test(D-06): #508 ...`.
- **Implement (GREEN).** Create `src/renderer/components/layout/Titlebar/SpendPill.tsx`. Read
  `ipcBridge.cost.listBudgets` ONCE (SWR or effect, mirroring `BudgetsPanel`'s SWR usage; optionally
  subscribe to `ipcBridge.cost.budgetAlert` for freshness). Do NOT use `useCostAnalytics` (6 IPCs, wrong
  default period). Pick the global budget (`scope:'global'`, prefer `period:'month'`); if none is
  configured, render null (discretion: the reporter's need is budget-runway visibility, not a "set a
  budget" nudge). Render `formatUsd(spentUsd) / formatUsd(limitUsd)` colored by
  `budgetSeverity(spentUsd, limitUsd)` (reuse `Cost.module.css` severity classes or a colored dot);
  optionally a mini `BudgetBar fraction={budgetFraction(spentUsd, limitUsd)}`. The element MUST be a real
  `<button>` with an `aria-label`; **compose the label from the EXISTING translated key** —
  `` `${t('missionControl.cost.totalSpend')}: ${formatUsd(spentUsd)} / ${formatUsd(limitUsd)}` `` — so
  NO new i18n key is added (`missionControl.cost.*` is a localized 12-locale namespace; adding an
  en-US-only key would repeat the D-04 mistake). If that phrasing proves inadequate for a screen reader,
  the documented fallback is to add ONE interpolated key `missionControl.cost.spendPillAria` to ALL 12
  locale files under `src/renderer/services/i18n/locales/*/missionControl.json` and flag them in the
  SUMMARY — never en-US only. `onClick` navigates to the Mission Control cost tab (existing route). Mount
  the pill in `Titlebar/index.tsx` — the `app-titlebar__toolbar` (`:387`) or beside `UpdatePill` (`:354`).
  Commit `feat(D-06): #508 ...`.
- **Verify:** `bun run test:vitest spendPill` green; the pill is a `<button>` with an `aria-label`.
- **Done:** the top bar shows a compact spend pill for a configured global budget; nothing when none;
  clicking opens the cost tab; the new button passes the `button-name` axe rule (confirmed by the packet
  a11y gate in Task 6).

**Task 5 — #882 (LOWEST): project label on conversation tabs (test-first → feat). Commits:
`test(D-06): #882 ...` then `feat(D-06): #882 ...`.**

- **Write the test FIRST (RED). New file `tests/unit/renderer/conversationTabsProjectLabel.dom.test.tsx`**
  — extend the pattern in `tests/unit/renderer/conversationTabsClose.dom.test.tsx`; mock `useProjects()`.
  Assert:
  1. **Tab with a project shows the project label.** A `ConversationTab` whose `projectId` resolves via
     `useProjects()` renders the project name as a secondary label alongside the title.
  2. **Label survives title truncation.** With a long title, the project label element is still rendered
     (it is `shrink-0`; the title span keeps `flex-1 min-w-0` + ellipsis).
  3. **Tab without a project shows just the name.** A tab with no `projectId` renders the name and no
     project label.
  RED (tabs render `tab.name` only today). Commit `test(D-06): #882 ...`.
- **Implement (GREEN).** Add `projectId?: string` to the `ConversationTab` interface
  (`ConversationTabsContext.tsx:15-26`). Populate it in `openTabImpl` (`:131-136`) from
  `(conversation.extra as { projectId?: string })?.projectId`, alongside the existing `extra?.workspace`
  read (persisted/restored tabs lack it until reopened — acceptable graceful degradation; write NO
  migration, Pitfall 3). In `ConversationTabs.tsx`, build a `projectId → name` map from `useProjects()`
  and pass `projectName={map.get(tab.projectId)}` into `SortableConversationTabView` at the map (`:603`);
  `SortableConversationTabView` (`:108`) forwards `ConversationTabViewProps` to `ConversationTabView`
  (`:54`), so extend `ConversationTabViewProps` with optional `projectName?: string`. In the
  `ConversationTabView` render (`:78-84`), render `projectName` as a muted secondary label — `shrink-0`,
  smaller, muted token, its own small `max-width` + truncate — so the project stays visible even when
  the title truncates (explicit reporter requirement). Include the project in the existing hover
  `title=` tooltip (`:79`). Store the id, resolve the name at render (never persist names — Pitfall 4).
  For reference, `ConversationRow.tsx:74-79` already renders an analogous project chip (`Folder` +
  `project.name`). Commit `feat(D-06): #882 ...`.
- **Verify:** `bun run test:vitest conversationTabsProjectLabel` green.
- **Done:** a tab opened from a project shows "title · Project" with the project surviving title
  truncation; a tab without a project shows just the title.

**Task 6 — Exit bar + a11y gate + batched live-verify (human checkpoint, no code commit).**

- **Automated floor (all green):** `npm test` (full unit suite = `test:vitest` + `test:bun`);
  `npx tsc --noEmit` clean; `bun run test:e2e:a11y` with NO new axe violations — specifically the new
  #508 `SpendPill` passes `button-name`, and the #909 badge's accessible name conveys both assistant and
  runtime. (Constitution tests may flake under full-suite parallelism but pass isolated — not a
  regression, per `D-CONTEXT.md`.)
- **Independent cross-audit** of the diff before any merge. LOCAL only — no push/merge without Sean.
- **Packaged live-verify (orchestrator + Sean, batched — this is the Milestone D acceptance):** build
  the packaged app with `bun run package` (NEVER raw `npx electron-vite build`), then revert
  `src/process/services/constitution/constitutionFsAuthority.generated.ts` (the prepackage step
  regenerates it). In the running app, confirm all four read correctly:
  1. **#909** — open a wcore "Concierge" chat → the header pill shows BOTH "Concierge" and
     "Wayland Core".
  2. **#910(a)** — on the Conversations page, the menu / rows / section header say Pin / Unpin / Pinned
     with Pin icons (no "Star" text or Star icon).
  3. **#910(b)** — the sider nav entry and the page title read "Chats" → **Sean ratifies "Chats" here.**
     If rejected, revert only the `fix(D-06): #910b` commit.
  4. **#508** — the top bar shows the compact spend pill for a configured global budget; clicking it
     opens the Mission Control cost tab.
  5. **#882** — a tab opened from a project shows the project label, and it stays visible when the tab
     title is long.
- **Ship note:** the merge commit / PR body MUST carry all four `Closes #909`, `Closes #910`,
  `Closes #508`, `Closes #882` (the real auto-close mechanic; the frontmatter list is documentation).
- **Verify:** full suite + `tsc --noEmit` + a11y gate green; cross-audit clean; all four confirmed in
  the packaged app.
- **Done:** the four issues read correctly in the shipped GUI; #910(b) ratify recorded; SUMMARY written;
  ready for Sean's ship call.

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| main/process → renderer (#508) | The `SpendPill` reads the existing, read-only, remote-denied, allowlisted `cost.listBudgets` provider; no writes, no new IPC crosses this boundary. |
| stored conversation data → renderer (#882) | The project name is already-stored trusted data resolved via `useProjects()`; the tab carries only a `projectId`, never a name. |

## STRIDE Threat Register

All four fixes are display-only and add no new attack surface (research §Security Domain: no
auth/session/crypto/input-parsing changes; no new package — Package Legitimacy Audit N/A).

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-D06-01 | Information Disclosure | #508 SpendPill surfaces the user's own spend in the top bar | low | accept | Spend/limit is the user's own data, already shown throughout Mission Control; the pill only reads the existing allowlisted `cost.listBudgets`. Hides entirely when no budget is configured. |
| T-D06-02 | Information Disclosure | #882 project name / #909 runtime rendered as labels | low | accept | Both are already-stored, already-displayed trusted data (project chips exist on rows; the backend is already threaded to the badge). No new source, no untrusted input. |
| T-D06-SC | Tampering | supply-chain (new packages) | n/a | accept | No new packages — Node builtins + in-repo modules only (research: Package Legitimacy Audit N/A). |
</threat_model>

<verification>
- Per task group: the issue's targeted `bun run test:vitest <pattern>` green (`AgentBadge`,
  `conversationPinVocabulary`, `conversationsAggregationLabel`, `spendPill`,
  `conversationTabsProjectLabel`).
- Per packet: `npm test` (full unit suite) green; `npx tsc --noEmit` clean; `bun run test:e2e:a11y`
  green with no new violations (esp. #508 `button-name`, #909 accessible name).
- i18n discipline: no new English-only key added to a localized namespace — #910(a) reuses translated
  `conversation.history.*`; #910(b) changes only English-only `conversations.*` defaults; #508 reuses
  `missionControl.cost.totalSpend` for the aria-label (or, if the fallback is used, the new key is added
  to ALL 12 `missionControl.json` locale files and flagged).
- Independence: each of the five task groups is its own test-first → implement commit pair; #910(b) is a
  standalone commit revertible in isolation (shares `ConversationsListPage.tsx` with #910(a) only at a
  disjoint line).
- Packaged live-verify: all four surfaces read correctly in the running app; Sean ratifies #910(b).
- Independent cross-audit of the diff before any merge; LOCAL only, no push/merge without Sean.

**Goal-backward check — each acceptance test maps to its issue's clarity goal:**

| Must be TRUE (clarity goal) | Surface behavior that makes it true | Proven by |
|-----------------------------|-------------------------------------|-----------|
| #909 The user can see which runtime a chat runs on, not just the assistant | ChatLayout computes `runtimeName`; AgentBadge renders it as a muted secondary label when it differs from the assistant | `AgentBadge.dom.test` (both shown when differ; one when equal; aria conveys both) + packaged #909 |
| #910(a) One pin action wears one name everywhere | Conversations page reuses translated `conversation.history.pin/unpin/pinnedSection` + swaps `Star`→`Pin` icons | `conversationPinVocabulary.dom.test` (Pin/Unpin/Pinned) + packaged #910(a) |
| #910(b) The aggregation is named the plural of the unit it aggregates | nav `defaultLabel` + `conversations.list.title` "Conversations" → "Chats" | `conversationsAggregationLabel.dom.test` ("Chats") + Sean live ratify #910(b) |
| #508 The user can see spend runway without leaving their work | `SpendPill` in Titlebar reads `cost.listBudgets`, renders `$spent / $limit`, is a labeled button | `spendPill.dom.test` (renders + empty + button/aria) + a11y `button-name` + packaged #508 |
| #882 The user can tell which project a tab belongs to, even when the title is long | `ConversationTab` carries `projectId`; `ConversationTabView` renders a `shrink-0` project label resolved via `useProjects()` | `conversationTabsProjectLabel.dom.test` (label with/without; survives truncation) + packaged #882 |
| No a11y regression across the batch | new #508 button has an accessible name; #909 badge name conveys both labels | `bun run test:e2e:a11y` green (button-name + accessible name) |
</verification>

<success_criteria>
All four issues read correctly in the packaged app — the runtime is visible in the chat header (#909),
the pin action wears one name with Pin icons (#910a), the aggregation reads "Chats" pending Sean's
ratify (#910b), a compact spend pill is glanceable on the top bar (#508), and a conversation tab shows
its project surviving title truncation (#882). The full unit suite + `tsc --noEmit` + the a11y gate are
green with no new violations. No new English-only key was added to a localized namespace. Each fix is an
independently-revertible commit pair (especially #910b). The merge commit/PR body carries
`Closes #909`, `Closes #910`, `Closes #508`, `Closes #882`.
</success_criteria>

<output>
Write `D-06-SUMMARY.md` when the packet is live-test-accepted, recording: the per-issue implementation
(#909 `runtimeName` compute + secondary-label render; #910a translated-key + icon swaps; #910b the
"Chats" rename and Sean's ratify outcome; #508 the `SpendPill` component + its data source + the
aria-label approach used — reused key or the flagged 12-locale fallback; #882 the `projectId` threading
+ truncation-surviving label); the five new test files and their green results; full-suite + `tsc` +
`bun run test:e2e:a11y` results; the packaged live-verify evidence for each of the four surfaces; the
cross-audit result; and confirmation that the merge commit carried all four `Closes #NNN` lines. Note
whether #910(b) shipped as "Chats" or was reverted per Sean.
</output>
