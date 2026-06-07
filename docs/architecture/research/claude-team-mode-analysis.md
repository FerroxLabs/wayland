# Claude Code Team Mode Architecture Analysis and Aion Replication Decision Report

**Date: 2026-03-31 | Based on real source code: `/Users/you/Downloads/extracted/src/`**

---

## I. Core Differences Between the Two Multi-Agent Systems

Claude Code has two parallel multi-agent systems with fundamentally different design philosophies:

| Dimension          | Subagent System                      | Teammate/Team System                          |
| ------------------ | ------------------------------------ | --------------------------------------------- |
| **Topology**       | Star (one leader, many followers)    | Flat (equal peers)                            |
| **Communication**  | Function call return values          | File mailbox + memory queue (dual channel)    |
| **Lifecycle**      | One-shot call, destroyed after use   | Persistent, listening in a while loop         |
| **Message trigger**| Actively invoked                     | Push-injected (appears automatically as a new conversation turn) |
| **Failure isolation** | Subagent failure doesn't affect the main agent | Any node crash affects the whole team |
| **Best for**       | Dispatch → Execute → Aggregate       | Negotiate → Discuss → Decide                  |

**In short: Subagent is like calling a function; Team is like an enterprise group chat - messages pop up on their own, no polling required.**

---

## II. Feature Flags: Who Can Use Team Mode

```typescript
// src/utils/agentSwarmsEnabled.ts
export function isAgentSwarmsEnabled(): boolean {
  if (process.env.USER_TYPE === 'ant') return true; // Anthropic internal: always on

  if (!isEnvTruthy(process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS) && !process.argv.includes('--agent-teams')) {
    return false; // External users: must opt in
  }

  // Server-side killswitch - users cannot bypass this
  if (!getFeatureValue_CACHED_MAY_BE_STALE('tengu_amber_flint', true)) {
    return false;
  }

  return true;
}
```

**External users can activate today:**

```bash
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=true claude --agent-teams
```

**Three-tier permission model:**

1. ✅ **User-controlled**: env var + CLI flag can activate directly
2. ❌ **Server-controlled**: GrowthBook killswitch `tengu_amber_flint` - Anthropic can disable unilaterally, users cannot bypass
3. ✅ **Internal privilege**: `USER_TYPE=ant` skips all checks

---

## III. File Mailbox: Directory Structure and Data Format

**Real directory structure:**

```
~/.claude/teams/{team-name}/
  config.json
  inboxes/
    {member-name}.json          # Inbox (TeammateMessage array)
    {member-name}.json.lock     # Auto-generated lock file

~/.claude/tasks/{team-name}/  # TaskList and Team are 1:1 linked
```

**TeammateMessage data structure (`teammateMailbox.ts`):**

```typescript
type TeammateMessage = {
  from: string;
  text: string;
  timestamp: number; // Unix milliseconds
  read: boolean;
  color?: string;
  summary?: string; // Used for DM summary notifications
};
// File contents are TeammateMessage[], appended on write
```

**Complete set of 13 message types:**

| Message Type                  | Description                        |
| ----------------------------- | ---------------------------------- |
| `permission_request`          | Request for operation permission   |
| `permission_response`         | Permission response                |
| `sandbox_permission_request`  | Sandbox permission request         |
| `sandbox_permission_response` | Sandbox permission response        |
| `shutdown_request`            | Request to shut down a Teammate    |
| `shutdown_approved`           | Shutdown approved                  |
| `shutdown_rejected`           | Shutdown rejected                  |
| `team_permission_update`      | Team permission update             |
| `mode_set_request`            | Set mode request                   |
| `plan_approval_request`       | Plan approval request              |
| `plan_approval_response`      | Plan approval response             |
| `idle_notification`           | Teammate idle notification         |
| `task_assignment`             | Task assignment                    |

---

## IV. File Writing: Implementation with Full File Locking

```typescript
// src/utils/teammateMailbox.ts - writeToMailbox() core logic
async function writeToMailbox(inboxPath: string, message: TeammateMessage) {
  // 1. Acquire lock (10 retries, 5-100ms interval)
  await lockfile.lock(inboxPath, {
    retries: 10,
    minTimeout: 5,
    maxTimeout: 100,
  });

  try {
    // 2. Re-read (to catch modifications by other processes during lock acquisition)
    const existing = readMailboxSync(inboxPath);
    // 3. Append message
    existing.push(message);
    // 4. Write
    await fs.writeFile(inboxPath, JSON.stringify(existing));
  } finally {
    // 5. Always release the lock, whether success or failure
    await lockfile.unlock(inboxPath);
  }
}
// Lock file path: {inboxPath}.lock
```

> **Detail**: `clearMailbox()` does not use locking - it writes an empty array directly. This is a minor code defect with an extremely low probability of affecting concurrent scenarios.

---

## V. SendMessage Routing: Dual-Channel Selection

```typescript
// src/tools/SendMessageTool/SendMessageTool.ts - send routing logic
async function sendMessage(to: string, message: TeammateMessage) {
  // Check if the target agent is in the in-memory registry (in-process and running)
  const agent = agentNameRegistry.get(to);

  if (agent) {
    // Path A: memory queue, 0ms latency
    queuePendingMessage(agent, message);
    // Wake the agent if it has stopped
    resumeAgentBackground(agent);
  } else {
    // Path B: file mailbox, 0-500ms latency
    await writeToMailbox(getInboxPath(to), message);
  }
}
// Note: even in in-process mode, the Teammate→Leader direction still uses the file mailbox
// Source comment: "for consistency with tmux teammates"
```

---

## VI. Message Reception: Push Model (Not Polling)

**Official prompt text (`SendMessageTool/prompt.ts`):**

```
Your plain text output is NOT visible to other agents -
to communicate, you MUST call this tool.
Messages from teammates are delivered automatically;
you don't check an inbox.
```

**Official prompt text (`TeamCreateTool/prompt.ts`):**

```
Messages from teammates are automatically delivered to you.
You do NOT need to manually check your inbox.
These messages appear automatically as new conversation turns
(like user messages)
```

**Implementation mechanism:** The system injects received messages directly into the agent's conversation history as a new `user turn`. The model perceives this message as if a user said something, naturally triggering a response. The receiving party needs no active action.

---

## VII. The Persistent Event Loop

```typescript
// src/utils/swarm/inProcessRunner.ts - core loop
const POLL_INTERVAL_MS = 500;
const PERMISSION_POLL_INTERVAL_MS = 500;

// Teammate lifecycle (fire-and-forget launch)
void runInProcessTeammate(config).catch(handleError);

async function runInProcessTeammate(config) {
  while (!abort) {
    await runAgent(); // Execute one agent turn

    setIsIdle(true);
    sendIdleNotification(); // Tell Team Lead "I'm idle"

    // Wait for the next message or shutdown (priority: shutdown > team-lead > peers > task)
    await waitForNextPromptOrShutdown();
  }
}

async function waitForNextPromptOrShutdown() {
  let firstIteration = true;
  while (true) {
    if (!firstIteration) await sleep(POLL_INTERVAL_MS); // No wait on first iteration
    firstIteration = false;

    // Priority check (high → low):
    if (hasShutdownRequest()) return handleShutdown(); // Highest priority
    if (hasTeamLeadMessage()) return processMessage();
    if (hasPeerMessage()) return processMessage(); // FIFO
    if (hasTaskUpdate()) return processTask();
  }
}
```

**In-Process concurrency model:** Uses AsyncLocalStorage for context isolation. This is **Cooperative Concurrency**, not OS-level preemptive multithreading. Multiple Teammates share the Bun process and cooperatively yield the CPU.

---

## VIII. Shutdown Is a 3-Way Handshake

```
Team Lead  →  shutdown_request  →  Teammate
                                      ↓
                                  Model autonomously decides
                                  whether it is safe to shut down
                                      ↓
Teammate   →  shutdown_approved / shutdown_rejected  →  Team Lead
```

The model decides whether to shut down - it is not forcibly terminated. A Teammate can reject the request (e.g., "I still have unfinished tasks").

---

## IX. Two Execution Backends

```typescript
// src/utils/swarm/backends/registry.ts - backend detection priority
async function detectAndGetBackend() {
  if (await isInsideTmux()) return TmuxBackend; // Priority 1: inside a tmux session
  if (isInITerm2()) {
    if (await isIt2CliAvailable()) return ITermBackend; // Priority 2: iTerm2 + it2 CLI
    if (await isTmuxAvailable()) return TmuxBackend; // Priority 3: iTerm2 without it2, fall back to tmux
    throw new Error('it2 or tmux must be installed');
  }
  if (await isTmuxAvailable()) return TmuxBackend; // Priority 4: external tmux session
  throw getTmuxInstallInstructions(); // Cannot start
}

// Conditions that force In-Process mode:
function isInProcessEnabled() {
  if (getIsNonInteractiveSession()) return true; // -p non-interactive mode, force in-process
  if (mode === 'in-process') return true;
  if (mode === 'tmux') return false;
  // Auto mode: use in-process only when not inside tmux and not in iTerm2
  return !isInsideTmuxSync() && !isInITerm2();
}
```

---

## X. Memory Cost (Production Incident Data)

```typescript
// src/tasks/InProcessTeammateTask/types.ts
export const TEAMMATE_MESSAGES_UI_CAP = 50;

// Source comment (verbatim):
// ~20MB RSS per agent at 500+ turn sessions
// and ~125MB per concurrent agent in swarm bursts.
// Whale session 9a990de8 launched 292 agents in 2 minutes
// and reached 36.8GB
```

**Conclusion:** Concurrent agent memory cost is approximately 125MB each; the UI layer caps display at 50 messages. Uncontrolled agent creation is a catastrophic failure mode.

---

## XI. Code-Level Enforcement Prohibiting Nesting

```typescript
// Subagents cannot be nested (code throws an exception; prompts cannot bypass this)
throw Error('Fork is not available inside a forked worker. Complete your task directly using your tools.');

// Teammates cannot spawn Teammates (code throws an exception)
throw Error(
  'Teammates cannot spawn other teammates - the team roster is flat. To spawn a subagent instead, omit the `name` parameter.'
);
```

---

## XII. Aion Replication Feasibility

### Per-Module Replication Assessment

| Module                              | Replication % | Notes                                                                  |
| ----------------------------------- | ------------- | ---------------------------------------------------------------------- |
| **File mailbox + file lock**        | 92%           | `proper-lockfile` is a standard npm library; lock→read→write→unlock can be precisely copied |
| **Message format + 13 types**       | 85%           | Structure is known; a complete subset can be implemented               |
| **Message send routing**            | 88%           | File write logic is clear; memory queue can be approximated with a Map |
| **Message reception (push model)**  | 35%           | Underlying layer requires injecting a "new conversation turn" - this is built into the Claude Code runtime and cannot be replicated externally |
| **Persistent event loop**           | 25%           | 500ms polling can be approximated, but the Bun event loop driver cannot be replicated |
| **Team Lead permission structure**  | 50%           | 3-way shutdown can be approximated via prompting; plan approval has no system-level enforcement |
| **Prompt / identity injection**     | 75%           | The original text is known and can be used directly; the SendMessage built-in training semantic layer cannot be replicated |
| **Feature flag**                    | 30%           | env var can activate it, but the killswitch is server-side controlled  |

**Overall replication rate: 60–65%**

### What Cannot Be Done (No Engineering Workaround)

**Push model** - Injecting messages as `user turn` is a built-in capability of the Claude Code runtime. Externally, only "prompt-convention polling" is possible; true push cannot be replicated.

**Persistent execution (Actor model)** - `while(!abort){ runAgent() }` requires a persistent Bun process. Claude Code agents use a request-response model and exit after completing a task - this is a fundamental conflict.

**GrowthBook Killswitch** - `tengu_amber_flint` can be disabled server-side unilaterally; feature stability cannot be relied upon.

**SendMessage built-in semantic layer** - The official model has internalized SendMessage semantics during training. A custom version is just a file-write instruction.

---

## XIII. Decisions: What to Build, What Not to Build

### Build

**P0 - File mailbox + file lock (precisely following the official implementation)**

Follow the lock→read→push→write→unlock pattern of `writeToMailbox()`, using `proper-lockfile`, with message format fully aligned to the official `TeammateMessage`. This is the part where 90% fidelity is achievable today.

**P1 - Active polling check (replacing push)**

At the start of each task, the team lead checks all inboxes for messages with `read: false` and processes them by priority. Replace push with "conscious, active checking" - acceptable outcome, low implementation cost.

**P2 - Plan approval flow (prompt-layer 3-way)**

Port `plan_approval_request → plan_approval_response` as an Aion convention: the team lead must obtain an approval response from a technical role before sending any plan, with message type fields used to differentiate. No system-level enforcement; prompt engineering provides the guarantee.

**P3 - Role identity + mailbox address injection**

Each role's CLAUDE.md should clearly state: `My inbox: ~/.claude/memory/inboxes/{name}.json`, the team member list, and responsibility boundaries.

### Do Not Build

| What Not to Build                             | Reason                                                           |
| --------------------------------------------- | ---------------------------------------------------------------- |
| Full event loop replication                   | Changing from request-response to actor is a system replacement; extremely poor ROI |
| Using the official Team mode as production infrastructure | The killswitch can be pulled at any time; feature stability cannot be relied upon |
| Fully replacing Subagent with pure Team       | Breaks the existing stable system, loses the main agent's global view |
| More than 10 concurrent agents                | Production data: 125MB each, 292 agents = 36.8GB; enforce a hard cap |
| Peer DM summary system                        | Each DM requires an extra LLM call; high cost; debugging feature, not a product feature |

### MVP (1–2 days)

1. Create mailbox directory: `~/.claude/memory/inboxes/{role-name}.json`
2. Implement locked writes (`proper-lockfile`)
3. Add an inbox-check convention for the team lead (at the start of each task)
4. Inject the mailbox address into each role
5. Verify the scenario: worker completes a task → writes to team lead's inbox → team lead reads and acts on it at the start of the next task

---

## XIV. Summary

The core of Team mode is two things: **persistent execution + message push**.

- **Persistent execution**: Cannot be replicated - this is a capability at the Bun process level
- **Message push**: Cannot be replicated - this is the Claude Code runtime injection mechanism

But the most valuable part of Team mode - the **structured inter-agent communication infrastructure** (file mailbox, file lock, message types, send routing) - can all be precisely replicated, and the official implementation is right there in the source code to reference.

**Aion's path:** Don't replicate Team mode's "process model" - replicate its "communication protocol." Do the communication protocol well and 60–65% of the value is captured. The remaining 35–40% is runtime-level capability that is neither achievable nor necessary.

> Building the Team mechanism is additive, not a replacement. The file mailbox is an enhancement, not a refactor.

---

_Based on real source code analysis: `src/utils/agentSwarmsEnabled.ts`, `src/utils/teammateMailbox.ts`, `src/utils/swarm/inProcessRunner.ts` (1553 lines), `src/tools/SendMessageTool/`, `src/utils/swarm/backends/registry.ts`, `src/utils/swarm/constants.ts`_

_Initial analysis team members: Agou · Laochi · Laochui · Xiaokuai · Guo Congming · Laoqiao · Guo Zong (arbitrator)_

---

## XV. Debate Corrections (2026-03-31 Second Round)

**Participants:** Laochui (lead developer), Xiaokuai (rapid development), Agou (architect) - all three independently read all 23+ core source files before cross-debating.

### Core Errors in the Original Report

**The original report said "persistent execution cannot be replicated" - this was wrong.**

All three confirmed: the event loop in `inProcessRunner.ts` is standard `while(true) + sleep(500ms) + fs.readFile()` with no Bun-specific APIs whatsoever. The claim that "the Bun event loop driver cannot be replicated" was a misjudgment.

- Source evidence: `inProcessRunner.ts` L697–868, all using `fs/promises`, Promise wrappers around `setTimeout`, `AbortController`
- Any environment capable of running Node.js can implement this loop

**The original report said "message push cannot be replicated" - also wrong.**

The "push" implementation is simply: poll the mailbox file → find unread messages → format as an XML string → pass as a user message to the next API call.

- Source evidence: `inProcessRunner.ts` L756–845 reads the file, L1371–1407 assembles the prompt, L1067–1069 creates the userMessage
- `formatAsTeammateMessage()` simply assembles a `<teammate-message>` XML tag
- An external orchestrator just needs to add one user message when constructing the messages array

**The original report missed `mailbox.ts` (73 lines, pure in-memory mailbox).**

All three noted this file was overlooked. It provides `send/poll/receive` + a `waiters`-pattern Promise-based mailbox, more efficient than 500ms file polling. If Aion goes the in-process route, this should be the first choice.

### Revised Replication Rates

| Dimension                     | Original Report | Post-Debate Consensus                                                                                          |
| ----------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| **Overall replication rate**  | 60–65%          | **65–75%** (using Claude models) / **50–60%** (using other models)                                             |
| File mailbox + protocol layer | 92%             | **90–95%** (nearly copy-paste ready)                                                                           |
| Message reception (push model)| 35%             | **75–85%** (polling + message injection is fully achievable)                                                   |
| Persistent event loop         | 25%             | **70–80%** (skeleton is reusable; fine-grained logic needs rewriting)                                          |
| Runner core                   | Not assessed    | **30–50%** (skeleton is simple, but auto-compaction/permissions/abort are deeply coupled to Claude Code)       |
| Permission system             | 50%             | **40%** (UI Bridge is not portable; Mailbox path is usable; `createInProcessCanUseTool()` at 323 lines is the hard core) |
| Prompt engineering            | 75%             | **55–70%** (Claude models natively compatible with XML) / **20–30%** (other models require full rewrite)       |
| SendMessage semantic layer    | 30%             | **Disputed** (Laochui: no training binding; Xiaokuai: indirect evidence, 60% confidence; Agou: gap exists but can be narrowed via prompting) |

### Key Disagreements (Not Fully Resolved)

**1. Whether SendMessage has model-training-level semantic binding**

- Laochui (no binding): SendMessage is 100% controlled by code; the model only needs to know to call this tool to send a message
- Xiaokuai (yes, 60% confidence): The short reminder-style wording in the prompt suggests the model has been exposed to similar collaborative scenarios
- Agou (gap exists): Can be narrowed through careful system prompting but not fully eliminated
- **Conclusion: Does not affect the engineering decision; sufficient prompt engineering can compensate**

**2. Production-level time estimates**

- Laochui: 9–12 weeks
- Agou: 6–8 weeks (revised down from 10 weeks)
- **Conclusion: 6–12 week range, depending on how deep the permission system goes**

### Revised Implementation Plan

#### MVP (3–5 days, ~500–860 lines)

Minimum closed-loop agreed upon by all three:

| Component                                                  | Lines       | Source                                   |
| ---------------------------------------------------------- | ----------- | ---------------------------------------- |
| FileMailbox (lock/read/write/unlock)                       | ~150 lines  | Port from `teammateMailbox.ts` (trimmed) |
| MemoryMailbox (in-process)                                 | 73 lines    | **Direct port** from `mailbox.ts`        |
| Message type definitions (text + idle + task_assignment)   | ~60–80 lines | Port                                    |
| TeammateContext (AsyncLocalStorage)                        | ~50 lines   | Direct port                              |
| Runner main loop (while + run + idle + poll)               | ~200–400 lines | Rewrite                               |
| LLM call wrapper (AgentRuntime adapter)                    | ~100–150 lines | Rewrite (depends on existing API)     |
| Prompt injection (system prompt + XML format)              | ~50–80 lines | Port + adjust                           |
| Leader side (spawn + send task + receive result)           | ~100–150 lines | Rewrite                               |

**Prerequisite:** A callable LLM API (e.g., Anthropic SDK). If starting from scratch, add 2 days.

**Not included in MVP (deferred to later phases):**

- Full permission system (`createInProcessCanUseTool()`, 323 lines)
- Auto-compaction (long session compression)
- Per-turn abort (mid-turn interruption)
- Multi-backend support (Tmux/iTerm)
- Production-grade error handling and cleanup

#### Production-Grade Path (6–12 weeks)

| Phase   | Duration | Content                                                    |
| ------- | -------- | ---------------------------------------------------------- |
| Phase 1 | 2–3 weeks | Full port of Mailbox + Identity + Protocol                |
| Phase 2 | 3–4 weeks | Runner abstraction layer + AgentRuntime LLM API integration |
| Phase 3 | 2–3 weeks | Backend + TeamCreate/SendMessage/TeamDelete               |
| Phase 4 | 2 weeks  | Permission system (Mailbox path) + robustness             |

### Final Conclusion Replacing Section XII

The original report said "overall replication rate 60–65%" and recommended "do not attempt full event loop replication."

**Post-debate revised conclusion:**

1. **Replication rate is 65–75%** (using Claude models) - the original report underestimated by 15 percentage points
2. **The event loop must be built** - it is the soul of Team mode; without it you have only a mailbox, not a live agent
3. **MVP can be running in 3–5 days**, not the "extremely poor ROI" the original report suggested
4. The parts the original report got right remain unchanged: precise file mailbox replication, no dependency on the official killswitch, concurrent agent memory limits
5. New finding: `mailbox.ts` in-memory mailbox is the best choice for Aion - more efficient than file polling

**In one sentence: It is not "replicating the communication protocol is enough" - rather, "event loop + communication protocol + message injection" can all be done, and it is not hard.**

---

_Debate participants: Laochui (lead developer) · Xiaokuai (rapid development) · Agou (architect)_
_Debate format: All three independently read 23+ source files → each independently produced an analysis report → cross-read → responded to disagreements item by item_
_Roles not in this debate: Laochi (pending architecture review), Ciji/Mirror (pending source line number verification)_
