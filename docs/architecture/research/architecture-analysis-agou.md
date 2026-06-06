# Claude Code Team Mode -- In-Depth Architecture Analysis

**Author: Architect Agou | Date: 2026-03-31**
**Based on line-by-line analysis of 28 core source files**

---

## 1. System Essence: What Design Pattern Is This?

### Conclusion: A Simplified Actor Model Implementation + File System as Message Bus

This system is **not** a pure Actor Model, **not** Pub-Sub, and not a traditional message queue. The precise description is:

> **A file-system-based Actor-like inbox pattern, driven by a polling event loop.**

Evidence chain:

**Actor characteristics (met):**

- Each Teammate has an independent inbox (`~/.claude/teams/{team}/inboxes/{name}.json`), corresponding to an Actor's mailbox
- Message processing is single-threaded (each Agent processes serially inside a `while` loop)
- Behavior is driven by messages; no shared mutable state

**Actor characteristics (not met):**

- No Actor address space/registry - file paths are used instead (`teammateMailbox.ts:56-66`)
- No Supervisor layer - the Leader manually manages lifecycle
- Message delivery does not guarantee ordering (file lock contention, `LOCK_OPTIONS` retries 10 times, `teammateMailbox.ts:35-41`)

**Key differences from the classic Actor Model:**

```
Classic Actor Model:
  Actor A --[message]--> Actor Runtime --[dispatch]--> Actor B mailbox

Claude Code Team:
  Agent A --[writeToMailbox]--> File System --[500ms poll]--> Agent B reads
```

The polling interval is hardcoded at `500ms` (`inProcessRunner.ts:114`, `inProcessRunner.ts:697`), meaning the upper bound on message latency is approximately 500ms, with no event-notification mechanism.

### Event Loop Core (inProcessRunner.ts)

```
┌──────────────────────────────────────────────────────────┐
│ runInProcessTeammate() -- main loop                       │
│                                                          │
│  while (!aborted && !shouldExit) {                       │
│    ┌──────────────┐                                      │
│    │ runAgent()   │ <── calls query() API, executes      │
│    │ (Line 1175)  │     tools, produces Message stream   │
│    └──────┬───────┘                                      │
│           │ done / interrupted                           │
│           v                                              │
│    ┌──────────────────────┐                              │
│    │ sendIdleNotification │ <── writes to Leader inbox   │
│    │ (Line 1332-1347)     │                              │
│    └──────┬───────────────┘                              │
│           │                                              │
│           v                                              │
│    ┌──────────────────────────────┐                      │
│    │ waitForNextPromptOrShutdown  │ <── 500ms inbox poll │
│    │ (Line 1354-1361)            │     + TaskList check  │
│    └──────┬───────────────────────┘                      │
│           │ message received                             │
│           v                                              │
│    ┌──────────────────────┐                              │
│    │ format as XML wrapper│ <── formatAsTeammateMessage  │
│    │ inject as new prompt │                              │
│    └──────────────────────┘                              │
│    (back to top of loop)                                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

Key insight: A Teammate's "continuous execution" is fundamentally a **`while` loop + sleep polling**, not event-driven. After each turn it enters idle state and is woken by polling its inbox.

---

## 2. Core Abstraction Layers

From the 28 files, **5 core abstractions** are extracted:

### Abstraction 1: Mailbox (Message Inbox)

**Responsibility:** The sole channel for asynchronous communication between Agents

**Implementation files:** `teammateMailbox.ts` (1184 lines), `mailbox.ts` (73 lines)

**Two coexisting implementations:**

| Dimension        | File Mailbox (`teammateMailbox.ts`)   | Memory Mailbox (`mailbox.ts`)                        |
| ---------------- | ------------------------------------- | ---------------------------------------------------- |
| Storage          | JSON files (`~/.claude/teams/...`)    | In-memory queue                                      |
| Concurrency      | `proper-lockfile` file locking        | Synchronous JS (single-thread safe)                  |
| Usage            | Cross-process (tmux) + in-process     | Candidate for in-process only (not used by Team)     |
| Message types    | 13 structured protocol messages       | Generic Message                                      |

`mailbox.ts` is a concise 73-line in-memory mailbox implementation (`send/poll/receive` + `waiters` pattern), but **Team mode does not actually use it**. All Teammate communication goes through the File Mailbox. This is an important finding - it means the in-process path shares a process but still communicates via file I/O.

**Protocol message types (13):**

```
Plain message ──── plain text (from/text/timestamp/read)
                │
Structured ──┬─ idle_notification          idle notification
             ├─ permission_request          tool permission request
             ├─ permission_response         permission response
             ├─ sandbox_permission_request  sandbox network permission
             ├─ sandbox_permission_response sandbox response
             ├─ shutdown_request            shutdown request
             ├─ shutdown_approved           shutdown approved
             ├─ shutdown_rejected           shutdown rejected
             ├─ plan_approval_request       plan approval request
             ├─ plan_approval_response      plan approval response
             ├─ team_permission_update      team permission broadcast
             ├─ mode_set_request            mode change request
             └─ task_assignment             task assignment
```

**Coupling: Low.** The mailbox only depends on `fs`, `path`, `proper-lockfile`, and JSON serialization. This is the most portable module.

### Abstraction 2: Runner (Agent Execution Engine)

**Responsibility:** Drives the full lifecycle of a single Agent (spawn -> run -> idle -> wake -> run -> shutdown)

**Implementation files:** `inProcessRunner.ts` (1553 lines), `runAgent.ts` (974 lines)

**Call chain:**

```
startInProcessTeammate()           -- entry point, fire-and-forget
  └── runInProcessTeammate()       -- while loop
        ├── runAgent()             -- single LLM interaction loop
        │     └── query()          -- calls Claude API
        ├── sendIdleNotification() -- notifies Leader
        └── waitForNextPrompt()    -- polls inbox
```

`runAgent()` is itself an `AsyncGenerator<Message>` (`runAgent.ts:248-329`), which is an elegant design - it yields each message, allowing the caller to process them one by one, update progress, and check abort.

**Key dependencies (tight coupling points):**

- `query()` - Claude API call; this is the most critical runtime dependency (`runAgent.ts:748`)
- `toolUseContext` - tool use context, including `getAppState` and `setAppState` (React state management)
- `createSubagentContext()` - creates an isolated context for sub-Agents
- `getSystemPrompt()` - constructs the system prompt

**Coupling: High.** This is the module most tightly bound to the Claude Code runtime. `query()`, `Tool`, `AppState`, and `ToolUseContext` are all Claude Code private types.

### Abstraction 3: Backend (Execution Backend / Dispatcher)

**Responsibility:** Abstracts the physical execution mode of a Teammate - where it runs and how it runs

**Implementation files:** `backends/types.ts` (312 lines), `backends/registry.ts` (465 lines), `backends/InProcessBackend.ts` (340 lines), `backends/TmuxBackend.ts` (764 lines)

**Type hierarchy:**

```
TeammateExecutor (unified interface)
  ├── InProcessBackend      -- same process, AsyncLocalStorage isolation
  │     spawn() -> spawnInProcessTeammate() -> startInProcessTeammate()
  │
  └── PaneBackendExecutor (wraps PaneBackend)
        ├── TmuxBackend     -- tmux pane, independent process
        └── ITermBackend    -- iTerm2 pane, independent process
```

**TeammateExecutor interface (`types.ts:279-300`):**

```typescript
type TeammateExecutor = {
  readonly type: BackendType;
  isAvailable(): Promise<boolean>;
  spawn(config: TeammateSpawnConfig): Promise<TeammateSpawnResult>;
  sendMessage(agentId: string, message: TeammateMessage): Promise<void>;
  terminate(agentId: string, reason?: string): Promise<boolean>;
  kill(agentId: string): Promise<boolean>;
  isActive(agentId: string): Promise<boolean>;
};
```

**Backend selection logic (`registry.ts:351-388`):**

```
isInProcessEnabled() decision flow:
  ├── non-interactive session (-p mode) → force in-process
  ├── configured as 'in-process' → true
  ├── configured as 'tmux' → false
  └── 'auto' mode:
       ├── previously fell back to in-process → true
       ├── inside tmux → false (use tmux pane)
       ├── inside iTerm2 → false (use iTerm2 pane)
       └── other → true (default in-process)
```

**Coupling: Medium.** The `TeammateExecutor` interface definition is clean and reusable. However, `InProcessBackend` internally has a hard dependency on `ToolUseContext` and `AppState`. `TmuxBackend` only depends on the `tmux` command line and can theoretically run independently.

### Abstraction 4: Identity System

**Responsibility:** Resolves the "who am I" problem - distinguishing identities when multiple Agents share a process

**Implementation files:** `teammate.ts` (293 lines), `teammateContext.ts` (97 lines)

**Three identity sources (priority descending):**

```
1. AsyncLocalStorage    ← in-process teammates (multiple Agents in same process)
   (teammateContext.ts:41)

2. dynamicTeamContext   ← tmux teammates (injected via CLI arguments)
   (teammate.ts:44-51)

3. process.env          ← environment variables (last fallback)
```

`AsyncLocalStorage` is the key design - it allows multiple Teammates in the same Node.js process to each have an independent identity without forking processes. All code wrapped by `runWithTeammateContext()` can retrieve the correct identity via `getTeammateContext()`.

**Format:** `agentId = "{name}@{teamName}"` (e.g., `researcher@my-team`)

**Coupling: Low.** `AsyncLocalStorage` is a standard Node.js API; the design pattern can be ported directly.

### Abstraction 5: PermissionBridge (Permission Proxy)

**Responsibility:** Handles permission delegation when a Teammate needs user authorization

**Implementation files:** `leaderPermissionBridge.ts` (55 lines), `permissionSync.ts` (929 lines), `inProcessRunner.ts:128-451`

**Permission flow (two paths):**

```
Path A (preferred -- Leader UI Bridge):
  Worker encounters 'ask' permission
    → getLeaderToolUseConfirmQueue() retrieves Leader's UI queue
    → injects directly into Leader's ToolUseConfirm dialog
    → user acts in Leader's terminal
    → callback resolves Promise

Path B (fallback -- Mailbox polling):
  Worker encounters 'ask' permission
    → createPermissionRequest() builds the request
    → sendPermissionRequestViaMailbox() writes to Leader's inbox
    → registerPermissionCallback() registers callback
    → setInterval(500ms) polls own inbox
    → receives permission_response → processMailboxPermissionResponse()
    → callback resolves Promise
```

Path A is an in-process-only optimization: it directly shares the Leader's React state, so a worker's permission request appears in the Leader's UI with a `workerBadge` (color indicator). This is an elegant design that lets in-process workers reuse the Leader's interactive interface.

**Coupling: High.** Path A directly depends on React state (`ToolUseConfirm`). Path B is portable.

---

## 3. Coupling Analysis

### Tightly Coupled Modules (not portable, require rewrite)

| Module                      | Coupled to                                                | Reason                                                                    |
| --------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| `inProcessRunner.ts`        | `query()`, `AppState`, `ToolUseContext`, `Tool`           | The entire execution loop is built around Claude Code's API calls and state management |
| `runAgent.ts`               | `query()`, `getSystemPrompt()`, `createSubagentContext()` | Core LLM invocation for the Agent                                         |
| `leaderPermissionBridge.ts` | React `ToolUseConfirm` component                          | Directly manipulates the Leader UI's permission dialog queue              |
| `agentSwarmsEnabled.ts`     | `GrowthBook` (feature flag)                               | Anthropic server-side feature switch                                      |

### Loosely Coupled Modules (portable, low migration cost)

| Module                    | Porting effort | Notes                                                               |
| ------------------------- | -------------- | ------------------------------------------------------------------- |
| `teammateMailbox.ts`      | Very low       | Pure file I/O + JSON + `proper-lockfile`; nearly usable as-is      |
| `mailbox.ts`              | Very low       | 73-line in-memory mailbox; fully generic                            |
| `teammateContext.ts`      | Very low       | 97 lines; only uses `AsyncLocalStorage`; direct reuse              |
| `teammate.ts`             | Low            | Identity query functions; remove `dynamicTeamContext` and it's pure utilities |
| `backends/types.ts`       | Low            | Interface definitions; no runtime dependencies                     |
| `backends/TmuxBackend.ts` | Low            | Only depends on `tmux` CLI; can run independently                  |
| `teamHelpers.ts`          | Low            | File operations + JSON; clean once the `git worktree` parts are removed |
| `swarm/constants.ts`      | Very low       | Pure constant definitions                                          |

### Moderately Coupled Modules

| Module                         | Reason                                                              |
| ------------------------------ | ------------------------------------------------------------------- |
| `backends/InProcessBackend.ts` | Interface is clean, but implementation depends on `ToolUseContext`  |
| `backends/registry.ts`         | Backend selection logic is reusable, but detection logic is bound to the terminal environment |
| `spawnInProcess.ts`            | Creation and registration logic is clear, but `AppState` is bound   |
| `permissionSync.ts`            | Mailbox path is reusable, but coupled to Claude Code's permission system |

---

## 4. Aion Architecture Proposal

### 4.1 Recommended Module Split

```
aion-teams/
├── core/                          # Can be ported almost directly from Claude Code
│   ├── mailbox/
│   │   ├── FileMailbox.ts         # Based on teammateMailbox.ts
│   │   ├── MemoryMailbox.ts       # Based on mailbox.ts
│   │   └── types.ts               # TeammateMessage + 13 protocol message types
│   ├── identity/
│   │   ├── TeammateContext.ts     # AsyncLocalStorage identity management
│   │   └── AgentId.ts             # name@team format
│   └── protocol/
│       ├── messages.ts            # Message creation/parsing (create*, is*)
│       └── constants.ts           # TEAM_LEAD_NAME, etc.
│
├── runtime/                       # Core layer requiring a rewrite
│   ├── Runner.ts                  # Agent execution loop (replaces inProcessRunner)
│   ├── AgentLoop.ts               # LLM call abstraction (replaces runAgent + query)
│   └── TaskManager.ts             # Task list management
│
├── backends/                      # Design can be referenced
│   ├── types.ts                   # TeammateExecutor interface (use directly)
│   ├── InProcessBackend.ts        # Needs adaptation for Aion's state management
│   ├── TmuxBackend.ts             # Can be used directly
│   └── registry.ts                # Backend detection and selection
│
├── permissions/                   # Needs adaptation
│   ├── PermissionBridge.ts        # Leader UI bridge
│   └── PermissionSync.ts          # Mailbox path
│
└── tools/                         # LLM tool definitions
    ├── TeamCreate.ts
    ├── TeamDelete.ts
    └── SendMessage.ts
```

### 4.2 Technology Recommendations

| Dimension        | Claude Code approach          | Aion recommendation          | Rationale                                                              |
| ---------------- | ----------------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| Message bus      | File JSON + lockfile          | **Reuse file approach directly** | Already proven reliable; no need to introduce Redis/MQ and operational overhead |
| Identity isolation | AsyncLocalStorage            | **Reuse directly**           | Standard Node.js approach; zero migration cost                        |
| Agent execution  | `runAgent()` -> `query()`     | **Interface abstraction**    | Define an `AgentRuntime` interface backed by Aion's own LLM calls     |
| State management | React `AppState`              | **Replace with standalone state** | If Aion is not React/Ink, use EventEmitter or a simple Store       |
| Permission system | ToolUseConfirm + Mailbox     | **Implement Mailbox path only** | UI bridge is too coupled; Mailbox covers all cases first             |
| Progress tracking | AppState.tasks               | **Custom TaskStore**         | Does not need React-rendering immutable updates                       |

### 4.3 Recommended Core Interface Definitions

```typescript
// AgentRuntime interface -- replaces runAgent() + query()
interface AgentRuntime {
  run(config: {
    systemPrompt: string;
    messages: Message[];
    tools: ToolDefinition[];
    abortSignal: AbortSignal;
  }): AsyncGenerator<AgentMessage>;
}

// TeammateExecutor interface -- ported directly from Claude Code
interface TeammateExecutor {
  readonly type: BackendType;
  spawn(config: TeammateSpawnConfig): Promise<TeammateSpawnResult>;
  sendMessage(agentId: string, message: TeammateMessage): Promise<void>;
  terminate(agentId: string, reason?: string): Promise<boolean>;
  kill(agentId: string): Promise<boolean>;
  isActive(agentId: string): Promise<boolean>;
}

// Runner interface -- replaces inProcessRunner's while loop
interface TeammateRunner {
  start(config: RunnerConfig): Promise<RunnerResult>;
  // internally: while -> runtime.run() -> idle -> poll mailbox -> wake
}
```

### 4.4 Implementation Roadmap

```
Phase 1 (2-3 weeks): Mailbox + Identity + Protocol
  Port the core/ layer directly; validate message send/receive

Phase 2 (3-4 weeks): Runner + AgentRuntime
  Implement the while loop + LLM call abstraction
  Connect to Aion's LLM API

Phase 3 (2-3 weeks): Backend + Tools
  InProcessBackend + TmuxBackend
  TeamCreate / SendMessage / TeamDelete

Phase 4 (2 weeks): Permissions + Robustness
  Mailbox permission path
  Reconnect / cleanup / error handling
```

---

## 5. Critique of the Research Report's "60-65% Replicability" Claim

### The Number Is Conservative, but the Direction Is Right

The report claims "60-65% can be reused directly." Here is a layer-by-layer assessment from an architectural perspective:

**Points that are too pessimistic:**

1. **The reusability of the Mailbox system is underestimated.** Of `teammateMailbox.ts`'s 1184 lines, only the `import` paths need changing; the core logic barely needs to be touched. The 13 message protocol types are also pure data definitions and are 100% portable. The report's classification of this as "needs adaptation" is inaccurate.

2. **The in-memory mailbox `mailbox.ts` is overlooked.** It's a concise 73-line implementation with a `waiters`-pattern Promise-based mailbox. If Aion goes the pure in-process route, this is more efficient than the file mailbox. The report doesn't mention it at all.

3. **The migration cost of the identity system is overestimated.** `TeammateContext` + `AsyncLocalStorage` is only 97 lines and follows standard Node.js patterns. It doesn't need "adaptation" - it can be copied directly.

4. **The abstraction quality of the Backend interface is underestimated.** The `TeammateExecutor` interface is cleanly defined (`types.ts:279-300`): all 5 methods are Promise-based with no Claude Code-specific type leakage. `TmuxBackend` is completely self-contained.

**Points that are too optimistic:**

1. **The migration difficulty of `inProcessRunner.ts` is underestimated.** This 1553-line file is the most complex part of the entire system. It is not simply a "while loop + LLM call" - it also contains: auto-compaction (`Line 1074-1126`), per-turn abort (`Line 1056-1063`), permission wait time tracking (`Line 1183-1189`), content replacement state management (`Line 1039-1045`), and many other fine-grained pieces of logic. These are deeply intertwined with Claude Code's `ToolUseContext` and cannot be resolved by "changing a few interfaces."

2. **The complexity of the permission system is underestimated.** `createInProcessCanUseTool()` (`inProcessRunner.ts:128-451`) is a 323-line function implementing two permission paths (UI Bridge + Mailbox Fallback), handling abort, classifier auto-approval, and permission update write-back edge cases. If Aion needs comparable robustness, this is a substantial amount of work.

3. **Hidden constraints in prompt injection and formatting.** `TEAMMATE_SYSTEM_PROMPT_ADDENDUM`, `formatAsTeammateMessage()` (XML wrapping), and the JSON structure of idle notifications are all critical for making the LLM "understand" Team collaboration. These are not a code-volume issue - they require re-tuning prompt engineering specifically for whatever model Aion uses.

### Revised Assessment

| Layer              | Report estimate | My estimate | Rationale                                              |
| ------------------ | --------------- | ----------- | ------------------------------------------------------ |
| Mailbox + Protocol | 70%             | **90%**     | Nearly copy-paste ready                                |
| Identity           | 65%             | **95%**     | Standard AsyncLocalStorage; use directly               |
| Backend interface  | 60%             | **85%**     | Interface definition is 100% usable; implementation needs adaptation |
| Runner core        | 50%             | **30%**     | Deeply coupled to the Claude Code runtime              |
| Permission         | 55%             | **40%**     | UI Bridge is not portable; Mailbox path is usable      |
| Prompt engineering | N/A             | **20%**     | Must be fully rewritten for Aion's model               |

**Overall replicability: ~55% weighted by lines of code; ~50% weighted by functional completeness.**

The report's 60-65% is reasonable if it only counts the "protocol layer + infrastructure." But if it includes the full functionality of Runner and Permissions (making the system actually work), the proportion that can be directly reused is lower. The core difficulty is not the infrastructure - it is the **Runner's integration with the LLM API**: this part has the most code, the deepest coupling, and is the hardest to reuse.

---

## Appendix A: Full Architecture Diagram

```
                    ┌─────────────────────────────────────────────────────┐
                    │                    User                             │
                    └──────────────────────┬──────────────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────────────┐
                    │              Leader Agent (team-lead)               │
                    │  ┌──────────┐ ┌───────────┐ ┌────────────────────┐ │
                    │  │TeamCreate│ │SendMessage│ │   TeamDelete       │ │
                    │  │Tool      │ │Tool       │ │   Tool             │ │
                    │  └────┬─────┘ └─────┬─────┘ └──────┬─────────────┘ │
                    │       │             │              │               │
                    │  ┌────┴─────────────┴──────────────┴────────────┐  │
                    │  │            AppState (React)                   │  │
                    │  │  teamContext / tasks / toolPermissionContext  │  │
                    │  └────┬─────────────┬──────────────┬────────────┘  │
                    │       │             │              │               │
                    │  ┌────┴────┐  ┌─────┴─────┐  ┌────┴──────────┐   │
                    │  │Registry │  │Permission │  │ LeaderPerm    │   │
                    │  │(backend │  │Bridge     │  │ Bridge        │   │
                    │  │ select) │  │(mailbox)  │  │ (UI queue)    │   │
                    │  └────┬────┘  └───────────┘  └───────────────┘   │
                    └───────┼──────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────────┐
              │             │                 │
    ┌─────────┴────┐ ┌─────┴──────┐ ┌────────┴───────┐
    │ InProcess    │ │  Tmux      │ │  iTerm2        │
    │ Backend      │ │  Backend   │ │  Backend       │
    │              │ │            │ │                │
    │ spawn() ───────────────────── spawn()          │
    │ AsyncLocal   │ │  tmux pane │ │  it2 pane      │
    │ Storage      │ │  + claude  │ │  + claude      │
    │ isolation    │ │  binary    │ │  binary        │
    └──────┬───────┘ └─────┬──────┘ └────────┬───────┘
           │               │                 │
    ┌──────┴───────────────┴─────────────────┴───────┐
    │           File-Based Mailbox System             │
    │  ~/.claude/teams/{team}/inboxes/{name}.json     │
    │                                                 │
    │  writeToMailbox() ──── [lockfile] ──── readMailbox()
    │                                                 │
    │  13 message types:                              │
    │    text / idle / permission / shutdown / plan /  │
    │    sandbox / task / mode / team_update           │
    └─────────────────────────────────────────────────┘
           │                │                │
    ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐
    │ Teammate A  │  │ Teammate B  │  │ Teammate C  │
    │             │  │             │  │             │
    │ while loop: │  │ while loop: │  │ while loop: │
    │  runAgent() │  │  runAgent() │  │  runAgent() │
    │  idle/poll  │  │  idle/poll  │  │  idle/poll  │
    │  wake/run   │  │  wake/run   │  │  wake/run   │
    └─────────────┘  └─────────────┘  └─────────────┘
```

## Appendix B: Key Source Line Number Index

| Area                        | File                  | Lines     |
| --------------------------- | --------------------- | --------- |
| Poll interval               | inProcessRunner.ts    | 114, 697  |
| Main loop entry             | inProcessRunner.ts    | 883-1534  |
| Agent execution             | inProcessRunner.ts    | 1175-1203 |
| Permission function         | inProcessRunner.ts    | 128-451   |
| Mailbox write               | teammateMailbox.ts    | 134-192   |
| Mailbox read                | teammateMailbox.ts    | 84-108    |
| File lock config            | teammateMailbox.ts    | 35-41     |
| Message type detection      | teammateMailbox.ts    | 1073-1095 |
| AsyncLocalStorage           | teammateContext.ts    | 41        |
| TeammateExecutor interface  | backends/types.ts     | 279-300   |
| Backend selection           | backends/registry.ts  | 351-388   |
| InProcess spawn             | spawnInProcess.ts     | 104-216   |
| InProcess kill              | spawnInProcess.ts     | 227-328   |
| runAgent AsyncGenerator     | runAgent.ts           | 248-329   |
| query() call                | runAgent.ts           | 748-806   |
| Team creation               | TeamCreateTool.ts     | 128-237   |
| Send message routing        | SendMessageTool.ts    | 741-913   |
| Feature flag                | agentSwarmsEnabled.ts | 24-44     |
| Permission request builder  | permissionSync.ts     | 167-207   |

---

**[Architect Agou]**
**Pattern:** Actor-like inbox pattern; file system as message bus; polling-driven event loop
**Module boundaries:** 5 layers (Mailbox / Runner / Backend / Identity / PermissionBridge); bottom 3 layers can be ported directly; Runner layer must be rewritten
**Interface definitions:** `TeammateExecutor` (exists, usable directly); `AgentRuntime` (needs to be created to connect to Aion's LLM)
**Risk areas:** Runner's deep coupling to the Claude Code runtime is the biggest risk; prompt engineering must be fully re-tuned; the Permission UI Bridge path is not portable
**Recommendation:** Phase 1 - port Mailbox + Identity first (can be validated in 1-2 weeks); Phase 2 - implement the Runner abstraction layer; do not attempt to port `inProcessRunner.ts` directly
**Disagreements with Laochi:** None yet (to be added after Laochi reviews this proposal)
