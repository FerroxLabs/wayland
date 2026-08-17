/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type LogMessage = { level: string; data: unknown[] };
type LogHook = (message: LogMessage, transport: unknown, transportName: string) => LogMessage | false;

describe('configureConsoleLog', () => {
  const mockLog = {
    // electron-log's own hook list (Logger.hooks). configureConsoleLog pushes
    // the #984 file-transport redaction hook onto it.
    hooks: [] as LogHook[],
    transports: {
      file: { fileName: '', level: '' as string | boolean, maxSize: 0 },
      console: { level: '' as string | boolean },
    },
    initialize: vi.fn(),
    functions: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    },
  };

  // Save all console methods that Object.assign(console, log.functions) may overwrite
  const savedConsole: Record<string, unknown> = {};

  beforeEach(() => {
    // Capture every key that the mock will overwrite
    for (const key of Object.keys(mockLog.functions)) {
      savedConsole[key] = (console as any)[key];
    }
    vi.resetModules();
    vi.doMock('electron-log/main', () => ({ default: mockLog }));
    // Reset mock state
    mockLog.transports.file.fileName = '';
    mockLog.transports.file.level = '';
    mockLog.transports.console.level = '';
    mockLog.transports.file.maxSize = 0;
    mockLog.hooks.length = 0;
    mockLog.initialize.mockClear();
  });

  afterEach(() => {
    vi.doUnmock('electron-log/main');
    // Restore all overridden console methods
    for (const [key, fn] of Object.entries(savedConsole)) {
      (console as any)[key] = fn;
    }
  });

  it('sets daily log file name in YYYY-MM-DD.log format', async () => {
    await import('@process/utils/configureConsoleLog');

    expect(mockLog.transports.file.fileName).toMatch(/^\d{4}-\d{2}-\d{2}\.log$/);
  });

  it('sets file transport level to info', async () => {
    await import('@process/utils/configureConsoleLog');

    expect(mockLog.transports.file.level).toBe('info');
  });

  it('sets console transport level to silly', async () => {
    await import('@process/utils/configureConsoleLog');

    expect(mockLog.transports.console.level).toBe('silly');
  });

  it('caps daily log file at 10 MB', async () => {
    await import('@process/utils/configureConsoleLog');

    expect(mockLog.transports.file.maxSize).toBe(10 * 1024 * 1024);
  });

  it('calls log.initialize()', async () => {
    await import('@process/utils/configureConsoleLog');

    expect(mockLog.initialize).toHaveBeenCalledOnce();
  });

  it('redirects main-process console to electron-log functions', async () => {
    await import('@process/utils/configureConsoleLog');

    // After import, console.log should be replaced by electron-log's function
    expect(console.log).toBe(mockLog.functions.log);
    expect(console.warn).toBe(mockLog.functions.warn);
    expect(console.error).toBe(mockLog.functions.error);
  });

  // #984 — the daily file is plaintext on disk and is what a user attaches to a
  // bug report. Untrusted subprocess output (agent/engine stderr) reaches it
  // through several logging paths, so the FILE transport is scrubbed by default
  // rather than by caller discipline. The console transport is deliberately
  // left alone so live debugging keeps full fidelity.
  describe('secret redaction hook (#984)', () => {
    const SECRET_LINE = 'Authorization: Bearer sk-live-ABCDEFGHIJKLMNOP0123456789';

    it('registers a hook that redacts secrets on the way to the file transport', async () => {
      await import('@process/utils/configureConsoleLog');

      expect(mockLog.hooks.length).toBeGreaterThan(0);
      const hook = mockLog.hooks[mockLog.hooks.length - 1];
      const out = hook({ level: 'info', data: ['[wcore]', SECRET_LINE] }, {}, 'file');

      expect(out).not.toBe(false);
      const data = (out as LogMessage).data;
      expect(data[0]).toBe('[wcore]');
      expect(String(data[1])).not.toContain('sk-live-ABCDEFGHIJKLMNOP0123456789');
      expect(String(data[1])).toContain('[redacted]');
    });

    it('leaves the console transport untouched so live debugging keeps full fidelity', async () => {
      await import('@process/utils/configureConsoleLog');
      const hook = mockLog.hooks[mockLog.hooks.length - 1];

      const out = hook({ level: 'info', data: [SECRET_LINE] }, {}, 'console');

      expect((out as LogMessage).data[0]).toBe(SECRET_LINE);
    });

    it('passes non-string arguments through unchanged', async () => {
      await import('@process/utils/configureConsoleLog');
      const hook = mockLog.hooks[mockLog.hooks.length - 1];

      const err = new Error('boom');
      const obj = { a: 1 };
      const out = hook({ level: 'error', data: ['plain text', obj, err, 42] }, {}, 'file');

      const data = (out as LogMessage).data;
      expect(data[0]).toBe('plain text');
      expect(data[1]).toBe(obj);
      expect(data[2]).toBe(err);
      expect(data[3]).toBe(42);
    });
  });
});
