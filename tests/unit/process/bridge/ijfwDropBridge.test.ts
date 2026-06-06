/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for `ijfwDropBridge` - drop-tab IPC providers. All file-safety
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

let originalCwd: string;
let tmpCwd: string;

beforeEach(() => {
  // Use realpath so macOS `/var/folders` (a symlink to `/private/var/folders`)
  // doesn't break the cwd-containment check inside the bridge.
  tmpHome = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-drop-test-')));
  // Checkpoint B B3: dump lives under `.ijfw/dump` (dot-prefix), not `ijfw/dump`.
  tmpDump = path.join(tmpHome, '.ijfw', 'dump');
  fs.mkdirSync(tmpDump, { recursive: true });
  // Checkpoint B H2: trusted root narrowed to process.cwd(). The tests chdir
  // into a project-shaped tmp dir so source files written via writeSource
  // sit under cwd and pass the containment check.
  originalCwd = process.cwd();
  tmpCwd = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-drop-cwd-')));
  process.chdir(tmpCwd);
  providers.clear();
  initIjfwDropBridge();
});

afterEach(() => {
  // A test that mocks process.cwd() and throws before restoring it can leave the
  // mock active; guard the restore-chdir so one failure cannot cascade into
  // unrelated teardown ENOENTs (e.g. chdir to a POSIX '/etc' on Windows).
  try {
    process.chdir(originalCwd);
  } catch {
    /* originalCwd may be stale/invalid under a leaked cwd mock; ignore */
  }
  fs.rmSync(tmpHome, { recursive: true, force: true });
  fs.rmSync(tmpCwd, { recursive: true, force: true });
});

function writeSource(name: string, body: string): string {
  // Sources land under cwd (the trusted root) so they pass H2 containment.
  const p = path.join(tmpCwd, name);
  fs.writeFileSync(p, body);
  return p;
}

describe('ijfwDropBridge', () => {
  it('registers all three providers', () => {
    expect(providers.has('dropList')).toBe(true);
    expect(providers.has('dropIngest')).toBe(true);
    expect(providers.has('dropQuarantine')).toBe(true);
  });

  it('Checkpoint B B3: dump dir lands under ~/.ijfw/dump (dot-prefix), not ~/ijfw/dump', async () => {
    // Regression for the B3 BLOCKER: a missing dot meant ingested files
    // landed in `~/ijfw/dump` and the real IJFW MCP server never saw them.
    const src = writeSource('regression.md', '# B3');
    const handler = providers.get('dropIngest')!;
    const result = (await handler({ path: src })) as { ok: boolean; name?: string };
    expect(result.ok).toBe(true);
    expect(fs.existsSync(path.join(tmpHome, '.ijfw', 'dump', 'regression.md'))).toBe(true);
    // And explicitly NOT under the wrong location.
    expect(fs.existsSync(path.join(tmpHome, 'ijfw', 'dump', 'regression.md'))).toBe(false);
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
      const linkPath = path.join(tmpCwd, 'link.md');
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
      const huge = path.join(tmpCwd, 'huge.json');
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

    it('Checkpoint B H2: rejects file under $HOME that is not under cwd', async () => {
      // Pre-H2 this would have been accepted (HOME was a trusted root). The
      // narrowed policy must reject it. We use the mocked-home tmpHome.
      const homeFile = path.join(tmpHome, 'secret.md');
      fs.writeFileSync(homeFile, 'sensitive');
      const handler = providers.get('dropIngest')!;
      const result = (await handler({ path: homeFile })) as {
        ok: boolean;
        errorReason?: string;
        error?: string;
      };
      expect(result.ok).toBe(false);
      expect(result.errorReason).toBe('validation_failed');
      expect(result.error).toMatch(/outside trusted roots/);
    });

    it('rejects nonexistent file', async () => {
      const handler = providers.get('dropIngest')!;
      const result = (await handler({ path: path.join(tmpCwd, 'missing.md') })) as {
        ok: boolean;
        errorReason?: string;
      };
      expect(result.ok).toBe(false);
    });

    it('Gemini B3: refuses ingest with errorReason=unavailable when cwd is "/"', async () => {
      // Regression for the B3 BLOCKER. On macOS GUI Dock launch, cwd is `/`,
      // which made path.relative('/', '/Users/x/.aws/credentials') return
      // 'Users/x/.aws/credentials' (no `..`), passing the containment check
      // and letting ANY file on disk be ingested. The new policy must refuse
      // the entire ingest call when no safe project root is available.
      try {
        process.chdir('/');
      } catch {
        // chdir('/') may be denied in some test sandboxes; fall back to mocking.
        vi.spyOn(process, 'cwd').mockReturnValue('/');
      }
      const handler = providers.get('dropIngest')!;
      const result = (await handler({ path: '/Users/x/.aws/credentials' })) as {
        ok: boolean;
        errorReason?: string;
        error?: string;
      };
      expect(result.ok).toBe(false);
      expect(result.errorReason).toBe('unavailable');
      // Restore cwd for subsequent tests in this file (afterEach also restores).
      try {
        process.chdir(tmpCwd);
      } catch {
        /* ignore */
      }
      vi.restoreAllMocks();
    });

    it('Gemini B3: refuses ingest with errorReason=unavailable when cwd is a system path', async () => {
      // Use a platform-appropriate system root so isUnsafeRoot() flags it on the
      // host actually running the test: '/etc' is a system dir on POSIX, while
      // C:\Windows\System32 is the equivalent on Windows (a POSIX path is not a
      // Windows system root, so it would be refused via a different code path).
      const sysCwd = process.platform === 'win32' ? 'C:\\Windows\\System32' : '/etc';
      const sysFile = process.platform === 'win32' ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' : '/etc/hosts';
      const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(sysCwd);
      try {
        const handler = providers.get('dropIngest')!;
        const result = (await handler({ path: sysFile })) as {
          ok: boolean;
          errorReason?: string;
        };
        expect(result.ok).toBe(false);
        expect(result.errorReason).toBe('unavailable');
      } finally {
        cwdSpy.mockRestore();
      }
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
