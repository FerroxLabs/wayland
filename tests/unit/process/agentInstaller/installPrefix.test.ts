/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { installAgent, type InstallSpawn } from '@process/services/agentInstaller/installAgent';
import {
  AGENT_ID_PATTERN,
  InvalidAgentIdError,
  assertValidAgentId,
  resolveAgentInstallPrefix,
} from '@process/services/agentInstaller/installPrefix';

describe('resolveAgentInstallPrefix', () => {
  let userData: string;

  beforeEach(() => {
    userData = mkdtempSync(path.join(os.tmpdir(), 'wl-prefix-'));
  });

  afterEach(() => {
    rmSync(userData, { recursive: true, force: true });
  });

  it('places an agent at <userData>/agents/<agentId>', () => {
    expect(resolveAgentInstallPrefix('codex', userData)).toBe(path.join(userData, 'agents', 'codex'));
  });

  it('accepts only lowercase alphanumerics and hyphens', () => {
    expect(AGENT_ID_PATTERN.test('kimi-code')).toBe(true);
    expect(AGENT_ID_PATTERN.test('Codex')).toBe(false);
    expect(AGENT_ID_PATTERN.test('a.b')).toBe(false);
  });

  it.each([
    '..',
    '../evil',
    '../../Library/LaunchAgents',
    'a/../../b',
    'codex/../../..',
    '/absolute',
    'C:\\windows',
    'codex:stream',
    '',
    '.',
  ])('rejects the traversal-shaped id %j', (agentId) => {
    expect(() => assertValidAgentId(agentId)).toThrowError(InvalidAgentIdError);
    expect(() => resolveAgentInstallPrefix(agentId, userData)).toThrowError(InvalidAgentIdError);
  });
});

describe('installAgent id validation', () => {
  let userData: string;
  let spawn: InstallSpawn;
  let spawnCalls: Array<[string, string[]]>;

  beforeEach(() => {
    userData = mkdtempSync(path.join(os.tmpdir(), 'wl-prefix-guard-'));
    // A canary alongside where the traversal would land, so an escape is visible.
    writeFileSync(path.join(userData, 'canary.txt'), 'do not touch', 'utf-8');
    spawnCalls = [];
    spawn = vi.fn(async (command: string, args: string[]) => {
      spawnCalls.push([command, args]);
      return { code: 0, stdout: '', stderr: '' };
    });
  });

  afterEach(() => {
    rmSync(userData, { recursive: true, force: true });
  });

  it('rejects a path-traversal agentId without touching the filesystem or spawning', async () => {
    // <userData>/inner/agents/../../escaped normalises to <userData>/escaped.
    const escapeTarget = path.join(userData, 'escaped');
    expect(path.join(userData, 'inner', 'agents', '../../escaped')).toBe(escapeTarget);

    await expect(
      installAgent('../../escaped', { userDataDir: path.join(userData, 'inner'), bunPath: '/fake/bun', spawn })
    ).rejects.toThrowError(InvalidAgentIdError);

    // Nothing spawned, nothing created: not the escape target, not the prefix
    // root, not even the `agents/` parent directory.
    expect(spawnCalls).toEqual([]);
    expect(spawn).not.toHaveBeenCalled();
    expect(existsSync(escapeTarget)).toBe(false);
    expect(existsSync(path.join(userData, 'inner'))).toBe(false);
    expect(existsSync(path.join(userData, 'agents'))).toBe(false);
    expect(readdirSync(userData).toSorted()).toEqual(['canary.txt']);
  });
});
