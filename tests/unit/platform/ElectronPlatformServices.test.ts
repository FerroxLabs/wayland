import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

const mockGetPath = vi.fn();
const mockGetAppPath = vi.fn().mockReturnValue('/app/path');
const mockFork = vi.fn(() => ({ on: vi.fn(), once: vi.fn(), postMessage: vi.fn() }));

vi.mock('electron', () => ({
  app: {
    getPath: (...args: unknown[]) => mockGetPath(...args),
    getAppPath: () => mockGetAppPath(),
    isPackaged: false,
    getName: () => 'Wayland',
    getVersion: () => '1.0.0',
  },
  Notification: vi.fn(),
  powerSaveBlocker: { start: vi.fn(), stop: vi.fn() },
  utilityProcess: { fork: (...args: unknown[]) => mockFork(...args) },
}));

describe('ElectronPlatformServices.paths.getLogsDir', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns app.getPath("logs") when it succeeds', async () => {
    mockGetPath.mockImplementation((name: string) => {
      if (name === 'logs') return '/Users/test/Library/Logs/Wayland';
      if (name === 'userData') return '/Users/test/Library/Application Support/Wayland';
      return `/mock/${name}`;
    });

    const { ElectronPlatformServices } = await import('../../../src/common/platform/ElectronPlatformServices');
    const svc = new ElectronPlatformServices();
    expect(svc.paths.getLogsDir()).toBe('/Users/test/Library/Logs/Wayland');
  });

  it('falls back to userData/logs when app.getPath("logs") throws', async () => {
    const userData = '/Users/test/Library/Application Support/Wayland';
    mockGetPath.mockImplementation((name: string) => {
      if (name === 'logs') throw new Error("Failed to get 'logs' path");
      if (name === 'userData') return userData;
      return `/mock/${name}`;
    });

    vi.resetModules();
    const { ElectronPlatformServices } = await import('../../../src/common/platform/ElectronPlatformServices');
    const svc = new ElectronPlatformServices();
    expect(svc.paths.getLogsDir()).toBe(path.join(userData, 'logs'));
  });
});

describe('ElectronPlatformServices.worker.fork env propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPath.mockImplementation((name: string) => `/mock/${name}`);
  });

  it('#706: propagates IS_PACKAGED so forked workers resolve the right JS runtime', async () => {
    // Utility processes fall back to NodePlatformServices, whose isPackaged()
    // reads process.env.IS_PACKAGED. Without this, a forked worker in a packaged
    // build reports isPackaged=false and resolveJsRuntime() picks the app binary
    // as Node — which crash-loops once the RunAsNode fuse is blown (#706).
    vi.resetModules();
    const { ElectronPlatformServices } = await import('../../../src/common/platform/ElectronPlatformServices');
    const svc = new ElectronPlatformServices();
    svc.worker.fork('/some/worker.js', [], {});

    expect(mockFork).toHaveBeenCalledTimes(1);
    const env = mockFork.mock.calls[0]![2].env as Record<string, string>;
    // app.isPackaged is mocked false here → String(false).
    expect(env.IS_PACKAGED).toBe('false');
    // The pre-existing DATA_DIR propagation must remain intact.
    expect(env.DATA_DIR).toBe('/mock/userData');
  });

  it('#706: caller-supplied env is still merged (and can override)', async () => {
    vi.resetModules();
    const { ElectronPlatformServices } = await import('../../../src/common/platform/ElectronPlatformServices');
    const svc = new ElectronPlatformServices();
    svc.worker.fork('/some/worker.js', [], { env: { EXTRA: 'x' } });

    const env = mockFork.mock.calls[0]![2].env as Record<string, string>;
    expect(env.IS_PACKAGED).toBe('false');
    expect(env.EXTRA).toBe('x');
  });
});
