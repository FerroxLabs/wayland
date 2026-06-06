# Agent → Team Guide Flow Design

## Full Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER  (regular Agent conversation)                │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │
                  │ ① Send message: "Build me a complete e-commerce website,
                  │    including frontend, backend, database design, and deployment"
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SOLO AGENT  (ACP Session)                           │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │ System Prompt (injected guide rules)                               │     │
│  │                                                                    │     │
│  │  "You are the Aion assistant. When a user request spans multiple   │     │
│  │   specialized domains (frontend/backend/architecture/testing/      │     │
│  │   design, etc.) and parallel collaboration would significantly     │     │
│  │   improve efficiency, suggest enabling team mode.                  │     │
│  │   Criteria:                                                        │     │
│  │   - Task can be split into 2+ independent sub-domains             │     │
│  │   - Sub-tasks have room for parallel execution                    │     │
│  │   - A single Agent would take much longer than multi-Agent collab │     │
│  │   When suggesting, explain why and how the team would divide work. │     │
│  │   Once the user agrees, call the aion_create_team tool."          │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  ② Agent analyzes request → determines: spans frontend+backend+DB+DevOps,  │
│     well-suited for a Team                                                  │
│                                                                             │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │
                  │ ③ Reply to user (natural language suggestion)
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  AGENT → USER:                                                              │
│                                                                             │
│  "I've analyzed your request - this is a complex project spanning           │
│   multiple domains:                                                         │
│   - Frontend engineering (React/UI)                                         │
│   - Backend services (API/business logic)                                   │
│   - Database design (Schema/indexes)                                        │
│   - Deployment (CI/CD/infrastructure)                                       │
│                                                                             │
│   I think assembling a team would be more efficient - multiple specialist   │
│   Agents can work in parallel.                                              │
│   Should I enable team mode to handle this task?"                           │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │
                  │ ④ User replies: "Sure, enable team mode"
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AGENT calls MCP Tool: aion_create_team                   │
│                                                                             │
│  Tool Input:                                                                │
│  {                                                                          │
│    "summary": "Build a complete e-commerce website including:               │
│                1) React frontend (product listing/cart/checkout)            │
│                2) Node.js backend (RESTful API/auth/payments)               │
│                3) PostgreSQL database design (users/products/orders)        │
│                4) Docker + CI/CD deployment",                               │
│    "name": "E-commerce Full-Stack"    ← optional, Agent names it           │
│  }                                                                          │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │
                  ▼
┌═════════════════════════════════════════════════════════════════════════════┐
║                     MCP SERVER  (running in main process)                   ║
║                                                                             ║
║  ┌─── aion_create_team handler ───────────────────────────────────────┐     ║
║  │                                                                    │     ║
║  │  1. Receive summary + name                                        │     ║
║  │                                                                    │     ║
║  │  2. Build createTeam params                                       │     ║
║  │     {                                                              │     ║
║  │       userId: currentUserId,                                       │     ║
║  │       name: "E-commerce Full-Stack",                               │     ║
║  │       workspace: "",              // auto-assigned                 │     ║
║  │       workspaceMode: "shared",                                     │     ║
║  │       agents: [{                                                   │     ║
║  │         slotId: "slot-xxx",                                        │     ║
║  │         role: "lead",                                              │     ║
║  │         agentType: "acp",         // default lead type            │     ║
║  │         agentName: "Team Lead",                                    │     ║
║  │         ...                                                        │     ║
║  │       }]                                                           │     ║
║  │     }                                                              │     ║
║  │                                                                    │     ║
║  │  3. Call TeamSessionService.createTeam(params)                    │     ║
║  │     → generate teamId (UUID)                                      │     ║
║  │     → create conversation for lead agent                          │     ║
║  │     → persist to SQLite                                           │     ║
║  │                                                                    │     ║
║  │  4. Call TeamSessionService.getOrStartSession(teamId)             │     ║
║  │     → create TeamSession                                          │     ║
║  │     → start Team MCP Server                                       │     ║
║  │     → inject MCP config into agent conversations                  │     ║
║  │                                                                    │     ║
║  │  5. Send first message to lead agent (user requirement summary)   │     ║
║  │     ipcBridge.team.sendMessage.invoke({                            │     ║
║  │       teamId,                                                      │     ║
║  │       content: summary    // summary becomes lead's first instruction│   ║
║  │     })                                                             │     ║
║  │                                                                    │     ║
║  │  6. Return result                                                  │     ║
║  │     {                                                              │     ║
║  │       teamId: "abc-123-def",                                       │     ║
║  │       name: "E-commerce Full-Stack",                               │     ║
║  │       route: "/team/abc-123-def",                                  │     ║
║  │       leadAgent: "Team Lead",                                      │     ║
║  │       status: "session_started"                                    │     ║
║  │     }                                                              │     ║
║  └────────────────────────────────────────────────────────────────────┘     ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝
                  │
                  │ ⑤ MCP returns Team info
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SOLO AGENT  (received MCP result)                   │
│                                                                             │
│  Agent knows the Team has been created and needs to guide the user there    │
│                                                                             │
│  ⑥ Call MCP Tool: aion_navigate                                            │
│     { "route": "/team/abc-123-def" }                                        │
│                                                                             │
│  Simultaneously reply to user:                                              │
│  "Your team 'E-commerce Full-Stack' has been assembled. Navigating now... 🚀" │
│                                                                             │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │
                  ▼
┌═════════════════════════════════════════════════════════════════════════════┐
║                  MCP SERVER: aion_navigate handler                          ║
║                                                                             ║
║  1. Validate route against allowlist (/team/:id, /conversation/:id, ...)   ║
║                                                                             ║
║  2. Notify Renderer to navigate via IPC                                    ║
║     ipcBridge.deepLink.received.emit({                                      ║
║       action: "navigate",                                                   ║
║       params: { route: "/team/abc-123-def" }                                ║
║     })                                                                      ║
║                                                                             ║
║  3. Return { success: true }                                                ║
╚═════════════════════════════════════════════════════════════════════════════╝
                  │
                  │ ⑦ IPC emit → Renderer
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RENDERER  (frontend)                              │
│                                                                             │
│  useDeepLink() hook receives deepLink.received event                        │
│  action === "navigate" → navigate("/team/abc-123-def")                      │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  React Router matches /team/:id                                   │     │
│  │  → lazy-load TeamIndex                                            │     │
│  │  → fetch team via ipcBridge.team.get                              │     │
│  │  → render TeamPage                                                │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  useTeamSession(team) hook                                         │     │
│  │  → session was pre-started in MCP handler, reuse directly         │     │
│  │  → subscribe to agentStatusChanged / agentSpawned / agentRemoved  │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │
                  │ ⑧ Page render complete
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TEAM PAGE  (what the user sees)                      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │                                                              │           │
│  │  📋 E-commerce Full-Stack                                    │           │
│  │                                                              │           │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │           │
│  │  │ Lead ★  │ │Frontend │ │Backend  │ │  DBA    │  ← on-    │           │
│  │  │(working)│ │(pending)│ │(pending)│ │(pending)│    demand  │           │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    spawn  │           │
│  │                                                              │           │
│  │  Lead Agent:                                                 │           │
│  │  "Task received. I'll break it down and assign:             │           │
│  │   1. @Frontend → React product listing/cart/checkout pages  │           │
│  │   2. @Backend  → Node.js API services/auth/payment          │           │
│  │   3. @DBA      → PostgreSQL schema design                   │           │
│  │   Let me create the team members first..."                  │           │
│  │                                                              │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  ✅ User sees Team already working - no manual steps required               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Sequence Diagram

```
 User          Renderer        Solo Agent       MCP Server       Main Process       Team Lead
  │               │                │                │                 │                  │
  │──① send msg──▶│───── IPC ─────▶│                │                 │                  │
  │               │                │                │                 │                  │
  │               │                │─② analyze ──┐  │                 │                  │
  │               │                │  suited for  │  │                 │                  │
  │               │                │  Team?       │  │                 │                  │
  │               │                │◀────────────┘  │                 │                  │
  │               │                │                │                 │                  │
  │◀──③ suggest── │◀──────────────│                │                 │                  │
  │  "suggest                      │                │                 │                  │
  │   team mode"                   │                │                 │                  │
  │               │                │                │                 │                  │
  │──④ "ok"─────▶│───── IPC ─────▶│                │                 │                  │
  │               │                │                │                 │                  │
  │               │                │──⑤ call ──────▶│                 │                  │
  │               │                │ aion_create_   │── createTeam ──▶│                  │
  │               │                │ team           │                 │─ write DB        │
  │               │                │                │                 │─ create Session  │
  │               │                │                │                 │─ start MCP Server│
  │               │                │                │◀── team info ──│                  │
  │               │                │                │                 │                  │
  │               │                │                │── sendMessage ─▶│────── IPC ──────▶│
  │               │                │                │   (summary)     │                  │─ start
  │               │                │◀─⑥ return ────│                 │                  │  working
  │               │                │  {teamId,      │                 │                  │
  │               │                │   route}       │                 │                  │
  │               │                │                │                 │                  │
  │               │                │──⑦ call ──────▶│                 │                  │
  │◀── "navigating"│              │ aion_navigate  │── deepLink ────▶│                  │
  │               │                │                │   emit          │                  │
  │               │◀───────────────│────────────────│── IPC emit ────│                  │
  │               │                │                │                 │                  │
  │               │─⑧ navigate ──┐│                │                 │                  │
  │               │  /team/:id   ││                │                 │                  │
  │               │◀─────────────┘│                │                 │                  │
  │               │                │                │                 │                  │
  │  ┌────────────▼────────────┐  │                │                 │                  │
  │  │  ⑨ Team Page renders    │  │                │                 │    ┌─────────────▼┐
  │  │  Lead Agent is working  │  │                │                 │    │ break down    │
  │  │  User sees live progress│  │                │                 │    │ spawn members │
  │  └─────────────────────────┘  │                │                 │    │ assign work   │
  │               │                │                │                 │    └───────────────┘
```

## New Modules Required

| #   | Module                | Location                                           | Responsibility                                                  |
| --- | --------------------- | -------------------------------------------------- | --------------------------------------------------------------- |
| 1   | **Team Guide Prompt** | `src/process/resources/prompts/teamGuidePrompt.ts` | Inject team guidance rules into the solo agent                  |
| 2   | **Aion MCP Server**   | `src/process/services/aionMcpServer.ts`            | In-process MCP providing `aion_create_team` + `aion_navigate`   |
| 3   | **MCP Registration**  | `src/process/agent/acp/mcpSessionConfig.ts`        | Register Aion MCP with the solo agent session                   |
| 4   | **DeepLink Extension**| `src/renderer/hooks/system/useDeepLink.ts`         | Handle `navigate` action, support arbitrary route navigation    |

## Boundaries and Constraints

- **Agent does not create a Team automatically**: user consent is required first
- **Route allowlist**: `aion_navigate` only permits navigation to known routes (`/team/:id`, `/conversation/:id`)
- **Summary quality**: the Agent's summary directly determines how well the Lead Agent understands the task - the prompt must guide the Agent to produce a structured summary
- **Fallback**: if the user declines team mode, the Agent continues and completes the task in solo mode
