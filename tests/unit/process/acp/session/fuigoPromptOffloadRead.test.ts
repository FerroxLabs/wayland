/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fuigo offloads a >25 KB prompt to `$FUIGO_HOME/sessions/.../prompts/prompt_N.txt`
 * and asks the model to read it back through `fs/read_text_file`. That path is
 * outside every workspace, so the fs guard must allow exactly that read and
 * nothing else in the engine home (config.toml, keys), never a write, and only
 * for the fuigo backend.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AcpSession } from '@process/acp/session/AcpSession';
import type { AgentConfig, ProtocolHandlers, SessionCallbacks } from '@process/acp/types';

const SESSION = 'session-1';
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fuigo-offload-'));
  roots.push(root);
  const workspace = path.join(root, 'workspace');
  const home = path.join(root, 'fuigo');
  const prompts = path.join(home, 'sessions', '%2Fworkspace', SESSION, 'prompts');
  fs.mkdirSync(workspace, { recursive: true });
  fs.mkdirSync(prompts, { recursive: true });
  fs.writeFileSync(path.join(prompts, 'prompt_0.txt'), 'the full prompt');
  fs.writeFileSync(path.join(home, 'config.toml'), '[plugins]\nauto_discover = false\n');
  fs.writeFileSync(path.join(workspace, 'notes.md'), 'workspace file');
  return { root, workspace, home, promptFile: path.join(prompts, 'prompt_0.txt') };
}

function build(agentConfig: AgentConfig) {
  const callbacks = {
    onMessage: vi.fn(),
    onSessionId: vi.fn(),
    onStatusChange: vi.fn(),
    onConfigUpdate: vi.fn(),
    onModelUpdate: vi.fn(),
    onModeUpdate: vi.fn(),
    onContextUsage: vi.fn(),
    onPermissionRequest: vi.fn(),
    onSignal: vi.fn(),
  } satisfies SessionCallbacks;
  const session = new AcpSession(agentConfig, () => ({}) as never, callbacks);
  return (session as unknown as { buildProtocolHandlers(): ProtocolHandlers }).buildProtocolHandlers();
}

const read = (handlers: ProtocolHandlers, p: string) => handlers.onReadTextFile!({ sessionId: SESSION, path: p });
const write = (handlers: ProtocolHandlers, p: string) =>
  handlers.onWriteTextFile!({ sessionId: SESSION, path: p, content: 'x' });

describe('AcpSession fs guard: Fuigo prompt offload', () => {
  it('allows reading the offloaded prompt under $FUIGO_HOME/sessions/', async () => {
    const { workspace, home, promptFile } = fixture();
    const handlers = build({
      agentBackend: 'fuigo',
      agentSource: 'builtin',
      agentId: 'conv-1',
      cwd: workspace,
      env: { FUIGO_HOME: home },
    } as AgentConfig);

    await expect(read(handlers, promptFile)).resolves.toEqual({ content: 'the full prompt' });
  });

  it('still refuses the rest of the engine home (config.toml) and anything outside the tree', async () => {
    const { root, workspace, home } = fixture();
    const handlers = build({
      agentBackend: 'fuigo',
      agentSource: 'builtin',
      agentId: 'conv-1',
      cwd: workspace,
      env: { FUIGO_HOME: home },
    } as AgentConfig);

    await expect(read(handlers, path.join(home, 'config.toml'))).rejects.toThrow('Path not allowed');
    // A .txt under sessions/ that is a symlink out of the tree resolves to its
    // real target and is refused too.
    const outside = path.join(root, 'secret.txt');
    fs.writeFileSync(outside, 'secret');
    const planted = path.join(home, 'sessions', 'planted.txt');
    fs.symlinkSync(outside, planted);
    await expect(read(handlers, planted)).rejects.toThrow('Path not allowed');
    // Only .txt / .md prompt files, and only regular files.
    const toml = path.join(home, 'sessions', 'state.toml');
    fs.writeFileSync(toml, 'x');
    await expect(read(handlers, toml)).rejects.toThrow('Path not allowed');
    await expect(read(handlers, path.join(home, 'sessions'))).rejects.toThrow('Path not allowed');
  });

  it('never allows a write under sessions/', async () => {
    const { workspace, home, promptFile } = fixture();
    const handlers = build({
      agentBackend: 'fuigo',
      agentSource: 'builtin',
      agentId: 'conv-1',
      cwd: workspace,
      env: { FUIGO_HOME: home },
    } as AgentConfig);

    await expect(write(handlers, promptFile)).rejects.toThrow('Path not allowed');
    expect(fs.readFileSync(promptFile, 'utf8')).toBe('the full prompt');
  });

  it('leaves the workspace rule unchanged, and does not apply to other backends', async () => {
    const { workspace, home, promptFile } = fixture();
    const fuigo = build({
      agentBackend: 'fuigo',
      agentSource: 'builtin',
      agentId: 'conv-1',
      cwd: workspace,
      env: { FUIGO_HOME: home },
    } as AgentConfig);
    await expect(read(fuigo, path.join(workspace, 'notes.md'))).resolves.toEqual({ content: 'workspace file' });

    const claude = build({
      agentBackend: 'claude',
      agentSource: 'builtin',
      agentId: 'conv-2',
      cwd: workspace,
      env: { FUIGO_HOME: home },
    } as AgentConfig);
    await expect(read(claude, promptFile)).rejects.toThrow('Path not allowed');

    const noHome = build({
      agentBackend: 'fuigo',
      agentSource: 'builtin',
      agentId: 'conv-3',
      cwd: workspace,
    } as AgentConfig);
    await expect(read(noHome, promptFile)).rejects.toThrow('Path not allowed');
  });
});
