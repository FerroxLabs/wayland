# AcpDetector Detection Logic Report

> Source file: `src/process/agent/acp/AcpDetector.ts` (345 lines)
> Dependencies: `src/process/utils/shellEnv.ts`, `src/common/types/acpTypes.ts`

## Overview

AcpDetector is the **singleton agent discovery engine** in the main process. It detects all available ACP (Agent Communication Protocol) CLI agents on the system. Detection runs in parallel from three sources; results are merged and deduplicated into a unified agent list consumed by the UI and the IPC bridge.

```
acpDetector = new AcpDetector()   // module-level singleton, exported for global use
```

## Detection Flow Overview

```
initialize()
│
├── Promise.all([
│   ├── detectBuiltinAgents()     ← Source 1: known built-in CLI list
│   ├── detectExtensionAgents()   ← Source 2: extension registry
│   └── detectCustomAgents()      ← Source 3: user-defined configuration
│])
│
├── synthesize Gemini agent (always present, no CLI detection needed)
│
├── merge: [Aionrs, Gemini, ...Builtin, ...Other, ...Remote, ...Extension]
│
└── this.isInitialized = true
```

## Three Detection Sources in Detail

### Source 1: detectBuiltinAgents() (line 107)

Iterates over all known CLI tools in `POTENTIAL_ACP_CLIS` and calls `isCliAvailable(cli.cmd)` for each to verify presence on the system PATH.

`POTENTIAL_ACP_CLIS` is dynamically generated from `ACP_BACKENDS_ALL` (Proxy with lazy initialization), filtered by:

- Must have a `cliCommand`
- Must have `enabled: true`
- Excludes `gemini` (built-in, no detection needed), `custom` (user-configured), and `wcore` (non-ACP protocol)

Returns an array of `DetectedAgent` objects containing `backend`, `name`, `cliPath`, and `acpArgs`.

### Source 2: detectExtensionAgents() (line 125)

Retrieves ACP adapters contributed by extensions from `ExtensionRegistry.getInstance().getAcpAdapters()`.

Filter conditions:

- `connectionType` must be `'cli'` or `'stdio'`
- Must have a non-empty `cliCommand`
- Calls `isCliAvailable(cliCommand)` for each adapter to verify availability

Returned agents have `backend: 'custom'` fixed, plus `isExtension: true` and `extensionName` markers.

The entire method is wrapped in try/catch; if ExtensionRegistry fails to load, an empty array is returned silently.

### Source 3: detectCustomAgents() (line 179)

Reads assistant configuration from `ProcessConfig.get('assistants')`.

Filter conditions:

- `enabled === true`
- `defaultCliPath` is non-empty **or** `isPreset === true`

**No CLI availability check is performed** - the user is responsible for ensuring the CLI exists.

Error handling: `ENOENT`/`not found` errors are silently ignored (the config file may not have been created yet); other errors are logged as warnings.

## CLI Availability Detection (isCliAvailable)

Core method at line 60:

### macOS / Linux

```bash
which <command>
```

- Timeout: 1 second
- Uses `enhancedEnv` as the environment (includes shell PATH and additional tool paths)
- Success: `execSync` returns without throwing → `true`
- Failure: `execSync` throws → `false`

### Windows

**Two-level fallback**:

1. Preferred: `where <command>` (1-second timeout)
2. Fallback: PowerShell `Get-Command -All <command> | Select-Object -First 1 | Out-Null` (1-second timeout)

## Enhanced Environment Variables (getEnhancedEnv)

`getEnhancedEnv()` from `shellEnv.ts` is a critical dependency for CLI detection. It ensures that CLI tools are correctly discovered regardless of whether the app is launched from a terminal or via Finder/launchd.

### PATH Merge Order (highest to lowest priority)

```
1. bundledBunDir              ← highest priority, bundled bun runtime
2. process.env.PATH           ← current process environment
3. shellEnv.PATH              ← user login shell environment
4. platform extra tool paths  ← known install directories scanned per platform
5. customEnv.PATH             ← caller-supplied custom paths (if any)
```

### User Shell Environment Loading

| Platform | Shell resolution method                    | Default shell | Load command        |
| -------- | ------------------------------------------ | ------------- | ------------------- |
| macOS    | `dscl . -read /Users/<username> UserShell` | `/bin/zsh`    | `<shell> -l -c env` |
| Linux    | `getent passwd <username>`                 | `/bin/bash`   | `<shell> -l -c env` |
| Windows  | Shell environment loading skipped          | N/A           | N/A                 |

Inherited environment variable allowlist: `PATH`, `NODE_EXTRA_CA_CERTS`, `SSL_CERT_FILE`, `SSL_CERT_DIR`, `REQUESTS_CA_BUNDLE`, `CURL_CA_BUNDLE`, `NODE_TLS_REJECT_UNAUTHORIZED`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`.

### Platform Extra Tool Paths

**macOS / Linux:**

| Path           | Purpose              |
| -------------- | -------------------- |
| `~/.bun/bin`   | bun global packages  |
| `~/.cargo/bin` | Rust / cargo         |
| `~/go/bin`     | Go                   |
| `~/.deno/bin`  | Deno                 |
| `~/.local/bin` | pip, pipx, etc.      |

**Windows:**

| Path                                        | Purpose                              |
| ------------------------------------------- | ------------------------------------ |
| `%APPDATA%\npm`                             | npm global packages                  |
| `%ProgramFiles%\nodejs`                     | Node.js official install             |
| `%APPDATA%\nvm` / `%NVM_HOME%`              | nvm-windows                          |
| `%ProgramFiles%\nodejs` / `%NVM_SYMLINK%`   | nvm active version symlink           |
| `%LOCALAPPDATA%\fnm_multishells`            | fnm-windows                          |
| `~\.volta\bin`                              | Volta                                |
| `~\scoop\shims` / `%SCOOP%\shims`           | Scoop                                |
| `%LOCALAPPDATA%\pnpm`                       | pnpm global                          |
| `%ChocolateyInstall%\bin`                   | Chocolatey                           |
| `%ProgramFiles%\Git\{cmd,bin,usr\bin}`      | Git for Windows (includes cygpath)   |
| `%ProgramFiles(x86)%\Git\{cmd,bin,usr\bin}` | Git for Windows (x86)                |
| `C:\cygwin64\bin`, `C:\cygwin\bin`          | Cygwin                               |
| `~\.bun\bin`                                | bun global packages                  |

All paths are appended only if they **exist and are not already in the current PATH**.

## Complete Detected CLI List

| Backend ID         | CLI Command | ACP Launch Args                      | Name           |
| ------------------ | ----------- | ------------------------------------ | -------------- |
| `claude`           | `claude`    | `['--experimental-acp']`             | Claude Code    |
| `qwen`             | `qwen`      | `['--acp']`                          | Qwen Code      |
| `codex`            | `codex`     | `[]`                                 | Codex          |
| `codebuddy`        | `codebuddy` | `['--acp']`                          | CodeBuddy      |
| `goose`            | `goose`     | `['acp']`                            | Goose          |
| `auggie`           | `auggie`    | `['--acp']`                          | Augment Code   |
| `kimi`             | `kimi`      | `['acp']`                            | Kimi CLI       |
| `opencode`         | `opencode`  | `['acp']`                            | OpenCode       |
| `droid`            | `droid`     | `['exec', '--output-format', 'acp']` | Factory Droid  |
| `copilot`          | `copilot`   | `['--acp', '--stdio']`               | GitHub Copilot |
| `qoder`            | `qodercli`  | `['--acp']`                          | Qoder CLI      |
| `vibe`             | `vibe-acp`  | `[]`                                 | Mistral Vibe   |
| `openclaw-gateway` | `openclaw`  | `['gateway']`                        | OpenClaw       |
| `nanobot`          | `nanobot`   | `['--experimental-acp']`             | Nano Bot       |
| `cursor`           | `agent`     | `['acp']`                            | Cursor Agent   |
| `kiro`             | `kiro-cli`  | `['acp']`                            | Kiro           |

**Backends excluded from CLI detection:**

| Backend ID | Reason                                                         |
| ---------- | -------------------------------------------------------------- |
| `gemini`   | Built-in agent, always available, no CLI detection needed      |
| `custom`   | User-defined, has no `cliCommand`                              |
| `wcore`    | Non-ACP protocol (JSON Lines), explicitly excluded             |
| `remote`   | No local CLI; connects via WebSocket URL                       |

## Merging and Deduplication

Merge order: **Aionrs > Gemini > Builtin > Other > Remote > Extension**

No deduplication is performed - the same CLI can exist as both a builtin and an extension simultaneously; the UI layer handles differentiated display.

## Refresh Mechanisms

| Method                     | Refresh Scope               | Clears env cache |
| -------------------------- | --------------------------- | ---------------- |
| `refreshBuiltinAgents()`   | Built-in CLI agents only    | Yes              |
| `refreshExtensionAgents()` | Extension-contributed agents only | Yes         |
| `refreshRemoteAgents()`    | Remote agents only          | No               |
| `refreshAll()`             | All sources re-detected     | Yes              |

All refresh methods remove the existing agents of the corresponding type before re-detecting and appending results.

## Initialization Entry Points

| Launch mode | Entry file                                  | Call style                                  |
| ----------- | ------------------------------------------- | ------------------------------------------- |
| Electron    | `src/index.ts`                              | `initializeAcpDetector()` (async, parallel) |
| Standalone  | `src/process/utils/initBridgeStandalone.ts` | `acpDetector.initialize()` (direct call)    |

## Consumers

| File                                            | Purpose                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| `src/process/bridge/acpConversationBridge.ts`   | IPC bridge: fetch agent list, health checks, model probing           |
| `src/process/extensions/hub/HubInstaller.ts`    | refreshAll + verify detection results after extension install        |
| `src/process/extensions/hub/HubStateManager.ts` | Refresh built-in agents to determine extension install status        |
| `src/process/team/TeammateManager.ts`           | Filter available agent types for the Team feature                    |
| `src/process/channels/actions/SystemActions.ts` | Build the selectable agent list for channels                         |

## Fault-Tolerance Design

1. **Each detection source has its own try/catch** - a single source failure does not affect others
2. **Gemini is always injected** - guarantees at least one available agent
3. **CLI detection timeout of 1 second** - prevents `which`/`where` from blocking
4. **Shell environment loading timeout of 5 seconds** - prevents abnormal shell configs from blocking startup
5. **Windows double fallback** - if `where` fails, automatically tries PowerShell `Get-Command`
6. **Idempotent initialization** - `initialize()` uses the `isDetected` flag to prevent repeated execution
7. **Custom agents skip CLI validation** - availability check is skipped; the user is responsible
8. **env cache cleared on demand** - each refresh clears `enhancedEnv` to capture PATH changes

---

# Claude Code Connection Flow Trace

> Core file chain:
> `AcpDetector.ts` → `acpConversationBridge.ts` → `AcpAgentManager.ts` → `AcpAgent (index.ts)` → `AcpConnection.ts` → `acpConnectors.ts`

## Connection Overview

```
User selects Claude Code → sends message
│
├── [IPC Bridge] acpConversationBridge
│   └── workerTaskManager.getOrBuildTask(conversationId)
│
├── [Task Manager] AcpAgentManager
│   ├── resolveCliPath('claude') → 'claude' or user-configured path
│   ├── new AcpAgent({ backend: 'claude', cliPath, ... })
│   └── agent.start()
│
├── [Agent] AcpAgent.start()
│   ├── connection.connect('claude', cliPath, workingDir)
│   ├── performAuthentication()
│   ├── createOrResumeSession()
│   ├── applyYoloMode() (if enabled)
│   └── applyModelFromSettings()
│
├── [Connection] AcpConnection.connect('claude')
│   └── doConnect() → switch('claude') → connectClaude()
│
├── [Connector] connectClaude()
│   └── connectNpxBackend({
│       npxPackage: '@zed-industries/claude-agent-acp@0.21.0',
│       prepareFn: prepareClaude,
│   })
│
├── [Spawn] spawnNpxBackend()
│   └── spawn(npxCommand, ['--yes', '--prefer-offline',
│       '@zed-industries/claude-agent-acp@0.21.0'], { stdio: 'pipe', detached: true })
│
├── [Protocol] setupChildProcessHandlers()
│   ├── stdout → NDJSON parsing → handleMessage()
│   ├── stderr → diagnostic buffer
│   └── initialize() → JSON-RPC handshake
│
└── [Session] newSession() / sendPrompt()
    └── JSON-RPC over stdin/stdout
```

## Key Finding: Claude Is Not Launched Directly

**Claude Code is not** launched directly via `claude --experimental-acp`. What actually runs is an **npx bridge package**:

```bash
# Actual command executed (macOS)
/usr/local/bin/npx --yes --prefer-offline @zed-industries/claude-agent-acp@0.21.0
```

`@zed-industries/claude-agent-acp` is an ACP bridge maintained by Zed that internally handles launching and managing the Claude Code CLI. Wayland communicates with this bridge via JSON-RPC (NDJSON) over stdin/stdout.

## Phase 1: CLI Path Resolution

**File: `src/process/task/AcpAgentManager.ts`**

When `backend === 'claude'`, the path resolution logic:

1. Reads `ProcessConfig.get('acp.config')` to check if the user has configured a custom `cliPath`
2. If not, falls back to `ACP_BACKENDS_ALL.claude.cliCommand` = `'claude'`
3. For Claude, `acpArgs` is not defined in `ACP_BACKENDS_ALL`; the default `['--experimental-acp']` is used

However, this `cliPath` and `acpArgs` **do not actually affect the connection process** - Claude goes through the npx bridge path, not a generic spawn.

## Phase 2: Environment Preparation (prepareClaude)

**File: `src/process/agent/acp/acpConnectors.ts:335-339`**

```typescript
async function prepareClaude(): Promise<NpxPrepareResult> {
  const cleanEnv = await prepareCleanEnv();
  ensureMinNodeVersion(cleanEnv, 20, 10, 'Claude ACP bridge');
  return { cleanEnv, npxCommand: resolveNpxPath(cleanEnv) };
}
```

### What prepareCleanEnv() does

1. `loadFullShellEnvironment()` - asynchronously loads the full user shell environment (`<shell> -i -l -c env`, including API keys exported from `.zshrc`, etc.)
2. `getEnhancedEnv()` - merges process.env + shell PATH + platform tool paths + bundled bun
3. Merges both: `{ ...fullShellEnv, ...enhancedEnv }`
4. Strips harmful variables:
   - Removes `NODE_OPTIONS`, `NODE_INSPECT`, `NODE_DEBUG`
   - Removes `CLAUDECODE` (prevents nested detection)
   - Removes all `npm_*` prefixed variables (prevents npm lifecycle interference)

### Node Version Requirement

The Claude ACP bridge requires **Node.js >= 20.10**. If an older version is detected, it automatically scans nvm/fnm/volta directories for a suitable version and corrects the PATH.

## Phase 3: Process Launch (spawnNpxBackend)

**File: `src/process/agent/acp/acpConnectors.ts:298-332`**

### Phase 1/2 Retry Strategy

```
Phase 1: npx --yes --prefer-offline @zed-industries/claude-agent-acp@0.21.0
         ↓ failed?
Phase 2: npx --yes @zed-industries/claude-agent-acp@0.21.0  (without --prefer-offline)
```

- **Phase 1**: Uses `--prefer-offline` to prefer starting from the local npm cache (~1-2s)
- **Phase 2**: If Phase 1 fails, drops `--prefer-offline` and fetches from the npm registry (~3-5s)

### Actual Spawn Arguments

```typescript
spawn(
  npxCommand,
  [
    '--yes', // auto-confirm install
    '--prefer-offline', // Phase 1 only
    '@zed-industries/claude-agent-acp@0.21.0',
  ],
  {
    cwd: workingDir,
    stdio: ['pipe', 'pipe', 'pipe'], // stdin/stdout/stderr all piped
    env: cleanEnv,
    shell: false, // no shell on Unix
    detached: true, // macOS/Linux: creates new session, prevents SIGTTOU
  }
);
child.unref(); // allows the parent process to exit normally
```

### npm Cache Error Recovery

**File: `src/process/agent/acp/AcpConnection.ts:214-261`**

If the connection fails, `connect()` has two additional recovery layers:

1. **notarget/version mismatch**: runs `npm cache clean --force` then retries
2. **npx cache corruption** (ENOENT/ERR_MODULE_NOT_FOUND): deletes the entire `~/.npm/_npx` directory then retries

## Phase 4: Protocol Establishment (setupChildProcessHandlers)

**File: `src/process/agent/acp/AcpConnection.ts:338-483`**

### stdout Parsing - NDJSON Protocol

```typescript
let buffer = '';
child.stdout?.on('data', (data: Buffer) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // retain the incomplete last line

  for (const line of lines) {
    if (line.trim()) {
      const message = JSON.parse(line) as AcpMessage;
      this.handleMessage(message);
    }
  }
});
```

Each line of stdout is a complete JSON-RPC message. The protocol is **newline-delimited JSON (NDJSON)**.

### Initialization Handshake

```typescript
await Promise.race([
  this.initialize(), // send initialize request
  new Promise((reject) => setTimeout(reject, 60000)), // 60-second timeout
  processExitPromise, // fail immediately if the process exits early
]);
```

### initialize Request

**Sent (written to child process stdin):**

```json
{
  "jsonrpc": "2.0",
  "id": 0,
  "method": "initialize",
  "params": { "protocolVersion": 1, "clientCapabilities": { "fs": { "readTextFile": true, "writeTextFile": true } } }
}
```

**Received:** Contains `authMethods`, `agentCapabilities` (including `mcpCapabilities`), etc.

## Phase 5: Authentication

**File: `src/process/agent/acp/index.ts`**

Claude's authentication flow:

1. Check `authMethods` in the `initialize` response
2. Attempt to create a session directly first
3. If authentication fails, run `claude /login` to refresh the token
4. Retry session creation

## Phase 6: Session Creation

**File: `src/process/agent/acp/AcpConnection.ts:884-928`**

```json
// Sent:
{"jsonrpc":"2.0","id":2,"method":"session/new","params":{
  "cwd": ".",
  "mcpServers": [...],
  "_meta": {
    "claudeCode": {
      "options": {
        "resume": "<existing-session-id>"
      }
    }
  }
}}
```

Claude-specific: session resumption is implemented via `_meta.claudeCode.options.resume` (other backends use the `resumeSessionId` parameter).

The response contains `sessionId`, `configOptions` (model, mode), and `models`.

## Phase 7: Message Exchange

### Sending a Prompt

**File: `src/process/agent/acp/AcpConnection.ts:1005-1023`**

```json
// Sent:
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "session/prompt",
  "params": {
    "sessionId": "abc123",
    "prompt": [{ "type": "text", "text": "user input message" }]
  }
}
```

### Receiving Streaming Responses

The child process sends NDJSON messages via stdout, dispatched by `handleMessage()`:

| Message type     | Detection condition          | Handling                                                              |
| ---------------- | ---------------------------- | --------------------------------------------------------------------- |
| **Response**     | Has `id`, no `method`        | Match pending Promise in `pendingRequests`, resolve/reject            |
| **Notification** | Has `method`, no `id`        | Dispatch to `handleIncomingRequest()`                                 |
| **Request**      | Has both `method` and `id`   | Dispatch to `handleIncomingRequest()`, write response back after handling |

### Inbound Method Handling

| Method                       | Purpose                            | Handling                                                         |
| ---------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| `session/update`             | Streaming content, tool calls, thinking | → `AcpAgent` → `AcpAdapter` → converted to UI messages     |
| `session/request_permission` | Tool permission request            | Pause timeout → show UI dialog → user selects → write result back |
| `fs/read_text_file`          | Backend reads a file               | Parse path → `readTextFile()` → write content back              |
| `fs/write_text_file`         | Backend writes a file              | Parse path → `writeTextFile()` → notify UI                      |

### Data Flow

```
AcpConnection.onSessionUpdate
  → AcpAgent.handleSessionUpdate()
    → AcpAdapter.convertSessionUpdate()  // convert to TMessage[]
    → AcpAgent.emitMessage()
      → AcpAgentManager.onStreamEvent callback
        → transformMessage() → addOrUpdateMessage() (DB)
        → ipcBridge.acpConversation.responseStream.emit() (to renderer)
```

## Phase 8: Cancellation and Disconnection

### Cancel Current Prompt (without killing the process)

```json
{ "jsonrpc": "2.0", "method": "session/cancel", "params": { "sessionId": "abc123" } }
```

### Full Disconnection

```
AcpConnection.disconnect()
  → stopPromptKeepalive()
  → terminateChild()
    → killChild()
      macOS/Linux (detached): process.kill(-pid, 'SIGTERM')  // kill process group
      Windows: taskkill /PID <pid> /T /F
    → wait up to 3 seconds
  → reset all state
```

## Claude-Specific Behavior vs Other Backends

| Feature               | Claude                                              | Other Backends                               |
| --------------------- | --------------------------------------------------- | -------------------------------------------- |
| **Launch method**     | npx bridge (`@zed-industries/claude-agent-acp`)     | Direct CLI spawn (`goose acp`, `qwen --acp`) |
| **Session resumption**| `_meta.claudeCode.options.resume`                   | `resumeSessionId` parameter                  |
| **Model source**      | Reads `ANTHROPIC_MODEL` from `~/.claude/settings.json` | `session/new` response                    |
| **YOLO mode**         | `'bypassPermissions'`                               | `'yolo'` (Qwen, etc.)                        |
| **Auth failure recovery** | Run `claude /login` to refresh token           | No special handling                          |
| **Model switching**   | Injects `<system-reminder>` to notify AI of model change | None                                    |
| **Node version requirement** | >= 20.10                                   | >= 18.17 (generic)                           |
| **npx cache recovery**| Supported (member of NPX_BACKENDS)                  | Not applicable                               |

## Module Summary

| Module                  | File                       | Responsibility                                                       |
| ----------------------- | -------------------------- | -------------------------------------------------------------------- |
| `AcpDetector`           | `AcpDetector.ts`           | Detect CLI agents installed on the system                            |
| `acpConversationBridge` | `acpConversationBridge.ts` | IPC bridge between the renderer and main process                     |
| `AcpAgentManager`       | `AcpAgentManager.ts`       | Task lifecycle management: create agents, persist state, IPC events  |
| `AcpAgent`              | `index.ts`                 | Orchestrate connection/auth/session/message flow; permissions, model switching |
| `AcpConnection`         | `AcpConnection.ts`         | Core protocol: child process management, JSON-RPC send/receive, session state |
| `acpConnectors`         | `acpConnectors.ts`         | Per-backend spawn logic, environment preparation, npx Phase 1/2      |
| `AcpAdapter`            | `AcpAdapter.ts`            | Convert ACP session updates to Wayland TMessage format               |
| `ApprovalStore`         | `ApprovalStore.ts`         | Session-level "always allow" permission cache                        |
| `utils`                 | `utils.ts`                 | JSON-RPC stdin writes, process termination, file I/O                 |
| `mcpSessionConfig`      | `mcpSessionConfig.ts`      | Build the MCP server list for `session/new`                          |
| `modelInfo`             | `modelInfo.ts`             | Extract model information from `configOptions`/`models`              |
| `constants`             | `constants.ts`             | YOLO mode strings per backend                                        |

---

# @zed-industries/claude-agent-acp Internal Deep Trace

> The section above analyzed how Wayland uses npx to launch `@zed-industries/claude-agent-acp`.
> This section dives into the bridge package internals to trace how it discovers and drives the local Claude CLI via `claude-code-sdk`.
>
> Source references:
>
> - Adapter: https://github.com/agentclientprotocol/claude-agent-acp (Apache-2.0)
> - Claude Agent SDK: https://github.com/anthropics/claude-agent-sdk-typescript
> - ACP SDK: https://github.com/agentclientprotocol/typescript-sdk

## Package Ownership History

This package has migrated from `@zed-industries/claude-agent-acp` (v0.23.1) to `@agentclientprotocol/claude-agent-acp` (v0.25.3), sharing the same codebase.

## Internal Dependency Chain

```
@agentclientprotocol/claude-agent-acp
  ├── @agentclientprotocol/sdk (0.17.0)         -- ACP protocol implementation
  ├── @anthropic-ai/claude-agent-sdk (0.2.83+)   -- Claude Code SDK
  │     ├── @anthropic-ai/sdk (^0.80.0)          -- Anthropic API client
  │     ├── @modelcontextprotocol/sdk (^1.27.1)  -- MCP protocol
  │     └── cli.js                               -- bundled Claude Code CLI (~13MB)
  └── zod (^3.25.0 || ^4.0.0)
```

## Core Finding: Does Not Search PATH - Uses Bundled CLI

**`claude-agent-acp` does not search the system PATH for a locally installed `claude` CLI.** It always uses the `cli.js` bundled inside the `@anthropic-ai/claude-agent-sdk` npm package (version-locked, e.g. Claude Code v2.1.92). This `cli.js` is a ~13MB self-contained, minified full Claude Code runtime.

## Full Chain Trace

### Step 1: Entry Point (`dist/index.js`)

```js
// --cli mode: run the SDK's bundled Claude CLI directly
if (process.argv.includes('--cli')) {
  await import(await claudeCliPath());
}

// default mode: run as an ACP agent
runAcp();
```

### Step 2: ACP Transport Setup (`runAcp()`, `dist/acp-agent.js:1702`)

```js
export function runAcp() {
  const input = nodeToWebWritable(process.stdout);
  const output = nodeToWebReadable(process.stdin);
  const stream = ndJsonStream(input, output);
  new AgentSideConnection((client) => new ClaudeAcpAgent(client), stream);
}
```

The adapter communicates with the upstream ACP client (Wayland, Zed editor, etc.) via **stdin/stdout NDJSON**. `AgentSideConnection` handles JSON-RPC dispatch.

### Step 3: How the Adapter Calls claude-code-sdk

Three key functions are imported from the SDK:

```js
import { getSessionMessages, listSessions, query } from '@anthropic-ai/claude-agent-sdk';
```

| Function               | Purpose                                                 |
| ---------------------- | ------------------------------------------------------- |
| `query()`              | Core function: spawn CLI subprocess to create new session |
| `listSessions()`       | List existing sessions from disk                        |
| `getSessionMessages()` | Retrieve messages from a previous session for replay    |

When creating a new ACP session (`createSession` method, line 937):

```js
const q = query({
  prompt: input, // AsyncIterable<SDKUserMessage> (Pushable)
  options, // session configuration
});
```

### Step 4: How the SDK Locates the CLI Binary (Critical Path)

Inside `sdk.mjs`, the initialization function resolves the executable path:

```js
// sdk.mjs pseudo-code (de-obfuscated)
let pathToClaudeCodeExecutable = options.pathToClaudeCodeExecutable;
if (!pathToClaudeCodeExecutable) {
  const currentDir = fileURLToPath(import.meta.url);
  const parentDir = path.join(currentDir, '..');
  pathToClaudeCodeExecutable = path.join(parentDir, 'cli.js');
}
```

**Default behavior: uses `cli.js` in the same directory as the SDK package, with no PATH lookup.**

Path resolution function on the adapter side (`acp-agent.js:35`):

```js
export async function claudeCliPath() {
  return isStaticBinary()
    ? (await import('@anthropic-ai/claude-agent-sdk/embed')).default
    : import.meta.resolve('@anthropic-ai/claude-agent-sdk').replace('sdk.mjs', 'cli.js');
}
```

### Step 5: Ways to Override the CLI Path

| Mechanism                                                    | Priority | Description                                              |
| ------------------------------------------------------------ | -------- | -------------------------------------------------------- |
| `CLAUDE_CODE_EXECUTABLE` environment variable                | Highest  | Directly overrides the executable path                   |
| Static binary mode (`CLAUDE_AGENT_ACP_IS_SINGLE_FILE_BUN`)  | High     | Bun `--compile` build: extracts from `$bunfs` to a temp directory |
| `options.pathToClaudeCodeExecutable`                         | Medium   | SDK-level API option                                     |
| Default fallback                                             | Lowest   | `path.join(dirname(import.meta.url), "cli.js")`          |

Environment variable check in the adapter (`acp-agent.js:1034`):

```js
...(process.env.CLAUDE_CODE_EXECUTABLE
    ? { pathToClaudeCodeExecutable: process.env.CLAUDE_CODE_EXECUTABLE }
    : isStaticBinary()
        ? { pathToClaudeCodeExecutable: await claudeCliPath() }
        : {}),
```

In static binary mode (`bun build --compile`), `cli.js` is embedded in the Bun virtual filesystem. At runtime, `extractFromBunfs()` copies it to `/tmp/claude-agent-sdk-<sha256hash>/cli.js` because child processes cannot access `$bunfs`.

### Step 6: Child Process Spawn (ProcessTransport)

The `ProcessTransport` class inside the SDK handles launching the CLI:

```js
// sdk.mjs de-obfuscated
const isNativeBinary =
  !pathToClaudeCodeExecutable.endsWith('.js') &&
  !pathToClaudeCodeExecutable.endsWith('.mjs') &&
  !pathToClaudeCodeExecutable.endsWith('.tsx') &&
  !pathToClaudeCodeExecutable.endsWith('.ts') &&
  !pathToClaudeCodeExecutable.endsWith('.jsx');

const command = isNativeBinary ? pathToClaudeCodeExecutable : executable;
// executable default: isBun ? "bun" : "node"

this.process = spawn(command, args, {
  cwd: cwd,
  stdio: ['pipe', 'pipe', stderrMode],
  signal: abortSignal,
  env: env,
  windowsHide: true,
});
```

Key CLI arguments passed:

| Argument                                        | Purpose                                   |
| ----------------------------------------------- | ----------------------------------------- |
| `--output-format stream-json`                   | CLI outputs streaming JSON                |
| `--input-format stream-json`                    | CLI accepts streaming JSON input          |
| `--verbose`                                     | Enable verbose output                     |
| `--permission-prompt-tool stdio`                | Permission requests returned via stdin/stdout |
| `--model`, `--max-turns`, `--thinking`, `--cwd` | Various session configuration options     |

Runtime inheritance (`acp-agent.js:1033`):

```js
executable: isStaticBinary() ? undefined : process.execPath,
```

Ensures the same Node.js that launched the adapter is also used to run the CLI subprocess.

### Step 7: Communication Protocol Between SDK and CLI

Communication is based on **stdin/stdout streaming NDJSON** of the child process:

- **Input (SDK → CLI)**: User messages are written to stdin as JSON lines via `ProcessTransport.write()`
- **Output (CLI → SDK)**: CLI writes JSON messages to stdout, one per line; SDK parses them line by line using `readline.createInterface()`

Message types output by the CLI:

| Type                 | Description                                                     |
| -------------------- | --------------------------------------------------------------- |
| `system`             | init, status, compact_boundary, session_state_changed           |
| `result`             | success, error_during_execution, error_max_turns                |
| `stream_event`       | content_block_start, content_block_delta, message_start         |
| `user` / `assistant` | Conversation messages containing tool_use, text, thinking blocks |
| `tool_progress`      | Tool execution progress                                         |
| `auth_status`        | Authentication status                                           |
| `rate_limit_event`   | Rate limit events                                               |

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│          Wayland                                     │
│                                                     │
│  spawns the adapter as a subprocess via npx         │
│  communicates via stdin/stdout NDJSON (JSON-RPC)    │
└────────────────────┬────────────────────────────────┘
                     │ stdin/stdout (NDJSON, JSON-RPC)
                     ▼
┌─────────────────────────────────────────────────────┐
│      claude-agent-acp (ACP Agent Adapter)           │
│                                                     │
│  ClaudeAcpAgent: translates ACP ↔ SDK messages      │
│  AgentSideConnection: ACP JSON-RPC dispatch         │
│  SettingsManager: reads .claude/settings.json       │
│  Permission proxy: canUseTool → requestPermission   │
└────────────────────┬────────────────────────────────┘
                     │ SDK query() API
                     ▼
┌─────────────────────────────────────────────────────┐
│       @anthropic-ai/claude-agent-sdk                │
│                                                     │
│  query(): creates ProcessTransport                  │
│  ProcessTransport: spawns cli.js as subprocess      │
│  Default path:                                      │
│    path.join(dirname(import.meta.url), "cli.js")    │
└────────────────────┬────────────────────────────────┘
                     │ child_process.spawn()
                     │ stdin/stdout (streaming NDJSON)
                     ▼
┌─────────────────────────────────────────────────────┐
│    cli.js (bundled Claude Code ~13MB)               │
│                                                     │
│  Full Claude Code runtime                           │
│  --output-format stream-json                        │
│  --input-format stream-json                         │
│  --permission-prompt-tool stdio                     │
│  communicates with Anthropic API over HTTPS         │
└─────────────────────────────────────────────────────┘
```

## Connection to Wayland (Described Above)

Wayland launches `claude-agent-acp` via npx (Phase 3 above); once the bridge process is running:

1. Wayland ↔ bridge = **ACP protocol** (Phases 4–8 above)
2. Bridge calls `query()` from `claude-code-sdk` = **SDK API** (Steps 3–4 in this section)
3. SDK spawns the `cli.js` subprocess = **streaming NDJSON** (Steps 6–7 in this section)
4. `cli.js` ↔ Anthropic API = **HTTPS**

The full chain has **three layers of nested subprocesses**:

```
Wayland (Electron main)
  → npx claude-agent-acp (Node.js)
    → node cli.js (Claude Code runtime)
      → HTTPS → api.anthropic.com
```
