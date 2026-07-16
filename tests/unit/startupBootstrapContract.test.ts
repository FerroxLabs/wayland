import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const root = process.cwd();

describe('Electron startup bootstrap contract', () => {
  it('registers privileged schemes before waiting for app readiness', () => {
    const source = fs.readFileSync(path.join(root, 'src/bootstrap.ts'), 'utf8');
    const registerAt = source.indexOf('protocol.registerSchemesAsPrivileged');
    const readyAt = source.lastIndexOf('.whenReady()');

    expect(registerAt).toBeGreaterThan(-1);
    expect(readyAt).toBeGreaterThan(registerAt);
  });

  it('loads Chromium flags and application identity before waiting for app readiness', () => {
    const source = fs.readFileSync(path.join(root, 'src/bootstrap.ts'), 'utf8');
    const configureAt = source.indexOf("import './process/utils/configureChromium'");
    const readyAt = source.lastIndexOf('.whenReady()');

    expect(configureAt).toBeGreaterThan(-1);
    expect(readyAt).toBeGreaterThan(configureAt);
  });

  it('keeps every external recovery command from opening CDP or loading persisted live config', () => {
    const source = fs.readFileSync(path.join(root, 'src/process/utils/configureChromium.ts'), 'utf8');

    expect(source).toContain("process.argv.includes('--create-recovery-snapshot')");
    expect(source).toContain("process.argv.includes('--download-classic-recovery-release')");
    expect(source).toContain("process.argv.includes('--prepare-classic-recovery-binary')");
    expect(source).toContain("process.argv.includes('--verify-recovery-snapshot')");
    expect(source).toContain("process.argv.includes('--materialize-recovery-snapshot')");
    expect(source).toContain("process.argv.includes('--launch-classic-recovery-snapshot')");
    expect(source).toContain("process.argv.includes('--launch-classic-recovery')");
    expect(source).toContain("process.argv.includes('--classic-binary')");
    expect(source).toContain("process.argv.includes('--classic-binary-sha256')");
    expect(source).toContain("process.argv.includes('--use-pinned-classic-release')");
    expect(source).toContain("process.argv.includes('--recovery-destination')");
    expect(source).toContain('if (isRecoveryCommand) return false');
    expect(source).toContain('isRecoveryCommand ? {} : loadCdpConfig()');
  });

  it('loads stateful Classic recovery implementation only inside the selected command branch', () => {
    const source = fs.readFileSync(path.join(root, 'src/bootstrap.ts'), 'utf8');

    expect(source).not.toContain("from './process/services/recovery/externalRecoveryLauncher'");
    expect(source).toContain("await import('./process/services/recovery/externalRecoveryLauncher')");
  });

  it('does not defer privileged scheme registration into the stateful main module', () => {
    const source = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8');
    expect(source).not.toContain('protocol.registerSchemesAsPrivileged');
  });
});

const originalE2ETest = process.env.WAYLAND_E2E_TEST;
const originalE2EUserDataDir = process.env.WAYLAND_E2E_USER_DATA_DIR;

type MockApp = {
  isPackaged: boolean;
  getPath: ReturnType<typeof vi.fn>;
  setName: ReturnType<typeof vi.fn>;
  setPath: ReturnType<typeof vi.fn>;
};

async function loadApplicationIdentity(env: { test?: string; userDataDir?: string }): Promise<MockApp> {
  vi.resetModules();

  if (env.test === undefined) delete process.env.WAYLAND_E2E_TEST;
  else process.env.WAYLAND_E2E_TEST = env.test;
  if (env.userDataDir === undefined) delete process.env.WAYLAND_E2E_USER_DATA_DIR;
  else process.env.WAYLAND_E2E_USER_DATA_DIR = env.userDataDir;

  const mockApp: MockApp = {
    isPackaged: true,
    getPath: vi.fn().mockReturnValue(path.resolve('default-user-data')),
    setName: vi.fn(),
    setPath: vi.fn(),
  };
  vi.doMock('electron', () => ({ app: mockApp }));

  await import('../../src/process/utils/configureAppIdentity');
  return mockApp;
}

afterEach(() => {
  if (originalE2ETest === undefined) delete process.env.WAYLAND_E2E_TEST;
  else process.env.WAYLAND_E2E_TEST = originalE2ETest;
  if (originalE2EUserDataDir === undefined) delete process.env.WAYLAND_E2E_USER_DATA_DIR;
  else process.env.WAYLAND_E2E_USER_DATA_DIR = originalE2EUserDataDir;
  vi.resetModules();
  vi.clearAllMocks();
});

describe('E2E application identity isolation', () => {
  it('uses an explicit absolute temporary profile only in E2E mode', async () => {
    const userDataDir = path.resolve('temporary-e2e-profile');
    const app = await loadApplicationIdentity({ test: '1', userDataDir: `  ${userDataDir}  ` });

    expect(app.setPath).toHaveBeenCalledWith('userData', userDataDir);
  });

  it('ignores an explicit profile when the E2E guard is absent', async () => {
    const app = await loadApplicationIdentity({ userDataDir: path.resolve('unguarded-profile') });

    expect(app.setPath).not.toHaveBeenCalled();
  });

  it('rejects relative profile paths even in E2E mode', async () => {
    const app = await loadApplicationIdentity({ test: '1', userDataDir: 'relative/profile' });

    expect(app.setPath).not.toHaveBeenCalled();
  });
});
