/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #645 Task 4 — command PATH resolution. Uses the real `node` binary
 * (always installed) so the test is hermetic and cross-platform.
 */
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveCommandPath } from '@process/terminal/terminalPath';

const nodeDir = path.dirname(process.execPath);
const nodeName = path.basename(process.execPath);

describe('resolveCommandPath (#645)', () => {
  it('finds a bare command on the given PATH', () => {
    const resolved = resolveCommandPath(nodeName.replace(/\.exe$/i, ''), { PATH: nodeDir });
    expect(resolved).not.toBeNull();
    expect(path.basename(resolved as string).toLowerCase()).toContain('node');
  });

  it('returns an absolute executable path unchanged', () => {
    expect(resolveCommandPath(process.execPath, { PATH: '' })).toBe(process.execPath);
  });

  it('returns null for a command that is not installed', () => {
    expect(resolveCommandPath('definitely-not-a-real-cli-xyz', { PATH: nodeDir })).toBeNull();
  });

  it('returns null when PATH is empty and the command is bare', () => {
    expect(resolveCommandPath('node', {})).toBeNull();
  });
});
