/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Contract for applyPendingSwap — the boot-time swap that activates an engine
 * update staged as `<binary>.pending` (Windows can't replace the running binary
 * in place, so the update is staged and applied at startup before any engine
 * spawns). Tests the platform-independent swap/backup logic; the actual Windows
 * file-lock behavior is verified end-to-end on a real Windows host.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { applyPendingSwap } from '../../src/process/agent/wcore/wcoreUpdater';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-pending-swap-'));
const finalPath = path.join(tmp, 'wayland-core');
const pendingPath = `${finalPath}.pending`;
const prevPath = `${finalPath}.prev`;

beforeEach(() => {
  for (const p of [finalPath, pendingPath, prevPath]) fs.rmSync(p, { force: true });
});
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

describe('applyPendingSwap', () => {
  it('no pending file: no-op, live binary untouched', () => {
    fs.writeFileSync(finalPath, 'OLD');
    expect(applyPendingSwap(finalPath).applied).toBe(false);
    expect(fs.readFileSync(finalPath, 'utf8')).toBe('OLD');
  });

  it('pending over an existing binary: swaps in, backs up .prev, removes pending', () => {
    fs.writeFileSync(finalPath, 'OLD');
    fs.writeFileSync(pendingPath, 'NEW');
    expect(applyPendingSwap(finalPath).applied).toBe(true);
    expect(fs.readFileSync(finalPath, 'utf8')).toBe('NEW');
    expect(fs.existsSync(pendingPath)).toBe(false);
    expect(fs.readFileSync(prevPath, 'utf8')).toBe('OLD'); // rollback anchor
  });

  it('pending with no existing binary: installs the pending binary', () => {
    fs.writeFileSync(pendingPath, 'NEW');
    expect(applyPendingSwap(finalPath).applied).toBe(true);
    expect(fs.readFileSync(finalPath, 'utf8')).toBe('NEW');
    expect(fs.existsSync(pendingPath)).toBe(false);
  });

  it('idempotent: a second call after a successful apply is a no-op', () => {
    fs.writeFileSync(finalPath, 'OLD');
    fs.writeFileSync(pendingPath, 'NEW');
    expect(applyPendingSwap(finalPath).applied).toBe(true);
    expect(applyPendingSwap(finalPath).applied).toBe(false);
    expect(fs.readFileSync(finalPath, 'utf8')).toBe('NEW');
  });
});
