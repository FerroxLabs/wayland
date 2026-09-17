/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1376: on a Mac where the Wayland home is reached through a symlink
 * (`~/.wayland` -> `~/Library/Application Support/Wayland/wayland`), Desktop
 * registers the chat workspace by the symlink path and Fuigo asks for files by
 * their REAL path. The lexical fs guard refused every file in the chat's own
 * workspace ("Path not allowed: …/fuigo-temp-…/.wayland/skills/…/SKILL.md is
 * outside permitted directories"), so no staged skill was readable. The guard
 * now compares real paths on both sides - which must not open the other
 * direction: a symlink inside the workspace that points out of it stays refused.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AcpSession } from '@process/acp/session/AcpSession';
import type { AgentConfig, ProtocolHandlers, SessionCallbacks } from '@process/acp/types';

const SESSION = '01a09d0b-1a6c-7ee3-94da-d873016bff1e';
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

/** A real Wayland home, a `.wayland` symlink to it, and a chat workspace under the link. */
function fixture() {
  const root = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'acp-symlink-guard-')));
  roots.push(root);
  const realHome = path.join(root, 'Library', 'Application Support', 'Wayland', 'wayland');
  const linkHome = path.join(root, '.wayland');
  const realWorkspace = path.join(realHome, 'fuigo-temp-1789341140262');
  const skill = path.join(realWorkspace, '.wayland', 'skills', 'rebel-trader-rules');
  fs.mkdirSync(skill, { recursive: true });
  fs.writeFileSync(path.join(skill, 'SKILL.md'), '# Rebel Trader Rules');
  fs.symlinkSync(realHome, linkHome);
  return {
    root,
    realWorkspace,
    // What Desktop registers as the session cwd (built from `~/.wayland`).
    linkWorkspace: path.join(linkHome, 'fuigo-temp-1789341140262'),
    realSkillFile: path.join(skill, 'SKILL.md'),
  };
}

function build(cwd: string) {
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
  const session = new AcpSession(
    { agentBackend: 'fuigo', agentSource: 'builtin', agentId: 'conv-1', cwd } as AgentConfig,
    () => ({}) as never,
    callbacks
  );
  return (session as unknown as { buildProtocolHandlers(): ProtocolHandlers }).buildProtocolHandlers();
}

const read = (handlers: ProtocolHandlers, p: string) => handlers.onReadTextFile!({ sessionId: SESSION, path: p });
const write = (handlers: ProtocolHandlers, p: string, content = 'x') =>
  handlers.onWriteTextFile!({ sessionId: SESSION, path: p, content });

describe('AcpSession fs guard: workspace reached through a symlink (#1376)', () => {
  it("reads a staged skill by its REAL path when the workspace was registered through the symlink (Sean's session)", async () => {
    const { linkWorkspace, realSkillFile } = fixture();
    const handlers = build(linkWorkspace);

    await expect(read(handlers, realSkillFile)).resolves.toEqual({ content: '# Rebel Trader Rules' });
  });

  it('reads it by the symlink path too, and when the cwd is the real path', async () => {
    const { linkWorkspace, realWorkspace, realSkillFile } = fixture();
    const viaLink = path.join(linkWorkspace, '.wayland', 'skills', 'rebel-trader-rules', 'SKILL.md');

    await expect(read(build(linkWorkspace), viaLink)).resolves.toEqual({ content: '# Rebel Trader Rules' });
    await expect(read(build(realWorkspace), viaLink)).resolves.toEqual({ content: '# Rebel Trader Rules' });
    await expect(read(build(realWorkspace), realSkillFile)).resolves.toEqual({ content: '# Rebel Trader Rules' });
  });

  it('writes a NEW file (and a new directory) under the symlinked workspace by its real path', async () => {
    const { linkWorkspace, realWorkspace } = fixture();
    const handlers = build(linkWorkspace);
    const target = path.join(realWorkspace, 'out', 'report.md');
    fs.mkdirSync(path.dirname(target));

    await expect(write(handlers, target, 'done')).resolves.toEqual({});
    expect(fs.readFileSync(target, 'utf8')).toBe('done');
    // A target whose parent does not exist yet is judged by its deepest existing ancestor.
    await expect(write(handlers, path.join(realWorkspace, 'missing', 'deeper', 'a.md'))).rejects.toThrow(
      'Write failed'
    );
  });

  it('still refuses a symlink planted inside the workspace that points outside it', async () => {
    const { root, linkWorkspace, realWorkspace } = fixture();
    const secret = path.join(root, 'secret.txt');
    fs.writeFileSync(secret, 'secret');
    fs.symlinkSync(secret, path.join(realWorkspace, 'escape.txt'));
    fs.symlinkSync(root, path.join(realWorkspace, 'escape-dir'));
    const handlers = build(linkWorkspace);

    await expect(read(handlers, path.join(linkWorkspace, 'escape.txt'))).rejects.toThrow('Path not allowed');
    await expect(read(handlers, path.join(realWorkspace, 'escape-dir', 'secret.txt'))).rejects.toThrow(
      'Path not allowed'
    );
    await expect(write(handlers, path.join(realWorkspace, 'escape-dir', 'new.txt'))).rejects.toThrow(
      'Path not allowed'
    );
    expect(fs.existsSync(path.join(root, 'new.txt'))).toBe(false);
  });

  it('refuses a write through a dangling symlink that would land outside the workspace', async () => {
    const { root, realWorkspace } = fixture();
    const outside = path.join(root, 'created-outside.txt');
    fs.symlinkSync(outside, path.join(realWorkspace, 'dangling.txt'));
    const handlers = build(realWorkspace);

    await expect(write(handlers, path.join(realWorkspace, 'dangling.txt'))).rejects.toThrow('Path not allowed');
    expect(fs.existsSync(outside)).toBe(false);
  });

  it('still refuses plain traversal out of the workspace', async () => {
    const { root, linkWorkspace } = fixture();
    fs.writeFileSync(path.join(root, 'other.txt'), 'other');
    const handlers = build(linkWorkspace);

    await expect(read(handlers, path.join(linkWorkspace, '..', '..', 'other.txt'))).rejects.toThrow('Path not allowed');
    await expect(read(handlers, path.join(root, 'other.txt'))).rejects.toThrow('Path not allowed');
  });
});
