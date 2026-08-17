import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as zlib from 'zlib';
import { CLEAN_CORPUS, SECRET_CORPUS } from '../fixtures/secretCorpus';

// Hoist mock state so it can be referenced inside vi.mock factories
const { fsMock } = vi.hoisted(() => ({
  fsMock: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

// Mock electron modules
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
  app: {
    getPath: vi.fn((name: string) => {
      if (name === 'logs') return '/mock/logs';
      return '/mock/userData';
    }),
  },
}));

vi.mock('fs', () => ({
  existsSync: fsMock.existsSync,
  readFileSync: fsMock.readFileSync,
}));

describe('feedbackBridge', () => {
  let handler: () => Promise<{ filename: string; data: number[] } | null>;

  beforeEach(async () => {
    vi.resetModules();
    fsMock.existsSync.mockReset();
    fsMock.readFileSync.mockReset();
    const { ipcMain } = await import('electron');
    // Clear the recorded registrations BEFORE re-importing. Without this,
    // `mock.calls.find` below keeps returning the handler closed over the FIRST
    // module instance, so its `enforceRateLimit` bucket (5 per 60s) is shared by
    // every test in the file and the sixth call silently returns null.
    vi.mocked(ipcMain.handle).mockClear();
    await import('@process/bridge/feedbackBridge');
    // Extract the registered handler
    const handleCall = vi.mocked(ipcMain.handle).mock.calls.find(([channel]) => channel === 'feedback:collect-logs');
    expect(handleCall).toBeDefined();
    handler = handleCall![1] as typeof handler;
  });

  it('should register feedback:collect-logs IPC handler', async () => {
    const { ipcMain } = await import('electron');
    expect(vi.mocked(ipcMain.handle)).toHaveBeenCalledWith('feedback:collect-logs', expect.any(Function));
  });

  it('should return null when no log files exist', async () => {
    fsMock.existsSync.mockReturnValue(false);
    const result = await handler();
    expect(result).toBeNull();
  });

  it('should return gzipped log data when files exist', async () => {
    const logContent = 'test log line\n';
    fsMock.existsSync.mockReturnValue(true);
    fsMock.readFileSync.mockReturnValue(logContent);

    const result = await handler();
    expect(result).not.toBeNull();
    expect(result!.filename).toBe('logs.gz');
    expect(result!.data.length).toBeGreaterThan(0);

    // Verify the data is valid gzip
    const buffer = Buffer.from(result!.data);
    const decompressed = zlib.gunzipSync(buffer).toString();
    expect(decompressed).toContain('test log line');
  });

  // #996: the bundle is attached to a Sentry event through `hint.attachments`,
  // which rides the HINT and never reaches the `beforeSend` scrubber. So the
  // guarantee has to hold at COLLECTION time - these assertions read the actual
  // gzip artifact the renderer would upload, not an intermediate string.
  describe('secret redaction at collection time (#996)', () => {
    function collectedBundle(logBody: string): Promise<string> {
      fsMock.existsSync.mockReturnValue(true);
      fsMock.readFileSync.mockReturnValue(logBody);
      return handler().then((result) => {
        expect(result).not.toBeNull();
        return zlib.gunzipSync(Buffer.from(result!.data)).toString();
      });
    }

    it.each(SECRET_CORPUS.map((entry) => [entry.label, entry] as const))(
      'does not carry %s into the collected bundle',
      async (_label, entry) => {
        const decompressed = await collectedBundle(`2026-08-17 10:00:00.000 > ${entry.text}\n`);
        expect(decompressed).not.toContain(entry.secret);
        expect(decompressed).toContain('[redacted]');
      }
    );

    it('preserves ordinary log lines so the bundle stays useful', async () => {
      const decompressed = await collectedBundle(CLEAN_CORPUS.join('\n'));
      for (const line of CLEAN_CORPUS) {
        expect(decompressed).toContain(line);
      }
    });

    it('redacts every day of the multi-day window, not just the first', async () => {
      const secret = 'sk-live-DAYTWOSECRET12345';
      fsMock.existsSync.mockReturnValue(true);
      let call = 0;
      fsMock.readFileSync.mockImplementation(() => {
        call += 1;
        return call === 1 ? 'clean day\n' : `agent failed with ${secret}\n`;
      });

      const result = await handler();
      expect(result).not.toBeNull();
      const decompressed = zlib.gunzipSync(Buffer.from(result!.data)).toString();
      expect(call).toBeGreaterThan(1);
      expect(decompressed).not.toContain(secret);
    });
  });
});
