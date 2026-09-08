import { describe, expect, it } from 'vitest';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {
  expectedToolsFromFixture,
  inspectEvent,
  isolatedEnvironment,
  ownedSnapshot,
  runStartup,
  runGate,
} = require('../../../scripts/windowsCoreMcpSmoke.cjs');

const tools = Array.from({ length: 113 }, (_, i) => `tool_${i}`);
function fixture(events: unknown[], options: { noExit?: boolean; survivor?: boolean } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'core-mcp-test-'));
  const child = Object.assign(new EventEmitter(), {
    pid: 42,
    stdin: new PassThrough(),
    stdout: new PassThrough(),
    stderr: new PassThrough(),
  });
  let alive = true;
  let killed = false;
  let input = '';
  child.stdin.on('data', (chunk) => {
    input += chunk;
  });
  child.stdin.on('finish', () => {
    if (options.noExit) return;
    alive = !!options.survivor;
    child.stdout.end();
    child.stderr.end();
    child.emit('close', 0, null);
  });
  const deps = {
    spawn: () => {
      setTimeout(() => events.forEach((event) => child.stdout.write(JSON.stringify(event) + '\n')), 5);
      return child;
    },
    snapshot: () => (alive ? [{ pid: 42, identity: 'same-start-and-path' }] : []),
    kill: () => {
      killed = true;
      alive = false;
      child.stdout.end();
      child.stderr.end();
      child.emit('close', 1, null);
    },
  };
  return { root, child, deps, input: () => input, killed: () => killed };
}

async function run(events: unknown[], options = {}) {
  const f = fixture(events, options);
  try {
    const result = await runStartup(
      {
        root: f.root,
        home: f.root,
        core: 'fixture',
        server: 'unique',
        expectedTools: 113,
        timeoutMs: 50,
        shutdownMs: 50,
      },
      f.deps
    );
    return { result, input: f.input(), killed: f.killed() };
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fs.rmSync(f.root, { recursive: true, force: true });
  }
}

describe('early native Windows Core MCP receipt', () => {
  it('derives the count from the pinned fixture and refuses inconsistent metadata', () => {
    const valid = {
      _header: { package: '@ferroxlabs/tvcontrol', version: '2.5.3', toolCount: 2 },
      tools: { first: {}, second: {} },
    };
    expect(expectedToolsFromFixture(valid, '2.5.3')).toBe(2);
    for (const fixture of [
      { ...valid, _header: undefined },
      { ...valid, _header: { ...valid._header, version: '2.5.2' } },
      { ...valid, _header: { ...valid._header, package: 'other' } },
      { ...valid, _header: { ...valid._header, toolCount: 0 } },
      { ...valid, _header: { ...valid._header, toolCount: 3 } },
      { ...valid, tools: [] },
    ])
      expect(() => expectedToolsFromFixture(fixture, '2.5.3')).toThrow('mismatch');
  });
  it('accepts real protocol shape, sends no prompt and closes stdin after registration', async () => {
    const { result, input, killed } = await run([{ type: 'mcp_ready', name: 'unique', tools }]);
    expect(result.accepted).toBe(true);
    expect(result.cleanupVerified).toBe(true);
    expect(input).toBe('');
    expect(killed).toBe(false);
  });
  it.each([
    { type: 'mcp_failed', name: 'unique', error: 'transport EOF' },
    { type: 'error', message: 'startup failed' },
    { type: 'mcp_ready', name: 'another', tools },
    { type: 'mcp_ready', name: 'unique', tools: tools.slice(1) },
    { type: 'mcp_ready', name: 'unique', tools: Array(113).fill('duplicate') },
    { type: 'mcp_ready', name: 'unique', tools: tools.map((name) => ({ name })) },
    { type: 'mcp_ready', name: 'unique', tools: ['', ...tools.slice(1)] },
  ])('fails a wrong or failed receipt and cleans its process', async (event) => {
    const { result, killed } = await run([event]);
    expect(result.accepted).toBe(false);
    expect(result.cleanupVerified).toBe(true);
    expect(killed).toBe(true);
  });
  it('bounds missing registration and EOF shutdown independently', async () => {
    expect((await run([])).result.error).toContain('initialization timed out');
    expect((await run([{ type: 'mcp_ready', name: 'unique', tools }], { noExit: true })).result.error).toContain(
      'did not exit'
    );
  });
  it('does not promote a leaked process to a pass after forced cleanup', async () => {
    const { result, killed } = await run([{ type: 'mcp_ready', name: 'unique', tools }], { survivor: true });
    expect(result.accepted).toBe(false);
    expect(result.cleanupVerified).toBe(true);
    expect(killed).toBe(true);
  });
  it('ignores generic ready rather than confusing it with MCP registration', () => {
    expect(inspectEvent({ type: 'ready' }, 'unique', 113)).toBe(false);
  });
  it('does not inherit credentials, provider endpoints, user config or PATH', () => {
    const env = isolatedEnvironment('isolated', {
      SystemRoot: 'C:\\Windows',
      OPENAI_API_KEY: 'secret',
      WAYLAND_HOME: 'normal',
      PATH: 'user-bin',
      OLLAMA_HOST: 'remote',
    });
    expect(env).not.toHaveProperty('OPENAI_API_KEY');
    expect(env).not.toHaveProperty('OLLAMA_HOST');
    expect(env.HOME).toBe('isolated');
    expect(env.WAYLAND_HOME).toBe('isolated');
    expect(env.PATH).not.toBe('user-bin');
  });
  it('retains detached owned identities but rejects a recycled PID', () => {
    const records = [
      { ProcessId: 42, ParentProcessId: 1, CreationDate: 'new', ExecutablePath: 'normal-app', CommandLine: '' },
      { ProcessId: 43, ParentProcessId: 1, CreationDate: 'old', ExecutablePath: 'detached-child', CommandLine: '' },
    ];
    const observed = [
      { pid: 42, identity: 'old\\0old-core' },
      { pid: 43, identity: 'old\\0detached-child' },
    ].map((r) => ({ ...r, identity: r.identity.replace('\\0', String.fromCharCode(0)) }));
    expect(
      ownedSnapshot(42, '/isolated', observed, () => JSON.stringify(records)).map((r: { pid: number }) => r.pid)
    ).toEqual([43]);
  });
  it('rejects cross-host execution without launching a child', async () => {
    await expect(runGate({ platform: 'darwin', arch: 'x64' })).rejects.toThrow('UNSUPPORTED');
  });
});
