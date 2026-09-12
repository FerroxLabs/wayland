/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ exec: vi.fn(), files: new Map<string, string>() }));
vi.mock('@process/utils/safeExec', () => ({ safeExecFile: mocks.exec, execErrorDetail: () => 'failed' }));
vi.mock('@process/utils/shellEnv', () => ({ getEnhancedEnv: () => ({}) }));
vi.mock('node:fs', () => ({
  existsSync: (file: string) => mocks.files.has(file),
  readFileSync: (file: string) => mocks.files.get(file),
}));
import { runAgentCli } from '@process/services/mcpServices/agents/agentCliExec';

const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')!;
const prefix = String.raw`C:\Users\fixture\npm`;
const node = String.raw`C:\Program Files\nodejs\node.exe`;
const env = { PATH: String.raw`${prefix};C:\Program Files\nodejs`, CODEX_HOME: String.raw`C:\isolated\codex` };
const missing = Object.assign(new Error('spawn CLI ENOENT'), { code: 'ENOENT' });

beforeEach(() => {
  Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
  mocks.exec.mockReset();
  mocks.files.clear();
});
afterEach(() => Object.defineProperty(process, 'platform', originalPlatform));

function npmCli(command: string, packageName: string, bin: string): string {
  const packageRoot = `${prefix}\\node_modules\\${packageName.replaceAll('/', '\\')}`;
  const script = `${packageRoot}\\${bin.replaceAll('/', '\\')}`;
  mocks.files.set(`${packageRoot}\\package.json`, JSON.stringify({ name: packageName, bin: { [command]: bin } }));
  mocks.files.set(
    `${prefix}\\${command}.cmd`,
    `@ECHO off\n"%_prog%" "%dp0%\\node_modules\\${packageName.replaceAll('/', '\\')}\\${bin.replaceAll('/', '\\')}" %*\n`
  );
  mocks.files.set(script, '// installed CLI');
  mocks.files.set(node, 'native runtime');
  mocks.exec.mockImplementation(async (file: string, args: string[]) => {
    if (file === command) throw missing;
    if (file === 'where.exe')
      return {
        stdout: args[0] === 'node.exe' ? node : `${prefix}\\${command}\r\n${prefix}\\${command}.cmd`,
        stderr: '',
      };
    if (file === node) return { stdout: 'published', stderr: '' };
    throw new Error('Unexpected executable ' + file);
  });
  return script;
}

describe('Windows installed npm CLI publication', () => {
  it.each([
    ['codex', '@openai/codex', 'bin/codex.js'],
    ['gemini', '@google/gemini-cli', 'bundle/gemini.js'],
  ])('runs %s through its declared npm entry without a command shell', async (command, pkg, bin) => {
    const script = npmCli(command, pkg, bin);
    const args = ['mcp', 'add', 'tvcontrol', String.raw`C:\TV A&B\server.js`, '%PATH%', '$(touch nope)'];
    await expect(runAgentCli(command, args, { env })).resolves.toEqual({ stdout: 'published', stderr: '' });
    expect(mocks.exec).toHaveBeenLastCalledWith(node, [script, ...args], { timeout: 15000, env });
  });

  it('does not reinterpret a custom cmd wrapper whose target differs from the package bin', async () => {
    npmCli('codex', '@openai/codex', 'bin/codex.js');
    mocks.files.set(`${prefix}\\codex.cmd`, '@echo off\ncustom-runtime %*');
    await expect(runAgentCli('codex', ['mcp', 'add', 'x'], { env })).rejects.toBe(missing);
    expect(mocks.exec.mock.calls.some(([file]) => file === node)).toBe(false);
  });

  it('reuses the resolved executable for the existing timeout retry', async () => {
    npmCli('codex', '@openai/codex', 'bin/codex.js');
    const execute = mocks.exec.getMockImplementation()!;
    let calls = 0;
    mocks.exec.mockImplementation(async (file: string, args: string[]) => {
      if (file === node && calls++ === 0) throw Object.assign(new Error('timed out after 15000ms'), { killed: true });
      return execute(file, args);
    });
    await expect(runAgentCli('codex', ['mcp', 'add', 'x'], { env })).resolves.toEqual({
      stdout: 'published',
      stderr: '',
    });
    expect(mocks.exec.mock.calls.filter(([file]) => file === 'where.exe')).toHaveLength(2);
    expect(mocks.exec.mock.calls.filter(([file]) => file === node)).toHaveLength(2);
  });

  it('preserves actual CLI failures without retry or resolution', async () => {
    const error = Object.assign(new Error('invalid configuration'), { code: 1 });
    mocks.exec.mockRejectedValue(error);
    await expect(runAgentCli('codex', ['mcp', 'add', 'x'], { env })).rejects.toBe(error);
    expect(mocks.exec).toHaveBeenCalledTimes(1);
  });

  it('refuses a package bin outside the installed package directory', async () => {
    npmCli('codex', '@openai/codex', '../../escape.js');
    await expect(runAgentCli('codex', ['mcp', 'add', 'x'], { env })).rejects.toBe(missing);
    expect(mocks.exec.mock.calls.some(([file]) => file === node)).toBe(false);
  });
});
