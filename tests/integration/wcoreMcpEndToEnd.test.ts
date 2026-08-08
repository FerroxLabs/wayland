/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WLD-K / W-1 — the end-to-end MCP proof, against the REAL bundled engine.
 *
 * This milestone's standard is that a mechanism claim is established by
 * EXECUTING it, never by reading source. Every other MCP test in this repo
 * mocks `spawn`, so none of them can tell us whether an MCP tool actually runs.
 * This one spawns the bundled `wayland-core` binary, publishes a stdio MCP
 * server over the same runtime `add_mcp_server` command Desktop uses, sends a
 * real turn, and proves the tool's BODY executed.
 *
 * The oracle is a witness file the probe server writes from inside `tools/call`
 * (`helpers/probeMcpServer.cjs`). A model can claim it called a tool; it cannot
 * write that file. `LIST` without `CALL` is precisely the W-1 symptom — a tool
 * discovered but never invoked — so the two are asserted separately.
 *
 * Collected by the default suite but SKIPPED unless explicitly enabled, matching
 * the ACP smoke convention in `acp-smoke.test.ts` - collected means it stays
 * type-checked and cannot silently rot. It needs a real provider key and real
 * network, so run it deliberately:
 *
 *   WCORE_MCP_E2E=1 npx vitest run tests/integration/wcoreMcpEndToEnd.test.ts
 *
 * Key resolution, in order: WCORE_E2E_API_KEY, then ~/.config/wayland-smoke/flux-test-key.
 * The key is never logged, and the engine runs under a throwaway WAYLAND_HOME so
 * the developer's own Core config is never read or written.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const ENABLED = process.env.WCORE_MCP_E2E === '1';

const ENGINE = join(
  __dirname,
  '..',
  '..',
  'resources',
  'bundled-wayland-core',
  `${process.platform}-${process.arch}`,
  'wayland-core'
);

const readKey = (): string | null => {
  if (process.env.WCORE_E2E_API_KEY) return process.env.WCORE_E2E_API_KEY.trim();
  const burner = join(homedir(), '.config', 'wayland-smoke', 'flux-test-key');
  return existsSync(burner) ? readFileSync(burner, 'utf-8').trim() : null;
};

// Core appends `/v1` itself. Passing a base URL that already ends in /v1
// yields /v1/v1/chat/completions and a 404 that looks like a broken key.
const BASE_URL = process.env.WCORE_E2E_BASE_URL ?? 'https://api.fluxrouter.ai';
const MODEL = process.env.WCORE_E2E_MODEL ?? 'flux-fast';
const SENTINEL = 'PROBE-OK-8842';
const TURN_TIMEOUT_MS = 180_000;

const tempRoots: string[] = [];
afterAll(() => {
  for (const dir of tempRoots) rmSync(dir, { recursive: true, force: true });
});

interface TurnResult {
  eventTypes: string[];
  mcpReadyTools: string[];
  toolsCalled: string[];
  assistantText: string;
  finishReason: string | null;
  witness: string;
}

/** Drives one turn exactly as `WCoreAgent` does: wait for ready, then write a message. */
async function runTurn(prompt: string): Promise<TurnResult> {
  const apiKey = readKey();
  if (!apiKey) throw new Error('no API key for the live MCP E2E');

  const root = mkdtempSync(join(tmpdir(), 'wcore-mcp-e2e-'));
  tempRoots.push(root);
  const witnessPath = join(root, 'witness.log');
  writeFileSync(witnessPath, '');
  // An empty config keeps this run independent of any developer config.
  writeFileSync(join(root, 'config.toml'), '');

  const child: ChildProcessWithoutNullStreams = spawn(
    ENGINE,
    [
      '-p', 'openai',
      '-b', BASE_URL,
      '-m', MODEL,
      '--no-memory',
      '--auto-approve',
      // 0.12.26 refuses every runtime MCP declaration without an assistant identity.
      '--assistant', 'wayland-desktop',
      '--json-stream',
    ],
    { env: { ...process.env, WAYLAND_HOME: root, API_KEY: apiKey }, stdio: 'pipe' }
  );

  const eventTypes: string[] = [];
  const toolsCalled: string[] = [];
  let mcpReadyTools: string[] = [];
  let assistantText = '';
  let finishReason: string | null = null;

  return await new Promise<TurnResult>((resolve, reject) => {
    const settle = (): void => {
      clearTimeout(timer);
      child.kill('SIGTERM');
      resolve({
        eventTypes,
        mcpReadyTools,
        toolsCalled,
        assistantText,
        finishReason,
        witness: existsSync(witnessPath) ? readFileSync(witnessPath, 'utf-8') : '',
      });
    };

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`live MCP turn did not finish within ${TURN_TIMEOUT_MS}ms`));
    }, TURN_TIMEOUT_MS);

    let buf = '';
    child.stdout.on('data', (chunk: Buffer) => {
      buf += chunk.toString();
      let idx: number;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        let event: Record<string, unknown>;
        try {
          event = JSON.parse(line) as Record<string, unknown>;
        } catch {
          continue;
        }
        const type = String(event.type ?? '');
        eventTypes.push(type);

        if (type === 'ready') {
          child.stdin.write(
            `${JSON.stringify({
              type: 'add_mcp_server',
              name: 'wldprobe',
              transport: 'stdio',
              command: process.execPath,
              args: [join(__dirname, 'helpers', 'probeMcpServer.cjs')],
              env: { PROBE_WITNESS: witnessPath, PROBE_SENTINEL: SENTINEL },
            })}\n`
          );
          // Let the server connect and report before the turn starts; the
          // engine only exposes tools it has a receipt for.
          setTimeout(() => {
            child.stdin.write(
              `${JSON.stringify({ type: 'message', msg_id: 'e2e-1', content: prompt })}\n`
            );
          }, 3_000);
        }

        if (type === 'mcp_ready' && Array.isArray(event.tools)) {
          mcpReadyTools = event.tools as string[];
        }
        if (type === 'tool_result' && typeof event.tool_name === 'string') {
          toolsCalled.push(event.tool_name);
        }
        if (type === 'text_delta') {
          assistantText += String(event.delta ?? event.text ?? event.content ?? '');
        }
        if (type === 'stream_end') {
          finishReason = typeof event.finish_reason === 'string' ? event.finish_reason : null;
          settle();
        }
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

describe.skipIf(!ENABLED)('live: an MCP tool executes end to end on the bundled engine', () => {
  it('publishes, discovers, INVOKES, and returns the tool output to the user', async () => {
    expect(existsSync(ENGINE), `bundled engine missing at ${ENGINE}`).toBe(true);
    expect(readKey(), 'no API key: set WCORE_E2E_API_KEY').toBeTruthy();

    const result = await runTurn(
      'What is the probe code? Use the available tool to get it, then tell me the code.'
    );

    // 1. The engine accepted the runtime declaration and connected the server.
    expect(result.eventTypes).toContain('mcp_ready');
    expect(result.mcpReadyTools).toContain('wld_probe_secret');

    // 2. The tool BODY ran. Written by the tool itself, in a process the engine
    //    spawned - the one thing the model cannot fabricate.
    expect(result.witness).toContain('CALL wld_probe_secret');

    // 3. The engine reports the call, and the turn completed rather than erroring.
    expect(result.toolsCalled).toContain('wld_probe_secret');
    expect(result.finishReason).toBe('stop');

    // 4. The output reached the user. This is the whole product claim: not that
    //    a tool was discoverable, but that its result is in the answer.
    expect(result.assistantText).toContain(SENTINEL);
  }, TURN_TIMEOUT_MS + 30_000);

  it('records discovery separately from invocation, so a W-1 regression is legible', async () => {
    const result = await runTurn('Use the tool to fetch the probe code and report it.');

    // If this ever fails while LIST is present, the regression is the W-1 loop
    // (discovered but never invoked), not a connection or contract failure.
    expect(result.witness).toContain('LIST');
    expect(result.witness).toContain('CALL');
  }, TURN_TIMEOUT_MS + 30_000);
});
