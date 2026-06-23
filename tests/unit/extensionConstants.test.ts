import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isPackaged: vi.fn(() => false),
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: {
      getDataDir: () => '/appdata',
      isPackaged: () => mocks.isPackaged(),
      getAppPath: () => '/app-root',
    },
  }),
}));

vi.mock('@process/utils', () => ({
  getDataPath: () => '/home/user/.wayland-dev',
}));

// Must import after mocks
import {
  EXTENSION_MANIFEST_FILE,
  getAppDataExtensionsDir,
  getBundledExtensionsDir,
  getEnvExtensionsDirs,
  getExtensionScanSources,
  getHubResourcesDir,
  getInstallTargetDir,
  getUserExtensionsDir,
  HUB_REMOTE_URLS,
} from '../../src/process/extensions/constants';

describe('extension constants', () => {
  describe('static constants', () => {
    it('EXTENSION_MANIFEST_FILE should be aion-extension.json', () => {
      expect(EXTENSION_MANIFEST_FILE).toBe('aion-extension.json');
    });

    it('HUB_REMOTE_URLS should be a non-empty array of URLs', () => {
      expect(HUB_REMOTE_URLS.length).toBeGreaterThan(0);
      for (const url of HUB_REMOTE_URLS) {
        expect(url).toMatch(/^https:\/\//);
      }
    });
  });

  describe('HUB_REMOTE_URLS with WAYLAND_HUB_URL env var', () => {
    const originalEnv = process.env.WAYLAND_HUB_URL;

    afterEach(() => {
      if (originalEnv === undefined) delete process.env.WAYLAND_HUB_URL;
      else process.env.WAYLAND_HUB_URL = originalEnv;
      vi.resetModules();
    });

    it('should return only default URLs when env var is not set', async () => {
      delete process.env.WAYLAND_HUB_URL;
      vi.resetModules();
      const { HUB_REMOTE_URLS: urls } = await import('../../src/process/extensions/constants');
      expect(urls).toEqual([
        'https://raw.githubusercontent.com/FerroxLabs/waylandHub/dist-latest/',
        'https://cdn.jsdelivr.net/gh/FerroxLabs/waylandHub@dist-latest/',
      ]);
    });

    it('should prepend custom URLs from env var', async () => {
      process.env.WAYLAND_HUB_URL = 'http://localhost:3000/';
      vi.resetModules();
      const { HUB_REMOTE_URLS: urls } = await import('../../src/process/extensions/constants');
      expect(urls[0]).toBe('http://localhost:3000/');
      expect(urls.length).toBe(3);
    });

    it('should support comma-separated URLs', async () => {
      process.env.WAYLAND_HUB_URL = 'http://a.com/,http://b.com/';
      vi.resetModules();
      const { HUB_REMOTE_URLS: urls } = await import('../../src/process/extensions/constants');
      expect(urls[0]).toBe('http://a.com/');
      expect(urls[1]).toBe('http://b.com/');
      expect(urls.length).toBe(4);
    });

    it('should filter empty segments and trim whitespace', async () => {
      process.env.WAYLAND_HUB_URL = ' http://a.com/ , , http://b.com/ ';
      vi.resetModules();
      const { HUB_REMOTE_URLS: urls } = await import('../../src/process/extensions/constants');
      expect(urls[0]).toBe('http://a.com/');
      expect(urls[1]).toBe('http://b.com/');
      expect(urls.length).toBe(4);
    });
  });

  describe('getUserExtensionsDir', () => {
    it('should return data path + extensions', () => {
      expect(getUserExtensionsDir()).toBe(path.join('/home/user/.wayland-dev', 'extensions'));
    });
  });

  describe('getAppDataExtensionsDir', () => {
    it('should return appData path + extensions', () => {
      expect(getAppDataExtensionsDir()).toBe(path.join('/appdata', 'extensions'));
    });
  });

  describe('getEnvExtensionsDirs', () => {
    const originalEnv = process.env.WAYLAND_EXTENSIONS_PATH;

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.WAYLAND_EXTENSIONS_PATH;
      } else {
        process.env.WAYLAND_EXTENSIONS_PATH = originalEnv;
      }
    });

    it('should return empty array when env var is not set', () => {
      delete process.env.WAYLAND_EXTENSIONS_PATH;
      expect(getEnvExtensionsDirs()).toEqual([]);
    });

    it('should split env var by path separator', () => {
      const sep = process.platform === 'win32' ? ';' : ':';
      process.env.WAYLAND_EXTENSIONS_PATH = `/path/a${sep}/path/b`;
      expect(getEnvExtensionsDirs()).toEqual(['/path/a', '/path/b']);
    });

    it('should filter out empty segments', () => {
      const sep = process.platform === 'win32' ? ';' : ':';
      process.env.WAYLAND_EXTENSIONS_PATH = `/path/a${sep}${sep}/path/b`;
      const dirs = getEnvExtensionsDirs();
      expect(dirs).toEqual(['/path/a', '/path/b']);
    });
  });

  describe('getHubResourcesDir', () => {
    const originalResourcesPath = process.resourcesPath;

    afterEach(() => {
      mocks.isPackaged.mockReturnValue(false);
      Object.defineProperty(process, 'resourcesPath', {
        value: originalResourcesPath,
        configurable: true,
        writable: true,
      });
    });

    it('should return resources/hub in dev mode', () => {
      mocks.isPackaged.mockReturnValue(false);
      expect(getHubResourcesDir()).toBe(path.join(process.cwd(), 'resources', 'hub'));
    });

    it('should return process resources path in packaged mode', () => {
      mocks.isPackaged.mockReturnValue(true);
      Object.defineProperty(process, 'resourcesPath', {
        value: '/opt/Wayland/resources',
        configurable: true,
        writable: true,
      });

      expect(getHubResourcesDir()).toBe(path.join('/opt/Wayland/resources', 'hub'));
    });
  });

  describe('getBundledExtensionsDir', () => {
    afterEach(() => {
      mocks.isPackaged.mockReturnValue(false);
    });

    it('resolves under <appPath>/resources/bundled-extensions in dev', () => {
      mocks.isPackaged.mockReturnValue(false);
      expect(getBundledExtensionsDir()).toBe(path.join('/app-root', 'resources', 'bundled-extensions'));
    });

    it('resolves to the in-asar <appPath>/bundled-extensions when packaged', () => {
      mocks.isPackaged.mockReturnValue(true);
      expect(getBundledExtensionsDir()).toBe(path.join('/app-root', 'bundled-extensions'));
    });
  });

  describe('getExtensionScanSources', () => {
    const originalEnv = process.env.WAYLAND_EXTENSIONS_PATH;
    const originalE2E = process.env.WAYLAND_E2E_TEST;

    afterEach(() => {
      if (originalEnv === undefined) delete process.env.WAYLAND_EXTENSIONS_PATH;
      else process.env.WAYLAND_EXTENSIONS_PATH = originalEnv;
      if (originalE2E === undefined) delete process.env.WAYLAND_E2E_TEST;
      else process.env.WAYLAND_E2E_TEST = originalE2E;
    });

    it('includes the read-only bundled source, appended after writable sources', () => {
      delete process.env.WAYLAND_EXTENSIONS_PATH;
      delete process.env.WAYLAND_E2E_TEST;
      const sources = getExtensionScanSources();
      const bundled = sources.find((s) => s.source === 'bundled');
      expect(bundled).toBeDefined();
      expect(bundled!.dir).toBe(path.join('/app-root', 'resources', 'bundled-extensions'));
      // Must never be first (getInstallTargetDir would otherwise pick it).
      expect(sources[0].source).not.toBe('bundled');
    });

    it('omits the bundled source in E2E mode', () => {
      process.env.WAYLAND_EXTENSIONS_PATH = '/e2e/ext';
      process.env.WAYLAND_E2E_TEST = '1';
      const sources = getExtensionScanSources();
      expect(sources.some((s) => s.source === 'bundled')).toBe(false);
    });

    it('should return user and appdata dirs by default', () => {
      delete process.env.WAYLAND_EXTENSIONS_PATH;
      delete process.env.WAYLAND_E2E_TEST;
      const sources = getExtensionScanSources();
      expect(sources.length).toBeGreaterThanOrEqual(1);
      expect(sources.find((s) => s.source === 'local')).toBeDefined();
    });

    it('should include env dirs with highest priority when set', () => {
      process.env.WAYLAND_EXTENSIONS_PATH = '/custom/ext';
      delete process.env.WAYLAND_E2E_TEST;
      const sources = getExtensionScanSources();
      expect(sources[0].source).toBe('env');
      expect(sources[0].dir).toContain('custom');
    });

    it('should only include env dirs in E2E mode', () => {
      process.env.WAYLAND_EXTENSIONS_PATH = '/e2e/ext';
      process.env.WAYLAND_E2E_TEST = '1';
      const sources = getExtensionScanSources();
      expect(sources.every((s) => s.source === 'env')).toBe(true);
    });

    it('should deduplicate directories', () => {
      delete process.env.WAYLAND_EXTENSIONS_PATH;
      delete process.env.WAYLAND_E2E_TEST;
      const sources = getExtensionScanSources();
      const dirs = sources.map((s) => s.dir);
      expect(new Set(dirs).size).toBe(dirs.length);
    });
  });

  describe('getInstallTargetDir', () => {
    it('should return the first scan source directory', () => {
      delete process.env.WAYLAND_EXTENSIONS_PATH;
      delete process.env.WAYLAND_E2E_TEST;
      const dir = getInstallTargetDir();
      const sources = getExtensionScanSources();
      expect(dir).toBe(sources[0].dir);
    });

    it('should never return the read-only bundled (asar) dir', () => {
      delete process.env.WAYLAND_EXTENSIONS_PATH;
      delete process.env.WAYLAND_E2E_TEST;
      const dir = getInstallTargetDir();
      // Writable userData dir, NOT the bundled in-app dir.
      expect(dir).toBe(getUserExtensionsDir());
      expect(dir).not.toBe(getBundledExtensionsDir());
    });

    it('should return env dir when WAYLAND_EXTENSIONS_PATH is set', () => {
      process.env.WAYLAND_EXTENSIONS_PATH = '/my/ext';
      delete process.env.WAYLAND_E2E_TEST;
      const dir = getInstallTargetDir();
      expect(dir).toContain('my');
    });
  });
});
