import { EventEmitter } from 'node:events';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();

// The 10-byte payload every remote-download fixture serves (new ArrayBuffer(10)),
// and the matching SHA-512 SRI. After the security hardening, a remote (non-bundled)
// archive with a missing/empty integrity hash is a HARD FAILURE - so remote fixtures
// must declare the real hash of their served bytes, and verifyIntegrity (which streams
// the on-disk archive) must see those bytes. fs.writeFileSync is mocked to a no-op, so
// createReadStream is stubbed to emit REMOTE_PAYLOAD for any read.
const REMOTE_PAYLOAD = Buffer.from(new ArrayBuffer(10));
const REMOTE_INTEGRITY =
  'sha512-Gb08u2Kxk3lXoRyr0NOYYFgraSjnfQ4Ope5/Oy+MrLPeqOoJcmUa3DJF/RCSby8x6AN3GW5ObH7ivXQFHli8ug==';

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    network: {
      fetch: (...args: unknown[]) => mockFetch(...args),
    },
  }),
}));

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn(() => false),
    mkdirSync: vi.fn(),
    rmSync: vi.fn(),
    renameSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(() => '{}'),
    // verifyIntegrity streams the downloaded archive off disk. writeFileSync is a
    // no-op here, so emit the known 10-byte payload directly instead.
    createReadStream: vi.fn(() => {
      const stream = new EventEmitter();
      queueMicrotask(() => {
        stream.emit('data', REMOTE_PAYLOAD);
        stream.emit('end');
      });
      return stream;
    }),
  };
});

// HubInstaller builds `execAsync = promisify(exec)` at module load and awaits it
// during extraction. The exec mock MUST invoke its callback or the promisified
// wrapper never resolves and every install-success test hangs to timeout. Invoke
// the callback synchronously with an empty success result.
vi.mock('child_process', () => ({
  exec: (_cmd: string, cb?: (err: unknown, res: { stdout: string; stderr: string }) => void) => {
    cb?.(null, { stdout: '', stderr: '' });
    return { on: () => undefined };
  },
}));

vi.mock('@process/utils', () => ({ getDataPath: () => '/data' }));

// Install is now gated behind a native main-process confirmation dialog
// (requireConfirmation → BrowserWindow/dialog) that a compromised renderer or
// remote token cannot spoof. Electron is unavailable under vitest, so mock the
// gate directly: default to "user clicked Install" (true); individual tests
// override mockRequireConfirmation to assert the decline path.
const mockRequireConfirmation = vi.fn(async () => true);
vi.mock('@process/bridge/webuiDirectAuth', () => ({
  requireConfirmation: (...args: unknown[]) => mockRequireConfirmation(...args),
}));

vi.mock('@process/extensions/constants', () => ({
  EXTENSION_MANIFEST_FILE: 'aion-extension.json',
  HUB_REMOTE_URLS: ['https://mirror1.com', 'https://mirror2.com'],
  getHubResourcesDir: vi.fn(() => '/resources/hub'),
  getInstallTargetDir: vi.fn(() => '/ext-install-dir'),
}));

vi.mock('../../src/process/extensions/ExtensionRegistry', () => ({
  ExtensionRegistry: { hotReload: vi.fn(async () => {}) },
}));

const mocks = vi.hoisted(() => ({
  getExtensionResult: undefined as unknown,
  setTransientCalls: [] as unknown[][],
  detectedAgents: [] as Array<{
    backend: string;
    name: string;
    kind?: string;
    isExtension?: boolean;
    customAgentId?: string;
  }>,
}));

vi.mock('../../src/process/extensions/hub/HubIndexManager', () => ({
  hubIndexManager: { getExtension: () => mocks.getExtensionResult },
}));

const mockMarkForReinstall = vi.fn();
vi.mock('@process/extensions/lifecycle/statePersistence', () => ({
  markExtensionForReinstall: (...args: unknown[]) => mockMarkForReinstall(...args),
}));

vi.mock('../../src/process/extensions/hub/HubStateManager', () => ({
  hubStateManager: {
    setTransientState: (...args: unknown[]) => {
      mocks.setTransientCalls.push(args);
    },
  },
}));

vi.mock('@process/agent/AgentRegistry', () => ({
  agentRegistry: {
    refreshExtensionAgents: vi.fn(async () => {}),
    refreshAll: vi.fn(async () => {}),
    getDetectedAgents: () => mocks.detectedAgents,
  },
}));

import * as fs from 'fs';
import { hubInstaller } from '../../src/process/extensions/hub/HubInstaller';

const mockedExistsSync = vi.mocked(fs.existsSync);

function makeExtInfo(name: string, bundled = false, integrity = '') {
  // Bundled archives (resolved from the code-signed app bundle) tolerate an empty
  // integrity hash; remote downloads HARD-FAIL on a missing hash post-hardening, so
  // remote fixtures must pass REMOTE_INTEGRITY (the SHA-512 of the served payload).
  return {
    name,
    displayName: name,
    description: 'test',
    author: 'test',
    dist: { tarball: `extensions/${name}.zip`, integrity, unpackedSize: 100 },
    engines: { wayland: '>=1.0.0' },
    hubs: ['acpAdapters'],
    bundled,
  };
}

describe('HubInstaller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireConfirmation.mockResolvedValue(true);
    mockedExistsSync.mockReturnValue(false);
    mockFetch.mockRejectedValue(new Error('no network'));
    mocks.getExtensionResult = undefined;
    mocks.setTransientCalls = [];
    mocks.detectedAgents = [];
  });

  describe('install', () => {
    it('should throw when extension is not in hub index', async () => {
      mocks.getExtensionResult = undefined;

      await expect(hubInstaller.install('nonexistent')).rejects.toThrow('not found in Hub Index');
      expect(mocks.setTransientCalls[0]).toEqual(['nonexistent', 'installing']);
      expect(mocks.setTransientCalls[1]?.[1]).toBe('install_failed');
    });

    it('should use bundled zip when available', async () => {
      mocks.getExtensionResult = makeExtInfo('bundled-ext', true);
      mockedExistsSync.mockImplementation((p) => {
        const s = String(p);
        if (s.includes('bundled-ext.zip') && s.includes('resources')) return true;
        if (s.includes('aion-extension.json')) return true;
        return false;
      });

      await hubInstaller.install('bundled-ext');

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mocks.setTransientCalls.at(-1)).toEqual(['bundled-ext', 'installed']);
    });

    it('should download from remote when not bundled', async () => {
      mocks.getExtensionResult = makeExtInfo('remote-ext', false, REMOTE_INTEGRITY);
      mockedExistsSync.mockImplementation((p) => String(p).includes('aion-extension.json'));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(10),
      });

      await hubInstaller.install('remote-ext');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mocks.setTransientCalls.at(-1)).toEqual(['remote-ext', 'installed']);
    });

    it('should fall back to second mirror when first fails', async () => {
      mocks.getExtensionResult = makeExtInfo('mirror-ext', false, REMOTE_INTEGRITY);
      mockedExistsSync.mockImplementation((p) => String(p).includes('aion-extension.json'));

      mockFetch.mockRejectedValueOnce(new Error('mirror1 down')).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(10),
      });

      await hubInstaller.install('mirror-ext');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mocks.setTransientCalls.at(-1)).toEqual(['mirror-ext', 'installed']);
    });

    it('should fail when all mirrors are down', async () => {
      mocks.getExtensionResult = makeExtInfo('fail-ext', false);

      await expect(hubInstaller.install('fail-ext')).rejects.toThrow('Failed to download');
      expect(mocks.setTransientCalls.at(-1)?.[1]).toBe('install_failed');
    });

    it('should fail when manifest is missing after extraction', async () => {
      mocks.getExtensionResult = makeExtInfo('bad-pkg', false, REMOTE_INTEGRITY);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(10),
      });
      mockedExistsSync.mockReturnValue(false);

      await expect(hubInstaller.install('bad-pkg')).rejects.toThrow('aion-extension.json missing');
    });

    // SECURITY: install is a code-execution event gated behind a native main-process
    // confirmation dialog the renderer/remote caller cannot spoof. Declining must
    // abort BEFORE any download / extraction / hotReload runs.
    it('should reject install when local-user confirmation is declined', async () => {
      mocks.getExtensionResult = makeExtInfo('declined-ext', true);
      mockRequireConfirmation.mockResolvedValueOnce(false);
      mockedExistsSync.mockImplementation((p) => {
        const s = String(p);
        if (s.includes('declined-ext.zip') && s.includes('resources')) return true;
        if (s.includes('aion-extension.json')) return true;
        return false;
      });

      await expect(hubInstaller.install('declined-ext')).rejects.toThrow('cancelled by user');
      expect(mockRequireConfirmation).toHaveBeenCalledTimes(1);
      // No extraction / fetch / reinstall side effects ran past the gate.
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockMarkForReinstall).not.toHaveBeenCalled();
      expect(mocks.setTransientCalls.at(-1)?.[1]).toBe('install_failed');
    });

    // SECURITY: a remote-downloaded archive with no declared integrity hash is a
    // HARD FAILURE - a tampered mirror must not be able to ship an unverified
    // payload by simply omitting the hash. (Bundled archives are covered by code
    // signing and tolerate a missing hash; this asserts the remote path only.)
    it('should reject a remote download with missing integrity hash', async () => {
      mocks.getExtensionResult = makeExtInfo('unverified-ext', false, '');
      mockedExistsSync.mockImplementation((p) => String(p).includes('aion-extension.json'));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(10),
      });

      await expect(hubInstaller.install('unverified-ext')).rejects.toThrow('refusing to install an unverified payload');
      expect(mocks.setTransientCalls.at(-1)?.[1]).toBe('install_failed');
    });
  });

  describe('retryInstall', () => {
    it('should call full install when target dir does not exist', async () => {
      mocks.getExtensionResult = makeExtInfo('retry-ext', true);
      mockedExistsSync.mockImplementation((p) => {
        const s = String(p);
        if (s.includes('retry-ext.zip') && s.includes('resources')) return true;
        if (s.includes('aion-extension.json')) return true;
        return false;
      });

      await hubInstaller.retryInstall('retry-ext');
      expect(mocks.setTransientCalls.at(-1)).toEqual(['retry-ext', 'installed']);
    });

    it('should fail when manifest is missing in existing directory', async () => {
      mockedExistsSync.mockImplementation((p) => {
        return String(p) === path.join('/ext-install-dir', 'broken-ext');
      });

      await expect(hubInstaller.retryInstall('broken-ext')).rejects.toThrow('manifest missing');
    });

    // SECURITY (RT-B4-06): when the target dir already exists, retryInstall must NOT
    // re-run the on-disk onInstall lifecycle without re-verifying the source. It now
    // delegates to the verified install() path, which re-resolves the trusted archive,
    // checks it against dist.integrity, and re-extracts over the existing dir before any
    // lifecycle hook runs. An on-disk extension whose source archive no longer matches
    // dist.integrity (tampered files / poisoned mirror) is REJECTED before onInstall runs.
    it('should reject retry when source integrity no longer matches (tampered)', async () => {
      // Existing on-disk dir + manifest present. retry → install() re-resolves the
      // source archive and verifies it against the declared dist.integrity. Here the
      // resolved archive's actual hash does NOT match the declared integrity (a wrong/
      // poisoned hash), simulating tampered code - verification must fail before any
      // lifecycle hook runs. (Bundled archive with a PRESENT integrity is still verified.)
      const WRONG_INTEGRITY = 'sha512-' + Buffer.from('x'.repeat(64)).toString('base64');
      mocks.getExtensionResult = makeExtInfo('tampered-ext', true, WRONG_INTEGRITY);
      mockedExistsSync.mockImplementation((p) => {
        const s = String(p);
        if (s === path.join('/ext-install-dir', 'tampered-ext')) return true; // dir exists
        if (s.includes('tampered-ext.zip') && s.includes('resources')) return true; // source present
        if (s.includes('aion-extension.json')) return true; // on-disk manifest present
        return false;
      });

      await expect(hubInstaller.retryInstall('tampered-ext')).rejects.toThrow('Integrity verification failed');
      // onInstall / lifecycle re-run was NOT reached.
      expect(mockMarkForReinstall).not.toHaveBeenCalled();
      expect(mocks.setTransientCalls.at(-1)?.[1]).toBe('install_failed');
    });

    // An untampered extension whose existing dir is present still retries normally:
    // the verified install() path re-resolves + verifies the source, re-extracts, and
    // re-runs the lifecycle to completion.
    it('should retry normally for an untampered existing extension', async () => {
      mocks.getExtensionResult = makeExtInfo('clean-retry-ext', true);
      mockedExistsSync.mockImplementation((p) => {
        const s = String(p);
        if (s === path.join('/ext-install-dir', 'clean-retry-ext')) return true; // dir exists
        // Bundled source archive present in resources → trusted path, no integrity needed.
        if (s.includes('clean-retry-ext.zip') && s.includes('resources')) return true;
        if (s.includes('aion-extension.json')) return true;
        return false;
      });

      await hubInstaller.retryInstall('clean-retry-ext');

      expect(mockMarkForReinstall).toHaveBeenCalledWith('clean-retry-ext');
      expect(mocks.setTransientCalls.at(-1)).toEqual(['clean-retry-ext', 'installed']);
    });
  });

  describe('markExtensionForReinstall', () => {
    it('should call markExtensionForReinstall before hotReload during install', async () => {
      mocks.getExtensionResult = makeExtInfo('reinstall-ext', true);
      mockedExistsSync.mockImplementation((p) => {
        const s = String(p);
        if (s.includes('reinstall-ext.zip') && s.includes('resources')) return true;
        if (s.includes('aion-extension.json')) return true;
        return false;
      });

      await hubInstaller.install('reinstall-ext');

      expect(mockMarkForReinstall).toHaveBeenCalledWith('reinstall-ext');
      expect(mocks.setTransientCalls.at(-1)).toEqual(['reinstall-ext', 'installed']);
    });

    it('should call markExtensionForReinstall before hotReload during retryInstall', async () => {
      mocks.getExtensionResult = makeExtInfo('retry-mark-ext', true);
      mockedExistsSync.mockImplementation((p) => {
        const s = String(p);
        if (s === path.join('/ext-install-dir', 'retry-mark-ext')) return true;
        // retry now delegates to the verified install() path, which re-resolves the
        // trusted (bundled) source archive before re-running the lifecycle.
        if (s.includes('retry-mark-ext.zip') && s.includes('resources')) return true;
        if (s.includes('aion-extension.json')) return true;
        return false;
      });

      await hubInstaller.retryInstall('retry-mark-ext');

      expect(mockMarkForReinstall).toHaveBeenCalledWith('retry-mark-ext');
    });
  });

  describe('post-install verification', () => {
    it('should fail when contributed acpAdapters are not detected after install', async () => {
      mocks.getExtensionResult = {
        ...makeExtInfo('acp-ext', true),
        contributes: { acpAdapters: ['myagent'] },
      };
      mocks.detectedAgents = []; // CLI not detected
      mockedExistsSync.mockImplementation((p) => {
        const s = String(p);
        if (s.includes('acp-ext.zip') && s.includes('resources')) return true;
        if (s.includes('aion-extension.json')) return true;
        return false;
      });

      await expect(hubInstaller.install('acp-ext')).rejects.toThrow('ACP adapters not detected');
      expect(mocks.setTransientCalls.at(-1)?.[1]).toBe('install_failed');
    });

    it('should succeed when contributed acpAdapters are detected after install', async () => {
      mocks.getExtensionResult = {
        ...makeExtInfo('acp-ok-ext', true),
        contributes: { acpAdapters: ['claude'] },
      };
      mocks.detectedAgents = [{ backend: 'claude', name: 'Claude Code' }];
      mockedExistsSync.mockImplementation((p) => {
        const s = String(p);
        if (s.includes('acp-ok-ext.zip') && s.includes('resources')) return true;
        if (s.includes('aion-extension.json')) return true;
        return false;
      });

      await hubInstaller.install('acp-ok-ext');
      expect(mocks.setTransientCalls.at(-1)).toEqual(['acp-ok-ext', 'installed']);
    });

    it('should pass verification when extension has no contributes', async () => {
      mocks.getExtensionResult = makeExtInfo('no-contrib-ext', true);
      mocks.detectedAgents = [];
      mockedExistsSync.mockImplementation((p) => {
        const s = String(p);
        if (s.includes('no-contrib-ext.zip') && s.includes('resources')) return true;
        if (s.includes('aion-extension.json')) return true;
        return false;
      });

      await hubInstaller.install('no-contrib-ext');
      expect(mocks.setTransientCalls.at(-1)).toEqual(['no-contrib-ext', 'installed']);
    });

    it('should fail when only some contributed acpAdapters are detected', async () => {
      mocks.getExtensionResult = {
        ...makeExtInfo('partial-ext', true),
        contributes: { acpAdapters: ['claude', 'missing-agent'] },
      };
      mocks.detectedAgents = [{ backend: 'claude', name: 'Claude Code' }];
      mockedExistsSync.mockImplementation((p) => {
        const s = String(p);
        if (s.includes('partial-ext.zip') && s.includes('resources')) return true;
        if (s.includes('aion-extension.json')) return true;
        return false;
      });

      await expect(hubInstaller.install('partial-ext')).rejects.toThrow('ACP adapters not detected');
    });
    it('should succeed when custom adapter ID is detected via extension agent customAgentId', async () => {
      mocks.getExtensionResult = {
        ...makeExtInfo('custom-acp-ext', true),
        contributes: { acpAdapters: ['my-custom-agent'] },
      };
      // Extension agent with backend 'custom' but adapter ID in customAgentId
      mocks.detectedAgents = [
        {
          backend: 'custom',
          name: 'My Custom',
          kind: 'acp',
          isExtension: true,
          customAgentId: 'ext:custom-acp-ext:my-custom-agent',
        },
      ];
      mockedExistsSync.mockImplementation((p) => {
        const s = String(p);
        if (s.includes('custom-acp-ext.zip') && s.includes('resources')) return true;
        if (s.includes('aion-extension.json')) return true;
        return false;
      });

      await hubInstaller.install('custom-acp-ext');
      expect(mocks.setTransientCalls.at(-1)).toEqual(['custom-acp-ext', 'installed']);
    });
  });
});
