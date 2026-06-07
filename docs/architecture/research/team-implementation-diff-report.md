# Team Mode Implementation Diff Report

> **Date**: 2026-03-31
> **Subjects analyzed**: Current project (`/Users/you/project/teams`) vs Claude Code reference source (`/Users/you/Downloads/extracted`)
> **Method**: 3 developer agents performed independent analysis + 2 reviewer agents performed cross-adversarial verification
> **Dimensions**: Architecture design, data model, message passing, agent lifecycle, permission system, task management, workspace isolation

---

## 1. Executive Summary

The current project's team mode implements a basic multi-agent collaboration framework (approximately 1500 lines of core code), but compared to Claude Code's mature implementation it has **5 key gaps** and **1 confirmed bug**. The current project also has its own architectural advantages.

### Key Findings

| #   | Finding                                                                                          | Severity          | Type |
| --- | ------------------------------------------------------------------------------------------------ | ----------------- | ---- |
| 1   | acpAdapter's tool_use parsing path is **dead code** - tools definition is never injected to agent | Bug               | P0   |
| 2   | Agent drive model difference: external wake() vs internal while-loop self-drive                  | Architecture gap  | P1   |
| 3   | Permission system: fine-grained team-level control completely absent (sandbox exists at lower layer) | Missing feature | P1   |
| 4   | workspaceMode=isolated is a fake feature - backend has no branch handling for it                 | Missing feature   | P2   |
| 5   | Message protocol has only 3 types (Claude has 10+), no negotiated shutdown                       | Missing feature   | P2   |
| 6   | Task system lacks hooks, TaskOutput, and automatic owner assignment                               | Missing feature   | P2   |

---

## 2. Architecture Comparison

### 2.1 Overall Architecture

| Dimension     | Current Project                                    | Claude Code                              |
| ------------- | -------------------------------------------------- | ---------------------------------------- |
| Runtime       | Electron multi-process (main + renderer + worker)  | CLI single-process + tmux/iTerm2/in-process |
| Dispatch model | **Centralized** -- TeamSession unified dispatch   | **Decentralized** -- file protocol cooperation |
| Communication | IPC Bridge bidirectional                           | Filesystem mailbox + AsyncLocalStorage   |
| UI layer      | React renderer process, IPC-pushed updates         | React Ink terminal UI, AppState-driven   |
| Persistence   | SQLite + Repository Pattern                        | Filesystem JSON                          |

**Cross-adversarial conclusion**: Centralized vs decentralized is a reasonable architecture choice given Electron vs CLI context - not a defect. Each has tradeoffs:

- Centralized: simple, consistent, but single point of failure (acceptable for a desktop app)
- Decentralized: fault-tolerant, scalable, but relies on file locks and consistency is harder to guarantee

### 2.2 Core Module Comparison

```
Current project (OOP layered)         Claude Code (functional modules)
─────────────────────────────        ──────────────────────────────────
TeamSession.ts        ←→             no unified session object
TeammateManager.ts    ←→             inProcessRunner.ts + spawnInProcess.ts
Mailbox.ts            ←→             mailbox.ts (memory) + teammateMailbox.ts (file)
TaskManager.ts        ←→             tasks.ts + TaskCreateTool + TaskUpdateTool
adapters/             ←→             n/a (Claude model only)
repository/           ←→             teamHelpers.ts (file CRUD)
prompts/              ←→             teammatePromptAddendum.ts
                      missing        backends/ (tmux/iTerm2/in-process)
                      missing        permissionSync.ts + leaderPermissionBridge.ts
                      missing        reconnection.ts
```

---

## 3. Confirmed Bug: acpAdapter Dead Code (P0)

### Problem Description

acpAdapter was designed with full tool_use parsing capability, but due to a break in the upstream data flow, **this capability has never taken effect**.

### Evidence Chain

1. **tools definition not injected**: `acpAdapter.buildPayload()` returns a `tools` field, but `TeammateManager.ts:97`'s `sendMessage()` only sends `payload.message`, completely ignoring `payload.tools`
2. **toolCalls not forwarded**: `TeammateManager.handleResponseStream()` (L140-144) only accumulates the `text` field into the buffer
3. **parseResponse receives empty data**: `TeammateManager.handleTurnCompleted()` (L156) constructs `AgentResponse` with only `{ text: accumulatedText }` - **toolCalls field is always undefined**
4. **Falls through to fallback path**: `acpAdapter.parseResponse()` (L128) finds `response.toolCalls` empty and drops into the plain-text regex parser at L176-179

### Impact

- All ACP agent responses actually go through the plain-text fallback, making them functionally identical to xmlFallbackAdapter
- The "multi-LLM adapter" is **a design intention, not a realized advantage**, in its current state

### Files Affected

| File                                      | Line     | Issue                                            |
| ----------------------------------------- | -------- | ------------------------------------------------ |
| `src/process/team/TeammateManager.ts`     | L97      | `sendMessage(payload.message)` discards tools    |
| `src/process/team/TeammateManager.ts`     | L140-144 | Stream handler only accumulates text             |
| `src/process/team/TeammateManager.ts`     | L156     | AgentResponse does not include toolCalls         |
| `src/process/team/adapters/acpAdapter.ts` | L128     | toolCalls check is always falsy                  |

---

## 4. Agent Drive Model Difference (P1)

### Current Project: External wake() Drive

```
User message → lead wake → lead response → executeAction(send_message) → teammate wake → ...
```

- `TeammateManager.wake(slotId)`: triggered by external call, reads mailbox → builds payload → sends to agent → waits for turnCompleted
- Agent **stops completely** when idle; must wait for an external wake call
- Uses `activeWakes` Set to prevent re-entry (single-thread safe)

### Claude: Internal while-loop Self-Drive

```
Agent spawn → while(true) { poll mailbox → process messages → execute tasks → idle wait → ... }
```

- `inProcessRunner.ts` L689-868: `waitForNextPromptOrShutdown()` polls continuously at 500ms intervals
- Idle state means "waiting", not "stopped"
- Has **message priority**: shutdown > lead messages > peer messages > claimable tasks
- **Autonomously claims tasks** when idle (L854-861)

### Impact Analysis

| Capability                        | Current Project                     | Claude                    |
| --------------------------------- | ----------------------------------- | ------------------------- |
| Agent independently discovers new messages | No - depends on wake        | Yes - self-polls          |
| Agent proactively claims tasks    | No                                  | Yes                       |
| Message priority                  | None (FIFO)                         | Yes (4 levels)            |
| Idle notification                 | Depends on model issuing tool call  | Automatically sent by system |
| Parallel work                     | Lead must assign one by one         | Self-driven parallel      |

### Cross-Adversarial Conclusion

This is the **most fundamental behavioral difference**, but also the most expensive to change. The current wake model is sufficient for lead-driven scheduling scenarios but limits teammate autonomy.

---

## 5. Permission System Gap (P1)

### Claude's Permission System (Full Implementation)

```
Worker encounters a privileged operation
  → Builds SwarmPermissionRequest
  → Sends to leader mailbox
  → Leader UI reviews
  → Sends response to worker mailbox
  → Worker continues or aborts
```

Core files:

- `permissionSync.ts`: filesystem pending/resolved two-level directory + file locks
- `leaderPermissionBridge.ts`: in-process teammate reuses leader UI
- `teammateInit.ts`: `teamAllowedPaths` team-level path allowlist

### Current Project Permission Status

- Team layer: **zero permission code** - searching for permission/sandbox/allow yields no hits
- Lower layer: `CodexAgentManager.ts` L128-132 has `sandboxMode` configuration (workspace-write, etc.)
- Conclusion: lower-layer sandbox constraints exist, but **team-level fine-grained control is completely absent**

### Cross-Adversarial Correction

Initial assessment was P0 (0/10). After review, the lower layer has a sandbox mechanism, revised to **P1 (2/10 vs 8/10)**. Agents are not completely unconstrained, but the lead cannot approve specific teammate operations.

---

## 6. Message Passing Differences (P2)

### 6.1 Message Structure

| Dimension      | Current Project MailboxMessage | Claude TeammateMessage           |
| -------------- | ------------------------------ | -------------------------------- |
| ID             | UUID                           | None (array index)               |
| Type indicator | `type` enum (3 kinds)          | Embedded JSON in `text` (10+ kinds) |
| Persistence    | SQLite                         | JSON file                        |
| Concurrency    | SQLite built-in write lock     | proper-lockfile file lock        |

### 6.2 Message Type Comparison

Current project supports only 3 types:

- `message` / `idle_notification` / `shutdown_request`

Claude supports 10+ protocol message types:

- Basic: message, idle_notification
- Permissions: permission_request/response, sandbox_permission_request/response
- Lifecycle: shutdown_request/approved/rejected
- Collaboration: plan_approval_request/response, task_assignment, team_permission_update, mode_set_request

### 6.3 Mailbox Architecture

Claude has a **two-layer design**:

1. In-memory Mailbox (`mailbox.ts`): fast in-process communication, supports waiter pattern (blocking wait for messages)
2. File Mailbox (`teammateMailbox.ts`): cross-process persistent communication

Current project has only a **single-layer** SQLite Mailbox.

### 6.4 readUnread Atomicity

Initially assessed as "high risk". After cross-adversarial verification: `activeWakes` + single-threaded event loop prevents concurrent readUnread on the same agent - actual risk is **low**.

### 6.5 Negotiated Shutdown

| Step         | Current Project                        | Claude                              |
| ------------ | -------------------------------------- | ----------------------------------- |
| Request shutdown | Type defined, no handling logic    | Leader sends shutdown_request       |
| Negotiation  | None                                   | Model decides to accept/reject      |
| Confirmation | None                                   | shutdown_approved/rejected          |
| Safe stop    | None                                   | AbortController.abort()             |

---

## 7. Task Management Differences (P2)

### Feature Comparison

| Feature                           | Current Project                             | Claude                                          | Gap          |
| --------------------------------- | ------------------------------------------- | ----------------------------------------------- | ------------ |
| CRUD                              | TaskManager 4 methods                       | 5 independent Tools                             | Roughly aligned |
| Status transitions                | pending/in_progress/completed/deleted       | Same                                            | Aligned      |
| Dependency graph blockedBy/blocks | Yes (checkUnblocks auto-unblocks)           | Yes (addBlocks/addBlockedBy)                    | **Aligned**  |
| TaskOutput (result retrieval)     | None                                        | Yes (blocking/non-blocking, now deprecated)     | Missing      |
| TaskCreated/Completed hooks       | None                                        | Yes (can block create/complete)                 | Missing      |
| Automatic owner assignment        | None                                        | Automatically sets owner when in_progress       | Missing      |
| Mailbox notification of ownership changes | None                               | Yes                                             | Missing      |
| Verification nudge                | None                                        | Prompts when 3+ tasks complete with no verification | Missing  |
| Tool exposure method              | ParsedAction text parsing                   | Native Tool protocol                            | Architecture difference |

### Cross-Adversarial Correction

- Initial claim that "task dependency graph is a unique advantage of the current project" -- **incorrect**, Claude has an equivalent implementation
- Score: current project **4/10**, Claude **8/10** (TaskOutput deprecated docks 1 point)

---

## 8. Workspace Isolation Differences (P2)

### Claude's Worktree System

Full git worktree lifecycle management (`worktree.ts`, 1520 lines):

- `createAgentWorktree()`: each teammate gets an independent worktree
- `teamAllowedPaths`: team-level path allowlist
- `cleanupStaleAgentWorktrees()`: automatic cleanup of stale worktrees
- Hook extension points: WorktreeCreate/Remove

### Current Project: Fake Feature Confirmed

- `types.ts:10` defines `WorkspaceMode = 'shared' | 'isolated'`
- `TeamCreateModal.tsx:124` hardcodes the default to `'shared'`
- `SqliteTeamRepository.ts` reads and writes the field normally
- **But no code path branches on workspaceMode**
- `TeammateManager.ts` and `TeamSession.ts` execute identical code paths for both isolated and shared

**Conclusion**: workspaceMode=isolated is a UI-selectable option that the backend does not handle - a fake feature.

---

## 9. Data Model Differences

### TeamAgent vs Claude member

| Field                 | Current Project | Claude                         | Notes                              |
| --------------------- | --------------- | ------------------------------ | ---------------------------------- |
| role (lead/teammate)  | Yes             | No (derived via leadAgentId)   | Current is more explicit           |
| conversationId        | Yes             | No                             | Unique to current (Electron needs) |
| conversationType      | Yes             | No                             | Unique to current (multi-LLM)      |
| status (5 values)     | Yes             | isActive boolean               | Current is more granular           |
| model                 | **Missing**     | Yes                            | Needs to be added                  |
| prompt                | **Missing**     | Yes                            | Needs to be added                  |
| color                 | **Missing**     | Yes                            | Needs to be added                  |
| cwd                   | **Missing**     | Yes                            | Needs to be added                  |
| worktreePath          | **Missing**     | Yes                            | Needs to be added                  |
| mode (PermissionMode) | **Missing**     | Yes                            | Needs to be added                  |
| subscriptions         | **Missing**     | Yes                            | Needs to be added                  |
| backendType           | **Missing**     | Yes                            | Architecture difference            |

---

## 10. Genuine Advantages of the Current Project

Advantages retained after cross-adversarial verification:

| #   | Advantage                                     | Notes                                                                                          |
| --- | --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | **SQLite + Repository Pattern**               | More reliable, queryable, and testable than a filesystem approach                              |
| 2   | **Multi-LLM adapter architecture** (design level) | Although the tool_use path has a bug, the architecture supports mixed Claude/Gemini/Codex teams - effective once fixed |
| 3   | **IPC bidirectional real-time communication** | Renderer can receive agent state and message streams in real time                              |
| 4   | **Granular 5-state lifecycle**                | pending/idle/active/completed/failed is richer than Claude's boolean                           |
| 5   | **Electron native window management**         | No need for tmux/iTerm2 or other terminal solutions                                            |

---

## 11. Fix Priority Recommendations

### P0 -- Fix immediately

| Issue                      | Effort | Recommended approach                                                    |
| -------------------------- | ------ | ----------------------------------------------------------------------- |
| acpAdapter dead code bug   | Small  | Fix TeammateManager to forward tools and toolCalls to the adapter       |

### P1 -- Fix in the short term

| Issue                          | Effort | Recommended approach                                                                       |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------ |
| Agent drive model              | Large  | Evaluate whether to introduce teammate self-polling, or strengthen scheduling strategy in lead prompt |
| Team-level permission control  | Medium | Build on existing SQLite + Mailbox - no need to replicate Claude's file-based approach    |
| TeamAgent data model fields    | Small  | Add missing fields: model/prompt/color/cwd, etc.                                           |

### P2 -- Address in the medium term

| Issue                   | Effort | Recommended approach                                                     |
| ----------------------- | ------ | ------------------------------------------------------------------------ |
| workspaceMode implementation | Medium | Implement true isolated mode based on git worktree                  |
| Negotiated shutdown     | Small  | Extend Mailbox message types, add shutdown_approved/rejected             |
| Task system hooks       | Small  | Add create/complete hooks to TaskManager                                 |
| Message priority        | Small  | readUnread supports sorting by type priority                             |
| Automatic idle notification | Small | Send at system level after turn completes, not relying on model        |

---

## 12. Analysis Process Log

| Phase              | Participating Agents                                             | Time    | Output                                              |
| ------------------ | ---------------------------------------------------------------- | ------- | --------------------------------------------------- |
| Exploration        | Explorer A (current project) + Explorer B (Claude source)        | ~2.5min | Full file listings and structure for both sides     |
| Independent analysis | Developer A (architecture) + Developer B (messages) + Developer C (permissions) | ~3min | Three independent in-depth reports  |
| Cross-adversarial  | Reviewer 1 (challenges A+B) + Reviewer 2 (challenges C+overall) | ~1min   | Corrected 4 erroneous conclusions                   |

### Cross-Adversarial Correction Log

| Original conclusion                                     | Raised by   | Correction result                                                                      | Corrected by |
| ------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------- | ------------ |
| Multi-LLM adapter is a "unique advantage"               | Developer A | **Incorrect** -- tool_use path is dead code; it is a design intention, not a realized advantage | Reviewer 1 |
| readUnread duplicate-consumption risk is "high"         | Developer B | **Overstated** -- activeWakes + single-thread protection keep actual risk low          | Reviewer 1   |
| Task dependency graph is the current project's "unique advantage" | Developer A | **Incorrect** -- Claude also has an equivalent blockedBy/blocks implementation | Reviewer 1 |
| Permission system 0/10, P0                              | Developer C | **Too strict** -- lower layer has sandbox (CodexAgentManager); revised to 2/10, P1    | Reviewer 2   |
