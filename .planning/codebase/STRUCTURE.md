# Codebase Structure

**Analysis Date:** 2026-07-19

## Directory Layout

```text
wayland/
├── src/                         # Desktop/WebUI application source
│   ├── bootstrap.ts             # Dependency-light Electron recovery/preflight entry
│   ├── index.ts                 # Electron main lifecycle
│   ├── server.ts                # Pure-Node WebUI lifecycle
│   ├── preload/                 # Context-isolated Electron preload scripts
│   ├── common/                  # Cross-process contracts and pure domain logic
│   ├── process/                 # Main/Node process application and runtime
│   ├── renderer/                # React renderer and browser/PWA client
│   ├── utils/                   # Residual app-level utilities
│   └── vendor/                  # Vendored source with local declarations/licenses
├── tests/                       # Unit, integration, E2E, fixtures, and benchmarks
├── test/                        # Live/manual harnesses kept separate from CI suites
├── docs/                        # Architecture, contributor, guide, and planning context
├── contracts/                   # Versioned cross-system schemas and fixtures
├── native/                      # Native helper crates/modules
├── resources/                   # Packaged static/bundled resources and extensions
├── public/                      # Vite-served static assets and PWA resources
├── scripts/                     # Build, release, verification, and maintenance scripts
├── examples/                    # Extension integration examples
├── patches/                     # Dependency patches
├── installer/                   # Installer helper assets/scripts
├── package/                     # Packaging support files
├── homebrew/                    # Homebrew distribution definition
├── strike/                      # Release/audit receipts and evidence
├── .planning/codebase/          # Generated GSD codebase maps
├── package.json                 # Project commands and dependency manifest
├── electron.vite.config.ts      # Electron main/preload build configuration
├── vite.renderer.config.ts      # Renderer/WebUI Vite configuration
├── vitest.config.ts             # Unit/integration test configuration
├── playwright.config.ts         # E2E configuration
├── uno.config.ts                # Utility CSS tokens and presets
└── electron-builder.yml         # Stable packaging configuration
```

## Directory Purposes

**`src/common/`:**

- Purpose: Code safely shared across main, renderer, standalone server, and selected workers.
- Contains: Typed bridge contracts, storage types, execution reducers/adapters, capability/navigation manifests, serializable domain types, platform interfaces, security rules, pure utilities.
- Key files: `src/common/index.ts`, `src/common/adapter/ipcBridge.ts`, `src/common/config/storage.ts`, `src/common/execution/index.ts`, `src/common/capabilities/manifest.ts`, `src/common/shellExperience.ts`
- Placement rule: Put only environment-neutral or explicitly platform-adapted code here. React belongs in `src/renderer/`; Node/Electron IO belongs in `src/process/`.

**`src/preload/`:**

- Purpose: Narrow, context-isolated bridge between Electron windows and the main process.
- Contains: Main-window and ambient-window preload scripts.
- Key files: `src/preload/main.ts`, `src/preload/ambientPreload.ts`
- Placement rule: Expose only bounded IPC functions/events; do not add application state, filesystem access, or DOM manipulation.

**`src/process/`:**

- Purpose: Main-process and pure-Node application logic, IO, runtime supervision, and external integrations.
- Contains: Domain bridges, services, database repositories, agent adapters, workers, channels, extensions, web server, terminal, permissions, secrets, sync, and host utilities.
- Key files: `src/process/index.ts`, `src/process/utils/initBridge.ts`, `src/process/utils/initBridgeStandalone.ts`
- Placement rule: All directories are lowercase. Place IPC transport handlers in `bridge/`, reusable product logic in `services/`, agent runtime code in `agent/` or `task/`, and host utilities in `utils/`.

**`src/process/bridge/`:**

- Purpose: Register typed provider/emitter handlers at the renderer/main boundary.
- Contains: One domain bridge per file plus bridge helper services and tests.
- Key files: `src/process/bridge/index.ts`, `src/process/bridge/conversationBridge.ts`, `src/process/bridge/projectBridge.ts`, `src/process/bridge/workspaceTrustBridge.ts`
- Placement rule: A bridge validates/translates transport input and delegates. Move multi-call business rules to `src/process/services/`.

**`src/process/services/`:**

- Purpose: Main-process domain behavior independent of UI transport.
- Contains: Conversation/Project services, database, recovery, transfer, cron, memory, workflow, MCP, mission control, cost, capability, voice, and other domain modules.
- Key files: `src/process/services/ConversationServiceImpl.ts`, `src/process/services/ProjectServiceImpl.ts`, `src/process/services/database/index.ts`
- Placement rule: Use a single service file for a bounded service; create a lowercase or kebab-case subdirectory when the service has collaborators, repositories, or protocol files.

**`src/process/services/database/`:**

- Purpose: SQLite schema, migrations, driver abstraction, and repositories.
- Contains: `WaylandUIDatabase`, schema/migrations, `I*Repository` interfaces, `Sqlite*Repository` implementations, driver adapters.
- Key files: `src/process/services/database/index.ts`, `src/process/services/database/schema.ts`, `src/process/services/database/migrations.ts`, `src/process/services/database/export.ts`
- Placement rule: Put persistence mapping/query mechanics here; keep user-facing semantics in a service.

**`src/process/task/`:**

- Purpose: Supervise one live agent runtime per conversation and normalize backend lifecycle to Desktop messages/events.
- Contains: `IAgentManager`, `AgentFactory`, `WorkerTaskManager`, backend managers, event emitters, workflow/skill middleware.
- Key files: `src/process/task/IAgentManager.ts`, `src/process/task/AgentFactory.ts`, `src/process/task/WorkerTaskManager.ts`, `src/process/task/WCoreManager.ts`, `src/process/task/workerTaskManagerSingleton.ts`
- Placement rule: Add a manager here when it participates in the common conversation lifecycle; keep low-level protocol/client implementation in `src/process/agent/<backend>/`.

**`src/process/agent/`:**

- Purpose: Low-level AI platform connections, protocol framing, process spawning, and discovery.
- Contains: Core, ACP, remote-agent, OpenClaw, NanoBot, Gemini, and related platform adapters.
- Key files: `src/process/agent/AgentRegistry.ts`, `src/process/agent/acp/index.ts`, `src/process/agent/wcore/index.ts`
- Placement rule: Use a lowercase platform directory with an `index.ts` entry; never move Desktop product organization into a backend adapter.

**`src/process/worker/`:**

- Purpose: Fork-process protocol and worker entry points for background agent/channel tasks.
- Contains: `WorkerProtocol`, fork management, Gemini and email worker entry points.
- Key files: `src/process/worker/WorkerProtocol.ts`, `src/process/worker/index.ts`, `src/process/worker/fork/`
- Placement rule: Worker code may use Node APIs but not Electron or DOM APIs.

**`src/process/webserver/`:**

- Purpose: Serve the renderer remotely and translate authenticated HTTP/WebSocket traffic into application bridges.
- Contains: Auth, API/static routes, middleware, WebSocket manager, remote adapter and server setup.
- Key files: `src/process/webserver/index.ts`, `src/process/webserver/adapter.ts`, `src/process/webserver/routes/`, `src/process/webserver/auth/`
- Placement rule: Put transport/auth concerns here; reuse domain bridges/services rather than creating Web-only product behavior.

**`src/renderer/`:**

- Purpose: React UI shared by Electron renderer and browser/PWA WebUI.
- Contains: Entry HTML/TSX, pages, shared components/hooks, contexts, renderer services, styles, assets, client workers.
- Key files: `src/renderer/index.html`, `src/renderer/main.tsx`, `src/renderer/components/layout/Router.tsx`
- Placement rule: No Node/Electron-main imports. Use `@/`, `@renderer/`, and shared bridge APIs.

**`src/renderer/pages/`:**

- Purpose: Route-level product modules and their private UI/logic.
- Contains: Conversation, new-chat/guid, Projects, settings, Library surfaces, automations, Activity/mission control, memory/wiki, teams, and workflows.
- Key files: `src/renderer/pages/conversation/index.tsx`, `src/renderer/pages/guid/index.tsx`, `src/renderer/pages/projects/ProjectsListPage.tsx`, `src/renderer/pages/mission-control/index.tsx`
- Placement rule: Start page-specific components, hooks, contexts, utilities, types, and constants inside their page. Top-level route directories use lowercase; feature/component directories inside them use PascalCase.

**`src/renderer/pages/conversation/`:**

- Purpose: Shared conversation frame plus backend-specific chat/composer presentation.
- Contains: `Messages/`, `Preview/`, `Workspace/`, `components/`, `hooks/`, `platforms/`, `voice/`, and utilities.
- Key files: `src/renderer/pages/conversation/components/ChatLayout/index.tsx`, `src/renderer/pages/conversation/components/WorkbenchHost/index.tsx`, `src/renderer/pages/conversation/components/ExecutionSpine/index.tsx`, `src/renderer/pages/conversation/platforms/wcore/WCoreChat.tsx`
- Placement rule: Shared conversation chrome goes under `components/`; backend-only presentation goes under `platforms/<backend>/`; workspace/preview behavior remains in its existing feature module.

**`src/renderer/components/`:**

- Purpose: Reusable UI consumed by more than one page.
- Contains: Base primitives, layout/shell, agent/model, chat, settings, execution, cost, media, workspace, command palette, onboarding.
- Key files: `src/renderer/components/layout/ShellExperience/index.tsx`, `src/renderer/components/layout/Layout.tsx`, `src/renderer/components/ErrorBoundary.tsx`
- Placement rule: Generic primitives belong in `base/`; group business components by lowercase domain. A directory-based component must expose `index.ts` or `index.tsx`.

**`src/renderer/hooks/`:**

- Purpose: Shared renderer behavior and bridge-backed state access.
- Contains: Domain folders for agent, chat, context, execution, file, MCP, settings, system, team, UI, usage, and workflow.
- Key files: `src/renderer/hooks/execution/useExecutionSnapshot.ts`, `src/renderer/hooks/ui/useShellExperience.ts`, `src/renderer/hooks/context/ConversationContext.tsx`
- Placement rule: Name hooks `use*.ts`/`use*.tsx`; keep one-page hooks page-private until a second consumer exists.

**`tests/`:**

- Purpose: Automated proof across pure units, process integration, UI DOM, contracts, packaged/E2E journeys, and benchmarks.
- Contains: `unit/`, `integration/`, `e2e/`, `fixtures/`, and `bench/`, grouped by domain.
- Key files: `vitest.config.ts`, `playwright.config.ts`, `tests/unit/execution/`, `tests/integration/process/`, `tests/e2e/specs/`
- Placement rule: Mirror source domains under `tests/unit/` and `tests/integration/`; put complete user journeys in `tests/e2e/specs/` with reusable setup in `tests/e2e/helpers/` and deterministic data in `tests/fixtures/`.

**`docs/desktop-overhaul-source/`:**

- Purpose: Copied, audit-pinned planning and acceptance context for the Desktop overhaul.
- Contains: Master build plan, authority/system contracts, capability and journey audits, Wave 0 execution controls, receipts, mockups, and screenshots.
- Key files: `docs/desktop-overhaul-source/README.md`, `docs/desktop-overhaul-source/MASTER-BUILD-PLAN.md`, `docs/desktop-overhaul-source/SYSTEM-CONTRACTS.md`, `docs/desktop-overhaul-source/CORE-INTEGRATION-MATRIX.md`
- Placement rule: Treat the directory as planning/evidence context, not runtime source. Where older sketches conflict, use the planning authority declared in `docs/desktop-overhaul-source/README.md`.

## Key File Locations

**Entry Points:**

- `src/bootstrap.ts`: Electron compatibility/recovery bootstrap.
- `src/index.ts`: Electron application entry after preflight.
- `src/server.ts`: Pure-Node WebUI/server entry.
- `src/renderer/main.tsx`: React application mount.
- `src/preload/main.ts`: Main-window preload.
- `src/preload/ambientPreload.ts`: Ambient-window preload.

**Configuration:**

- `package.json`: Commands, package metadata, dependencies, and packaged entry definitions.
- `tsconfig.json`: Strict TypeScript and path aliases.
- `electron.vite.config.ts`: Main/preload bundling.
- `vite.renderer.config.ts`: Renderer/WebUI bundling.
- `electron-builder.yml`: Stable release packaging.
- `electron-builder.preview.cjs`: Preview release packaging overrides.
- `uno.config.ts`: Semantic design tokens and utility shortcuts.
- `vitest.config.ts`: Test projects, environments, aliases, and coverage.
- `playwright.config.ts`: E2E runner configuration.
- `.oxlintrc.json`: Oxlint rules.
- `.oxfmtrc.json`: Oxfmt rules.

**Core Logic:**

- `src/common/adapter/ipcBridge.ts`: Typed cross-process API.
- `src/common/execution/`: Backend-neutral execution state.
- `src/process/utils/initBridge.ts`: Desktop dependency composition.
- `src/process/utils/initBridgeStandalone.ts`: Pure-Node dependency composition.
- `src/process/services/database/`: Durable relational state.
- `src/process/services/ConversationServiceImpl.ts`: Conversation semantics.
- `src/process/services/ProjectServiceImpl.ts`: Project/workspace semantics.
- `src/process/task/`: Live agent lifecycle.
- `src/process/agent/wcore/`: Wayland Core wire/runtime adapter.
- `src/process/bridge/`: IPC-domain handlers.
- `src/renderer/components/layout/Router.tsx`: Canonical route map.
- `src/renderer/components/layout/ShellExperience/`: Classic/Cockpit selector and roots.
- `src/renderer/pages/conversation/components/WorkbenchHost/`: Contextual workbench composition.

**Testing:**

- `tests/unit/`: Pure/service/component unit and DOM tests.
- `tests/integration/`: Process and persistence integration tests.
- `tests/e2e/specs/`: Full user journeys.
- `tests/e2e/fixtures/`: Playwright fixtures.
- `tests/fixtures/`: Deterministic protocol, database, extension, and filesystem data.
- `test/live/`: Explicit live-provider/manual harnesses; do not substitute these for deterministic CI proof.

**Documentation and Contracts:**

- `AGENTS.md`: Canonical repository conventions.
- `docs/architecture/overview.md`: Multi-process and run-mode overview.
- `docs/contributing/file-structure.md`: Detailed placement/CSS/UI rules.
- `.claude/skills/architecture/SKILL.md`: Architecture decision tree and required boundaries.
- `docs/desktop-overhaul-source/`: Overhaul planning/evidence context.
- `contracts/wayland-desktop-core/v1/`: Pinned Desktop/Core contract assets.
- `contracts/flux-routing-evidence/v1/`: Flux route/evidence contract assets.

## Naming Conventions

**Files:**

- React components and classes use PascalCase: `CockpitShellRoot.tsx`, `WorkerTaskManager.ts`, `CronService.ts`.
- Hooks use camelCase with `use` prefix: `useShellExperience.ts`, `useExecutionSnapshot.ts`.
- Utilities, bridge files, config, types, and constants use camelCase: `conversationBridge.ts`, `shellExperience.ts`, `types.ts`, `constants.ts`.
- Service implementations use `<Name>Service.ts` or `<Name>ServiceImpl.ts`; service interfaces use `I<Name>Service.ts`.
- Repositories use `I<Name>Repository.ts` and `Sqlite<Name>Repository.ts` when backed by SQLite.
- Directory module entry points use `index.ts` or `index.tsx` and hide private internals from external consumers.
- Component styles use `ComponentName.module.css`; global CSS belongs only in `src/renderer/styles/`.
- Test files use `.test.ts`, `.test.tsx`, `.dom.test.tsx`, `.bun.test.ts`, or E2E naming appropriate to the configured runner.

**Directories:**

- Main/shared categorical and platform directories are lowercase: `services/`, `bridge/`, `wcore/`, `acp/`.
- Multi-word non-component categories may be kebab-case: `mcp-services/` where already established; follow the nearest existing domain convention.
- Renderer component/feature directories are PascalCase: `WorkbenchHost/`, `ShellExperience/`, `Preview/`.
- Renderer categorical directories are lowercase: `components/`, `hooks/`, `utils/`, `context/`, `platforms/`.
- Top-level renderer route segments are lowercase: `conversation/`, `projects/`, `settings/`, `mission-control/`.
- Keep each new/refactored directory at no more than 10 direct children by grouping by responsibility.

## Where to Add New Code

**New Renderer Feature:**

- Primary code: `src/renderer/pages/<route>/`
- Private components: `src/renderer/pages/<route>/components/`
- Private hooks/utilities: `src/renderer/pages/<route>/hooks/` and `src/renderer/pages/<route>/utils/`
- Route registration: `src/renderer/components/layout/Router.tsx`
- Tests: `tests/unit/renderer/<domain>/` plus `tests/e2e/specs/` for a user journey.

**New Shared Component/Hook:**

- Implementation: `src/renderer/components/<domain>/` or `src/renderer/hooks/<domain>/`
- Rule: Promote from a page only after a second consumer exists; generic UI primitives go in `src/renderer/components/base/`.
- Tests: `tests/unit/renderer/<domain>/`.

**New Cockpit or Classic Composition:**

- Shell roots: `src/renderer/components/layout/ShellExperience/`
- Shared shell layout behavior: `src/renderer/components/layout/Layout.tsx`
- Cockpit navigation: `src/renderer/components/layout/CockpitSider/` and `src/common/navigation/cockpit.ts`
- Rule: Keep domain services/routes shared and preserve independent lazy loading/fallback.

**New Conversation Projection:**

- Canonical domain types/events: `src/common/execution/types.ts`
- Backend translation: `src/common/execution/adapters/<backend>.ts`
- Reduction/validation: `src/common/execution/reducer.ts`
- Selectors: `src/common/execution/selectors.ts`
- Contextual panel: register from `src/renderer/pages/conversation/components/` through `src/renderer/pages/conversation/components/WorkbenchHost/index.tsx`
- Tests: `tests/unit/execution/` and consuming renderer tests.

**New IPC Capability:**

- Shared typed contract: `src/common/adapter/ipcBridge.ts`
- Main handler: `src/process/bridge/<domain>Bridge.ts`
- Registration: `src/process/bridge/index.ts` and, when supported, `src/process/utils/initBridgeStandalone.ts`
- Business logic: `src/process/services/<domain>/` or `src/process/services/<Name>Service.ts`
- Remote classification: `src/common/adapter/bridgeAllowlist.ts`
- Tests: `tests/unit/bridge/` plus service/integration tests.

**New Service or Repository:**

- Service interface/implementation: `src/process/services/I<Name>Service.ts` and `src/process/services/<Name>ServiceImpl.ts`, or a focused lowercase subdirectory for a complex service.
- Repository interface/implementation: `src/process/services/database/I<Name>Repository.ts` and `src/process/services/database/Sqlite<Name>Repository.ts`.
- Composition: inject it from `src/process/utils/initBridge.ts` or a domain singleton module only when existing lifecycle requires one.
- Tests: `tests/unit/process/` or `tests/integration/process/`, grouped by domain.

**New Agent Backend:**

- Protocol/client: `src/process/agent/<backend>/index.ts` and private files in that directory.
- Desktop manager: `src/process/task/<Backend>AgentManager.ts` implementing `src/process/task/IAgentManager.ts`.
- Factory registration: `src/process/task/workerTaskManagerSingleton.ts`.
- Shared backend type/config: `src/common/types/` or the closest existing shared domain.
- Renderer-specific UI: `src/renderer/pages/conversation/platforms/<backend>/`.
- Execution projection: `src/common/execution/adapters/<backend>.ts`.
- Tests: `tests/unit/task/`, `tests/integration/process/`, and deterministic E2E fixtures.

**New Background Worker:**

- Protocol change: `src/process/worker/WorkerProtocol.ts`.
- Worker entry: `src/process/worker/<backend>.ts` or `src/process/worker/fork/`.
- Main-process supervisor: `src/process/task/` or the owning service.
- Rule: No Electron or DOM APIs in worker code.

**New Web/API Surface:**

- HTTP route: `src/process/webserver/routes/`.
- Middleware/auth: `src/process/webserver/middleware/` or `src/process/webserver/auth/`.
- WebSocket capability: reuse the typed bridge and classify it in `src/common/adapter/bridgeAllowlist.ts`.
- Tests: `tests/unit/webserver/` and `tests/e2e/specs/`.

**Utilities:**

- Cross-process pure helpers: `src/common/utils/`.
- Main-process/Node helpers: `src/process/utils/`.
- Renderer-only helpers: `src/renderer/utils/<domain>/`.
- Page-private helpers: `src/renderer/pages/<route>/utils/`.

## Special Directories

**`.planning/codebase/`:**

- Purpose: GSD-generated maps consumed by later planning/execution commands.
- Generated: Yes.
- Committed: Project-dependent; treat current files as generated planning artifacts.

**`docs/desktop-overhaul-source/`:**

- Purpose: Copied audit baseline, authoritative master plan, system contracts, Wave 0 controls, and evidence receipts.
- Generated: Mixed; includes authored Markdown plus generated evidence/screenshots.
- Committed: Yes.

**`contracts/`:**

- Purpose: Versioned producer/consumer schemas, manifests, fixtures, and cross-system evidence contracts.
- Generated: Mixed; some assets are producer-generated and vendored, others are authored contract metadata.
- Committed: Yes.

**`resources/`:**

- Purpose: Files copied into packages, including built-in and bundled extensions.
- Generated: Mixed.
- Committed: Yes.

**`public/`:**

- Purpose: Renderer assets copied/served without module imports, including PWA and pet-state assets.
- Generated: No.
- Committed: Yes.

**`native/`:**

- Purpose: Native helper implementation such as `native/constitution-fs/`.
- Generated: No; build outputs are excluded.
- Committed: Yes.

**`src/vendor/`:**

- Purpose: Vendored third-party source/declarations with licenses when normal package consumption is unsuitable.
- Generated: No.
- Committed: Yes.

**`strike/`:**

- Purpose: Audit and release evidence/receipts, separate from runtime source and tests.
- Generated: Mixed.
- Committed: Yes.

**`tests/fixtures/`:**

- Purpose: Deterministic fake executables, extension trees, filesystem state, protocol records, and migration inputs.
- Generated: Mixed; pinned fixtures should remain immutable when they represent external contracts.
- Committed: Yes.

**`out/`, `dist/`, `node_modules/`:**

- Purpose: Local build output and dependencies.
- Generated: Yes.
- Committed: No.

---

_Structure analysis: 2026-07-19_
