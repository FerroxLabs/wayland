# Hub Backend Testing Guide

## Test Layers

| Layer | Name             | What It Tests               | Focus                    | Environment                  |
| ----- | ---------------- | --------------------------- | ------------------------ | ---------------------------- |
| L1    | Integration Test | Main process install path   | Data flow correctness    | Local + CI                   |
| L2    | E2E Test         | UI interaction flow         | User experience accuracy | Local (requires Electron)    |
| L3    | Smoke Test       | Real backend connectivity   | ACP protocol availability | Local only                  |

---

## L1 Integration Test

**File**: `tests/integration/hub-install-flow.test.ts`

**Full pipeline under test**:

```
HubIndexManager loads index
  → HubInstaller.install() downloads and extracts
    → lifecycle onInstall runs (installs CLI)
      → ExtensionRegistry.hotReload()
        → AcpDetector.refreshAll() detects new backend
          → AcpConnection.connect() completes handshake
            → sendPrompt() receives response
```

**Focus**:

- Whether extension manifest parsing is correct
- Whether the onInstall hook successfully installs the CLI
- Whether the new extension is recognized after hotReload
- Whether AcpDetector detects the new backend
- Whether the ACP JSON-RPC protocol handshake is complete
- **Integration pipeline test**: the steps above run as a single end-to-end pipeline, not as isolated units

**Fixtures used**:

- `tests/fixtures/fake-acp-cli/` - minimal ACP JSON-RPC CLI supporting initialize / session/new / session/prompt
- `tests/fixtures/fake-extension/` - test extension that declares acpAdapters and an onInstall hook that places the fake CLI on PATH

**Run**:

```bash
bun run test:integration
# or run individually
bunx vitest run tests/integration/hub-install-flow.test.ts
```

---

## L2 E2E Test

**File**: `tests/e2e/specs/hub-backend-install.e2e.ts`

**UI flow under test**:

```
Settings page → Agents page → Local Agents tab
  → click "Install from marketplace"
    → Hub modal opens, list loads
      → verify card states (Install / Installed / Retry)
        → click Install, state transitions (Installing → Installed)
          → close modal, verify new backend appears in list
            → select new backend, verify a session can be started
```

**Focus**:

- Whether the full user action path is covered
- Whether state display is correct (each card verified individually)
- Whether the list auto-refreshes after installation
- Modal open / close interactions
- Edge case: Retry button when install_failed

**Run**:

```bash
# Requires Electron environment
bun run test:e2e
# or run individually
bunx playwright test tests/e2e/specs/hub-backend-install.e2e.ts --config playwright.config.ts
```

> **Note**: L2 requires an Electron binary. If Electron is not installed, run `node node_modules/electron/install.js` first.

---

## L3 Smoke Test

**File**: `tests/integration/acp-smoke.test.ts`

**Test flow**:

```
Check whether CLI is on PATH
  → if not present, skip (do not fail)
  → if present, spawn CLI + ACP handshake
    → initialize → session/new → session/prompt
      → verify response chunk is received
        → disconnect, verify process exits cleanly
```

**Focus**:

- ACP protocol compatibility of the real backend CLI
- Whether the handshake completes successfully
- Whether streaming responses are received
- Whether the process exits cleanly with no residual processes

**Backends covered**:

| Backend      | Command         | ACP Flag | Notes                 |
| ------------ | --------------- | -------- | --------------------- |
| fake-acp-cli | `node index.js` | -        | Always runs           |
| claude       | `claude`        | `--acp`  | Requires `ACP_SMOKE_REAL=1` |
| codex        | `codex`         | `--acp`  | Requires `ACP_SMOKE_REAL=1` |
| goose        | `goose`         | `acp`    | Requires `ACP_SMOKE_REAL=1` |

**Run**:

```bash
# Default: only runs the fake CLI (no real backend required)
bunx vitest run tests/integration/acp-smoke.test.ts

# Enable real backend smoke (requires the corresponding CLI installed locally + API key configured)
ACP_SMOKE_REAL=1 bunx vitest run tests/integration/acp-smoke.test.ts
```

> **Note**: L3 runs locally only and is not included in CI. Real backend tests require the CLI to be installed locally with a valid API key configured.

---

## Checklist When Adding a New Backend

When a new backend extension is added to Hub, follow these steps to verify it:

### 1. L1 - Verify the install pipeline

No test code changes needed. L1 uses a fixture extension to verify the generic install pipeline, independent of any specific backend.

### 2. L3 - Add a real backend smoke test

Add the new backend to the `realBackends` array in `tests/integration/acp-smoke.test.ts`:

```typescript
const realBackends = [
  { name: 'claude', cmd: 'claude', args: ['--acp'] },
  { name: 'codex', cmd: 'codex', args: ['--acp'] },
  { name: 'goose', cmd: 'goose', args: ['acp'] },
  // Add new backend:
  { name: 'new-backend', cmd: 'new-backend', args: ['--acp'] },
];
```

Then run locally:

```bash
ACP_SMOKE_REAL=1 bunx vitest run tests/integration/acp-smoke.test.ts
```

### 3. L2 - Verify the UI flow

Start the dev environment, walk through the UI flow manually to confirm everything looks correct, then run the E2E tests:

```bash
bun run test:e2e
```

---

## Infrastructure

### fake-acp-cli

**Location**: `tests/fixtures/fake-acp-cli/`

Minimal ACP JSON-RPC 2.0 CLI implementation communicating via stdin/stdout:

- `initialize` → returns capabilities + models
- `session/new` → returns sessionId
- `session/prompt` → returns streaming text chunks + end_turn
- `session/cancel` → cancels the current prompt

Used by L1 and L3 (fake CLI portion) to avoid depending on a real backend.

### fake-extension

**Location**: `tests/fixtures/fake-extension/`

Test extension:

- `aion-extension.json` - declares `contributes.acpAdapters` and `lifecycle.onInstall`
- `scripts/install.js` - onInstall hook that places fake-acp-cli on a temporary PATH (Unix: symlink, Windows: .cmd wrapper)

### Cross-Platform Compatibility

All tests handle cross-platform differences:

| Difference                  | Handling                                               |
| --------------------------- | ------------------------------------------------------ |
| symlink permissions (Windows) | Windows uses .cmd wrapper instead of symlink         |
| shebang (Windows)           | Unified via `spawn('node', [path])`                    |
| process signals (Windows)   | `child.kill()` is cross-platform; SIGKILL is Unix only |
| CLI detection               | `where` (Windows) / `which` (Unix)                     |
| path separators             | Unified via `path.join()` + `os.tmpdir()`              |
