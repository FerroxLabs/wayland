/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for the `memory.ingest-files` IPC handler registered by importBridge.
 * Tests the handler logic: file writing with frontmatter, path traversal rejection.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// ── Mocks ────────────────────────────────────────────────────────────────────

let tmpHome: string;

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => tmpHome };
});

vi.mock('electron', () => ({
  app: { getPath: (_key: string) => `/tmp/wayland-test-ingest` },
}));

vi.mock('electron-log', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Capture the provider handlers registered by initImportBridge.
type Handler = (args: unknown) => Promise<unknown>;
const providers = new Map<string, Handler>();

vi.mock('@/common', () => ({
  ipcBridge: {
    memory: {
      import: {
        claudeMem: { provider: (h: Handler) => providers.set('claudeMem', h) },
        obsidianDetectVaults: { provider: (h: Handler) => providers.set('obsidianDetectVaults', h) },
        obsidianVault: { provider: (h: Handler) => providers.set('obsidianVault', h) },
        scanDevDir: { provider: (h: Handler) => providers.set('scanDevDir', h) },
        processDropFolder: { provider: (h: Handler) => providers.set('processDropFolder', h) },
        getDropFolderStatus: { provider: (h: Handler) => providers.set('getDropFolderStatus', h) },
      },
      ingestFiles: { provider: (h: Handler) => providers.set('ingestFiles', h) },
    },
  },
}));

// Stub out the importers / watcher so they don't do real work.
vi.mock('@process/services/import/claudeMemImporter', () => ({
  runClaudeMemImport: vi.fn().mockResolvedValue({ imported: 0, skipped: 0, errors: [] }),
}));
vi.mock('@process/services/import/obsidianImporter', () => ({
  detectVaults: vi.fn().mockResolvedValue([]),
  runObsidianImport: vi.fn().mockResolvedValue({ imported: 0, skipped: 0, errors: [] }),
}));
vi.mock('@process/services/import/devScanImporter', () => ({
  scanForMemoryDirs: vi.fn().mockResolvedValue([]),
  runDevScanImport: vi.fn().mockResolvedValue({ imported: 0, skipped: 0, projectsFound: 0, errors: [] }),
}));
vi.mock('@process/services/import/dropFolderWatcher', () => ({
  runDropFolderProcess: vi.fn().mockResolvedValue({ count: 0, errors: [] }),
  startDropFolderWatcher: vi.fn().mockReturnValue({ stop: vi.fn() }),
  getDropFolderStatus: vi.fn().mockReturnValue({ path: '/tmp/drop', watching: false, ingestedToday: 0 }),
}));
vi.mock('@process/services/memory/ijfwArchiveService', () => ({
  getIjfwArchiveService: vi.fn().mockReturnValue({
    indexStats: vi.fn().mockReturnValue({ projects: 0 }),
  }),
}));

// eslint-disable-next-line import/first
import { initImportBridge } from '@process/bridge/importBridge';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeTmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-ingestfiles-test-'));
}

const tmpDirs: string[] = [];

// ── Tests ────────────────────────────────────────────────────────────────────

describe('importBridge - memory.ingest-files', () => {
  beforeEach(() => {
    providers.clear();
    tmpHome = makeTmp();
    tmpDirs.push(tmpHome);
    initImportBridge();
  });

  afterEach(() => {
    for (const dir of tmpDirs) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
    tmpDirs.length = 0;
  });

  it('writes two files to the memory dir with frontmatter', async () => {
    const handler = providers.get('ingestFiles');
    expect(handler, 'ingestFiles provider must be registered').toBeDefined();

    const result = (await handler!({
      files: [
        { name: 'note.md', content: 'Hello world' },
        { name: 'thoughts.txt', content: 'A plain text note' },
      ],
    })) as { ok: boolean; ingested: number; errors: string[] };

    expect(result.ok).toBe(true);
    expect(result.ingested).toBe(2);
    expect(result.errors).toHaveLength(0);

    // Both files should land in the memory dir.
    const memDir = path.join(tmpHome, '.ijfw', 'memory');
    const written = fs.readdirSync(memDir);
    expect(written.length).toBe(2);

    // Each file should have frontmatter.
    for (const name of written) {
      const content = fs.readFileSync(path.join(memDir, name), 'utf8');
      expect(content).toMatch(/^---/);
      expect(content).toContain('type: observation');
      expect(content).toContain('source: drag-drop');
    }
  });

  it('rejects names containing ".." (path traversal)', async () => {
    const handler = providers.get('ingestFiles')!;

    const result = (await handler({
      files: [{ name: '../etc/passwd', content: 'bad' }],
    })) as { ok: boolean; ingested: number; errors: string[] };

    expect(result.ingested).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/rejected/i);

    // Nothing should be written.
    const memDir = path.join(tmpHome, '.ijfw', 'memory');
    const written = fs.existsSync(memDir) ? fs.readdirSync(memDir) : [];
    expect(written).toHaveLength(0);
  });

  it('rejects names containing forward slashes', async () => {
    const handler = providers.get('ingestFiles')!;

    const result = (await handler({
      files: [{ name: 'sub/secret.md', content: 'bad' }],
    })) as { ok: boolean; ingested: number; errors: string[] };

    expect(result.ingested).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns ok:false for invalid args', async () => {
    const handler = providers.get('ingestFiles')!;

    const result = (await handler({ files: [] })) as { ok: boolean; ingested: number; errors: string[] };
    expect(result.ok).toBe(false);
  });

  it('preserves existing frontmatter in .md files', async () => {
    const handler = providers.get('ingestFiles')!;
    const mdWithFrontmatter = '---\ntype: decision\n---\nKeep this.';

    const result = (await handler({
      files: [{ name: 'existing.md', content: mdWithFrontmatter }],
    })) as { ok: boolean; ingested: number; errors: string[] };

    expect(result.ingested).toBe(1);

    const memDir = path.join(tmpHome, '.ijfw', 'memory');
    const written = fs.readdirSync(memDir);
    expect(written).toHaveLength(1);

    const content = fs.readFileSync(path.join(memDir, written[0]!), 'utf8');
    // Should be the original content unchanged.
    expect(content).toBe(mdWithFrontmatter);
  });
});
