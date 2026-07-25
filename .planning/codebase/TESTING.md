# Testing Patterns

**Analysis Date:** 2026-07-19

## Test Framework

**Primary runner:**

- Vitest `4.0.18` runs TypeScript unit, DOM, integration, and regression tests. The configuration is in `vitest.config.ts`.
- Bun's native `bun:test` runner covers tests whose filenames end in `.bun.test.ts`. `scripts/run-bun-native-tests.mjs` discovers and runs them.
- Playwright `1.58.2` drives Electron end-to-end tests through `playwright.config.ts`.
- A separate live-provider Playwright harness in `test/live/playwright.config.ts` attaches to an already-running application over CDP.

**Assertion libraries:**

- Vitest globals provide `describe`, `it`, `test`, `expect`, `vi`, and lifecycle hooks.
- Bun-native tests import assertions and hooks from `bun:test`, as shown in `src/process/services/cost/ModelPricing.bun.test.ts`.
- Renderer tests use Testing Library APIs from `@testing-library/react` and DOM matchers installed by `tests/vitest.dom.setup.ts`.
- Playwright tests use `@playwright/test` expectations and the custom Electron fixtures exported from `tests/e2e/fixtures.ts`.

**Run commands:**

```bash
bun run test                 # Vitest projects, then Bun-native tests
bun run test:vitest          # Vitest only
bun run test:watch           # Vitest watch mode
bun run test:coverage        # Vitest with V8 coverage
bun run test:integration     # Tests under tests/integration
bun run test:bun             # All discovered *.bun.test.ts files
bun run test:e2e             # Electron Playwright suite
```

Install the pinned dependencies first with `bun install --frozen-lockfile`. At mapping time this workspace had no installed dependencies, so no passing test, lint, typecheck, or coverage result is asserted here.

## Test File Organization

**Location:**

- Pure unit tests live primarily under `tests/unit/`, grouped loosely by application concern.
- Process-level integration tests live under `tests/integration/`; `tests/integration/process/acp/session/AcpSession.prompt.test.ts` is representative.
- Electron end-to-end specs live under `tests/e2e/specs/`, with reusable infrastructure in `tests/e2e/fixtures.ts` and `tests/e2e/helpers/`.
- Bun-native tests are co-located with implementation or placed under `tests/`, then discovered recursively by `scripts/run-bun-native-tests.mjs`.
- A small number of component tests are co-located, including `src/renderer/components/layout/PageShell/PageShell.test.tsx`.
- Live-provider validation lives separately under `test/live/` and is not part of the default `bun run test` command.

**Naming:**

- Node-oriented Vitest tests use `.test.ts`.
- DOM-oriented tests use `.dom.test.ts` or `.dom.test.tsx`; all `.test.tsx` files are also assigned to the DOM project by `vitest.config.ts`.
- Bun-native tests use `.bun.test.ts` and are excluded from Vitest.
- Electron tests use `.e2e.ts`.
- `vitest.config.ts` also recognizes `test_*.ts` and `tests/regression/**/*.test.ts`, although no `tests/regression/` directory exists in the mapped tree.

**Static inventory on 2026-07-19:**

- 142 unit test files under `tests/unit/`.
- 20 integration test files under `tests/integration/`.
- 132 Electron E2E test files under `tests/e2e/`.
- 23 Bun-native `.bun.test.ts` files across `src/` and `tests/`.
- 412 occurrences of skipped, fixed-later, or todo-style test declarations/usages across test sources. This count is an inventory signal, not a count of unique disabled scenarios.

## Test Structure

**Unit suite shape:**

```typescript
describe('parseTunnelUrl', () => {
  it('parses a valid tunnel URL', () => {
    expect(parseTunnelUrl(value)).toEqual(expected);
  });

  it('returns null for malformed input', () => {
    expect(parseTunnelUrl(value)).toBeNull();
  });
});
```

This behavior-first arrangement is exemplified by `tests/unit/channels/tunnel/parseTunnelUrl.test.ts`: group by exported behavior, cover valid and invalid inputs, and assert returned domain values rather than implementation details.

**DOM suite shape:**

```typescript
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

it('renders the registered channel state', async () => {
  render(<Component {...props} />)
  expect(await screen.findByText(label)).toBeInTheDocument()
})
```

`tests/unit/ChannelModalRegisteredChannels.dom.test.tsx` demonstrates the local renderer pattern: mock process-boundary modules, render through Testing Library, query visible behavior, and clean the DOM between tests.

**Integration suite shape:**

- Build the system under test with small factory helpers local to the test file.
- Replace network, provider, and persistence edges with `vi.fn()` collaborators.
- Exercise asynchronous state transitions through public methods.
- Use `waitFor` or explicit promise control where work is queued.
- Assert both successful output and propagated error behavior.

`tests/integration/process/acp/session/AcpSession.prompt.test.ts` follows this form for ACP prompt sessions.

**E2E suite shape:**

- Import `test` and `expect` from `tests/e2e/fixtures.ts`, not directly from Playwright, when the spec requires the shared Electron application.
- Use semantic roles, visible text, test IDs, or stable helper abstractions before CSS implementation selectors.
- Keep each scenario independent at the data/state level even though the Electron process is shared.
- Use a conditional `test.skip` only when the capability is genuinely unavailable and document the reason at the call site.

`tests/e2e/specs/guid-agent-selection.e2e.ts` is representative of the custom fixture and conditional-capability pattern.

## Mocking

**Framework:** Vitest's `vi` API for Vitest projects; explicit fakes or `mock()` from `bun:test` for Bun-native projects.

**Patterns:**

- Hoist module mocks before importing the component or service whose dependency is replaced.
- Model process boundaries rather than reproducing their internals. Renderer tests should mock preload bridge adapters, while process tests should mock providers, filesystem, network, or persistence edges.
- Prefer typed factory functions returning the minimum collaborator surface needed by the scenario.
- Reset call history and implementation changes in `beforeEach`; restore global mutations in `afterEach`.
- Use deterministic deferred promises for queued or streaming flows instead of timing sleeps.
- Do not mock pure parsers and reducers. Test those directly with table-driven inputs.

**What to mock:**

- Electron APIs in Node or DOM tests.
- Provider SDKs and remote model calls.
- Native database bindings when the test is not explicitly validating the native integration.
- Time, UUID, filesystem, and network behavior when nondeterminism changes observable output.
- Preload/IPC adapters in renderer tests.

**What not to mock:**

- Bundled pricing and catalog snapshots when validating their actual schema or contents; `src/process/services/cost/ModelPricing.bun.test.ts` intentionally exercises real bundled data.
- The Electron process in E2E specs.
- Public service behavior merely to satisfy internal call-count assertions.

## Fixtures and Test Data

**Electron fixture:**

- `tests/e2e/fixtures.ts` owns a singleton Electron process because `playwright.config.ts` forces one worker and disables full parallelism.
- It allocates temporary state and user-data locations so tests do not mutate the developer's normal profile.
- It supports packaged CI execution and local development execution.
- It exposes the shared renderer page plus application lifecycle to specs.

**Native SQLite fixture:**

- `tests/unit/helpers/nativeSqlite.ts` detects whether the native binding can load for the current ABI.
- Local runs may skip native-dependent tests when the binding is unavailable.
- CI treats the same condition as a hard failure so native coverage cannot silently disappear from required checks.

**Setup files:**

- `tests/vitest.setup.ts` installs Node-project defaults and test-environment shims.
- `tests/vitest.dom.setup.ts` installs DOM matchers and renderer-oriented browser mocks.
- Global state added by a test must be restored because setup files are shared across many suites.

**Test data guidance:**

- Keep small scenario data beside its test.
- Put reusable builders in the nearest `tests/**/helpers/` or fixture module.
- Use temporary directories for mutable filesystem scenarios.
- Avoid depending on the developer's account, provider configuration, home directory, or long-lived application database.
- Live credentials and real providers belong only to the opt-in `test/live/` harness.

## Coverage

**Tooling:**

- `vitest.config.ts` uses the V8 provider.
- Reports are emitted as text, text summary, HTML, and LCOV.
- Coverage includes `src/**/*.{ts,tsx}` plus the explicitly named script in the configuration.
- Declarations, entry shims, common type-only surfaces, renderer JSON/SVG/CSS, and selected configuration files are excluded.

**Current enforcement:**

- Global line, function, branch, and statement thresholds in `vitest.config.ts` are all `0`.
- The coverage job in `.github/workflows/pr-checks.yml` is `continue-on-error: true`.
- `codecov.yml` marks project and patch reporting informational.
- A second `.codecov.yml` exists with different policy values, creating ambiguity about which repository policy is intended.
- Therefore coverage is measured but is not a merge-blocking quality gate.

**Priority seams for enforced coverage:**

- IPC registration and preload adapters in `src/process/bridge/` and `src/common/adapter/ipcBridge.ts`.
- ACP lifecycle and persistence in `src/process/acp/`, `src/process/task/AcpAgentManager.ts`, and related database code.
- Permission, approval, and extension loading paths in `src/process/extensions/`.
- Update verification in `src/process/services/autoUpdaterService.ts`.
- Core compatibility and transfer evidence in `src/process/wcore/` and `src/process/bridge/wcoreBridge.ts`.
- Routing evidence and provider failure behavior in `src/process/flux/`.

## Test Types

**Unit tests:**

- Validate pure helpers, adapters, stores, reducers, and service behavior.
- Default to the Node Vitest project unless a browser DOM is necessary.
- DOM tests validate rendered behavior and user interaction through Testing Library.

**Integration tests:**

- Validate collaborations between process services, queues, ACP sessions, persistence adapters, and bridge-facing contracts.
- Remain in-process and deterministic; they do not replace Electron E2E coverage.

**Bun-native tests:**

- Cover Bun-specific runtime behavior and native/bundled assets that Vitest's Node environment does not represent faithfully.
- Run after Vitest in `bun run test` and separately in the PR matrix.

**End-to-end tests:**

- Validate real Electron startup and cross-process user journeys.
- `playwright.config.ts` uses a 60-second test timeout, a 10-second expectation timeout, one worker, and no full parallelism.
- `.github/workflows/pr-checks.yml` requires the security-audit E2E subset but does not run the entire E2E corpus.
- `.github/workflows/pr-e2e-artifacts.yml` exposes the fuller artifact-producing suite through manual `workflow_dispatch`.

**Live-provider tests:**

- `test/live/playwright.config.ts` attaches to a real running application over CDP.
- The suite uses a 120-second timeout and one worker.
- `test/live/README.md` records that several non-model workflows remain `test.fixme` scaffolds and that selectors can be brittle.
- These tests are opt-in diagnostics, not default or PR-required proof.

## CI Quality Gates

- `.github/workflows/pr-checks.yml` shards the Vitest suite four ways across Ubuntu, macOS, and Windows.
- Bun-native tests run on the first shard.
- Required aggregation jobs collect platform results so a missing shard cannot appear green.
- Full Electron journey coverage is not currently a required PR gate.
- Coverage reporting is informational rather than blocking.
- Any change to process boundaries, native modules, installers, or update behavior should add platform-specific proof rather than rely on a single local environment.

## Common Patterns

**Asynchronous behavior:**

- Await observable completion, a controlled deferred promise, or `waitFor`.
- Avoid fixed sleeps; they make the serial Electron suite slower and less reliable.
- Assert cancellation, timeout, retry, and cleanup behavior for long-running ACP and provider operations.

**Failure cases:**

- Test malformed inputs and unavailable capabilities alongside the happy path.
- Assert errors at the public boundary: returned discriminated value, rejected promise, visible notification, or emitted event.
- Do not convert unexpected CI failures into unconditional skips.

**Regression placement:**

- Put a regression beside the narrowest existing suite that owns the behavior.
- Name the test after the user-visible failure or invariant.
- Add E2E coverage when the bug crosses renderer, preload, and process boundaries.
- If the behavior depends on a native ABI, retain the CI-hard-failure pattern from `tests/unit/helpers/nativeSqlite.ts`.

**Review checklist:**

- The test fails before the production fix when practical.
- The test uses the correct Vitest project or runtime suffix.
- Global state, mocks, temporary directories, and Electron resources are cleaned up.
- Conditional skips identify a capability boundary rather than hiding a regression.
- New critical-path behavior is represented in a required CI job, not only a manual workflow.

---

_Testing analysis: 2026-07-19_
