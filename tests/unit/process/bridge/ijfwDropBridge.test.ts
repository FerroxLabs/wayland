/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for `ijfwDropBridge` — drop-tab IPC providers. All file-safety
 * decisions (extension allowlist, size cap, symlink reject, path
 * containment, count cap) live in main and are exercised here.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

let tmpHome: string;
let tmpDump: string;

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => tmpHome };
});

vi.mock('electron', () => ({
  app: { getPath: (key: string) => `/tmp/wayland-test-${key}` },
}));

type Provider<T, U> = (handler: (args: U) => Promise<T>) => void;
const providers = new Map<string, (args: unknown) => Promise<unknown>>();

vi.mock('@/common', () => ({
  ipcBridge: {
    ijfw: {
      dropList: {
        provider: ((handler) => {
          providers.set('dropList', handler as (args: unknown) => Promise<unknown>);
        }) as Provider<unknown, unknown>,
      },
      dropIngest: {
        provider: ((handler) => {
          providers.set('dropIngest', handler as (args: unknown) => Promise<unknown>);
        }) as Provider<unknown, unknown>,
      },
      dropQuarantine: {
        provider: ((handler) => {
          providers.set('dropQuarantine', handler as (args: unknown) => Promise<unknown>);
        }) as Provider<unknown, unknown>,
      },
    },
  },
}));

// eslint-disable-next-line import/first
import { initIjfwDropBridge } from '@process/bridge/ijfwDropBridge';

beforeEach(() => {
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-drop-test-'));
  tmpDump = path.join(tmpHome, 'ijfw', 'dump');
  fs.mkdirSync(tmpDump, { recursive: true });
  providers.clear();
  initIjfwDropBridge();
});

afterEach(() => {
  fs.rmSync(tmpHome, { recursive: true, force: true });
});

function writeSource(name: string, body: string): string {
  const p = path.join(tmpHome, name);
  fs.writeFileSync(p, body);
  return p;
}

describe('ijfwDropBridge', () => {
  it('registers all three providers', () => {
    expect(providers.has('dropList')).toBe(true);
    expect(providers.has('dropIngest')).toBe(true);
    expect(providers.has('dropQuarantine')).toBe(true);
  });

  describe('dropList', () => {
    it('returns empty when dump dir is empty', async () => {
      const handler = providers.get('dropList')!;
      const result = (await handler(undefined)) as { files: unknown[] };
      expect(result.files).toEqual([]);
    });

    it('lists files in dump dir, skips dot-prefixed', async () => {
      fs.writeFileSync(path.join(tmpDump, 'a.md'), 'hello');
      fs.writeFileSync(path.join(tmpDump, '.hidden'), 'x');
      const handler = providers.get('dropList')!;
      const result = (await handler(undefined)) as { files: Array<{ name: string }> };
      expect(result.files.map((f) => f.name)).toEqual(['a.md']);
    });
  });

  describe('dropIngest', () => {
    it('ingests an allowed .md file', async () => {
      const src = writeSource('note.md', '# hi');
      const handler = providers.get('dropIngest')!;
      const result = (await handler({ path: src })) as { ok: boolean; name?: string };
      expect(result.ok).toBe(true);
      expect(result.name).toBe('note.md');
      expect(fs.existsSync(path.join(tmpDump, 'note.md'))).toBe(true);
    });

    it('rejects extensions outside the allowlist', async () => {
      const src = writeSource('binary.exe', 'mz...');
      const handler = providers.get('dropIngest')!;
      const result = (await handler({ path: src })) as {
        ok: boolean;
        errorReason?: string;
      };
      expect(result.ok).toBe(false);
      expect(result.errorReason).toBe('validation_failed');
    });

    it('rejects symlinks', async () => {
      const real = writeSource('real.md', 'hi');
      const linkPath = path.join(tmpHome, 'link.md');
      fs.symlinkSync(real, linkPath);
      const handler = providers.get('dropIngest')!;
      const result = (await handler({ path: linkPath })) as {
        ok: boolean;
        errorReason?: string;
      };
      expect(result.ok).toBe(false);
      expect(result.errorReason).toBe('validation_failed');
    });

    it('rejects files larger than 50MB', async () => {
      const huge = path.join(tmpHome, 'huge.json');
      // Pretend the file is too large by writing a smaller file, then mocking
      // via stat… easier: write a 51MB sparse file via truncate.
      const fd = fs.openSync(huge, 'w');
      fs.ftruncateSync(fd, 51 * 1024 * 1024);
      fs.closeSync(fd);
      const handler = providers.get('dropIngest')!;
      const result = (await handler({ path: huge })) as {
        ok: boolean;
        errorReason?: string;
      };
      expect(result.ok).toBe(false);
      expect(result.errorReason).toBe('validation_failed');
    });

    it('rejects when queue is already at the 20-file cap', async () => {
      for (let i = 0; i < 20; i++) fs.writeFileSync(path.join(tmpDump, `f${i}.md`), '');
      const src = writeSource('overflow.md', 'x');
      const handler = providers.get('dropIngest')!;
      const result = (await handler({ path: src })) as {
        ok: boolean;
        errorReason?: string;
      };
      expect(result.ok).toBe(false);
      expect(result.errorReason).toBe('validation_failed');
    });

    it('rejects path outside home / active project dirs (e.g. /etc/passwd)', async () => {
      const handler = providers.get('dropIngest')!;
      const result = (await handler({ path: '/etc/passwd' })) as {
        ok: boolean;
        errorReason?: string;
      };
      expect(result.ok).toBe(false);
      expect(result.errorReason).toBe('validation_failed');
    });

    it('rejects nonexistent file', async () => {
      const handler = providers.get('dropIngest')!;
      const result = (await handler({ path: path.join(tmpHome, 'missing.md') })) as {
        ok: boolean;
        errorReason?: string;
      };
      expect(result.ok).toBe(false);
    });
  });

  describe('dropQuarantine', () => {
    it('moves a named file into the quarantine dir', async () => {
      fs.writeFileSync(path.join(tmpDump, 'bad.md'), 'data');
      const handler = providers.get('dropQuarantine')!;
      const result = (await handler({ name: 'bad.md' })) as { ok: boolean };
      expect(result.ok).toBe(true);
      expect(fs.existsSync(path.join(tmpDump, 'bad.md'))).toBe(false);
      const quarantineDir = path.join(tmpDump, '.quarantine');
      expect(fs.existsSync(quarantineDir)).toBe(true);
      const entries = fs.readdirSync(quarantineDir);
      expect(entries.length).toBe(1);
      expect(entries[0]).toMatch(/bad\.md$/);
    });

    it('rejects names with path separators (no traversal)', async () => {
      const handler = providers.get('dropQuarantine')!;
      const result = (await handler({ name: '../../etc/passwd' })) as {
        ok: boolean;
        error?: string;
      };
      expect(result.ok).toBe(false);
    });

    it('rejects when the named file does not exist', async () => {
      const handler = providers.get('dropQuarantine')!;
      const result = (await handler({ name: 'ghost.md' })) as { ok: boolean };
      expect(result.ok).toBe(false);
    });
  });
});
