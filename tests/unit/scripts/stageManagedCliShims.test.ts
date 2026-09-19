/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The headless npm payload has to carry the managed OfficeCLI shims (#1316).
 *
 * getManagedOfficeCliShimDir() is fail-closed: without that directory it throws
 * "Wayland managed OfficeCLI fallback guard is unavailable", and the launcher
 * runs the server with cwd = payload, so the guard resolves
 * payload/resources/managed-cli-shims. The payload builder never copied it, so
 * from 0.12.13 through 0.13.1 every chat failed on a fresh headless install.
 * These tests pin the staging, including the executable bit the guard checks.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';
// @ts-expect-error - .mjs script has no type declarations
import { REQUIRED_SHIMS, stageManagedCliShims } from '../../../installer/scripts/stageManagedCliShims.mjs';

const made: string[] = [];

function tmpTree(withShims = true): { app: string; payload: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-shim-'));
  made.push(root);
  const app = path.join(root, 'app');
  const payload = path.join(root, 'payload');
  fs.mkdirSync(payload, { recursive: true });
  if (withShims) {
    const dir = path.join(app, 'resources', 'managed-cli-shims');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'officecli'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
    fs.writeFileSync(path.join(dir, 'officecli.cmd'), '@echo off\r\nexit /b 1\r\n');
  }
  return { app, payload };
}

afterEach(() => {
  while (made.length) fs.rmSync(made.pop() as string, { recursive: true, force: true });
});

describe('managed OfficeCLI shim staging', () => {
  it('puts both shims where the fail-closed guard looks for them', () => {
    const { app, payload } = tmpTree();

    stageManagedCliShims(app, payload);

    for (const name of REQUIRED_SHIMS) {
      const shipped = path.join(payload, 'resources', 'managed-cli-shims', name);
      expect(fs.existsSync(shipped), `${name} must ship in the payload`).toBe(true);
    }
  });

  it('keeps the POSIX shim executable, which the guard checks', () => {
    const { app, payload } = tmpTree();

    stageManagedCliShims(app, payload);

    const mode = fs.statSync(path.join(payload, 'resources', 'managed-cli-shims', 'officecli')).mode;
    // Same reason as above: only POSIX carries the bit through the copy.
    if (process.platform === 'win32') return;
    expect(mode & 0o111).not.toBe(0);
  });

  it('refuses to build a payload that would boot into the guard error', () => {
    const { app, payload } = tmpTree(false);

    expect(() => stageManagedCliShims(app, payload)).toThrow(/missing in source/);
  });

  // NTFS carries no POSIX mode bits: a Windows host can neither create the
  // condition nor observe it, so this case only means something on POSIX.
  it.skipIf(process.platform === 'win32')(
    'refuses a source shim that is not executable, since the guard would reject it',
    () => {
      const { app, payload } = tmpTree();
      // A checkout that lost the mode bit (a zip round-trip, a Windows checkout)
      // copies cleanly and then fails the guard at runtime. Catch it at build time.
      fs.chmodSync(path.join(app, 'resources', 'managed-cli-shims', 'officecli'), 0o644);

      expect(() => stageManagedCliShims(app, payload)).toThrow(/executable bit/);
    }
  );

  it('reports the shim that failed to copy rather than shipping a partial set', () => {
    const { app, payload } = tmpTree();
    // Source carries only the .cmd: the POSIX shim the guard needs is absent.
    fs.rmSync(path.join(app, 'resources', 'managed-cli-shims', 'officecli'));

    expect(() => stageManagedCliShims(app, payload)).toThrow(/officecli/);
  });
});
