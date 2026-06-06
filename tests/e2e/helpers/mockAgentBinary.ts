/**
 * Mock ACP-agent CLI binary helper.
 *
 * Spawn-boundary mock: writes a small Node script to a tmp dir and returns its
 * path. The script speaks just enough ACP (JSON-RPC over stdio) to satisfy the
 * `initialize` / `session/new` / `session/prompt` round-trip and an `abort`,
 * so an `AcpConnection` can drive it without a real CLI being installed.
 *
 * Why a separate Node script rather than a stub inside the test process: the
 * production code paths (e.g. `AcpConnection`) call `spawn(cliCommand, args)`
 * against a real OS process - the cleanest reproduction at the spawn boundary
 * is a real OS process whose binary we control, not a function intercept.
 *
 * The helper is unused by the agent-*.e2e.ts specs in this commit (they run
 * end-to-end through the Electron app, which spawns its own subprocesses, and
 * we can't reroute its `spawn()` calls from a Playwright test). It exists so
 * a follow-up slice that exercises `AcpConnection` directly (e.g. a vitest
 * unit-level integration test) has the canned-binary primitive available.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

export type MockBinaryAgent =
  | 'gemini'
  | 'claude'
  | 'qwen'
  | 'codex'
  | 'kimi'
  | 'opencode'
  | 'hermes'
  | 'openclaw'
  | 'wcore';

export type MockBinaryResponse =
  | { type: 'text'; chunks: string[] }
  | { type: 'tool-use'; name: string; input: Record<string, unknown> };

export interface MockBinaryOptions {
  binary: MockBinaryAgent;
  /** Canned responses, applied in order across `session/prompt` requests. */
  responses?: MockBinaryResponse[];
  /** Inject a startup error and exit non-zero before reading stdin. */
  failOnStartup?: { code: number; stderr: string };
}

let tmpRoot: string | null = null;

function ensureTmpRoot(): string {
  if (!tmpRoot) {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-e2e-mock-acp-'));
    // Best-effort cleanup on worker exit.
    process.on('beforeExit', () => {
      try {
        if (tmpRoot) fs.rmSync(tmpRoot, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    });
  }
  return tmpRoot;
}

/**
 * Build a mock ACP-agent binary backed by a Node script. Returns the absolute
 * path to a runnable script (executable bit set on POSIX).
 *
 * Example:
 *   const bin = createMockAgentBinary({
 *     binary: 'claude',
 *     responses: [{ type: 'text', chunks: ['hello'] }],
 *   });
 *   const child = spawn('node', [bin], { stdio: 'pipe' });
 */
export function createMockAgentBinary(options: MockBinaryOptions): string {
  const root = ensureTmpRoot();
  const responses = options.responses ?? [{ type: 'text', chunks: ['ok'] }];
  const failOnStartup = options.failOnStartup ?? null;

  const scriptName = `mock-${options.binary}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}.cjs`;
  const scriptPath = path.join(root, scriptName);

  // The script is intentionally tiny and self-contained - no requires beyond
  // Node core. It reads newline-delimited JSON-RPC requests from stdin and
  // responds on stdout, matching the framing used by AcpConnection.utils.
  const script = `#!/usr/bin/env node
'use strict';

const RESPONSES = ${JSON.stringify(responses)};
const FAIL = ${JSON.stringify(failOnStartup)};
const BINARY = ${JSON.stringify(options.binary)};

if (FAIL) {
  process.stderr.write(String(FAIL.stderr));
  process.exit(FAIL.code);
}

let responseIndex = 0;
let buffer = '';
let aborted = false;

function send(obj) {
  try {
    process.stdout.write(JSON.stringify(obj) + '\\n');
  } catch (_err) {
    /* stdout may have been closed by parent */
  }
}

function handleRequest(req) {
  if (!req || typeof req !== 'object') return;
  const method = req.method;
  const id = req.id;
  if (method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: 1,
        agentCapabilities: { promptCapabilities: { audio: false, embeddedContext: false, image: false } },
        authMethods: [],
      },
    });
    return;
  }
  if (method === 'session/new') {
    send({ jsonrpc: '2.0', id, result: { sessionId: 'mock-' + BINARY + '-session-1' } });
    return;
  }
  if (method === 'session/prompt') {
    const next = RESPONSES[responseIndex] || { type: 'text', chunks: ['ok'] };
    responseIndex++;
    if (next.type === 'text') {
      for (const chunk of next.chunks) {
        if (aborted) break;
        send({
          jsonrpc: '2.0',
          method: 'session/update',
          params: {
            sessionId: 'mock-' + BINARY + '-session-1',
            update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: chunk } },
          },
        });
      }
    } else if (next.type === 'tool-use') {
      send({
        jsonrpc: '2.0',
        method: 'session/update',
        params: {
          sessionId: 'mock-' + BINARY + '-session-1',
          update: {
            sessionUpdate: 'tool_call',
            toolCallId: 'mock-tool-1',
            title: next.name,
            kind: 'execute',
            rawInput: next.input,
          },
        },
      });
    }
    send({ jsonrpc: '2.0', id, result: { stopReason: aborted ? 'cancelled' : 'end_turn' } });
    aborted = false;
    return;
  }
  if (method === 'session/cancel') {
    aborted = true;
    send({ jsonrpc: '2.0', id, result: null });
    return;
  }
  // Unknown method - respond with an error so the test sees something rather
  // than hanging.
  if (typeof id !== 'undefined') {
    send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'method not found: ' + String(method) } });
  }
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let nlIndex;
  while ((nlIndex = buffer.indexOf('\\n')) !== -1) {
    const line = buffer.slice(0, nlIndex).trim();
    buffer = buffer.slice(nlIndex + 1);
    if (!line) continue;
    try {
      const parsed = JSON.parse(line);
      handleRequest(parsed);
    } catch (_err) {
      // ignore non-JSON lines
    }
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});

// Keep alive until stdin closes.
process.stdin.resume();
`;

  fs.writeFileSync(scriptPath, script, { mode: 0o755 });
  return scriptPath;
}

/**
 * True when the given CLI command appears to be installed on PATH.
 * Used by agent-*.e2e.ts to choose between "exercise the real agent" and
 * "skip with a clear message". Synchronous because Playwright tests want a
 * cheap guard at top-of-describe.
 *
 * Uses execFileSync (no shell) with a regex-validated `cmd` so there is no
 * injection surface.
 */
export function isCliOnPath(cmd: string): boolean {
  if (!/^[a-zA-Z0-9_.-]+$/.test(cmd)) return false;
  const probe = process.platform === 'win32' ? 'where' : 'which';
  try {
    execFileSync(probe, [cmd], { stdio: 'ignore', timeout: 2_000 });
    return true;
  } catch {
    return false;
  }
}
