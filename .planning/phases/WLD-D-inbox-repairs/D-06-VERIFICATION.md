---
phase: WLD-D-inbox-repairs / D-06
verified: 2026-07-24T12:30:00Z
status: human_needed
score: 5/5 issue goals verified (code-provable); packaged live-verify + #910b ratify pending
behavior_unverified: 1
overrides_applied: 0
github_issue: [909, 910, 508, 882]
behavior_unverified_items:
  - truth: '#508 — clicking the SpendPill while Mission Control is ALREADY open switches the cost tab (deep-link re-sync), not just the URL'
    test: 'In the packaged app open Mission Control (operations tab), then click the Titlebar SpendPill. Confirm the view switches to the Cost tab (not merely the URL changing to ?tab=cost while the tab stays on operations).'
    expected: "The active tab becomes 'cost' when the ?tab query changes while the page is already mounted."
    why_human: 'The fix is a useEffect on searchParams (mission-control/index.tsx:317-320) — statically correct and wired, but no D-06 unit test exercises the URL→tab re-sync state transition; the runtime behavior is only provable in the running app.'
human_verification:
  - test: "Packaged live-verify (batched — the Milestone D acceptance). bun run package (NEVER raw electron-vite build), then revert the regenerated src/process/services/constitution/constitutionFsAuthority.generated.ts. In the running app confirm all four: (#909) a wcore Concierge chat header shows BOTH 'Concierge' and 'Wayland Core'; (#910a) the Conversations page menu/rows/section header read Pin/Unpin/Pinned with Pin icons, no 'Star'; (#508) the top bar shows the compact spend pill for a configured global budget and clicking it opens the Mission Control cost tab (incl. when Mission Control is already open); (#882) a tab opened from a project shows the project label and it stays visible under a long title."
    expected: 'All four surfaces read correctly in the shipped GUI; the SpendPill button passes the button-name axe rule; the #909 badge conveys both labels via its visible secondary span.'
    why_human: 'Packaged-artifact acceptance is the Milestone D acceptance model (Sean + Claude live-test). The axe a11y gate (bun run test:e2e:a11y) needs the packaged app. Do NOT build the packaged app in this verification pass.'
  - test: "#910b product-vocab ratify. On the sider nav entry and the Conversations page H1, confirm 'Chats' reads correctly. Sean ratifies 'Chats' (or rejects → revert only commit 8f713ea04, which is independently revertible)."
    expected: "Sean accepts 'Chats' as the aggregation label, or the single #910b commit is reverted in isolation with zero effect on #910a or the rest of the packet."
    why_human: "This is the one MEDIUM-confidence product-vocab decision in the packet; the plan gates it on Sean's live ratify, not an automated check."
---

# Phase D-06: D5 UI-clarity batch (#909 / #910 / #508 / #882) — Verification Report

**Phase Goal:** Four renderer-only, Core-independent display fixes so each surface reads correctly in the running app — the runtime is visible in the chat header (#909), the pin action wears one name (#910a), the aggregation is named "Chats" (#910b), spend is glanceable on the top bar (#508), and a conversation tab tells you its project surviving title truncation (#882) — with no a11y regression and no new English-only key in a localized namespace.
**Verified:** 2026-07-24T12:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification (HEAD `2f1638e3e`)

## Verdict

**GOAL MET (all five issues)** at the level unit-verification + static analysis can prove, with the batched packaged-GUI live-verify and Sean's #910b "Chats" ratify as the single remaining Milestone D acceptance (expected, not a gap).

Every one of the five issue goals is demonstrably true in the final code and locked by a passing test. All three cross-audit-fix commits landed on top of the build and hold. i18n discipline is clean: the D-06 diff touches ZERO locale/JSON files. I ran the five D-06 test files (23 tests, all pass) and `tsc --noEmit` (exit 0, clean) myself. The full suite (executor-reported 15,671 pass / 1 fail = the known WorkflowDetailModal parallelism flake that passes isolated) is reported-not-reverified per scope.

| #     | Issue                                                     | Verdict                                                                             |
| ----- | --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| #909  | Runtime visible alongside assistant in chat header pill   | **GOAL MET** (code + tests)                                                         |
| #910a | One pin vocabulary on the Conversations page              | **GOAL MET** (code + tests)                                                         |
| #910b | Aggregation label reads "Chats", independently revertible | **GOAL MET** (code + tests); Sean ratify pending                                    |
| #508  | Compact SpendPill in the Titlebar                         | **GOAL MET** (code + tests); deep-link-while-open + a11y gate pending packaged pass |
| #882  | Secondary project label per tab, truncation-safe          | **GOAL MET** (code + tests)                                                         |

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                                                                                                                                                       | Status                                                                      | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **#909** — the badge shows the runtime alongside the assistant when they DIFFER, ONE label when the same (case-insensitive), and NEVER a raw lowercase backend id                                                                                           | ✓ VERIFIED                                                                  | `resolveRuntimeName(backend)` (`runtimeName.ts:25-32`) returns a FRIENDLY name (`NON_ACP_BACKEND_DISPLAY_NAMES[backend]` e.g. `wcore→'Wayland Core'`, or `ACP_BACKENDS_ALL[backend]?.name`) or `undefined` — never the raw id (xaudit finding 2 fix). ChatLayout computes it at `:154` and passes `runtimeName={runtimeName}` into `AgentBadge` at `:277`, keeping `agentName={displayName}` (assistant precedence). `AgentBadge.tsx:78-79` gates the secondary span on `!!runtimeName && runtimeName.toLowerCase() !== primaryLabel.toLowerCase()`; secondary rendered as muted `text-t-tertiary` span `data-testid='agent-badge-runtime'` (`:99`). Proven by `AgentBadge.dom.test.tsx` (both when differ; exactly one when equal case-insensitive `getAllByText(/Wayland Core/i).toHaveLength(1)`; no runtime span for raw/unknown backend).                                                                                                                                                                                                         |
| 2   | **#910a** — pin/star vocabulary aligned to "Pin" reusing existing translated keys (no English-only key in a localized namespace)                                                                                                                            | ✓ VERIFIED                                                                  | `ConversationMenu.tsx:45-47` uses `conversation.history.unpin`/`.pin` with `Pin`/`PinOff` icons; `ConversationRow.tsx:73` pinned indicator = `Pin` icon, `:97-104` action button `aria-label` = `conversation.history.unpin`/`.pin` with `Pin`/`PinOff`; `ConversationsListPage.tsx:343` pinned-group header = `conversation.history.pinnedSection`; `ResumeCard.tsx:68` = `Pin` icon (Star icon gone). All four keys are pre-existing and present in all 12 locale `conversation.json` files (grep: 12/12). Proven by `conversationPinVocabulary.dom.test.tsx`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 3   | **#910b** — aggregation label reads "Chats"; commit `8f713ea04` independently git-revertible (disjoint lines)                                                                                                                                               | ✓ VERIFIED                                                                  | `navItems.tsx:73` `defaultLabel: 'Chats'` (labelKey `conversations.siderEntry`); `ConversationsListPage.tsx:286` `t('conversations.list.title', { defaultValue: 'Chats' })`. `conversations.*` is English-only (no `conversations.json` locale file — only `conversation.json` exists), so a clean default swap with zero locale drift. Commit `8f713ea04` touches only `navItems.tsx`, `SiderSessionsEntry.tsx`, and `ConversationsListPage.tsx` line 286 (title) — DISJOINT from #910a's line 343 (pinnedSection). `git revert --no-commit 8f713ea04` succeeds cleanly (exit 0) → revertible in isolation. Proven by `conversationsAggregationLabel.dom.test.tsx`. Sean ratify pending (human item).                                                                                                                                                                                                                                                                                                                                                 |
| 4   | **#508** — compact SpendPill in the Titlebar reading existing `cost.listBudgets`; a real `<button>` + localized aria-label; hides on no/malformed budget; deep-link switches cost tab even when Mission Control already open; no unhandled mutate rejection | ✓ VERIFIED (deep-link-while-open sub-behavior → see #5 behavior_unverified) | `SpendPill.tsx` reads `ipcBridge.cost.listBudgets` once via SWR (`:43-47`), picks the global month budget (`:61-63`), renders `formatUsd(spentUsd) / formatUsd(limitUsd)` colored by `budgetSeverity` (`:74-91`). Element is a real `<button type='button'>` with `aria-label=`${t('missionControl.cost.totalSpend')}: ${spendText}`` (`:76,79-83`) — reuses the existing localized key, no new i18n. Hides on no budget (`:66`) and on malformed data: non-finite spent/limit OR `limitUsd <= 0` → null (`:72`, xaudit finding 3). `budgetAlert`mutate wrapped`void mutate().catch(() => {})` (`:54`, xaudit finding 4). Mounted in `Titlebar/index.tsx:355`. Deep-link fix: `mission-control/index.tsx:317-320` `useEffect(...)`re-syncs`activeTab`on`searchParams`change (xaudit finding 1). Proven by`spendPill.dom.test.tsx`(renders; null on`[]`; labeled button with "Total spend"; null for limit 0/-5/NaN and NaN spent).                                                                                                                     |
| 5   | **#508 deep-link** — clicking SpendPill while Mission Control is ALREADY open switches the cost tab (state transition)                                                                                                                                      | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED                                              | The `useEffect` on `searchParams` (`mission-control/index.tsx:317-320`) is present and wired and statically correct, but no D-06 unit test exercises the URL→tab re-sync. Routed to packaged live-verify (Human Verification).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 6   | **#882** — secondary project label per tab; no-project tab shows just the name (never "undefined"); truncation-safe (close control survives); restored tabs backfill projectId on reopen                                                                    | ✓ VERIFIED                                                                  | `ConversationTab` gains `projectId?: string` (`ConversationTabsContext.tsx:27`), populated in `openTabImpl` from `conversation.extra.projectId` (`:128,152`). Restored tabs backfill on reopen: `openTabImpl` sets `projectId` on an existing tab when it arrives (`:138-142`, xaudit finding 5). `ConversationTabs.tsx:193` builds `projectNameById = new Map(projects.map(p => [p.id, p.name]))` from `useProjects()` and passes `projectName={tab.projectId ? projectNameById.get(tab.projectId) : undefined}` at `:632` — id stored, name resolved at render (never persisted). `ConversationTabView` renders the label only when `projectName` is truthy (`:96`, so no "undefined") as a `shrink-0 max-w-80px ... text-ellipsis` muted span (`:97-101`); title span is `flex-1 min-w-0` ellipsized (`:93`); the `X` close control is `shrink-0` (`:116-124`). Proven by `conversationTabsProjectLabel.dom.test.tsx` (label with project; survives long title via shrink-0; no label without project; close control shrink-0 survives truncation). |

**Score:** 5/5 issue goals verified (code-provable); 1 behavior_unverified (#508 deep-link-while-open runtime transition, routed to packaged live-verify).

### Cross-Audit Fix Verification (all 3 fix commits landed and hold)

| Xaudit finding                                                    | Fix commit              | Status  | Evidence                                                                                                                                                            |
| ----------------------------------------------------------------- | ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — Mission Control `?tab=cost` deep-link inert when already open | `1c43e3497`             | ✓ HOLDS | `mission-control/index.tsx:317-320` `useEffect` re-syncs `activeTab` on `searchParams`. (Runtime transition = behavior_unverified item #5.)                         |
| 2 — #909 raw backend id leaked ("Assistant · gemini")             | `bf91c2325`             | ✓ HOLDS | `resolveRuntimeName` returns `undefined` (never raw id); `AgentBadge` `showRuntime` guard. Test: "does not render a runtime label for a raw/unknown backend id".    |
| 3 — SpendPill `$NaN` / bad severity on malformed/zero-limit data  | `1c43e3497`             | ✓ HOLDS | `SpendPill.tsx:72` requires finite spent + finite positive limit else null. Test asserts null for 0/-5/NaN limit and NaN spent.                                     |
| 4 — SpendPill `void mutate()` unhandled rejection                 | `1c43e3497`             | ✓ HOLDS | `SpendPill.tsx:54` `void mutate().catch(() => {})`.                                                                                                                 |
| 5 — Restored tabs never acquire `projectId`                       | `2f1638e3e`             | ✓ HOLDS | `ConversationTabsContext.tsx:138-142` backfills `projectId` on an existing tab when it is (re)opened.                                                               |
| 6 — Test rigor (aria name + close-control truncation)             | `1c43e3497`,`2f1638e3e` | ✓ HOLDS | `spendPill.dom.test.tsx` asserts the "Total spend" localized name; `conversationTabsProjectLabel.dom.test.tsx` asserts the close control `icon-X` stays `shrink-0`. |

### Required Artifacts

| Artifact                                                                                        | Expected                                                 | Status     | Details                                                                                            |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `AgentBadge.tsx`                                                                                | Optional `runtimeName`, conditional muted secondary span | ✓ VERIFIED | 108 lines; `runtimeName` prop + `showRuntime` guard + secondary span. Imported/used by ChatLayout. |
| `ChatLayout/index.tsx`                                                                          | Compute + pass `runtimeName`                             | ✓ VERIFIED | `:154` compute, `:277` pass.                                                                       |
| `ChatLayout/runtimeName.ts` (new)                                                               | Friendly-or-undefined resolver                           | ✓ VERIFIED | `resolveRuntimeName` returns friendly name or `undefined`.                                         |
| `ConversationMenu.tsx` / `ConversationRow.tsx` / `ResumeCard.tsx` / `ConversationsListPage.tsx` | Pin vocab + Pin icons via translated keys                | ✓ VERIFIED | All use `conversation.history.*` + `Pin`/`PinOff`.                                                 |
| `navItems.tsx` / `SiderSessionsEntry.tsx`                                                       | "Chats" aggregation label                                | ✓ VERIFIED | `defaultLabel: 'Chats'`.                                                                           |
| `Titlebar/SpendPill.tsx` (new)                                                                  | Labeled `<button>`, guarded, mounted                     | ✓ VERIFIED | 96 lines; mounted at `Titlebar/index.tsx:355`.                                                     |
| `ConversationTabs.tsx` / `ConversationTabsContext.tsx`                                          | `projectId` threading + truncation-safe label            | ✓ VERIFIED | Map from `useProjects()`, render-time resolve, shrink-0 label.                                     |
| 5 new `*.dom.test.tsx` files                                                                    | Test-first coverage                                      | ✓ VERIFIED | 23 tests, all pass.                                                                                |

### Behavioral Spot-Checks

| Behavior                 | Command                            | Result                                                                  | Status                     |
| ------------------------ | ---------------------------------- | ----------------------------------------------------------------------- | -------------------------- |
| 5 D-06 test files        | `npx vitest run <5 files>`         | 5 files, 23 tests passed                                                | ✓ PASS                     |
| Type integrity           | `npx tsc --noEmit`                 | exit 0, clean                                                           | ✓ PASS                     |
| #910b independent revert | `git revert --no-commit 8f713ea04` | exit 0 (clean)                                                          | ✓ PASS                     |
| Full unit suite          | (executor-reported)                | 15,671 pass / 1 fail (known WorkflowDetailModal flake, passes isolated) | ℹ️ reported-not-reverified |

### i18n Discipline

| Check                                                       | Result                                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| Locale/JSON files changed in D-06 diff                      | **NONE** (`git diff --stat 4d1c7c779..HEAD` shows no `locales`/`.json`) |
| #910a keys (`conversation.history.pin/unpin/pinnedSection`) | Pre-existing, present in all 12 locale files                            |
| #508 aria-label key (`missionControl.cost.totalSpend`)      | Pre-existing localized key reused; no new key added                     |
| #910b (`conversations.*`)                                   | English-only namespace (no locale file) — clean default swap            |

**No new English-only key added to a localized namespace across the batch.** (D-04 lesson honored.)

### a11y (static)

- **#508** — `SpendPill` is a real `<button type='button'>` carrying `aria-label` (`SpendPill.tsx:79,82`) → satisfies the `button-name` axe rule statically.
- **#909** — the `AgentBadge` outer element is a role-less `<div>` (`AgentBadge.tsx:82`) and adds NO `aria-label` (would trip `aria-prohibited-attr`); the runtime is conveyed via the VISIBLE secondary `<span>` text, correct per plan.
- The axe gate `bun run test:e2e:a11y` needs the packaged app → **pending the batched packaged pass** (Human Verification).

### Anti-Patterns Found

| File                        | Line | Pattern                                                               | Severity | Impact                                              |
| --------------------------- | ---- | --------------------------------------------------------------------- | -------- | --------------------------------------------------- |
| `ConversationsListPage.tsx` | 339  | Stale `{/* Starred */}` comment above the now-"Pinned" section header | ℹ️ Info  | Cosmetic; comment only, not user-facing. Not a gap. |

No debt markers (TODO/FIXME/XXX), no stub returns, no hollow props found in the touched files.

### Human Verification Required

1. **Batched packaged live-verify (Milestone D acceptance).** `bun run package` (never raw electron-vite build), revert the regenerated `constitutionFsAuthority.generated.ts`, then confirm #909 (both "Concierge" + "Wayland Core"), #910a (Pin/Unpin/Pinned + Pin icons), #508 (spend pill shows + click opens the cost tab, including when Mission Control is already open), #882 (project label survives a long title). Confirms the axe `button-name` + #508 deep-link-while-open runtime transition. **Do NOT build the packaged app in this verification pass.**
2. **#910b "Chats" ratify.** Sean accepts "Chats" or rejects → revert only commit `8f713ea04` (independently revertible, confirmed).

### Gaps Summary

No gaps. All five issue goals are code-provable and locked by passing tests; the three cross-audit fixes landed and hold; i18n and a11y (static) are clean; tsc is clean. The only open items are the batched packaged-GUI live-verify and Sean's #910b product-vocab ratify — both are the expected Milestone D acceptance step, not implementation gaps.

---

_Verified: 2026-07-24T12:30:00Z_
_Verifier: Claude (ferrox-verifier)_
