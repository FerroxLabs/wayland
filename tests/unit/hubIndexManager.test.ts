import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    network: {
      fetch: (...args: unknown[]) => mockFetch(...args),
    },
  }),
}));

const mockExistsSync = vi.fn(() => false);
const mockReadFileSync = vi.fn(() => '{}');
vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
}));

vi.mock('../../src/process/extensions/constants', () => ({
  EXTENSION_MANIFEST_FILE: 'aion-extension.json',
  HUB_REMOTE_URLS: ['https://example.com/hub/'],
  HUB_INDEX_FILE: 'index.json',
  HUB_SUPPORTED_SCHEMA_VERSION: 1,
  getHubResourcesDir: vi.fn(() => '/resources/hub'),
}));

import { hubIndexManager } from '../../src/process/extensions/hub/HubIndexManager';
import type { IHubExtension } from '@/common/types/hub';

function makeExt(overrides: Partial<IHubExtension> & { name: string }): IHubExtension {
  return {
    displayName: overrides.name,
    description: 'test',
    author: 'test',
    dist: { tarball: `${overrides.name}.zip`, integrity: 'sha512-abc', unpackedSize: 100 },
    engines: { wayland: '>=1.0.0' },
    hubs: ['acpAdapters'],
    ...overrides,
  };
}

describe('HubIndexManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
    mockFetch.mockRejectedValue(new Error('no network'));
    // Reset singleton state so each test starts fresh
    (hubIndexManager as any)['mergedIndex'] = {};
    (hubIndexManager as any)['trustedNames'] = new Set<string>();
    (hubIndexManager as any)['localLoaded'] = false;
    (hubIndexManager as any)['remoteLoaded'] = false;
  });

  describe('loadIndexes', () => {
    it('should load local index when available', async () => {
      const localIndex = {
        schemaVersion: 1,
        generatedAt: '2025-01-01',
        extensions: {
          'ext-a': makeExt({ name: 'ext-a' }),
        },
      };

      mockExistsSync.mockImplementation((p: string) => p.includes('index.json'));
      mockReadFileSync.mockReturnValue(JSON.stringify(localIndex));

      await hubIndexManager.loadIndexes();
      expect(hubIndexManager.getExtension('ext-a')).toBeDefined();
    });

    it('should merge remote index with remote overriding local on conflict', async () => {
      const localExt = makeExt({ name: 'shared', description: 'local version' });
      const remoteExt = makeExt({ name: 'shared', description: 'remote version' });
      const remoteOnly = makeExt({ name: 'remote-only' });

      const localIndex = { schemaVersion: 1, generatedAt: '', extensions: { shared: localExt } };
      const remoteIndex = {
        schemaVersion: 1,
        generatedAt: '',
        extensions: { shared: remoteExt, 'remote-only': remoteOnly },
      };

      mockExistsSync.mockImplementation((p: string) => p.includes('index.json'));
      mockReadFileSync.mockReturnValue(JSON.stringify(localIndex));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => remoteIndex,
      });

      await hubIndexManager.loadIndexes();

      // Remote wins on conflict
      expect(hubIndexManager.getExtension('shared')?.description).toBe('remote version');
      // Remote supplement is added
      expect(hubIndexManager.getExtension('remote-only')).toBeDefined();
    });

    it('should fall back to local only when remote fails', async () => {
      const localIndex = {
        schemaVersion: 1,
        generatedAt: '',
        extensions: { 'local-ext': makeExt({ name: 'local-ext' }) },
      };

      mockExistsSync.mockImplementation((p: string) => p.includes('index.json'));
      mockReadFileSync.mockReturnValue(JSON.stringify(localIndex));
      mockFetch.mockRejectedValue(new Error('timeout'));

      await hubIndexManager.loadIndexes();
      expect(hubIndexManager.getExtension('local-ext')).toBeDefined();
    });

    it('should resolve bundled flag based on zip existence', async () => {
      const ext = makeExt({
        name: 'bundled-ext',
        dist: { tarball: 'bundled-ext.zip', integrity: '', unpackedSize: 0 },
      });
      const localIndex = { schemaVersion: 1, generatedAt: '', extensions: { 'bundled-ext': ext } };

      mockExistsSync.mockImplementation((p: string) => {
        if (p.includes('index.json')) return true;
        if (p.includes('bundled-ext.zip')) return true;
        return false;
      });
      mockReadFileSync.mockReturnValue(JSON.stringify(localIndex));

      await hubIndexManager.loadIndexes();
      expect(hubIndexManager.getExtension('bundled-ext')?.bundled).toBe(true);
    });
  });

  // RT-B4-03 (HIGH): the integrity hash used to verify a downloaded archive
  // (dist.integrity, consumed by HubInstaller.verifyIntegrity) must NOT be
  // sourced from the untrusted remote index for an extension that also exists
  // in the TRUSTED bundled/local index (which ships inside the code-signed app
  // bundle). A compromised/MITM'd mirror could otherwise serve a matching
  // {integrity, archive} pair, pass verification, and run onInstall with full
  // Node privileges. The local dist block is pinned on name conflict.
  describe('integrity source pinning (RT-B4-03)', () => {
    const TRUSTED_INTEGRITY = 'sha512-TRUSTEDLOCALHASHFROMCODESIGNEDBUNDLE==';
    const ATTACKER_INTEGRITY = 'sha512-ATTACKERSUBSTITUTEDHASHFROMEVILMIRROR==';

    it('uses the trusted local integrity when remote substitutes a different hash for a known extension', async () => {
      const localExt = makeExt({
        name: 'ext-claude-code',
        dist: { tarball: 'extensions/ext-claude-code.zip', integrity: TRUSTED_INTEGRITY, unpackedSize: 100 },
      });
      // Compromised mirror serves the same name with a matching {integrity,
      // archive} pair for its malicious payload.
      const remoteExt = makeExt({
        name: 'ext-claude-code',
        dist: { tarball: 'extensions/evil.zip', integrity: ATTACKER_INTEGRITY, unpackedSize: 100 },
      });

      const localIndex = { schemaVersion: 1, generatedAt: '', extensions: { 'ext-claude-code': localExt } };
      const remoteIndex = { schemaVersion: 1, generatedAt: '', extensions: { 'ext-claude-code': remoteExt } };

      mockExistsSync.mockImplementation((p: string) => p.includes('index.json'));
      mockReadFileSync.mockReturnValue(JSON.stringify(localIndex));
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => remoteIndex });

      await hubIndexManager.loadIndexes();

      const ext = hubIndexManager.getExtension('ext-claude-code');
      // The integrity-bearing dist block stays pinned to the trusted local value.
      expect(ext?.dist.integrity).toBe(TRUSTED_INTEGRITY);
      expect(ext?.dist.tarball).toBe('extensions/ext-claude-code.zip');
      expect(ext?.dist.integrity).not.toBe(ATTACKER_INTEGRITY);
    });

    it('lets remote refresh display metadata while still pinning the trusted dist', async () => {
      const localExt = makeExt({
        name: 'ext-claude-code',
        dist: { tarball: 'extensions/ext-claude-code.zip', integrity: TRUSTED_INTEGRITY, unpackedSize: 100 },
      });
      const remoteExt = makeExt({
        name: 'ext-claude-code',
        description: 'updated remote description',
        version: '9.9.9',
        dist: { tarball: 'extensions/evil.zip', integrity: ATTACKER_INTEGRITY, unpackedSize: 100 },
      });

      const localIndex = { schemaVersion: 1, generatedAt: '', extensions: { 'ext-claude-code': localExt } };
      const remoteIndex = { schemaVersion: 1, generatedAt: '', extensions: { 'ext-claude-code': remoteExt } };

      mockExistsSync.mockImplementation((p: string) => p.includes('index.json'));
      mockReadFileSync.mockReturnValue(JSON.stringify(localIndex));
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => remoteIndex });

      await hubIndexManager.loadIndexes();

      const ext = hubIndexManager.getExtension('ext-claude-code');
      // Non-security metadata may be refreshed from remote...
      expect(ext?.description).toBe('updated remote description');
      expect(ext?.version).toBe('9.9.9');
      // ...but the integrity source remains pinned to the trusted local value.
      expect(ext?.dist.integrity).toBe(TRUSTED_INTEGRITY);
      expect(ext?.dist.tarball).toBe('extensions/ext-claude-code.zip');
    });

    it('leaves legitimate remote-only extensions unchanged (no trusted entry to pin)', async () => {
      const remoteOnly = makeExt({
        name: 'community-ext',
        dist: { tarball: 'extensions/community-ext.zip', integrity: ATTACKER_INTEGRITY, unpackedSize: 100 },
      });
      const remoteIndex = { schemaVersion: 1, generatedAt: '', extensions: { 'community-ext': remoteOnly } };

      // No local index.json on disk -> no trusted names.
      mockExistsSync.mockReturnValue(false);
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => remoteIndex });

      await hubIndexManager.loadIndexes();

      const ext = hubIndexManager.getExtension('community-ext');
      // Remote-only: its remote dist is used as-is. The override attack only
      // applies to KNOWN names; verifyIntegrity still hard-fails a missing or
      // malformed hash at install time for remote downloads.
      expect(ext?.dist.integrity).toBe(ATTACKER_INTEGRITY);
    });
  });
});
