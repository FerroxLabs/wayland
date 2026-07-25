# Codebase Concerns

**Analysis Date:** 2026-07-19

This map distinguishes current source/configuration evidence from findings copied into `docs/desktop-overhaul-source/`. The copied material is an authoritative audit baseline for Desktop `v0.11.18`, but package, vulnerability, bundle, and runtime measurements should be rerun before they are presented as current release evidence.

## Tech Debt

### Weak TypeScript and lint enforcement

**Evidence:**

- `tsconfig.json` enables `noImplicitAny` but does not enable TypeScript `strict` mode.
- `.oxlintrc.json` treats `@typescript-eslint/no-explicit-any` and unused variables as warnings rather than errors.
- A static source scan found 1,138 `any` occurrences, 155 lint-disable comments, and 6 TypeScript suppression directives under `src/`.
- High-complexity files such as `src/process/task/ActionExecutor.ts` mix broad dependency surfaces, `any`, empty catches, and user-facing fallback strings.

**Impact:** Incorrect cross-process payloads, provider responses, and workflow states can survive typechecking and move failures into runtime.

**Direction:** Enable stricter options incrementally by subsystem, make newly introduced `any` an error, and define typed boundary schemas before attempting a repository-wide strict-mode flip.

### Oversized files and flat directories

**Evidence:**

- `src/common/adapter/ipcBridge.ts` is approximately 3,339 lines.
- `src/process/task/AcpAgentManager.ts` is approximately 2,701 lines.
- `src/process/providers/ipc/modelRegistryIpc.ts` is approximately 2,409 lines.
- `src/process/bridge/fsBridge.ts` is approximately 2,231 lines.
- `src/process/bridge/` has 79 direct children and `src/process/services/` has 50.
- `src/renderer/hooks/` has 23 direct children and `src/renderer/components/` has 18.
- The architectural convention says directories should have no more than ten direct children, but no automated enforcement was found.

**Impact:** Ownership is unclear, changes have large review surfaces, and related lifecycle behavior is easy to register or clean up inconsistently.

**Direction:** Split by bounded feature and process boundary. Add a structural check for direct-child limits and prevent new growth in files already above an agreed line threshold.

### Manual bridge registration

**Evidence:**

- `src/process/bridge/index.ts` imports and initializes a long explicit list of bridge modules.
- `src/process/utils/initBridgeStandalone.ts` maintains a second registration surface for standalone behavior.
- Several initializers catch failures, log them, and allow startup to continue.

**Impact:** Adding a bridge can update one runtime path but not another. Partial startup can expose a renderer capability whose process handler never registered.

**Direction:** Generate or declaratively enumerate bridge registrations from one manifest, validate duplicate/missing channels at startup, and return structured capability availability to the renderer.

### Logging fragmentation

**Evidence:**

- A static source scan found 2,282 `console` calls.
- Only 26 source files import `electron-log`.
- `pino` is a dependency but no source imports were found in the mapped tree.

**Impact:** Diagnostics have inconsistent metadata, redaction, persistence, and correlation across main, renderer, and worker processes.

**Direction:** Adopt one structured logging facade with process, session, task, provider, and request correlation fields. Enforce redaction and replace direct console use at boundary-heavy services first.

### UI convention drift

**Evidence:**

- `AGENTS.md` names `@icon-park/react` as the icon convention.
- Static import inventory found 308 renderer files importing `lucide-react` and only 24 importing `@icon-park/react`.
- `tests/vitest.dom.setup.ts` contains explicit Lucide-related DOM handling, showing the newer convention is embedded in tests.
- Static source inventory also found 257 raw interactive HTML tags and 824 inline-style occurrences in renderer code.

**Impact:** The written design contract does not describe the dominant implementation. Accessibility and theming behavior varies between raw controls, Arco controls, and local CSS.

**Direction:** Decide and document the canonical icon library, migrate by feature rather than opportunistically, and add lint rules for raw interactive controls and non-token color/style use.

## Known Bugs and Incomplete Paths

### Cloud relay is present but not implemented

**Evidence:** `src/process/cloud/CloudRelayBackend.ts` contains the backend surface but throws for unimplemented operations and has no observed production caller beyond its own declaration.

**Impact:** The code shape suggests a cloud runtime capability that cannot complete a user journey.

**Direction:** Either implement and gate the backend behind an explicit capability contract or remove it from user-visible/catalog claims until it is wired and release-tested.

### Skills build remains a deterministic draft

**Evidence:**

- `src/process/bridge/skillsBridge.ts` returns deterministic draft behavior with TODO markers.
- `src/common/adapter/ipcBridge.ts` exposes the associated adapter surface.
- `src/renderer/components/skills/SkillRuleGenerator.tsx` is hidden by commented rendering logic in `src/renderer/components/ChatConversation.tsx`.

**Impact:** The bridge and UI imply a generation workflow without a complete model-backed, reviewed, durable path.

**Direction:** Define the product contract, approval boundary, persistence model, and failure states before un-hiding the workflow.

### Workflow controls are visibly incomplete

**Evidence:**

- `src/renderer/components/workflow/QueuedSteeringChip.tsx` records that interrupt behavior is not wired.
- `src/renderer/components/workflow/WorkflowSurface.tsx` is hidden behind an internal flag and retains a stop-action TODO.

**Impact:** Users can see queued or running workflow state without dependable steering and stop semantics.

**Direction:** Make stop/interrupt idempotent across renderer, preload, process, and provider boundaries, then cover it with required integration and Electron journey tests.

### Flux routing evidence has no live producer

**Evidence:**

- `src/process/flux/FluxRoutingEvidenceAdapter.ts` reports `no_flux` until a live producer transport exists.
- `src/process/bridge/index.ts` initializes the no-Flux path.

**Impact:** Desktop can display an evidence adapter shape without current routing provenance from Flux.

**Direction:** Wire a versioned producer transport and prove missing, delayed, duplicate, and rejected evidence behavior before describing the integration as live.

### Transfer preflight blocks on absent authority

**Evidence:** `src/process/bridge/wcoreBridge.ts` currently supplies false capability values for desktop quiescence, Core quiescence, and sealed sensitive copies during transfer preflight.

**Impact:** The preflight honestly prevents unsafe transfer, but the flagship transfer journey cannot become ready until those authorities exist.

**Direction:** Implement separately attestable authorities and preserve the fail-closed behavior. Do not replace these checks with optimistic defaults.

### Linux updater signature verification is unfinished

**Evidence:** `src/process/services/autoUpdaterService.ts` contains a TODO for GPG verification of `.deb.sig` artifacts.

**Impact:** Linux package authenticity does not have the same completed verification path implied by signed update delivery.

**Direction:** Verify detached signatures against a pinned, rotatable trust root before installation and add tampered, missing, expired, and wrong-key release tests.

## Security Considerations

### Extension execution is not sandboxed

**Evidence:**

- `src/process/extensions/lifecycle/lifecycleRunner.ts` states that lifecycle code runs with full Node privileges, uses evaluated `require`, and is not sandboxed.
- `src/process/extensions/sandbox/sandboxWorker.ts` explicitly says it is not a security sandbox and exposes full Node APIs; only extension storage permission is enforced there.
- `src/process/extensions/resolvers/ChannelPluginResolver.ts` loads channel plugins in the main process with full privileges.
- `src/process/webserver/routes/apiRoutes.ts` dynamically loads extension route modules, and extension manifests can mark routes as not requiring authentication.
- `src/process/extensions/hub/HubInstaller.ts` adds SRI validation and native confirmation, but those controls do not confine code after installation.

**Impact:** An installed or compromised extension can access the filesystem, environment, network, credentials available to the process, and other application state. “Sandbox” naming can overstate the security boundary.

**Direction:** Treat extensions as native-trust code until a real isolation boundary exists. Require signed publisher identity, explicit capabilities, least-privilege host RPC, authenticated extension routes, revocation, and an isolated process/VM boundary for untrusted code.

### Approval and trust semantics are incomplete across flagship paths

**Evidence:** `docs/desktop-overhaul-source/CONCERNS-REGISTER.md` records trust/HITL incompleteness and cloud/desktop capability divergence for the pinned `v0.11.18` audit baseline.

**Impact:** A workflow can appear supported in one execution mode while lacking equivalent approval, denial, timeout, and audit semantics in another.

**Direction:** Use one versioned approval state machine across local, cloud, ACP, extension, and Core-controlled actions. Test deny, revoke, timeout, duplicate response, process restart, and reconnect behavior.

### Dependency risk needs live revalidation

**Evidence:** `docs/desktop-overhaul-source/CONCERNS-REGISTER.md` records 101 advisories, including one critical and 24 high-severity findings, in the pinned audit environment.

**Impact:** The baseline is material but not sufficient to claim the current lockfile is vulnerable or clean.

**Direction:** Run the repository's pinned audit against `bun.lock` in a clean dependency environment, triage reachable production paths, and add a release-blocking policy with explicit temporary exceptions and expiry dates.

## Performance Bottlenecks

### Large startup and bridge surfaces

**Evidence:**

- `src/index.ts` is approximately 1,702 lines and coordinates broad application startup behavior.
- `src/process/bridge/index.ts` eagerly registers a large bridge set.
- `src/process/database/index.ts`, `src/process/task/AcpAgentManager.ts`, and `src/process/wcore/WCoreManager.ts` are large central coordinators.

**Impact:** Startup work is difficult to budget and one slow initialization can delay the entire desktop surface. Failures are hard to attribute without structured spans.

**Direction:** Measure startup stages, lazy-initialize feature subsystems, expose readiness per capability, and set cold-start budgets in packaged builds.

### Bundle and installer weight

**Evidence:** The pinned audit in `docs/desktop-overhaul-source/` reports an approximately 4.09 MB renderer entry, a 9.35 MB main-process bundle, and release packages in the roughly 340–635 MB range. These figures were not remeasured in the current workspace.

**Impact:** Large assets and eager dependencies slow download, install, update, startup, and CI artifact handling.

**Direction:** Reproduce bundle analysis from the pinned lockfile, classify assets by runtime need, defer optional providers/features, and add platform package-size budgets to release checks.

### Serial Electron suite limits feedback speed

**Evidence:** `playwright.config.ts` fixes Electron E2E to one worker and disables full parallelism because the fixture shares one application process.

**Impact:** Adding journey coverage increases wall-clock time linearly and encourages developers to rely on narrower suites.

**Direction:** Preserve serial execution within one app while sharding independent packaged-app instances in CI. Separate smoke, critical-journey, and extended suites with explicit required gates.

## Fragile Areas

### ACP has overlapping runtime models

**Evidence:**

- `src/process/acp/runtime/AcpRuntime.ts` is exported but no production use was found.
- Its persistence path is commented because the stored `agent_id` is wrong.
- Production coordination instead flows through `src/process/task/AcpAgentManager.ts` and `AcpAgentV2`.
- Renderer compatibility logic merges different shapes rather than consuming one stable runtime contract.

**Impact:** Fixes can land in an inactive runtime, persistence semantics can diverge, and UI compatibility code can hide contract drift.

**Direction:** Name one canonical runtime, migrate persistence with an explicit schema/version plan, delete or quarantine the inactive path, and validate renderer payloads at the boundary.

### Core integration is fixture-strong but event-incomplete

**Evidence:**

- `docs/desktop-overhaul-source/CORE-INTEGRATION-MATRIX.md` records an accepted 110-fixture v1 compatibility corpus.
- The same matrix records remaining gaps for capability activation, provider attempt/retry/failure, compact/offload, memory signals, renderer/durable presentation, and the release matrix.

**Impact:** Fixture compatibility can pass while live lifecycle behavior and user-visible durable presentation remain incomplete.

**Direction:** Keep the accepted corpus as a regression floor, then promote each missing event family through source presence, transport wiring, persistence, renderer presentation, and packaged user verification.

### Silent partial initialization

**Evidence:** Several modules reached from `src/process/bridge/index.ts` log initialization failures and continue.

**Impact:** The application can start in a partially functional state without a precise capability diagnosis, producing later “nothing happened” failures.

**Direction:** Classify startup failures as fatal, degraded, or optional; publish a structured readiness manifest; and make the renderer disable unavailable actions with a reason.

### Dead or disconnected UI candidates

**Evidence:**

- `src/renderer/components/ChatHistory.tsx` has no observed imports.
- `src/renderer/components/skills/SkillRuleGenerator.tsx` is hidden by commented usage.
- `src/process/cloud/CloudRelayBackend.ts` is present without a usable production path.

**Impact:** Unused feature candidates accumulate stale assumptions and inflate the apparent supported surface.

**Direction:** Give each candidate an owner and disposition: wire with acceptance evidence, move behind an explicit experimental boundary, or delete.

## Scaling Limits

### Central manager and adapter concentration

**Evidence:** `src/process/task/AcpAgentManager.ts`, `src/common/adapter/ipcBridge.ts`, and `src/process/providers/ipc/modelRegistryIpc.ts` centralize many unrelated operations and payload variants.

**Impact:** More agents, providers, and workflows increase contention, change coupling, and the number of states each coordinator must understand.

**Direction:** Partition by bounded capability, define versioned message schemas, isolate provider adapters, and make queue/backpressure limits explicit.

### Shared singleton E2E state

**Evidence:** `tests/e2e/fixtures.ts` owns a shared Electron instance and `playwright.config.ts` allows only one worker.

**Impact:** Test isolation depends on manual state cleanup, and the suite cannot scale through ordinary Playwright worker parallelism.

**Direction:** Introduce repeatable per-shard profiles and packaged-app instances before materially expanding the required E2E matrix.

### Generated and catalog surfaces are large

**Evidence:** Static mapping found approximately 5,246 generated i18n keys, while provider/model registries and IPC adapters are among the largest source files.

**Impact:** Manual editing and validation do not scale as providers, models, locales, and capabilities grow.

**Direction:** Generate registries and schemas from validated source manifests, detect stale generated artifacts in CI, and add catalog-contract tests.

## Dependencies at Risk

### Native modules and platform ABI

**Evidence:** `tests/unit/helpers/nativeSqlite.ts` conditionally skips when the native SQLite binding cannot load locally, but turns the condition into a CI failure.

**Impact:** Bun, Node/Electron, OS, and architecture upgrades can break native loading even when TypeScript and browser tests pass.

**Direction:** Keep native ABI checks required across supported platforms and run them against packaged artifacts, not only source-mode installs.

### Duplicate Codecov policy files

**Evidence:** Both `codecov.yml` and `.codecov.yml` exist with different policy values.

**Impact:** Maintainers can believe one coverage policy is active while the service resolves another.

**Direction:** Retain one canonical file, document service resolution, and make the intended threshold visible in required CI.

### Unused or unclear runtime dependencies

**Evidence:** `pino` is declared in `package.json`, but no source import was found; logging instead relies largely on `console` and some `electron-log` use.

**Impact:** Dependencies add install weight and audit surface without an established runtime role.

**Direction:** Remove unused dependencies or complete the documented migration and enforce the selected facade.

## Missing Critical Features

### Flagship journeys are not complete release gates

**Evidence:** `docs/desktop-overhaul-source/CONCERNS-REGISTER.md` records that flagship journeys were not release-gated in the pinned audit. Current `.github/workflows/pr-checks.yml` runs the security-audit E2E subset, while `.github/workflows/pr-e2e-artifacts.yml` leaves the fuller suite manual.

**Impact:** A PR can pass required checks without proving the complete user journeys most likely to define product readiness.

**Direction:** Select a small, deterministic critical-journey set and require it on packaged builds across supported release platforms.

### Accessibility is not an automated gate

**Evidence:** No axe-based test dependency or required accessibility workflow was identified in `package.json` or `.github/workflows/`; renderer tests focus on functional behavior.

**Impact:** Raw controls, focus flow, names, contrast, and keyboard regressions can ship without a machine-enforced signal.

**Direction:** Add automated axe checks for page shells and critical dialogs, keyboard-only E2E journeys, and a manual assistive-technology release checklist.

### Live provider workflows remain opt-in and partly scaffolded

**Evidence:** `test/live/README.md` describes real-provider setup, brittle selectors, and multiple `test.fixme` non-model scenarios; the live suite is separate from default and PR commands.

**Impact:** Provider authentication, streaming, retry, and approval regressions can escape deterministic mocks.

**Direction:** Maintain deterministic contract tests for every provider and run a small secret-backed canary matrix on a controlled schedule and before release.

### Cloud/local capability parity is unresolved

**Evidence:** The pinned `docs/desktop-overhaul-source/CONCERNS-REGISTER.md` records cloud build/runtime incompleteness and cloud/desktop capability divergence; `src/process/cloud/CloudRelayBackend.ts` remains incomplete.

**Impact:** The same visible action can have different support and trust semantics depending on execution mode.

**Direction:** Publish capability negotiation as data, disable unsupported paths before invocation, and require parity or an explicit product-level exception per flagship journey.

## Test Coverage Gaps

### Coverage does not block merges

**Evidence:**

- `vitest.config.ts` sets all global thresholds to zero.
- `.github/workflows/pr-checks.yml` makes coverage continue on error.
- `codecov.yml` marks coverage informational.

**Risk:** Large changes can reduce coverage in critical boundaries without failing CI.

**Priority:** Set staged thresholds for changed files and critical directories before raising a global percentage.

### Full Electron E2E is manual

**Evidence:** `.github/workflows/pr-checks.yml` requires only the security-audit E2E subset; `.github/workflows/pr-e2e-artifacts.yml` is manually dispatched.

**Risk:** Cross-process startup, workflow, provider, update, and packaging regressions may not be detected before merge.

**Priority:** Require smoke plus flagship journeys on packaged artifacts; retain extended/manual suites for breadth.

### Disabled-test inventory is high

**Evidence:** Static mapping found 412 skip/todo/fixme-style usages across test files. `test/live/README.md` explicitly documents several scaffolded scenarios.

**Risk:** Test file count overstates executed behavioral coverage, and capability-dependent skips can become permanent.

**Priority:** Record skip reasons and owners, fail on expired skips, and report executed/skipped counts by suite in CI.

### Boundary-heavy code needs stronger contract proof

**Evidence:** The largest files include `src/common/adapter/ipcBridge.ts`, `src/process/bridge/fsBridge.ts`, `src/process/providers/ipc/modelRegistryIpc.ts`, and `src/process/task/AcpAgentManager.ts`; current coverage policy does not require minimum proof for them.

**Risk:** Serialization, registration, cancellation, approval, and persistence regressions have a large blast radius.

**Priority:** Add schema validation and contract tests at renderer/preload/process/provider boundaries, then require branch coverage for failure and cleanup paths.

### Security-sensitive negative cases are incomplete

**Evidence:** Extension execution is intentionally privileged in `src/process/extensions/`, and Debian signature verification is unfinished in `src/process/services/autoUpdaterService.ts`.

**Risk:** Happy-path tests cannot prove denial, tamper detection, revocation, or least privilege.

**Priority:** Add hostile-manifest, path traversal, unauthenticated route, bad-integrity, bad-signature, permission denial, and revoked publisher scenarios before expanding extension distribution.

## Recommended Priority Order

1. Contain extension execution and finish update signature verification.
2. Make flagship packaged journeys and critical boundary contracts required CI gates.
3. Choose canonical ACP, bridge registration, logging, and UI conventions; stop adding parallel implementations.
4. Complete Core event/presentation gaps, Flux producer transport, and transfer authorities without weakening fail-closed states.
5. Raise type, structure, coverage, accessibility, and bundle-size enforcement incrementally with no-new-debt gates.
6. Remove or explicitly quarantine disconnected cloud, skills, workflow, and UI candidates.

---

_Concerns analysis: 2026-07-19_
