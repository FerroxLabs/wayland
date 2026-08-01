/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #853 - exec/process-failure reason composition (pure).
 *
 * Proves the composition layer that turns a spawn errno (`err.code`) into human
 * launch-failure text and turns an exit `(code, signal)` into a real reason -
 * so an AV `SIGKILL` reads as a kill signal, never "exited with code null".
 * No process spawn, no mocks: just the two pure functions.
 */
import { describe, it, expect } from 'vitest';
import { describeSpawnError, describeExitReason } from '@process/agent/wcore/execFailureReason';

describe('describeSpawnError (#853)', () => {
  it('maps ENOENT to a missing/blocked-binary lead and keeps the errno token', () => {
    const err = Object.assign(new Error('spawn wcore ENOENT'), {
      code: 'ENOENT',
      syscall: 'spawn',
    }) as NodeJS.ErrnoException;
    const out = describeSpawnError(err);
    expect(out).toContain('ENOENT');
    expect(out).toMatch(/could not be launched/i);
    expect(out).toMatch(/missing|blocked/i);
    expect(out).toMatch(/antivirus|firewall|code[- ]signature/i);
  });

  it('maps EACCES to a not-executable / blocked lead and keeps the errno token', () => {
    const err = Object.assign(new Error('spawn EACCES'), { code: 'EACCES' }) as NodeJS.ErrnoException;
    const out = describeSpawnError(err);
    expect(out).toContain('EACCES');
    expect(out).toMatch(/not executable|blocked/i);
  });

  it('maps EPERM to a not-executable / blocked lead and keeps the errno token', () => {
    const err = Object.assign(new Error('spawn EPERM'), { code: 'EPERM' }) as NodeJS.ErrnoException;
    const out = describeSpawnError(err);
    expect(out).toContain('EPERM');
    expect(out).toMatch(/not executable|blocked/i);
  });

  it('falls back to a generic lead that still includes the message when no code is present', () => {
    const err = new Error('something went sideways while launching') as NodeJS.ErrnoException;
    const out = describeSpawnError(err);
    expect(out).toMatch(/could not be launched/i);
    expect(out).toContain('something went sideways while launching');
    expect(out.trim().length).toBeGreaterThan(0);
  });
});

describe('describeExitReason (#853)', () => {
  it('surfaces the kill signal (not "code null") when a signal is present', () => {
    const out = describeExitReason(null, 'SIGKILL');
    expect(out).toContain('SIGKILL');
    expect(out).toMatch(/killed by/i);
    expect(out).toMatch(/antivirus|firewall|code[- ]signature/i);
    expect(out).not.toContain('code null');
  });

  it('surfaces the numeric exit code verbatim as "exited with code <code>"', () => {
    expect(describeExitReason(1, null)).toBe('exited with code 1');
    expect(describeExitReason(0, null)).toBe('exited with code 0');
    expect(describeExitReason(127, null)).toBe('exited with code 127');
  });
});
