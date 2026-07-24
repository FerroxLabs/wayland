---
phase: WLD-D-inbox-repairs
plan: D-06
github_issue: [909, 910, 508, 882]
audit: cross-audit-panel
---

# D-06 CROSS-AUDIT PANEL — #909/#910/#508/#882

4-model panel (Codex 5.6 Sol + Gemini 3.1 Pro + Kimi K3 + internal Claude adversarial), each on
`git diff 4d1c7c779..2ddbf09d9`. Raw outputs in scratchpad `xaudit-d06/{codex2,gemini2,kimi}.out`.

## Aggregate verdict: FIX-FIRST
No leg found Critical/High EXCEPT Gemini rated the deep-link sync bug High → FIX-FIRST. Codex added
two robustness findings the internal leg missed. All confirmed real; fixing before packet close.

## Findings to fix (convergence in parens)
1. **Mission Control `?tab=cost` deep-link inert** — `mission-control/index.tsx` `activeTab` is a
   one-shot `useState` from searchParams; clicking SpendPill while Mission Control is already open
   updates the URL but not the tab. (ALL 4 — Gemini High, Codex/Kimi Medium, Claude Low.) Fix:
   `useEffect(() => { const t = searchParams.get('tab'); if (t) setActiveTab(t); }, [searchParams])`.
2. **#909 raw backend id leaked** — `ChatLayout/index.tsx` `runtimeName` falls through to the raw
   lowercase `backend` (e.g. `gemini`, `claude`) when not in the friendly map, so the badge shows
   "Assistant · gemini". (Claude Medium, Kimi Low.) Fix: render the runtime secondary label ONLY when
   the resolver returns a FRIENDLY name; hide it when it would fall through to the raw id.
3. **SpendPill number validation** — `SpendPill.tsx` can render `$NaN` / bad severity on malformed or
   zero-limit budget data. (Codex Medium, Kimi Low.) Fix: require finite `spentUsd`/`limitUsd` and a
   positive `limitUsd` before rendering; otherwise render null.
4. **SpendPill `void mutate()` unhandled rejection** — a transient IPC failure after a `budgetAlert`
   yields an unhandled promise rejection. (Codex Medium.) Fix: `.catch()` the mutate (or disable
   throwOnError).
5. **Restored tabs never acquire `projectId`** — `ConversationTabsContext.tsx` only populates
   `projectId` for NEWLY opened tabs; tabs restored from persistence on upgrade never get it, so
   existing users see no project labels until they reopen each tab. (Codex Medium.) Fix: backfill
   `projectId` during tab restoration (resolve from the conversation's `extra.projectId`/data).
6. **Test rigor** (Codex Low×2, Kimi Low): `spendPill.dom.test.tsx` should assert the localized
   "Total spend" accessible name (not just the dollar amounts); `conversationTabsProjectLabel.dom.test.tsx`
   should assert the close control survives truncation (layout contract).

## Not fixing (out of scope / accepted)
- AgentBadge role-less clickable div (pre-existing a11y debt, not in D-06 scope).
- #882 `useProjects()` per-project count fan-out (perf, bounded, out of v1 scope) — noted for a later
  lighter id→name selector.
