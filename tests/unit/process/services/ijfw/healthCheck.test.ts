/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

let tmpHome: string;

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return {
    ...actual,
    homedir: () => tmpHome,
  };
});

// eslint-disable-next-line import/first
import { watchInstallRoot } from '@process/services/ijfw/healthCheck';

function flushFs(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 60));
}

describe('ijfw/healthCheck', () => {
  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-health-'));
    fs.mkdirSync(path.join(tmpHome, '.ijfw'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it('returns a disposer function', () => {
    const dispose = watchInstallRoot(() => {
      /* noop */
    });
    expect(typeof dispose).toBe('function');
    dispose();
  });

  it('does not throw when the install root directory is missing', () => {
    // Wipe the .ijfw dir, then try to watch — should not throw.
    fs.rmSync(path.join(tmpHome, '.ijfw'), { recursive: true, force: true });
    const dispose = watchInstallRoot(() => {
      /* noop */
    });
    dispose();
  });

  it('emits onChange when the mcp-server entry appears', async () => {
    const events: boolean[] = [];
    const dispose = watchInstallRoot((exists) => events.push(exists));
    fs.mkdirSync(path.join(tmpHome, '.ijfw', 'mcp-server'), { recursive: true });
    await flushFs();
    expect(events.some((v) => v === true)).toBe(true);
    dispose();
  });

  it('emits onChange when the mcp-server entry disappears', async () => {
    fs.mkdirSync(path.join(tmpHome, '.ijfw', 'mcp-server'), { recursive: true });
    const events: boolean[] = [];
    const dispose = watchInstallRoot((exists) => events.push(exists));
    fs.rmSync(path.join(tmpHome, '.ijfw', 'mcp-server'), { recursive: true, force: true });
    await flushFs();
    expect(events.some((v) => v === false)).toBe(true);
    dispose();
  });
});
