<!-- refreshed: 2026-07-19 -->

# Architecture

**Analysis Date:** 2026-07-19

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Presentation clients                                                        │
├───────────────────────────┬───────────────────────────┬──────────────────────┤
│ Electron renderer         │ Browser / PWA WebUI       │ Channel / webhook    │
│ `src/renderer/`           │ `src/renderer/`           │ `src/process/channels/`│
└──────────────┬────────────┴──────────────┬────────────┴───────────┬──────────┘
               │ contextBridge / IPC       │ authenticated WebSocket│
               ▼                           ▼                        │
┌──────────────────────────────────────────────────────────────────────────────┐
│ Typed transport and capability boundary                                     │
│ `src/preload/main.ts` · `src/common/adapter/` · `src/process/webserver/`     │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Main-process application layer                                              │
├───────────────────────────┬───────────────────────────┬──────────────────────┤
│ IPC/domain bridges        │ Services and repositories │ Runtime orchestration│
│ `src/process/bridge/`     │ `src/process/services/`   │ `src/process/task/`  │
└──────────────┬────────────┴──────────────┬────────────┴───────────┬──────────┘
               │                           │                        │
               ▼                           ▼                        ▼
┌───────────────────────────┬───────────────────────────┬──────────────────────┐
│ SQLite + JSON config      │ Workspaces / artifacts    │ Agent processes      │
│ `services/database/`      │ local filesystem          │ Core, ACP, Gemini,   │
│ `utils/initStorage.ts`    │                           │ remote, worker forks │
└───────────────────────────┴───────────────────────────┴──────────────────────┘
```

The runtime is an Electron multi-process application with an optional browser transport and a separate pure-Node server entry. Desktop and WebUI clients converge on the same typed bridge providers, services, repositories, and agent managers; host-specific capabilities are selected by the Electron or standalone bridge initializer.

## Component Responsibilities

| Component                  | Responsibility                                                                                                                   | File                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Dependency-light bootstrap | Registers privileged schemes, runs recovery commands and database compatibility preflight, then imports the stateful main module | `src/bootstrap.ts`                                                             |
| Electron lifecycle         | Owns single-instance behavior, windows, tray, deep links, desktop WebUI startup, initialization, and ordered shutdown            | `src/index.ts`                                                                 |
| Standalone lifecycle       | Boots storage, non-Electron bridges, channels, extensions, and the WebUI without importing Electron adapters                     | `src/server.ts`                                                                |
| Process composition        | Initializes durable storage, extensions, and channel subsystems                                                                  | `src/process/index.ts`                                                         |
| Preload boundary           | Exposes the restricted renderer API through `contextBridge` and converts bridge calls to Electron IPC                            | `src/preload/main.ts`                                                          |
| Typed bridge contract      | Declares provider/emitter names and shared request/response types used by renderer, main, and WebUI                              | `src/common/adapter/ipcBridge.ts`                                              |
| Bridge allowlist           | Records declared bridge names and applies reduced remote capability policy                                                       | `src/common/adapter/bridgeAllowlist.ts`                                        |
| Electron adapter           | Routes allowlisted renderer calls to bridge handlers and broadcasts emitted events to windows and WebSocket clients              | `src/common/adapter/main.ts`                                                   |
| Standalone adapter         | Routes Node/WebSocket messages without loading Electron's adapter                                                                | `src/common/adapter/standalone.ts`                                             |
| Bridge registration        | Wires repositories, services, task managers, and domain bridge handlers for the desktop process                                  | `src/process/utils/initBridge.ts` and `src/process/bridge/index.ts`            |
| Web transport              | Provides Express routes, JWT-authenticated WebSockets, static renderer hosting, and remote bridge dispatch                       | `src/process/webserver/index.ts` and `src/process/webserver/adapter.ts`        |
| Conversation service       | Owns conversation creation/update semantics, Project workspace reconciliation, and backend-specific construction inputs          | `src/process/services/ConversationServiceImpl.ts`                              |
| Persistence                | Owns SQLite schema/migrations/repositories plus compatibility-aware recovery                                                     | `src/process/services/database/index.ts`                                       |
| Runtime registry           | Rehydrates a conversation, selects an agent manager through the factory, caches live tasks, and reaps idle/shutdown children     | `src/process/task/WorkerTaskManager.ts` and `src/process/task/AgentFactory.ts` |
| Core adapter               | Owns one Wayland Core session, policy/approval handling, message persistence, protocol translation, and renderer stream emission | `src/process/task/WCoreManager.ts` and `src/process/agent/wcore/`              |
| Renderer composition       | Mounts providers, authentication, router, and the selected shell                                                                 | `src/renderer/main.tsx`                                                        |
| Shell boundary             | Lazy-loads independent Classic/Cockpit roots and falls back to Classic on Cockpit failure                                        | `src/renderer/components/layout/ShellExperience/`                              |
| Execution projection       | Adapts backend messages into immutable, bounded, backend-neutral execution snapshots                                             | `src/common/execution/`                                                        |
| Contextual workbench       | Registers presentation-only workspace, preview, observability, mission, and receipt projections over canonical stores            | `src/renderer/pages/conversation/components/WorkbenchHost/`                    |

## Pattern Overview

**Overall:** Layered multi-process architecture with ports/adapters, repository/service boundaries, pluggable agent managers, and independently loadable presentation composition roots.

**Key Characteristics:**

- Keep Electron main, browser renderer, preload, and fork-worker APIs separated by directory and import aliases.
- Declare cross-process operations once as typed providers/emitters in `src/common/adapter/ipcBridge.ts`; transports must route those declarations rather than inventing parallel APIs.
- Keep durable product authority in repositories/services. Classic and Cockpit are presentation roots over the same routes and state.
- Normalize Core, Gemini, and ACP evidence once in `src/common/execution/adapters/`, then render selectors from the immutable `ExecutionSnapshot`.
- Select agent implementations through `AgentFactory`; conversation rows carry the backend type while `WorkerTaskManager` owns live-process caching and lifecycle.
- Support desktop, desktop-plus-WebUI, Electron-headless WebUI, and pure-Node server modes through separate composition roots.

## Layers

**Bootstrap and Host Lifecycle:**

- Purpose: Prove state compatibility before stateful modules load, choose the host mode, and own process/window shutdown.
- Location: `src/bootstrap.ts`, `src/index.ts`, `src/server.ts`
- Contains: Electron/Node entry points, recovery CLI handling, window/server lifecycle, shutdown sequencing.
- Depends on: Platform registration, recovery services, process initialization, bridge initializers.
- Used by: Packaged Electron, development Electron, and standalone server launch commands.

**Renderer Presentation:**

- Purpose: Compose routes, shell chrome, pages, conversation UI, and contextual projections.
- Location: `src/renderer/`
- Contains: React pages, shared components, hooks, contexts, services, styles, and client workers.
- Depends on: Browser APIs, `src/common/` contracts, and the preload/WebSocket adapter.
- Used by: Electron renderer and WebUI/PWA clients.
- Rule: Put one-page behavior under `src/renderer/pages/<page>/`; promote only genuinely shared UI to `src/renderer/components/` or `src/renderer/hooks/`.

**Shared Contracts and Pure Domain Projection:**

- Purpose: Share serializable types, bridge contracts, navigation manifests, capability declarations, and pure reducers across processes.
- Location: `src/common/`
- Contains: `adapter/`, `config/`, `execution/`, `capabilities/`, `chat/`, `navigation/`, `security/`, and shared types/utilities.
- Depends on: Environment-neutral libraries; platform-specific behavior is reached through `src/common/platform/` registrations.
- Used by: Renderer, main process, standalone server, tests, and selected worker code.
- Rule: Do not add React, Electron-main, filesystem, or child-process behavior to shared modules.

**Transport and IPC:**

- Purpose: Carry the same named provider/emitter protocol over Electron IPC or authenticated WebSockets.
- Location: `src/preload/`, `src/common/adapter/`, `src/process/webserver/`
- Contains: `contextBridge`, bridge allowlists, Electron/standalone adapters, WebSocket dispatch, HTTP/auth routes.
- Depends on: `@office-ai/platform` bridge primitives and the shared contract.
- Used by: Renderer services/hooks and main-process bridge handlers.
- Rule: Add a typed provider/emitter first, then register its main-process handler; apply remote reductions for operations unavailable to paired browsers.

**Main-Process Application:**

- Purpose: Enforce product rules and coordinate IO without exposing implementation details to the renderer.
- Location: `src/process/bridge/`, `src/process/services/`, `src/process/providers/`, `src/process/permissions/`, `src/process/storage/`
- Contains: Thin transport handlers, domain services, repositories, provider registries, trust policy, migration/recovery, storage operations.
- Depends on: `src/common/`, Node/Electron APIs, SQLite, and injected repositories/managers.
- Used by: Electron and standalone bridge composition roots.
- Rule: Keep bridges thin; put reusable rules in a service and database access in a repository.

**Agent and Automation Runtime:**

- Purpose: Create, cache, supervise, and communicate with heterogeneous agent backends and scheduled/team execution.
- Location: `src/process/task/`, `src/process/agent/`, `src/process/worker/`, `src/process/team/`, `src/process/services/cron/`
- Contains: Agent factory/managers, Core protocol adapter, ACP connections, fork protocol, team sessions, scheduler.
- Depends on: Conversation repositories, shared message contracts, workspace/trust services, external CLI/binary protocols.
- Used by: Conversation, task, cron, team, channel, and mission-control bridges.
- Rule: Backend-owned runtime state stays behind an `IAgentManager`; Desktop-owned chats, Projects, schedules, and Teams remain in Desktop services.

**Persistence and External Effects:**

- Purpose: Store durable product data and coordinate local files, secrets, extensions, channels, and external processes.
- Location: `src/process/services/database/`, `src/process/utils/initStorage.ts`, `src/process/secrets/`, `src/process/extensions/`, `src/process/channels/`
- Contains: SQLite schema/migrations, JSON compatibility stores, safe-storage wrappers, extension registry, channel gateways.
- Depends on: Filesystem, OS credential services, SQLite drivers, network integrations.
- Used by: Main-process services and runtime managers.
- Rule: Preserve compatibility checks, atomic writes, mutation queues, and repository/service boundaries when extending persisted state.

## Data Flow

### Primary Request Path

1. The active backend composer creates an optimistic user message and invokes the typed conversation provider (`src/renderer/pages/conversation/platforms/wcore/WCoreSendBox.tsx:238`).
2. The renderer adapter sends the provider envelope through the preload's allowlisted `contextBridge` channel (`src/preload/main.ts:117`).
3. The Electron adapter validates the bridge name and dispatches it to the registered provider (`src/common/adapter/main.ts:83`). WebUI uses the equivalent authenticated/reduced dispatch in `src/process/webserver/adapter.ts`.
4. `conversationBridge` loads current conversation/MCP authority, obtains or rebuilds the live manager, prepares files/workflow/skill context, and calls `IAgentManager.sendMessage` (`src/process/bridge/conversationBridge.ts:575`).
5. `WorkerTaskManager` rehydrates the conversation through its repository and selects the backend creator through `AgentFactory` when no cached manager exists (`src/process/task/WorkerTaskManager.ts:81`).
6. `WCoreManager` applies the pre-turn budget gate, persists the user message, waits for Core bootstrap, adds skill context, and sends to the Core adapter (`src/process/task/WCoreManager.ts:625`). Other backends implement the same manager contract.
7. Runtime events are normalized/persisted by the manager and emitted through `ipcBridge.conversation.responseStream` (`src/process/task/WCoreManager.ts:856`). The Electron adapter broadcasts them to renderer windows and eligible WebSocket clients (`src/common/adapter/main.ts:68`).
8. The backend message hook filters by conversation/request identity and updates the canonical message-list state (`src/renderer/pages/conversation/platforms/wcore/useWCoreMessage.ts:142`). `ExecutionSpine` separately adapts those messages into the immutable backend-neutral snapshot for thread/workbench projections (`src/renderer/pages/conversation/components/ExecutionSpine/index.tsx`).

### Startup and Recovery Flow

1. `src/bootstrap.ts` registers privileged protocols before readiness and parses mutually exclusive recovery commands.
2. Normal launch runs `preflightDesktopState` before importing `src/index.ts`, preventing an older binary from mutating a future or unreadable schema.
3. `src/index.ts` calls `initializeProcess` from `src/process/index.ts`, which initializes storage, extensions, and channels.
4. `src/process/utils/initBridge.ts` wires repositories, services, task managers, and bridge handlers; the chosen run mode then creates a window, starts WebUI, or stays headless.
5. Shutdown stops producers, drains tasks/teams, closes servers/watchers, force-reaps remaining agent and PTY children, and closes SQLite last.

### Shell Selection and Failure Recovery

1. `useShellExperience` reads `ui.shell`, resolves missing/corrupt values to Classic, and checks Cockpit rollout eligibility (`src/renderer/hooks/ui/useShellExperience.ts`).
2. `ShellExperienceLayout` lazy-loads only the selected composition root (`src/renderer/components/layout/ShellExperience/index.tsx`).
3. Cockpit import, initialization, route, or render failure is caught inside the shell boundary; Classic loads independently and is activated for the session.
4. The user may persist Classic as the default, but failure to persist cannot undo the already-safe session switch.

**State Management:**

- Durable relational state uses SQLite repositories in `src/process/services/database/`; `WaylandUIDatabase` owns schema initialization, migrations, compatibility checks, and corruption quarantine.
- Backward-compatible config/chat namespaces use serialized JSON stores built in `src/process/utils/initStorage.ts` and accessed through typed `ConfigStorage`, `ChatStorage`, and `ChatMessageStorage` declarations in `src/common/config/storage.ts`.
- Renderer server state is fetched through bridge calls and synchronized by emitters, SWR, contexts, and page/domain hooks. Avoid introducing a second renderer-authoritative product store.
- Execution state is a bounded derived projection from persisted messages/runtime evidence in `src/common/execution/reducer.ts`; it is not a second canonical Task database.
- Workbench open/pin/width preferences are presentation-only `localStorage` state in `src/renderer/pages/conversation/components/WorkbenchHost/index.tsx`; the underlying workspace, preview, execution, and observability data remains in existing stores.

## Key Abstractions

**Typed Provider/Emitter Bridge:**

- Purpose: Define one transport-neutral operation/event contract.
- Examples: `src/common/adapter/ipcBridge.ts`, `src/common/adapter/bridgeAllowlist.ts`, `src/process/bridge/conversationBridge.ts`
- Pattern: Typed ports with Electron and standalone/WebSocket adapters.

**Service and Repository:**

- Purpose: Separate product semantics from persistence mechanics.
- Examples: `src/process/services/IConversationService.ts`, `src/process/services/ConversationServiceImpl.ts`, `src/process/services/database/IConversationRepository.ts`, `src/process/services/database/SqliteConversationRepository.ts`
- Pattern: Interface plus concrete service/repository, injected at composition roots.

**Agent Manager and Factory:**

- Purpose: Give heterogeneous backends a common lifecycle while isolating backend protocols.
- Examples: `src/process/task/IAgentManager.ts`, `src/process/task/AgentFactory.ts`, `src/process/task/WCoreManager.ts`, `src/process/task/AcpAgentManager.ts`
- Pattern: Registry/factory plus cached supervised instances.

**Execution Snapshot:**

- Purpose: Give conversation, mission rail, Activity, approvals, cost, and receipts one backend-neutral interpretation.
- Examples: `src/common/execution/types.ts`, `src/common/execution/reducer.ts`, `src/common/execution/adapters/`, `src/common/execution/selectors.ts`
- Pattern: Pure event adapters + bounded immutable reducer + selectors.

**Workbench Section Registration:**

- Purpose: Let canonical stores request contextual presentation without copying their state.
- Examples: `src/renderer/pages/conversation/components/WorkbenchHost/index.tsx`, `src/renderer/pages/conversation/components/ExecutionSpine/index.tsx`
- Pattern: Registry/context with priority, activation keys, pin/dismiss, and presentation-only persistence.

**Shell Composition Root:**

- Purpose: Keep Classic and Cockpit independently loadable over shared routes/services.
- Examples: `src/renderer/components/layout/ShellExperience/ClassicShellRoot.tsx`, `src/renderer/components/layout/ShellExperience/CockpitShellRoot.tsx`
- Pattern: Lazy composition roots behind an error-isolated selector.

**Platform Services:**

- Purpose: Make shared/main code explicit about Electron versus pure-Node host behavior.
- Examples: `src/common/platform/IPlatformServices.ts`, `src/common/platform/ElectronPlatformServices.ts`, `src/common/platform/NodePlatformServices.ts`
- Pattern: Host registration plus interface-based access.

## Entry Points

**Electron Bootstrap:**

- Location: `src/bootstrap.ts`
- Triggers: Electron main bundle.
- Responsibilities: Register schemes, handle recovery CLI operations, preflight state, dynamically load the main application.

**Electron Main:**

- Location: `src/index.ts`
- Triggers: Successful bootstrap preflight.
- Responsibilities: App lifecycle, window/tray/deep-link behavior, run-mode selection, bridge/process initialization, cleanup.

**Standalone Server:**

- Location: `src/server.ts`
- Triggers: Server/headless command.
- Responsibilities: Register Node platform and standalone bridge adapters, initialize state and subsystems, start WebUI, handle signals.

**Renderer:**

- Location: `src/renderer/main.tsx`
- Triggers: Electron `BrowserWindow` or WebUI document loading `src/renderer/index.html`.
- Responsibilities: Browser adapter, global providers/styles/i18n, authentication, router, shell composition.

**Preload:**

- Location: `src/preload/main.ts`
- Triggers: Electron window preload configuration.
- Responsibilities: Expose the narrow `electronAPI`; no application state or DOM manipulation.

**Ambient Preload:**

- Location: `src/preload/ambientPreload.ts`
- Triggers: Optional ambient bubble window.
- Responsibilities: Expose the narrower ambient-window API.

## Architectural Constraints

- **Threading:** Renderer and Electron main each run an event loop. Long-lived agent backends use supervised child processes or protocol clients under `src/process/task/` and `src/process/agent/`; forked background work uses `src/process/worker/` and `src/process/worker/WorkerProtocol.ts`. Do not block the main loop with agent or filesystem-heavy work.
- **Process APIs:** `src/renderer/` may use DOM/browser APIs but not Node/Electron main APIs; `src/process/` may use Node/Electron main APIs but not React/DOM; `src/process/worker/` may use Node APIs but not Electron/DOM; preload only exposes bounded IPC.
- **Global state:** Existing composition-root singletons include `workerTaskManager` (`src/process/task/workerTaskManagerSingleton.ts`), the database singleton (`src/process/services/database/export.ts`), `ExtensionRegistry` (`src/process/extensions/ExtensionRegistry.ts`), adapter registry (`src/common/adapter/registry.ts`), cron service (`src/process/services/cron/cronServiceSingleton.ts`), and selected service singletons. New domain logic should prefer injection and keep singleton acquisition at composition roots.
- **Circular imports:** `src/process/task/workerTaskManagerSingleton.ts` exists specifically to keep task construction out of `initBridge.ts` dependency cycles. No intentional circular chain is an architectural contract; add narrow singleton/composition modules rather than importing bridge initializers from services.
- **Run-mode parity:** Electron desktop and WebUI can use the main adapter; pure Node must use `src/common/adapter/standalone.ts` and `src/process/utils/initBridgeStandalone.ts`. Never import both bridge adapters in one process.
- **Authority:** Desktop owns chats, Projects, heterogeneous Teams, Desktop workflows, scheduling, navigation, host trust, and distribution. Core owns its reasoning, internal agents/workflows, effective policy, memory, and typed evidence. Flux owns route/fallback/cost evidence. The implemented projection in `src/common/execution/` renders those facts; it does not become a competing authority.
- **Shell isolation:** `ui.shell` is device-local presentation state. Shell selection must not migrate or duplicate database objects, routes, conversations, Projects, runtime state, permissions, or receipts.
- **Directory size:** Follow the repository's maximum of 10 direct children for new/refactored directories; split categorical responsibility before exceeding it.

## Anti-Patterns

### Cross-Process Imports or Direct Electron Access

**What happens:** Renderer code imports `@process/*`, Node modules, or Electron-main APIs instead of using a declared bridge.
**Why it's wrong:** The browser/WebUI build cannot execute those modules, Electron sandboxing is bypassed, and host parity breaks.
**Do this instead:** Add a typed provider/emitter in `src/common/adapter/ipcBridge.ts`, expose only the generic transport in `src/preload/main.ts`, and implement the operation under `src/process/bridge/` plus a service where needed.

### Shell- or Workbench-Owned Product State

**What happens:** Cockpit, Classic, or `WorkbenchHost` copies conversations, execution progress, Projects, approvals, or artifacts into a parallel store.
**Why it's wrong:** Shell switching and thread/workbench views can disagree and rollback ceases to be presentation-only.
**Do this instead:** Keep canonical state in existing repositories/message stores; derive UI through `src/common/execution/` selectors and register presentation via `WorkbenchSectionRegistration` in `src/renderer/pages/conversation/components/WorkbenchHost/index.tsx`.

### Backend Event Interpretation in Individual Components

**What happens:** Each renderer surface independently translates raw Core/ACP/Gemini events into lifecycle, policy, cost, or receipt meaning.
**Why it's wrong:** Safety-critical facts drift between the chat, Activity, mission rail, workbench, and WebUI.
**Do this instead:** Extend the relevant adapter in `src/common/execution/adapters/`, enforce bounds/ordering in `src/common/execution/reducer.ts`, then consume selectors from `src/common/execution/selectors.ts`.

### Undeclared or Over-Broad Bridge Dispatch

**What happens:** Code sends arbitrary event names or exposes desktop filesystem/shell mutations to remote WebSocket clients.
**Why it's wrong:** It bypasses the inbound allowlist and crosses the local-user trust boundary.
**Do this instead:** Declare the key through the bridge builders in `src/common/adapter/ipcBridge.ts` or typed storage wrappers, then classify remote access in `src/common/adapter/bridgeAllowlist.ts` and fail closed in `src/process/webserver/adapter.ts`.

### Services Reaching into Presentation or Bridge Initialization

**What happens:** A domain service imports React, a renderer store, or `init*Bridge` functions.
**Why it's wrong:** It reverses dependency direction, complicates standalone composition, and encourages cycles.
**Do this instead:** Keep services behind interfaces under `src/process/services/`, inject repositories/runtime ports from `src/process/utils/initBridge.ts`, and translate only at the bridge boundary.

## Error Handling

**Strategy:** Fail closed at compatibility, trust, and transport boundaries; isolate presentation failures; convert expected operational failures into typed results/events; log and continue only for explicitly optional startup subsystems.

**Patterns:**

- `src/bootstrap.ts` blocks launch on unreadable/future database state before importing stateful `src/index.ts`.
- `src/process/services/database/index.ts` distinguishes native-driver failures from proven corruption and quarantines the complete SQLite DB/WAL/SHM set transactionally.
- `src/common/adapter/main.ts` rejects undeclared bridge names; `src/process/webserver/adapter.ts` adds a reduced remote allowlist and settles rejected provider calls instead of leaving promises pending.
- Bridge providers commonly return `{ success, msg, data }` for expected user-visible failures; renderer callers assert or render those results.
- Agent managers emit terminal error/finish frames when startup or runtime fails so the UI does not remain in an infinite pending state.
- `src/renderer/components/ErrorBoundary.tsx` contains route/application failures, while `src/renderer/components/layout/ShellExperience/index.tsx` specifically restores Classic after Cockpit failure.
- Optional startup systems such as extensions, channels, telemetry, and environment prewarm log bounded errors without taking down the base application.

## Cross-Cutting Concerns

**Logging:** Main-process logging is configured by `src/process/utils/configureConsoleLog.ts` and helpers such as `src/process/utils/mainLogger.ts`; renderer code uses console reporting and user-facing feedback components. Keep secrets and raw credentials out of logs, support bundles, and bridge error payloads.
**Validation:** Bridge allowlists, WebSocket remote policy, SQLite schema compatibility, typed storage keys, workspace path checks, Core protocol validation under `src/process/agent/wcore/`, and immutable execution projection in `src/common/execution/reducer.ts` form layered validation boundaries.
**Authentication:** Electron renderer trust is constrained by context isolation and the preload API. WebUI uses auth routes/JWT handshake under `src/process/webserver/auth/` and applies post-auth capability reduction in `src/process/webserver/adapter.ts`; inbound channel/webhook requests use channel-specific verification under `src/process/channels/webhook/`.
**Authorization:** Workspace trust, approval memory, budget gates, backend-reported policy, and capability enforceability remain distinct inputs. Compose them conservatively through `src/process/permissions/`, `src/common/security/`, agent managers, and `src/common/execution/policy.ts`.
**Internationalization:** Renderer strings live under `src/renderer/services/i18n/locales/`; main-process localization lives under `src/process/services/i18n/`; shared language configuration is `src/common/config/i18n-config.json`.

---

_Architecture analysis: 2026-07-19_
