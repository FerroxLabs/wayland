# Coding Conventions

**Analysis Date:** 2026-07-19

## Naming Patterns

**Files:**
- Name React components and class-bearing modules in PascalCase, for example `src/renderer/pages/guid/components/newChatStarter/KickoffCard.tsx`, `src/process/services/cron/CronService.ts`, and `src/process/channels/gateway/ActionExecutor.ts`.
- Name hooks with a camelCase `use` prefix, as in `src/renderer/hooks/chat/useSendBoxDraft.ts` and `src/renderer/hooks/workflow/useWorkflowSession.ts`.
- Name pure utilities and protocol helpers in camelCase, as in `src/process/channels/tunnel/parseTunnelUrl.ts`, `src/process/utils/safeSpawnCwd.ts`, and `src/common/routingEvidence/v1.ts`.
- Use `index.ts` or `index.tsx` as the public entry point for directory-based modules; examples include `src/process/channels/index.ts` and `src/renderer/services/i18n/index.ts`.
- Use `*.module.css` for component-scoped styles, for example `src/renderer/pages/guid/components/newChatStarter/KickoffCard.module.css`; reserve global CSS for `src/renderer/styles/`.
- Name ordinary Vitest suites `*.test.ts`, DOM suites `*.dom.test.ts` or `*.dom.test.tsx`, Electron E2E suites `*.e2e.ts`, live suites `*.live.spec.ts`, and Bun-native suites `*.bun.test.ts`; the mappings are configured in `vitest.config.ts`, `playwright.config.ts`, and `test/live/playwright.config.ts`.

**Functions:**
- Use camelCase verbs that state behavior, such as `parseCloudflaredUrl` in `src/process/channels/tunnel/parseTunnelUrl.ts`, `buildChildEnv` in `src/process/services/ijfw/envAllowlist.ts`, and `initAllBridges` in `src/process/bridge/index.ts`.
- Prefix predicates with `is`, `has`, `can`, or `should`; examples include `isProviderUnreachableWebhookUrl` in `src/process/channels/tunnel/webhookExposureGuard.ts` and `canSendTypingIndicator` in `src/process/channels/gateway/ActionExecutor.ts`.
- Prefix intentionally test-only exports with `__`, as in `__buildNpmCliCandidates` and `__setTrustedNpmCliResolver` in `src/process/services/ijfw/safeSpawn.ts`.
- Name bridge registration functions `init<Domain>Bridge` and service setup functions `initialize<Domain>`; the composition roots are `src/process/bridge/index.ts` and `src/process/utils/initBridgeStandalone.ts`.

**Variables:**
- Use camelCase for locals and object fields; use UPPER_SNAKE_CASE for module constants such as `ALLOW_EXACT` in `src/process/services/ijfw/envAllowlist.ts` and `CLOUDFLARED_URL_REGEX` in `src/process/channels/tunnel/parseTunnelUrl.ts`.
- Prefix deliberately unused parameters or declarations with `_`; `.oxlintrc.json` configures `argsIgnorePattern` and `varsIgnorePattern` as `^_`.
- Use descriptive state names for asynchronous coordination, for example `cronMutationTail`, `runningJobs`, and `retryTimers` in `src/process/services/cron/CronService.ts`.

**Types:**
- Prefer `type` for props, unions, DTOs, and function contracts, as shown by `KickoffCardProps` in `src/renderer/pages/guid/components/newChatStarter/KickoffCard.tsx` and `FluxRoutingEvidenceSnapshot` in `src/process/flux/FluxRoutingEvidenceAdapter.ts`.
- Existing service boundaries also use `interface` with an `I` prefix, for example `src/process/services/database/IConversationRepository.ts` and `src/process/services/cron/ICronRepository.ts`; match the touched subsystem instead of introducing a third style.
- Use PascalCase for types and classes, discriminated lowercase string literals for state, and explicit return types on exported functions. Representative files are `src/process/acp/types.ts`, `src/process/services/cron/CronService.ts`, and `src/process/channels/tunnel/webhookExposureGuard.ts`.

## Code Style

**Formatting:**
- Run Oxfmt through `bun run format`; check-only formatting is `bun run format:check` in `package.json`.
- Follow `.oxfmtrc.json`: semicolons, single quotes including JSX, trailing commas for ES5-valid multiline constructs, 120-column width, two spaces, no tabs, LF endings, spaced object braces, and parenthesized arrow parameters.
- `.prettierrc.json` mirrors the Oxfmt settings, but `package.json` makes Oxfmt authoritative. Do not introduce formatting that only Prettier accepts.
- Include the SPDX license header used by source and test files such as `src/process/channels/tunnel/parseTunnelUrl.ts` and `tests/unit/channels/tunnel/parseTunnelUrl.test.ts`.

**Linting:**
- Run Oxlint through `bun run lint` or `bun run lint:fix`; configuration lives in `.oxlintrc.json`.
- Treat correctness findings as errors, suspicious and performance findings as warnings, and keep type-only imports consistent. `no-floating-promises`, `no-await-thenable`, and `consistent-type-imports` are errors in production TypeScript.
- Prefix unused values with `_`; do not add unscoped `any`. Existing `no-unused-vars` and `no-explicit-any` findings are warnings, so new code must not rely on the warning level as permission.
- Under `src/process/services/ijfw/`, never import `child_process` outside `src/process/services/ijfw/safeSpawn.ts`; `.oxlintrc.json` enforces this with `no-restricted-imports`.
- Do not suppress rules globally. Keep any `eslint-disable` or `oxlint-disable` adjacent to the exceptional line and explain the invariant, as in `src/process/services/transfer/publish/transferPublisher.ts` and `src/process/team/Watchdog.ts`.

**UI and CSS:**
- Use Arco components for interactive controls and UnoCSS for simple layout; `src/renderer/pages/guid/components/newChatStarter/KickoffCard.tsx` demonstrates Arco `Button` plus a CSS Module.
- Use semantic color tokens from `uno.config.ts` or variables in `src/renderer/styles/`; avoid hardcoded color values and ordinary component-global CSS.
- Place user-facing copy behind `react-i18next` or process i18n. Renderer usage is visible in `src/renderer/pages/guid/components/newChatStarter/KickoffCard.tsx`; process usage is visible in `src/process/services/cron/CronService.ts`.
- Follow the canonical icon rule in `AGENTS.md` when adding icons, but inspect `CONCERNS.md` before touching icon code: `src/renderer/` contains an unresolved `lucide-react` versus `@icon-park/react` convention conflict, and `tests/vitest.dom.setup.ts` assumes Lucide test IDs.

## Import Organization

**Order:**
1. Import runtime dependencies from Node, Electron, React, and external packages.
2. Import shared aliases from `@/`, then process-specific aliases such as `@process/`, `@renderer/`, and `@worker/`.
3. Import same-module relative dependencies and styles last.
4. Use `import type` for type-only dependencies; `.oxlintrc.json` enforces this rule.

- Existing large files such as `src/process/channels/gateway/ActionExecutor.ts` and `src/renderer/pages/conversation/components/ChatConversation.tsx` interleave these groups. New or edited import blocks should normalize the touched block without unrelated file-wide churn.
- Prefer aliases across domains and relative imports within a tightly coupled local module. `src/process/services/cron/CronService.ts` uses aliases for shared/process dependencies and relative imports for the cron package.

**Path Aliases:**
- `@/*` maps to `src/*`.
- `@process/*` maps to `src/process/*`.
- `@renderer/*` maps to `src/renderer/*`.
- `@worker/*` maps to `src/process/worker/*`.
- TypeScript aliases are defined in `tsconfig.json`; Vitest mirrors them in `vitest.config.ts`.

## Error Handling

**Patterns:**
- Throw explicit `Error` instances for violated invariants and invalid operations, as in `src/process/services/ijfw/safeSpawn.ts`, `src/process/channels/tunnel/webhookExposureGuard.ts`, and `src/process/services/cron/CronService.ts`.
- At IPC and service boundaries, catch `unknown`, narrow with `instanceof Error`, and return a typed success/error result when the bridge contract expects recovery. `src/process/bridge/skillsBridge.ts` and `src/process/services/autoUpdaterService.ts` demonstrate this form.
- Fail closed at security boundaries. `src/process/services/ijfw/envAllowlist.ts` rejects invalid environment keys, `src/process/channels/tunnel/webhookExposureGuard.ts` rejects unparseable or non-HTTPS provider webhooks, and `src/process/services/ijfw/safeSpawn.ts` rejects untrusted npm resolvers.
- Use best-effort catches only for explicitly optional capability initialization and expose degraded state. `src/index.ts` records updater availability; `src/process/bridge/index.ts` logs model-registry and ACP detector failures.
- Do not add empty catches that erase consequential state. Existing empty catches in large orchestration files are debt catalogued in `CONCERNS.md`.

## Logging

**Framework:** Mixed `console` and `electron-log`.

**Patterns:**
- Prefix process logs with a stable subsystem tag such as `[CronService]`, `[ActionExecutor]`, or `[AcpRuntime]`; examples are in `src/process/services/cron/CronService.ts`, `src/process/channels/gateway/ActionExecutor.ts`, and `src/process/acp/runtime/AcpRuntime.ts`.
- Use `electron-log` for packaged lifecycle services that need persistent logs, as in `src/process/services/autoUpdaterService.ts`; DOM tests stub the renderer logger globally in `tests/vitest.dom.setup.ts`.
- Never log credentials, bearer tokens, raw secrets, or unrestricted environment objects. Credential handling lives in `src/process/channels/utils/credentialCrypto.ts`, and child environment filtering lives in `src/process/services/ijfw/envAllowlist.ts`.
- Log recoverable degradation at `warn`, failed operations at `error`, and high-volume performance traces only behind their owning debug mode. The ACP performance call sites are concentrated in `src/process/agent/acp/AcpConnection.ts` and `src/process/agent/acp/index.ts`.

## Comments

**When to Comment:**
- Explain security boundaries, ordering, concurrency, compatibility, and non-obvious platform behavior. Strong examples are `src/process/extensions/lifecycle/lifecycleRunner.ts`, `src/process/services/ijfw/safeSpawn.ts`, and `tests/unit/helpers/nativeSqlite.ts`.
- Use issue or packet identifiers when a comment pins a temporary compatibility decision, as in `src/process/acp/runtime/AcpRuntime.ts` and `src/process/task/WCoreManager.ts`.
- Do not narrate obvious syntax. Comments should preserve the reason a future simplification could be unsafe.
- Keep comments in English, per `AGENTS.md`.

**JSDoc/TSDoc:**
- Add JSDoc to exported functions, public service methods, protocol DTOs, and security-sensitive helpers. Examples include `src/process/channels/tunnel/webhookExposureGuard.ts` and `src/process/services/ijfw/safeSpawn.ts`.
- Document thrown errors and trust assumptions where callers must preserve them, as in `encryptString` in `src/process/channels/utils/credentialCrypto.ts`.
- React prop types may use short field-level doc comments when interaction semantics are not obvious, as in `KickoffCardProps` in `src/renderer/pages/guid/components/newChatStarter/KickoffCard.tsx`.

## Function Design

**Size:** Keep transformation and validation functions small and pure. Split IO orchestration from parsers, as `src/process/channels/tunnel/parseTunnelUrl.ts` is separated from `src/process/channels/tunnel/TunnelManager.ts`. Do not copy the monolithic patterns in `src/common/adapter/ipcBridge.ts`, `src/process/task/AcpAgentManager.ts`, or `src/process/services/database/migrations.ts`.

**Parameters:** Prefer typed object parameters for evolving contracts and constructor injection for services. `CronService` injects repository, emitter, executor, and conversation repository dependencies in `src/process/services/cron/CronService.ts`; `safeSpawn` accepts `SafeSpawnOptions` in `src/process/services/ijfw/safeSpawn.ts`.

**Return Values:** Use explicit discriminated results for recoverable bridge failures, nullable returns for absence, and exceptions for violated invariants. Examples are `src/process/bridge/skillsBridge.ts`, `src/process/channels/tunnel/parseTunnelUrl.ts`, and `src/process/channels/tunnel/webhookExposureGuard.ts`.

## Module Design

**Exports:** Prefer named exports for services, pure helpers, and protocol types. React leaf components commonly default-export the component while named-exporting props, as in `src/renderer/pages/guid/components/newChatStarter/KickoffCard.tsx`.

**Barrel Files:** Use barrels at stable package boundaries, such as `src/process/acp/index.ts`, `src/process/channels/index.ts`, and `src/renderer/pages/cron/index.ts`. Do not reach into a directory-based component's private implementation from another feature.

- Keep Electron process APIs inside `src/process/`, browser/React code inside `src/renderer/`, shared serializable contracts inside `src/common/`, and main/renderer communication behind `src/process/bridge/` plus `src/preload/main.ts`.
- Start renderer feature code page-private under `src/renderer/pages/<page>/`; promote it to `src/renderer/components/`, `src/renderer/hooks/`, or `src/renderer/utils/` only after a second consumer exists.
- Keep directories at ten direct children or fewer and split by responsibility according to `docs/contributing/file-structure.md`; existing violations are mapped in `CONCERNS.md`.

---

*Convention analysis: 2026-07-19*
