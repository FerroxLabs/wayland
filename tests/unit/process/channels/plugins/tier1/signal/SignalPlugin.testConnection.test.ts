/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * SignalPlugin.testConnection - happy path + 4 error paths:
 *   bad JSON, missing phone, bad format, binary not found, not registered.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoist execFile mock ───────────────────────────────────────────────────────

const { mockExecFile } = vi.hoisted(() => {
  const mockExecFile = vi.fn();
  return { mockExecFile };
});

vi.mock('node:child_process', () => ({
  execFile: mockExecFile,
  spawn: vi.fn(),
}));

vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/fake/app', getPath: () => '/fake/userData' },
}));

vi.mock('node:fs', () => ({
  default: { existsSync: vi.fn(() => false) },
  existsSync: vi.fn(() => false),
}));

import { SignalPlugin } from '@process/channels/plugins/tier1/signal/SignalPlugin';

/** Helper: make execFile resolve with given stdout/stderr/code */
function stubExecFile(stdout: string, stderr: string, code: number) {
  mockExecFile.mockImplementation(
    (_f: unknown, _a: unknown, _o: unknown, cb: (err: null | Error, stdout: string, stderr: string) => void) => {
      if (code === 0) {
        cb(null, stdout, stderr);
      } else {
        const err = new Error('exit ' + code) as NodeJS.ErrnoException;
        err.code = code;
        cb(err, stdout, stderr);
      }
    },
  );
}

beforeEach(() => {
  mockExecFile.mockReset();
});

describe('SignalPlugin.testConnection', () => {
  it('returns success:false on invalid JSON', async () => {
    const r = await SignalPlugin.testConnection('not-json');
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/json/i);
  });

  it('returns success:false when phoneNumber is missing', async () => {
    const r = await SignalPlugin.testConnection(JSON.stringify({}));
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/phoneNumber/i);
  });

  it('returns success:false when phone is not E.164', async () => {
    const r = await SignalPlugin.testConnection(JSON.stringify({ phoneNumber: '5551234' }));
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/E\.164/i);
  });

  it('returns success:false when signal-cli binary is not found', async () => {
    // Both --version and listContacts fail (binary absent).
    stubExecFile('', 'not found', 127);
    const r = await SignalPlugin.testConnection(JSON.stringify({ phoneNumber: '+14155551234' }));
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/signal-cli binary not found/i);
  });

  it('returns success:false when number is not registered', async () => {
    // First call is --version (success), second is listContacts (not registered).
    mockExecFile
      .mockImplementationOnce((_f: unknown, _a: unknown, _o: unknown, cb: (err: null, stdout: string, stderr: string) => void) => {
        cb(null, 'signal-cli 0.13.5', '');
      })
      .mockImplementationOnce((_f: unknown, _a: unknown, _o: unknown, cb: (err: Error, stdout: string, stderr: string) => void) => {
        const err = new Error('exit 1') as NodeJS.ErrnoException;
        err.code = 1;
        cb(err, '', 'This number is not registered');
      });

    const r = await SignalPlugin.testConnection(JSON.stringify({ phoneNumber: '+14155551234' }));
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/not registered/i);
  });

  it('returns success:true + botUsername on registered account', async () => {
    // --version succeeds, listContacts succeeds.
    mockExecFile
      .mockImplementationOnce((_f: unknown, _a: unknown, _o: unknown, cb: (err: null, stdout: string, stderr: string) => void) => {
        cb(null, 'signal-cli 0.13.5', '');
      })
      .mockImplementationOnce((_f: unknown, _a: unknown, _o: unknown, cb: (err: null, stdout: string, stderr: string) => void) => {
        cb(null, '[]', '');
      });

    const r = await SignalPlugin.testConnection(JSON.stringify({ phoneNumber: '+14155551234' }));
    expect(r.success).toBe(true);
    expect(r.botUsername).toBe('+14155551234');
  });

  it('includes configDir in args when provided', async () => {
    mockExecFile
      .mockImplementationOnce((_f: unknown, _a: unknown, _o: unknown, cb: (err: null, stdout: string, stderr: string) => void) => {
        cb(null, 'signal-cli 0.13.5', '');
      })
      .mockImplementationOnce((
        _f: unknown,
        args: string[],
        _o: unknown,
        cb: (err: null, stdout: string, stderr: string) => void,
      ) => {
        // configDir must appear in the args
        expect(args).toContain('/custom/config');
        cb(null, '[]', '');
      });

    const r = await SignalPlugin.testConnection(
      JSON.stringify({ phoneNumber: '+14155551234', configDir: '/custom/config' }),
    );
    expect(r.success).toBe(true);
  });

  it('returns success:false with clear message on pending SMS verification', async () => {
    mockExecFile
      .mockImplementationOnce((_f: unknown, _a: unknown, _o: unknown, cb: (err: null, stdout: string, stderr: string) => void) => {
        cb(null, 'signal-cli 0.13.5', '');
      })
      .mockImplementationOnce((_f: unknown, _a: unknown, _o: unknown, cb: (err: Error, stdout: string, stderr: string) => void) => {
        const err = new Error('exit 1') as NodeJS.ErrnoException;
        err.code = 1;
        cb(err, '', 'Registration pending SMS verification');
      });

    const r = await SignalPlugin.testConnection(JSON.stringify({ phoneNumber: '+14155551234' }));
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/pending/i);
  });
});
