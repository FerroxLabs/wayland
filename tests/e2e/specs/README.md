# Team E2E Specs

> This document is the shared specification for ciwei (testing) and laochui (development). Read it before touching anything.

---

## 1. Understanding What Aion Team Is

**Aion Team is a leader-driven AI team system. Users do not interact with team members directly - users only talk to the leader.**

**The leader itself is an agent whose type can be claude, codex, or gemini.** Each leader type has its own independent dispatch capability. E2E tests must cover all three leader types, not just one.

Real user interaction scenarios:

| What the user wants to do       | What the user actually does                                        |
| ------------------------------- | ------------------------------------------------------------------ |
| Recruit a codex engineer        | Type in the leader chat box: "Add a codex type member named Dev1" |
| Fire a member                   | Type in the leader chat box: "Fire the member named Dev1"         |
| Assign a task to a member       | Type in the leader chat box: "Ask Dev1 to write unit tests"       |
| Internal team communication     | The leader decides autonomously to forward, broadcast, or reply   |

**There is no "Add Member" button in the UI, no "Fire" button. The only thing a user can interact with is the leader's chat input box.**

E2E tests simulate this real user: Playwright opens the app, types natural language into the leader chat box, waits for the leader to reason and act, and verifies that the UI responds correctly.

---

## 2. Core Flow

```
User types natural language into the leader chat box
    → Leader understands the intent
    → Leader calls the corresponding MCP tool (spawn_agent / fire_agent, etc.)
    → Action is executed
    → UI responds (new tab appears / tab disappears / message is displayed)
```

**E2E validates this entire chain. Missing any link means the test is incomplete.**

---

## 3. The Role of invokeBridge

invokeBridge is a test utility, not a user-facing code path. Real users have no idea invokeBridge exists.

**Allowed uses:**

| Scenario                                             | Example                                     |
| ---------------------------------------------------- | ------------------------------------------- |
| **setup**: get teamId, read initial member count     | `invokeBridge(page, 'team.list', ...)`      |
| **assertion**: verify backend state matches the UI   | `invokeBridge(page, 'team.get', { id })`    |

**Forbidden: using invokeBridge to trigger any action** - adding members, firing members, sending messages, etc. must go through the leader chat input box and only through it. If you trigger an action via invokeBridge, you are testing a plain RPC interface, not Aion Team.

---

## 4. Prerequisites for laochui (Development)

**The only allowed values for the allowlist are: `claude`, `codex`, `gemini`. Frontend and backend must be consistent.**

### ✅ Task 1: Allowlist adjustment (completed)

`TEAM_SUPPORTED_BACKENDS` in `src/common/types/teamTypes.ts` is the single source of truth.
`TeammateManager.ts` and `TeamMcpServer.ts` both reference this constant - no separate edits needed.

Current value: `new Set(['claude', 'codex', 'gemini'])` (codebuddy has been removed)

### Task 2: Confirm that all three leader types can add members via MCP (required - notify ciwei of the result)

The lifecycle test will use a team for each of the three leader types to add members via natural language. laochui must confirm that the `spawn_agent` MCP tool call path is unblocked for claude / codex / gemini leaders and fix anything that is not. **The confirmation must be communicated explicitly to ciwei. ciwei will not begin writing tests until receiving a clear "all three leader paths are clear" signal.**

---

## 5. File Structure Rules

### ✅ Correct: one test file, iterate over leader types with `for...of` (different teams)

```ts
// team-agent-lifecycle.e2e.ts
const LEADER_CONFIGS = [
  { leaderType: 'claude', teamName: 'E2E Team (claude)' },
  { leaderType: 'codex', teamName: 'E2E Team (codex)' },
  { leaderType: 'gemini', teamName: 'E2E Team (gemini)' },
] as const;

for (const { leaderType, teamName } of LEADER_CONFIGS) {
  test(`team lifecycle: ${leaderType} leader`, async ({ page }) => {
    // Same logic for each iteration; leaderType / teamName captured via closure
  });
}
```

### ❌ Forbidden: one file per agent type

```
team-claude.e2e.ts    ❌
team-codex.e2e.ts     ❌
team-gemini.e2e.ts    ❌
```

When a new type is added to the allowlist, only update the `LEADER_CONFIGS` array - do not create new files.

---

## 6. Current File Status

| File                          | Responsibility                                                          | Status      |
| ----------------------------- | ----------------------------------------------------------------------- | ----------- |
| `team-create.e2e.ts`          | UI creation flow + create three teams by leader type                    | ✅ Complete |
| `team-agent-lifecycle.e2e.ts` | Parameterized full flow (add + fire), iterating over leader types       | ✅ Complete |
| `team-whitelist.e2e.ts`       | UI dropdown only shows allowlisted agents                               | ✅ Complete |
| `team-communication.e2e.ts`   | User message send flow validation                                       | ✅ Complete |

Deleted incorrect files (used invokeBridge to trigger actions / had one file per type):
`team-add-agent.e2e.ts`, `team-remove-agent.e2e.ts`, `team-multi-agent.e2e.ts`, `team-codebuddy.e2e.ts`

---

## 7. team-agent-lifecycle.e2e.ts Specification

### Preconditions

**The lifecycle test depends on three teams already existing.** You must run `team-create.e2e.ts` first - it is responsible for creating:

- `E2E Team (claude)`
- `E2E Team (codex)`
- `E2E Team (gemini)`

Each test starts with an `expect(team).toBeTruthy()` precondition check; if the team does not exist the test fails immediately and does not pass silently. **Do not auto-create teams inside the lifecycle test** - that is the responsibility of `team-create.e2e.ts`.

### Test Logic

Use `for...of` instead of `test.each` to avoid Playwright parameter-ordering ambiguity:

```ts
const LEADER_CONFIGS = [
  { leaderType: 'claude', teamName: 'E2E Team (claude)' },
  { leaderType: 'codex', teamName: 'E2E Team (codex)' },
  { leaderType: 'gemini', teamName: 'E2E Team (gemini)' },
] as const;

for (const { leaderType, teamName } of LEADER_CONFIGS) {
  test(`team lifecycle: ${leaderType} leader`, async ({ page }) => {
    // [setup] Find the team for this leader type (invokeBridge is allowed here)
    const teams = await invokeBridge<Array<{ id: string; name: string; agents: unknown[] }>>(page, 'team.list', {
      userId: 'system_default_user',
    });
    const team = teams.find((t) => t.name === teamName);
    expect(team).toBeTruthy();
    const initialCount = team!.agents.length;

    // [setup] Navigate to the team page and wait for the leader input to be ready
    await page.locator(`text=${teamName}`).first().click();
    await page.waitForURL(/\/team\//);
    const chatInput = page.locator('textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // [action] Add a member via leader natural language (timestamped name to avoid dirty-data conflicts)
    const memberName = `E2E-member-${Date.now()}`;
    await chatInput.fill(`Add a claude type member named ${memberName}`);
    await chatInput.press('Enter');

    // [assertion] Wait for a new tab to appear in the UI (leader reasoning + MCP call, timeout 60s)
    await expect(page.locator(`text=${memberName}`).first()).toBeVisible({ timeout: 60000 });

    // [assertion] Read state via invokeBridge to confirm (allowed)
    const afterAdd = await invokeBridge<{ agents: unknown[] }>(page, 'team.get', { id: team!.id });
    expect(afterAdd.agents.length).toBe(initialCount + 1);

    // [action] Fire the member via leader natural language
    await chatInput.fill(`Fire the member named ${memberName}`);
    await chatInput.press('Enter');

    // [assertion] Wait for the tab to disappear
    await expect(page.locator(`text=${memberName}`).first()).not.toBeVisible({ timeout: 60000 });

    // [assertion] Read state via invokeBridge to confirm (allowed)
    const afterFire = await invokeBridge<{ agents: unknown[] }>(page, 'team.get', { id: team!.id });
    expect(afterFire.agents.length).toBe(initialCount);
  });
}
```

### Key Design Notes

- **Parameterized by leader type, not member type**: each test corresponds to a team with a specific leader type; what is being validated is the dispatch capability of that leader
- **Use `for...of`, not `test.each`**: Playwright's `test.each` has a different parameter ordering than Vitest, making it easy to write incorrectly; `for...of` with closure capture is clearer
- **Instructions in English**: avoids the app's language setting (Chinese/English) affecting leader comprehension; English is more stable for LLMs
- **memberName with timestamp**: avoids assertion failures caused by a leftover same-named member from a previous failed run
- **initialCount read dynamically**: invokeBridge reads it at the start of each test; it is never hardcoded
- **timeout 60000ms**: the leader requires LLM reasoning + an MCP tool call, so response times are long
- **Wait for chatInput before interacting**: after navigation, wait for the textarea to be visible before filling; otherwise keystrokes may land on a blank page

---

## 8. Key UI Selectors

| Element                  | Selector                                                  |
| ------------------------ | --------------------------------------------------------- |
| Sidebar team entry       | `page.locator('text=E2E Team (claude)').first()`, etc.    |
| Leader chat input box    | `page.locator('textarea').first()`                        |
| Send                     | `.press('Enter')`                                         |
| Agent tab                | `page.locator('text=memberName').first()`                 |
| Team page URL            | `/team/{id}`                                              |

---

## 9. How to Run

```bash
# All team E2E tests (run create first, then lifecycle)
E2E_PACKAGED=1 bun run test:e2e:team

# Only create the three teams (precondition for lifecycle)
E2E_PACKAGED=1 bun run test:e2e:team:create

# Only lifecycle tests
E2E_PACKAGED=1 bun run test:e2e:team:lifecycle

# Only allowlist dropdown tests
E2E_PACKAGED=1 bun run test:e2e:team:whitelist

# Only message send flow tests
E2E_PACKAGED=1 bun run test:e2e:team:comm

# Only test gemini leader (TEAM_AGENT filter, comma-separated values supported)
TEAM_AGENT=gemini E2E_PACKAGED=1 bun run test:e2e:team:lifecycle

# Only test claude + codex
TEAM_AGENT=claude,codex E2E_PACKAGED=1 bun run test:e2e:team

# When creating, only create the gemini team
TEAM_AGENT=gemini E2E_PACKAGED=1 bun run test:e2e:team:create
```

**Environment variables:**

| Variable         | Default                  | Description                                                                                                                                                                                           |
| ---------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `E2E_PACKAGED=1` | unset (local dev mode)   | Start the app from the packaged build under `out/`                                                                                                                                                    |
| `E2E_DEV=1`      | unset                    | Force dev mode (`electron .`)                                                                                                                                                                         |
| `TEAM_AGENT`     | unset (all three run)    | Filter by leader type; comma-separated (`gemini` or `claude,codex`). Filtering is handled centrally in `helpers/teamConfig.ts` and takes effect automatically across all test files via `TEAM_SUPPORTED_BACKENDS` |

In packaged mode the app uses the API keys already configured locally - **no additional setup required**.

**npm scripts overview:**

| Command                   | Description                        |
| ------------------------- | ---------------------------------- |
| `test:e2e:team`           | All `team-*.e2e.ts` files          |
| `test:e2e:team:create`    | Team creation only                 |
| `test:e2e:team:lifecycle` | Lifecycle only (add + fire)        |
| `test:e2e:team:whitelist` | Allowlist dropdown only            |
| `test:e2e:team:comm`      | Message send only                  |

---

## 10. Red Lines (Violations Require Rework - No Exceptions)

1. **Using invokeBridge to trigger any action (add/remove/fire)** → rework
2. **Creating files in the `team-{agentType}.e2e.ts` format** → rework
3. **Testing or mentioning codebuddy** → rework
4. **Writing code before the approach is confirmed** → rework
5. **laochui and ciwei executing in parallel without aligning first** → rework
6. **`TEAM_SUPPORTED_BACKENDS` is not `['claude', 'codex', 'gemini']`** → not done
7. **lifecycle test only creates one team / only tests one leader type** → rework
