/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Control PATH lookups deterministically: without this mock the resolver
// would shell out to `which`/`where` and depend on the dev machine's PATH.
vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }));

import { execFileSync } from 'node:child_process';
import {
  BINARY_CANDIDATES,
  WNANO_OVERRIDE_SUBDIR,
  getBinaryName,
  resolveWNanoBinary,
} from '@/process/agent/wnano/binaryResolver';

const execFileSyncMock = vi.mocked(execFileSync);

const runtimeKey = `${process.platform}-${process.arch}`;
const devBundleDir = path.join(process.cwd(), 'resources', 'bundled-wayland-nano');
const devBinaryPath = path.join(devBundleDir, runtimeKey, getBinaryName());

function stageDevBinary(): void {
  fs.mkdirSync(path.dirname(devBinaryPath), { recursive: true });
  fs.writeFileSync(devBinaryPath, 'test-wayland-nano');
}

beforeEach(() => {
  // Default: nothing on PATH.
  execFileSyncMock.mockImplementation(() => {
    throw new Error('not found');
  });
});

afterEach(() => {
  vi.clearAllMocks();
  fs.rmSync(devBundleDir, { recursive: true, force: true });
});

describe('resolveWNanoBinary', () => {
  it('looks for the primary binary first, then the convenience alias', () => {
    expect(BINARY_CANDIDATES).toEqual(['wayland-nano', 'wnano']);
    expect(getBinaryName()).toBe(process.platform === 'win32' ? 'wayland-nano.exe' : 'wayland-nano');
    expect(WNANO_OVERRIDE_SUBDIR).toBe('wayland-nano-overrides');
  });

  it('resolves the dev-resources bundle prepared by prepareWaylandNano.js', () => {
    stageDevBinary();
    expect(resolveWNanoBinary()).toBe(devBinaryPath);
  });

  it('prefers the dev-resources bundle over a PATH hit', () => {
    stageDevBinary();
    execFileSyncMock.mockReturnValue('C:\\elsewhere\\wayland-nano.exe\n');
    expect(resolveWNanoBinary()).toBe(devBinaryPath);
    expect(execFileSyncMock).not.toHaveBeenCalled();
  });

  it('falls back to PATH when no override, bundled, or dev binary exists', () => {
    execFileSyncMock.mockImplementation((_cmd, args) => {
      // Return a path that really exists so the resolver's existsSync gate passes.
      if ((args as string[])[0] === 'wayland-nano') return `${process.execPath}\n`;
      throw new Error('not found');
    });
    expect(resolveWNanoBinary()).toBe(process.execPath);
  });

  it('returns null when the binary cannot be found anywhere', () => {
    expect(resolveWNanoBinary()).toBeNull();
  });
});
